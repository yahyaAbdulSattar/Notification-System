import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import notificationRouter from './api/routes/notification.route.js'
import userRouter from './api/routes/user.routes.js'
import { snapshot } from "./metrics/metrics.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());


app.use("/notifications", notificationRouter);
app.use("/users", userRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.get("/metrics", (_, res) => res.json(snapshot()));
app.get("/db-test", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: "connected" });
  } catch (err) {
    res.status(500).json({ db: "error", err });
  }
});

export default app;
