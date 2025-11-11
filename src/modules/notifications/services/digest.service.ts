import { redis } from "../../../config/redis.js";

export async function flushAllBatches() {
  const keys = await redis.keys("batch:*");
  for (const key of keys) {
    await flushBatch(key);
  }
}

export async function flushBatch(key: string) {
  const items = await redis.lrange(key, 0, -1);
  if (!items.length) return;

  const userId = key.split(":")[1];
  const parsed = items.map((i: any) => JSON.parse(i));

  // Compose digest payload
  const digest = {
    userId,
    count: parsed.length,
    notifications: parsed.map((n: any) => ({
      taskId: n.taskId,
      eventType: n.eventType,
      priority: n.priority,
    })),
  };

  console.log(`[BATCH_DELIVERED] user=${userId} count=${digest.count}`);
  await redis.del(key);
}
