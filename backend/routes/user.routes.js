import express from "express";
import { handleUserLogIn, handleUserSignUp, handleDeviceToken, handleUserLogOut } from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
const router = express.Router();

router.post('/signup', handleUserSignUp);
router.post('/login', handleUserLogIn);
router.post('/device-token', authMiddleware, handleDeviceToken);
router.post('/logout', authMiddleware, handleUserLogOut);
export default router;