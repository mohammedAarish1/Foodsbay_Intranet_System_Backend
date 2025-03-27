import { Router } from "express";
import { loginUser, logoutUser, refreshToken, registerUser,  } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();


router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshToken)

//secured routes
// router.route('/verify-token').get(verifyJWT, verifyToken)
router.route('/logout').post(verifyJWT, logoutUser)

export default router;