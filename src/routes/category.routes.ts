import { Router } from "express";
import {
  getCategoriesController,
  getCategoryByIdController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/authenticate.middleware";
import { createCategorySchema, updateCategorySchema } from "../validations/category.schema";

const router = Router();

// GET /api/categories - public
router.get("/", getCategoriesController);

// GET /api/categories/:id - public
router.get("/:id", getCategoryByIdController);

// POST /api/categories - authenticated users (providers / admins)
router.post(
  "/",
  authenticate,
  validate(createCategorySchema),
  createCategoryController
);

// PUT /api/categories/:id - authenticated users
router.put(
  "/:id",
  authenticate,
  validate(updateCategorySchema),
  updateCategoryController
);

// DELETE /api/categories/:id - authenticated users
router.delete("/:id", authenticate, deleteCategoryController);

export default router;
