import { getRabbit } from "../../../config/rabbitmq.js";
import { EXCHANGE } from "../setup.js";


export async function publishUrgentNotification(payload: any) {
    const { channel } = getRabbit();

    const routingKey = "notification.urgent"

    await channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
        contentType: 'application/json'
    });

    console.log(`[PUBLISH] urgent -> ${payload.userId} (${payload.taskId})`);
}