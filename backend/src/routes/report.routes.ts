import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import {
  generateFeederPerformanceReport,
  generateFeederSpecificReport,
  generateMonthlyReport,
  sendDailyAllFeedersReport
} from "../controllers/report.controller";
import { query, body } from "express-validator";
import { validate } from "../middleware/validateMiddleware";

const router = Router();

router.get(
  "/daily-report",
  query("specificDate").optional().isISO8601().withMessage("specificDate must be a valid date"),
  validate,
  sendDailyAllFeedersReport
);

router.get(
  "/feeders",
  query("startDate").notEmpty().withMessage("startDate is required").isISO8601().withMessage("startDate must be a valid date"),
  query("endDate").notEmpty().withMessage("endDate is required").isISO8601().withMessage("endDate must be a valid date"),
  query("region").optional().isString().withMessage("region must be a string"),
  query("businessHub").optional().isString().withMessage("businessHub must be a string"),
  validate,
  generateFeederPerformanceReport
);

router.get(
  "/monthly-report",
  query("month").notEmpty().withMessage("month is required").isInt({ min: 1, max: 12 }).withMessage("month must be 1-12"),
  query("year").notEmpty().withMessage("year is required").isInt({ min: 2000 }).withMessage("year must be a valid year"),
  query("region").optional().isString().withMessage("region must be a string"),
  query("businessHub").optional().isString().withMessage("businessHub must be a string"),
  validate,
  generateMonthlyReport
);

router.post(
  "/feeder-specific",
  body("feederIds").isArray({ min: 1 }).withMessage("feederIds must be a non-empty array"),
  body("feederIds.*").isMongoId().withMessage("Each feederId must be a valid Mongo ID"),
  body("startDate").notEmpty().withMessage("startDate is required").isISO8601().withMessage("startDate must be a valid date"),
  body("endDate").notEmpty().withMessage("endDate is required").isISO8601().withMessage("endDate must be a valid date"),
  validate,
  generateFeederSpecificReport
);

export default router;