import couponModel from "../models/couponModel.js";

const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, usageLimit } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const exists = await couponModel.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Coupon already exists" });
    }

    await couponModel.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      expiryDate,
      usageLimit: Number(usageLimit || 0),
    });

    return res.json({ success: true, message: "Coupon created" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, data: coupons });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, expiryDate, usageLimit, isActive } = req.body;

    const coupon = await couponModel.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (code && code.toUpperCase() !== coupon.code) {
      const duplicate = await couponModel.findOne({ code: code.toUpperCase(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "Coupon already exists" });
      }
    }

    await couponModel.findByIdAndUpdate(id, {
      code: code?.toUpperCase() || coupon.code,
      discountType: discountType || coupon.discountType,
      discountValue: Number(discountValue ?? coupon.discountValue),
      expiryDate: expiryDate || coupon.expiryDate,
      usageLimit: Number(usageLimit ?? coupon.usageLimit),
      isActive: typeof isActive === "boolean" ? isActive : coupon.isActive,
    });

    return res.json({ success: true, message: "Coupon updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await couponModel.findByIdAndDelete(req.body.id);
    return res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { createCoupon, listCoupons, updateCoupon, deleteCoupon };
