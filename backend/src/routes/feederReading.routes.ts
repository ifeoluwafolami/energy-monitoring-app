import { Router } from "express";
import { createFeederReading, deleteFeederReading, getAllFeederReadings, getFeederReading, getFeederReadingsByDate, getReadingsByFeeder, getReadingsByRegionOrHub, updateFeederReading } from "../controllers/feederReading.controller";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { body, param, query } from "express-validator";
import { validate } from "../middleware/validateMiddleware";

const router = Router({ mergeParams: true }); // Add mergeParams to access parent router params

// Protected (user and admin) Routes
router.post(
  "/",
  protect,
  body("feeder").notEmpty().withMessage("Feeder is required").isMongoId().withMessage("Feeder must be a valid ID"),
  body("cumulativeEnergyConsumption").isNumeric().withMessage("Cumulative energy consumption must be a number"),
  // Add more body validators as needed
  validate,
  createFeederReading
);

router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid feeder reading ID"),
  validate,
  getFeederReading
);

router.put(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid feeder reading ID"),
  // Add body validators for updatable fields if needed
  validate,
  updateFeederReading
);

// Admin Only
router.get("/", protect, adminOnly, getAllFeederReadings);

router.get(
  "/feeder/:feederId",
  protect,
  adminOnly,
  param("feederId").isMongoId().withMessage("Invalid feeder ID"),
  validate,
  getReadingsByFeeder
);

router.get(
  "/feeder/:feederId/date",
  protect,
  adminOnly,
  param("feederId").isMongoId().withMessage("Invalid feeder ID"),
  query("date").optional().isISO8601().withMessage("Date must be in ISO8601 format"),
  validate,
  getFeederReadingsByDate
);

router.get(
  "/filter",
  protect,
  adminOnly,
  query("region").optional(), // Removed isMongoId validation since controller may expect region name
  query("businessHub").optional(), // Removed isMongoId validation since controller may expect business hub name
  validate,
  getReadingsByRegionOrHub
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid feeder reading ID"),
  validate,
  deleteFeederReading
);

export default router;