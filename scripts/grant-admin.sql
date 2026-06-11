-- Manual admin grant — run in Supabase Studio → SQL Editor.
-- Replace the email with the account you want to make admin.
-- (Prefer the CLI: `pnpm grant:admin you@example.com`)

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'your-email@example.com'
on conflict (user_id, role) do nothing;

-- Verify
select u.email, r.role, r.granted_at
from public.user_roles r
join auth.users u on u.id = r.user_id
where r.role = 'admin';
