import { User, Provider, Role } from "../models";
import crypto from "crypto";
import { db } from "../db/index";
import { users, services } from "../db/schema";
import { eq } from "drizzle-orm";

export const getUserService = async (id: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    if (!user) {
        return undefined;
    }

    if (user.role === "PROVIDER") {
        const providerServices = await db
            .select({ id: services.id })
            .from(services)
            .where(eq(services.providerId, id));

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: "PROVIDER",
            isActive: user.isActive,
            rating: user.rating ?? undefined,
            servicesOffered: providerServices.map(s => s.id),
            createdAt: user.createdAt
        } as Provider;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
    } as User;
};

export const createUserService = async (userData: {
    name: string;
    email: string;
    role: Role;
    servicesOffered?: string[];
    rating?: number;
}): Promise<User> => {
    const { name, email, role, servicesOffered, rating } = userData;

    const idPrefix = role === "PROVIDER" ? "prov_" : "usr_";
    const id = `${idPrefix}${crypto.randomUUID().substring(0, 8)}`;

    const newUserVal = {
        id,
        name,
        email,
        role,
        isActive: true,
        rating: rating !== undefined ? rating : null,
        createdAt: new Date()
    };

    await db.insert(users).values(newUserVal);

    if (role === "PROVIDER") {
        return {
            id,
            name,
            email,
            role: "PROVIDER",
            isActive: true,
            rating: rating,
            servicesOffered: servicesOffered || [],
            createdAt: newUserVal.createdAt
        } as Provider;
    }

    return {
        id,
        name,
        email,
        role,
        isActive: true,
        createdAt: newUserVal.createdAt
    } as User;
};

export const getAllUserService = async (role?: Role): Promise<User[]> => {
    let queryResult;
    if (role) {
        queryResult = await db.select().from(users).where(eq(users.role, role));
    } else {
        queryResult = await db.select().from(users);
    }

    const usersList: User[] = [];
    for (const u of queryResult) {
        if (u.role === "PROVIDER") {
            const providerServices = await db
                .select({ id: services.id })
                .from(services)
                .where(eq(services.providerId, u.id));

            usersList.push({
                id: u.id,
                name: u.name,
                email: u.email,
                role: "PROVIDER",
                isActive: u.isActive,
                rating: u.rating ?? undefined,
                servicesOffered: providerServices.map(s => s.id),
                createdAt: u.createdAt
            } as Provider);
        } else {
            usersList.push({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                createdAt: u.createdAt
            } as User);
        }
    }
    return usersList;
};

export const updateUserService = async (
    id: string,
    updateData: Partial<Omit<User, "id" | "createdAt">> & { servicesOffered?: string[]; rating?: number; }
): Promise<User | undefined> => {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (userResult.length === 0) {
        return undefined;
    }

    const { servicesOffered, rating, ...directFields } = updateData;

    const updatePayload: any = { ...directFields };
    if (rating !== undefined) {
        updatePayload.rating = rating;
    }

    if (Object.keys(updatePayload).length > 0) {
        await db.update(users).set(updatePayload).where(eq(users.id, id));
    }

    return getUserService(id);
};

export const deleteUserService = async (id: string): Promise<boolean> => {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (userResult.length === 0) {
        return false;
    }
    await db.delete(users).where(eq(users.id, id));
    return true;
};
