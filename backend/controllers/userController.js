import userModel from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'
import crypto from "crypto";

const RESET_OTP_MINUTES = 10;
const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";
const getGoogleCallbackUrl = (req) => `${req.protocol}://${req.get("host")}/api/user/auth/google/callback`;

//login user
const loginUser = async (req,res) =>{
    const {email, password} = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({success:false, message:'Email and password are required'})
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({success:false, message:'Invalid email'})
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({success:false, message:'Invalid password'})
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await userModel.findOne({email: normalizedEmail});

        if(!user){
              return res.status(404).json({success:false, message:'Account not found'}) 
        }

        if (!user.password) {
            return res.status(401).json({success:false, message:'Use Google login for this account'})
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.status(401).json({success:false, message:'Invalid credentials'})
        }

        if (user.isBanned) {
            return res.status(403).json({success:false, message:'Account is banned. Contact support.'})
        }

        const token = createToken(user._id);
        res.json({success:true, token, role: user.role, name: user.name, email: user.email, avatar: user.avatar})
    } catch (error) {
        console.log(error)
        res.status(500).json({success:false, message:'Server error'})
    }
}

const createToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET)
}

const normalizeAvatar = (avatar) => avatar || "violet-smile";

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const buildAuthResponse = (user) => {
    const token = createToken(user._id)
    return {
        success:true,
        token,
        role: user.role,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
    }
}

//register user
const registerUser = async (req, res) =>{
    const {name,password,email,avatar} = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({success:false, message:'Name, email and password are required'})
        }

        if (name.trim().length < 2) {
            return res.status(400).json({success:false, message:'Invalid name'})
        }

        const normalizedEmail = email.toLowerCase().trim();

        // checking is user already exists
        const exists = await userModel.findOne({email: normalizedEmail});
        if(exists){
            return res.status(409).json({success:false, message:'User already exists'})
        }

        //validating email format and strong password
        if(!validator.isEmail(email)){
            return res.status(400).json({success:false, message:'Invalid email'})
        }

        if(typeof password !== 'string' || password.length<8){
            return res.status(400).json({success:false, message:'Invalid password'})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new userModel({
            name:name,
            email:normalizedEmail,
            avatar: normalizeAvatar(avatar),
            password:hashedPassword,
            role: 'user'
        })

      const user =  await newUser.save()
      res.json(buildAuthResponse(user))

    } catch (error) {
        console.log(error)
                res.status(500).json({success:false, message:'Server error'})
    }
}

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success:false, message:'Valid email is required' })
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success:false, message:'Account not found' })
        }

        const otp = `${crypto.randomInt(100000, 999999)}`;
        user.resetPasswordOtpHash = hashOtp(otp);
        user.resetPasswordOtpExpiresAt = new Date(Date.now() + RESET_OTP_MINUTES * 60 * 1000);
        await user.save();

        console.log(`User password reset OTP for ${user.email}: ${otp}`);

        return res.json({
            success:true,
            message:'OTP generated successfully',
            otp: process.env.NODE_ENV !== "production" ? otp : undefined,
            expiresInMinutes: RESET_OTP_MINUTES,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success:false, message:'Unable to generate OTP' })
    }
}

const resetPassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    try {
        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success:false, message:'All reset fields are required' })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success:false, message:'Invalid email' })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success:false, message:'Passwords do not match' })
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ success:false, message:'Password must be at least 8 characters' })
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success:false, message:'Account not found' })
        }

        if (!user.resetPasswordOtpHash || !user.resetPasswordOtpExpiresAt) {
            return res.status(400).json({ success:false, message:'OTP request not found' })
        }

        if (user.resetPasswordOtpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ success:false, message:'OTP has expired' })
        }

        if (hashOtp(otp) !== user.resetPasswordOtpHash) {
            return res.status(400).json({ success:false, message:'Invalid OTP' })
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(newPassword, salt)
        user.resetPasswordOtpHash = ""
        user.resetPasswordOtpExpiresAt = null
        await user.save()

        return res.json({ success:true, message:'Password reset successful' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success:false, message:'Unable to reset password' })
    }
}

const startGoogleAuth = async (req, res) => {
    try {
        const mode = req.query.mode === "signup" ? "signup" : "login";
        const state = jwt.sign({ mode }, process.env.JWT_SECRET, { expiresIn: "10m" });
        const callbackUrl = getGoogleCallbackUrl(req);
        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: callbackUrl,
            response_type: "code",
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account",
            state,
        });

        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
        console.log(error);
        return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Unable to start Google login")}`);
    }
}

const googleAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Google authentication failed")}`);
        }

        const decodedState = jwt.verify(state, process.env.JWT_SECRET);
        const mode = decodedState.mode === "signup" ? "signup" : "login";
        const callbackUrl = getGoogleCallbackUrl(req);

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: callbackUrl,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Google token exchange failed")}`);
        }

        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileResponse.json();

        if (!profileResponse.ok || !profile.email) {
            return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Unable to load Google profile")}`);
        }

        let user = await userModel.findOne({
            $or: [
                { googleId: profile.id },
                { email: profile.email.toLowerCase() },
            ],
        });

        if (!user) {
            const generatedPassword = await bcrypt.hash(crypto.randomUUID(), 10);
            user = await userModel.create({
                name: profile.name || profile.email.split("@")[0],
                email: profile.email.toLowerCase(),
                googleId: profile.id,
                avatar: "sky-cool",
                password: generatedPassword,
                role: "user",
            });
        } else {
            user.googleId = user.googleId || profile.id;
            user.name = user.name || profile.name || profile.email.split("@")[0];
            user.avatar = user.avatar || "sky-cool";
            await user.save();
        }

        if (user.isBanned) {
            return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Account is banned. Contact support.")}`);
        }

        const auth = buildAuthResponse(user);
        const redirectPath = mode === "signup" ? "/signup" : "/login";
        const params = new URLSearchParams({
            googleAuth: "success",
            token: auth.token,
            role: auth.role,
            name: auth.name,
            email: auth.email,
            avatar: auth.avatar || "violet-smile",
        });

        return res.redirect(`${FRONTEND_URL}${redirectPath}?${params.toString()}`);
    } catch (error) {
        console.log(error);
        return res.redirect(`${FRONTEND_URL}/login?authError=${encodeURIComponent("Google authentication failed")}`);
    }
}

const listUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ role: { $ne: 'admin' } })
            .select('name email avatar role isBanned createdAt')
            .sort({ createdAt: -1 });
        return res.json({ success: true, data: users });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success:false, message:'Server error' })
    }
}

const toggleBanUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success:false, message:'User id required' })

        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ success:false, message:'User not found' })
        if (user.role === 'admin') return res.status(400).json({ success:false, message:'Cannot ban admin' })

        user.isBanned = !user.isBanned;
        await user.save();
        return res.json({ success:true, message: user.isBanned ? 'User banned' : 'User unbanned' });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success:false, message:'Server error' })
    }
}

const removeUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success:false, message:'User id required' })

        const user = await userModel.findById(id);
        if (!user) return res.status(404).json({ success:false, message:'User not found' })
        if (user.role === 'admin') return res.status(400).json({ success:false, message:'Cannot delete admin' })

        await userModel.findByIdAndDelete(id);
        return res.json({ success:true, message:'User deleted' });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success:false, message:'Server error' })
    }
}

export {
    loginUser,
    registerUser,
    requestPasswordReset,
    resetPassword,
    startGoogleAuth,
    googleAuthCallback,
    listUsers,
    toggleBanUser,
    removeUser,
}
