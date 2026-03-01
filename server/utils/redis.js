import { createClient } from "redis";

let redisClient = null;
let isConnected = false;

const initRedis = async () => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    // Use Redis URL from environment or default to local Redis
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl === "disabled") {
      console.log("⚠️  Redis disabled by REDIS_URL=disabled in environment");
      return null;
    }
    const finalUrl = redisUrl || "redis://localhost:6379";

    redisClient = createClient({
      url: finalUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log("❌ Redis: Max reconnection attempts reached");
            return new Error("Max reconnection attempts reached");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("🔄 Redis: Connecting...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis: Connected and ready");
      isConnected = true;
    });

    redisClient.on("reconnecting", () => {
      console.log("🔄 Redis: Reconnecting...");
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("❌ Redis initialization failed:", error.message);
    console.log("⚠️  Continuing without Redis cache");
    redisClient = null;
    isConnected = false;
    return null;
  }
};

// Cache helper functions
export const getCache = async (key) => {
  if (!redisClient || !isConnected) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("❌ Redis GET error for key:", key, "Error:", error.message);
    return null;
  }
};

export const setCache = async (key, value, expirationInSeconds = 300) => {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("❌ Redis SET error for key:", key, "Error:", error.message);
    return false;
  }
};

export const deleteCache = async (key) => {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("❌ Redis DELETE error for key:", key, "Error:", error.message);
    return false;
  }
};

export const deleteCachePattern = async (pattern) => {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(
      "❌ Redis DELETE PATTERN error for pattern:",
      pattern,
      "Error:",
      error.message
    );
    return false;
  }
};

export const isRedisConnected = () => isConnected;

export default initRedis;
