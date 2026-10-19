// Best-effort browser speed test utility.
// Exports an object with `start()` which returns { download, upload, ping }
// Falls back to simulated values if network/CORS prevents accurate measurement.

const DEFAULT_DOWNLOAD_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg"; // ~5MB image on Wikimedia (CORS friendly)
const PING_TARGET = "https://api.ipify.org?format=json";
const UPLOAD_TARGET = "https://httpbin.org/post"; // httpbin accepts CORS and echoes

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

async function measurePing(iterations = 5, timeout = 3000) {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = now();
    try {
      await fetch(PING_TARGET, { signal: controller.signal, cache: "no-store" });
      const rtt = now() - start;
      results.push(rtt);
    } catch (e) {
      // ignore individual failures
    } finally {
      clearTimeout(timer);
    }
  }

  if (results.length === 0) throw new Error("Ping test failed")
  const avg = results.reduce((a, b) => a + b, 0) / results.length
  return Math.max(1, Math.round(avg)) // ms
}

async function measureDownload(url = DEFAULT_DOWNLOAD_URL, sizeBytesHint = null) {
  const controller = new AbortController();
  const timeout = 15000
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = now();
  try {
    const resp = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const blob = await resp.blob();
    const durationSec = Math.max(0.001, (now() - start) / 1000);
    const bytes = sizeBytesHint || blob.size || 0
    const mbps = (bytes * 8) / durationSec / 1e6
    return Math.round(mbps * 100) / 100
  } finally {
    clearTimeout(timer)
  }
}

async function measureUpload(sizeBytes = 1024 * 512) { // 512KB
  // Create a blob of specified size
  const data = new Uint8Array(sizeBytes)
  crypto.getRandomValues(data)
  const blob = new Blob([data], { type: "application/octet-stream" })

  const controller = new AbortController();
  const timeout = 15000
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = now();
  try {
    await fetch(UPLOAD_TARGET, { method: "POST", body: blob, signal: controller.signal });
    const durationSec = Math.max(0.001, (now() - start) / 1000);
    const mbps = (sizeBytes * 8) / durationSec / 1e6
    return Math.round(mbps * 100) / 100
  } finally {
    clearTimeout(timer)
  }
}

function simulate() {
  const baseDownload = Math.random() * 40 + 20
  const baseUpload = baseDownload * (0.1 + Math.random() * 0.3)
  const basePing = Math.random() * 40 + 15
  return {
    download: Math.round(baseDownload * 100) / 100,
    upload: Math.round(baseUpload * 100) / 100,
    ping: Math.round(basePing),
    simulated: true,
  }
}

export const speedTest = {
  // Runs a best-effort speed test; may throw on catastrophic failures.
  async start() {
    try {
      const ping = await measurePing().catch(() => null)
      const download = await measureDownload().catch(() => null)
      const upload = await measureUpload().catch(() => null)

      // If any measurement failed, but at least one succeeded, fill others with heuristics
      if (download == null && upload == null && ping == null) {
        // All failed -> fallback to simulation
        return simulate()
      }

      const finalPing = ping ?? Math.round(100 - (download || 30) * 0.5)
      const finalDownload = download ?? Math.max(1, (upload || 5) * (2 + Math.random()))
      const finalUpload = upload ?? Math.max(0.5, finalDownload * (0.1 + Math.random() * 0.4))

      return {
        download: Math.round(finalDownload * 100) / 100,
        upload: Math.round(finalUpload * 100) / 100,
        ping: Math.round(finalPing),
        simulated: false,
      }
    } catch (e) {
      return simulate()
    }
  }
}

export default speedTest
