import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
console.log("Connecting to:", process.env.REDIS_URL);

redis.on("connect", () => console.log("[redis] connected"));
redis.on("error", (err: any) => console.error("[redis] error:", err));

