// Offline, read-only acceptance checks for the local PRE working tree.
// Execute: node --test tools/preprod-tests/weekly-gmail-local.test.mjs
// No Supabase network, no real emails, no changes to DB/Storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const repo=process.cwd();
const read=p=>readFileSync(resolve(repo,p),'utf8');
const edge=read('supabase/functions/parking-notifications/index.ts');
const router=read('assets/js/supabase/router.js');
const ui=read('assets/js/admin/incidents.js');
const http=read('supabase/functions/_shared/http.ts');
const require=createRequire(resolve(repo,'package.json'));
let esbuild;
try { ({ transformSync: esbuild }=require('esbuild')); }
catch { throw new Error('Falta esbuild. Ejecutá npm ci/npm install según el lockfile del proyecto.'); }
function extract(start,end) {
  const a=edge.indexOf(start),b=edge.indexOf(end,a+start.length);
  assert.ok(a>=0,`No se encontró inicio: ${start}`);
  assert.ok(b>a,`No se encontró final: ${end}`);
  return edge.slice(a,b);
}
function executeTs(source,context,exportNames) {
  const js=esbuild(source+'\n'+exportNames.map(n=>`globalThis.testExports.${n} = ${n};`).join('\n'),{loader:'ts',format:'iife',target:'es2022'}).code;
  const scope={...context,testExports:{}};
  vm.runInNewContext(js,scope,{timeout:1000});
  return scope.testExports;
}
const enc=b=>Buffer.from(b).toString('base64');
const uuid='00000000-0000-4000-8000-000000000001';
const community='12345678-1234-4123-8123-123456789abc';
const version='98765432-1234-4123-8123-123456789abc';
const period='2026-11-16';
function gmailHarness(){
  const calls=[];
  const block=extract('function gmailMimeHeader(', 'function safeText(');
  const f=executeTs(block,{
    Buffer,TextEncoder,Uint8Array,crypto:{randomUUID:()=>version},
    GMAIL_SENDER_EMAIL:'parkinggestioncomunidad@gmail.com',
    GMAIL_SEND_URL:'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    encode64:enc,
    getGmailAccessToken:async()=> 'FAKE_ACCESS_TOKEN_NOT_REAL',
    fetch:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,json:async()=>({id:'fake-message-id'})}},
  },['gmailRawMessage','sendViaGmailApi']);
  return {f,calls};
}

// Behaviour-level tests execute the actual locally patched MIME functions.
test('Gmail raw MIME is valid Base64URL, UTF-8, multipart and has trace ID',()=>{
  const {f}=gmailHarness();
  const pdf=Buffer.from('%PDF-1.4\nTEST','utf8');
  const body='Señor/a: incidencia en Málaga, año 2026. 🚗';
  const raw=f.gmailRawMessage('prueba@example.org','Informe semanal: Málaga, acción',body,[{filename:'Informe.pdf',content:pdf.toString('base64')}],uuid);
  assert.match(raw,/^[A-Za-z0-9_-]+$/);
  const text=Buffer.from(raw.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');
  assert.match(text,/^From: parkinggestioncomunidad@gmail\.com\r\nTo: prueba@example\.org\r\n/);
  assert.ok(text.includes('X-Parking-Outbox-ID: '+uuid));
  assert.ok(text.includes('Content-Transfer-Encoding: base64'));
  assert.ok(text.includes(enc(Buffer.from(body,'utf8')).slice(0,40)));
  assert.match(text,/Subject: =\?UTF-8\?B\?/);
  assert.ok(text.includes('filename="Informe.pdf"'));
  assert.ok(text.includes(pdf.toString('base64')));
});
test('Gmail rejects CRLF injection in subject and invalid recipients/attachments',()=>{
  const {f}=gmailHarness();
  assert.throws(()=>f.gmailRawMessage('victim@example.org','Hi\r\nBCC: attacker@example.org','x',[],uuid),/Invalid MIME header/);
  assert.throws(()=>f.gmailRawMessage('a@example.org,evil@example.org','Hi','x',[],uuid),/Invalid destination/);
  assert.throws(()=>f.gmailRawMessage('a@example.org','Hi','x',[{filename:'../secret.pdf',content:'aGVsbG8='}],uuid),/Invalid attachment/);
});
test('Gmail send uses JSON raw and only fake fetch',async()=>{
  const {f,calls}=gmailHarness();
  const res=await f.sendViaGmailApi('prueba@example.org','Asunto','Texto',[],uuid);
  assert.equal(res,'fake-message-id');
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  assert.equal(calls[0].options.headers['content-type'],'application/json');
  assert.match(calls[0].options.headers.authorization,/^Bearer FAKE_/);
  assert.match(JSON.parse(calls[0].options.body).raw,/^[A-Za-z0-9_-]+$/);
});

test('Report paths isolate community, week and immutable version',()=>{
  const block=extract('function weeklyBase(', 'function validateCompletedWeek(');
  const f=executeTs(block,{},['weeklyBase','weeklyOriginal','weeklyVersionPath','allowedWeeklyPath']);
  const original=f.weeklyOriginal(community,period);
  const v=f.weeklyVersionPath(community,period,version);
  assert.equal(f.allowedWeeklyPath(original,community,period),true);
  assert.equal(f.allowedWeeklyPath(v,community,period),true);
  assert.equal(f.allowedWeeklyPath(v,community,'2026-11-09'),false);
  assert.equal(f.allowedWeeklyPath(v,'99999999-0000-4000-8000-000000000001',period),false);
  assert.equal(f.allowedWeeklyPath(`${community}/${period}/versions/../../escape.xlsx`,community,period),false);
  assert.notEqual(original,v);
});

test('Completed-week guard rejects malformed and unfinished periods',()=>{
  const block=extract('function validateCompletedWeek(', 'async function readyWeeklyRow(');
  const f=executeTs(block,{madridMidnightUtc:()=> '2026-11-01T00:00:00.000Z'},['validateCompletedWeek']);
  assert.doesNotThrow(()=>f.validateCompletedWeek('2026-10-19','2026-10-26'));
  assert.throws(()=>f.validateCompletedWeek('2026-10-20','2026-10-27'),/Weekly period/);
  assert.throws(()=>f.validateCompletedWeek('2026-02-30','2026-03-09'),/Weekly period/);
  const future=executeTs(block,{madridMidnightUtc:()=> '2999-01-01T00:00:00.000Z'},['validateCompletedWeek']);
  assert.throws(()=>future.validateCompletedWeek('2026-10-19','2026-10-26'),/unfinished/);
});

test('Workbook retains six required worksheets (source contract)',()=>{
  for(const title of ['Por vivienda','Por propietario','Detalle incidencias','Pendientes anteriores','Reincidencias','Resumen semanal']){
    assert.ok(edge.includes(title),`Falta hoja ${title}`);
  }
  assert.match(edge,/showGridLines\s*:\s*false/);
});
test('Versioning never performs an upsert overwrite; compare-and-switch is optimistic',()=>{
  const x=extract("if(action==='regenerate-weekly-report')", "if(action==='download-weekly-report')");
  assert.match(x,/upsert\s*:\s*false/);
  assert.match(x,/compareAndSwitchWeekly\(/);
  assert.doesNotMatch(x,/parking_queue_weekly_report|processOutbox\(|parking_notification_outbox/);
  const switcher=extract('async function compareAndSwitchWeekly(', 'async function readVersionManifest(');
  assert.match(switcher,/\.eq\('attachment_path',record\.attachment_path\)/);
  assert.match(switcher,/Report changed concurrently/);
});
test('Restoration has complete receipt and private-object verification (source contract)',()=>{
  const x=extract("if(action==='regenerate-weekly-report')", "if(action==='download-weekly-report')");
  assert.match(x,/privateObjectExists\(target\)/);
  assert.match(x,/restore-completed/);
  assert.match(x,/restore-audit/);
});
test('Admin authorization occurs before any report version mutation',()=>{
  const x=extract("if(action==='regenerate-weekly-report'", "if(action==='download-weekly-report')");
  const auth=x.indexOf('await authenticatedAdmin(req,communityId)');
  const mutation=x.indexOf("if(action==='regenerate-weekly-report')");
  assert.ok(auth>=0&&mutation>auth);
  for(const action of ['regenerate-weekly-report','restore-weekly-report','list-weekly-report-versions'])assert.ok(x.includes(action));
});
test('DRY_RUN does not call Gmail or mark sent; ambiguous failures hold for manual review',()=>{
  const x=extract('async function processOutbox(', 'async function authenticatedAdmin(');
  const dry=x.indexOf("Deno.env.get('PARKING_EMAIL_DRY_RUN')");
  const send=x.indexOf('sendViaGmailApi(');
  assert.ok(dry>=0&&send>dry);
  assert.match(x,/REVISI[ÓO]N MANUAL/);
  assert.match(x,/sendAttempted/);
  assert.match(x,/2099-12-31T00:00:00.000Z/);
  const dryBranch=x.slice(dry,send);
  assert.doesNotMatch(dryBranch,/state\s*:\s*'sent'/);
});
test('Frontend uses protected routes and does not embed service secrets',()=>{
  for(const s of ['regenerate-weekly-report','list-weekly-report-versions','restore-weekly-report'])assert.ok(router.includes(s));
  for(const s of ['incident-weekly-versions','incident-weekly-regenerate','incident-weekly-restore'])assert.ok(ui.includes(s));
  assert.match(router,/IsRoot|includes\('ADMIN'\)/);
  assert.doesNotMatch(ui+router,/GMAIL_REFRESH_TOKEN|GMAIL_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
  assert.ok(http.includes('x-client-info'));
});
