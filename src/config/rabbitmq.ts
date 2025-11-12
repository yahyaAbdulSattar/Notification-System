import amqp, { type Channel, type Connection } from "amqplib";
import { config } from "./env.js";

let connection: Connection;
let channel: Channel;

export async function initRabbit() {

  for (let i = 0; i < 10; i++) {
    try {
      connection = await amqp.connect(config.rabbitUrl);
      channel = await connection.createChannel();
      console.log("[rabbitmq] connected");
      return { connection, channel };
    } catch (err: any) {
      console.error(`[rabbitmq] connection failed (${i + 1}/10): ${err.message}`);
      await new Promise((r) => setTimeout(r, 5000)); // retry after 5s
    }
  }

  throw new Error("RabbitMQ connection failed after 10 attempts");
}

export function getRabbit() {
  if (!connection || !channel) {
    throw new Error("RabbitMQ not initialized");
  }
  return { connection, channel };
}
