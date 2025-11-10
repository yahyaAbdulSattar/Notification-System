import amqp, { type Channel, type Connection } from "amqplib";
import { config } from "./env.js";

let connection: Connection;
let channel: Channel;

export async function initRabbit() {
  connection = await amqp.connect(config.rabbitUrl);
  channel = await connection.createChannel();
  console.log("[rabbitmq] connected");
  return { connection, channel };
}

export function getRabbit() {
  if (!connection || !channel) {
    throw new Error("RabbitMQ not initialized");
  }
  return { connection, channel };
}
