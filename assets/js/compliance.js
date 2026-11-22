'use strict';

const PARKING_COMPLIANCE_DEFAULTS=Object.freeze({
  open_normal:3,open_attention:5,open_high:8,open_critical:12,
  closed_normal:6,closed_attention:10,closed_high:16,closed_critical:24,
  followup_normal:1,followup_attention:2,followup_high:3,followup_critical:4,
  max_followups:4,window_days:365,
  recovery_1_days:30,recovery_1_points:5,
  recovery_2_days:60,recovery_2_points:5,
  recovery_3_days:90,recovery_3_points:5,
  recovery_extra_every_days:30,recovery_extra_points:0,recovery_cap_points:15
});

function parkingComplianceRules(source={}){
  const raw=source?.rules||source||{},out={};
  Object.entries(PARKING_COMPLIANCE_DEFAULTS).forEach(([key,fallback])=>{
    const value=Number(raw[key]);out[key]=Number.isFinite(value)?Math.round(value):fallback;
  });
  out.version=Number(source?.version||raw.version||0);
  out.id=source?.id||raw.id||'';
  out.reason=source?.reason||raw.reason||'';
  out.created_at=source?.created_at||raw.created_at||'';
  return out;
}

function parkingComplianceSetRules(source){
  const normalized=parkingComplianceRules(source);
  state.cache.complianceRules=normalized;
  return normalized;
}

function parkingComplianceActiveRules(){
  return parkingComplianceRules(state?.cache?.complianceRules||PARKING_COMPLIANCE_DEFAULTS);
}

function parkingCompliancePriorityKey(priority){
  return ({'Atención':'attention','Alta':'high','Crítica':'critical'})[priority]||'normal';
}

function parkingComplianceExcluded(action){
  return ['','Sin actuación','Datos corregidos','Anulada','Anulado','Infundada','Infundado']
    .includes(String(action||''));
}

function parkingComplianceRecovery(raw,days,rules){
  if(!raw||days<0)return 0;
  let points=0;
  if(days>=rules.recovery_1_days)points+=rules.recovery_1_points;
  if(days>=rules.recovery_2_days)points+=rules.recovery_2_points;
  if(days>=rules.recovery_3_days)points+=rules.recovery_3_points;
  if(rules.recovery_extra_points>0&&days>rules.recovery_3_days){
    points+=Math.floor((days-rules.recovery_3_days)/Math.max(1,rules.recovery_extra_every_days))*rules.recovery_extra_points;
  }
  return Math.min(raw,rules.recovery_cap_points,points);
}

function parkingScore(rows,options={}){
  const rules=parkingComplianceRules(options.rules||parkingComplianceActiveRules());
  const now=Number(options.now||Date.now()),cut=now-rules.window_days*86400000;
  const candidates=[];
  for(const original of rows||[]){
    if(!original?.ID_Incidencia||options.exclude===original.ID_Incidencia)continue;
    const ts=Date.parse(original.FechaHora||'');
    if(!Number.isFinite(ts)||ts<cut||ts>now)continue;
    const row=options.closeId===original.ID_Incidencia
      ?{...original,Estado:'Cerrada',AccionCierre:options.action}:original;
    const open=row.Estado!=='Cerrada';
    const attempts=Math.min(rules.max_followups,Math.max(0,(Number(row.Intentos)||1)-1));
    const initialKey=parkingCompliancePriorityKey(row.PrioridadInicial||'Normal');
    const currentKey=parkingCompliancePriorityKey(row.Prioridad||'Normal');
    const excluded=!open&&parkingComplianceExcluded(row.AccionCierre);
    const frozen=row.CompliancePoints===null||row.CompliancePoints===undefined||row.CompliancePoints===''?NaN:Number(row.CompliancePoints);
    let loss=0,origin='Reglas activas';
    if(open){
      loss=rules['open_'+initialKey]+attempts*rules['followup_'+currentKey];
    }else if(!excluded&&Number.isFinite(frozen)){
      loss=frozen;origin=`Cierre congelado${row.ComplianceRuleVersion?` · referencia ${row.ComplianceRuleVersion}`:''}`;
    }else if(!excluded){
      loss=rules['closed_'+initialKey]+attempts*rules['followup_'+currentKey];
      origin='Histórico sin snapshot · reglas activas';
    }
    loss=Math.max(0,Math.min(100,loss));
    const eventKey=String(row.ID_Evento||'').trim();
    // Un evento puede contener infracciones diferentes: no fusionar tipos ni viviendas.
    const relation=[row.ID_Vivienda||'',row.Tipo||'',row.Situacion||'',row.MatriculaRelacionada||'',row.MatriculaInfraccion||row.MatriculaObservada||'',row.ID_VehiculoRelacionado||''].join('|');
    const dedupKey=eventKey?`event:${eventKey}:${relation}`:`incident:${row.ID_Incidencia}`;
    candidates.push({row,loss,open,closedValid:!open&&!excluded,excluded,attempts,origin,dedupKey,linked:1});
  }
  const grouped=new Map();
  for(const item of candidates){
    const previous=grouped.get(item.dedupKey);
    if(!previous){grouped.set(item.dedupKey,item);continue}
    previous.linked++;
    if(item.loss>previous.loss)grouped.set(item.dedupKey,{...item,linked:previous.linked});
  }
  const items=[...grouped.values()];
  const raw=items.reduce((sum,item)=>sum+item.loss,0);
  const last=Math.max(0,...items.map(item=>Date.parse(item.row.UltimoSeguimiento||item.row.FechaHora||'')||0));
  const days=last?Math.floor((now-last)/86400000):0;
  const recovery=items.some(item=>item.open)?0:parkingComplianceRecovery(raw,days,rules);
  return {
    score:Math.max(0,Math.min(100,100-raw+recovery)),raw,recovery,items,rules,
    open:items.filter(item=>item.open).length,
    closed:items.filter(item=>item.closedValid).length,
    excluded:items.filter(item=>item.excluded).length,
    followups:items.reduce((sum,item)=>sum+item.attempts,0),
    duplicates:candidates.length-items.length,
    lastActivityAt:last?new Date(last).toISOString():'',daysWithoutDetection:days
  };
}

function parkingComplianceScore(rows,currentId,options={}){
  const score=parkingScore(rows,{...options,exclude:currentId});
  return {score:score.score,assessed:score.closed,followups:score.followups,
    open:score.open,previous:score.items.length,history:score.items.map(item=>item.row),
    recovery:score.recovery,raw:score.raw,excluded:score.excluded};
}
