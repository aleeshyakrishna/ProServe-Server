import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getAllServices } from "./service.service";
import { ServiceCategory, Service } from "../types";

dotenv.config();

export interface AIQueryInterpretation {
    intent: "SEARCH_SERVICES" | "BOOK_SERVICE" | "GENERAL_QUERY";
    category?: ServiceCategory | null;
    maxPrice?: number | null;
    searchQuery?: string | null;
    requirements?: string | null;
    date?: string | null;
    time?: string | null;
    summary: string;
}

export interface AISearchResult {
    source: "GEMINI_AI" | "FALLBACK_RULES";
    interpretation: AIQueryInterpretation;
    reply: string;
    services: Service[];
}

const CATEGORY_NAMES: Record<ServiceCategory, string> = {
    CLEANING: "Cleaning & Housekeeping",
    ELECTRICAL: "Electrical & AC Repair",
    PLUMBING: "Plumbing Services",
    SALON: "Beauty & Salon Care",
    CONSULTATION: "Professional Consultation",
};

const SERVICE_KEYWORDS = [
    "clean", "maid", "housekeeping", "laundry", "mop", "wash",
    "ac", "electric", "wire", "light", "fan", "socket", "appliance",
    "plumb", "pipe", "leak", "drain", "faucet", "sink", "water", "heater",
    "salon", "hair", "beauty", "spa", "manicure", "facial", "massage", "pedicure",
    "consult", "advisor", "legal", "design", "architect", "service", "book", "fix", "repair"
];

/**
 * Intelligent conversational fallback parser used when live Gemini API quota is rate-limited.
 */
const fallbackRuleParser = (userPrompt: string): AIQueryInterpretation => {
    const lower = userPrompt.trim().toLowerCase();
    
    // Check for conversational / small-talk / general prompts
    const hasServiceKeyword = SERVICE_KEYWORDS.some((kw) => lower.includes(kw));
    const hasPriceConstraint = /(?:under|below|max|budget|aed|\$)\s*\d+|\d+\s*(?:aed|dollars|\$)/i.test(lower);

    if (!hasServiceKeyword && !hasPriceConstraint) {
        let conversationalReply = "I'm doing great, thank you for asking! I am your ProServe AI Assistant. How can I help you find home or professional services today?";

        if (lower.includes("how are you") || lower.includes("how do you do") || lower.includes("how r u")) {
            conversationalReply = "I'm doing fantastic, thank you! I'm ready to assist you with finding verified services across the UAE. What service are you looking for today?";
        } else if (lower.includes("who are you") || lower.includes("what is your name") || lower.includes("what are you")) {
            conversationalReply = "I am the ProServe AI Assistant! I help customers find trusted service providers for cleaning, AC repair, plumbing, salon care, and consultations.";
        } else if (lower.includes("what can you do") || lower.includes("help") || lower.includes("option")) {
            conversationalReply = "I can match you with top-rated professionals in the UAE! Try asking: 'Deep cleaning under 300 AED' or 'AC repair technician'.";
        } else if (lower.includes("thank") || lower.includes("thx")) {
            conversationalReply = "You're very welcome! Let me know whenever you need help finding services on ProServe.";
        }

        return {
            intent: "GENERAL_QUERY",
            category: null,
            maxPrice: null,
            searchQuery: null,
            requirements: userPrompt,
            summary: conversationalReply,
        };
    }

    let category: ServiceCategory | null = null;

    if (lower.includes("clean") || lower.includes("maid") || lower.includes("housekeeping") || lower.includes("laundry") || lower.includes("mop")) {
        category = "CLEANING";
    } else if (lower.includes("ac") || lower.includes("electric") || lower.includes("wire") || lower.includes("light") || lower.includes("fan") || lower.includes("socket")) {
        category = "ELECTRICAL";
    } else if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("leak") || lower.includes("drain") || lower.includes("faucet") || lower.includes("sink") || lower.includes("water")) {
        category = "PLUMBING";
    } else if (lower.includes("salon") || lower.includes("hair") || lower.includes("beauty") || lower.includes("spa") || lower.includes("manicure") || lower.includes("facial") || lower.includes("massage")) {
        category = "SALON";
    } else if (lower.includes("consult") || lower.includes("advisor") || lower.includes("legal") || lower.includes("design") || lower.includes("architect")) {
        category = "CONSULTATION";
    }

    // Extract price constraint
    let maxPrice: number | null = null;
    const priceMatch = lower.match(/(?:under|below|max|budget|aed|\$)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:aed|dollars|\$)/i);
    if (priceMatch && priceMatch[1]) {
        maxPrice = parseInt(priceMatch[1], 10);
    }

    const searchQuery = category ? null : userPrompt;

    let summaryText = "";
    if (category && maxPrice) {
        summaryText = `Searching for ${CATEGORY_NAMES[category]} under AED ${maxPrice}...`;
    } else if (category) {
        summaryText = `Searching for top-rated ${CATEGORY_NAMES[category]}...`;
    } else if (maxPrice) {
        summaryText = `Searching for services under AED ${maxPrice}...`;
    } else {
        summaryText = `Searching for services matching "${userPrompt}"...`;
    }

    return {
        intent: "SEARCH_SERVICES",
        category,
        maxPrice,
        searchQuery,
        requirements: userPrompt,
        summary: summaryText,
    };
};

/**
 * Uses Gemini AI to parse natural language user intent and query PostgreSQL via Drizzle ORM.
 */
export const processUserAIRequest = async (userPrompt: string): Promise<AISearchResult> => {
    dotenv.config();
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are an intelligent assistant for ProServe, a service marketplace app in the UAE.
Your task is to analyze user prompts and map them into structured search filters.

If the user is saying hello, hi, asking small talk ("how are you", "who are you"), set intent to "GENERAL_QUERY" and set category, maxPrice, and searchQuery to null. Provide a warm, conversational reply.

Valid categories for service search are:
- "CLEANING": House cleaning, apartment cleaning, maid services, deep cleaning, laundry.
- "ELECTRICAL": AC repair, electrical wiring, light installation, appliance repair.
- "PLUMBING": Pipe leaks, drain unblocking, faucet repair, water heater setup.
- "SALON": Haircut, beauty care, manicure, spa.
- "CONSULTATION": Professional advice, legal, home design, tech support.

If the user specifies budget/price limits (e.g. "under 250", "below AED 300"), extract maxPrice as a number.
Extract key search terms (e.g., "2 bedroom", "AC technician", "deep clean") into searchQuery.
`;

    let interpretation: AIQueryInterpretation | null = null;
    let source: "GEMINI_AI" | "FALLBACK_RULES" = "GEMINI_AI";

    try {
        let response: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: "gemini-3.8-flash",
                    contents: userPrompt,
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                intent: {
                                    type: Type.STRING,
                                    enum: ["SEARCH_SERVICES", "BOOK_SERVICE", "GENERAL_QUERY"],
                                },
                                category: {
                                    type: Type.STRING,
                                    enum: ["PLUMBING", "ELECTRICAL", "CLEANING", "SALON", "CONSULTATION"],
                                    nullable: true,
                                },
                                maxPrice: {
                                    type: Type.NUMBER,
                                    nullable: true,
                                },
                                searchQuery: {
                                    type: Type.STRING,
                                    nullable: true,
                                },
                                requirements: {
                                    type: Type.STRING,
                                    nullable: true,
                                },
                                date: {
                                    type: Type.STRING,
                                    nullable: true,
                                },
                                time: {
                                    type: Type.STRING,
                                    nullable: true,
                                },
                                summary: {
                                    type: Type.STRING,
                                    description: "A friendly, natural response summarizing what was understood or replying to conversational small talk.",
                                },
                            },
                            required: ["intent", "summary"],
                        },
                    },
                });

                if (response?.text) break;
            } catch (err: any) {
                // If temporary 503 high-demand spike occurs, wait 600ms and retry
                const is503 = err?.status === 503 || String(err?.message || "").includes("503") || String(err?.message || "").includes("high demand");
                if (attempt < 2 && is503) {
                    console.log(`⚠️ [AI Engine] 503 spikes on attempt ${attempt + 1}, retrying in 600ms...`);
                    await new Promise((r) => setTimeout(r, 600));
                    continue;
                }
                throw err;
            }
        }

        if (response?.text) {
            interpretation = JSON.parse(response.text);
            source = "GEMINI_AI";
        }
    } catch (err: any) {
        console.warn("🤖 [AI Engine] Live Gemini call skipped/quota limited, using Fallback Engine:", err?.message || err);
        interpretation = fallbackRuleParser(userPrompt);
        source = "FALLBACK_RULES";
    }

    if (!interpretation) {
        interpretation = fallbackRuleParser(userPrompt);
        source = "FALLBACK_RULES";
    }

    console.log(`🤖 [AI Engine] Request processed via: ${source} | Intent: ${interpretation.intent}`);

    // Query PostgreSQL via Drizzle ORM if intent is service search
    let matchedServices: Service[] = [];

    if (
        interpretation.intent === "SEARCH_SERVICES" &&
        (interpretation.category || interpretation.maxPrice || interpretation.searchQuery)
    ) {
        matchedServices = await getAllServices({
            category: interpretation.category || undefined,
            maxPrice: interpretation.maxPrice || undefined,
            searchQuery: interpretation.searchQuery || undefined,
            isAvailable: true,
        });
    }

    // Format natural, conversational AI reply
    let reply = interpretation.summary;

    if (interpretation.intent === "SEARCH_SERVICES") {
        if (matchedServices.length > 0) {
            const catLabel = interpretation.category ? CATEGORY_NAMES[interpretation.category] : "matching";
            reply = `I found ${matchedServices.length} verified ${catLabel} option(s) for you:`;
        } else {
            const criteria = interpretation.category 
                ? `${CATEGORY_NAMES[interpretation.category]}${interpretation.maxPrice ? ` under AED ${interpretation.maxPrice}` : ""}`
                : `"${userPrompt}"`;
            reply = `I searched our catalog for ${criteria}, but couldn't find an exact match currently. Try adjusting your price budget or browse our main services catalog!`;
        }
    }

    return {
        source,
        interpretation,
        reply,
        services: matchedServices,
    };
};
