/** Lists the Gemini models your API key can use for generateContent. Run: npm run gemini:models */
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

(async () => {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const pager = await ai.models.list();
    for await (const m of pager) {
        if (m.supportedActions?.includes("generateContent") && /gemini/i.test(m.name ?? "")) {
            console.log(m.name?.replace("models/", ""));
        }
    }
})();
