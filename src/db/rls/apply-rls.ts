/**
 * Applies src/db/rls/001_enable_rls.sql using the DATABASE_URL owner connection
 * (same connection Drizzle uses). For when the Supabase SQL Editor is not available.
 * Run: npm run db:rls
 */
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing in .env");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const file = fs.readFileSync(path.join(__dirname, "001_enable_rls.sql"), "utf8");
    await sql.unsafe(file);
    const rows = await sql`
      select tablename, rowsecurity from pg_tables
      where schemaname = 'public' order by tablename`;
    console.table(rows.map((r) => ({ table: r.tablename, rls_on: r.rowsecurity })));
    const policies = await sql`
      select tablename, policyname from pg_policies where schemaname = 'public'`;
    console.log("Policies:", policies.map((p) => `${p.tablename}: ${p.policyname}`).join(", ") || "none");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
