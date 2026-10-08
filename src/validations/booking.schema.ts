import { z } from "zod";

export const createBookingSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    serviceId: z.string().min(1, "Service ID is required"),
    scheduledAt: z.coerce.date().refine((date) => date > new Date(), {
        message: "scheduledAt must be a future date"
    }),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).default("PENDING"),
    address: z.string().optional(),
    propertyType: z.string().optional(),
    notes: z.string().optional(),
    timeSlot: z.string().optional(),
    totalPrice: z.number().optional(),
    paymentMethod: z.string().optional()
});

export const updateBookingSchema = z.object({
    userId: z.string().min(1, "User ID is required").optional(),
    serviceId: z.string().min(1, "Service ID is required").optional(),
    scheduledAt: z.coerce.date().refine((date) => date > new Date(), {
        message: "scheduledAt must be a future date"
    }).optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
    address: z.string().optional(),
    propertyType: z.string().optional(),
    notes: z.string().optional(),
    timeSlot: z.string().optional(),
    totalPrice: z.number().optional(),
    paymentMethod: z.string().optional()
});
