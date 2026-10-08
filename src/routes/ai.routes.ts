import { Router } from "express";
import { handleAIChatController } from "../controllers/ai.controller";

const router = Router();

// POST /api/ai/chat - Process natural language query & return matching services from DB
router.post("/chat", handleAIChatController);

// POST /api/ai/search - Alias for search queries
router.post("/search", handleAIChatController);

export default router;
