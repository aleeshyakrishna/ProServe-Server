import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { processUserAIRequest } from "../services/ai.service";
import { successResponse } from "../utils/response";
import { AppError } from "../utils/AppError";

export const handleAIChatController = asyncHandler(async (req: Request, res: Response) => {
  const message = req.body.message || req.body.prompt;
  
  if (!message || typeof message !== "string") {
    throw new AppError("Message prompt is required and must be a string", 400);
  }

  const result = await processUserAIRequest(message);
  
  return res.status(200).json(
    successResponse(result, "AI intent interpreted and database queried successfully")
  );
});
