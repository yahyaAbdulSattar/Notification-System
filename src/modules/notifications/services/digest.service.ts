import { prisma } from "../../../config/prisma.js";
import { redis } from "../../../config/redis.js";
import { inc } from "../../../metrics/metrics.js";

export async function flushAllBatches() {
  const keys = await redis.keys("batch:*");
  if (keys.length === 0) {
    console.log("[digest.worker] no batches found");
    return;
  }

  console.log(`[digest.worker] found ${keys.length} batch(es) to flush`);

  for (const key of keys) {
    try {
      await flushBatch(key);
    } catch (err) {
      console.error(`[digest.worker] failed to flush ${key}:`, err);
    }
  }
}

export async function flushBatch(key: string) {
  const items = await redis.lrange(key, 0, -1);
  if (!items.length) {
    await redis.del(key);
    return;
  }

  const userId = key.split(":")[1];
  const parsed = items.map((i) => JSON.parse(i));
  const count = parsed.length;

  // assume all notifications in batch share same user preference
  const preference = parsed[0].preference ?? { channel: "email", mode: "digest" };

  console.log(`[digest.worker] flushing batch for user:${userId} (${count} notifications)`);

  // simulate aggregated delivery
  if (preference.channel === "push" || preference.channel === "both") {
    console.log(`[BATCH_DELIVERED push] user=${userId} count=${count}`);
  }

  if (preference.channel === "email" || preference.channel === "both") {
    console.log(`[BATCH_DELIVERED email] user=${userId} count=${count}`);
  }

  inc("digest_flushed_total", 1);
  inc("digest_notifications_total", parsed.length);

  // persist audit info for each notification
  for (const notif of parsed) {
    try {
      await prisma.notificationAttempt.create({
        data: {
          notificationId: notif.id,
          attemptNumber: 1,
          result: "digest_sent",
        },
      });

      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          attemptsCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    } catch (err) {
      console.error(`[digest.worker] failed to persist digest record for notif:${notif.id}`, err);
    }
  }

  await redis.del(key);
}
