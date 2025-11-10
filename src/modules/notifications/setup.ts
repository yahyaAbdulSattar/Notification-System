// Topic note: 
// notifications.urgent
// notifications.normal

import type { Channel } from "amqplib";

export async function setupQueues(ch: Channel) {
    const exchange = "notification.exchange"

    await ch.assertExchange(exchange, "topic", { durable: true });

    await ch.assertQueue("notifications.urgent", { durable: true });
    await ch.assertQueue("notifications.normal", { durable: true });

    await ch.bindQueue("notifications.urgent", exchange, "notifications.urgent");
    await ch.bindQueue("notifications.normal", exchange, "notifications.normal");
}