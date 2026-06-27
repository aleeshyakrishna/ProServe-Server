import { Router } from "express";
import {
  getBookingController,
  createBookingController,
  getAllBookingsController,
  updateBookingController,
  deleteBookingController,
} from "../controllers/booking.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";
import { requireRoles } from "../middlewares/authenticate.middleware";
import { createBookingSchema, updateBookingSchema } from "../validations/booking.schema";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// GET /api/bookings       — any authenticated user (CUSTOMER or SERVICE_PROVIDER)
router.get("/", getAllBookingsController);

// GET /api/bookings/:id   — any authenticated user
router.get("/:id", getBookingController);

// POST /api/bookings      — CUSTOMER or SERVICE_PROVIDER
router.post(
  "/",
  requireRoles("CUSTOMER", "SERVICE_PROVIDER"),
  validate(createBookingSchema),
  createBookingController
);

// PUT /api/bookings/:id   — CUSTOMER or SERVICE_PROVIDER (owner check in service layer)
router.put(
  "/:id",
  requireRoles("CUSTOMER", "SERVICE_PROVIDER"),
  validate(updateBookingSchema),
  updateBookingController
);

// DELETE /api/bookings/:id — ADMIN only
router.delete("/:id", requireRoles("ADMIN"), deleteBookingController);

export default router;
