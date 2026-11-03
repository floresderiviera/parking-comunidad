begin;

select plan(10);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_parking_vehicle'
  ),
  'save_parking_vehicle RPC exists'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_parking_vehicle'
      and p.prosecdef
  ),
  'save_parking_vehicle runs as SECURITY DEFINER'
);

select has_column(
  'public',
  'vehicles',
  'slot',
  'vehicles.slot exists'
);

select has_column(
  'public',
  'vehicles',
  'type',
  'vehicles.type exists'
);

select has_column(
  'public',
  'vehicles',
  'state',
  'vehicles.state exists'
);

select has_column(
  'public',
  'vehicles',
  'qr_token',
  'vehicles.qr_token exists'
);

select has_column(
  'public',
  'vehicles',
  'qr_state',
  'vehicles.qr_state exists'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_parking_vehicle'
      and lower(pg_get_functiondef(p.oid)) like '%slot%'
      and lower(pg_get_functiondef(p.oid)) like '%dwelling%'
  ),
  'save_parking_vehicle contains dwelling slot allocation logic'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_parking_vehicle'
      and lower(pg_get_functiondef(p.oid)) like '%moto%'
      and lower(pg_get_functiondef(p.oid)) like '%qr%'
  ),
  'save_parking_vehicle contains motorcycle QR handling'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_parking_vehicle'
      and (
        lower(pg_get_functiondef(p.oid)) like '%desasignado%'
        or lower(pg_get_functiondef(p.oid)) like '%sin plaza%'
      )
  ),
  'save_parking_vehicle contains no-slot vehicle state handling'
);

select * from finish();

rollback;
