import express from "express";
import {
  adminRegister,
  adminLogin,
  requestAdminPasswordReset,
  resetAdminPassword,
  getAdminSession,
  getDashboardStats,
  getReportsAnalytics,
} from "../controllers/adminController.js";
import { requireRoles } from "../middleware/adminAuth.js";

const adminRouter = express.Router();

adminRouter.post("/register", adminRegister);
adminRouter.post("/login", adminLogin);
adminRouter.post("/forgot-password", requestAdminPasswordReset);
adminRouter.post("/reset-password", resetAdminPassword);
adminRouter.get("/session", requireRoles("admin"), getAdminSession);
adminRouter.get("/dashboard", requireRoles("admin"), getDashboardStats);
adminRouter.get("/reports", requireRoles("admin"), getReportsAnalytics);

export default adminRouter;
