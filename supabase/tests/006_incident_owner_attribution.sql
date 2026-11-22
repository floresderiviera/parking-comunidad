begin;
select plan(10);

select has_column('public', 'incidents', 'responsible_at_event_user_id',
  'Incident snapshots responsible user');
select has_index('public', 'incidents', 'incidents_responsible_at_event_idx',
  'Historical responsible index exists');
select has_trigger('public', 'incidents', 'incidents_capture_responsible',
  'Incident responsible trigger exists');
select has_view('public', 'parking_incident_dwelling_stats',
  'Dwelling counters view exists');
select has_view('public', 'parking_incident_owner_stats',
  'Owner counters view exists');

select is(
  (select reloptions @> array['security_invoker=true']
   from pg_class where oid = 'public.parking_incident_dwelling_stats'::regclass),
  true, 'Dwelling view applies caller RLS'
);
select is(
  (select reloptions @> array['security_invoker=true']
   from pg_class where oid = 'public.parking_incident_owner_stats'::regclass),
  true, 'Owner view applies caller RLS'
);
select ok(has_table_privilege('authenticated',
  'public.parking_incident_dwelling_stats', 'SELECT'),
  'Authenticated role can query dwelling aggregates');
select ok(has_table_privilege('authenticated',
  'public.parking_incident_owner_stats', 'SELECT'),
  'Authenticated role can query owner aggregates');
select is(
  (select count(*)::int from public.incidents
   where responsible_at_event_user_id is not null
     and dwelling_id is null),
  0, 'No unlinked incidence has an owner snapshot'
);
select * from finish();
rollback;
