import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import validator from "validator";
import foodModel from "../models/foodModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const ADMIN_SESSION_MINUTES = 30;
const RESET_OTP_MINUTES = 10;

const createAdminToken = (user) => {
  const expiresIn = `${ADMIN_SESSION_MINUTES}m`;
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, scope: "admin" },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  return {
    token,
    expiresAt: new Date(Date.now() + ADMIN_SESSION_MINUTES * 60 * 1000).toISOString(),
  };
};

const normalizePhone = (value = "") => value.replace(/\D/g, "");

const createOtp = () => `${crypto.randomInt(100000, 999999)}`;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const buildAdminAuthPayload = (user) => {
  const { token, expiresAt } = createAdminToken(user);

  return {
    success: true,
    token,
    expiresAt,
    sessionTimeoutMinutes: ADMIN_SESSION_MINUTES,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar,
      role: user.role,
    },
  };
};

const adminRegister = async (req, res) => {
  const { name, email, phone, avatar, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Name, email, password, and confirm password are required" });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Admin name must be at least 2 characters" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = normalizePhone(phone || "");

    const existingAdmin = await userModel.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });

    if (existingAdmin) {
      if (existingAdmin.role === "admin") {
        return res.status(409).json({ success: false, message: "Admin account already exists" });
      }

      const isExistingPassword = await bcrypt.compare(password, existingAdmin.password);
      if (!isExistingPassword) {
        return res.status(409).json({
          success: false,
          message: "This email or phone is already used by a user account. Use the same password to upgrade it to admin.",
        });
      }

      existingAdmin.name = name.trim();
      existingAdmin.email = normalizedEmail;
      existingAdmin.phone = normalizedPhone || undefined;
      existingAdmin.avatar = avatar || existingAdmin.avatar || "violet-smile";
      existingAdmin.role = "admin";
      existingAdmin.lastLoginAt = new Date();
      await existingAdmin.save();

      return res.status(200).json(buildAdminAuthPayload(existingAdmin));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      avatar: avatar || "violet-smile",
      password: hashedPassword,
      role: "admin",
      lastLoginAt: new Date(),
    });

    return res.status(201).json(buildAdminAuthPayload(admin));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Unable to create admin account" });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Admin email and password are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const admin = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "This account does not have admin access" });
    }

    if (admin.isBanned) {
      return res.status(403).json({ success: false, message: "Admin account is disabled" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    return res.json(buildAdminAuthPayload(admin));
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Unable to login right now" });
  }
};

const requestAdminPasswordReset = async (req, res) => {
  const identifier = (req.body.identifier || "").trim();

  try {
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    const query = validator.isEmail(identifier)
      ? { email: identifier.toLowerCase() }
      : { phone: normalizePhone(identifier) };

    const admin = await userModel.findOne(query);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    const otp = createOtp();
    admin.resetPasswordOtpHash = hashOtp(otp);
    admin.resetPasswordOtpExpiresAt = new Date(Date.now() + RESET_OTP_MINUTES * 60 * 1000);
    await admin.save();

    console.log(`Admin password reset OTP for ${admin.email}: ${otp}`);

    return res.json({
      success: true,
      message: "OTP generated successfully",
      otp: process.env.NODE_ENV !== "production" ? otp : undefined,
      expiresInMinutes: RESET_OTP_MINUTES,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Unable to generate OTP" });
  }
};

const resetAdminPassword = async (req, res) => {
  const { identifier, otp, newPassword, confirmPassword } = req.body;

  try {
    if (!identifier || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All reset fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const query = validator.isEmail(identifier)
      ? { email: identifier.toLowerCase().trim() }
      : { phone: normalizePhone(identifier) };

    const admin = await userModel.findOne(query);
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }

    if (!admin.resetPasswordOtpHash || !admin.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ success: false, message: "OTP request not found" });
    }

    if (admin.resetPasswordOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (hashOtp(otp) !== admin.resetPasswordOtpHash) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.resetPasswordOtpHash = "";
    admin.resetPasswordOtpExpiresAt = null;
    await admin.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Unable to reset password" });
  }
};

const getAdminSession = async (req, res) => {
  try {
    const admin = await userModel.findById(req.user.id).select("_id name email phone avatar role");
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    return res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || "",
        avatar: admin.avatar,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Unable to load session" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, totalUsers] = await Promise.all([
      orderModel.countDocuments({}),
      userModel.countDocuments({}),
    ]);

    const pendingDeliveries = await orderModel.countDocuments({
      status: { $ne: "Delivered" },
    });

    const revenueAgg = await orderModel.aggregate([
      { $match: { paymentStatus: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);

    const topFoodsAgg = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalSales: {
            $sum: {
              $multiply: [
                "$items.quantity",
                { $ifNull: ["$items.price", 0] },
              ],
            },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          foodName: "$_id",
          totalQuantity: 1,
          totalSales: 1,
        },
      },
    ]);

    const recentOrders = await orderModel
      .find({})
      .sort({ date: -1 })
      .limit(8)
      .select("orderNumber amount status paymentStatus date address")
      .lean();

    const topFoodsFallback = topFoodsAgg.length
      ? topFoodsAgg
      : (await foodModel.find({}).limit(5).select("name").lean()).map((food) => ({
          foodName: food.name,
          totalQuantity: 0,
          totalSales: 0,
        }));

    const formattedRecentOrders = recentOrders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: `${order?.address?.firstName || ""} ${
        order?.address?.lastName || ""
      }`.trim() || "N/A",
      amount: order.amount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      date: order.date,
    }));

    return res.json({
      success: true,
      data: {
        kpis: {
          totalOrders,
          totalRevenue: revenueAgg[0]?.totalRevenue || 0,
          totalUsers,
          pendingDeliveries,
        },
        topSellingFoods: topFoodsFallback,
        recentOrders: formattedRecentOrders,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};

const getReportsAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const dailyOrdersRaw = await orderModel.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: now } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyOrders = dailyOrdersRaw.map((d) => ({
      day: d._id,
      orders: d.count,
    }));

    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const monthlyRevenueRaw = await orderModel.aggregate([
      { $match: { paymentStatus: "success", date: { $gte: yearAgo, $lte: now } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$date" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyRevenue = monthlyRevenueRaw.map((m) => ({
      month: m._id,
      revenue: m.revenue,
    }));

    const topProducts = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          product: "$_id",
          sold: 1,
        },
      },
    ]);

    const peakOrderingTimesRaw = await orderModel.aggregate([
      {
        $group: {
          _id: { $hour: "$date" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { orders: -1 } },
      { $limit: 6 },
    ]);

    const peakOrderingTimes = peakOrderingTimesRaw.map((x) => ({
      hour: `${x._id.toString().padStart(2, "0")}:00`,
      orders: x.orders,
    }));

    return res.json({
      success: true,
      data: {
        dailyOrders,
        monthlyRevenue,
        topProducts,
        peakOrderingTimes,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to load reports" });
  }
};

export {
  adminRegister,
  adminLogin,
  requestAdminPasswordReset,
  resetAdminPassword,
  getAdminSession,
  getDashboardStats,
  getReportsAnalytics,
};
