begin;
select plan(10);

-- Las pruebas usan únicamente datos ficticios y se revierten con rollback.
insert into auth.users (
 id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
 confirmation_token,email_change,email_change_token_new,recovery_token
) values
 ('71000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-admin@example.invalid','',now(),'{}','{}',now(),now(),'','','',''),
 ('71000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-owner@example.invalid','',now(),'{}','{}',now(),now(),'','','','');
insert into public.communities(id,slug,name) values
 ('72000000-0000-4000-8000-000000000001','compliance-qa','Compliance QA');
insert into public.community_members(community_id,user_id,roles,state) values
 ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001',array['ADMIN'],'Activo'),
 ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000002',array['PROPIETARIO'],'Activo');
insert into public.dwellings(id,community_id,display_name,responsible_user_id)
values('73000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','Prueba A','71000000-0000-4000-8000-000000000002');

select ok(to_regclass('public.compliance_rule_versions') is not null,
 'Existe tabla de versiones');
select ok(not has_table_privilege('authenticated','public.compliance_rule_versions','INSERT'),
 'Un usuario autenticado no puede insertar versiones directamente');
select ok(not has_table_privilege('authenticated','public.compliance_rule_versions','UPDATE'),
 'Un usuario autenticado no puede reescribir versiones');

select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '71000000-0000-4000-8000-000000000001',
    'role', 'authenticated',
    'iat', extract(epoch from now())::bigint
  )::text,
  true
);
set local role authenticated;
select is((public.parking_get_compliance_rules('72000000-0000-4000-8000-000000000001')->>'version')::int,
 0,'Comunidad nueva recibe reglas por defecto');
select is((public.parking_save_compliance_rules('72000000-0000-4000-8000-000000000001',
 '{"open_normal":9}'::jsonb,'Primer cambio de pesos de prueba')->>'version')::int,
 1,'ADMIN crea primera versión');
select is((public.parking_save_compliance_rules('72000000-0000-4000-8000-000000000001',
 '{"closed_normal":10}'::jsonb,'Segunda versión de prueba')->>'version')::int,
 2,'ADMIN puede crear siguiente versión');
select is((select count(*)::int from public.compliance_rule_versions
 where community_id='72000000-0000-4000-8000-000000000001' and active),
 1,'Solo una versión puede estar activa');
reset role;

insert into public.incidents(id,community_id,dwelling_id,type,description,priority,attempts)
values('74000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001',
 '73000000-0000-4000-8000-000000000001','Otro','Incidencia de prueba','Normal',1);
update public.incidents set state='Cerrada',closed_at=now(),close_action='Aviso al propietario'
where id='74000000-0000-4000-8000-000000000001';
select is((select compliance_deduction::int from public.incidents
where id='74000000-0000-4000-8000-000000000001'),10,
 'El cierre congela el descuento de la versión activa');
select is((select compliance_outcome from public.incidents
where id='74000000-0000-4000-8000-000000000001'),'CONFIRMED',
 'El cierre con actuación se registra como computable');
select is((select count(*)::int from public.compliance_rule_versions
where community_id='72000000-0000-4000-8000-000000000001'),2,
 'Se preserva el histórico de reglas');

select * from finish();
rollback;
