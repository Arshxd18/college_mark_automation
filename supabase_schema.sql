-- SQL Schema for Supabase Migration
-- Paste this script into the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Assessments Table
create table if not exists public.assessments (
    id uuid default uuid_generate_v4() primary key,
    batch_year text not null,
    subject_id text not null,
    test_type text not null,
    is_active boolean default true not null,
    exam_config jsonb not null,
    question_config jsonb not null,
    students jsonb not null,
    computed jsonb not null,
    saved_at timestamptz default timezone('utc'::text, now()) not null
);

-- Indexes for fast filtering
create index if not exists idx_assessments_lookup 
on public.assessments(batch_year, subject_id, test_type, is_active);

-- 2. Attainment Results Table
create table if not exists public.attainment_results (
    id text primary key, -- e.g. batchYear_subjectId
    batch_year text not null,
    subject_id text not null,
    co_descriptions jsonb,
    co_attainment_avg jsonb,
    unit_test_level jsonb,
    assignment_level jsonb,
    semester_level jsonb,
    internal_attainment jsonb,
    direct_attainment jsonb,
    indirect_attainment jsonb,
    final_attainment jsonb,
    levels jsonb,
    computed_at timestamptz,
    last_updated timestamptz
);

create index if not exists idx_attainment_results_lookup 
on public.attainment_results(batch_year, subject_id);

-- 3. Mappings Table
create table if not exists public.mappings (
    id uuid default uuid_generate_v4() primary key,
    batch_year text not null,
    subject_id text not null,
    co_descriptions jsonb not null,
    matrix jsonb not null,
    po_attainment jsonb not null,
    mapping_locked boolean default false not null,
    is_active boolean default true not null,
    saved_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_mappings_lookup 
on public.mappings(batch_year, subject_id, is_active);

-- Enable Row Level Security (RLS) or public access policies
alter table public.assessments enable row level security;
alter table public.attainment_results enable row level security;
alter table public.mappings enable row level security;

-- Allow public anonymous access (read & write) to match original Firebase behavior
create policy "Allow public access to assessments" on public.assessments for all using (true) with check (true);
create policy "Allow public access to attainment_results" on public.attainment_results for all using (true) with check (true);
create policy "Allow public access to mappings" on public.mappings for all using (true) with check (true);
