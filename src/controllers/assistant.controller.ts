import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";
import { runAssistant } from "../services/assistant/assistant.service";

const bodySchema = z.object({
    message: z.string().trim().min(1).max(500),
    history: z
        .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(2000) }))
        .max(20)
        .optional(),
});

export const handleAssistantController = asyncHandler(async (req: Request, res: Response) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError("message (string, max 500 chars) is required; history must be [{ role, text }]", 400);
    }
    const result = await runAssistant(parsed.data.message, parsed.data.history ?? []);
    return res.status(200).json(successResponse(result, "Assistant reply generated"));
});
