import { Router } from "express";
import {
  getServiceController,
  createServiceController,
  getAllServicesController,
  updateServiceController,
  deleteServiceController,
} from "../controllers/service.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";
import { requireRoles } from "../middlewares/authenticate.middleware";
import { createServiceSchema, updateServiceSchema } from "../validations/service.schema";

const router = Router();

// GET /api/services       — public (no auth required, anyone can browse)
router.get("/", getAllServicesController);

// GET /api/services/:id   — public
router.get("/:id", getServiceController);

// POST /api/services      — SERVICE_PROVIDER only
router.post(
  "/",
  authenticate,
  requireRoles("SERVICE_PROVIDER"),
  validate(createServiceSchema),
  createServiceController
);

// PUT /api/services/:id   — SERVICE_PROVIDER only (owner check in service layer)
router.put(
  "/:id",
  authenticate,
  requireRoles("SERVICE_PROVIDER"),
  validate(updateServiceSchema),
  updateServiceController
);

// DELETE /api/services/:id — ADMIN only
router.delete("/:id", authenticate, requireRoles("ADMIN"), deleteServiceController);

export default router;
