import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ status: "ok" });
});

app.get("/db-test", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: "connected" });
  } catch (err) {
    res.status(500).json({ db: "error", err });
  }
});



export default app;
