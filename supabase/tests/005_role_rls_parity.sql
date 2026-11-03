begin;

select plan(8);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
  (
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'control@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '51000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into public.communities (
  id,
  slug,
  name
) values
  (
    '52000000-0000-4000-8000-000000000001',
    'rls-role-a',
    'RLS Role A'
  ),
  (
    '52000000-0000-4000-8000-000000000002',
    'rls-role-b',
    'RLS Role B'
  );

update public.profiles
set name = 'Owner A', state = 'Activo'
where user_id = '51000000-0000-4000-8000-000000000001';

update public.profiles
set name = 'Owner B', state = 'Activo'
where user_id = '51000000-0000-4000-8000-000000000002';

update public.profiles
set name = 'Control', state = 'Activo'
where user_id = '51000000-0000-4000-8000-000000000003';

update public.profiles
set name = 'Admin', state = 'Activo'
where user_id = '51000000-0000-4000-8000-000000000004';

insert into public.community_members (
  community_id,
  user_id,
  roles,
  state
) values
  (
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    array['PROPIETARIO'],
    'Activo'
  ),
  (
    '52000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000002',
    array['PROPIETARIO'],
    'Activo'
  ),
  (
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000003',
    array['CONTROL'],
    'Activo'
  ),
  (
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000004',
    array['ADMIN'],
    'Activo'
  );

insert into public.dwellings (
  id,
  community_id,
  legacy_id,
  display_name,
  responsible_user_id
) values
  (
    '53000000-0000-4000-8000-000000000001',
    '52000000-0000-4000-8000-000000000001',
    'ROLE-DW-A',
    'Role A',
    '51000000-0000-4000-8000-000000000001'
  ),
  (
    '53000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000002',
    'ROLE-DW-B',
    'Role B',
    '51000000-0000-4000-8000-000000000002'
  );

set local role authenticated;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '51000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'iat', extract(epoch from now())::bigint
  )::text,
  true
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where id = '53000000-0000-4000-8000-000000000001'
  $$,
  $$ values (1::bigint) $$,
  'PROPIETARIO sees own dwelling'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where id = '53000000-0000-4000-8000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'PROPIETARIO cannot see foreign community dwelling'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '51000000-0000-4000-8000-000000000003',
    'role', 'authenticated',
    'iat', extract(epoch from now())::bigint
  )::text,
  true
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where community_id = '52000000-0000-4000-8000-000000000001'
  $$,
  $$ values (1::bigint) $$,
  'CONTROL sees dwellings in own community'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where community_id = '52000000-0000-4000-8000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'CONTROL cannot see foreign community'
);

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '51000000-0000-4000-8000-000000000004',
    'role', 'authenticated',
    'iat', extract(epoch from now())::bigint
  )::text,
  true
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where community_id = '52000000-0000-4000-8000-000000000001'
  $$,
  $$ values (1::bigint) $$,
  'ADMIN sees dwellings in own community'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.dwellings
    where community_id = '52000000-0000-4000-8000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'ADMIN cannot see foreign community'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.community_members
    where community_id = '52000000-0000-4000-8000-000000000001'
  $$,
  $$ values (3::bigint) $$,
  'ADMIN sees memberships in own community'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.community_members
    where community_id = '52000000-0000-4000-8000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'ADMIN memberships remain isolated across communities'
);

select * from finish();

rollback;
