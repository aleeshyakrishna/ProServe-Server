-- ProServe: close the Supabase Data API "second door" (3 Nov 2026)
-- Before: GET /rest/v1/bookings with only the anon key returned real rows.
-- After:  RLS is on for every public table. With no policy, the Data API
--         returns nothing. The Express API keeps working because Drizzle
--         connects as the table owner (postgres), which RLS does not block.
-- Run once in Supabase -> SQL Editor (or psql "$DATABASE_URL" -f this file).

begin;

alter table public.users       enable row level security;
alter table public.profiles    enable row level security;
alter table public.roles       enable row level security;
alter table public.user_roles  enable row level security;
alter table public.services    enable row level security;
alter table public.bookings    enable row level security;
alter table public.categories  enable row level security;

-- Example "own rows" policy: a logged-in customer reading through the
-- Supabase Data API sees only their own bookings. Strangers (anon) get nothing.
drop policy if exists "customers read own bookings" on public.bookings;
create policy "customers read own bookings"
  on public.bookings
  for select
  to authenticated
  using (
    user_id = (
      select u.id from public.users u
      where u.supabase_user_id = (select auth.uid())::text
    )
  );

commit;

-- Verify: every row should show rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
