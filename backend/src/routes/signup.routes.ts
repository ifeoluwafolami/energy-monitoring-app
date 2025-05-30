import { submitSignupRequest, getSignupRequests, getOneSignupRequest, approveSignupRequest, rejectSignupRequest } from "../controllers/signup.controller";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { Router } from "express";
import { body, param } from "express-validator";
import { validate } from "../middleware/validateMiddleware";

const router = Router();

// Admin Only Routes - Sign Up Requests

// View all sign up requests
router.get('/requests', protect, adminOnly, getSignupRequests);

// View a specific sign up request
router.get(
  '/request/:id',
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid signup request ID"),
  validate,
  getOneSignupRequest
);

// Approve sign up request
router.post(
  '/request/approve/:id',
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid signup request ID"),
  validate,
  approveSignupRequest
);

// Reject sign up request
router.post(
  '/request/reject/:id',
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid signup request ID"),
  validate,
  rejectSignupRequest
);

// Public Route - Submit signup request
router.post(
  '/',
  body("email").isEmail().withMessage("Valid email is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("businessHub").notEmpty().withMessage("BusinessHub is required").isMongoId().withMessage("BusinessHub must be a valid ID"),
  body("region").notEmpty().withMessage("Region is required").isMongoId().withMessage("Region must be a valid ID"),
  validate,
  submitSignupRequest
);

export default router;