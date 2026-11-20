import { createClient } from 'npm:@supabase/supabase-js@2';
import ExcelJS from 'npm:exceljs@4.4.0';
import { isAllowedOrigin, jsonResponse, optionsResponse } from '../_shared/http.ts';

type RecordRow = Record<string, any>;
const url = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const zone = 'Europe/Madrid';
const bucket = 'parking-private-reports';

function safeText(value: unknown): string {
  const s = String(value ?? '');
  return /^[\s]*[=+\-@]/.test(s) ? "'" + s : s;
}
function html(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch] || ch));
}
function assertData<T>(result: { data: T | null; error: any }, label: string): T {
  if (result.error) throw new Error(label + ': ' + result.error.message);
  return result.data as T;
}
function localParts(at = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, year: 'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23', weekday:'short'
  });
  const p = Object.fromEntries(formatter.formatToParts(at).map(x=>[x.type,x.value]));
  return { date: p.year + '-' + p.month + '-' + p.day,
    weekday: p.weekday, hour:Number(p.hour),minute:Number(p.minute) };
}
function shiftDay(day: string, delta: number): string {
  const d = new Date(day + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()+delta);
  return d.toISOString().slice(0,10);
}
function previousWeek(at = new Date()) {
  const current = localParts(at).date;
  const dow = new Date(current+'T12:00:00Z').getUTCDay();
  const thisMonday = shiftDay(current,-((dow+6)%7));
  return { start:shiftDay(thisMonday,-7), end:thisMonday };
}
function madridMidnightUtc(date: string): string {
  const parts = date.split('-').map(Number);
  const approx = new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  const fmt = new Intl.DateTimeFormat('en-GB', {timeZone:zone,timeZoneName:'shortOffset'});
  const name = fmt.formatToParts(approx).find(p=>p.type==='timeZoneName')?.value || '';
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) throw new Error('Madrid offset not resolved: '+name);
  const sign = match[1]==='+'?1:-1;
  const mins = sign*(Number(match[2])*60+Number(match[3]||0));
  return new Date(approx.getTime()-mins*60000).toISOString();
}
async function allRows(table: string, columns: string, community: string, filter?: (q:any)=>any): Promise<RecordRow[]> {
  const result: RecordRow[] = [];
  for (let first=0; first<100000; first+=500) {
    let q = service.from(table).select(columns).eq('community_id',community).range(first,first+499);
    if (filter) q=filter(q);
    const page = assertData<RecordRow[]>(await q,table);
    result.push(...page);
    if (page.length<500) return result;
  }
  throw new Error('Pagination safety limit reached for '+table);
}
function makeSheet(book: ExcelJS.Workbook,name:string,headers:string[],widths:number[]) {
  const sheet=book.addWorksheet(name);
  sheet.columns=headers.map((header,i)=>({header,key:'c'+i,width:widths[i]||20}));
  sheet.getRow(1).font={bold:true};
  sheet.getRow(1).height=25;
  sheet.autoFilter={from:{row:1,column:1},to:{row:1,column:headers.length}};
  sheet.views=[{state:'frozen',ySplit:1}];
  return sheet;
}
function addSafe(sheet:ExcelJS.Worksheet, values:unknown[]) {
  sheet.addRow(values.map(v=>v instanceof Date?v:safeText(v)));
}
async function buildWorkbook(community:RecordRow, period:{start:string;end:string}, appUrl:string) {
  const [incidents,dwellings,profiles] = await Promise.all([
    allRows('incidents','id,community_id,dwelling_id,responsible_at_event_user_id,occurred_at,created_at,state,closed_at,type,priority,observed_plate,infraction_plate,last_followup_at',community.id),
    allRows('dwellings','id,community_id,display_name,block,floor,apartment,responsible_user_id',community.id),
    service.from('profiles').select('user_id,name,email').then(r=>assertData<RecordRow[]>(r,'profiles'))
  ]);
  const ds=new Map(dwellings.map(r=>[r.id,r]));
  const ps=new Map(profiles.map(r=>[r.user_id,r]));
  const from=madridMidnightUtc(period.start),to=madridMidnightUtc(period.end);
  const created=incidents.filter(r=>r.occurred_at>=from&&r.occurred_at<to);
  const openNew=created.filter(r=>r.state==='Abierta');
  const previous=incidents.filter(r=>r.occurred_at<from&&r.state==='Abierta');
  const names=(r:RecordRow)=>ds.get(r.dwelling_id)?.display_name || 'Sin vivienda identificada';
  const owner=(r:RecordRow)=>{const user=ps.get(r.responsible_at_event_user_id);return user?.name||user?.email||'Atribución pendiente';};
  const link=(r:RecordRow)=>appUrl+'?openIncident='+encodeURIComponent(r.id);
  const workbook=new ExcelJS.Workbook();
  workbook.creator='Parking Comunidad';
  workbook.created=new Date();
  const summary=makeSheet(workbook,'Resumen',['Concepto','Valor'],[43,28]);
  const summaryRows=[
    ['Comunidad',community.name],['Inicio (Europe/Madrid)',period.start],
    ['Fin exclusivo (Europe/Madrid)',period.end],
    ['Incidencias creadas',created.length],
    ['Creadas que siguen abiertas',openNew.length],
    ['Creadas ya cerradas',created.filter(r=>r.state==='Cerrada').length],
    ['Viviendas afectadas',new Set(created.map(r=>r.dwelling_id).filter(Boolean)).size],
    ['Pendientes de semanas anteriores',previous.length],
    ['Generado el',new Date().toISOString()]
  ];
  summaryRows.forEach(v=>addSafe(summary,v));
  const counter=(key:string)=>new Map([...new Set(created.map(r=>r[key]))].filter(Boolean).map(v=>[v,created.filter(r=>r[key]===v).length]));
  for(const [title,key] of [['Tipos','type'],['Prioridades','priority']]){
    addSafe(summary,['Distribución '+title,'']);
    for(const [name,count] of counter(key))addSafe(summary,[name,count]);
  }
  const headers=['ID','Fecha del hecho','Vivienda','Propietario atribuido','Matrícula','Tipo','Prioridad','Estado','Días abierta','Último seguimiento','Enlace'];
  const widths=[38,24,27,32,20,38,16,14,17,24,52];
  function detail(sheet:ExcelJS.Worksheet, rows:RecordRow[]) {
    rows.sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at));
    for(const r of rows){
      const days=Math.max(0,Math.floor((Date.now()-new Date(r.occurred_at).getTime())/86400000));
      const row=sheet.addRow([safeText(r.id),new Date(r.occurred_at),safeText(names(r)),
        safeText(owner(r)),safeText(r.infraction_plate||r.observed_plate||''),
        safeText(r.type),safeText(r.priority),safeText(r.state),days,
        r.last_followup_at?new Date(r.last_followup_at):'',safeText(link(r))]);
      row.getCell(2).numFmt='dd/mm/yyyy hh:mm';
      if(r.last_followup_at)row.getCell(10).numFmt='dd/mm/yyyy hh:mm';
      row.getCell(11).hyperlink=link(r);
    }
  }
  detail(makeSheet(workbook,'Creadas y abiertas',headers,widths),openNew);
  detail(makeSheet(workbook,'Pendientes anteriores',headers,widths),previous);
  const repeat=makeSheet(workbook,'Reincidencias',
    ['Ámbito','Vivienda / propietario','Incidencias totales','Abiertas','Últimos 365 días','Desglose de tipos'],[23,40,23,16,23,70]);
  const breakdown=(list:RecordRow[])=>[...new Map([...new Set(list.map(r=>r.type))].map(t=>[t,list.filter(r=>r.type===t).length]))].map(([n,v])=>n+': '+v).join('; ');
  const since=Date.now()-365*86400000;
  for(const d of dwellings){
    const rows=incidents.filter(r=>r.dwelling_id===d.id);
    addSafe(repeat,['Vivienda',d.display_name,rows.length,rows.filter(r=>r.state==='Abierta').length,rows.filter(r=>Date.parse(r.occurred_at)>=since).length,breakdown(rows)]);
  }
  const ownerIds=[...new Set(incidents.map(r=>r.responsible_at_event_user_id).filter(Boolean))];
  for(const id of ownerIds){
    const rows=incidents.filter(r=>r.responsible_at_event_user_id===id);
    addSafe(repeat,['Propietario',ps.get(id)?.name||ps.get(id)?.email||id,rows.length,rows.filter(r=>r.state==='Abierta').length,rows.filter(r=>Date.parse(r.occurred_at)>=since).length,breakdown(rows)]);
  }
  const notAssigned=incidents.filter(r=>!r.responsible_at_event_user_id);
  if(notAssigned.length)addSafe(repeat,['Pendiente de atribución','No imputar al propietario actual',notAssigned.length,notAssigned.filter(r=>r.state==='Abierta').length,notAssigned.filter(r=>Date.parse(r.occurred_at)>=since).length,breakdown(notAssigned)]);
  const buffer=await workbook.xlsx.writeBuffer();
  return { bytes:new Uint8Array(buffer as ArrayBuffer),created:created.length,openNew:openNew.length,previous:previous.length };
}
async function saveReport(community:RecordRow, period:{start:string;end:string}, appUrl:string) {
  const current=await service.from('parking_weekly_reports').select('*').eq('community_id',community.id).eq('period_start',period.start).maybeSingle();
  if(current.error)throw current.error;
  if(current.data?.state==='ready') return {status:'already_ready',community:community.slug};
  let record=current.data;
  if(!record) {
    const inserted=await service.from('parking_weekly_reports').insert({
      community_id:community.id,period_start:period.start,period_end:period.end
    }).select().single();
    if(inserted.error) {
      if(inserted.error.code==='23505')return {status:'concurrent',community:community.slug};
      throw inserted.error;
    }
    record=inserted.data;
  }
  try {
    const generated=await buildWorkbook(community,period,appUrl);
    const path=community.id+'/'+period.start+'/Informe_Incidencias_'+period.start+'.xlsx';
    const upload=await service.storage.from(bucket).upload(path,generated.bytes,{
      contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',upsert:true
    });
    if(upload.error)throw upload.error;
    const update=await service.from('parking_weekly_reports').update({
      attachment_path:path,state:'ready',last_error:null,generated_at:new Date().toISOString()
    }).eq('id',record.id);
    if(update.error)throw update.error;
    const queued=await service.rpc('parking_queue_weekly_report',{report_id:record.id});
    // RPC is private; use a restricted public wrapper if supported by schema exposure.
    if(queued.error) {
      const admins=await adminRecipients(community.id);
      for(const admin of admins){
        const result=await service.from('parking_notification_outbox').upsert({
          community_id:community.id,event_type:'weekly.report',entity_id:record.id,
          recipient_user_id:admin.user_id,recipient_email:admin.email,recipient_kind:'ADMIN',attachment_path:path
        },{onConflict:'community_id,event_type,entity_id,recipient_email',ignoreDuplicates:true});
        if(result.error)throw result.error;
      }
    }
    return {status:'ready',community:community.slug,...generated};
  }catch(e){
    await service.from('parking_weekly_reports').update({state:'failed',last_error:String(e).slice(0,1000)}).eq('id',record.id);
    throw e;
  }
}
async function adminRecipients(communityId:string) {
  const memberships=assertData<RecordRow[]>(await service.from('community_members').select('user_id,roles,state').eq('community_id',communityId).eq('state','Activo'),'members');
  const ids=memberships.filter(m=>(m.roles||[]).includes('ADMIN')).map(m=>m.user_id);
  if(!ids.length)return [];
  const profiles=assertData<RecordRow[]>(await service.from('profiles').select('user_id,email,state').in('user_id',ids),'profiles');
  return profiles.filter(p=>p.state==='Activo'&&/^[^ @]+@[^ @]+\.[^ @]+$/.test(p.email||''));
}
function encode64(buffer:Uint8Array) {
  let text='';
  for(let i=0;i<buffer.length;i+=8192)text+=String.fromCharCode(...buffer.slice(i,i+8192));
  return btoa(text);
}
async function outboxBody(row:RecordRow,appUrl:string) {
  if(row.event_type==='weekly.report')return {
    subject:'Informe semanal de incidencias - Parking Comunidad',
    body:'Se adjunta el informe semanal en Excel. Su contenido es confidencial.'
  };
  const table=row.event_type.startsWith('incident.')?'incidents':'requests';
  const res=await service.from(table).select('*').eq('id',row.entity_id).eq('community_id',row.community_id).single();
  const e=assertData<RecordRow>(res,'case');
  const isIncident=table==='incidents';
  const target=isIncident?'openIncident':'openRequest';
  const link=appUrl+'?'+target+'='+encodeURIComponent(e.id);
  const label=isIncident?'Incidencia':'Solicitud';
  const text=row.event_type.endsWith('.created')?'Nueva '+label.toLowerCase() :
    (isIncident?'Incidencia cerrada':'Solicitud resuelta');
  // Do not expose internal close comments or third-party vehicle information.
  const body=[text,'Identificador: '+e.id,'Tipo: '+e.type,
    'Estado: '+e.state,'Abrir expediente (requiere iniciar sesión): '+link].join('\n');
  return {subject:label+' - '+(row.event_type.endsWith('.created')?'nuevo registro':'resolución'),body};
}
async function processOutbox(appUrl:string,limit=20) {
  const now=new Date();
  const data=assertData<RecordRow[]>(await service.from('parking_notification_outbox').select('*')
    .in('state',['pending','failed','sending']).order('created_at',{ascending:true}).limit(100),'outbox');
  let sent=0,failed=0,blocked=0;
  for(const row of data) {
    if(sent+failed>=limit)break;
    if(row.next_attempt_at && new Date(row.next_attempt_at)>now)continue;
    if(row.state==='sending'&&row.locked_until&&new Date(row.locked_until)>now)continue;
    if(['incident.closed','weekly.report'].includes(row.event_type)&&!row.attachment_path){blocked++;continue;}
    const claim=await service.from('parking_notification_outbox').update({
      state:'sending',locked_until:new Date(Date.now()+120000).toISOString(),attempts:row.attempts+1
    }).eq('id',row.id).eq('state',row.state).eq('attempts',row.attempts).select('id').maybeSingle();
    if(claim.error||!claim.data)continue;
    try {
      if(row.recipient_user_id){
        const p=assertData<RecordRow>(await service.from('profiles').select('state').eq('user_id',row.recipient_user_id).single(),'recipient');
        const m=await service.from('community_members').select('state,roles').eq('community_id',row.community_id).eq('user_id',row.recipient_user_id).single();
        if(p.state!=='Activo'||m.error||m.data?.state!=='Activo'||(row.recipient_kind==='ADMIN'&&!(m.data.roles||[]).includes('ADMIN')))throw new Error('Recipient no longer authorized');
      }
      const {subject,body}=await outboxBody(row,appUrl);
      const attachments:any[]=[];
      if(row.attachment_path){
        const download=await service.storage.from(bucket).download(row.attachment_path);
        if(download.error||!download.data)throw download.error||new Error('Missing attachment');
        const bytes=new Uint8Array(await download.data.arrayBuffer());
        if(bytes.length>12*1024*1024)throw new Error('Attachment exceeds size limit');
        attachments.push({filename:row.event_type==='weekly.report'?'Informe_semanal.xlsx':'Informe_incidencia.pdf',content:encode64(bytes)});
      }
      if(Deno.env.get('PARKING_EMAIL_DRY_RUN')!=='false'){
        // Preview is explicit: never mark an unsent notification as sent.
        await service.from('parking_notification_outbox').update({
          state:'pending',locked_until:null,attempts:row.attempts
        }).eq('id',row.id);
        blocked++;
        continue;
      }
      const apiKey=Deno.env.get('RESEND_API_KEY')||'',from=Deno.env.get('PARKING_MAIL_FROM')||'';
      if(!apiKey||!from)throw new Error('Email provider credentials missing');
      const resp=await fetch('https://api.resend.com/emails',{
        method:'POST',headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},
        body:JSON.stringify({from,to:[row.recipient_email],subject,text:body,attachments})
      });
      const result=await resp.json().catch(()=>({}));
      if(!resp.ok||!result.id)throw new Error('Email provider rejected request: '+resp.status);
      const saved=await service.from('parking_notification_outbox').update({
        state:'sent',provider_message_id:result.id,locked_until:null,
        sent_at:new Date().toISOString(),last_error:null
      }).eq('id',row.id);
      if(saved.error)throw saved.error;
      sent++;
    }catch(err) {
      await service.from('parking_notification_outbox').update({
        state:'failed',locked_until:null,last_error:String(err).slice(0,500),
        next_attempt_at:new Date(Date.now()+Math.min(24,2**Math.min(row.attempts+1,5))*3600000).toISOString()
      }).eq('id',row.id);
      failed++;
    }
  }
  return {sent,failed,blocked};
}
async function authenticatedAdmin(req:Request, communityId:string) {
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)throw new Error('Missing authorization');
  const auth=await service.auth.getUser(token);
  if(auth.error||!auth.data.user)throw new Error('Invalid session');
  const id=auth.data.user.id;
  const p=assertData<RecordRow>(await service.from('profiles').select('is_root,state').eq('user_id',id).single(),'profile');
  if(p.state!=='Activo')throw new Error('Inactive profile');
  if(p.is_root)return id;
  const membership=assertData<RecordRow>(await service.from('community_members').select('roles,state').eq('community_id',communityId).eq('user_id',id).single(),'membership');
  if(membership.state!=='Activo'||!(membership.roles||[]).includes('ADMIN'))throw new Error('ADMIN required');
  return id;
}
Deno.serve(async (req:Request)=>{
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS')return optionsResponse(origin);
  if(req.method!=='POST'||!isAllowedOrigin(origin))return jsonResponse(403,{error:'Forbidden'},origin);
  if(!url||!serviceKey)return jsonResponse(503,{error:'Server not configured'},origin);
  try {
    const body=await req.json();
    const action=String(body.action||'');
    const appUrl=String(Deno.env.get('PARKING_APP_URL')||'').replace(/\/$/,'');
    if(!/^https:\/\//.test(appUrl)&&!/^http:\/\/127\.0\.0\.1(?::\d+)?/.test(appUrl))throw new Error('PARKING_APP_URL missing or invalid');
    if(action==='tick') {
      const secret=Deno.env.get('PARKING_CRON_SECRET');
      if(!secret||req.headers.get('x-parking-cron-secret')!==secret)throw new Error('Unauthorized scheduler');
      const local=localParts();
      const reports=[];
      if(local.weekday==='Mon'&&local.hour===8) {
        const period=previousWeek();
        const communities=assertData<RecordRow[]>(await service.from('communities').select('id,name,slug').eq('state','Activo'),'communities');
        for(const c of communities)try{reports.push(await saveReport(c,period,appUrl))}catch(e){reports.push({community:c.slug,error:String(e)})}
      }
      const outbox=await processOutbox(appUrl);
      return jsonResponse(200,{ok:true,local,reports,outbox,dryRun:Deno.env.get('PARKING_EMAIL_DRY_RUN')!=='false'},origin);
    }
    if(action==='weekly-manual') {
      const communityId=String(body.community_id||'');
      await authenticatedAdmin(req,communityId);
      const c=assertData<RecordRow>(await service.from('communities').select('id,name,slug').eq('id',communityId).single(),'community');
      const report=await saveReport(c,previousWeek(),appUrl);
      return jsonResponse(200,{ok:true,report},origin);
    }
    return jsonResponse(400,{error:'Unknown action'},origin);
  }catch(e){return jsonResponse(400,{error:String(e)},origin)}
});
