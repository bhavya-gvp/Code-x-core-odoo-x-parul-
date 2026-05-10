import { Router } from "express";
import {
  createTrip, getMyTrips, getTripById, updateTrip, deleteTrip,
  getPublicTrips, getTripBudget, generateTrip, parseTrip,
} from "../controllers/tripController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { uploadCoverImage } from "../middleware/uploadMiddleware.js";
import { tripValidator, paginationValidator, validate } from "../utils/validators.js";

const router = Router();

router.get("/public", optionalAuth, paginationValidator, validate, getPublicTrips);
router.get("/", protect, paginationValidator, validate, getMyTrips);
router.post("/", protect, uploadCoverImage, tripValidator, validate, createTrip);
router.post("/generate", protect, generateTrip);
router.post("/parse",    protect, parseTrip);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, uploadCoverImage, updateTrip);
router.delete("/:id", protect, deleteTrip);
router.get("/:id/budget", protect, getTripBudget);

export default router;
