import { initRabbit } from "../config/rabbitmq.js";
import { setupQueues } from "../modules/notifications/setup.js";
import prismaPkg from "@prisma/client";
const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

// TODO: find why logs are not working: after work

async function startDlqWorker() {
  const { channel } = await initRabbit();
  await setupQueues(channel);

  const queue = "notifications.dlq";
  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(5);

  console.log("[dlq.worker] waiting for DLQ messages...");

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const body = JSON.parse(msg.content.toString());
      const payload = body.payload ?? body;
      const reason = body.reason ?? (msg.properties.headers?.reason ?? "unknown");

      await prisma.dlqNotification.create({
        data: {
          payload: payload,
          reason: String(reason),
          attempts: Number(msg.properties.headers?.attempts ?? body.attempts ?? 0),
        },
      });

      console.log(`[dlq.worker] DLQ saved for user:${payload.userId} task:${payload.taskId} attempts=${msg.properties.headers?.attempts ?? body.attempts ?? 0}`);
      channel.ack(msg);
    } catch (err) {
      console.error("[dlq.worker] failed to persist DLQ", err);
      // ack to avoid infinite loop on failure, but in prod you'd handle differently
      channel.ack(msg);
    }
  });
}

startDlqWorker().catch((err) => {
  console.error("dlq.worker error:", err);
  process.exit(1);
});
