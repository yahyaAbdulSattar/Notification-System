import type { Channel } from "amqplib";

export const EXCHANGE = "notifications.exchange";

export async function setupQueues(ch: Channel) {
  await ch.assertExchange(EXCHANGE, "topic", { durable: true });

  // main queues
  await ch.assertQueue("notifications.urgent", { durable: true });
  await ch.assertQueue("notifications.normal", { durable: true });

  await ch.bindQueue("notifications.urgent", EXCHANGE, "notifications.urgent");
  await ch.bindQueue("notifications.normal", EXCHANGE, "notifications.normal");

  // Retry queues with TTL and dead-letter back to exchange => urgent routing
  // 1: 5s, 2: 15s, 3: 45s
  const retryQueues = [
    { name: "notifications.retry.1", ttl: 5_000 },
    { name: "notifications.retry.2", ttl: 15_000 },
    { name: "notifications.retry.3", ttl: 45_000 },
  ];

  for (const rq of retryQueues) {
    await ch.assertQueue(rq.name, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGE,
        "x-dead-letter-routing-key": "notifications.urgent",
        "x-message-ttl": rq.ttl,
      },
    });
  }

  // DLQ
  await ch.assertQueue("notifications.dlq", { durable: true });
}
