import express from "express";
import { handleUserLogIn, handleUserSignUp } from "../controller/user.controller.js";
const router = express.Router();

router.post('/signup', handleUserSignUp);
router.post('/login', handleUserLogIn)

export default router;