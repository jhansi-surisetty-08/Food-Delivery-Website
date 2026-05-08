import express from 'express'
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  startGoogleAuth,
  googleAuthCallback,
  listUsers,
  toggleBanUser,
  removeUser,
} from '../controllers/userController.js'
import { requireRoles } from '../middleware/adminAuth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/forgot-password', requestPasswordReset)
userRouter.post('/reset-password', resetPassword)
userRouter.get('/auth/google', startGoogleAuth)
userRouter.get('/auth/google/callback', googleAuthCallback)
userRouter.get('/list', requireRoles('admin'), listUsers)
userRouter.post('/ban-toggle', requireRoles('admin'), toggleBanUser)
userRouter.post('/remove', requireRoles('admin'), removeUser)

export default userRouter;
