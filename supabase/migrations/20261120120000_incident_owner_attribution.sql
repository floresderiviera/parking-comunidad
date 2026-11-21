-- Phase 1: incident attribution and repeat-case counters.
-- No email delivery or penalties are introduced by this migration.
-- Historical ownership is NOT inferred retroactively.

alter table public.incidents
  add column if not exists responsible_at_event_user_id uuid
    references public.profiles(user_id) on delete set null;

comment on column public.incidents.responsible_at_event_user_id is
  'Responsible person captured when the incident is first assigned to a dwelling. Historic rows are left NULL unless explicitly reconciled.';

create index if not exists incidents_responsible_at_event_idx
  on public.incidents(community_id, responsible_at_event_user_id, occurred_at desc)
  where responsible_at_event_user_id is not null;

create or replace function private.capture_incident_responsible()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Capture only on initial assignment / explicit correction of dwelling.
  -- Other incident updates, including closing and followups, do not
  -- reassign historical responsibility if the dwelling owner changes.
  if tg_op = 'INSERT'
     or new.dwelling_id is distinct from old.dwelling_id then
    new.responsible_at_event_user_id := (
      select d.responsible_user_id
        from public.dwellings d
       where d.id = new.dwelling_id
         and d.community_id = new.community_id
    );
  else
    -- Clients must not overwrite the historical attribution.
    new.responsible_at_event_user_id := old.responsible_at_event_user_id;
  end if;
  return new;
end;
$$;

revoke all on function private.capture_incident_responsible() from public;

drop trigger if exists incidents_capture_responsible on public.incidents;
create trigger incidents_capture_responsible
before insert or update on public.incidents
for each row execute function private.capture_incident_responsible();

-- Explicit column lists keep private QR tokens/evidence out of these views.
-- security_invoker ensures the caller's incidents RLS is applied.
create or replace view public.parking_incident_dwelling_stats
with (security_invoker = true)
as
select
  i.community_id,
  i.dwelling_id,
  count(*)::bigint as total_incidents,
  count(*) filter (where i.state = 'Abierta')::bigint as open_incidents,
  count(*) filter (where i.occurred_at >= now() - interval '365 days')::bigint
    as incidents_last_365_days,
  max(i.occurred_at) as last_incident_at
from public.incidents i
where i.dwelling_id is not null
group by i.community_id, i.dwelling_id;

create or replace view public.parking_incident_owner_stats
with (security_invoker = true)
as
select
  i.community_id,
  i.responsible_at_event_user_id as owner_user_id,
  count(*)::bigint as total_incidents,
  count(*) filter (where i.state = 'Abierta')::bigint as open_incidents,
  count(*) filter (where i.occurred_at >= now() - interval '365 days')::bigint
    as incidents_last_365_days,
  count(distinct i.dwelling_id)::bigint as affected_dwellings,
  max(i.occurred_at) as last_incident_at
from public.incidents i
where i.responsible_at_event_user_id is not null
group by i.community_id, i.responsible_at_event_user_id;

revoke all on public.parking_incident_dwelling_stats from public, anon;
revoke all on public.parking_incident_owner_stats from public, anon;
grant select on public.parking_incident_dwelling_stats to authenticated, service_role;
grant select on public.parking_incident_owner_stats to authenticated, service_role;
