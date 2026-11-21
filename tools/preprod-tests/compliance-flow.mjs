import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const engineFile='assets/js/compliance.js';
const incidentsFile='assets/js/admin/incidents.js';
const requestsFile='assets/js/admin/requests.js';
const housingFile='assets/js/admin/advanced.js';
const engine=fs.readFileSync(engineFile,'utf8');
const incidents=fs.readFileSync(incidentsFile,'utf8');
const requests=fs.readFileSync(requestsFile,'utf8');
const housing=fs.readFileSync(housingFile,'utf8');
assert.match(engine,/function parkingScore\(/,'Single scoring engine must exist');
const sandbox={state:{cache:{}},Date,Math,Number,String,Object,Map,Set};
const api=vm.runInNewContext(engine+'\n({parkingScore,PARKING_COMPLIANCE_DEFAULTS})',sandbox,{filename:engineFile});
const score=api.parkingScore;
const defaults=api.PARKING_COMPLIANCE_DEFAULTS;
assert.equal(defaults.open_normal,3);
assert.equal(defaults.closed_high,16);

const now=Date.UTC(2026,10,20),recent=new Date(now-86400000).toISOString();
const row=(id,h,o,status,priority,attempts,action='')=>({
  ID_Incidencia:id,ID_Vivienda:h,ID_PropietarioAlHecho:o,
  FechaHora:recent,Estado:status,Prioridad:priority,
  // Explicit initial priority avoids counting escalation twice.
  PrioridadInicial:priority,Intentos:attempts,AccionCierre:action,Tipo:'QA'
});
const rows=[
 row('a','h1','o1','Abierta','Normal',1),
 row('b','h1','o1','Abierta','Atención',3),
 row('c','h2','o1','Cerrada','Alta',2,'Aviso al propietario'),
 row('d','h1','o2','Cerrada','Normal',1,'Sin actuación')
];
const home=rows.filter(x=>x.ID_Vivienda==='h1');
const owner=rows.filter(x=>x.ID_PropietarioAlHecho==='o1');
assert.equal(score(home,{now}).score,88,'Open incidents and followups');
assert.equal(score(owner,{now}).score,69,'Owner across two homes');
assert.equal(score(home,{now,closeId:'a',action:'Aviso al propietario'}).score,85,'Single-case closure preview');
assert.equal(score(home,{now,closeId:'a',action:'Sin actuación'}).score,91,'No-action closure removes provisional cost');
assert.equal(score([...home,home[0]],{now}).score,88,'Identical incident IDs deduplicated');
assert.equal(score([row('x','h1','o1','Cerrada','Alta',1,'Aviso al propietario')],{now}).score,84,'Closure without frozen points uses rules');
assert.equal(score([{...row('x','h1','o1','Cerrada','Alta',1,'Aviso al propietario'),CompliancePoints:0}],{now}).score,100,'Real zero snapshot is respected');
assert.equal(score([{...row('x','h1','o1','Cerrada','Alta',1,'Aviso al propietario'),CompliancePoints:13}],{now}).score,87,'Frozen closure score is respected');
const old={...row('old','h1','o1','Cerrada','Crítica',5,'Aviso al propietario'),FechaHora:'2024-01-01T00:00:00Z'};
assert.equal(score([old],{now}).score,100,'Expired incidents excluded');
const recovery={...row('recover','h1','o1','Cerrada','Alta',1,'Aviso al propietario'),FechaHora:new Date(now-95*86400000).toISOString()};
assert.equal(score([recovery],{now}).score,99,'Recovery offsets 15 points of a 16-point penalty');
assert.equal(score(rows.filter(x=>x.ID_PropietarioAlHecho==='o2'),{now}).score,100,'Other owner receives no attribution');
assert.match(incidents,/parkingCompliancePanel|parkingScorePanel|parkingScore\(/,'Incident view uses compliance score');
assert.match(requests,/parkingCompliancePanel|parkingScorePanel|parkingScore\(/,'Request view uses compliance score');
assert.match(housing,/parkingScore\(|parkingCompliancePanel|parkingScorePanel/,'Housing view uses compliance score');
console.log('OK compliance-flow: shared module, open/closed, attempts, ownership, closure preview, snapshots, recovery, dedup and UI references');
