import { type Request, type Response } from "express";
import * as service from "../service/notif.service.js";

export const handleTaskUpdate = async (req: Request, res: Response) => {
  const { taskId, userIds, priority } = req.body;

  if (!taskId || !userIds?.length) {
    return res.status(400).json({ error: "taskId + userIds required" });
  }

  const result = await service.processTaskUpdate({
    taskId,
    userIds,
    priority: priority || "normal",
  });

  res.json({ status: "queued", count: result.length });
};

export const listNotifications = async (_: Request, res: Response) => {
  const notifs = await service.listNotifications();
  res.json(notifs);
};
