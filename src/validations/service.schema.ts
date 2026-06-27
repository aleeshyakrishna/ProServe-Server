import { z } from "zod";

const categories = ["PLUMBING", "ELECTRICAL", "CLEANING", "SALON", "CONSULTATION"] as const;

export const createServiceSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
    description: z.string().min(1, "Description is required"),
    category: z.enum(categories),
    price: z.number().positive("Price must be a positive number"),
    providerId: z.string().min(1, "Provider ID is required"),
    isAvailable: z.boolean().default(true)
});

export const updateServiceSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters").optional(),
    description: z.string().min(1, "Description is required").optional(),
    category: z.enum(categories).optional(),
    price: z.number().positive("Price must be a positive number").optional(),
    providerId: z.string().min(1, "Provider ID is required").optional(),
    isAvailable: z.boolean().optional()
});
