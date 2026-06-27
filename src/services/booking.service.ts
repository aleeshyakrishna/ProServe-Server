import { Booking, BookingStatus } from "../types";
import { getUserService } from "./user.service";
import { getServiceById } from "./service.service";
import { AppError } from "../utils/AppError";
import crypto from "crypto";
import { db } from "../db/index";
import { bookings, services } from "../db/schema";
import { and, eq, ne } from "drizzle-orm";

export const getBookingById = async (id: string): Promise<Booking | undefined> => {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    const booking = result[0];
    if (!booking) return undefined;
    return booking as Booking;
};

export const createBooking = async (bookingData: {
    userId: string;
    serviceId: string;
    scheduledAt: Date;
    status?: BookingStatus;
}): Promise<Booking> => {
    // 1. Verify customer (user) exists and is active
    const customer = await getUserService(bookingData.userId);
    if (!customer) {
        throw new AppError("Customer not found", 404);
    }
    if (!customer.isActive) {
        throw new AppError("Customer account is inactive", 400);
    }

    // 2. Verify service exists and is available
    const service = await getServiceById(bookingData.serviceId);
    if (!service) {
        throw new AppError("Service not found", 404);
    }
    if (!service.isAvailable) {
        throw new AppError("This service is currently unavailable", 400);
    }

    // 3. Verify provider is active
    const provider = await getUserService(service.providerId);
    if (!provider || !provider.isActive) {
        throw new AppError("Service provider is currently inactive or not found", 400);
    }

    // 4. Double-booking check: Ensure provider does not have another booking within 1 hour
    const scheduledTime = new Date(bookingData.scheduledAt).getTime();
    const oneHourInMs = 60 * 60 * 1000;

    const existingBookings = await db
        .select({
            id: bookings.id,
            scheduledAt: bookings.scheduledAt,
            status: bookings.status
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(
            and(
                eq(services.providerId, service.providerId),
                ne(bookings.status, "CANCELLED")
            )
        );

    for (const b of existingBookings) {
        const existingTime = new Date(b.scheduledAt).getTime();
        const timeDiff = Math.abs(existingTime - scheduledTime);

        if (timeDiff < oneHourInMs) {
            throw new AppError(
                "The service provider has a conflicting appointment scheduled within 1 hour of this time.",
                409
            );
        }
    }

    const id = `bkg_${crypto.randomUUID().substring(0, 8)}`;
    const newBookingVal = {
        id,
        userId: bookingData.userId,
        serviceId: bookingData.serviceId,
        scheduledAt: bookingData.scheduledAt,
        status: bookingData.status || "PENDING",
        createdAt: new Date()
    };

    await db.insert(bookings).values(newBookingVal);
    return newBookingVal as Booking;
};

export const getAllBookings = async (filters?: {
    userId?: string;
    providerId?: string;
    status?: BookingStatus;
}): Promise<Booking[]> => {
    const conditions = [];

    if (filters?.userId) {
        conditions.push(eq(bookings.userId, filters.userId));
    }
    if (filters?.status) {
        conditions.push(eq(bookings.status, filters.status));
    }

    let result;
    if (filters?.providerId) {
        conditions.push(eq(services.providerId, filters.providerId));
        result = await db
            .select({
                id: bookings.id,
                userId: bookings.userId,
                serviceId: bookings.serviceId,
                scheduledAt: bookings.scheduledAt,
                status: bookings.status,
                createdAt: bookings.createdAt
            })
            .from(bookings)
            .innerJoin(services, eq(bookings.serviceId, services.id))
            .where(and(...conditions));
    } else {
        if (conditions.length > 0) {
            result = await db.select().from(bookings).where(and(...conditions));
        } else {
            result = await db.select().from(bookings);
        }
    }

    return result as Booking[];
};

export const updateBooking = async (
    id: string,
    updateData: Partial<Omit<Booking, "id" | "createdAt">>
): Promise<Booking | undefined> => {
    const currentBooking = await getBookingById(id);
    if (!currentBooking) {
        return undefined;
    }

    // Enforce Booking state machine transitions
    if (updateData.status && currentBooking.status !== updateData.status) {
        const current = currentBooking.status;
        const target = updateData.status;

        const validTransitions: Record<BookingStatus, BookingStatus[]> = {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["COMPLETED", "CANCELLED"],
            COMPLETED: [],
            CANCELLED: []
        };

        const allowedTargets = validTransitions[current];
        if (!allowedTargets.includes(target)) {
            throw new AppError(
                `Invalid booking status transition. Cannot transition from '${current}' to '${target}'.`,
                400
            );
        }
    }

    // If scheduledAt is updated, check provider availability and double bookings again
    if (updateData.scheduledAt && new Date(updateData.scheduledAt).getTime() !== new Date(currentBooking.scheduledAt).getTime()) {
        const targetTime = new Date(updateData.scheduledAt).getTime();
        const oneHourInMs = 60 * 60 * 1000;
        const service = await getServiceById(currentBooking.serviceId);

        if (service) {
            const existingBookings = await db
                .select({
                    id: bookings.id,
                    scheduledAt: bookings.scheduledAt,
                    status: bookings.status
                })
                .from(bookings)
                .innerJoin(services, eq(bookings.serviceId, services.id))
                .where(
                    and(
                        eq(services.providerId, service.providerId),
                        ne(bookings.status, "CANCELLED"),
                        ne(bookings.id, id)
                    )
                );

            for (const b of existingBookings) {
                const existingTime = new Date(b.scheduledAt).getTime();
                const timeDiff = Math.abs(existingTime - targetTime);

                if (timeDiff < oneHourInMs) {
                    throw new AppError(
                        "The service provider has a conflicting appointment scheduled within 1 hour of the new time.",
                        409
                    );
                }
            }
        }
    }

    await db.update(bookings).set(updateData).where(eq(bookings.id, id));
    return getBookingById(id);
};

export const deleteBooking = async (id: string): Promise<boolean> => {
    const currentBooking = await getBookingById(id);
    if (!currentBooking) {
        return false;
    }

    await db.delete(bookings).where(eq(bookings.id, id));
    return true;
};
