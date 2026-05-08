import fs from "fs";
import categoryModel from "../models/categoryModel.js";

const addCategory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Category icon is required" });
    }

    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const exists = await categoryModel.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (exists) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    await categoryModel.create({
      name,
      icon: req.file.filename,
    });

    return res.json({ success: true, message: "Category Added" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listCategory = async (req, res) => {
  try {
    const list = await categoryModel.find({}).sort({ name: 1 });
    return res.json({ success: true, data: list });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const duplicate = await categoryModel.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${name}$`, "i"),
    });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const update = { name };
    if (req.file) {
      update.icon = req.file.filename;
      if (category.icon) {
        fs.unlink(`uploads/${category.icon}`, () => {});
      }
    }

    await categoryModel.findByIdAndUpdate(id, update);
    return res.json({ success: true, message: "Category Updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const removeCategory = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (category.icon) {
      fs.unlink(`uploads/${category.icon}`, () => {});
    }

    await categoryModel.findByIdAndDelete(req.body.id);
    return res.json({ success: true, message: "Category Removed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { addCategory, listCategory, updateCategory, removeCategory };
