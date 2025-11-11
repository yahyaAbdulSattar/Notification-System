import type { Channel } from "amqplib";

export const EXCHANGE = "notifications.exchange";

export async function setupQueues(ch: Channel) {
  await ch.assertExchange(EXCHANGE, "topic", { durable: true });

  await ch.assertQueue("notifications.urgent", { durable: true });
  await ch.assertQueue("notifications.normal", { durable: true });

  await ch.bindQueue("notifications.urgent", EXCHANGE, "notifications.urgent");
  await ch.bindQueue("notifications.normal", EXCHANGE, "notifications.normal");

  console.log("[rabbitmq] Queues & exchange ready");
}
