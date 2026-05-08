import orderModel from './../models/orderModel.js';
import userModel from './../models/userModel.js';
import paymentModel from "../models/paymentModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getIO } from "../socket.js";

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys missing");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const generateOrderNumber = async () => {
    const prefix = "FD";
    for (let attempt = 0; attempt < 5; attempt++) {
        const random = Math.floor(1000 + Math.random() * 9000);
        const timestamp = Date.now().toString().slice(-6);
        const orderNumber = `${prefix}-${timestamp}-${random}`;
        const exists = await orderModel.findOne({ orderNumber });
        if (!exists) return orderNumber;
    }
    return `${prefix}-${Date.now()}`;
};

const buildRazorpayOrder = async (razorpay, orderDoc) => {
    const amountPaise = Math.round(Number(orderDoc.amount) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw new Error("Invalid order amount");
    }

    const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: orderDoc.currency || "INR",
        receipt: orderDoc.orderNumber,
        notes: { orderId: orderDoc._id.toString() }
    });

    return order;
};

// Placing user order for frontend (Razorpay)
const placeOrder = async (req, res) =>{

    const frontend_url = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({success:false, message:"Cart is empty"});
        }

        if (!req.body.address || typeof req.body.address !== "object") {
            return res.status(400).json({success:false, message:"Address is required"});
        }

        const parsedAmount = Number(req.body.amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({success:false, message:"Invalid amount"});
        }

        const razorpay = getRazorpay();
        const orderNumber = await generateOrderNumber();
        const newOrder = new orderModel({
            userId: req.body.userId,
            orderNumber,
            items: req.body.items,
            amount:parsedAmount,
            address: req.body.address,
            status:"Order Placed",
            statusHistory:[{status:"Order Placed", time:new Date()}],
            etaMinutes: req.body.etaMinutes ?? 45,
            deliveryLocation: req.body.deliveryLocation || undefined,
            paymentStatus: "pending",
            currency: "INR",
            paymentAttempts: 1,
            lastPaymentError: ""
        })

        await newOrder.save();

        const order = await buildRazorpayOrder(razorpay, newOrder);

        await orderModel.findByIdAndUpdate(newOrder._id, {
            razorpayOrderId: order.id
        });

        res.json({
            success:true,
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            callbackUrl: `${frontend_url}/payment-success`
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false, message:error?.message || "Error starting payment"})
    }
}

const retryPayment = async (req, res) => {
    const frontend_url = process.env.CLIENT_URL || 'http://localhost:5173';
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({success:false, message:"orderId required"});
        }

        const orderDoc = await orderModel.findById(orderId);
        if (!orderDoc) {
            return res.status(404).json({success:false, message:"Order not found"});
        }

        if (orderDoc.userId !== req.body.userId) {
            return res.status(403).json({success:false, message:"Unauthorized"});
        }

        if (orderDoc.paymentStatus === "success") {
            return res.status(400).json({success:false, message:"Order already paid"});
        }

        const razorpay = getRazorpay();
        const razorpayOrder = await buildRazorpayOrder(razorpay, orderDoc);

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: "pending",
                razorpayOrderId: razorpayOrder.id,
                $inc: { paymentAttempts: 1 },
                $set: { lastPaymentError: "" }
            },
            { new: true }
        );

        return res.json({
            success:true,
            orderId: updatedOrder._id,
            orderNumber: updatedOrder.orderNumber,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            callbackUrl: `${frontend_url}/payment-success`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, message:error?.message || "Error retrying payment"});
    }
}

const verifyOrder = async (req, res) =>{
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    try {
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            await orderModel.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
            await paymentModel.create({
                orderId,
                userId: req.body.userId,
                amount: req.body.amount || 0,
                currency: "INR",
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                status: "failed"
            });
            return res.status(400).json({success:false, message:"Invalid signature"});
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                payment:true,
                paymentStatus:"success",
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                lastPaymentError: ""
            },
            { new: true }
        );

        await paymentModel.create({
            orderId,
            userId: req.body.userId,
            amount: updatedOrder?.amount || 0,
            currency: updatedOrder?.currency || "INR",
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            status: "success"
        });

        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({success:true, message:"Paid"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId}).sort({date:-1})
        res.json({success:true, data:orders})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})
    }
}

// listing orders for admin panel
const listOrders = async (req,res) =>{
   try {
    const orders = await orderModel.find({});
    res.json({success:true, data:orders})
   } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})  
   } 
}

// api for updating order status
const updateStatus = async (req, res) =>{
    try {
        const { orderId, status, etaMinutes, deliveryLocation } = req.body;
        if (!status) {
            return res.json({success:false, message:"Status is required"});
        }
        const update = {
            status
        };
        if (typeof etaMinutes === "number") {
            update.etaMinutes = etaMinutes;
        }
        if (deliveryLocation) {
            update.deliveryLocation = deliveryLocation;
        }
        if (status === "Delivered") {
            update.deliveredAt = new Date();
        }
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                $set: update,
                $push: { statusHistory: { status, time: new Date() } }
            },
            { new: true }
        );
        const io = getIO();
        if (io && updatedOrder) {
            io.to(orderId).emit("order:update", updatedOrder);
        }
        res.json({success:true, message:"Status Updated"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:"Error"})  
    }
}

const assignDeliveryBoy = async (req, res) => {
    try {
        const { orderId, deliveryBoyName, deliveryBoyPhone } = req.body;
        if (!orderId || !deliveryBoyName) {
            return res.status(400).json({ success:false, message:"orderId and deliveryBoyName required" });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    deliveryBoyName,
                    deliveryBoyPhone: deliveryBoyPhone || "",
                    assignedAt: new Date(),
                },
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success:false, message:"Order not found" });
        }

        return res.json({ success:true, message:"Delivery boy assigned", data: updatedOrder });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success:false, message:"Error" });
    }
}

const deliveryStats = async (req, res) => {
    try {
        const completedAgg = await orderModel.aggregate([
            {
                $match: {
                    status: "Delivered",
                    deliveryBoyName: { $ne: "" },
                },
            },
            {
                $group: {
                    _id: "$deliveryBoyName",
                    completedDeliveries: { $sum: 1 },
                },
            },
            { $sort: { completedDeliveries: -1 } },
        ]);

        return res.json({ success:true, data: completedAgg.map((x) => ({
            deliveryBoyName: x._id,
            completedDeliveries: x.completedDeliveries,
        })) });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success:false, message:"Error" });
    }
}

const trackOrder = async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.orderId);
        if (!order) return res.json({success:false, message:"Order not found"});
        if (order.userId !== req.body.userId) {
            return res.json({success:false, message:"Unauthorized"});
        }
        res.json({success:true, data:order});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
}

const updateDriverLocation = async (req, res) => {
    try {
        const { orderId, lat, lng, etaMinutes } = req.body;
        if (!orderId || typeof lat !== "number" || typeof lng !== "number") {
            return res.json({success:false, message:"orderId, lat, lng are required"});
        }
        const update = {
            deliveryLocation: { lat, lng }
        };
        if (typeof etaMinutes === "number") {
            update.etaMinutes = etaMinutes;
        }
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { $set: update },
            { new: true }
        );
        const io = getIO();
        if (io && updatedOrder) {
            io.to(orderId).emit("order:update", updatedOrder);
        }
        res.json({success:true, data:updatedOrder});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
}

const paymentFailed = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, reason } = req.body;
        if (!orderId) return res.json({success:false, message:"orderId required"});
        const order = await orderModel.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: "failed",
                $set: { lastPaymentError: reason || "Payment failed" }
            },
            { new: true }
        );
        await paymentModel.create({
            orderId,
            userId: req.body.userId,
            amount: order?.amount || 0,
            currency: order?.currency || "INR",
            razorpayOrderId: razorpay_order_id,
            status: "failed"
        });
        res.json({success:true, message: reason || "Payment failed"});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
}

const transactions = async (req, res) => {
    try {
        const list = await paymentModel.find({ userId: req.body.userId }).sort({ createdAt: -1 });
        res.json({success:true, data:list});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
}

const listPayments = async (req, res) => {
    try {
        const list = await paymentModel.find({}).sort({ createdAt: -1 });
        res.json({success:true, data:list});
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Error"});
    }
}

export {placeOrder, retryPayment, verifyOrder, userOrders,listOrders, updateStatus, assignDeliveryBoy, deliveryStats, trackOrder, updateDriverLocation, paymentFailed, transactions, listPayments}
