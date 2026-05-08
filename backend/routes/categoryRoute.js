import express from "express";
import multer from "multer";
import {
  addCategory,
  listCategory,
  updateCategory,
  removeCategory,
} from "../controllers/categoryController.js";
import { requireRoles } from "../middleware/adminAuth.js";

const categoryRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => cb(null, `${Date.now()}${file.originalname}`),
});

const upload = multer({ storage });

categoryRouter.post("/add", requireRoles("admin"), upload.single("icon"), addCategory);
categoryRouter.get("/list", listCategory);
categoryRouter.post("/update/:id", requireRoles("admin"), upload.single("icon"), updateCategory);
categoryRouter.post("/remove", requireRoles("admin"), removeCategory);

export default categoryRouter;
