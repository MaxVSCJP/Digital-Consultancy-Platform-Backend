import { origin } from "../Config/ProDevConfig.js";

// Cloudflare config via env vars to avoid hardcoding
const CF_API_TOKEN = process.env.CF_API_TOKEN; // API Token with Zone.Cache Purge permissions
const CF_ZONE_ID = process.env.CF_ZONE_ID; // Cloudflare Zone ID

/**
 * Invalidate Cloudflare cache for a list of paths.
 * Paths should be absolute paths (e.g., /Uploads/Images/abc.webp).
 * We prefix with the configured origin so Cloudflare purges by URL.
 * No-op if credentials are missing.
 * @param {string[]} paths
 */
export async function invalidateCloudflareCache(paths = []) {
  if (!Array.isArray(paths) || paths.length === 0) return;
  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    console.warn("Cloudflare credentials missing; skipping cache purge.");
    return;
  }

  // Normalize and prefix with origin
  const files = paths
    .filter(Boolean)
    .map((p) =>
      p.startsWith("http") ? p : `${origin}${p.startsWith("/") ? "" : "/"}${p}`
    );

  try {
    if (typeof fetch !== "function") {
      console.warn("Global fetch not available; skipping Cloudflare purge.");
      return;
    }
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
        body: JSON.stringify({ files }),
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.error("Cloudflare purge failed:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Cloudflare purge error:", err.message);
  }
}

export default { invalidateCloudflareCache };
