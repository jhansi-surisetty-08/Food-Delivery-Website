import express from "express";
import { createCoupon, listCoupons, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import { requireRoles } from "../middleware/adminAuth.js";

const couponRouter = express.Router();

couponRouter.post("/add", requireRoles("admin"), createCoupon);
couponRouter.get("/list", requireRoles("admin"), listCoupons);
couponRouter.post("/update/:id", requireRoles("admin"), updateCoupon);
couponRouter.post("/remove", requireRoles("admin"), deleteCoupon);

export default couponRouter;
