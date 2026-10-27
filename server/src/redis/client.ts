import Redis from "ioredis";
import { config } from "../config";

/**
 * Resilient In-Memory Fallback for Redis operations
 * Used when Redis server is unreachable in development or sandbox.
 */
class MemoryRedisFallback {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();
  private hashes: Map<string, Map<string, string>> = new Map();

  private isExpired(entry?: { value: string; expiresAt?: number }): boolean {
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<"OK"> {
    let expiresAt: number | undefined;

    for (let i = 0; i < args.length; i++) {
      const arg = String(args[i]).toUpperCase();
      if (arg === "EX" && args[i + 1]) {
        expiresAt = Date.now() + Number(args[i + 1]) * 1000;
        i++;
      } else if (arg === "PX" && args[i + 1]) {
        expiresAt = Date.now() + Number(args[i + 1]);
        i++;
      }
    }

    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = await this.get(key);
    const num = (current ? parseInt(current, 10) : 0) + increment;
    const entry = this.store.get(key);
    this.store.set(key, { value: num.toString(), expiresAt: entry?.expiresAt });
    return num;
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return this.incrby(key, -decrement);
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      return 0;
    }
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return -2;
    if (!entry.expiresAt) return -1;
    return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
      this.hashes.delete(key);
    }
    return count;
  }

  async hset(key: string, ...args: (string | number)[]): Promise<number> {
    let hash = this.hashes.get(key);
    if (!hash) {
      hash = new Map();
      this.hashes.set(key, hash);
    }

    let added = 0;
    // Format: key, field, value, field, value... OR object
    if (args.length === 1 && typeof args[0] === "object") {
      const obj = args[0] as Record<string, unknown>;
      for (const [k, v] of Object.entries(obj)) {
        hash.set(k, String(v));
        added++;
      }
    } else {
      for (let i = 0; i < args.length; i += 2) {
        if (args[i] !== undefined && args[i + 1] !== undefined) {
          hash.set(String(args[i]), String(args[i + 1]));
          added++;
        }
      }
    }
    return added;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashes.get(key);
    return hash?.get(field) || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const result: Record<string, string> = {};
    for (const [k, v] of hash.entries()) {
      result[k] = v;
    }
    return result;
  }

  async ping(): Promise<string> {
    return "PONG (in-memory)";
  }
}

let redisInstance: Redis | null = null;
let isConnected = false;
const memoryFallback = new MemoryRedisFallback();

export function initRedis(): { client: Redis | MemoryRedisFallback; isRealRedis: boolean } {
  if (redisInstance && isConnected) {
    return { client: redisInstance, isRealRedis: true };
  }

  try {
    const client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 2) {
          return null; // Stop retrying, switch to fallback
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: false,
    });

    client.on("connect", () => {
      isConnected = true;
      console.log(`[Redis] Connected successfully to ${config.redisUrl}`);
    });

    client.on("error", (err) => {
      isConnected = false;
      // Silently fall back without crashing server
      if (process.env.DEBUG_REDIS) {
        console.warn(`[Redis Notice] Redis connection error (${err.message}). Using in-memory store.`);
      }
    });

    redisInstance = client;
    return { client: redisInstance, isRealRedis: isConnected };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Redis] Could not connect (${msg}). Active store: In-memory fallback.`);
    return { client: memoryFallback, isRealRedis: false };
  }
}

/**
 * Access the active Redis client (or resilient fallback)
 */
export function getRedisClient(): Redis | MemoryRedisFallback {
  if (redisInstance && isConnected) {
    return redisInstance;
  }
  return memoryFallback;
}

export function getRedisHealthStatus(): {
  status: "connected" | "fallback_in_memory";
  targetUrl: string;
  isRealRedis: boolean;
} {
  return {
    status: isConnected ? "connected" : "fallback_in_memory",
    targetUrl: config.redisUrl,
    isRealRedis: isConnected,
  };
}
