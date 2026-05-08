import notificationModel from "../models/notificationModel.js";

const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await notificationModel.create({ title, message, type });
    return res.json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listNotifications = async (req, res) => {
  try {
    const list = await notificationModel.find({}).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, data: list });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { createNotification, listNotifications };
