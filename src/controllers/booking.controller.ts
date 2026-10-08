import { Request, Response } from "express";
import { 
    getBookingById, 
    createBooking, 
    getAllBookings, 
    updateBooking, 
    deleteBooking 
} from "../services/booking.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { BookingStatus } from "../types";

export const getBookingController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const booking = await getBookingById(id);
    if (!booking) {
        throw new AppError("Booking not found", 404);
    }
    return res.status(200).json(
        successResponse(booking, "Booking fetched successfully")
    );
});

export const createBookingController = asyncHandler(async (req: Request, res: Response) => {
    const { userId, serviceId, scheduledAt, status, address, propertyType, notes, timeSlot, totalPrice, paymentMethod } = req.body;
    const booking = await createBooking({
        userId,
        serviceId,
        scheduledAt: new Date(scheduledAt),
        status,
        address,
        propertyType,
        notes,
        timeSlot,
        totalPrice,
        paymentMethod
    });
    return res.status(201).json(
        successResponse(booking, "Booking created successfully")
    );
});

export const getAllBookingsController = asyncHandler(async (req: Request, res: Response) => {
    const { userId, providerId, status } = req.query;

    const filters: {
        userId?: string;
        providerId?: string;
        status?: BookingStatus;
    } = {};

    if (userId) filters.userId = String(userId);
    if (providerId) filters.providerId = String(providerId);
    if (status) {
        const statusUpper = String(status).toUpperCase();
        const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
        if (!validStatuses.includes(statusUpper)) {
            throw new AppError("Invalid status query parameter", 400);
        }
        filters.status = statusUpper as BookingStatus;
    }

    const bookings = await getAllBookings(filters);
    return res.status(200).json(
        successResponse(bookings, "Bookings fetched successfully")
    );
});

export const updateBookingController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const booking = await getBookingById(id);
    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    const updatedBooking = await updateBooking(id, req.body);
    return res.status(200).json(
        successResponse(updatedBooking, "Booking updated successfully")
    );
});

export const deleteBookingController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const booking = await getBookingById(id);
    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    await deleteBooking(id);
    return res.status(200).json(
        successResponse(null, "Booking deleted successfully")
    );
});
