import { type Request, type Response } from "express";
import * as service from "../service/user.service.js";

export const listUsers = async (_: Request, res: Response) => {
  const users = await service.listUsers();
  res.json(users);
};

export const seedUsers = async (_: Request, res: Response) => {
  const data = await service.seedUsers();
  res.json({ count: data.length, users: data });
};
