import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import foodRouter from './routes/foodRoute.js'
import categoryRouter from './routes/categoryRoute.js'
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import adminRouter from './routes/adminRoute.js';
import couponRouter from './routes/couponRoute.js';
import notificationRouter from './routes/notificationRoute.js';
import { initSocket } from './socket.js';

//app config
const app = express()
const port = process.env.PORT ||4000
const httpServer = createServer(app);

// middleware
app.use(express.json())
app.use(cors())

//db connection
connectDB()

// api endpoints
app.use("/api/food",foodRouter)
app.use("/api/category",categoryRouter)
app.use("/images",express.static('uploads'))
app.use('/api/user', userRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/admin', adminRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/notification', notificationRouter)

app.get("/",(req,res)=>{
        res.send("API working")
})

initSocket(httpServer);

httpServer.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})

