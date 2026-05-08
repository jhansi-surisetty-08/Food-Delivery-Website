import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  status: { type: String, enum: ["success", "failed"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const paymentModel = mongoose.models.payment || mongoose.model("payment", paymentSchema);

export default paymentModel;
