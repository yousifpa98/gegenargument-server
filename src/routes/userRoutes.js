import express from "express";
import { registerUser, loginUser, getProfile, getAllUsers, logoutUser } from "../controllers/userController.js";
import { authenticate } from "../middleware/jwt.js";
import { roleCheck } from "../middleware/roleCheck.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Private
router.get("/me", authenticate, getProfile);

// Admin-only
router.get("/all", authenticate, roleCheck("admin"), getAllUsers);


export default router;
