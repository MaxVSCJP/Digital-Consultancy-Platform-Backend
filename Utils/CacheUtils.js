import redisClient from "../Config/RedisClient.js";

// Configurable TTL in seconds; defaults to 60s for short-lived caches
const DEFAULT_TTL = parseInt(process.env.CONTENT_CACHE_TTL || "60", 10);

/**
 * Get a value from Redis cache and JSON.parse it.
 * Returns null on miss or parse error.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  } catch (err) {
    // Non-fatal: log and continue without cache
    console.error("Redis get error:", err.message);
    return null;
  }
}

/**
 * Set a JSON-serializable value in Redis with TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 */
export async function setCache(key, value, ttlSeconds = DEFAULT_TTL) {
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.setEx(key, ttlSeconds, payload);
    } else {
      await redisClient.set(key, payload);
    }
  } catch (err) {
    console.error("Redis set error:", err.message);
  }
}

/**
 * Invalidate multiple Redis cache keys.
 * Safe to call with an empty array.
 * @param {string[]} keys
 */
export async function invalidateRedisCache(keys = []) {
  try {
    if (!Array.isArray(keys) || keys.length === 0) return;
    await redisClient.del(keys);
  } catch (err) {
    console.error("Redis delete error:", err.message);
  }
}

/**
 * Invalidate Redis keys by prefix using SCAN iterator.
 * Useful for busting paginated caches like content:list:admin:*.
 * @param {string[]} prefixes
 */
export async function invalidateRedisByPrefix(prefixes = []) {
  try {
    if (!Array.isArray(prefixes) || prefixes.length === 0) return;
    const toDelete = [];
    for (const prefix of prefixes) {
      const pattern = prefix.endsWith("*") ? prefix : `${prefix}*`;
      for await (const key of redisClient.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        toDelete.push(key);
      }
    }
    const flatToDelete = toDelete.flat(Infinity);
    console.log("Invalidating Redis keys:", flatToDelete);
    if (flatToDelete.length) await redisClient.del(flatToDelete);
  } catch (err) {
    console.error("Redis prefix delete error:", err.message);
  }
}

/**
 * Get the version number for a cache key.
 * Used to implement coarse cache invalidation.
 */
export async function getVersion(key) {
  const versionKey = `${key}:version`;
  const version = await redisClient.get(versionKey);
  return version || "1";
}

/** Increment the version number for a cache key.
 * Used to implement coarse cache invalidation.
 */
export async function incrementVersion(key) {
  const versionKey = `${key}:version`;
  await redisClient.incr(versionKey);
}

/**
 * Build a standard cache key for content queries.
 * Keeps key naming consistent across controllers.
 * @param {string} parts
 */
export function cacheKey(...parts) {
  return [...parts].join(":");
}

export default {
  getCache,
  setCache,
  invalidateRedisCache,
  invalidateRedisByPrefix,
  cacheKey,
};
