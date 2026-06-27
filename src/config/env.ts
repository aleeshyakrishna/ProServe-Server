import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

export const env = {
  PORT: parseInt(process.env.PORT || "5001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
};

if (env.NODE_ENV !== "test" && (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)) {
  console.warn("⚠️ WARNING: SUPABASE_URL or SUPABASE_ANON_KEY environment variable is not defined!");
}
