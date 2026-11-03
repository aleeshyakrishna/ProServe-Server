/**
 * Checks the Supabase Data API "second door".
 * Calls every public table with ONLY the anon key (no login) and expects
 * an empty list. Any rows returned = that table is exposed.
 * Run: npm run check:rls
 */
import * as dotenv from "dotenv";
dotenv.config();

const TABLES = ["users", "profiles", "roles", "user_roles", "services", "bookings", "categories"];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY missing in .env");
    process.exit(1);
  }
  let exposed = 0;
  for (const table of TABLES) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=5`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await res.json().catch(() => null);
    const rows = Array.isArray(body) ? body.length : 0;
    const status = rows > 0 ? "EXPOSED" : "protected";
    if (rows > 0) exposed++;
    console.log(`${table.padEnd(12)} HTTP ${res.status}  rows: ${rows}  -> ${status}`);
  }
  console.log(exposed ? `\n${exposed} table(s) readable with only the anon key.` : "\nAll tables protected.");
  process.exit(exposed ? 1 : 0);
}

main();
