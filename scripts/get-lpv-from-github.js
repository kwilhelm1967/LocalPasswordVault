/**
 * Build LPV website zip FROM GITHUB only (no local LPV files).
 * Usage: node scripts/get-lpv-from-github.js [tagOrCommit]
 * Example: node scripts/get-lpv-from-github.js V1.2.0
 * Output: zip in Local Password Vault folder, e.g. lpv-website-from-GitHub-V1.2.0.zip
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const tagOrCommit = process.argv[2] || 'main';
const repo = 'kwilhelm1967/LocalPasswordVault';
const zipballUrl = `https://github.com/${repo}/zipball/${tagOrCommit}`;
const projectRoot = path.join(__dirname, '..');
const outZipName = `lpv-website-from-GitHub-${tagOrCommit}.zip`;
const outZipPath = path.join(projectRoot, outZipName);
const tempDir = path.join(os.tmpdir(), 'lpv_github_' + Date.now());
const sourceZipPath = path.join(os.tmpdir(), 'lpv_source_' + Date.now() + '.zip');

function rimraf(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((f) => {
      const p = path.join(dir, f);
      if (fs.lstatSync(p).isDirectory()) rimraf(p);
      else fs.unlinkSync(p);
    });
    fs.rmdirSync(dir);
  }
}

function download(url) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(sourceZipPath);
    https.get(url, { headers: { 'User-Agent': 'Node' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(sourceZipPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { file.close(); fs.unlinkSync(sourceZipPath); reject(err); });
  });
}

function extractZip(zipPath, destDir) {
  let unzipper;
  try {
    unzipper = require('unzipper');
  } catch (_) {
    const scriptPath = path.join(os.tmpdir(), 'lpv_extract_' + Date.now() + '.ps1');
    fs.writeFileSync(scriptPath, `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force\n`, 'utf8');
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: 'inherit' });
    fs.unlinkSync(scriptPath);
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: destDir }))
      .on('close', resolve)
      .on('error', reject);
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach((e) => {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

async function main() {
  console.log('\n  LPV site from GitHub only (tag/commit: ' + tagOrCommit + ')\n');
  try {
    console.log('[1/5] Downloading from GitHub...');
    await download(zipballUrl);

    console.log('[2/5] Extracting...');
    fs.mkdirSync(tempDir, { recursive: true });
    await extractZip(sourceZipPath, tempDir);

    const rootFolder = fs.readdirSync(tempDir, { withFileTypes: true }).find((e) => e.isDirectory());
    if (!rootFolder) throw new Error('Unexpected zip structure');
    const lpvInZip = path.join(tempDir, rootFolder.name, 'LPV');
    if (!fs.existsSync(lpvInZip)) throw new Error('LPV folder not found in this ref');

    const buildDir = path.join(os.tmpdir(), 'lpv_build_' + Date.now());
    rimraf(buildDir);
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('[3/5] Building zip contents...');
    copyDir(lpvInZip, buildDir);
    fs.writeFileSync(path.join(buildDir, '.htaccess'), '# localpasswordvault.com\nDirectoryIndex index.html', 'ascii');

    console.log('[4/5] Creating zip in project folder...');
    const archiver = require('archiver');
    const out = fs.createWriteStream(outZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(out);
    archive.directory(buildDir, false);
    await archive.finalize();
    await new Promise((res, rej) => { out.on('finish', res); out.on('error', rej); });

    const idxPath = path.join(buildDir, 'index.html');
    if (fs.existsSync(idxPath)) {
      const html = fs.readFileSync(idxPath, 'utf8');
      const m = html.match(/<title>([^<]+)<\/title>/);
      if (m) console.log('[5/5] Verify: ' + m[1]);
    }

    rimraf(tempDir);
    rimraf(buildDir);
    fs.unlinkSync(sourceZipPath);

    console.log('\n  Done. Zip is here:\n  ' + outZipPath + '\n');
  } catch (err) {
    rimraf(tempDir);
    if (fs.existsSync(sourceZipPath)) fs.unlinkSync(sourceZipPath);
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

main();
