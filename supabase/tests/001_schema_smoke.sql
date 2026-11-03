-- Intended for `supabase test db` once local Supabase is installed.
begin;
select plan(15);

select has_table('public', 'communities', 'communities table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'community_members', 'community_members table exists');
select has_table('public', 'dwellings', 'dwellings table exists');
select has_table('public', 'vehicles', 'vehicles table exists');
select has_table('public', 'temporary_periods', 'temporary_periods table exists');
select has_table('public', 'requests', 'requests table exists');
select has_table('public', 'incidents', 'incidents table exists');
select has_table('public', 'incident_followups', 'incident_followups table exists');
select has_table('public', 'qr_controls', 'qr_controls table exists');
select has_table('public', 'plate_controls', 'plate_controls table exists');
select has_table('public', 'audit_log', 'audit_log table exists');
select has_table('public', 'community_settings', 'community_settings table exists');
select has_function('public', 'normalize_plate', array['text']);
select results_eq(
  $$ select public.normalize_plate('6862 ngw') $$,
  $$ values ('6862NGW'::text) $$,
  'normalize_plate removes separators and uppercases'
);

select * from finish();
rollback;
