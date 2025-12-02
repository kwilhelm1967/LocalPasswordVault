/**
 * Hardware Fingerprint Utility
 * 
 * Single source of truth for generating device fingerprints.
 * Used by both license validation and trial verification.
 */

/**
 * Generate a SHA-256 hardware fingerprint based on browser/device characteristics
 * @returns Promise<string> - Hex-encoded SHA-256 hash
 */
export async function generateHardwareFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen and display info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(screen.pixelDepth.toString());

  // System info
  components.push(navigator.platform);
  components.push(navigator.language);
  components.push(navigator.hardwareConcurrency?.toString() || "unknown");
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Browser and engine info
  components.push(navigator.userAgent.slice(0, 100));
  components.push(navigator.vendor || "unknown");

  // WebGL fingerprinting
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext;
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
      components.push(gl.getParameter(gl.VERSION));
    }
  } catch {
    components.push("webgl_unavailable");
  }

  // Generate hash from components
  const fingerprint = components.join("|");

  // Create SHA-256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

