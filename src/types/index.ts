export type Role = "USER" | "PROVIDER" | "ADMIN";

export type ServiceCategory =
    | "PLUMBING"
    | "ELECTRICAL"
    | "CLEANING"
    | "SALON"
    | "CONSULTATION";

export interface BaseUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
}

export interface Provider extends BaseUser {
    role: "PROVIDER";
    servicesOffered: string[]; // service IDs
    rating?: number; // optional
}

export interface Service {
    id: string;
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    providerId: any;
    isAvailable: boolean;
}

export type BookingStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED";

export interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    scheduledAt: Date;
    status: BookingStatus;
    address?: string | null;
    propertyType?: string | null;
    notes?: string | null;
    timeSlot?: string | null;
    totalPrice?: number | null;
    paymentMethod?: string | null;
    createdAt: Date;
}

export type User = BaseUser | Provider;