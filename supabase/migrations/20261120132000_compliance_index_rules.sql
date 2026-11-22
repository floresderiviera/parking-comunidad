-- Versioned, explainable compliance rules and immutable closure snapshots.
-- Scores are advisory. No automatic sanction or manual score override is added.

create table public.compliance_rule_versions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  version integer not null check (version > 0),
  rules jsonb not null,
  reason text not null check (char_length(btrim(reason)) between 8 and 500),
  active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique (community_id, version)
);

create unique index compliance_rule_versions_one_active
  on public.compliance_rule_versions(community_id) where active;
create index compliance_rule_versions_history
  on public.compliance_rule_versions(community_id, version desc);

alter table public.compliance_rule_versions enable row level security;
revoke all on public.compliance_rule_versions from public, anon, authenticated;
grant select on public.compliance_rule_versions to authenticated, service_role;
grant all on public.compliance_rule_versions to service_role;

create policy compliance_rules_select_member
on public.compliance_rule_versions for select to authenticated
using (private.is_root() or private.is_community_member(community_id));

create or replace function private.default_compliance_rules()
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'open_normal',3,'open_attention',5,'open_high',8,'open_critical',12,
    'closed_normal',6,'closed_attention',10,'closed_high',16,'closed_critical',24,
    'followup_normal',1,'followup_attention',2,'followup_high',3,'followup_critical',4,
    'max_followups',4,'window_days',365,
    'recovery_1_days',30,'recovery_1_points',5,
    'recovery_2_days',60,'recovery_2_points',5,
    'recovery_3_days',90,'recovery_3_points',5,
    'recovery_extra_every_days',30,'recovery_extra_points',0,
    'recovery_cap_points',15
  );
$$;
revoke all on function private.default_compliance_rules() from public, anon, authenticated;

create or replace function private.validate_compliance_rules(input jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  defaults jsonb := private.default_compliance_rules();
  result jsonb := '{}'::jsonb;
  key text;
  value integer;
  weight_keys text[] := array[
    'open_normal','open_attention','open_high','open_critical',
    'closed_normal','closed_attention','closed_high','closed_critical',
    'followup_normal','followup_attention','followup_high','followup_critical',
    'recovery_1_points','recovery_2_points','recovery_3_points',
    'recovery_extra_points','recovery_cap_points'
  ];
begin
  input := coalesce(input,'{}'::jsonb);
  foreach key in array array_cat(weight_keys,array[
    'max_followups','window_days','recovery_1_days','recovery_2_days',
    'recovery_3_days','recovery_extra_every_days'
  ]) loop
    begin
      value := coalesce(nullif(input->>key,'')::integer,(defaults->>key)::integer);
    exception when others then
      raise exception 'Valor no válido para %.', key;
    end;
    result := result || jsonb_build_object(key,value);
  end loop;

  foreach key in array weight_keys loop
    value := (result->>key)::integer;
    if value < 0 or value > 100 then raise exception '% debe estar entre 0 y 100.', key; end if;
  end loop;
  if (result->>'max_followups')::integer not between 0 and 20 then
    raise exception 'max_followups debe estar entre 0 y 20.';
  end if;
  if (result->>'window_days')::integer not between 30 and 3650 then
    raise exception 'window_days debe estar entre 30 y 3650.';
  end if;
  if not ((result->>'recovery_1_days')::integer > 0
      and (result->>'recovery_2_days')::integer > (result->>'recovery_1_days')::integer
      and (result->>'recovery_3_days')::integer > (result->>'recovery_2_days')::integer) then
    raise exception 'Los hitos de recuperación deben ser crecientes.';
  end if;
  if (result->>'recovery_extra_every_days')::integer < 1 then
    raise exception 'La recuperación adicional debe usar un intervalo positivo.';
  end if;
  return result;
end;
$$;
revoke all on function private.validate_compliance_rules(jsonb) from public, anon, authenticated;

insert into public.compliance_rule_versions(community_id,version,rules,reason,active)
select c.id,1,private.default_compliance_rules(),'Reglas iniciales del índice de cumplimiento',true
from public.communities c
where not exists(select 1 from public.compliance_rule_versions r where r.community_id=c.id);

create or replace function public.parking_get_compliance_rules(p_community_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare row public.compliance_rule_versions%rowtype;
begin
  if not (private.is_root() or private.is_community_member(p_community_id)) then
    raise exception 'No tienes permisos para consultar estas reglas.';
  end if;
  select * into row from public.compliance_rule_versions
   where community_id=p_community_id and active order by version desc limit 1;
  if not found then
    return jsonb_build_object('id',null,'version',0,'rules',private.default_compliance_rules(),
      'reason','Reglas iniciales','created_at',null,'created_by',null);
  end if;
  return jsonb_build_object('id',row.id,'version',row.version,'rules',row.rules,
    'reason',row.reason,'created_at',row.created_at,'created_by',row.created_by);
end;
$$;
revoke all on function public.parking_get_compliance_rules(uuid) from public, anon;
grant execute on function public.parking_get_compliance_rules(uuid) to authenticated, service_role;

create or replace function public.parking_save_compliance_rules(
  p_community_id uuid, p_rules jsonb, p_reason text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  normalized jsonb;
  next_version integer;
  new_row public.compliance_rule_versions%rowtype;
  actor_email text;
begin
  if not (private.is_root() or private.has_community_role(p_community_id,array['ADMIN']::text[])) then
    raise exception 'Acceso exclusivo ADMIN.';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) < 8 then
    raise exception 'Indica un motivo de al menos 8 caracteres.';
  end if;
  normalized := private.validate_compliance_rules(p_rules);
  perform pg_advisory_xact_lock(hashtextextended(p_community_id::text,0));
  select coalesce(max(version),0)+1 into next_version
    from public.compliance_rule_versions where community_id=p_community_id;
  update public.compliance_rule_versions set active=false
   where community_id=p_community_id and active;
  insert into public.compliance_rule_versions(
    community_id,version,rules,reason,active,created_by
  ) values (p_community_id,next_version,normalized,btrim(p_reason),true,auth.uid())
  returning * into new_row;
  select email into actor_email from public.profiles where user_id=auth.uid();
  insert into public.audit_log(
    community_id,user_id,actor_email,action,entity,entity_id,
    observations,metadata
  ) values (
    p_community_id,auth.uid(),actor_email,'UPDATE','ComplianceRules',new_row.id,
    btrim(p_reason),jsonb_build_object('version',next_version,'rules',normalized)
  );
  return jsonb_build_object('id',new_row.id,'version',new_row.version,
    'rules',new_row.rules,'reason',new_row.reason,'created_at',new_row.created_at,
    'created_by',new_row.created_by);
end;
$$;
revoke all on function public.parking_save_compliance_rules(uuid,jsonb,text) from public, anon;
grant execute on function public.parking_save_compliance_rules(uuid,jsonb,text) to authenticated;

alter table public.incidents
  add column if not exists initial_priority text
    check (initial_priority in ('Normal','Atención','Alta','Crítica')),
  add column if not exists compliance_rule_version_id uuid
    references public.compliance_rule_versions(id) on delete restrict,
  add column if not exists compliance_outcome text
    check (compliance_outcome in ('CONFIRMED','EXCLUDED')),
  add column if not exists compliance_deduction smallint
    check (compliance_deduction between 0 and 100),
  add column if not exists compliance_scored_at timestamptz;

update public.incidents
set initial_priority=case when attempts=1 then priority else 'Normal' end
where initial_priority is null;
alter table public.incidents alter column initial_priority drop default;
alter table public.incidents alter column initial_priority set not null;

create or replace function private.capture_incident_compliance()
returns trigger language plpgsql set search_path = '' as $$
declare
  rule public.compliance_rule_versions%rowtype;
  rules jsonb;
  base_key text;
  followup_key text;
  followups integer;
  excluded boolean;
begin
  if tg_op='INSERT' then
    new.initial_priority := coalesce(new.initial_priority,new.priority,'Normal');
  else
    new.initial_priority := old.initial_priority;
  end if;
  if new.state='Cerrada' and (tg_op='INSERT' or old.state is distinct from new.state
      or old.compliance_deduction is null) then
    select * into rule from public.compliance_rule_versions
      where community_id=new.community_id and active order by version desc limit 1;
    rules := coalesce(rule.rules,private.default_compliance_rules());
    excluded := coalesce(new.close_action,'') in (
      '','Sin actuación','Datos corregidos','Anulada','Anulado','Infundada','Infundado'
    );
    followups := least((rules->>'max_followups')::integer,greatest(0,new.attempts-1));
    base_key := 'closed_' || case new.initial_priority
      when 'Atención' then 'attention' when 'Alta' then 'high'
      when 'Crítica' then 'critical' else 'normal' end;
    followup_key := 'followup_' || case new.priority
      when 'Atención' then 'attention' when 'Alta' then 'high'
      when 'Crítica' then 'critical' else 'normal' end;
    new.compliance_rule_version_id := rule.id;
    new.compliance_outcome := case when excluded then 'EXCLUDED' else 'CONFIRMED' end;
    new.compliance_deduction := case when excluded then 0 else least(100,
      (rules->>base_key)::integer + followups*(rules->>followup_key)::integer) end;
    new.compliance_scored_at := coalesce(new.closed_at,now());
  end if;
  return new;
end;
$$;
revoke all on function private.capture_incident_compliance() from public;
drop trigger if exists incidents_capture_compliance on public.incidents;
create trigger incidents_capture_compliance
before insert or update of state,close_action,priority,attempts on public.incidents
for each row execute function private.capture_incident_compliance();

-- Freeze the basis of already closed cases exactly once using the initial rule set.
update public.incidents set state=state
where state='Cerrada' and compliance_deduction is null;

comment on column public.incidents.compliance_deduction is
 'Frozen deduction at resolution. Later rule versions never rewrite this value.';
