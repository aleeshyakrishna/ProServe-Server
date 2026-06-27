import { Router } from "express";
import {
  getUserController,
  createUserController,
  getAllUserController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";
import { requireRoles } from "../middlewares/authenticate.middleware";
import { createUserSchema, updateUserSchema } from "../validations/user.schema";

const router = Router();

// All user routes require a valid session
router.use(authenticate);

// GET /api/users        — any authenticated user
router.get("/", getAllUserController);

// GET /api/users/:id    — any authenticated user
router.get("/:id", getUserController);

// POST /api/users       — ADMIN only
router.post("/", requireRoles("ADMIN"), validate(createUserSchema), createUserController);

// PUT /api/users/:id    — ADMIN only
router.put("/:id", requireRoles("ADMIN"), validate(updateUserSchema), updateUserController);

// DELETE /api/users/:id — ADMIN only
router.delete("/:id", requireRoles("ADMIN"), deleteUserController);

export default router;
