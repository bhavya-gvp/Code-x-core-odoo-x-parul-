/**
 * adminRoutes.js — Admin-only endpoints
 * All routes protected by JWT + admin role check
 */

import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAdminStats,
  getAdminUsers,
  adminDeleteUser,
  adminVerifyUser,
  getAdminTrips,
} from "../controllers/adminController.js";
import { paginationValidator } from "../validators/tripValidator.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/stats",         getAdminStats);
router.get("/users",         paginationValidator, getAdminUsers);
router.get("/trips",         paginationValidator, getAdminTrips);
router.delete("/users/:id",  adminDeleteUser);
router.patch("/users/:id/verify", adminVerifyUser);

export default router;
