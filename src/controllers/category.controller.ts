import { Request, Response } from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "../services/category.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const getCategoriesController = asyncHandler(async (req: Request, res: Response) => {
  const list = await getAllCategories();
  return res.status(200).json(successResponse(list, "Categories fetched successfully"));
});

export const getCategoryByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await getCategoryById(id);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return res.status(200).json(successResponse(category, "Category fetched successfully"));
});

export const createCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const category = await createCategory(req.body);
  return res.status(201).json(successResponse(category, "Category created successfully"));
});

export const updateCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const exists = await getCategoryById(id);
  if (!exists) {
    throw new AppError("Category not found", 404);
  }

  const updated = await updateCategory(id, req.body);
  return res.status(200).json(successResponse(updated, "Category updated successfully"));
});

export const deleteCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const exists = await getCategoryById(id);
  if (!exists) {
    throw new AppError("Category not found", 404);
  }

  await deleteCategory(id);
  return res.status(200).json(successResponse(null, "Category deleted successfully"));
});
