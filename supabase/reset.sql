-- DANGER: clears data for a fresh start (does not drop tables)
truncate table public.time_sheets restart identity;
truncate table public.leave_requests restart identity;
truncate table public.monthly_attendance_stats restart identity;
