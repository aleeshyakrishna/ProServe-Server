import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Instantiate Supabase JS Client for Auth integrations
export const supabase = createClient(
  env.SUPABASE_URL || "https://placeholder-project-id.supabase.co",
  env.SUPABASE_ANON_KEY || "placeholder-anon-key"
);
