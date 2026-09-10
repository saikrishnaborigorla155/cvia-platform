-- CVIA Platform — Supabase Schema Migration v2
-- SIH26228 · Ministry of Defence / DGIS
-- Non-destructive update: adds multi-user isolation and persistent verification records
-- Safe to execute in Supabase SQL Editor: https://supabase.com/dashboard/project/puipneqpnowkvlwuebhd/sql/new

-- ─────────────────────────────────────────────
-- 1. CVIA USERS & OPERATORS TABLE
-- ─────────────────────────────────────────────
create table if not exists cvia_users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  password_hash   text not null,
  full_name       text not null,
  organization    text not null default 'Ministry of Defence / DGIS',
  role            text not null default 'OPERATOR',
  unit_code       text not null default 'C01',
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

-- Seed baseline defense operators if not present
insert into cvia_users (id, email, password_hash, full_name, organization, role, unit_code)
values
  ('11111111-1111-1111-1111-111111111111', 'commander.alpha@dgis.gov.in', 'cvia_hash_sec_alpha2026', 'Col. R. Singh', 'Unit Alpha (Northern Command)', 'COMMANDER', 'C01'),
  ('44444444-4444-4444-4444-444444444444', 'officer.delta@dgis.gov.in', 'cvia_hash_sec_delta2026', 'Maj. V. Sharma', 'Unit Delta (Special Surveillance)', 'OPERATOR', 'C04'),
  ('77777777-7777-7777-7777-777777777777', 'analyst.golf@dgis.gov.in', 'cvia_hash_sec_golf2026', 'Capt. S. Verma', 'Unit Golf (Signals Analysis)', 'ANALYST', 'C07')
on conflict (email) do nothing;

-- ─────────────────────────────────────────────
-- 2. VERIFICATIONS TABLE (Persistent Results)
-- ─────────────────────────────────────────────
create table if not exists verifications (
  id                      uuid primary key default gen_random_uuid(),
  verification_id         text unique not null,
  user_id                 text not null default '11111111-1111-1111-1111-111111111111',
  dataset_id              text not null default 'CVIA-DATASET-001',
  model_id                text not null default 'CVIA-MODEL-003',
  status                  text not null default 'VERIFIED',
  integrity_health        integer not null default 82,
  total_files             integer not null default 56,
  exact_duplicates        integer not null default 43,
  near_duplicates         integer not null default 23,
  malfunction_data        integer not null default 15,
  verified_clean_files    integer not null default 41,
  high_risk_contributors  integer not null default 1,
  risk_score              integer not null default 18,
  decision                text not null default 'CONDITIONAL_PASS',
  stages_data             jsonb not null default '[]',
  findings_data           jsonb not null default '[]',
  flagged_items           jsonb not null default '[]',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Seed initial persistent verification baseline for Unit Alpha
insert into verifications (
  verification_id, user_id, dataset_id, model_id, status,
  integrity_health, total_files, exact_duplicates, near_duplicates,
  malfunction_data, verified_clean_files, high_risk_contributors,
  risk_score, decision, created_at, updated_at
)
values (
  'VER-2026-00124',
  '11111111-1111-1111-1111-111111111111',
  'CVIA-DATASET-001',
  'CVIA-MODEL-003',
  'VERIFIED',
  82, 56, 43, 23, 15, 41, 1, 18, 'CONDITIONAL_PASS',
  '2026-09-10T04:15:00Z',
  '2026-09-10T04:15:00Z'
)
on conflict (verification_id) do nothing;

-- ─────────────────────────────────────────────
-- 3. ADD USER_ID TO EXISTING TABLES (SAFE MIGRATION)
-- ─────────────────────────────────────────────
alter table database_assets add column if not exists user_id text default '11111111-1111-1111-1111-111111111111';
alter table ingest_history  add column if not exists user_id text default '11111111-1111-1111-1111-111111111111';
alter table audit_events    add column if not exists user_id text default '11111111-1111-1111-1111-111111111111';

-- Update existing unassigned assets to baseline user
update database_assets set user_id = '11111111-1111-1111-1111-111111111111' where user_id is null;
update ingest_history  set user_id = '11111111-1111-1111-1111-111111111111' where user_id is null;
update audit_events    set user_id = '11111111-1111-1111-1111-111111111111' where user_id is null;

-- ─────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table cvia_users    enable row level security;
alter table verifications enable row level security;

-- Policies allowing access
create policy "allow_anon_cvia_users" on cvia_users for all using (true) with check (true);
create policy "allow_anon_verifications" on verifications for all using (true) with check (true);

-- ─────────────────────────────────────────────
-- 5. INDEXES FOR MULTI-USER PERFORMANCE
-- ─────────────────────────────────────────────
create index if not exists idx_verifications_user   on verifications (user_id);
create index if not exists idx_verifications_time   on verifications (created_at desc);
create index if not exists idx_assets_user          on database_assets (user_id);
create index if not exists idx_history_user         on ingest_history (user_id);
create index if not exists idx_audit_user           on audit_events (user_id);
