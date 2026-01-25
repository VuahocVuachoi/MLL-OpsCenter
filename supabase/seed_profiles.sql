-- Seed profiles by matching auth.users emails.
-- IMPORTANT: You must create Auth users first (password: 123).
-- This script upserts profiles based on auth.users.id.
with seed(username, email) as (
  values
    ('mlops_manager_tan', 'tan@enveritas.org'),
    ('mlops_manager_nghi', 'nghi@enveritas-associate.org'),
    ('mlops_manager_ha', 'bkha@enveritas-associate.org'),
    ('mlops_manager_ntphu', 'ntphu@enveritas-associate.org'),
    ('mlops_analyst_pnquang', 'pnquang@enveritas-associate.org'),
    ('mlops_manager_nhvhuy', 'nhvhuy@enveritas-associate.org'),
    ('mlops_analyst_dhduc', 'dhduc@enveritas-associate.org'),
    ('mlops_analyst_nqtoan', 'nqtoan@enveritas-associate.org'),
    ('mlops_analyst_ttkthanh', 'ttkthanh@enveritas-associate.org'),
    ('mlops_analyst_ndthinh', 'ndthinh@enveritas-associate.org'),
    ('mlops_analyst_ttnminh', 'ttnminh@enveritas-associate.org'),
    ('mlops_analyst_pthuyen', 'pthuyen@enveritas-associate.org'),
    ('mlops_analyst_mtmngan', 'mtmngan@enveritas-associate.org'),
    ('mlops_analyst_vhtuyen', 'vhtuyen@enveritas-associate.org'),
    ('mlops_analyst_ttnyen', 'ttnyen@enveritas-associate.org'),
    ('mlops_analyst_nhtvuong', 'nhtvuong@enveritas-associate.org'),
    ('mlops_analyst_nhuyen', 'nhuyen@enveritas-associate.org'),
    ('mlops_analyst_tvbac', 'tvbac@enveritas-associate.org'),
    ('mlops_analyst_tttan', 'tttan@enveritas-associate.org'),
    ('mlops_analyst_tnvanh', 'tnvanh@enveritas-associate.org'),
    ('mlops_analyst_bthuy', 'bthuy@enveritas-associate.org'),
    ('mlops_analyst_nntuyen', 'nntuyen@enveritas-associate.org'),
    ('mlops_analyst_lndquynh', 'lndquynh@enveritas-associate.org'),
    ('mlops_analyst_nntvy', 'nntvy@enveritas-associate.org'),
    ('mlops_analyst_ntttuyen', 'ntttuyen@enveritas-associate.org'),
    ('mlops_analyst_ntpthao', 'ntpthao@enveritas-associate.org'),
    ('mlops_analyst_tdthuan', 'tdthuan@enveritas-associate.org')
),
resolved as (
  select
    u.id,
    s.email,
    s.username,
    case
      when s.username like 'mlops_manager_%' then 'mlqc'
      else 'mll'
    end as role
  from seed s
  join auth.users u on lower(u.email) = lower(s.email)
)
insert into public.profiles (
  id,
  email,
  name,
  username,
  role,
  team,
  account_name,
  annual_leave_total,
  annual_leave_remaining
)
select
  id,
  email,
  split_part(email, '@', 1),
  username,
  role,
  '',
  username,
  12,
  12
from resolved
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  username = excluded.username,
  role = excluded.role,
  account_name = excluded.account_name,
  annual_leave_total = excluded.annual_leave_total,
  annual_leave_remaining = excluded.annual_leave_remaining;
