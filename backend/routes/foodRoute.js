import express from 'express'
import { addFood, updateFood, listFood, removeFood } from '../controllers/foodController.js'
import multer from 'multer'
import { requireRoles } from '../middleware/adminAuth.js';

const foodRouter = express.Router();

// Image Storage Engine

const storage = multer.diskStorage({
    destination:"uploads",
    filename: (req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload = multer({storage:storage})
foodRouter.post('/add', requireRoles('admin'), upload.single('image'), addFood)
foodRouter.post('/update/:id', requireRoles('admin'), upload.single('image'), updateFood)
foodRouter.get('/list',listFood)
foodRouter.post('/remove', requireRoles('admin'), removeFood)

export default foodRouter;
