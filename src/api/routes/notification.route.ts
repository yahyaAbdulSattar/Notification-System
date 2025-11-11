import express from "express";
import * as controller from "../controllers/notif.controller.js";

const router = express.Router();

router.get("/", controller.listNotifications);
router.post("/tasks/updated", controller.handleTaskUpdate);

export default router;
