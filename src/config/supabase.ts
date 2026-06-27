import { createClient } from "@supabase/supabase-js";
import { env } from "./env";
import ws from "ws";

// Instantiate Supabase JS Client for Auth integrations.
// Node.js < 22 does not have native WebSocket support, so we provide
// the `ws` package as the transport for the Realtime client.
export const supabase = createClient(
  env.SUPABASE_URL || "https://placeholder-project-id.supabase.co",
  env.SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    realtime: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: ws as any,
    },
  }
);

