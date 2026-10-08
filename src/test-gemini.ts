import { processUserAIRequest } from "./services/ai.service";
import dotenv from "dotenv";

dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log("--- Test 1: 'I need a cleaner for a 2 bedroom apartment.' ---");
  const result1 = await processUserAIRequest("I need a cleaner for a 2 bedroom apartment.");
  console.log("Query 1 result:\n", JSON.stringify(result1, null, 2));

  await sleep(2000);

  console.log("\n--- Test 2: 'I need an AC technician tomorrow evening under AED 250.' ---");
  const result2 = await processUserAIRequest("I need an AC technician tomorrow evening under AED 250.");
  console.log("Query 2 result:\n", JSON.stringify(result2, null, 2));
}

runTests().catch(console.error);
