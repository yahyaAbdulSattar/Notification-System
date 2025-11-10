import dotenv from "dotenv";

dotenv.config();

export const config = {
  pgUrl: process.env.DATABASE_URL!,
  rabbitUrl: process.env.RABBITMQ_URL!,
  redisUrl: process.env.REDIS_URL!,
};
