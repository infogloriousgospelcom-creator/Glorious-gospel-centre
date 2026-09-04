# First Administrator — Bootstrap Runbook

This document explains how to create the very first SUPER_ADMIN for the
Glorious Gospel Centre admin platform. **No production password is ever
created or stored in source code.**

> **Security:** the service-role key can bypass every RLS policy and grant
> itself admin. Treat it like a root password. Never paste it into chat,
> Git, or any screen-sharing session.

---

## Prerequisites

1. Access to the Supabase project dashboard for `defqtyiemcabihnqbkxd`
   (https://supabase.com/dashboard).
2. Access to a local checkout of this repository with the Supabase CLI
   installed.
3. A non-secret email for the first admin (e.g.
   `admin@gloriousgospelcentre.org`). **Do not use a personal Gmail
   account that you also use for personal logins.** Use a dedicated
   mailbox or a role-based alias if possible.
4. A strong password (≥ 12 characters, mix of cases, digits, symbols).
   Generated and stored in a password manager (1Password, Bitwarden,
   KeePass, etc.). **Do not paste it into chat, GitHub, or any AI
   assistant.**

---

## Step 1 — Invite the user via Supabase Auth

1. Open the Supabase dashboard.
2. Go to **Authentication → Users → Add user → Create new user**.
3. Enter the admin email and a strong password.
4. Leave "Auto Confirm User" **enabled** for the very first admin (so
   they can sign in immediately). For subsequent admins, consider
   enabling email confirmations.
5. Click **Create user**.
6. Copy the **User UID** shown in the users list. You will need it in
   step 3.

> If your project has email confirmations forced, the user will receive
> a confirmation email. They must click the link before they can sign in.

---

## Step 2 — Apply the database migrations (if not already done)

```bash
# from the repository root
supabase db push
```

This applies migrations `0001` through `0015` (plus `0017` for sermon
series and `0018` for the permissions helper). The seed data created
during this process includes:

- 5 roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `PRAYER_MINISTER`, `MEDIA_MANAGER`
- 10 permissions
- 22 role-permission mappings
- 4 giving categories
- A default `site_settings` row

Verify in the dashboard under **Database → Tables**:

- `public.roles` has 5 rows
- `public.permissions` has 10 rows
- `public.role_permissions` has 22 rows

---

## Step 3 — Create the profile + admin link

In the Supabase dashboard, open **SQL Editor → New query** and run:

```sql
-- Replace the email and UUID with the values from Step 1.
do $$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@gloriousgospelcentre.org';
  if v_user_id is null then
    raise exception 'No auth user with that email exists. Complete Step 1 first.';
  end if;

  -- Create or update the public profile.
  insert into public.profiles (id, full_name)
  values (v_user_id, 'Site Administrator')
  on conflict (id) do update set full_name = excluded.full_name;

  -- Find the SUPER_ADMIN role.
  select id into v_role_id from public.roles where key = 'SUPER_ADMIN';
  if v_role_id is null then
    raise exception 'SUPER_ADMIN role missing. Run migrations.';
  end if;

  -- Link the profile to the SUPER_ADMIN role.
  insert into public.admins (profile_id, role_id, is_active)
  values (v_user_id, v_role_id, true)
  on conflict (profile_id, role_id) do update set is_active = true;
end$$;
```

If the query succeeds, the user is now a `SUPER_ADMIN` with full access.

---

## Step 4 — Verify the role

Sign in at `/admin/login` with the same email and password. You should
be redirected to `/admin/dashboard` and see the `SUPER_ADMIN` badge in
the top bar.

You can also verify directly:

```sql
select u.email, r.key as role, a.is_active
from auth.users u
join public.admins a on a.profile_id = u.id
join public.roles r on r.id = a.role_id
where u.email = 'admin@gloriousgospelcentre.org';
```

Expected: 1 row, `role = SUPER_ADMIN`, `is_active = true`.

---

## Step 5 — Rotate any temporary credentials

If you used a temporary password during Step 1 (for example, to test the
flow), sign in and change it under **Admin → Account → Change password**.

---

## Adding additional administrators later

Once you have one SUPER_ADMIN, additional admins can be added through:

1. The future admin CMS (Phase 16), once it is built, OR
2. Manually via the same SQL pattern in Step 3 (with a different role,
   e.g. `ADMIN` or `EDITOR`).

Never share the service-role key with non-administrators. Never commit
the first-admin email or password to source control.

---

## Removing or deactivating an administrator

To revoke access without deleting the user:

```sql
update public.admins
set is_active = false
where profile_id = (select id from auth.users where email = 'someone@example.com');
```

To remove the user entirely (Supabase Auth):

1. **Authentication → Users** → click the user → **Delete user**.
2. The `profiles` row cascades to deletion (FK `on delete cascade`).
3. The `admins` row cascades to deletion (FK `on delete cascade`).

---

## Troubleshooting

- **"Invalid login credentials" on `/admin/login`.** Confirm email
  confirmations were either disabled or completed. Check the user row in
  `auth.users` — the `email_confirmed_at` column should be non-null.
- **`/admin/dashboard` redirects to `/admin/login` immediately after
  sign-in.** The session was created but the user has no row in
  `public.admins` for an active role. Re-run Step 3.
- **Role is wrong or missing.** Update the `admins` row directly:
  ```sql
  update public.admins
  set role_id = (select id from public.roles where key = 'ADMIN')
  where profile_id = (select id from auth.users where email = '...');
  ```
- **`has_permission` returns false in admin code paths.** Confirm
  migration `0018` was applied (`select 1 from pg_proc where proname =
  'permissions_for_user'`). If missing, re-apply it.
