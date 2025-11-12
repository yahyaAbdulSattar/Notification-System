import { getRabbit } from "../../../config/rabbitmq.js";
import { EXCHANGE } from "../setup.js";

export async function publishUrgentNotification(payload: any) {
  const { channel } = getRabbit();
  const routingKey = "notifications.urgent";

  // ensure attempts header exists
  const headers = Object.assign({}, payload.headers ?? {}, { attempts: 0 });

  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
    headers,
  });

  console.log(`[PUBLISH] urgent → user:${payload.userId} task:${payload.taskId} attempts=0`);
}
