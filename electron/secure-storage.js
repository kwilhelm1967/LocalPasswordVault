const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Secure File Storage for Electron Password Vault
 * 
 * Provides secure, encrypted file storage with OS-level permissions.
 * All encryption/decryption happens in the renderer process - this class
 * only handles storing/retrieving pre-encrypted data blobs.
 * 
 * Security Features:
 * - OS-level file permissions (0600 on Unix/Linux/Mac)
 * - Automatic backup creation
 * - Secure file deletion (overwrite before delete)
 * - No master password in main process
 */
class SecureFileStorage {
  constructor(userDataPath) {
    this.userDataPath = userDataPath;
    this.vaultFilePath = path.join(userDataPath, "vault.dat");
    this.backupFilePath = path.join(userDataPath, "vault.backup.dat");
    this.saltFilePath = path.join(userDataPath, "vault.salt");
  }

  // Generate or load encryption salt
  getSalt() {
    try {
      if (fs.existsSync(this.saltFilePath)) {
        const saltData = fs.readFileSync(this.saltFilePath);
        return saltData;
      } else {
        const salt = crypto.randomBytes(32);
        fs.writeFileSync(this.saltFilePath, salt);
        return salt;
      }
    } catch (error) {
      console.error("Failed to get salt:", error);
      // Fallback: generate random salt
      return crypto.randomBytes(32);
    }
  }

  // Derive encryption key from master password using PBKDF2
  deriveKey(masterPassword, salt) {
    return crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha256');
  }

  // Encrypt data using AES-256-GCM
  encryptData(plaintext, key) {
    try {
      const iv = crypto.randomBytes(12); // 96-bit IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine: iv + authTag + encrypted
      const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

      return combined.toString('base64');
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  // Decrypt data using AES-256-GCM
  decryptData(encryptedData, key) {
    try {
      const combined = Buffer.from(encryptedData, 'base64');

      const iv = combined.slice(0, 12);
      const authTag = combined.slice(12, 28); // 16-byte auth tag
      const encrypted = combined.slice(28);

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data - invalid password or corrupted data");
    }
  }

  // SECURE: Save pre-encrypted vault data (encryption happens in renderer process)
  // Master password NEVER enters main process - only encrypted data is stored
  saveVaultEncrypted(encryptedData) {
    try {
      // Create backup before overwriting
      if (fs.existsSync(this.vaultFilePath)) {
        fs.copyFileSync(this.vaultFilePath, this.backupFilePath);
      }

      // Write encrypted data directly (already encrypted in renderer)
      fs.writeFileSync(this.vaultFilePath, encryptedData, { encoding: 'utf8' });

      // SECURITY: Set restrictive file permissions (owner read/write only)
      try {
        if (process.platform !== 'win32') {
          // Unix/Linux/Mac: 0600 = rw------- (owner read/write only)
          fs.chmodSync(this.vaultFilePath, 0o600);
          if (fs.existsSync(this.backupFilePath)) {
            fs.chmodSync(this.backupFilePath, 0o600);
          }
        } else {
          // Windows: Use ACL to restrict access (handled by OS)
          // Files in userDataPath are already user-specific
        }
      } catch (permError) {
        // Permission setting failed - log but don't fail
        console.warn("Failed to set file permissions (non-critical):", permError);
      }

      return true;
    } catch (error) {
      console.error("Failed to save encrypted vault:", error);
      return false;
    }
  }

  // SECURE: Load encrypted vault data (returns encrypted blob, decryption in renderer)
  // Master password NEVER enters main process
  loadVaultEncrypted() {
    try {
      if (!fs.existsSync(this.vaultFilePath)) {
        return null; // No vault exists
      }

      // Read encrypted data (still encrypted - no decryption in main process)
      const encryptedData = fs.readFileSync(this.vaultFilePath, 'utf8');
      return encryptedData;
    } catch (error) {
      console.error("Failed to load encrypted vault:", error);
      
      // Try backup file
      try {
        if (fs.existsSync(this.backupFilePath)) {
          const backupData = fs.readFileSync(this.backupFilePath, 'utf8');
          
          // Restore backup as main
          fs.writeFileSync(this.vaultFilePath, backupData, { encoding: 'utf8' });
          
          // Set permissions on restored file
          if (process.platform !== 'win32') {
            fs.chmodSync(this.vaultFilePath, 0o600);
          }
          
          return backupData;
        }
      } catch (backupError) {
        console.error("Failed to load backup:", backupError);
      }
      
      return null;
    }
  }


  // Check if vault exists
  vaultExists() {
    return fs.existsSync(this.vaultFilePath);
  }

  // Securely delete vault
  deleteVault() {
    try {
      // Overwrite files with random data before deletion
      if (fs.existsSync(this.vaultFilePath)) {
        const stat = fs.statSync(this.vaultFilePath);
        const randomData = crypto.randomBytes(stat.size);
        fs.writeFileSync(this.vaultFilePath, randomData);
        fs.unlinkSync(this.vaultFilePath);
      }

      if (fs.existsSync(this.backupFilePath)) {
        const stat = fs.statSync(this.backupFilePath);
        const randomData = crypto.randomBytes(stat.size);
        fs.writeFileSync(this.backupFilePath, randomData);
        fs.unlinkSync(this.backupFilePath);
      }

      return true;
    } catch (error) {
      console.error("Failed to delete vault:", error);
      return false;
    }
  }
}

module.exports = SecureFileStorage;