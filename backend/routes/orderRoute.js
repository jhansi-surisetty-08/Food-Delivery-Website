import express from "express"
import authMiddleware from './../middleware/auth.js';
import { placeOrder, retryPayment, verifyOrder, userOrders,listOrders,updateStatus, assignDeliveryBoy, deliveryStats, trackOrder, updateDriverLocation, paymentFailed, transactions, listPayments } from "../controllers/orderController.js";
import { requireRoles } from "../middleware/adminAuth.js";

const orderRouter = express.Router();

orderRouter.post("/place",authMiddleware,placeOrder);
orderRouter.post("/retry-payment", authMiddleware, retryPayment)
orderRouter.post("/verify", authMiddleware, verifyOrder)
orderRouter.post("/payment-failed", authMiddleware, paymentFailed)
orderRouter.post("/userorders",authMiddleware,userOrders)
orderRouter.get("/track/:orderId", authMiddleware, trackOrder)
orderRouter.get("/transactions", authMiddleware, transactions)
orderRouter.get("/payments", requireRoles("admin"), listPayments)
orderRouter.post("/location", requireRoles("admin"), updateDriverLocation)
orderRouter.get('/list', requireRoles("admin"), listOrders)
orderRouter.post('/status', requireRoles("admin"), updateStatus)
orderRouter.post('/assign-delivery', requireRoles("admin"), assignDeliveryBoy)
orderRouter.get('/delivery-stats', requireRoles("admin"), deliveryStats)

export default orderRouter;
