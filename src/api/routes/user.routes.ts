import express from "express";
import { listUsers, seedUsers } from "../controllers/user.controller.js";
import { getPref, upsertPref } from "../controllers/userPref.controller.js";

const router = express.Router();

router.get("/", listUsers);
router.post("/seed", seedUsers);
router.get("/:id/pref", getPref);
router.post("/:id/pref", upsertPref);

export default router;
