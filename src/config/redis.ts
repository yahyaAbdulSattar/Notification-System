import Redis from "ioredis";
import { config } from "./env.js";

export const redis = new Redis(config.redisUrl);

redis.on("connect", () => {
  console.log("[redis] connected");
});

redis.on("error", (err: any) => {
  console.error("[redis] error:", err);
});
