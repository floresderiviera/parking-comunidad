begin;
select plan(13);

insert into auth.users (
 id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
 confirmation_token,email_change,email_change_token_new,recovery_token
) values
 ('61000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','case-a@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
 ('61000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','case-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','',''),
 ('61000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','case-admin@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');

insert into public.communities(id,slug,name)
values ('62000000-0000-4000-8000-000000000001','case-tests','Case Tests');

insert into public.community_members(community_id,user_id,roles,state) values
 ('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001',array['PROPIETARIO'],'Activo'),
 ('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002',array['PROPIETARIO'],'Activo'),
 ('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003',array['ADMIN'],'Activo');

insert into public.dwellings(id,community_id,display_name,responsible_user_id)
values ('63000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001','Block 1 A','61000000-0000-4000-8000-000000000001');

insert into public.incidents(id,community_id,dwelling_id,type,description)
values ('64000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001','63000000-0000-4000-8000-000000000001','Otro','Test incident');

select is(
 (select responsible_at_event_user_id from public.incidents where id='64000000-0000-4000-8000-000000000001'),
 '61000000-0000-4000-8000-000000000001'::uuid,
 'Incident freezes original owner');

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='64000000-0000-4000-8000-000000000001' and event_type='incident.created'),
 1,'New incident queues one ADMIN recipient');

update public.dwellings set responsible_user_id='61000000-0000-4000-8000-000000000002'
 where id='63000000-0000-4000-8000-000000000001';
update public.incidents set description='Changed while case is open'
 where id='64000000-0000-4000-8000-000000000001';

select is(
 (select responsible_at_event_user_id from public.incidents where id='64000000-0000-4000-8000-000000000001'),
 '61000000-0000-4000-8000-000000000001'::uuid,
 'Incident retains historical responsible after a dwelling owner change');

select is(
 (select total_incidents from public.parking_incident_dwelling_stats where dwelling_id='63000000-0000-4000-8000-000000000001'),
 1::bigint,'Dwelling count remains one incident');

select is(
 (select total_incidents from public.parking_incident_owner_stats where owner_user_id='61000000-0000-4000-8000-000000000001'),
 1::bigint,'Original owner aggregate remains one');

update public.incidents set state='Cerrada',closed_at=now(),close_action='Sin actuación'
 where id='64000000-0000-4000-8000-000000000001';

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='64000000-0000-4000-8000-000000000001' and event_type='incident.closed'),
 2,'Closing queues one ADMIN and original OWNER');

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='64000000-0000-4000-8000-000000000001' and event_type='incident.closed' and recipient_user_id='61000000-0000-4000-8000-000000000002'),
 0,'New dwelling owner never receives prior owner incident');

update public.incidents set close_comment='Updated after closing'
 where id='64000000-0000-4000-8000-000000000001';

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='64000000-0000-4000-8000-000000000001' and event_type='incident.closed'),
 2,'Closed event is not duplicated by subsequent updates');

insert into public.requests(id,community_id,dwelling_id,type,reason)
values ('65000000-0000-4000-8000-000000000001','62000000-0000-4000-8000-000000000001','63000000-0000-4000-8000-000000000001','RENOVACION_QR','Test request');

select is(
 (select responsible_at_request_user_id from public.requests where id='65000000-0000-4000-8000-000000000001'),
 '61000000-0000-4000-8000-000000000002'::uuid,
 'Request freezes responsible when created');

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='65000000-0000-4000-8000-000000000001' and event_type='request.created'),
 1,'New request queues ADMIN');

update public.dwellings set responsible_user_id='61000000-0000-4000-8000-000000000001'
 where id='63000000-0000-4000-8000-000000000001';
update public.requests set state='Aprobada',resolved_at=now()
 where id='65000000-0000-4000-8000-000000000001';

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='65000000-0000-4000-8000-000000000001' and event_type='request.resolved'),
 2,'Resolved request notifies ADMIN and original requester responsible');

select is(
 (select count(*)::int from public.parking_notification_outbox where entity_id='65000000-0000-4000-8000-000000000001' and event_type='request.resolved' and recipient_user_id='61000000-0000-4000-8000-000000000001'),
 0,'Resolved request excludes subsequently assigned owner');

select ok(not has_table_privilege('authenticated','public.parking_notification_outbox','SELECT'),
 'Outbox inaccessible to authenticated clients');

select * from finish();
rollback;
