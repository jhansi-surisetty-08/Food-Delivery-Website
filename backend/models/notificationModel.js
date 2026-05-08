import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["offer", "new-item", "festival"], required: true },
  },
  { timestamps: true }
);

const notificationModel =
  mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default notificationModel;
