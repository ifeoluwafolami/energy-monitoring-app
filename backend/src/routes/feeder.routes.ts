import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { createRegion, deleteRegion, getAllRegions, getRegion, updateRegion } from "../controllers/region.controller";
import { filterFeedersByBand, filterFeedersByBHAndRegion, filterFeedersByBusinessHub, filterFeedersByRegion } from "../controllers/feeder.controller";
import feederReadingRoutes from "./feederReading.routes";
import { body, param, query } from "express-validator";
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

router.get(
  "/filter/by-region",
  protect,
  adminOnly,
  query("region").notEmpty().withMessage("Region is required"),
  validate,
  filterFeedersByRegion
);

router.get(
  "/filter/by-business-hub",
  protect,
  adminOnly,
  query("businessHub").notEmpty().withMessage("Business hub is required"),
  validate,
  filterFeedersByBusinessHub
);

router.get(
  "/filter/by-band",
  protect,
  adminOnly,
  query("band").notEmpty().withMessage("Band is required"),
  validate,
  filterFeedersByBand
);

router.get(
  "/filter/by-region-and-hub",
  protect,
  adminOnly,
  query("region").notEmpty().withMessage("Region is required"),
  query("businessHub").notEmpty().withMessage("Business hub is required"),
  validate,
  filterFeedersByBHAndRegion
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

router.use("/:feederId/readings", feederReadingRoutes);

export default router;