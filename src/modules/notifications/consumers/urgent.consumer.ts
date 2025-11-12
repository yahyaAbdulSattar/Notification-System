import { getRabbit } from "../../../config/rabbitmq.js";
import { redis } from "../../../config/redis.js";
import { EXCHANGE } from "../setup.js";
import { tryConsumeToken } from "../util/throttle.util.js";

// config
const QUEUE = "notifications.urgent";
const MAX_RETRIES = 3;
const RETRY_QUEUE_BY_ATTEMPT: Record<number, string> = {
  1: "notifications.retry.1", // attempt after first failure => send to retry.1
  2: "notifications.retry.2",
  3: "notifications.retry.3",
};
const RETRY_DELAY_MS = 10_000; // short requeue delay for throttled users
const BATCH_KEY_PREFIX = "batch:";
const BATCH_TTL_SECONDS = 30;

// Map of user throttle hits
const throttleHits = new Map<string, number>();

// Simulated delivery adapter that randomly fails at approx. 30% iof time
async function deliverSimulated(preference: any, payload: any) {
  // simulate transient failure ~30% of the time
  const fail = Math.random() < 0.3;

  // to simulaet 100% failure
  // const fail = true; 
  await new Promise((r) => setTimeout(r, 100)); // small latency
  if (fail) throw new Error("simulated transient delivery failure");
  // otherwise treat as success
  return true;
}

export async function startUrgentConsumer() {
  const { channel } = getRabbit();

  await channel.assertQueue(QUEUE, { durable: true });
  channel.prefetch(10);

  console.log("[urgent.worker] waiting for messages (with retry/DLQ)...");

  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    // read attempts from headers (fallback to 0)
    const currentAttempts = Number(msg.properties.headers?.attempts ?? 0);
    const data = JSON.parse(msg.content.toString());
    const { userId, taskId, preference } = data;

    try {
      const { allowed, tokensLeft } = await tryConsumeToken(userId);
      if (!allowed) {
        const hits = (throttleHits.get(userId) ?? 0) + 1;
        throttleHits.set(userId, hits);

        console.warn(`[throttle] user:${userId} blocked (tokens=0, hit=${hits})`);

        if (hits < 3) {
          // Requeue after short delay
          setTimeout(() => {
            channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(data)), {
              persistent: true,
              contentType: "application/json",
              headers: msg.properties.headers, // preserve attempts
            });
          }, RETRY_DELAY_MS);
          console.log(`[throttle] requeued after ${RETRY_DELAY_MS / 1000}s user:${userId}`);
        } else {
          // Burst-to-digest fallback (move to Redis batch buffer)
          const userKey = `${BATCH_KEY_PREFIX}${userId}`;
          await redis.rpush(userKey, JSON.stringify(data));
          await redis.expire(userKey, BATCH_TTL_SECONDS);
          console.log(`[throttle] user:${userId} moved to digest buffer`);
        }

        channel.ack(msg);
        return;
      }

      console.log(`[throttle] user:${userId} allowed (tokens left=${tokensLeft})`);

      console.log(`[urgent.worker] processing user:${userId} task:${taskId} attempts=${currentAttempts}`);

      // Simulated delivery: respect channel and simulate success/failure
      // For 'both' deliver both; adapter may fail and will throw
      if (preference?.channel === "push" || preference?.channel === "both") {
        await deliverSimulated(preference, { channel: "push", userId, taskId });
        console.log(`[DELIVERED push] user:${userId} task:${taskId}`);
      }
      if (preference?.channel === "email" || preference?.channel === "both") {
        await deliverSimulated(preference, { channel: "email", userId, taskId });
        console.log(`[DELIVERED email] user:${userId} task:${taskId}`);
      }

      throttleHits.set(userId, 0); // reset after success
      channel.ack(msg);

    } catch (err: any) {
      // Transient failure handling
      const nextAttempt = currentAttempts + 1;
      console.warn(`[urgent.worker] delivery failed for user:${msg ? JSON.stringify(msg.properties) : ''} attempt=${nextAttempt}:`, err.message);

      if (nextAttempt > MAX_RETRIES) {
        // send to DLQ queue payload with metadata
        const dlqPayload = {
          payload: JSON.parse(msg.content.toString()),
          reason: err.message || "delivery_failed",
          attempts: nextAttempt,
        };
        await channel.sendToQueue("notifications.dlq", Buffer.from(JSON.stringify(dlqPayload)), {
          persistent: true,
          contentType: "application/json",
          headers: { attempts: nextAttempt },
        });
        console.error(`[urgent.worker] moved to DLQ user:${dlqPayload.payload.userId} task:${dlqPayload.payload.taskId} attempts=${nextAttempt}`);
        channel.ack(msg);
      } else {
        // send to retry queue corresponding to nextAttempt
        const retryQueue = RETRY_QUEUE_BY_ATTEMPT[nextAttempt];
        if (!retryQueue) {
          // fallback: move to DLQ if no retry mapping
          await channel.sendToQueue("notifications.dlq", msg.content, {
            persistent: true,
            contentType: "application/json",
            headers: { attempts: nextAttempt },
          });
          console.error(`[urgent.worker] no retry queue for attempt ${nextAttempt} → moved to DLQ`);
          channel.ack(msg);
          return;
        }

        // forward message to retry queue with updated attempts header
        await channel.sendToQueue(retryQueue, msg.content, {
          persistent: true,
          contentType: "application/json",
          headers: { attempts: nextAttempt },
        });

        console.log(`[urgent.worker] requeued to ${retryQueue} user:${JSON.parse(msg.content.toString()).userId} attempt=${nextAttempt}`);
        channel.ack(msg);
      }
    }
  });
}
