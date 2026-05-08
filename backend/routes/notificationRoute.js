import express from "express";
import { createNotification, listNotifications } from "../controllers/notificationController.js";
import { requireRoles } from "../middleware/adminAuth.js";

const notificationRouter = express.Router();

notificationRouter.post("/send", requireRoles("admin"), createNotification);
notificationRouter.get("/list", requireRoles("admin"), listNotifications);

export default notificationRouter;
