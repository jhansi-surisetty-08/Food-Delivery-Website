import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{type:String, required: true},
    orderNumber:{type:String, required:true, unique:true},
    items:{type:Array, required: true},
    amount:{type:Number, required: true},
    address:{type:Object, required: true},
    status:{type:String, default:"Order Placed"},
    statusHistory:{type:Array, default:[]},
    etaMinutes:{type:Number, default:45},
    deliveryLocation:{
        lat:{type:Number},
        lng:{type:Number}
    },
    deliveryBoyName:{type:String, default:""},
    deliveryBoyPhone:{type:String, default:""},
    assignedAt:{type:Date},
    deliveredAt:{type:Date},
    paymentStatus:{type:String, enum:["pending","success","failed"], default:"pending"},
    paymentAttempts:{type:Number, default:0},
    lastPaymentError:{type:String, default:""},
    razorpayOrderId:{type:String},
    paymentId:{type:String},
    currency:{type:String, default:"INR"},
    date:{type:Date, default:Date.now()},
    payment:{type:Boolean, default:false},
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel;
