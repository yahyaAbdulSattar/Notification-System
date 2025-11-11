import { getRabbit } from "../../../config/rabbitmq.js";
import { EXCHANGE } from "../setup.js";

export async function publishNormalNotification(payload: any) {
  const { channel } = getRabbit();
  const routingKey = "notifications.normal";

  await channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
  });

  console.log(`[PUBLISH] normal -> ${payload.userId} (${payload.taskId})`);
}
