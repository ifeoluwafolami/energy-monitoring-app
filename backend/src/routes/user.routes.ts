import { getAllUsers, getUserById, filterUsersByBusinessHub, filterUsersByRegion, loginUser, updateUser, deleteUser, filterUsersByBHAndRegion, getUserDashboardData, getAdminDashboardData } from "../controllers/user.controller";
import { submitTodayReadings } from "../controllers/feederReading.controller";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { Router } from "express";
import { authorizeSelfOrAdmin } from "../middleware/authorizeSelfOrAdmin";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validateMiddleware";

const router = Router();

// Admin Only Routes - Users
router.get('/', protect, adminOnly, getAllUsers);

router.get(
  '/filter/by-businessHub',
  protect,
  adminOnly,
  query("businessHub").optional().isMongoId().withMessage("Invalid business hub ID"),
  validate,
  filterUsersByBusinessHub
);

router.get(
  '/filter/by-region',
  protect,
  adminOnly,
  query("region").optional().isMongoId().withMessage("Invalid region ID"),
  validate,
  filterUsersByRegion
);

router.get(
  '/filter/by-region-and-bhub',
  protect,
  adminOnly,
  query("region").optional().isMongoId().withMessage("Invalid region ID"),
  query("businessHub").optional().isMongoId().withMessage("Invalid business hub ID"),
  validate,
  filterUsersByBHAndRegion
);

// Public Routes
router.post(
  '/login',
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
  loginUser
);

// Admin & User: View own profile (Admin can view other profiles)
router.get(
  '/:id',
  protect,
  authorizeSelfOrAdmin,
  param("id").isMongoId().withMessage("Invalid user ID"),
  validate,
  getUserById
);

router.put(
  '/:id',
  protect,
  authorizeSelfOrAdmin,
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("email").optional().isEmail().withMessage("Valid email required"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  // Add more body validators as needed for other updatable fields
  validate,
  updateUser
);

router.delete(
  '/:id',
  protect,
  authorizeSelfOrAdmin,
  param("id").isMongoId().withMessage("Invalid user ID"),
  validate,
  deleteUser
);

// User Dashboards
router.get('/dashboard', protect, getUserDashboardData);
router.post('/dashboard/readings', protect, submitTodayReadings);

// Admin Dashboard
router.get("/admin-dashboard", protect, adminOnly, getAdminDashboardData);

export default router;