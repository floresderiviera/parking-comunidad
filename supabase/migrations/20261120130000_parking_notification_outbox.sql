-- Transactional notification outbox. Does NOT send email in the SQL transaction.
-- Service-role worker processes records only after verified, private attachments.
create table public.parking_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  event_type text not null check (event_type in ('incident.created','incident.closed','request.created','request.resolved')),
  entity_id uuid not null,
  recipient_user_id uuid references public.profiles(user_id) on delete set null,
  recipient_email text not null,
  recipient_kind text not null check (recipient_kind in ('ADMIN','OWNER')),
  state text not null default 'pending' check (state in ('pending','sending','sent','failed')),
  attempts int not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  provider_message_id text,
  attachment_path text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (community_id,event_type,entity_id,recipient_email)
);
create index parking_outbox_work_idx
  on public.parking_notification_outbox(state,next_attempt_at)
  where state in ('pending','failed');

alter table public.parking_notification_outbox enable row level security;
revoke all on public.parking_notification_outbox from public, anon, authenticated;
grant all on public.parking_notification_outbox to service_role;

create or replace function private.parking_queue_notification(
  target_community uuid, target_event text, target_entity uuid,
  target_owner uuid default null
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  -- Snapshot all active admins within the same community.
  insert into public.parking_notification_outbox
    (community_id,event_type,entity_id,recipient_user_id,recipient_email,recipient_kind)
  select target_community,target_event,target_entity,p.user_id,lower(trim(p.email)),'ADMIN'
    from public.community_members cm
    join public.profiles p on p.user_id=cm.user_id
   where cm.community_id=target_community and cm.state='Activo'
     and 'ADMIN'=any(cm.roles)
     and p.state='Activo' and p.email~* '^[^ @]+@[^ @]+[.][^ @]+$'
  on conflict (community_id,event_type,entity_id,recipient_email) do nothing;

  if target_owner is not null and target_event in ('incident.closed','request.resolved') then
    insert into public.parking_notification_outbox
      (community_id,event_type,entity_id,recipient_user_id,recipient_email,recipient_kind)
    select target_community,target_event,target_entity,p.user_id,lower(trim(p.email)),'OWNER'
      from public.profiles p
     where p.user_id=target_owner and p.state='Activo'
       and p.email~* '^[^ @]+@[^ @]+[.][^ @]+$'
       and exists(select 1 from public.community_members cm
            where cm.community_id=target_community and cm.user_id=p.user_id
              and cm.state='Activo')
    on conflict (community_id,event_type,entity_id,recipient_email) do nothing;
  end if;
end;
$$;

revoke all on function private.parking_queue_notification(uuid,text,uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.parking_queue_notification(uuid,text,uuid,uuid)
  to service_role;

-- The owner for a request must be frozen when first registered.
alter table public.requests
  add column if not exists responsible_at_request_user_id uuid
    references public.profiles(user_id) on delete set null;

create or replace function private.parking_request_notifications()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op='INSERT' then
    new.responsible_at_request_user_id := (
      select d.responsible_user_id from public.dwellings d
      where d.id=new.dwelling_id and d.community_id=new.community_id
    );
    return new;
  end if;
  -- Preserve historical recipient on any later resolution/update.
  new.responsible_at_request_user_id := old.responsible_at_request_user_id;
  return new;
end;
$$;
revoke all on function private.parking_request_notifications() from public;
drop trigger if exists parking_request_owner_snapshot on public.requests;
create trigger parking_request_owner_snapshot
before insert or update on public.requests
for each row execute function private.parking_request_notifications();

create or replace function private.parking_emit_incident_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op='INSERT' then
    perform private.parking_queue_notification(new.community_id,'incident.created',new.id,null);
  elsif old.state is distinct from new.state and new.state='Cerrada' then
    perform private.parking_queue_notification(
      new.community_id,'incident.closed',new.id,new.responsible_at_event_user_id
    );
  end if;
  return null;
end;
$$;
revoke all on function private.parking_emit_incident_event() from public;
drop trigger if exists parking_incident_event_outbox on public.incidents;
create trigger parking_incident_event_outbox
after insert or update of state on public.incidents
for each row execute function private.parking_emit_incident_event();

create or replace function private.parking_emit_request_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op='INSERT' then
    perform private.parking_queue_notification(new.community_id,'request.created',new.id,null);
  elsif old.state is distinct from new.state and new.state in ('Aprobada','Rechazada') then
    perform private.parking_queue_notification(
      new.community_id,'request.resolved',new.id,new.responsible_at_request_user_id
    );
  end if;
  return null;
end;
$$;
revoke all on function private.parking_emit_request_event() from public;
drop trigger if exists parking_request_event_outbox on public.requests;
create trigger parking_request_event_outbox
after insert or update of state on public.requests
for each row execute function private.parking_emit_request_event();

-- Reserve a private object bucket; no public URLs or client write policies.
insert into storage.buckets(id,name,public)
values ('parking-private-reports','parking-private-reports',false)
on conflict (id) do nothing;
