import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    phone:{type:String, unique:true, sparse:true},
    avatar:{type:String, default:"violet-smile"},
    googleId:{type:String, unique:true, sparse:true},
    password:{type:String, required:true},
    cartData:{type:Object, default:{}},
    role:{type:String, enum:['user','admin'], default:'user'},
    isBanned:{type:Boolean, default:false},
    resetPasswordOtpHash:{type:String, default:""},
    resetPasswordOtpExpiresAt:{type:Date, default:null},
    lastLoginAt:{type:Date, default:null},
    createdAt:{type:Date, default:Date.now}
},{minimize:false})

const userModel = mongoose.model.user || mongoose.model("user", userSchema);

export default userModel;
