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
      console.log(`[DELIVERED] urgent -> user:${data.userId} task:${data.taskId}`);
      channel.ack(msg);
    } catch (err) {
      console.error("[urgent.worker] failed to process", err);
      channel.nack(msg, false, false); // drop for now
    }
  });
}
