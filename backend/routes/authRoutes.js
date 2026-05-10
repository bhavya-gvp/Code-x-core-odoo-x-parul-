import { Router } from "express";
import { register, login, getProfile, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfileImage } from "../middleware/uploadMiddleware.js";
import { registerValidator, loginValidator, validate } from "../utils/validators.js";

const router = Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadProfileImage, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;
