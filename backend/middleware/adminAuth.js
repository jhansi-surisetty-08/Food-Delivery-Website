import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.headers.token;
};

const authenticateAdmin = async (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Admin login required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.scope !== "admin") {
      return res.status(401).json({ success: false, message: "Admin login required" });
    }

    const user = await userModel.findById(decoded.id).select("_id name email phone role isBanned");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid session" });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Account is banned" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
    };

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};

const requireRoles = (...roles) => {
  return async (req, res, next) => {
    await authenticateAdmin(req, res, async () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Access denied for this role" });
      }

      next();
    });
  };
};

export { authenticateAdmin, requireRoles };
