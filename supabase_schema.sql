-- CVIA Platform — Supabase Schema
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/puipneqpnowkvlwuebhd/sql/new

-- ─────────────────────────────────────────────
-- 1. DATABASE ASSETS TABLE
-- ─────────────────────────────────────────────
create table if not exists database_assets (
  id              uuid primary key default gen_random_uuid(),
  asset_id        text unique not null,
  name            text not null,
  type            text not null default 'OTHER',
  sha256          text not null,
  perceptual_hash text,
  file_size       bigint not null default 0,
  stored_at       timestamptz not null default now(),
  contributor_id  text not null default 'anonymous',
  contributor_name text not null default 'Anonymous Operator',
  provenance_block text,
  status          text not null default 'VERIFIED',
  metadata        jsonb not null default '{}',
  preview_url     text
);

-- ─────────────────────────────────────────────
-- 2. INGEST HISTORY TABLE
-- ─────────────────────────────────────────────
create table if not exists ingest_history (
  id              uuid primary key default gen_random_uuid(),
  file_name       text not null,
  sha256          text not null,
  perceptual_hash text,
  file_size       bigint not null default 0,
  ingested_at     timestamptz not null default now(),
  session_id      text not null default 'unknown'
);

-- ─────────────────────────────────────────────
-- 3. AUDIT EVENTS TABLE
-- ─────────────────────────────────────────────
create table if not exists audit_events (
  id          uuid primary key default gen_random_uuid(),
  event_id    text unique not null,
  event_type  text not null,
  actor       text not null,
  description text,
  hash_chain  text,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (allow all for anon)
-- ─────────────────────────────────────────────
alter table database_assets  enable row level security;
alter table ingest_history   enable row level security;
alter table audit_events     enable row level security;

-- database_assets: anyone can read, insert, update
drop policy if exists "anon_select" on database_assets;
drop policy if exists "anon_insert" on database_assets;
drop policy if exists "anon_update" on database_assets;
create policy "anon_select" on database_assets for select using (true);
create policy "anon_insert" on database_assets for insert with check (true);
create policy "anon_update" on database_assets for update using (true);

-- ingest_history: anyone can read + insert
drop policy if exists "anon_select" on ingest_history;
drop policy if exists "anon_insert" on ingest_history;
create policy "anon_select" on ingest_history for select using (true);
create policy "anon_insert" on ingest_history for insert with check (true);

-- audit_events: anyone can read + insert
drop policy if exists "anon_select" on audit_events;
drop policy if exists "anon_insert" on audit_events;
create policy "anon_select" on audit_events for select using (true);
create policy "anon_insert" on audit_events for insert with check (true);

-- ─────────────────────────────────────────────
-- 5. INDEXES for fast hash lookups
-- ─────────────────────────────────────────────
create index if not exists idx_assets_sha256  on database_assets (sha256);
create index if not exists idx_assets_status  on database_assets (status);
create index if not exists idx_history_sha256 on ingest_history  (sha256);
create index if not exists idx_history_sess   on ingest_history  (session_id);
