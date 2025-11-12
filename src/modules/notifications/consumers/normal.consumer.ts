import { getRabbit } from "../../../config/rabbitmq.js";
import { redis } from "../../../config/redis.js";
import { inc } from "../../../metrics/metrics.js";

const QUEUE = "notifications.normal";
const BATCH_KEY_PREFIX = "batch:"; // batch:user123
const BATCH_TTL_SECONDS = 30; // flush window

export async function startNormalConsumer() {
    const { channel } = getRabbit();

    await channel.assertQueue(QUEUE, { durable: true });
    channel.prefetch(50); // 50 nack messages at a time

    console.log("[normal.worker] waiting for messages...");

    await channel.consume(QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const notif = JSON.parse(msg.content.toString());
            const userKey = `${BATCH_KEY_PREFIX}${notif.userId}`;

            // push to redis list
            await redis.rpush(userKey, JSON.stringify(notif));

            // set TTL for batch wndow
            const ttl = await redis.ttl(userKey);
            if (ttl === -1) {
                await redis.expire(userKey, BATCH_TTL_SECONDS);
            }

            inc("normal_buffered_total", 1);

            console.log(`[normal.worker] buffered -> user:${notif.userId} task:${notif.taskId}`);
            channel.ack(msg);

        } catch (err) {
            console.error("[normal.worker] failed: ", err);
            channel.nack(msg, false, false)
        }

    })
}