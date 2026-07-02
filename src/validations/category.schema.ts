import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be under 50 characters"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be under 50 characters"),
  description: z.string().optional(),
  iconName: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be under 50 characters").optional(),
  slug: z.string().min(1, "Slug is required").max(50, "Slug must be under 50 characters").optional(),
  description: z.string().optional(),
  iconName: z.string().optional(),
  imageUrl: z.string().optional(),
});
