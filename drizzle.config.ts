import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ override: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
