-- Weekly report registry and outbox attachment support.
alter table public.parking_notification_outbox
  drop constraint if exists parking_notification_outbox_event_type_check;
alter table public.parking_notification_outbox
  add constraint parking_notification_outbox_event_type_check
  check (event_type in ('incident.created','incident.closed','request.created','request.resolved','weekly.report'));

create table public.parking_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  generated_at timestamptz not null default now(),
  attachment_path text,
  state text not null default 'preparing' check(state in ('preparing','ready','failed')),
  last_error text,
  unique(community_id,period_start),
  check(period_end=period_start+7)
);

alter table public.parking_weekly_reports enable row level security;
revoke all on public.parking_weekly_reports from public,anon,authenticated;
grant all on public.parking_weekly_reports to service_role;

comment on table public.parking_weekly_reports is
 'Generated weekly XLSX reports with duplicate protection. Private storage only.';

create or replace function private.parking_queue_weekly_report(report_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare r public.parking_weekly_reports%rowtype;
begin
  select * into r from public.parking_weekly_reports
   where id=report_id and state='ready' and attachment_path is not null;
  if not found then raise exception 'Weekly report not ready'; end if;

  insert into public.parking_notification_outbox
   (community_id,event_type,entity_id,recipient_user_id,recipient_email,recipient_kind,attachment_path)
  select r.community_id,'weekly.report',r.id,p.user_id,lower(trim(p.email)),'ADMIN',r.attachment_path
    from public.community_members cm
    join public.profiles p on p.user_id=cm.user_id
   where cm.community_id=r.community_id and cm.state='Activo'
     and p.state='Activo' and 'ADMIN'=any(cm.roles)
     and p.email~* '^[^ @]+@[^ @]+\\.[^ @]+$'
  on conflict (community_id,event_type,entity_id,recipient_email) do nothing;
end;
$$;
revoke all on function private.parking_queue_weekly_report(uuid) from public,anon,authenticated;
grant execute on function private.parking_queue_weekly_report(uuid) to service_role;
