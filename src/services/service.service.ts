import { Service, ServiceCategory } from "../types";
import { getUserService } from "./user.service";
import crypto from "crypto";
import { AppError } from "../utils/AppError";
import { db } from "../db/index";
import { services } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const getServiceById = async (id: string): Promise<Service | undefined> => {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    const service = result[0];
    if (!service) return undefined;
    return service as Service;
};

export const createService = async (serviceData: {
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    providerId: string;
    isAvailable?: boolean;
}): Promise<Service> => {
    const provider = await getUserService(serviceData.providerId);
    if (!provider) {
        throw new AppError("Target service provider not found", 404);
    }
    if (provider.role !== "PROVIDER") {
        throw new AppError("The target user is not registered as a service provider", 400);
    }

    const id = `srv_${crypto.randomUUID().substring(0, 8)}`;
    const newServiceVal = {
        id,
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category,
        price: serviceData.price,
        providerId: serviceData.providerId,
        isAvailable: serviceData.isAvailable !== undefined ? serviceData.isAvailable : true
    };

    await db.insert(services).values(newServiceVal);
    return newServiceVal as Service;
};

export const getAllServices = async (filters?: {
    category?: ServiceCategory;
    providerId?: string;
    isAvailable?: boolean;
}): Promise<Service[]> => {
    const query = db.select().from(services);
    const conditions = [];

    if (filters) {
        if (filters.category) {
            conditions.push(eq(services.category, filters.category));
        }
        if (filters.providerId) {
            conditions.push(eq(services.providerId, filters.providerId));
        }
        if (filters.isAvailable !== undefined) {
            conditions.push(eq(services.isAvailable, filters.isAvailable));
        }
    }

    let result;
    if (conditions.length > 0) {
        result = await query.where(and(...conditions));
    } else {
        result = await query;
    }

    return result as Service[];
};

export const updateService = async (
    id: string,
    updateData: Partial<Omit<Service, "id">>
): Promise<Service | undefined> => {
    const serviceResult = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (serviceResult.length === 0) {
        return undefined;
    }

    if (updateData.providerId) {
        const provider = await getUserService(updateData.providerId);
        if (!provider || provider.role !== "PROVIDER") {
            throw new AppError("Invalid or non-existent provider ID", 400);
        }
    }

    await db.update(services).set(updateData).where(eq(services.id, id));
    return getServiceById(id);
};

export const deleteService = async (id: string): Promise<boolean> => {
    const serviceResult = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (serviceResult.length === 0) {
        return false;
    }

    await db.delete(services).where(eq(services.id, id));
    return true;
};
