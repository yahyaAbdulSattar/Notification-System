import express from "express";
import * as controller from "../controller/user.controller.js";

const router = express.Router();

router.get("/", controller.listUsers);
router.post("/seed", controller.seedUsers);

export default router;
