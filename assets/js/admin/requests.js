function requestDossierPlate(row){return String(row?.MatriculaHabitual||row?.MatriculaOrigen||'SIN MATRÍCULA').trim()||'SIN MATRÍCULA'}
function requestDossierKey(row){row=row||{};if(row.ID_Vehiculo)return `vehicle:${row.ID_Vehiculo}`;const rawPlate=requestDossierPlate(row),plate=rawPlate==='SIN MATRÍCULA'?'':normalizePlateClient(rawPlate);if(plate)return `plate:${plate}`;if(row.ID_Vivienda)return `housing:${row.ID_Vivienda}`;return `request:${row.ID_Solicitud||'unknown'}`}
function requestActivityTs(row){const raw=row?.FechaResolucion||row?.FechaHora||'';const t=new Date(raw).getTime();return Number.isFinite(t)?t:0}
function requestIsOpenClient(row){return ['Abierta','Pendiente'].includes(String(row?.Estado||''))}
function requestDisplayState(row){return requestIsOpenClient(row)?'Abierta':String(row?.Estado||'')}
function requestMatchesState(row,state){return !state||(state==='Abierta'?requestIsOpenClient(row):String(row?.Estado||'')===state)}

// Vista contextual de Solicitudes. Sin cambios en las acciones ni en los datos almacenados.
function parkingRequestStructuredDetails(row,part='all'){
  const r=row||{},renewal=r.Tipo==='RENOVACION_QR',activation=r.Tipo==='REACTIVACION_VEHICULO',stay=r.Tipo==='PERMANENCIA_PROLONGADA';
  const moto=r.TipoVehiculo==='Moto'||r.TipoVehiculoOrigen==='Moto';
  const field=(name,value,{applicable=true}={})=>{
    const hasValue=value!==null&&value!==undefined&&String(value).trim()!=='';
    const shown=!applicable?'No aplica':hasValue?String(value):'No informado';
    return `<div><small>${esc(name)}</small><b${name==='Expediente'&&r.ID_Solicitud?` title="${esc(r.ID_Solicitud)}"`:''}>${esc(shown)}</b></div>`;
  };
  const group=(heading,fields)=>`<section class="request-case-section parking-case-section">
    <h4>${esc(heading)}</h4><div class="details incident-primary-grid">${fields.join('')}</div></section>`;
  const dwelling=[r.Bloque,r.Planta,r.Apartamento].filter(x=>x!==null&&x!==undefined&&String(x).trim()).join(' · ');
  const base=`<details class="parking-case-section parking-case-extra"><summary>Identificación de la solicitud</summary>
    <div class="details incident-primary-grid">${[
      field('Solicitante',r.NombreSolicitante||r.Usuario),
      field('Vivienda',dwelling||null),
      field('Matrícula',requestDossierPlate(r)==='SIN MATRÍCULA'?null:requestDossierPlate(r)),
      field('Fecha de solicitud',r.FechaHora?shortDateTime(r.FechaHora):null)
    ].join('')}</div></details>`;
  const vehicle=group('Estado actual del vehículo',[
    field('Tipo de vehículo',moto?'Moto':r.TipoVehiculo||r.TipoVehiculoOrigen),
    field('Estado actual',r.EstadoVehiculo),
    ...(!moto&&renewal?[field('QR actual',r.EstadoQR)]:[]),
    ...(!moto&&(activation||renewal)&&r.SlotActual?[field('Slot actual',r.SlotActual)]:[])
  ])+`<details class="parking-case-section parking-case-extra"><summary>Datos originales al solicitar</summary>
    <div class="details incident-primary-grid">${[
      field('Estado al solicitar',r.EstadoVehiculoOrigen),
      ...(!moto&&renewal?[field('QR al solicitar',r.QREstadoOrigen)]:[]),
      ...(!moto&&activation?[field('Slot al solicitar',r.SlotOrigen)]:[])
    ].join('')}</div></details>`;
  const period=stay?group('Periodo de permanencia solicitado',[
    field('Inicio',r.FechaInicio?dateEs(r.FechaInicio):null),field('Fin previsto',r.FechaFin?dateEs(r.FechaFin):null)
  ]):'';
  const noVehicleData=!r.EstadoVehiculoOrigen&&!r.EstadoVehiculo;
  const note=noVehicleData?'<p class="muted" style="margin:.4rem 0">Los estados no están informados en este expediente. No se interpretan como estados inactivos.</p>':'';
  const reason=group('Motivo y observaciones',[
    field('Motivo declarado',r.Motivo),
    ...(r.Observaciones?[field('Observaciones',r.Observaciones)]:[])
  ]);
  const resolution=!requestIsOpenClient(r)?group('Resolución y trazabilidad',[
    field('Decisión',requestDisplayState(r)),field('Fecha de resolución',r.FechaResolucion?shortDateTime(r.FechaResolucion):null),
    field('Resuelta por',r.NombreResolucion||r.UsuarioResolucion),
    field('Observaciones de resolución',r.ObservacionesResolucion)
  ]):'';
  if(part==='main')return base+reason+period;
  if(part==='side')return vehicle+note+resolution;
  return base+vehicle+note+period+reason+resolution;
}
function parkingRequestRelatedContext(row,requestsRows,ownerId){
  const owner=ownerId||row.ID_PropietarioAlHecho||'';
  const related=(requestsRows||[]).filter(r=>r.ID_Solicitud!==row.ID_Solicitud&&(
    (owner&&r.ID_PropietarioAlHecho===owner)||(row.ID_Vivienda&&r.ID_Vivienda===row.ID_Vivienda)
  )).sort((a,b)=>(Date.parse(b.FechaResolucion||b.FechaHora||0)||0)-(Date.parse(a.FechaResolucion||a.FechaHora||0)||0));
  const sameHome=related.filter(r=>r.ID_Vivienda===row.ID_Vivienda).length;
  const otherHomes=owner?related.filter(r=>r.ID_Vivienda!==row.ID_Vivienda&&r.ID_PropietarioAlHecho===owner).length:0;
  const items=related.slice(0,8).map(r=>`<li>${esc(shortDateTime(r.FechaHora))} · ${esc(requestTypeLabel(r.Tipo))} · ${esc(requestDisplayState(r))}${r.ID_Vivienda!==row.ID_Vivienda?' · otra vivienda':''}</li>`).join('');
  return `<section class="card request-case-section" style="margin:1rem 0"><h3>Historial de solicitudes relacionadas</h3>
    <p class="muted">${sameHome} de esta vivienda${owner?` · ${otherHomes} de otras viviendas del propietario`:''}. Las solicitudes no restan puntos al índice.</p>
    <details><summary>Consultar historial de solicitudes (${related.length})</summary>${items?`<ul>${items}</ul>`:'<p class="muted">Sin otras solicitudes relacionadas.</p>'}${related.length>8?'<p class="muted">Mostrando las 8 más recientes.</p>':''}</details>
  </section>`;
}

// Resolución guiada: presentación solamente. No cambia ni estado ni contrato de RPC.
function parkingRequestResolutionDialog(row, decision, effect){
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    dialog.className='parking-request-resolution-dialog';
    dialog.setAttribute('aria-label','Confirmar resolución de solicitud');
    dialog.style.cssText='border:1px solid var(--border,#ccd5dd);border-radius:16px;padding:0;max-width:min(560px,calc(100vw - 32px));width:100%;box-shadow:0 22px 70px #0005;';
    const plate=requestDossierPlate(row);
    const heading=decision==='Aprobada'?'Aprobar solicitud':'Rechazar solicitud';
    const names=decision==='Aprobada'?'Confirmar aprobación':'Confirmar rechazo';
    const warning=decision==='Aprobada'?effect:'Se rechazará la solicitud sin modificar el vehículo.';
    dialog.innerHTML=`<form method="dialog" style="padding:1.25rem;display:grid;gap:1rem;">
      <div><div class="eyebrow">RESOLUCIÓN DE SOLICITUD</div><h3 style="margin:.25rem 0">${esc(heading)}</h3><div class="muted">${esc(requestTypeLabel(row.Tipo))} · ${esc(plate)}</div></div>
      <div class="details incident-primary-grid"><div><small>Vivienda</small><b>${esc(`Bloque ${row.Bloque||'—'}, ${row.Planta||''} ${row.Apartamento||''}`)}</b></div><div><small>Solicitante</small><b>${esc(row.NombreSolicitante||row.Usuario||'No informado')}</b></div><div><small>Estado actual</small><b>${esc(requestDisplayState(row))}</b></div><div><small>Fecha de solicitud</small><b>${esc(shortDateTime(row.FechaHora))}</b></div></div>
      ${row.Motivo?`<div><small>Motivo declarado</small><p style="margin:.25rem 0">${esc(row.Motivo)}</p></div>`:''}
      <div class="message"><b>Efecto de la decisión</b><p style="margin:.35rem 0 0">${esc(warning)}</p></div>
      <div class="field"><label for="request-resolution-notes">Observaciones de resolución (opcionales)</label><textarea id="request-resolution-notes" rows="3" placeholder="Justificación, comprobaciones o información para el historial..."></textarea></div>
      <div class="muted" style="font-size:.85em">El responsable y la fecha de resolución se registran automáticamente. Esta acción conserva el flujo y los efectos actuales.</div>
      <div class="actions" style="display:flex;gap:.6rem;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="secondary" data-request-cancel>Cancelar</button><button type="submit" value="confirm">${esc(names)}</button></div>
    </form>`;
    let settled=false;
    const finish=answer=>{if(settled)return;settled=true;dialog.close();dialog.remove();resolve(answer)};
    dialog.querySelector('[data-request-cancel]').onclick=()=>finish(null);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null)});
    dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();finish(dialog.querySelector('#request-resolution-notes').value.trim())});
    document.body.appendChild(dialog);
    if(typeof dialog.showModal==='function')dialog.showModal();else {dialog.setAttribute('open','');dialog.style.position='fixed';dialog.style.top='12vh';dialog.style.left='50%';dialog.style.transform='translateX(-50%)';dialog.style.zIndex='9999'}
    dialog.querySelector('#request-resolution-notes').focus();
  });
}

async function requests(openId=''){
  try{
    const focusId=openId||state.cache.requestFocus||'';delete state.cache.requestFocus;
    const navPreset=state.cache.requestPreset||null;delete state.cache.requestPreset;
    const forcedView=state.cache.requestViewMode||'';delete state.cache.requestViewMode;
    const dossierFocus=state.cache.requestDossierFocus||'';delete state.cache.requestDossierFocus;
    const [rows,incidentResponse]=await Promise.all([call('listRequests'),call('listIncidentsPayload')]);const incidentRows=Array.isArray(incidentResponse)?incidentResponse:(incidentResponse?.rows||[]);if(incidentResponse?.complianceRules)parkingComplianceSetRules(incidentResponse.complianceRules);const ui=viewUiState('requests');let page=ui.page||1,sortKey=ui.sortKey||'FechaHora',sortDir=ui.sortDir||'desc',viewMode=(forcedView==='dossiers'||dossierFocus)?'dossiers':(forcedView==='list'?'list':(ui.viewMode==='list'?'list':'dossiers'));
    let groupByHousing=ui.groupMode?ui.groupMode==='housing':ui.groupByHousing!==false,groupByOwner=ui.groupMode==='owner';
    const requestOwnerLabel=r=>r.NombrePropietarioAlHecho||'Propietario sin atribución verificada';
    const dossierKeyFor=r=>groupByOwner?(r.ID_PropietarioAlHecho?`owner:${r.ID_PropietarioAlHecho}`:`request:${r.ID_Solicitud}`):groupByHousing?`housing:${r.ID_Vivienda||'unassigned'}`:requestDossierKey(r);
    const rowsForDossier=key=>rows.filter(r=>dossierKeyFor(r)===key).sort((a,b)=>requestActivityTs(b)-requestActivityTs(a));
    $('#main').innerHTML=`<div class="head requests-head"><div><h1>Solicitudes</h1><div class="muted">Bandeja de gestión agrupada por vivienda o vehículo/matrícula. Expedientes y lista comparten los mismos filtros.</div></div>${exportButtonsHtml('requests-export')}</div><div id="request-detail"></div><div id="request-dossier"></div><div class="request-overview" id="request-overview"><div class="card request-stat-card"><span>Solicitudes abiertas</span><b id="req-stat-open">0</b><small>Solicitudes por resolver</small></div><div class="card request-stat-card"><span>Expedientes abiertos</span><b id="req-stat-dossiers">0</b><small>Vehículos o matrículas con solicitudes abiertas</small></div><div class="card request-stat-card"><span>Viviendas afectadas</span><b id="req-stat-housing">0</b><small>Con solicitudes abiertas</small></div><div class="card request-stat-card"><span>Solicitudes resueltas</span><b id="req-stat-resolved">0</b><small>Aprobadas o rechazadas</small></div></div><div class="mobile-filter-toggle-wrap">
      <button type="button" class="secondary mobile-filter-toggle" id="request-filter-toggle">
        Filtros
      </button>
    </div><div class="request-viewbar incident-viewbar"><div class="request-view-tabs incident-view-tabs"><button type="button" class="secondary" id="request-view-dossiers">Por matrícula</button><button type="button" class="secondary" id="request-view-housing">Por vivienda</button><button type="button" class="secondary" id="request-view-owner">Por propietario</button><button type="button" class="secondary" id="request-view-list">Lista de solicitudes</button></div><span class="count" id="req-count"></span></div><div class="filterbar admin-record-filterbar admin-request-filters"><div class="field filter-search"><label>Buscar</label><input id="req-search" class="search" placeholder="Matrícula, vivienda, solicitante o tipo..."></div>${periodFilterFields('req')}<div class="field"><label>Estado</label><select id="req-state"><option value="Abierta" selected>Abiertas</option><option value="">Todas</option><option>Aprobada</option><option>Rechazada</option></select></div><div class="field"><label>Tipo</label><select id="req-type"><option value="">Todos</option><option value="REACTIVACION_VEHICULO">Activación</option><option value="RENOVACION_QR">Renovación QR</option><option value="PERMANENCIA_PROLONGADA">Permanencia prolongada</option></select></div></div><div id="request-dossier-list" class="request-dossier-list"></div><div id="request-flat-list" class="tablebox compact-table admin-record-tablebox hide"><table class="table responsive-data-table admin-record-table admin-request-table"><thead><tr><th class="sortable-th" data-sort="FechaHora">Fecha</th><th class="sortable-th" data-sort="MatriculaHabitual">Matrícula</th><th class="sortable-th" data-sort="Vivienda">Vivienda</th><th class="sortable-th" data-sort="NombreSolicitante">Solicitante</th><th class="sortable-th" data-sort="Tipo">Tipo</th><th class="sortable-th" data-sort="Estado">Estado</th><th>Acciones</th></tr></thead><tbody id="req-body"></tbody></table><div id="req-empty" class="empty hide">No hay solicitudes.</div></div><div id="req-pager"></div>`
    bindPeriodVisibility('req');
    const homeOwners=new Map((state.cache.formOptions?.housing||[]).map(x=>[x.ID_Vivienda,x.ResponsableUserId||'']));
    const requestOwnerId=r=>r.ID_PropietarioAlHecho||homeOwners.get(r.ID_Vivienda)||'';

    const filtered=()=>{const q=$('#req-search').value.trim().toLowerCase(),st=$('#req-state').value,tp=$('#req-type').value,period=$('#req-period').value,from=$('#req-from').value,to=$('#req-to').value,housingId=navPreset?.housingId||'';saveViewUiState('requests',{q,st,tp,period,from,to,page,sortKey,sortDir,viewMode,groupByHousing,groupMode:groupByOwner?'owner':groupByHousing?'housing':'plate',v:'1.2.13.14-FIX11.25'});const val=(r,k)=>k==='Vivienda'?`Bloque ${r.Bloque}, ${r.Planta} ${r.Apartamento}`:k==='MatriculaHabitual'?requestDossierPlate(r):k==='NombreSolicitante'?(r.NombreSolicitante||r.Usuario||''):k==='Tipo'?requestTypeLabel(r.Tipo):k==='Estado'?requestDisplayState(r):r[k]||'';return rows.filter(r=>(!housingId||r.ID_Vivienda===housingId)&&requestMatchesState(r,st)&&(!tp||r.Tipo===tp)&&periodMatches(r.FechaHora,period,from,to)&&[...Object.values(r),requestDossierPlate(r),`Bloque ${r.Bloque||''}, ${r.Planta||''} ${r.Apartamento||''}`,requestTypeLabel(r.Tipo)].join(' ').toLowerCase().includes(q)).sort((a,b)=>{const c=String(val(a,sortKey)).localeCompare(String(val(b,sortKey)),'es',{numeric:true,sensitivity:'base'});return sortDir==='asc'?c:-c})};

    const detail=r=>{
      const host=$('#request-detail'),isMoto=r.TipoVehiculo==='Moto',reactivation=r.Tipo==='REACTIVACION_VEHICULO',renewal=r.Tipo==='RENOVACION_QR',longstay=r.Tipo==='PERMANENCIA_PROLONGADA',canApproveReactivation=true;
      const approvalLabel=reactivation?'APROBAR ACTIVACIÓN':renewal?'APROBAR Y RENOVAR QR':longstay?'APROBAR PERMANENCIA':'APROBAR';
      host.innerHTML=`<section class="card detail-panel incident-detail-v2 parking-official-case parking-case-v4">
        <style>
/* parking-real-ux-v4: styles scoped to the administrative case, not the whole application */
.parking-case-v4{--case-green:#155e4c;--case-ink:#19352e;--case-line:#e1e9e5;--case-muted:#61756f;padding:0!important;overflow:hidden;background:#fbfcfb!important}
.parking-case-v4 .parking-case-hero{background:linear-gradient(115deg,#145846,#237c62);padding:23px 25px 21px;color:#fff;display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.parking-case-v4 .parking-case-hero small,.parking-case-v4 .parking-case-hero .eyebrow{color:#cceadf!important;font-size:10px;letter-spacing:.095em;font-weight:750}
.parking-case-v4 .parking-case-hero h3{color:#fff!important;font-size:21px!important;line-height:1.25;margin:8px 0 10px!important}
.parking-case-v4 .parking-case-hero .status{display:inline-block;background:#effbf4;color:#1c644d;border-radius:6px;padding:4px 9px;font-size:12px}
.parking-case-v4 .parking-case-hero .incident-priority{background:#fff2d1;color:#684800;padding:4px 9px;border-radius:6px}
.parking-case-v4 .parking-case-hero .incident-header-status{display:flex;flex-wrap:wrap;align-items:center;gap:9px;color:#e1f6ed;font-size:12px}
.parking-case-v4 .parking-case-hero .actions,.parking-case-v4 .parking-case-hero .parking-case-hero-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
.parking-case-v4 .parking-case-hero button{background:#e7f5ef!important;border-color:transparent!important;color:#145846!important;white-space:nowrap}
.parking-case-v4 .parking-case-hero button:not(.secondary){background:#fff!important;color:#114c3a!important}
.parking-case-v4 .parking-case-hero .parking-case-hero-title{min-width:0}
.parking-case-v4 .parking-case-hero .parking-case-hero-code{font-size:11px;color:#ddf4e9;margin-top:7px;overflow-wrap:anywhere}
.parking-case-v4 .parking-case-inner{padding:23px;display:grid;gap:16px}
.parking-case-v4 .parking-case-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.parking-case-v4 .parking-case-overview>div{background:#edf6f1;border:1px solid #d7e9e0;border-radius:10px;padding:11px 13px;min-width:0}
.parking-case-v4 .parking-case-overview small{display:block;color:#628175;font-size:10px;margin-bottom:4px}
.parking-case-v4 .parking-case-overview b{color:#123d2f;font-size:13px;overflow-wrap:anywhere}
.parking-case-v4 .parking-case-columns{display:grid;grid-template-columns:minmax(0,1.26fr) minmax(0,.94fr);gap:16px;align-items:start}
.parking-case-v4 .parking-case-column{min-width:0;display:grid;gap:15px;align-content:start}
.parking-case-v4 .parking-case-section{border:1px solid var(--case-line);background:white;border-radius:12px;padding:16px;min-width:0;margin:0!important}
.parking-case-v4 .parking-case-section>h4,.parking-case-v4 .parking-case-section .incident-section-title h4{color:var(--case-ink);font-weight:750;font-size:13px;margin:0 0 12px!important}
.parking-case-v4 .parking-case-section .incident-section-title{margin:0 0 10px}
.parking-case-v4 .parking-case-section .details,.parking-case-v4 .parking-case-section .incident-primary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.parking-case-v4 .parking-case-section .details>div,.parking-case-v4 .parking-case-section .incident-primary-grid>div{background:#f6f9f7;border:1px solid #eef2ef;border-radius:8px;padding:10px 11px;min-width:0}
.parking-case-v4 .parking-case-section small{display:block;font-size:10px;color:var(--case-muted);margin-bottom:5px}
.parking-case-v4 .parking-case-section b{display:block;font-size:12px;line-height:1.4;overflow-wrap:anywhere}
.parking-case-v4 .parking-case-section .incident-narrative{padding:12px;background:#f7faf8;border-radius:8px;margin:0 0 12px;line-height:1.5}
.parking-case-v4 .parking-case-section .incident-technical{margin:0;border:0;background:transparent}
.parking-case-v4 .parking-case-section .incident-technical-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.parking-case-v4 .parking-case-score{min-width:0}.parking-case-v4 .parking-case-score>.card{margin:0!important}
.parking-case-v4 .parking-case-score #incident-compliance-panel,.parking-case-v4 .parking-case-score #incident-compliance-detail-panel{margin:0!important}
.parking-case-v4 .parking-case-score .card,.parking-case-v4 .parking-case-history .card{box-shadow:none;border:1px solid var(--case-line);border-radius:12px;margin:0!important}
.parking-case-v4 .parking-case-history .request-case-section{margin:0!important}
.parking-case-v4 .parking-case-followups .incident-timeline,.parking-case-v4 .parking-case-resolution .incident-resolution{margin:0}
.parking-case-v4 .parking-case-decision{border:1px solid #b9dace;background:#f0faf5;border-radius:12px;padding:15px}
.parking-case-v4 .parking-case-decision .actions{margin-top:12px}
.parking-case-v4 .parking-case-audit{font-size:12px}
@media(max-width:840px){.parking-case-v4 .parking-case-columns{grid-template-columns:1fr}.parking-case-v4 .parking-case-hero{flex-direction:column}.parking-case-v4 .parking-case-hero .actions,.parking-case-v4 .parking-case-hero .parking-case-hero-actions{justify-content:flex-start}}
@media(max-width:560px){.parking-case-v4 .parking-case-inner{padding:12px}.parking-case-v4 .parking-case-hero{padding:16px}.parking-case-v4 .parking-case-hero h3{font-size:18px!important}.parking-case-v4 .parking-case-overview{grid-template-columns:1fr}.parking-case-v4 .parking-case-section .details,.parking-case-v4 .parking-case-section .incident-primary-grid,.parking-case-v4 .parking-case-section .incident-technical-grid{grid-template-columns:1fr}}
/* v6 - information density */
.parking-case-v4 .parking-case-compact{gap:12px}
.parking-case-v4 .parking-case-extra{padding:11px 14px!important}
.parking-case-v4 .parking-case-extra>summary{cursor:pointer;font-size:12px;font-weight:700;color:#27594b}
.parking-case-v4 .parking-case-extra[open]>summary{margin-bottom:12px}
.parking-case-v4 .parking-case-overview{gap:8px}
</style>
        <header class="parking-case-hero">
          <div class="parking-case-hero-title"><small>${esc(appDisplayName()||'Parking Comunidad')} · EXPEDIENTE DE SOLICITUD</small>
            <h3>${esc(requestTypeLabel(r.Tipo))} · ${esc(requestDossierPlate(r))}</h3>
            <span class="status ${requestIsOpenClient(r)?'bad':''}">${esc(requestDisplayState(r))}</span>
            <div class="parking-case-hero-code" title="${esc(r.ID_Solicitud||'')}">${esc(r.ID_Solicitud?'SOL-'+String(r.ID_Solicitud).slice(-8).toUpperCase():'')}</div>
          </div><div class="parking-case-hero-actions"><button class="secondary" id="req-detail-close">Cerrar</button></div>
        </header>
        <div class="parking-case-inner parking-case-compact">
          <div class="parking-case-overview">
            <div><small>Vivienda</small><b>${esc([r.Bloque,r.Planta,r.Apartamento].filter(Boolean).join(' · ')||'No informado')}</b></div>
            <div><small>Solicitante</small><b>${esc(r.NombreSolicitante||r.Usuario||'No informado')}</b></div>
            <div><small>Fecha de solicitud</small><b>${esc(shortDateTime(r.FechaHora))}</b></div>
          </div>
          <div class="parking-case-columns">
            <div class="parking-case-column parking-case-main">${parkingRequestStructuredDetails(r,'main')}</div>
            <aside class="parking-case-column parking-case-side">
              ${parkingRequestStructuredDetails(r,'side')}
              <div class="parking-case-score">${parkingCompliancePanel(r,incidentRows,{ownerId:requestOwnerId(r)})}</div>
              <div class="parking-case-history">${parkingRequestRelatedContext(r,rows,requestOwnerId(r))}</div>
            </aside>
          </div>
          ${requestIsOpenClient(r)?`<div class="parking-case-decision"><div class="message">${reactivation?(isMoto?'La moto quedará activa y seguirá controlándose por matrícula.':'El vehículo quedará Desasignado, registrado sin slot. Después el propietario podrá asignar uno desde Mis vehículos.'):renewal?'Al aprobar, el QR anterior quedará invalidado y se generará uno nuevo.':longstay?'Al aprobar, Control verá este vehículo como permanencia autorizada durante las fechas solicitadas.':'Se aprobará la solicitud.'}</div><div class="actions"><button id="req-detail-approve" ${!canApproveReactivation?'disabled':''}>${approvalLabel}</button><button class="secondary" id="req-detail-reject">RECHAZAR SOLICITUD</button></div></div>`:''}
        </div>
      </section>`;
      $('#req-detail-close').onclick=()=>host.innerHTML='';
      const refreshAfterResolution=()=>{if(viewMode==='dossiers'){state.cache.requestViewMode='dossiers';state.cache.requestDossierFocus=dossierKeyFor(r)}requests(r.ID_Solicitud)};
      if(requestIsOpenClient(r)){
        const approve=$('#req-detail-approve'),reject=$('#req-detail-reject');
        if(approve)approve.onclick=async()=>{
          const plate=requestDossierPlate(r);
          const effect=reactivation?(isMoto?'La moto quedará Activa y seguirá controlándose por matrícula.':'El vehículo quedará Desasignado. Al asignarle un slot pasará a Activo y se generará un QR nuevo.'):renewal?'El QR anterior quedará invalidado y se generará uno nuevo.':longstay?`Se autorizará la permanencia del ${dateEs(r.FechaInicio)} al ${dateEs(r.FechaFin)}.`:'Se aprobará la solicitud.';
          const obs=await parkingRequestResolutionDialog(r,'Aprobada',effect);
          if(obs===null)return;
          const slot='';busy(approve);if(reject)busy(reject);
          try{
            await call('resolveRequest',{id:r.ID_Solicitud,decision:'Aprobada',slot,observaciones:obs});
            invalidateClientParkingData();
            toast(reactivation?'Activación aprobada.':renewal?'QR renovado y solicitud aprobada.':'Permanencia autorizada.');
            refreshAfterResolution();
          }catch(e){err(e);busy(approve,false);if(reject)busy(reject,false)}
        };
        if(reject)reject.onclick=async()=>{
          const obs=await parkingRequestResolutionDialog(r,'Rechazada','Se rechazará la solicitud sin modificar el vehículo.');
          if(obs===null)return;
          busy(reject);if(approve)busy(approve);
          try{
            await call('resolveRequest',{id:r.ID_Solicitud,decision:'Rechazada',observaciones:obs});
            invalidateClientParkingData();toast('Solicitud rechazada.');refreshAfterResolution();
          }catch(e){err(e);busy(reject,false);if(approve)busy(approve,false)}
        };
      }
      host.scrollIntoView({behavior:'smooth',block:'start'});
    };

    const showDossier=key=>{
      const all=rowsForDossier(key);if(!all.length)return;const pending=all.filter(requestIsOpenClient),history=all.filter(r=>!requestIsOpenClient(r)),latest=all[0],plate=requestDossierPlate(latest),house=`Bloque ${latest.Bloque||'—'}, ${latest.Planta||''} ${latest.Apartamento||''}`.replace(/\s+/g,' ').trim(),approved=history.filter(r=>r.Estado==='Aprobada').length,rejected=history.filter(r=>r.Estado==='Rechazada').length,isMoto=(latest.TipoVehiculo||latest.TipoVehiculoOrigen)==='Moto';
      const rowHtml=(r,open)=>`<div class="request-dossier-item ${open?'is-open':'is-history'}"><div class="request-dossier-item-main"><div class="request-dossier-item-title"><b>${esc(requestTypeLabel(r.Tipo))}</b><span class="status ${open?'bad':''}">${esc(requestDisplayState(r))}</span></div><div class="request-dossier-item-meta"><span>Solicitada ${esc(shortDateTime(r.FechaHora))}</span><span>${esc(r.NombreSolicitante||r.Usuario||'—')}</span>${r.FechaInicio?`<span>${esc(dateEs(r.FechaInicio))} → ${esc(dateEs(r.FechaFin))}</span>`:''}</div>${r.Motivo?`<div class="request-dossier-description">${esc(r.Motivo)}</div>`:''}${!open&&r.FechaResolucion?`<div class="subtle">Resuelta ${esc(shortDateTime(r.FechaResolucion))}${r.NombreResolucion||r.UsuarioResolucion?` por ${esc(r.NombreResolucion||r.UsuarioResolucion)}`:''}</div>`:''}</div><button type="button" class="secondary req-dossier-view" data-id="${esc(r.ID_Solicitud)}">${open?'Gestionar':'Ver detalle'}</button></div>`;
      $('#request-dossier').innerHTML=`<section class="card request-dossier-detail"><div class="head"><div><div class="eyebrow">EXPEDIENTE DE SOLICITUDES</div><h2>${esc(groupByOwner?requestOwnerLabel(latest):groupByHousing?house:plate)}</h2><div class="muted">${esc(house)}</div></div><div class="actions">${latest.ID_Vehiculo?'<button class="secondary" id="req-dossier-vehicle">Ver ficha del vehículo</button>':''}<button class="secondary" id="req-dossier-close">Cerrar expediente</button></div></div><div class="request-dossier-current"><div><small>Estado actual</small><b>${esc(latest.EstadoVehiculo||'—')}</b></div><div><small>QR actual</small><b>${esc(isMoto?'No aplica':latest.EstadoQR||'—')}</b></div><div><small>Slot actual</small><b>${esc(isMoto?'No aplica':latest.SlotActual||'—')}</b></div><div><small>Última actividad</small><b>${esc(shortDateTime(latest.FechaResolucion||latest.FechaHora))}</b></div></div><div class="request-dossier-metrics"><div><b>${pending.length}</b><span>Abiertas</span></div><div><b>${history.length}</b><span>Históricas</span></div><div><b>${approved}</b><span>Aprobadas</span></div><div><b>${rejected}</b><span>Rechazadas</span></div></div><div class="request-dossier-section"><div class="request-dossier-section-head"><h3>Solicitudes abiertas</h3><span>${pending.length}</span></div>${pending.length?pending.map(r=>rowHtml(r,true)).join(''):'<div class="empty compact">No hay solicitudes abiertas para este vehículo.</div>'}</div><div class="request-dossier-section"><div class="request-dossier-section-head"><h3>Histórico</h3><span>${history.length}</span></div>${history.length?history.map(r=>rowHtml(r,false)).join(''):'<div class="empty compact">Todavía no hay solicitudes resueltas.</div>'}</div></section>`;
      $('#req-dossier-close').onclick=()=>$('#request-dossier').innerHTML='';
      if($('#req-dossier-vehicle'))$('#req-dossier-vehicle').onclick=()=>vehicleDetailView(latest.ID_Vehiculo,()=>{state.cache.requestViewMode='dossiers';state.cache.requestDossierFocus=key;go('requests')});
      document.querySelectorAll('.req-dossier-view').forEach(b=>b.onclick=()=>detail(rows.find(r=>r.ID_Solicitud===b.dataset.id)));
      $('#request-dossier').scrollIntoView({behavior:'smooth',block:'start'});
    };

    const renderOverview=()=>{const openRows=rows.filter(requestIsOpenClient),openKeys=new Set(openRows.map(dossierKeyFor)),openHousing=new Set(openRows.map(r=>r.ID_Vivienda).filter(Boolean)),resolved=rows.filter(r=>!requestIsOpenClient(r));$('#req-stat-open').textContent=openRows.length;$('#req-stat-dossiers').textContent=openKeys.size;$('#req-stat-housing').textContent=openHousing.size;$('#req-stat-resolved').textContent=resolved.length};

    const renderList=()=>{const list=filtered();state.cache.requestsFiltered=list;const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));page=Math.min(page,pages);const slice=list.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);$('#req-count').textContent=`Mostrando ${slice.length?((page-1)*PAGE_SIZE+1):0}–${Math.min(page*PAGE_SIZE,list.length)} de ${list.length}`;$('#req-body').innerHTML=slice.map(r=>{const plate=requestDossierPlate(r),house=`Bloque ${r.Bloque}, ${r.Planta} ${r.Apartamento}`;return `<tr><td data-label="Fecha">${esc(shortDateTime(r.FechaHora))}</td><td data-label="Matrícula"><b>${esc(plate)}</b></td><td data-label="Vivienda">${esc(house)}</td><td data-label="Solicitante">${esc(r.NombreSolicitante||r.Usuario)}</td><td data-label="Tipo">${esc(requestTypeLabel(r.Tipo))}</td><td data-label="Estado"><span class="status ${requestIsOpenClient(r)?'bad':''}">${esc(requestDisplayState(r))}</span></td><td data-label="Acciones">${actionMenuHtml(`<button class="secondary req-view" data-id="${esc(r.ID_Solicitud)}">Ver</button><button class="secondary req-row-dossier" data-key="${esc(dossierKeyFor(r))}">Expediente</button>`)}</td></tr>`}).join('');$('#req-empty').classList.toggle('hide',!!list.length);$('#req-pager').innerHTML=pagerHtml('req',page,list.length);document.querySelectorAll('.req-view').forEach(b=>b.onclick=()=>detail(rows.find(r=>r.ID_Solicitud===b.dataset.id)));document.querySelectorAll('.req-row-dossier').forEach(b=>b.onclick=()=>{viewMode='dossiers';page=1;renderMode();showDossier(b.dataset.key)});const prev=$('#req-prev'),next=$('#req-next');if(prev)prev.onclick=()=>{page--;renderList()};if(next)next.onclick=()=>{page++;renderList()}};

    const dossierMatches=()=>{const visible=filtered(),keys=[...new Set(visible.map(dossierKeyFor))];return keys.map(key=>{const all=rowsForDossier(key),matching=visible.filter(r=>dossierKeyFor(r)===key),latest=matching.slice().sort((a,b)=>requestActivityTs(b)-requestActivityTs(a))[0]||all[0],openAll=all.filter(requestIsOpenClient);return {key,all,matching,latest,openAll}}).filter(g=>g.matching.length>0).sort((a,b)=>requestActivityTs(b.latest)-requestActivityTs(a.latest)||naturalSort(requestDossierPlate(a.latest),requestDossierPlate(b.latest)))};
    const renderDossiers=()=>{const groups=dossierMatches(),matchingCount=groups.reduce((n,g)=>n+g.matching.length,0),selectedState=$('#req-state').value;const pages=Math.max(1,Math.ceil(groups.length/PAGE_SIZE));page=Math.min(page,pages);const slice=groups.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);$('#req-count').textContent=`${groups.length} expediente${groups.length===1?'':'s'} · ${matchingCount} solicitud${matchingCount===1?'':'es'}`;$('#request-dossier-list').innerHTML=slice.map(g=>{const latest=g.latest,plate=requestDossierPlate(latest),house=`Bloque ${latest.Bloque||'—'}, ${latest.Planta||''} ${latest.Apartamento||''}`.replace(/\s+/g,' ').trim(),history=g.all.filter(r=>!requestIsOpenClient(r)).length,last=latest.FechaResolucion||latest.FechaHora,tags=[...new Set(g.matching.map(r=>requestTypeLabel(r.Tipo)))],label=selectedState==='Abierta'?`${g.matching.length} abierta${g.matching.length===1?'':'s'}`:selectedState==='Aprobada'?`${g.matching.length} aprobada${g.matching.length===1?'':'s'}`:selectedState==='Rechazada'?`${g.matching.length} rechazada${g.matching.length===1?'':'s'}`:`${g.matching.length} solicitud${g.matching.length===1?'':'es'}`;return `<article class="card request-dossier-card incident-dossier-card ${g.openAll.length?'has-open':''}"><div class="request-dossier-card-main"><div class="request-dossier-card-title"><div><b class="request-dossier-plate">${esc(groupByOwner?requestOwnerLabel(latest):groupByHousing?house:plate)}</b><span class="subtle">${esc(house)}</span></div><span class="status ${selectedState==='Abierta'?'bad':''}">${esc(label)}</span></div><div class="request-dossier-card-metrics"><span><b>${g.matching.length}</b> en la vista</span><span><b>${g.openAll.length}</b> abiertas</span><span><b>${history}</b> históricas</span><span>Última actividad <b>${esc(shortDateTime(last))}</b></span></div><div class="request-dossier-tags">${tags.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}${tags.length>3?`<span>+${tags.length-3}</span>`:''}</div></div><div class="request-dossier-card-action"><button type="button" class="secondary req-open-dossier" data-key="${esc(g.key)}">Ver expediente</button></div></article>`}).join('')||'<div class="card empty">No hay expedientes que coincidan con los filtros.</div>';$('#req-pager').innerHTML=pagerHtml('req',page,groups.length);document.querySelectorAll('.req-open-dossier').forEach(b=>b.onclick=()=>showDossier(b.dataset.key));const prev=$('#req-prev'),next=$('#req-next');if(prev)prev.onclick=()=>{page--;renderDossiers()};if(next)next.onclick=()=>{page++;renderDossiers()}};

    const renderMode=()=>{const dossiers=viewMode==='dossiers';$('#request-dossier-list').classList.toggle('hide',!dossiers);$('#request-flat-list').classList.toggle('hide',dossiers);$('#request-view-dossiers').classList.toggle('active',dossiers&&!groupByHousing&&!groupByOwner);$('#request-view-housing').classList.toggle('active',dossiers&&groupByHousing&&!groupByOwner);$('#request-view-owner').classList.toggle('active',dossiers&&groupByOwner);$('#request-view-list').classList.toggle('active',!dossiers);renderOverview();if(dossiers)renderDossiers();else renderList()};
    $('#requests-export-xlsx').onclick=()=>downloadXlsx(`solicitudes_${new Date().toISOString().slice(0,10)}.xlsx`,viewMode==='dossiers'?dossierMatches().flatMap(g=>g.matching):(state.cache.requestsFiltered||filtered()),null,'Solicitudes').catch(err);$('#requests-export-csv').onclick=()=>downloadCsv(`solicitudes_${new Date().toISOString().slice(0,10)}.csv`,viewMode==='dossiers'?dossierMatches().flatMap(g=>g.matching):(state.cache.requestsFiltered||filtered()));
    $('#req-search').value=navPreset?.search||'';$('#req-state').value=navPreset?.status!==undefined?navPreset.status:'Abierta';$('#req-type').value=navPreset?.type||'';$('#req-period').value='';$('#req-from').value='';$('#req-to').value='';bindPeriodVisibility('req');
    const reset=()=>{page=1;$('#request-dossier').innerHTML='';renderMode()};$('#req-search').oninput=reset;['req-state','req-type','req-period','req-from','req-to'].forEach(id=>$(`#${id}`).onchange=reset);document.querySelectorAll('.sortable-th').forEach(th=>{th.dataset.dir=th.dataset.sort===sortKey?sortDir:'';th.onclick=()=>{const k=th.dataset.sort;sortDir=sortKey===k&&sortDir==='asc'?'desc':'asc';sortKey=k;page=1;document.querySelectorAll('.sortable-th').forEach(x=>x.dataset.dir=x.dataset.sort===sortKey?sortDir:'');if(viewMode==='list')renderList()}});
    const openDefault=()=>{const stateSel=$('#req-state');if(stateSel)stateSel.value='Abierta'};
    $('#request-view-dossiers').onclick=()=>{groupByHousing=false;groupByOwner=false;viewMode='dossiers';openDefault();page=1;$('#request-detail').innerHTML='';$('#request-dossier').innerHTML='';renderMode()};$('#request-view-housing').onclick=()=>{groupByHousing=true;groupByOwner=false;viewMode='dossiers';openDefault();page=1;$('#request-detail').innerHTML='';$('#request-dossier').innerHTML='';renderMode()};$('#request-view-owner').onclick=()=>{groupByHousing=false;groupByOwner=true;viewMode='dossiers';openDefault();page=1;$('#request-detail').innerHTML='';$('#request-dossier').innerHTML='';renderMode()};$('#request-view-list').onclick=()=>{viewMode='list';openDefault();page=1;$('#request-detail').innerHTML='';$('#request-dossier').innerHTML='';renderMode()};
    const requestFilterToggle=$('#request-filter-toggle');
    const requestFilterBar=document.querySelector('.admin-request-filters');
    if(requestFilterToggle&&requestFilterBar){
      requestFilterBar.classList.add('mobile-filter-collapsed');
      requestFilterToggle.onclick=()=>{
        const collapsed=requestFilterBar.classList.toggle('mobile-filter-collapsed');
        requestFilterToggle.textContent=collapsed?'Filtros':'Ocultar filtros';
      };
    }

    renderMode();if(dossierFocus)showDossier(dossierFocus);if(focusId){const target=rows.find(r=>r.ID_Solicitud===focusId);if(target)detail(target)}
  }catch(e){err(e)}
}
