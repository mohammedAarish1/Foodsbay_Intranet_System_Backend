import { Router } from "express";
// import {  registerUser,  } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { handlePasswordChange, refreshToken, UserLogin, userLogout } from "../controllers/auth.controller.js";

const router=Router();


// router.route('/register').post(registerUser);
router.route('/login').post(UserLogin);
router.route('/change-password').post(handlePasswordChange);
router.route('/refresh-token').post(refreshToken)

//secured routes
// router.route('/verify-token').get(verifyJWT, verifyToken)
router.route('/logout').post(verifyJWT, userLogout)

export default router;