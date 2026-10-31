import { Type, FunctionDeclaration } from "@google/genai";
import { z } from "zod";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "../../db";
import { bookings } from "../../db/schema";
import { getAllServices, getServiceById } from "../service.service";
import { Service } from "../../types";

/**
 * Read-only tools the booking assistant can call.
 * There is deliberately NO "createBooking" tool: the user confirms a booking
 * themselves by clicking "Book" in the UI (human checkpoint).
 */

export const CATEGORIES = ["CLEANING", "ELECTRICAL", "PLUMBING", "SALON", "CONSULTATION"] as const;

// Standard daily slots offered by providers (a service is free in a slot unless an active booking holds it)
export const TIME_SLOTS = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"] as const;

// ---------- argument schemas (model output is untrusted, so every call is validated) ----------
const searchArgs = z.object({
    category: z.enum(CATEGORIES).optional(),
    maxPrice: z.number().positive().max(100000).optional(),
    searchQuery: z.string().trim().min(1).max(100).optional(),
});
const detailsArgs = z.object({ serviceId: z.string().uuid() });
const availabilityArgs = z.object({
    serviceId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

// ---------- declarations sent to Gemini ----------
export const toolDeclarations: FunctionDeclaration[] = [
    {
        name: "searchServices",
        description:
            "Search available ProServe services. Use when the user describes a service need. All filters are optional; combine them when the user gives a category, budget or keywords.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING, enum: [...CATEGORIES], description: "Service category" },
                maxPrice: { type: Type.NUMBER, description: "Maximum price in AED" },
                searchQuery: { type: Type.STRING, description: "Short keywords, e.g. 'deep clean' or 'AC'" },
            },
        },
    },
    {
        name: "getServiceDetails",
        description: "Get full details of one service by its id (from a previous search result).",
        parameters: {
            type: Type.OBJECT,
            properties: { serviceId: { type: Type.STRING } },
            required: ["serviceId"],
        },
    },
    {
        name: "checkAvailability",
        description: "List free time slots for a service on a given date (YYYY-MM-DD).",
        parameters: {
            type: Type.OBJECT,
            properties: { serviceId: { type: Type.STRING }, date: { type: Type.STRING } },
            required: ["serviceId", "date"],
        },
    },
];

const toCard = (s: Service) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    price: s.price,
    description: s.description?.slice(0, 160),
});

export type ToolResult = { ok: true; data: unknown; services?: Service[] } | { ok: false; error: string };

/** Runs one tool call after validating its arguments. Never throws. */
export const runTool = async (name: string, rawArgs: unknown): Promise<ToolResult> => {
    try {
        switch (name) {
            case "searchServices": {
                const args = searchArgs.parse(rawArgs ?? {});
                const found = await getAllServices({ ...args, isAvailable: true });
                const top = found.slice(0, 8);
                return { ok: true, data: { count: found.length, services: top.map(toCard) }, services: top };
            }
            case "getServiceDetails": {
                const { serviceId } = detailsArgs.parse(rawArgs);
                const service = await getServiceById(serviceId);
                if (!service || !service.isAvailable) return { ok: false, error: "Service not found" };
                return { ok: true, data: toCard(service), services: [service] };
            }
            case "checkAvailability": {
                const { serviceId, date } = availabilityArgs.parse(rawArgs);
                const dayStart = new Date(`${date}T00:00:00`);
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const taken = await db
                    .select({ timeSlot: bookings.timeSlot })
                    .from(bookings)
                    .where(
                        and(
                            eq(bookings.serviceId, serviceId),
                            gte(bookings.scheduledAt, dayStart),
                            lt(bookings.scheduledAt, dayEnd),
                            ne(bookings.status, "CANCELLED")
                        )
                    );
                const takenSlots = new Set(taken.map((b) => b.timeSlot));
                const free = TIME_SLOTS.filter((slot) => !takenSlots.has(slot));
                return { ok: true, data: { serviceId, date, freeSlots: free } };
            }
            default:
                return { ok: false, error: `Unknown tool: ${name}` };
        }
    } catch (err: any) {
        const message = err instanceof z.ZodError ? `Invalid arguments: ${err.issues.map((i) => i.message).join("; ")}` : "Tool failed";
        return { ok: false, error: message };
    }
};
