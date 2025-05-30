import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { createRegion, deleteRegion, getAllRegions, getRegion, updateRegion } from "../controllers/region.controller";
import { body, param } from "express-validator";
import { validate } from "../middleware/validateMiddleware";

const router = Router();

router.post(
  "/",
  protect,
  adminOnly,
  body("name").notEmpty().withMessage("Name is required"),
  validate,
  createRegion
);

router.get("/", protect, adminOnly, getAllRegions);

router.get(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid region ID"),
  validate,
  getRegion
);

router.put(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid region ID"),
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  validate,
  updateRegion
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("Invalid region ID"),
  validate,
  deleteRegion
);

export default router;