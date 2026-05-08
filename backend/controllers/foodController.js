import fs from 'fs'
import foodModel from '../models/foodModel.js'

//add food item

const addFood = async (req,res) =>{
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Image is required' });
    }

    let image_filename = `${req.file.filename}`;

    const parsedPrice = Number(req.body.price);
    const parsedStockCount = Number(req.body.stockCount ?? 0);
    const parsedInStock = req.body.inStock === 'true' || req.body.inStock === true;

    if (!req.body.name || !req.body.description || !req.body.category || !Number.isFinite(parsedPrice)) {
        return res.status(400).json({success:false, message:'Invalid food data'});
    }

    const food = new foodModel({
        name: req.body.name,
        description:req.body.description,
        price:parsedPrice,
        category:req.body.category,
        image:image_filename,
        inStock: parsedInStock,
        stockCount: Number.isFinite(parsedStockCount) ? parsedStockCount : 0
    })

    try {
        await food.save();
        res.json({success:true,message:'Food Added'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await foodModel.findById(id);

        if (!food) {
            return res.status(404).json({ success: false, message: 'Food not found' });
        }

        const parsedPrice = Number(req.body.price);
        const parsedStockCount = Number(req.body.stockCount ?? 0);
        const parsedInStock = req.body.inStock === 'true' || req.body.inStock === true;

        if (!req.body.name || !req.body.description || !req.body.category || !Number.isFinite(parsedPrice)) {
            return res.status(400).json({ success: false, message: 'Invalid food data' });
        }

        const update = {
            name: req.body.name,
            description: req.body.description,
            price: parsedPrice,
            category: req.body.category,
            inStock: parsedInStock,
            stockCount: Number.isFinite(parsedStockCount) ? parsedStockCount : 0,
        };

        if (req.file) {
            update.image = req.file.filename;
            if (food.image) {
                fs.unlink(`uploads/${food.image}`, () => {});
            }
        }

        await foodModel.findByIdAndUpdate(id, update);
        return res.json({ success: true, message: 'Food Updated' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Error' });
    }
}

// All food list

const listFood = async (req,res) =>{
    try {
        const foods = await foodModel.find({});
        res.json({success:true,data:foods})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

// remove food item

const removeFood = async (req,res)=>{
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:'Food Removed'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:'Error'})
    }
}

export {addFood, updateFood, listFood, removeFood}