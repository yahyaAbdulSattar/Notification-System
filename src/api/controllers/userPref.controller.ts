import { type Request, type Response } from "express";
import * as repo from "../../modules/users/repos/userPref.repo.js";

export async function getPref(req: Request, res: Response) {
  const { id } = req.params;
  const pref = await repo.get(id);
  if (!pref) return res.status(404).json({ error: "not_found" });
  return res.json(pref);
}

export async function upsertPref(req: Request, res: Response) {
  const { id } = req.params;
  const { channel, mode } = req.body;
  if (!channel || !mode) return res.status(400).json({ error: "channel+mode required" });
  const pref = await repo.set(id, channel, mode);
  return res.json(pref);
}
