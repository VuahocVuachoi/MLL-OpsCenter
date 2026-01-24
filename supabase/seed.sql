-- Seed demo profiles (replace UUIDs with auth.users ids)
insert into public.profiles (id, email, name, role, team, account_name, leave_balance)
values
  ('00000000-0000-0000-0000-000000000001', 'mll@example.com', 'MLL', 'employee', 'Team A', 'staff_user', 12),
  ('00000000-0000-0000-0000-000000000002', 'mlqc@example.com', 'MLQC', 'qc', 'QC Team', 'qc_manager', 0),
  ('00000000-0000-0000-0000-000000000003', 'hr@example.com', 'HR Manager', 'hr', 'HR', 'hr_manager', 0);
