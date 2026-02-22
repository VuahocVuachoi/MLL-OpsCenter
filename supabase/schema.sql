  create extension if not exists "pgcrypto";

-- Core employee profile table for login + dashboards
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  name text not null default '',
  username text not null default '',
  role text not null default 'mll' check (role in ('mll', 'mlqc', 'hr')),
  team text not null default '',
  account_name text not null default '',
  last_login_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  signature_data text,
  leave_balance numeric(6, 2) not null default 0,
  annual_leave_total integer not null default 12,
  annual_leave_remaining integer not null default 12,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

create or replace function public.is_hr_or_mlqc()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('hr', 'mlqc')
  );
$$;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_select_hr_qc"
on public.profiles
for select
using (public.is_hr_or_mlqc());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

alter table public.profiles
  add column if not exists username text not null default '',
  add column if not exists last_login_at timestamp with time zone,
  add column if not exists last_seen_at timestamp with time zone,
  add column if not exists signature_data text,
  add column if not exists annual_leave_total integer not null default 12,
  add column if not exists annual_leave_remaining integer not null default 12;

-- Time sheet records
create table if not exists public.time_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text not null default '',
  work_date date not null,
  pin_id text not null default '',
  country text not null default '',
  mode text not null default '',
  actions_duplicated text not null default '',
  duration_minutes integer,
  ot boolean not null default false,
  bu_gio boolean not null default false,
  approved boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles (id),
  approved_at timestamp with time zone,
  worked_day boolean not null default false,
  pin_count integer,
  notes text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists set_time_sheets_updated_at on public.time_sheets;
create trigger set_time_sheets_updated_at
before update on public.time_sheets
for each row execute procedure public.set_updated_at();

alter table public.time_sheets enable row level security;

create policy "time_sheets_select_own"
on public.time_sheets
for select
using (auth.uid() = user_id);

create policy "time_sheets_select_hr_qc"
on public.time_sheets
for select
using (public.is_hr_or_mlqc());

create policy "time_sheets_insert_own"
on public.time_sheets
for insert
with check (auth.uid() = user_id);

create policy "time_sheets_update_own"
on public.time_sheets
for update
using (auth.uid() = user_id);

create policy "time_sheets_update_hr_qc"
on public.time_sheets
for update
using (public.is_hr_or_mlqc());

create policy "time_sheets_delete_own"
on public.time_sheets
for delete
using (auth.uid() = user_id);

alter table public.time_sheets
  add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists approved_at timestamp with time zone,
  add column if not exists worked_day boolean not null default false;

-- Leave requests (annual leave)
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  total_days integer not null default 0,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles (id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists set_leave_requests_updated_at on public.leave_requests;
create trigger set_leave_requests_updated_at
before update on public.leave_requests
for each row execute procedure public.set_updated_at();

alter table public.leave_requests enable row level security;

create policy "leave_requests_select_own"
on public.leave_requests
for select
using (auth.uid() = user_id);

create policy "leave_requests_select_hr_qc"
on public.leave_requests
for select
using (public.is_hr_or_mlqc());

create policy "leave_requests_insert_own"
on public.leave_requests
for insert
with check (auth.uid() = user_id);

create policy "leave_requests_update_hr_qc"
on public.leave_requests
for update
using (public.is_hr_or_mlqc());

-- Notifications (approval/rejection events)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  message text not null default '',
  event_type text not null default 'info' check (event_type in ('approved', 'rejected', 'info')),
  work_date date,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "notifications_insert_hr_qc"
on public.notifications
for insert
with check (public.is_hr_or_mlqc());

create policy "notifications_update_own"
on public.notifications
for update
using (auth.uid() = user_id);

-- Monthly attendance stats
create table if not exists public.monthly_attendance_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month_start date not null,
  days_worked integer not null default 0,
  days_off integer not null default 0,
  days_ot integer not null default 0,
  days_absent integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, month_start)
);

drop trigger if exists set_monthly_attendance_updated_at on public.monthly_attendance_stats;
create trigger set_monthly_attendance_updated_at
before update on public.monthly_attendance_stats
for each row execute procedure public.set_updated_at();

alter table public.monthly_attendance_stats enable row level security;

create policy "monthly_attendance_select_own"
on public.monthly_attendance_stats
for select
using (auth.uid() = user_id);

create policy "monthly_attendance_select_hr_qc"
on public.monthly_attendance_stats
for select
using (public.is_hr_or_mlqc());

create policy "monthly_attendance_insert_own"
on public.monthly_attendance_stats
for insert
with check (auth.uid() = user_id);

create policy "monthly_attendance_update_own"
on public.monthly_attendance_stats
for update
using (auth.uid() = user_id);
