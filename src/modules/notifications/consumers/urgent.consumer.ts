import { getRabbit } from "../../../config/rabbitmq.js";
import { EXCHANGE } from "../setup.js";

export async function startUrgentConsumer() {
  const { channel } = getRabbit();
  const queue = "notifications.urgent";

  await channel.assertQueue(queue, { durable: true });
  channel.prefetch(10);

  console.log("[urgent.worker] waiting for messages...");

  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString());

      const { userId, taskId, preference } = data;
      const channelPref = preference?.channel ?? "push";

      console.log(`[urgent.worker] received urgent notification for user:${userId} task:${taskId}`);

      // Simulate delivery per channel
      if (channelPref === "push" || channelPref === "both") {
        console.log(`[DELIVERED push] user:${userId} task:${taskId}`);
      }
      if (channelPref === "email" || channelPref === "both") {
        console.log(`[DELIVERED email] user:${userId} task:${taskId}`);
      }

      // Simulate marking success (in real impl, update DB)
      // await prisma.notification.update({ where: { id: data.id }, data: { status: "sent" } });

      channel.ack(msg);
    } catch (err) {
      console.error("[urgent.worker] failed to process", err);
      channel.nack(msg, false, false);
    }
  });
}
