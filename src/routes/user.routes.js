
import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

const user = new userController();

router.route("/register").post(user.registerUser)
router.route("/verify-user").post(user.verifyUser)
router.route("/login").post(user.loginUser)
router.route("/refresh-access-token").get(user.refreshAccessToken)
router.route("/get-current-user").get(verifyJWT,user.getCurrentUser)

export default router;