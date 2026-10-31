import { Router } from "express";
import { handleAIChatController } from "../controllers/ai.controller";
import { handleAssistantController } from "../controllers/assistant.controller";

const router = Router();

// POST /api/ai/chat - Process natural language query & return matching services from DB
router.post("/chat", handleAIChatController);

// POST /api/ai/search - Alias for search queries
router.post("/search", handleAIChatController);

// POST /api/ai/assistant - AI booking assistant (Gemini function calling with read-only tools)
router.post("/assistant", handleAssistantController);

export default router;
