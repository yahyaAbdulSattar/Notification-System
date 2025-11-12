import { redis } from "../../../config/redis.js";


//   Token bucket throttler
//  - Each user has `tokens:{userId}`
//  - Max 3 tokens, refilled every 15s
//  - Atomic decrement to check capacity


const MAX_TOKENS = 3;
const REFILL_INTERVAL = 15; // seconds
const REFILL_AMOUNT = 3;

export async function tryConsumeToken(userId: string): Promise<{ allowed: boolean; tokensLeft: number }> {
  const key = `tokens:${userId}`;
  const now = Date.now();

  const pipeline = redis.multi();

  // Fetch current token info
  pipeline.hget(key, "tokens");
  pipeline.hget(key, "last_refill");

  const [tokensStr, lastRefillStr] = await pipeline.exec().then((res:any) => res.map((r:any) => r[1]));
  let tokens = parseInt(tokensStr || "0", 10);
  let lastRefill = parseInt(lastRefillStr || "0", 10);

  // Refill logic
  if (!lastRefill || now - lastRefill >= REFILL_INTERVAL * 1000) {
    tokens = Math.min(MAX_TOKENS, tokens + REFILL_AMOUNT);
    lastRefill = now;
    await redis.hset(key, "tokens", tokens, "last_refill", lastRefill);
    await redis.expire(key, REFILL_INTERVAL * 2);
  }

  if (tokens > 0) {
    tokens -= 1;
    await redis.hset(key, "tokens", tokens, "last_refill", lastRefill);
    await redis.expire(key, REFILL_INTERVAL * 2);
    return { allowed: true, tokensLeft: tokens };
  } else {
    return { allowed: false, tokensLeft: 0 };
  }
}


//  Force refill (for testing or reset)

export async function resetTokens(userId: string) {
  const key = `tokens:${userId}`;
  await redis.hset(key, "tokens", MAX_TOKENS, "last_refill", Date.now());
  await redis.expire(key, REFILL_INTERVAL * 2);
}
