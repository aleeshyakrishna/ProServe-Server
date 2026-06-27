import { z } from "zod"

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["USER", "PROVIDER", "ADMIN"]).default("USER"),
    servicesOffered: z.array(z.string()).optional(),
    rating: z.number().min(0).max(5).optional(),
}).refine(data => {
    if (data.role === "PROVIDER" && !data.servicesOffered) {
        return false
    }
    return true
}, {
    message: "servicesOffered is required when role is PROVIDER",
    path: ["servicesOffered"]
})

export const updateUserSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z.enum(["USER", "PROVIDER", "ADMIN"]).optional(),
    servicesOffered: z.array(z.string()).optional(),
    rating: z.number().min(0).max(5).optional(),
    isActive: z.boolean().optional()
}).refine(data => {
    if (data.role === "PROVIDER" && !data.servicesOffered) {
        return false
    }
    return true
}, {
    message: "servicesOffered is required when role is PROVIDER",
    path: ["servicesOffered"]
})