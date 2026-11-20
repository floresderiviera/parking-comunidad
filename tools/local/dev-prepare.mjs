#!/usr/bin/env node
// Local-only, idempotent Parking QA fixtures. Never call a remote Supabase URL.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.chdir(root);
const config=fs.readFileSync('supabase/config.toml','utf8');
if (!/project_id\s*=\s*"parking-comunidad-revision"/.test(config)) {
  throw Error('Abortado: solo el proyecto local parking-comunidad-revision.');
}
if (!/\[api\][\s\S]*?port\s*=\s*54421/.test(config) || !/\[db\][\s\S]*?port\s*=\s*54422/.test(config)) {
  throw Error('Abortado: puertos locales 54421/54422 no confirmados.');
}
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL!=='http://127.0.0.1:54421') {
  throw Error('Abortado: SUPABASE_URL externa configurada.');
}
const origin='http://127.0.0.1:54421';
const status=execFileSync('npx',['supabase','status','-o','env'],{encoding:'utf8',timeout:45000,stdio:['ignore','pipe','pipe']});
const vars=Object.fromEntries(status.split(/\r?\n/).map(s=>s.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2].replace(/^"|"$/g,'')]));
const localUrl=(vars.API_URL||'').replace(/\/$/,'');
if (!['http://127.0.0.1:54421','http://localhost:54421'].includes(localUrl))throw Error('Abortado: status apunta a otra instancia.');
const serviceKey=vars.SERVICE_ROLE_KEY || vars.SECRET_KEY;
const anonKey=vars.ANON_KEY || vars.PUBLISHABLE_KEY;
if (!serviceKey||!anonKey)throw Error('No se encontraron SERVICE_ROLE_KEY y ANON_KEY en el status local.');
const headers={'apikey':serviceKey,'Authorization':'Bearer '+serviceKey,'Content-Type':'application/json'};
async function request(url,options={},allowed=[200,201,204]) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});
  const raw=await response.text();
  let data; try{data=raw?JSON.parse(raw):null}catch{data=raw}
  if(!allowed.includes(response.status)){
    const safe=typeof data==='object'&&data?JSON.stringify({code:data.code||data.error_code||'',message:data.message||data.msg||data.error||'Unexpected response'}):String(data).slice(0,220);
    throw Error(response.status+' '+safe+' at '+new URL(url).pathname);
  }
  return data;
}
async function rest(table,rows){
  const data=await request(origin+'/rest/v1/'+table+'?on_conflict=id',{
    method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify(rows)
  },[200,201]);
  return data;
}
function deterministicUuid(n){return '81000000-0000-4000-8000-'+String(n).padStart(12,'0');}
const qaDir='supabase/.temp';
fs.mkdirSync(qaDir,{recursive:true});
const credFile=path.join(qaDir,'qa-fixtures-credentials.json');
let credentials={};
if(fs.existsSync(credFile)){credentials=JSON.parse(fs.readFileSync(credFile,'utf8'))}
const identities=[
  {name:'ADMIN',email:'admin.qa.parking@example.com',roles:['ADMIN']},
  {name:'CONTROL',email:'control.qa.parking@example.com',roles:['CONTROL']},
  {name:'PROPIETARIO',email:'owner.qa.parking@example.com',roles:['PROPIETARIO']}
];
const users=[];
for(const identity of identities){
  if(!credentials[identity.name])credentials[identity.name]={email:identity.email,password:'QA-'+crypto.randomBytes(18).toString('base64url')+'9a'};
}
fs.writeFileSync(credFile,JSON.stringify(credentials,null,2)+'\n',{mode:0o600});
fs.chmodSync(credFile,0o600);
async function findUser(email){
  for(let page=1;page<=15;page++){
    const result=await request(origin+'/auth/v1/admin/users?page='+page+'&per_page=100',{headers});
    const users=Array.isArray(result)?result:(result.users||[]);
    const found=users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
    if(found)return found;
    if(users.length<100)break;
  }
  return null;
}
for(const identity of identities){
  const existing=await findUser(identity.email);
  let user;
  if(existing){
    user=await request(origin+'/auth/v1/admin/users/'+existing.id,{method:'PUT',headers,body:JSON.stringify({
      password:credentials[identity.name].password,email_confirm:true,user_metadata:{name:'QA '+identity.name}
    })});
  }else{
    user=await request(origin+'/auth/v1/admin/users',{method:'POST',headers,body:JSON.stringify({
      email:identity.email,password:credentials[identity.name].password,email_confirm:true,
      user_metadata:{name:'QA '+identity.name}
    })});
  }
  user=user.user||user;
  users.push({...identity,id:user.id});
}
const communityResult=await request(origin+'/rest/v1/communities?slug=eq.flores-de-riviera&select=id,slug,state',{headers});
if(communityResult.length!==1||communityResult[0].state!=='Activo')throw Error('No se encontró la comunidad semilla local.');
const communityId=communityResult[0].id;
for(const u of users){
  await request(origin+'/rest/v1/profiles?user_id=eq.'+u.id,{
    method:'PATCH',headers:{...headers,Prefer:'return=minimal'},
    body:JSON.stringify({name:'QA '+u.name,state:'Activo',is_root:false})
  },[200,204]);
}
await request(origin+'/rest/v1/community_members?on_conflict=community_id,user_id',{
  method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},
  body:JSON.stringify(users.map(u=>({community_id:communityId,user_id:u.id,roles:u.roles,state:'Activo'})))
},[200,201,204]);
const owner=users.find(u=>u.name==='PROPIETARIO');
const houses=[
  {id:deterministicUuid(101),community_id:communityId,display_name:'QA Bloque A - 1 A',block:'QA-A',floor:'1',apartment:'A',responsible_user_id:owner.id,state:'Activo'},
  {id:deterministicUuid(102),community_id:communityId,display_name:'QA Bloque A - 1 B',block:'QA-A',floor:'1',apartment:'B',responsible_user_id:owner.id,state:'Activo'}
];
await rest('dwellings',houses);
const vehicles=[
  {id:deterministicUuid(201),community_id:communityId,dwelling_id:houses[0].id,habitual_plate:'QA1001',type:'Particular',state:'Activo',slot:1},
  {id:deterministicUuid(202),community_id:communityId,dwelling_id:houses[1].id,habitual_plate:'QA1002',type:'Particular',state:'Activo',slot:1}
];
await rest('vehicles',vehicles);
const daysAgo=n=>new Date(Date.now()-n*86400000).toISOString();
const incidents=[
  {id:deterministicUuid(301),community_id:communityId,dwelling_id:houses[0].id,vehicle_id:vehicles[0].id,observed_plate:'QA1001',type:'Estacionamiento o ubicación indebida',description:'Prueba local QA: estacionamiento fuera de plaza',occurred_at:daysAgo(2),state:'Abierta'},
  {id:deterministicUuid(302),community_id:communityId,dwelling_id:houses[0].id,vehicle_id:vehicles[0].id,observed_plate:'QA1001',type:'Estacionamiento o ubicación indebida',description:'Prueba local QA: reincidencia',occurred_at:daysAgo(18),state:'Abierta'},
  {id:deterministicUuid(303),community_id:communityId,dwelling_id:houses[1].id,vehicle_id:vehicles[1].id,observed_plate:'QA1002',type:'QR no presentado',description:'Prueba local QA: control QR',occurred_at:daysAgo(3),state:'Abierta'}
];
await rest('incidents',incidents);
await rest('requests',[
  {id:deterministicUuid(401),community_id:communityId,dwelling_id:houses[0].id,vehicle_id:vehicles[0].id,requested_by:owner.id,type:'RENOVACION_QR',state:'Abierta',reason:'Solicitud QA renovación QR'},
  {id:deterministicUuid(402),community_id:communityId,dwelling_id:houses[1].id,vehicle_id:vehicles[1].id,requested_by:owner.id,type:'PERMANENCIA_PROLONGADA',state:'Abierta',reason:'Solicitud QA permanencia'}
]);
for(const u of users){
  const logged=await request(origin+'/auth/v1/token?grant_type=password',{
    method:'POST',headers:{'apikey':anonKey,'Content-Type':'application/json'},
    body:JSON.stringify({email:u.email,password:credentials[u.name].password})
  });
  if(!logged.access_token)throw Error('No se obtuvo JWT de '+u.name);
  const boot=await request(origin+'/rest/v1/rpc/app_bootstrap',{
    method:'POST',headers:{apikey:anonKey,Authorization:'Bearer '+logged.access_token,'Content-Type':'application/json'},
    body:'{}'
  });
  const memberships=boot.memberships||[];
  if(!memberships.some(m=>m.roles?.includes(u.name)))throw Error('Bootstrap no refleja rol '+u.name);
  if(boot.community_id!==communityId)throw Error('Bootstrap apunta a una comunidad distinta para '+u.name);
  console.log('PASS auth + bootstrap '+u.name);
}
const frontendConfig='assets/js/supabase-config.js';
const backup=frontendConfig+'.bak-devprepare';
if(!fs.existsSync(backup))fs.copyFileSync(frontendConfig,backup);
fs.writeFileSync(frontendConfig,
  'window.SUPABASE_CONFIG = {\n'+
  "  url: 'http://127.0.0.1:54421',\n"+
  "  publishableKey: '"+anonKey.replace(/'/g,"\\'")+"'\n"+
  '};\n'
);
console.log('\nPASS fixtures: 3 usuarios, 2 viviendas, 2 vehiculos, 3 incidencias, 2 solicitudes');
console.log('Credenciales privadas: '+credFile);
console.log('Frontend local configurado; no se ha tocado PRE ni produccion.');
console.log('Para iniciar sesion, consulta el archivo privado de credenciales en tu Mac.');