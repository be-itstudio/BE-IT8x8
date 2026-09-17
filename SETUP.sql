-- BE-IT 8x8 — one-time database setup.
-- Paste this whole thing into Supabase → SQL Editor → Run.
-- Tables are prefixed b8_ so they can live alongside other apps in the same project.

-- MEMBERS: one row per participant. token = their private link key.
create table if not exists b8_members (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,          -- their PERSONAL CODE = their key + personal link /?m=<token>
  name text not null,
  gender text,                         -- M / F — BE-IT record + prize split, NOT shown on leaderboard
  avatar text,                         -- optional profile photo (small thumbnail URL)
  -- onboarding form (self-serve, for BE-IT records + Court's macros) --
  phone text, email text,
  height text, weight text, age text, activity text,
  injuries text,                       -- injuries / dietary restrictions
  input_choice text,                   -- Book / Audiobook / Podcast
  photo_consent boolean default false, -- consent to use photos in marketing (never assumed)
  agreed boolean default false,        -- signed off: habits locked for 8 weeks
  -- in-app choices --
  h1 text, h2 text, h3 text,           -- their 3 chosen habits (from the menu of 10)
  b1 text, b2 text, b3 text,           -- their becoming statement (3 chosen lines; line 4 is fixed in the app)
  setup_complete boolean default false,-- true once they finish first launch
  created_at timestamptz default now()
);


-- DAYS: one row per member per day. 8 habit ticks (5 fixed + 3 chosen, positional).
create table if not exists b8_days (
  member_id uuid references b8_members(id) on delete cascade,
  date date not null,
  macros boolean default false,        -- fixed 1: Hit your macros
  water  boolean default false,        -- fixed 2: Hit your water
  move   boolean default false,        -- fixed 3: Move for 45 minutes
  read   boolean default false,        -- fixed 4: Read your becoming statement
  input  boolean default false,        -- fixed 5: Ten minutes of input
  c1 boolean default false,            -- chosen habit 1 (member.h1)
  c2 boolean default false,            -- chosen habit 2 (member.h2)
  c3 boolean default false,            -- chosen habit 3 (member.h3)
  updated_at timestamptz default now(),
  primary key (member_id, date)
);

-- DETOX: the weekly socials-detox tick. Row present = ticked for that week. week_start = the Monday.
create table if not exists b8_detox (
  member_id uuid references b8_members(id) on delete cascade,
  week_start date not null,
  primary key (member_id, week_start)
);

-- Open access for the cohort (the personal link is the key). Same trust model as the prior app.
alter table b8_members enable row level security;
alter table b8_days    enable row level security;
alter table b8_detox   enable row level security;

create policy "read b8_members"   on b8_members for select using (true);
create policy "add b8_members"    on b8_members for insert with check (true);
create policy "update b8_members" on b8_members for update using (true);
create policy "del b8_members"    on b8_members for delete using (true);

create policy "read b8_days"   on b8_days for select using (true);
create policy "add b8_days"    on b8_days for insert with check (true);
create policy "update b8_days" on b8_days for update using (true);

create policy "read b8_detox" on b8_detox for select using (true);
create policy "add b8_detox"  on b8_detox for insert with check (true);
create policy "del b8_detox"  on b8_detox for delete using (true);
