import { body, param, query } from "express-validator";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { createBusinessHub, deleteBusinessHub, filterBusinessHubsByRegion, getAllBusinessHubs, getBusinessHub, updateBusinessHub } from "../controllers/businessHub.controller";
import { Router } from "express";
import { validate } from "../middleware/validateMiddleware";

const router = Router();

router.post(
  "/",
  protect,
  adminOnly,
  body("name").notEmpty().withMessage("Name is required"),
  body("region").notEmpty().withMessage("Region is required"),
  validate,
  createBusinessHub
);

router.get(
  "/",
  protect,
  adminOnly,
  getAllBusinessHubs
);

router.get(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid business hub ID"),
  validate,
  getBusinessHub
);

router.get(
  "/filter/by-region",
  protect,
  adminOnly,
  query("region").notEmpty().withMessage("Region is required"),
  validate,
  filterBusinessHubsByRegion
);

router.put(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid business hub ID"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("region").optional().notEmpty().withMessage("Region cannot be empty"),
  validate,
  updateBusinessHub
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid business hub ID"),
  validate,
  deleteBusinessHub
);

export default router;