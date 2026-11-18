begin;

-- Technical ROOT intentionally has no row in community_members. Incident actor
-- foreign keys therefore store NULL for ROOT, while normal ADMIN/CONTROL users
-- keep their membership user_id. This mirrors file_objects.created_by behavior.

create or replace function private.parking_incident_actor(p_community_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Sesión no autenticada.';
  end if;

  if private.is_root() then
    return null;
  end if;

  if exists (
    select 1
      from public.community_members cm
     where cm.community_id = p_community_id
       and cm.user_id = v_uid
       and cm.state = 'Activo'
  ) then
    return v_uid;
  end if;

  raise exception 'El usuario autenticado no tiene una membresía activa en la comunidad.';
end;
$$;

revoke all on function private.parking_incident_actor(uuid) from public, anon, authenticated;


create or replace function private.insert_parking_incident_candidate(
  p_community_id uuid,
  p_candidate jsonb
)
returns public.incidents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.incidents%rowtype;
  v_vehicle uuid := nullif(p_candidate->>'vehicle_id','')::uuid;
  v_dwelling uuid := nullif(p_candidate->>'dwelling_id','')::uuid;
  v_related_vehicle uuid := nullif(p_candidate->>'related_vehicle_id','')::uuid;
  v_related_dwelling uuid := nullif(p_candidate->>'related_dwelling_id','')::uuid;
begin
  if btrim(coalesce(p_candidate->>'description','')) = '' then raise exception 'Completa la observación / descripción.'; end if;
  if btrim(coalesce(p_candidate->>'photo_url','')) = '' then raise exception 'Debes adjuntar una fotografía antes de registrar la incidencia.'; end if;

  if v_vehicle is not null and not exists(select 1 from public.vehicles v where v.id=v_vehicle and v.community_id=p_community_id) then
    raise exception 'El vehículo de la incidencia no pertenece a la comunidad.';
  end if;
  if v_dwelling is not null and not exists(select 1 from public.dwellings d where d.id=v_dwelling and d.community_id=p_community_id) then
    raise exception 'La vivienda de la incidencia no pertenece a la comunidad.';
  end if;
  if v_related_vehicle is not null and not exists(select 1 from public.vehicles v where v.id=v_related_vehicle and v.community_id=p_community_id) then
    raise exception 'El vehículo relacionado no pertenece a la comunidad.';
  end if;
  if v_related_dwelling is not null and not exists(select 1 from public.dwellings d where d.id=v_related_dwelling and d.community_id=p_community_id) then
    raise exception 'La vivienda relacionada no pertenece a la comunidad.';
  end if;

  insert into public.incidents(
    community_id,created_by,observed_plate,infraction_plate,authorized_plate,
    dwelling_id,vehicle_id,type,description,photo_url,state,control_origin,origin_state,
    origin_vehicle_state,origin_qr_state,origin_vehicle_type,origin_slot,origin_habitual_plate,
    expired_itv,event_id,situation,cause,related_dwelling_id,related_vehicle_id,related_plate,
    attempts,priority,fluid_leak
  ) values (
    p_community_id,private.parking_incident_actor(p_community_id),
    public.normalize_plate(p_candidate->>'observed_plate'),
    public.normalize_plate(p_candidate->>'infraction_plate'),
    public.normalize_plate(p_candidate->>'authorized_plate'),
    v_dwelling,v_vehicle,p_candidate->>'type',p_candidate->>'description',p_candidate->>'photo_url','Abierta',
    coalesce(nullif(p_candidate->>'control_origin',''),'Manual'),coalesce(p_candidate->>'origin_state',''),
    nullif(p_candidate->>'origin_vehicle_state',''),nullif(p_candidate->>'origin_qr_state',''),nullif(p_candidate->>'origin_vehicle_type',''),
    nullif(p_candidate->>'origin_slot','')::smallint,public.normalize_plate(p_candidate->>'origin_habitual_plate'),
    coalesce((p_candidate->>'expired_itv')::boolean,false),coalesce(nullif(p_candidate->>'event_id',''),gen_random_uuid()::text),
    nullif(p_candidate->>'situation',''),nullif(p_candidate->>'cause',''),v_related_dwelling,v_related_vehicle,
    public.normalize_plate(p_candidate->>'related_plate'),1,'Normal',coalesce((p_candidate->>'fluid_leak')::boolean,false)
  ) returning * into v_row;
  return v_row;
end;
$$;



create or replace function public.save_parking_incident_followup(
  p_anchor_id uuid,
  p_candidates jsonb,
  p_observation text,
  p_photo_url text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan jsonb;
  v_op jsonb;
  v_existing public.incidents%rowtype;
  v_candidate jsonb;
  v_follow public.incident_followups%rowtype;
  v_created_row public.incidents%rowtype;
  v_attempt integer;
  v_relation text;
  v_updated jsonb := '[]'::jsonb;
  v_created jsonb := '[]'::jsonb;
  v_followup_ids jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
begin
  if btrim(coalesce(p_observation,''))='' then raise exception 'La observación del seguimiento es obligatoria.'; end if;
  if btrim(coalesce(p_photo_url,''))='' then raise exception 'La fotografía del seguimiento es obligatoria.'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_anchor_id::text, 0));
  v_plan := public.preview_parking_incident_followup(p_anchor_id,coalesce(p_candidates,'[]'::jsonb));
  if not coalesce((v_plan->>'canSave')::boolean,false) then
    if coalesce((v_plan->'summary'->>'skippedToday')::integer,0)>0 then raise exception 'Las incidencias vinculadas ya fueron registradas o seguidas hoy.'; end if;
    raise exception 'No hay incidencias abiertas disponibles para registrar seguimiento.';
  end if;

  for v_op in select value from jsonb_array_elements(v_plan->'operations')
  loop
    if v_op->>'action'='FOLLOWUP' then
      select * into v_existing from public.incidents where id=(v_op->'existing'->>'id')::uuid for update;
      if not found or v_existing.state<>'Abierta' then raise exception 'La incidencia ya no está abierta.'; end if;
      v_candidate := coalesce(v_op->'candidate','{}'::jsonb);
      v_attempt := greatest(1,coalesce(v_existing.attempts,1))+1;
      v_relation := private.parking_linked_relation_key(
        coalesce(nullif(v_candidate->>'type',''),v_existing.type),coalesce(nullif(v_candidate->>'situation',''),v_existing.situation),
        coalesce(nullif(v_candidate->>'control_origin',''),v_existing.control_origin),
        coalesce(nullif(v_candidate->>'related_vehicle_id','')::uuid,v_existing.related_vehicle_id),
        coalesce(nullif(v_candidate->>'related_plate',''),v_existing.related_plate)
      );
      insert into public.incident_followups(
        community_id,incident_id,event_id,followup_event_id,created_by,attempt_number,
        observed_plate,authorized_plate,control_origin,origin_state,situation,
        related_dwelling_id,related_vehicle_id,related_plate,observation,photo_url,relation_key
      ) values (
        v_existing.community_id,v_existing.id,v_existing.event_id,coalesce(nullif(v_op->>'event_id',''),v_plan->>'occurrenceEventId'),private.parking_incident_actor(v_existing.community_id),v_attempt,
        public.normalize_plate(coalesce(nullif(v_candidate->>'observed_plate',''),v_existing.observed_plate)),
        public.normalize_plate(coalesce(nullif(v_candidate->>'authorized_plate',''),v_existing.authorized_plate)),
        coalesce(nullif(v_candidate->>'control_origin',''),v_existing.control_origin),
        coalesce(nullif(v_candidate->>'origin_state',''),v_existing.origin_state),
        coalesce(nullif(v_candidate->>'situation',''),v_existing.situation),
        coalesce(nullif(v_candidate->>'related_dwelling_id','')::uuid,v_existing.related_dwelling_id),
        coalesce(nullif(v_candidate->>'related_vehicle_id','')::uuid,v_existing.related_vehicle_id),
        public.normalize_plate(coalesce(nullif(v_candidate->>'related_plate',''),v_existing.related_plate)),
        p_observation,p_photo_url,v_relation
      ) returning * into v_follow;
      update public.incidents set attempts=v_attempt,
        priority=case when v_attempt>=7 then 'Crítica' when v_attempt>=5 then 'Alta' when v_attempt>=3 then 'Atención' else 'Normal' end,
        last_followup_at=v_follow.occurred_at
       where id=v_existing.id;
      v_updated := v_updated || jsonb_build_array(v_existing.id::text);
      v_followup_ids := v_followup_ids || jsonb_build_array(v_follow.id::text);
    elsif v_op->>'action'='CREATE' then
      v_candidate := v_op->'candidate';
      v_candidate := jsonb_set(v_candidate,'{description}',to_jsonb(p_observation),true);
      v_candidate := jsonb_set(v_candidate,'{photo_url}',to_jsonb(p_photo_url),true);
      v_candidate := jsonb_set(v_candidate,'{event_id}',to_jsonb(coalesce(nullif(v_op->>'event_id',''),v_plan->>'occurrenceEventId')),true);
      v_created_row := private.insert_parking_incident_candidate((v_plan->'anchor'->>'community_id')::uuid,v_candidate);
      v_created := v_created || jsonb_build_array(to_jsonb(v_created_row));
    else
      v_skipped := v_skipped || jsonb_build_array(v_op);
    end if;
  end loop;

  return jsonb_build_object('ok',true,'updated',v_updated,'created',v_created,'followupIds',v_followup_ids,'skipped',v_skipped,'plan',v_plan);
end;
$$;



create or replace function public.close_parking_incident(
  p_incident_id uuid, p_action text, p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident public.incidents%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_qr_vehicle public.vehicles%rowtype;
  v_allowed text[] := array['Sin actuación','Aviso al propietario']::text[];
  v_state text;
  v_moto boolean := false;
begin
  select * into v_incident from public.incidents where id=p_incident_id for update;
  if not found then raise exception 'Incidencia no encontrada.'; end if;
  if not private.has_community_role(v_incident.community_id,array['ADMIN']::text[]) then raise exception 'No tienes permisos.'; end if;
  if v_incident.state='Cerrada' then raise exception 'La incidencia ya fue cerrada por otro usuario o proceso.'; end if;
  if btrim(coalesce(p_comment,''))='' then raise exception 'El comentario de cierre es obligatorio.'; end if;

  if v_incident.vehicle_id is not null then
    select * into v_vehicle from public.vehicles where id=v_incident.vehicle_id for update;
    v_state := v_vehicle.state;
    v_moto := v_vehicle.type='Moto';
  end if;

  if v_incident.type='Uso indebido' then
    if v_incident.situation='Cesión de QR' then
      if v_vehicle.id is not null and v_state='Activo' then
        if not v_moto and coalesce(v_vehicle.qr_state,'')<>'Revocado' then v_allowed:=array_append(v_allowed,'Revocar QR'); end if;
        v_allowed:=array_append(v_allowed,'Suspender vehículo');
      elsif v_vehicle.id is not null and v_state='Suspendido' then
        v_allowed:=array_append(v_allowed,'Mantener suspensión');
      end if;
      v_allowed:=array_append(v_allowed,'Otra');
    elsif v_incident.situation='Uso de QR ajeno' then
      if v_vehicle.id is not null and v_state='Activo' then v_allowed:=array_append(v_allowed,'Suspender vehículo');
      elsif v_vehicle.id is not null and v_state='Suspendido' then v_allowed:=array_append(v_allowed,'Mantener suspensión'); end if;
      v_allowed:=array_append(v_allowed,'Otra');
    else
      if v_vehicle.id is not null and v_state='Activo' then v_allowed:=array_append(v_allowed,'Suspender vehículo');
      elsif v_vehicle.id is not null and v_state='Suspendido' then v_allowed:=array_append(v_allowed,'Mantener suspensión'); end if;
      v_allowed:=array_append(v_allowed,'Otra');
    end if;
  elsif v_incident.type='QR no corresponde con matrícula' then
    if v_incident.related_vehicle_id is not null then
      select * into v_qr_vehicle from public.vehicles where id=v_incident.related_vehicle_id for update;
    else
      select * into v_qr_vehicle from public.vehicles
       where community_id=v_incident.community_id
         and normalized_habitual_plate=public.normalize_plate(coalesce(v_incident.authorized_plate,v_incident.related_plate))
       limit 1 for update;
    end if;
    if v_qr_vehicle.id is not null and v_qr_vehicle.type<>'Moto' and v_qr_vehicle.state='Activo' and coalesce(v_qr_vehicle.qr_state,'')<>'Revocado' then
      v_allowed:=array_append(v_allowed,'Revocar QR');
    end if;
    if v_vehicle.id is not null and v_state='Activo' then v_allowed:=array_append(v_allowed,'Suspender vehículo');
    elsif v_vehicle.id is not null and v_state='Suspendido' then v_allowed:=array_append(v_allowed,'Mantener suspensión'); end if;
    v_allowed:=array_append(v_allowed,'Otra');
  elsif v_incident.type='Acceso no autorizado' then
    if v_vehicle.id is not null and v_state='Suspendido' then v_allowed:=array_append(v_allowed,'Mantener suspensión'); end if;
    if v_vehicle.id is not null and v_state='Activo' and not v_moto and (v_incident.situation='QR revocado' or v_vehicle.qr_state='Revocado') then
      v_allowed:=array_append(v_allowed,'Renovar QR');
    end if;
    v_allowed:=array_append(v_allowed,'Datos corregidos');
    v_allowed:=array_append(v_allowed,'Otra');
  elsif v_incident.type='QR no presentado' then
    v_allowed:=array_append(v_allowed,'Otra');
  elsif v_incident.type='Matrícula no registrada' then
    v_allowed:=array_append(v_allowed,'Datos corregidos');
    v_allowed:=array_append(v_allowed,'Otra');
  else
    v_allowed:=array_append(v_allowed,'Datos corregidos');
    v_allowed:=array_append(v_allowed,'Otra');
  end if;

  if not (p_action=any(v_allowed)) then
    raise exception 'La acción seleccionada no corresponde al tipo de incidencia ni al estado actual del vehículo.';
  end if;

  if p_action='Revocar QR' then
    if v_incident.type='QR no corresponde con matrícula' then
      if v_qr_vehicle.id is null then raise exception 'No se pudo identificar el vehículo propietario del QR presentado.'; end if;
      perform public.revoke_vehicle_qr(v_qr_vehicle.id);
    else
      if v_vehicle.id is null then raise exception 'Esta incidencia no está vinculada a un vehículo del sistema.'; end if;
      perform public.revoke_vehicle_qr(v_vehicle.id);
    end if;
  elsif p_action='Renovar QR' then
    if v_vehicle.id is null then raise exception 'Esta incidencia no está vinculada a un vehículo del sistema.'; end if;
    perform public.renew_vehicle_qr(v_vehicle.id);
  elsif p_action='Suspender vehículo' then
    if v_vehicle.id is null then raise exception 'Esta incidencia no está vinculada a un vehículo del sistema.'; end if;
    if v_vehicle.state<>'Activo' then raise exception 'Solo se puede suspender un vehículo activo.'; end if;
    update public.vehicles set state='Suspendido' where id=v_vehicle.id;
    update public.requests set
      state='Rechazada',resolved_at=now(),resolved_by=private.parking_incident_actor(v_incident.community_id),
      resolution_notes='El vehículo fue suspendido al resolver una incidencia.'
     where vehicle_id=v_vehicle.id and type='RENOVACION_QR' and state='Abierta';
  end if;

  update public.incidents set
    state='Cerrada',closed_at=now(),closed_by=private.parking_incident_actor(v_incident.community_id),
    close_action=p_action,close_comment=p_comment
   where id=p_incident_id returning * into v_incident;
  return to_jsonb(v_incident);
end;
$$;



commit;
