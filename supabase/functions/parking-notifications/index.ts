import { createClient } from 'npm:@supabase/supabase-js@2';
import ExcelJS from 'npm:exceljs@4.4.0';
import { isAllowedOrigin, jsonResponse, optionsResponse } from '../_shared/http.ts';

type RecordRow = Record<string, any>;
const url = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const zone = 'Europe/Madrid';
const bucket = 'parking-private-reports';

// Gmail API configuration (OAuth2). No tokens are ever sent to the browser.
const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID') || '';
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET') || '';
const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN') || '';
const GMAIL_SENDER_EMAIL = Deno.env.get('GMAIL_SENDER_EMAIL') || 'parkinggestioncomunidad@gmail.com';
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
let gmailAccessToken: { token: string; expiresAt: number } | null = null;

async function getGmailAccessToken(): Promise<string> {
  const now = Date.now();
  if (gmailAccessToken && gmailAccessToken.expiresAt > now + 60000) return gmailAccessToken.token;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN)
    throw new Error('Gmail OAuth2 credentials not configured');
  const params = new URLSearchParams({
    client_id:GMAIL_CLIENT_ID,client_secret:GMAIL_CLIENT_SECRET,
    refresh_token:GMAIL_REFRESH_TOKEN,grant_type:'refresh_token'
  });
  const resp = await fetch(GMAIL_TOKEN_URL, {
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:params.toString()
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.access_token) throw new Error('Gmail OAuth2 token request rejected: '+resp.status);
  gmailAccessToken = {token:data.access_token,expiresAt:now+Math.max(1,Number(data.expires_in)||3600)*1000};
  return gmailAccessToken.token;
}

function gmailMimeHeader(value:string):string {
  if (/[\r\n]/.test(value)) throw new Error('Invalid MIME header');
  return value;
}
function gmailBase64Utf8(text:string):string {
  return encode64(new TextEncoder().encode(text));
}
function gmailFoldBase64(text:string):string {
  return (text.match(/.{1,76}/g)||[]).join('\r\n');
}
function gmailSubject(text:string):string {
  gmailMimeHeader(text);
  // RFC 2047 encoded-words must remain under 75 characters.
  const chars=[...text];let parts:string[]=[],chunk='';
  for(const char of chars){
    if(chunk && gmailBase64Utf8(chunk+char).length>56){
      parts.push('=?UTF-8?B?'+gmailBase64Utf8(chunk)+'?=');chunk='';
    }
    chunk+=char;
  }
  if(chunk)parts.push('=?UTF-8?B?'+gmailBase64Utf8(chunk)+'?=');
  return parts.join('\r\n ');
}
function gmailRawMessage(to:string,subject:string,textBody:string,
    attachments:Array<{filename:string;content:string}>, outboxId:string):string {
  if(!/^[^\s@,;<>]+@[^\s@,;<>]+$/.test(to)) throw new Error('Invalid destination email');
  if(!/^[0-9a-f-]{36}$/i.test(outboxId)) throw new Error('Invalid outbox id');
  gmailMimeHeader(GMAIL_SENDER_EMAIL);
  const boundary='parking_'+crypto.randomUUID();
  const lines=[
    'From: '+GMAIL_SENDER_EMAIL,'To: '+to,'Subject: '+gmailSubject(subject),
    'MIME-Version: 1.0','X-Parking-Outbox-ID: '+outboxId,
    'Content-Type: multipart/mixed; boundary="'+boundary+'"','',
    '--'+boundary,'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64','',gmailFoldBase64(gmailBase64Utf8(textBody)),'',
  ];
  for(const att of attachments){
    const file=String(att.filename||'');
    if(!/^[A-Za-z0-9._-]{1,100}$/.test(file))throw new Error('Invalid attachment filename');
    const base=String(att.content||'').replace(/\s+/g,'');
    if(!/^[A-Za-z0-9+/]*={0,2}$/.test(base)||base.length%4)throw new Error('Invalid attachment encoding');
    lines.push('--'+boundary,
      'Content-Type: application/octet-stream; name="'+file+'"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="'+file+'"','',gmailFoldBase64(base),'');
  }
  lines.push('--'+boundary+'--','');
  const bytes=new TextEncoder().encode(lines.join('\r\n'));
  return encode64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function sendViaGmailApi(to:string, subject:string, textBody:string,
    attachments:Array<{filename:string;content:string}>, outboxId:string):Promise<string>{
  const raw=gmailRawMessage(to,subject,textBody,attachments,outboxId);
  const accessToken=await getGmailAccessToken();
  const resp=await fetch(GMAIL_SEND_URL,{
    method:'POST',headers:{authorization:'Bearer '+accessToken,'content-type':'application/json'},
    body:JSON.stringify({raw})
  });
  const result=await resp.json().catch(()=>({}));
  if(!resp.ok||!result.id)throw new Error('Gmail API rejected message: HTTP '+resp.status);
  return String(result.id);
}

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
  sheet.views=[{state:'frozen',ySplit:1}];
  sheet.views=[{state:'frozen',ySplit:1,showGridLines:false}];
  const heading=sheet.getRow(1);
  heading.font={bold:true,color:{argb:'FFFFFFFF'},size:11};
  heading.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF145D4B'}};
  heading.alignment={vertical:'middle',wrapText:true};
  heading.height=31;
  sheet.autoFilter={from:{row:1,column:1},to:{row:1,column:headers.length}};
  return sheet;
}
function addSafe(sheet:ExcelJS.Worksheet, values:unknown[]) {
  const row=sheet.addRow(values.map(v=>v instanceof Date||typeof v==='number'?v:safeText(v)));
  row.alignment={vertical:'top',wrapText:true};
  if(row.number%2===0){
    row.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF3F8F6'}};
  }
  return row;
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
  const toDate=new Date(to),periodStartDate=new Date(from);
  // La foto histórica incluye exclusivamente registros existentes y hechos anteriores al corte.
  // No se reconstruyen reaperturas si no hay un historial de transiciones de estado.
  const historical=incidents.filter(r=>r.id && r.created_at && r.occurred_at && r.created_at<to && r.occurred_at<to);
  const createdInPeriod=historical.filter(r=>r.created_at>=from);
  const closedThisWeek=historical.filter(r=>r.closed_at && new Date(r.closed_at)>=periodStartDate && new Date(r.closed_at)<toDate);
  const openAtEnd=(r:RecordRow)=>!r.closed_at || new Date(r.closed_at)>=toDate;
  const openNew=createdInPeriod.filter(openAtEnd);
  const previous=historical.filter(r=>r.created_at<from && openAtEnd(r));
  const byId=new Map<string,RecordRow>();
  for(const r of [...createdInPeriod,...closedThisWeek,...previous])byId.set(r.id,r);
  const relevant=[...byId.values()];
  const names=(r:RecordRow)=>ds.get(r.dwelling_id)?.display_name || 'Sin vivienda identificada';
  const owner=(r:RecordRow)=>{const u=ps.get(r.responsible_at_event_user_id);return u?.name||u?.email||'Atribución pendiente';};
  const propertyOwner=(r:RecordRow)=>{
    const u=ps.get(ds.get(r.dwelling_id)?.responsible_user_id);
    return u?.name||u?.email||'Sin responsable actual identificado';
  };
  const link=(r:RecordRow)=>appUrl+'?openIncident='+encodeURIComponent(r.id);
  const weekType=(r:RecordRow)=>{
    const created=r.created_at>=from,closed=!!r.closed_at && new Date(r.closed_at)>=periodStartDate && new Date(r.closed_at)<toDate;
    return created&&closed?'Creada y cerrada':closed?'Cerrada en semana':created?'Nueva / abierta':'Pendiente anterior';
  };
  const breakdown=(rows:RecordRow[])=>{
    const counts=new Map<string,number>();
    for(const r of rows){const t=String(r.type||'Sin tipo');counts.set(t,(counts.get(t)||0)+1);}
    return [...counts].sort((a,b)=>b[1]-a[1]).map(([t,n])=>`${t}: ${n}`).join('; ');
  };
  const lastDate=(rows:RecordRow[])=>rows.reduce((max,r)=>r.occurred_at>max?r.occurred_at:max,'');
  const workbook=new ExcelJS.Workbook();
  workbook.creator='Parking Comunidad';
  workbook.created=new Date();

  // 1. Una sola fila por vivienda afectada, con identificador estable (no por nombre).
  const vivienda=makeSheet(workbook,'Por vivienda',
    ['Vivienda','Responsable actual vivienda (referencial)','Casos relevantes','Nuevas','Cerradas en semana','Abiertas al cierre','Pendientes anteriores','Tipos','Último hecho','IDs de incidencias'],
    [29,35,19,13,20,20,23,65,23,75]);
  const byDwelling=new Map<string,RecordRow[]>();
  for(const r of relevant){
    const id=r.dwelling_id||'SIN_VIVIENDA';
    byDwelling.set(id,[...(byDwelling.get(id)||[]),r]);
  }
  for(const [,rows] of [...byDwelling].sort((a,b)=>b[1].length-a[1].length||names(a[1][0]).localeCompare(names(b[1][0])))){
    const created=rows.filter(r=>r.created_at>=from);
    const closed=rows.filter(r=>r.closed_at && new Date(r.closed_at)>=periodStartDate && new Date(r.closed_at)<toDate);
    const prior=rows.filter(r=>r.created_at<from && openAtEnd(r));
    const row=addSafe(vivienda,[names(rows[0]),propertyOwner(rows[0]),rows.length,created.length,closed.length,
      rows.filter(openAtEnd).length,prior.length,breakdown(rows),lastDate(rows)?new Date(lastDate(rows)):'',rows.map(r=>r.id).join('; ')]);
    if(lastDate(rows))row.getCell(9).numFmt='dd/mm/yyyy hh:mm';
  }

  // 2. Una sola fila por responsable atribuido al hecho; jamás imputar por defecto al propietario actual.
  const owners=makeSheet(workbook,'Por propietario',
    ['Propietario atribuido','Viviendas afectadas','Casos relevantes','Nuevas','Cerradas en semana','Abiertas al cierre','Pendientes anteriores','Tipos','Último hecho','IDs de incidencias'],
    [35,54,19,13,20,20,23,65,23,75]);
  const byOwner=new Map<string,RecordRow[]>();
  for(const r of relevant){
    const id=r.responsible_at_event_user_id||'SIN_ATRIBUCION';
    byOwner.set(id,[...(byOwner.get(id)||[]),r]);
  }
  for(const [,rows] of [...byOwner].sort((a,b)=>b[1].length-a[1].length||owner(a[1][0]).localeCompare(owner(b[1][0])))){
    const row=addSafe(owners,[owner(rows[0]),[...new Set(rows.map(names))].sort().join('; '),rows.length,
      rows.filter(r=>r.created_at>=from).length,
      rows.filter(r=>r.closed_at && new Date(r.closed_at)>=periodStartDate && new Date(r.closed_at)<toDate).length,
      rows.filter(openAtEnd).length,rows.filter(r=>r.created_at<from && openAtEnd(r)).length,
      breakdown(rows),lastDate(rows)?new Date(lastDate(rows)):'',rows.map(r=>r.id).join('; ')]);
    if(lastDate(rows))row.getCell(9).numFmt='dd/mm/yyyy hh:mm';
  }

  // 3. Casos individuales: una fila por ID, con atribución y propietario actual diferenciados.
  const detailSheet=makeSheet(workbook,'Detalle incidencias',
    ['ID','Fecha del hecho','Vivienda','Propietario atribuido al hecho','Responsable actual de vivienda','Matrícula','Tipo','Prioridad','Estado al corte','Clasificación semanal','Días abierta','Último seguimiento anterior al corte','Enlace'],
    [39,24,30,38,38,20,40,16,20,24,18,27,55]);
  for(const r of [...relevant].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at))){
    const occurred=new Date(r.occurred_at);
    const endRef=r.closed_at && new Date(r.closed_at)<toDate?new Date(r.closed_at):toDate;
    const days=Math.max(0,Math.floor((endRef.getTime()-occurred.getTime())/86400000));
    const row=addSafe(detailSheet,[r.id,occurred,names(r),owner(r),propertyOwner(r),r.infraction_plate||r.observed_plate||'',
      r.type||'',r.priority||'',openAtEnd(r)?'Abierta':'Cerrada',weekType(r),days,
      r.last_followup_at && r.last_followup_at<to ? new Date(r.last_followup_at):'',link(r)]);
    row.getCell(2).numFmt='dd/mm/yyyy hh:mm';
    if(r.last_followup_at && r.last_followup_at<to)row.getCell(12).numFmt='dd/mm/yyyy hh:mm';
    row.getCell(13).value={text:link(r),hyperlink:link(r)};
  }

  // 4. Pendientes de semanas anteriores agrupados por vivienda y con propietario atribuido.
  const pending=makeSheet(workbook,'Pendientes anteriores',
    ['Vivienda','Propietario atribuido','ID','Fecha del hecho','Tipo','Prioridad','Matrícula','Días al cierre','Enlace'],
    [29,38,39,24,42,16,20,17,54]);
  for(const r of [...previous].sort((a,b)=>names(a).localeCompare(names(b))||a.occurred_at.localeCompare(b.occurred_at))){
    const row=addSafe(pending,[names(r),owner(r),r.id,new Date(r.occurred_at),r.type||'',r.priority||'',
      r.infraction_plate||r.observed_plate||'',Math.max(0,Math.floor((toDate.getTime()-Date.parse(r.occurred_at))/86400000)),link(r)]);
    row.getCell(4).numFmt='dd/mm/yyyy hh:mm';
    row.getCell(9).value={text:link(r),hyperlink:link(r)};
  }

  // 5. Reincidencias: solo grupos con >=2 casos en 365 días hasta cierre, sin filas vacías.
  const repeat=makeSheet(workbook,'Reincidencias',
    ['Ámbito','Vivienda / propietario','Incidencias 365 días','Abiertas al cierre','Tipos','Último hecho','IDs de incidencias'],
    [19,43,24,20,69,24,80]);
  const since=toDate.getTime()-365*86400000;
  const trailing=historical.filter(r=>Date.parse(r.occurred_at)>=since);
  const repeatGroup=(kind:'Vivienda'|'Propietario', key:(r:RecordRow)=>string, label:(r:RecordRow)=>string)=>{
    const groups=new Map<string,RecordRow[]>();
    for(const r of trailing){const id=key(r);groups.set(id,[...(groups.get(id)||[]),r]);}
    for(const [,rows] of [...groups].filter(([,rows])=>rows.length>=2).sort((a,b)=>b[1].length-a[1].length)){
      const row=addSafe(repeat,[kind,label(rows[0]),rows.length,rows.filter(openAtEnd).length,
        breakdown(rows),new Date(lastDate(rows)),rows.map(r=>r.id).join('; ')]);
      row.getCell(6).numFmt='dd/mm/yyyy hh:mm';
    }
  };
  repeatGroup('Vivienda',r=>r.dwelling_id||r.id,names);
  repeatGroup('Propietario',r=>r.responsible_at_event_user_id||r.id,owner);

  // 6. Resumen general, detrás de los reportes operativos.
  const summary=makeSheet(workbook,'Resumen semanal',['Indicador','Valor'],[46,42]);
  const summaryRows=[
    ['Comunidad',community.name],['Semana desde (Europe/Madrid)',period.start],
    ['Semana hasta (inclusive, Europe/Madrid)',shiftDay(period.end,-1)],
    ['Límite técnico exclusivo',period.end],
    ['Casos relevantes (IDs únicos)',relevant.length],
    ['Incidencias creadas',createdInPeriod.length],
    ['Creadas que siguen abiertas',openNew.length],
    ['Cerradas en la semana',closedThisWeek.length],
    ['Pendientes anteriores',previous.length],
    ['Viviendas afectadas',byDwelling.size],
    ['Propietarios atribuidos (incluye pendiente)',byOwner.size],
    ['Generado el (UTC)',new Date().toISOString()],
    ['Criterio','Nuevas + cerradas + pendientes previas; cada ID cuenta una sola vez'],
    ['Nota histórica','Sin historial de reaperturas no es posible reconstruir transiciones intermedias']
  ];
  summaryRows.forEach(v=>addSafe(summary,v));
  const buffer=await workbook.xlsx.writeBuffer();
  return {bytes:new Uint8Array(buffer as ArrayBuffer),created:createdInPeriod.length,openNew:openNew.length,closedThisWeek:closedThisWeek.length,previous:previous.length};
}
async function saveReport(community:RecordRow, period:{start:string;end:string}, appUrl:string) {
  const current=await service.from('parking_weekly_reports').select('*').eq('community_id',community.id).eq('period_start',period.start).maybeSingle();
  if(current.error)throw current.error;
  if(current.data && current.data.period_end!==period.end) throw new Error('Stored report period mismatch');
  if(current.data?.state==='ready') return {status:'already_ready',community:community.slug,period};
  if(current.data && current.data.state!=='failed') return {status:'concurrent',community:community.slug,period};
  let record=current.data;
  if(!record) {
    const inserted=await service.from('parking_weekly_reports').insert({
      community_id:community.id,period_start:period.start,period_end:period.end
    }).select().single();
    if(inserted.error) {
      if(inserted.error.code==='23505')return {status:'concurrent',community:community.slug,period};
      throw inserted.error;
    }
    record=inserted.data;
  }
  try {
    const generated=await buildWorkbook(community,period,appUrl);
    const path=community.id+'/'+period.start+'/Informe_Incidencias_'+period.start+'.xlsx';
    // The original artifact is immutable. A retry reuses the existing XLSX,
    // even if new generation timestamps would change its bytes.
    const stored=await service.storage.from(bucket).download(path);
    if(!stored.error && stored.data){
      const oldBytes=new Uint8Array(await stored.data.arrayBuffer());
      if(oldBytes.length<4||oldBytes[0]!==0x50||oldBytes[1]!==0x4b)
        throw new Error('Existing weekly XLSX is not a valid ZIP container; manual review required');
    }else if(stored.error && /not found|404|object not found/i.test(String(stored.error.message||''))){
      const upload=await service.storage.from(bucket).upload(path,generated.bytes,{
        contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',upsert:false
      });
      if(upload.error)throw upload.error;
    }else if(stored.error){
      throw stored.error;
    }else{
      throw new Error('Cannot read original report artifact');
    }
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
// Immutable private versions: never overwrite the previously published workbook.
function weeklyBase(communityId:string,periodStart:string) {
  return communityId+'/'+periodStart;
}
function weeklyOriginal(communityId:string,periodStart:string) {
  return weeklyBase(communityId,periodStart)+'/Informe_Incidencias_'+periodStart+'.xlsx';
}
function weeklyVersionPath(communityId:string,periodStart:string,versionId:string) {
  return weeklyBase(communityId,periodStart)+'/versions/'+versionId+'/informe.xlsx';
}
function allowedWeeklyPath(path:string,communityId:string,periodStart:string) {
  return path===weeklyOriginal(communityId,periodStart)||
    (path.startsWith(weeklyBase(communityId,periodStart)+'/versions/') &&
      /^\/versions\/[0-9a-f-]{36}\/informe\.xlsx$/i.test(path.slice(weeklyBase(communityId,periodStart).length)));
}
function validateCompletedWeek(start:string,end:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw new Error('Invalid period format');
  const a=new Date(start+'T00:00:00Z'),b=new Date(end+'T00:00:00Z');
  if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||a.toISOString().slice(0,10)!==start||b.toISOString().slice(0,10)!==end||a.getUTCDay()!==1||b.getTime()-a.getTime()!==7*86400000)
    throw new Error('Weekly period must be Monday to next Monday');
  if(madridMidnightUtc(end)>new Date().toISOString())throw new Error('Cannot regenerate an unfinished week');
}
async function readyWeeklyRow(communityId:string,start:string,end:string) {
  const query=await service.from('parking_weekly_reports').select('*')
    .eq('community_id',communityId).eq('period_start',start).maybeSingle();
  if(query.error)throw query.error;
  const record=query.data;
  if(!record||record.state!=='ready'||!record.attachment_path||record.period_end!==end)
    throw new Error('Ready weekly report not found for exact period');
  if(!allowedWeeklyPath(String(record.attachment_path),communityId,start))throw new Error('Unexpected stored report path');
  return record;
}
async function compareAndSwitchWeekly(record:RecordRow, nextPath:string) {
  let query=service.from('parking_weekly_reports').update({
    attachment_path:nextPath,generated_at:new Date().toISOString(),last_error:null
  }).eq('id',record.id).eq('community_id',record.community_id)
    .eq('period_start',record.period_start).eq('state','ready')
    .eq('attachment_path',record.attachment_path);
  query=record.generated_at==null?query.is('generated_at',null):query.eq('generated_at',record.generated_at);
  const result=await query.select('id');
  if(result.error)throw result.error;
  if((result.data||[]).length!==1)throw new Error('Report changed concurrently; no active version was switched');
}
async function readVersionManifest(path:string) {
  const response=await service.storage.from(bucket).download(path);
  if(response.error||!response.data)throw response.error||new Error('Version metadata not found');
  const manifest=JSON.parse(await response.data.text());
  if(!manifest||typeof manifest!=='object')throw new Error('Invalid version metadata');
  return manifest;
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
async function privateObjectExists(objectPath:string) {
  const parts=objectPath.split('/');
  const objectName=parts.pop()||'';
  const folder=parts.join('/');
  const listed=await service.storage.from(bucket).list(folder,{
    limit:100,
    search:objectName
  });
  if(listed.error)throw listed.error;
  return (listed.data||[]).some((entry:any)=>entry.name===objectName);
}
async function outboxBody(row:RecordRow,appUrl:string) {
  if(row.event_type==='weekly.report')return {
    subject:'Informe semanal de incidencias - Parking Comunidad',
    body:'Se adjunta el informe semanal en Excel. Su contenido es confidencial.'
  };
  const table=row.event_type.startsWith('incident.')?'incidents':'requests';
  // case_missing_obsolete_v1: only obsolete creation notifications may be retired.
  const res=await service.from(table).select('*').eq('id',row.entity_id).eq('community_id',row.community_id).maybeSingle();
  if(res.error)throw res.error;
  if(!res.data){
    if(row.event_type==='incident.created'||row.event_type==='request.created')return null;
    throw new Error('Missing case for non-creation event: '+row.event_type);
  }
  const e=res.data as RecordRow;
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
    let sendAttempted=false;
    try {
      if(row.recipient_user_id){
        const p=assertData<RecordRow>(await service.from('profiles').select('state').eq('user_id',row.recipient_user_id).single(),'recipient');
        const m=await service.from('community_members').select('state,roles').eq('community_id',row.community_id).eq('user_id',row.recipient_user_id).single();
        if(p.state!=='Activo'||m.error||m.data?.state!=='Activo'||(row.recipient_kind==='ADMIN'&&!(m.data.roles||[]).includes('ADMIN')))throw new Error('Recipient no longer authorized');
      }
      const message=await outboxBody(row,appUrl);
      if(message===null){
        // Keep the original row, event and recipient for audit. Never retry an obsolete notification.
        const archived=await service.from('parking_notification_outbox').update({
          state:'obsolete',locked_until:null,
          last_error:'Orphaned creation notice: original case no longer exists; no email sent'
        }).eq('id',row.id).eq('state','sending');
        if(archived.error)throw archived.error;
        blocked++;
        continue;
      }
      const {subject,body}=message;
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
      if(!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN)
        throw new Error('Gmail OAuth2 credentials not configured');
      // Gmail send has no equivalent of Resend's Idempotency-Key. Fail closed:
      // before the network send, lock for manual reconciliation if delivery is ambiguous.
      const manualHold='2099-12-31T00:00:00.000Z';
      const reserved=await service.from('parking_notification_outbox')
        .update({locked_until:manualHold,next_attempt_at:manualHold})
        .eq('id',row.id).eq('state','sending').select('id').maybeSingle();
      if(reserved.error||!reserved.data)throw reserved.error||new Error('Send lock not acquired');
      sendAttempted=true;
      const providerMessageId = await sendViaGmailApi(row.recipient_email,subject,body,attachments,row.id);
      const saved=await service.from('parking_notification_outbox').update({
        state:'sent',provider_message_id:providerMessageId,locked_until:null,next_attempt_at:null,
        sent_at:new Date().toISOString(),last_error:null
      }).eq('id',row.id).eq('state','sending');
      if(saved.error)throw saved.error;
      sent++;
    }catch(err) {
      // Do not blindly retry a message potentially accepted by Gmail.
      // A human must reconcile the mailbox and outbox record before requeueing.
      const manualHold='2099-12-31T00:00:00.000Z';
      const delay=sendAttempted?manualHold:
        new Date(Date.now()+Math.min(24,2**Math.min(row.attempts+1,5))*3600000).toISOString();
      const failure=await service.from('parking_notification_outbox').update({
        state:'failed',locked_until:null,
        last_error:(sendAttempted?'REVISIÓN MANUAL: entrega Gmail incierta. ':'')+String(err).slice(0,390),
        next_attempt_at:delay
      }).eq('id',row.id).eq('state','sending');
      if(failure.error)console.error('Could not preserve outbox failure state for '+row.id);
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
      if(local.weekday==='Mon'&&local.hour>=8) {
        const period=previousWeek();
        const communities=assertData<RecordRow[]>(await service.from('communities').select('id,name,slug').eq('state','Activo'),'communities');
        for(const c of communities)try{reports.push(await saveReport(c,period,appUrl))}catch(e){reports.push({community:c.slug,error:String(e)})}
      }
      const outbox=await processOutbox(appUrl);
      return jsonResponse(200,{ok:true,local,reports,outbox,dryRun:Deno.env.get('PARKING_EMAIL_DRY_RUN')!=='false'},origin);
    }
    // The official PDF is authorized by the incident and stored privately.
    // Historic incidents may legitimately have no notification recipients.
    if(action==='download-official-pdf') {
      const incidentId=String(body.incident_id||'');
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(incidentId))throw new Error('Invalid incident id');
      const incident=assertData<RecordRow>(await service.from('incidents')
        .select('id,community_id,state').eq('id',incidentId).single(),'incident');
      await authenticatedAdmin(req,incident.community_id);
      if(incident.state!=='Cerrada')throw new Error('Official PDF requires a closed case');
      const expected=incident.community_id+'/incidents/'+incident.id+'/informe-oficial.pdf';
      if(!await privateObjectExists(expected)){
        return jsonResponse(200,{
          ok:false,
          missing:true,
          code:'PDF_NOT_FOUND',
          message:'El PDF oficial todavía no está preparado.'
        },origin);
      }
      const signed=await service.storage.from(bucket).createSignedUrl(expected,60);
      if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error('Official PDF missing from private storage');
      return jsonResponse(200,{ok:true,url:signed.data.signedUrl},origin);
    }
    if(action==='upload-pdf') {
      const incidentId=String(body.incident_id||'');
      const audience=String(body.audience||'');
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(incidentId))throw new Error('Invalid incident id');
      if(audience!=='ADMIN')throw new Error('Only the official incident PDF can be uploaded');
      const incident=assertData<RecordRow>(
        await service.from('incidents').select('id,community_id,state').eq('id',incidentId).single(),
        'incident'
      );
      await authenticatedAdmin(req,incident.community_id);
      if(incident.state!=='Cerrada')throw new Error('Only closed incidents accept final reports');
      const encoded=String(body.pdf_base64||'');
      if(encoded.length<100||encoded.length>14000000||!/^[A-Za-z0-9+/=]+$/.test(encoded)){
        throw new Error('Invalid PDF encoding or size');
      }
      const raw=atob(encoded);
      if(raw.length>10*1024*1024||!raw.startsWith('%PDF-')||!raw.slice(-4096).includes('%%EOF')){
        throw new Error('Invalid PDF or too large');
      }
      const bytes=Uint8Array.from(raw, c=>c.charCodeAt(0));
      const path=incident.community_id+'/incidents/'+incident.id+'/informe-oficial.pdf';
      // No reemplazar un documento ya enviado o en proceso de envio.
      const existing=await service.from('parking_notification_outbox').select('id,state,recipient_kind')
        .eq('community_id',incident.community_id).eq('event_type','incident.closed')
        .eq('entity_id',incident.id).in('recipient_kind',['ADMIN','OWNER']);
      if(existing.error)throw existing.error;
      const targets=existing.data||[];
      if(targets.some(r=>!['pending','failed'].includes(r.state)))
        throw new Error('El PDF oficial ya fue enviado o está en proceso de envío y no puede reemplazarse.');

      const alreadyStored=await privateObjectExists(path);
      if(!alreadyStored){
        const upload=await service.storage.from(bucket).upload(path,bytes,{
          upsert:false,
          contentType:'application/pdf'
        });
        if(upload.error)throw upload.error;
      }

      if(targets.length){
        const queued=await service.from('parking_notification_outbox').update({attachment_path:path})
          .eq('community_id',incident.community_id).eq('event_type','incident.closed')
          .eq('entity_id',incident.id).in('recipient_kind',['ADMIN','OWNER'])
          .in('state',['pending','failed']).select('id');
        if(queued.error)throw queued.error;
        if((queued.data||[]).length!==targets.length)
          throw new Error('El PDF no pudo vincularse a todos los destinatarios pendientes.');
      }

      return jsonResponse(200,{
        ok:true,
        audience:'ALL',
        attached:true,
        alreadyStored,
        historical:targets.length===0,
        recipientCount:targets.length
      },origin);
    }
    if(action==='weekly-manual') {
      const communityId=String(body.community_id||'');
      await authenticatedAdmin(req,communityId);
      const c=assertData<RecordRow>(await service.from('communities').select('id,name,slug').eq('id',communityId).single(),'community');
      const period=previousWeek();
      const report=await saveReport(c,period,appUrl);
      return jsonResponse(200,{ok:true,report,period},origin);
    }
    if(action==='regenerate-weekly-report' || action==='list-weekly-report-versions' || action==='restore-weekly-report') {
      const communityId=String(body.community_id||'');
      const start=String(body.period_start||'');
      const end=String(body.period_end||'');
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(communityId))throw new Error('Invalid community id');
      validateCompletedWeek(start,end);
      const actor=await authenticatedAdmin(req,communityId);
      const row=await readyWeeklyRow(communityId,start,end);
      const base=weeklyBase(communityId,start);
      if(action==='list-weekly-report-versions') {
        const entries=await service.storage.from(bucket).list(base+'/versions',{limit:100});
        if(entries.error)throw entries.error;
        const versions=[];
        for(const e of entries.data||[]) {
          if(!/^[0-9a-f-]{36}$/i.test(e.name))continue;
          try {
            const metadata=await readVersionManifest(base+'/versions/'+e.name+'/manifest.json');
            if(metadata.community_id!==communityId||metadata.period_start!==start||metadata.period_end!==end||
              metadata.path!==weeklyVersionPath(communityId,start,e.name))continue;
            versions.push({id:e.name,generated_at:metadata.created_at,
              actor_id:metadata.actor_id,active:row.attachment_path===metadata.path});
          } catch (_) { /* exclude incomplete/invalid versions */ }
        }
        versions.sort((a,b)=>String(b.generated_at).localeCompare(String(a.generated_at)));
        return jsonResponse(200,{ok:true,versions,
          original:{id:'original',active:row.attachment_path===weeklyOriginal(communityId,start)},
          period:{start,end}},origin);
      }
      if(action==='regenerate-weekly-report') {
        const community=assertData<RecordRow>(await service.from('communities')
          .select('id,name,slug').eq('id',communityId).single(),'community');
        // Build first. Preserve the current report and its notification records throughout.
        const generated=await buildWorkbook(community,{start,end},appUrl);
        const versionId=crypto.randomUUID();
        const path=weeklyVersionPath(communityId,start,versionId);
        const manifestPath=base+'/versions/'+versionId+'/manifest.json';
        const manifest={schema:1,community_id:communityId,period_start:start,period_end:end,
          actor_id:actor,created_at:new Date().toISOString(),path,previous_path:row.attachment_path};
        const uploaded=await service.storage.from(bucket).upload(path,generated.bytes,{
          contentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',upsert:false
        });
        if(uploaded.error)throw uploaded.error;
        const metadata=await service.storage.from(bucket).upload(manifestPath,
          new Blob([JSON.stringify(manifest)],{type:'application/json'}),
          {contentType:'application/json',upsert:false});
        if(metadata.error)throw metadata.error;
        await compareAndSwitchWeekly(row,path);
        // No outbox, no notifications, no deletion of earlier XLSX versions.
        return jsonResponse(200,{ok:true,status:'regenerated',version_id:versionId,period:{start,end},
          counts:{created:generated.created,closed:generated.closedThisWeek,previous:generated.previous}},origin);
      }
      const requested=String(body.version_id||'');
      if(requested!=='original'&&!/^[0-9a-f-]{36}$/i.test(requested))throw new Error('Invalid version id');
      const target=requested==='original'?weeklyOriginal(communityId,start):weeklyVersionPath(communityId,start,requested);
      if(requested!=='original') {
        const manifest=await readVersionManifest(base+'/versions/'+requested+'/manifest.json');
        if(manifest.community_id!==communityId||manifest.period_start!==start||manifest.period_end!==end||manifest.path!==target)
          throw new Error('Version does not belong to requested report');
      }
      // Validate private target exists before attempting a compare-and-switch.
      if(!await privateObjectExists(target))throw new Error('Selected historical XLSX missing');
      if(row.attachment_path===target)return jsonResponse(200,{ok:true,status:'already_active',period:{start,end}},origin);
      const auditId=crypto.randomUUID();
      const intentPath=base+'/restore-audit/'+auditId+'.json';
      const intent={schema:1,event:'restore-request',community_id:communityId,period_start:start,
        period_end:end,actor_id:actor,created_at:new Date().toISOString(),from_path:row.attachment_path,to_path:target};
      const archived=await service.storage.from(bucket).upload(intentPath,
        new Blob([JSON.stringify(intent)],{type:'application/json'}),
        {contentType:'application/json',upsert:false});
      if(archived.error)throw archived.error;
      await compareAndSwitchWeekly(row,target);
      // Separate immutable receipt: the original intent remains even if switch fails.
      const receiptPath=base+'/restore-audit/'+auditId+'-completed.json';
      const receipt=await service.storage.from(bucket).upload(receiptPath,
        new Blob([JSON.stringify({...intent,event:'restore-completed',completed_at:new Date().toISOString()})],
          {type:'application/json'}),
        {contentType:'application/json',upsert:false});
      if(receipt.error)throw new Error('Restoration changed active XLSX, but completion receipt failed: '+receipt.error.message);
      return jsonResponse(200,{ok:true,status:'restored',audit_id:auditId,period:{start,end}},origin);
    }
    if(action==='download-weekly-report') {
      const communityId=String(body.community_id||'');
      const periodStart=String(body.period_start||'');
      const periodEnd=String(body.period_end||'');
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(communityId))throw new Error('Invalid community id');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd))throw new Error('Invalid report period format (YYYY-MM-DD)');
      await authenticatedAdmin(req,communityId);
      const report=await service.from('parking_weekly_reports').select('*').eq('community_id',communityId).eq('period_start',periodStart).maybeSingle();
      if(report.error)throw report.error;
      if(!report.data)return jsonResponse(404,{ok:false,error:'Report not found'},origin);
      if(report.data.state!=='ready' || !report.data.attachment_path)return jsonResponse(400,{ok:false,error:'Report not ready'},origin);
      if(report.data.period_end!==periodEnd)return jsonResponse(400,{ok:false,error:'Report period mismatch'},origin);
      // Verify the attachment path belongs to this community and period
      const expectedPath=communityId+'/'+periodStart+'/Informe_Incidencias_'+periodStart+'.xlsx';
      if(!allowedWeeklyPath(String(report.data.attachment_path),communityId,periodStart))return jsonResponse(400,{ok:false,error:'Report path mismatch'},origin);
      const signed=await service.storage.from(bucket).createSignedUrl(report.data.attachment_path,60);
      if(signed.error||!signed.data?.signedUrl)throw signed.error||new Error('Report file missing from private storage');
      return jsonResponse(200,{ok:true,url:signed.data.signedUrl,period_start:periodStart,period_end:periodEnd},origin);
    }
    if(action==='list-weekly-reports') {
      const communityId=String(body.community_id||'');
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(communityId))throw new Error('Invalid community id');
      await authenticatedAdmin(req,communityId);
      const {data,error}=await service.from('parking_weekly_reports').select('id,period_start,period_end,state,generated_at').eq('community_id',communityId).eq('state','ready').order('period_start',{ascending:false});
      if(error)throw error;
      return jsonResponse(200,{ok:true,reports:data||[]},origin);
    }
    return jsonResponse(400,{error:'Unknown action'},origin);
  }catch(e){return jsonResponse(400,{error:String(e)},origin)}
});
