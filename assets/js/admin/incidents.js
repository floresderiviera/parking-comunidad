// Calculate previous week (Mon-Sun) in Europe/Madrid timezone - matches Edge Function's previousWeek()
function previousWeekMadrid() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(x => [x.type, x.value]));
  const current = parts.year + '-' + parts.month + '-' + parts.day;
  const dow = new Date(current + 'T12:00:00Z').getUTCDay(); // 0=Sun, 1=Mon...
  const thisMonday = new Date(current + 'T12:00:00Z');
  thisMonday.setUTCDate(thisMonday.getUTCDate() - ((dow + 6) % 7));
  const start = new Date(thisMonday);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = thisMonday;
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function incidentIsQrLinkedCase(row){
  row=row||{};const type=String(row.Tipo||''),situation=String(row.Situacion||''),origin=String(row.OrigenControl||'');
  return origin==='QR'&&((type==='Uso indebido'&&(situation==='Cesión de QR'||situation==='Uso de QR ajeno'))||type==='Matrícula no registrada'||type==='QR no corresponde con matrícula');
}
function incidentEventIdsClient(row){
  row=row||{};return new Set([row.ID_Evento,...(row.Seguimientos||[]).map(s=>s.ID_EventoSeguimiento)].filter(Boolean));
}
function incidentRowsShareEventClient(a,b){
  const aa=incidentEventIdsClient(a),bb=incidentEventIdsClient(b);for(const id of aa)if(bb.has(id))return true;return false;
}
function incidentRelatedCasesClient(row,rows){
  const related=(rows||[]).filter(x=>x&&x.ID_Incidencia!==row.ID_Incidencia&&incidentRowsShareEventClient(row,x));
  // FIX11.6 - En flujos QR solo son vinculadas las patas del propio dominio QR.
  // Excluye Acceso no autorizado heredado de eventos creados antes de FIX11.5.
  return incidentIsQrLinkedCase(row)?related.filter(incidentIsQrLinkedCase):related;
}
function incidentRelatedPlatesClient(row,relatedCases,plateOf){
  if(!incidentIsQrLinkedCase(row))return [];
  const own=normalizePlateClient(plateOf(row)),values=[row.MatriculaRelacionada,...(row.Seguimientos||[]).map(s=>s.MatriculaRelacionada),...(relatedCases||[]).map(plateOf)];
  return [...new Set(values.map(normalizePlateClient).filter(x=>x&&x!==own))];
}

function incidentPhotoUrls(row){
  return [...new Set([
    ...(Array.isArray(row?.Fotos) ? row.Fotos : []),
    row?.Foto
  ].filter(Boolean))];
}
function incidentEvidenceLinks(row,label='Evidencia'){
  const photos=incidentPhotoUrls(row);
  if(!photos.length)return '';
  return `<div class="actions incident-evidence-links">${photos.map((url,i)=>`<a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ${i+1}</a>`).join('')}</div>`;
}
async function incidentPdfImage(url){
  try{
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok)throw new Error('image');
    const blob=await res.blob();
    return await new Promise((ok,no)=>{
      const r=new FileReader();
      r.onload=()=>ok(r.result);
      r.onerror=no;
      r.readAsDataURL(blob);
    });
  }catch(_){return ''}
}
async function generateIncidentPdf(row,housingLabel='',options={}){
  // parking_pdf_pre_restauracion_v1: conservar el formato documental PRE.
  if(options.audience==='OWNER'){
    // Never include evidence, third-party plates or uncontrolled free-text in owner attachments.
    row={...row,
      Descripcion:'El detalle confidencial y las evidencias se conservan en el expediente administrativo.',
      Situacion:'',Causa:'',MatriculaObservada:'',MatriculaInfraccion:'',
      ComentarioCierre:'La incidencia ha sido cerrada. Contacta con administración para obtener información adicional.',
      Foto:'',Fotos:[],MatriculaAutorizada:'',MatriculaRelacionada:'',
      MatriculaHabitualOrigen:'',MatriculaHabitualVehiculo:'',EstadoVehiculoOrigen:'',
      Seguimientos:(row.Seguimientos||[]).map(f=>({...f,Foto:'',Fotos:[],
        Observacion:'Seguimiento registrado.',MatriculaAutorizada:'',MatriculaObservada:''}))
    };
  }
  const lib=await loadExternal(
    'jspdf',
    [
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'
    ],
    'jspdf'
  );

  const doc=new lib.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  const pageW=210,pageH=297,left=16,right=16,contentW=178,bottom=17;
  const green=[31,103,84],dark=[25,38,48],muted=[100,116,139],line=[226,232,240],soft=[246,248,250],softGreen=[240,248,244];
  const incidentUuid=String(row.ID_Incidencia||'').trim().toUpperCase();
  const shortId=/^[0-9A-F]{8}-[0-9A-F-]{27,}$/.test(incidentUuid)?`${incidentUuid.slice(0,8)}-${incidentUuid.slice(-8)}`:(incidentUuid||'SIN-ID');
  const officialName=String(appDisplayName()||'Parking Comunidad').replace(/^Urbanizacion\b/i,'Urbanización');
  const clean=v=>String(v??'').trim();
  const formatOrigin=v=>{
    const x=clean(v);
    if(x.toUpperCase()==='MATRICULA')return 'Matrícula';
    if(x.toUpperCase()==='QR')return 'QR';
    return x||'Manual';
  };
  let y=16;

  const newPage=(title='')=>{
    doc.addPage();y=16;
    if(title){
      doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...green);
      doc.text(`INC-${shortId} · ${clean(row.MatriculaObservada||row.MatriculaInfraccion||'')}`,left,10);
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);
      doc.text(title,pageW-right,10,{align:'right'});
      doc.setDrawColor(...line);doc.line(left,13,pageW-right,13);
      y=21;
    }
  };
  const need=h=>{if(y+h>pageH-bottom)newPage('Continuación del expediente')};

  const heading=(title,subtitle='')=>{
    need(13);
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...dark);
    doc.text(String(title).toUpperCase(),left,y);
    if(subtitle){
      doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...muted);
      doc.text(subtitle,pageW-right,y,{align:'right'});
    }
    y+=3;doc.setDrawColor(...line);doc.line(left,y,pageW-right,y);y+=6;
  };

  const metricCards=items=>{
    const gap=4,w=(contentW-gap*3)/4,h=18;
    need(h+5);
    items.slice(0,4).forEach((item,i)=>{
      const x=left+i*(w+gap);
      doc.setFillColor(...soft);doc.setDrawColor(...line);
      doc.roundedRect(x,y,w,h,2,2,'FD');
      doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);
      doc.text(String(item[0]),x+3,y+5);
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...dark);
      doc.text(doc.splitTextToSize(String(item[1]||''),w-6).slice(0,2),x+3,y+11);
    });
    y+=h+6;
  };

  const fields=(pairs,{cols=2,gap=8}={})=>{
    const colW=(contentW-gap*(cols-1))/cols;
    for(let i=0;i<pairs.length;i+=cols){
      const group=pairs.slice(i,i+cols);
      if(!group.some(p=>clean(p?.[1])))continue;
      const heights=group.map(p=>{
        if(!p||!clean(p[1]))return 0;
        return 6+Math.max(1,doc.splitTextToSize(clean(p[1]),colW-2).length)*4;
      });
      const rowH=Math.max(12,...heights);need(rowH);
      group.forEach((p,j)=>{
        if(!p||!clean(p[1]))return;
        const x=left+j*(colW+gap);
        doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);
        doc.text(String(p[0]),x,y);
        doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...dark);
        doc.text(doc.splitTextToSize(clean(p[1]),colW-2),x,y+4.5);
      });
      y+=rowH;
    }
  };

  const paragraph=(text,{size=9,space=5,maxWidth=contentW}={})=>{
    const value=clean(text);if(!value)return;
    const lines=doc.splitTextToSize(value,maxWidth);
    need(lines.length*4+space);
    doc.setFont('helvetica','normal');doc.setFontSize(size);doc.setTextColor(...dark);
    doc.text(lines,left,y);y+=lines.length*4+space;
  };

  const narrativeInset=7; // mm: sangría a ambos lados, sin recuadro
  const narrativeLineH=4.3;
  const narrativeBox=(text,{size=8.8,space=5}={})=>{
    const value=clean(text);if(!value)return;
    doc.setFont('helvetica','normal');doc.setFontSize(size);
    const lines=doc.splitTextToSize(value,contentW-2*narrativeInset);
    const h=lines.length*narrativeLineH+3.5
    need(h+space);
    doc.setFont('helvetica','normal');doc.setFontSize(size);doc.setTextColor(...dark);
    doc.text(lines,left+narrativeInset,y+3.3);
    y+=h+space;
  };

  const photoGrid=async(urls,captionPrefix,{height=50}={})=>{
    const list=[...new Set((urls||[]).filter(Boolean))];
    if(!list.length)return;
    const gap=7,w=(contentW-gap)/2,cap=5;
    for(let i=0;i<list.length;i+=2){
      const pair=list.slice(i,i+2),rowH=height+cap+4;
      need(rowH);
      const loaded=await Promise.all(pair.map(incidentPdfImage));
      loaded.forEach((data,j)=>{
        const x=left+j*(w+gap);
        doc.setFillColor(250,251,252);doc.setDrawColor(...line);
        doc.roundedRect(x,y,w,height,2,2,'FD');
        if(data){
          try{
            const prop=doc.getImageProperties(data);
            const scale=Math.min((w-2)/prop.width,(height-2)/prop.height);
            const rw=prop.width*scale,rh=prop.height*scale;
            doc.addImage(data,prop.fileType||'JPEG',x+(w-rw)/2,y+(height-rh)/2,rw,rh,undefined,'FAST');
          }catch(_){}
        }
        doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...muted);
        doc.text(`${captionPrefix} ${i+j+1}`,x,y+height+4);
      });
      y+=rowH;
    }
  };

  const auditLine=(label,date)=>{
    doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(...dark);
    doc.text(label,left+4,y);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);
    doc.text(shortDateTime(date),pageW-right-4,y,{align:'right'});
    y+=6;
  };

  const followupBlockHeight=(f,photoCount)=>{
    const obs=clean(f?.Observacion||'');
    doc.setFont('helvetica','normal');doc.setFontSize(8.4);
    const obsH=(obs?doc.splitTextToSize(obs,contentW-2*narrativeInset).length*narrativeLineH+3.5:0)+4;
    return 12+18+obsH+(photoCount?55:0)+7;
  };

  const resolutionBox=()=>{
    const comment=clean(row.ComentarioCierre)||'Sin comentario de cierre.';
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);
    const lines=doc.splitTextToSize(comment,contentW-2*narrativeInset);
    const h=25+lines.length*narrativeLineH;
    need(h+2);
    let yy=y+4;
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(...green);
    doc.text('RESOLUCIÓN',left,yy);
    if(row.Estado==='Cerrada'){
      doc.setFillColor(...green);doc.roundedRect(pageW-right-32,y+1,26,7,3.5,3.5,'F');
      doc.setTextColor(255,255,255);doc.setFontSize(8);
      doc.text('CERRADA',pageW-right-19,y+5.7,{align:'center'});
    }
    yy+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);
    doc.text('Acción realizada',left,yy);
    doc.text('Fecha y hora',left+100,yy);
    yy+=4.5;
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...dark);
    doc.text(clean(row.AccionCierre)||'Sin actuación',left,yy);
    doc.text(shortDateTime(row.FechaCierre),left+100,yy);
    yy+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...dark);
    doc.text(lines,left+narrativeInset,yy+2);
    y+=h+2;
  };

  doc.setFillColor(...green);doc.rect(0,0,pageW,29,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(255,255,255);
  doc.text('INFORME DE INCIDENCIA',left,11);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(228,244,238);
  doc.text(officialName,left,18);
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(255,255,255);
  doc.text(`INC-${shortId}`,pageW-right,11,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);
  doc.text(row.Estado==='Cerrada'?'INFORME FINAL':'INFORME PROVISIONAL',pageW-right,18,{align:'right'});
  y=36;

  metricCards([
    ['Matrícula',row.MatriculaObservada||row.MatriculaInfraccion||'—'],
    ['Estado',row.Estado||'Abierta'],
    ['Prioridad',row.Prioridad||'Normal'],
    ['Intentos',row.Intentos||1]
  ]);

  heading('Datos del expediente');
  fields([
    ['Fecha y hora de apertura',shortDateTime(row.FechaHora)],
    ['Vivienda',housingLabel||''],
    ['Tipo',row.Tipo||''],
    ['Situación',row.Situacion||''],
    ['Causa',row.Causa||''],
    ['Origen',formatOrigin(row.OrigenControl)],
    ['Matrícula habitual',row.MatriculaHabitualOrigen||row.MatriculaHabitualVehiculo||''],
    ['Tipo de vehículo',row.TipoVehiculoOrigen||row.TipoVehiculo||''],
    ['Estado al crear',row.EstadoVehiculoOrigen||''],
    ['Slot origen',row.SlotOrigen||'']
  ]);

  heading('Hechos registrados',shortDateTime(row.FechaHora));
  narrativeBox(row.Descripcion||'Sin descripción.',{size:8.8,textWidth:158,space:6});

  const initial=incidentPhotoUrls(row);
  if(initial.length){
    heading('Evidencias iniciales',`${initial.length} archivo${initial.length===1?'':'s'}`);
    await photoGrid(initial,'Evidencia',{height:54});
  }

  const followups=Array.isArray(row.Seguimientos)?row.Seguimientos:[];
  if(followups.length){
    newPage('Cronología del expediente');
    heading('Seguimientos',`${followups.length} seguimiento${followups.length===1?'':'s'}`);

    for(const f of followups){
      const fp=incidentPhotoUrls(f);
      const estimated=followupBlockHeight(f,fp.length);
      if(y+estimated>pageH-bottom)newPage('Cronología del expediente');

      auditLine(`Seguimiento · intento ${f.NumeroIntento||''}`,f.FechaHora);
      fields([
        ['Situación',f.Situacion||''],
        ['Matrícula observada',f.MatriculaObservada||''],
        ['Matrícula QR',f.MatriculaAutorizada||'']
      ],{cols:3,gap:6});
      narrativeBox(f.Observacion||'',{size:8.4,textWidth:158,space:4});

      if(fp.length){
        await photoGrid(fp,`Intento ${f.NumeroIntento||''} · Evidencia`,{height:46});
      }
      y+=1.5;
    }
  }else{
    newPage('Resolución del expediente');
  }

  if(row.Estado==='Cerrada'){
    resolutionBox();
  }else{
    need(20);
    doc.setFillColor(255,248,235);doc.setDrawColor(245,215,160);
    doc.roundedRect(left,y,contentW,17,3,3,'FD');
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(180,83,9);
    doc.text('INCIDENCIA ABIERTA',left+6,y+6);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...dark);
    doc.text('Pendiente de resolución.',left+6,y+12);
    y+=23;
  }

  const traceRows=[
    ['Incidencia registrada',row.FechaHora],
    ...followups.map(f=>[`Seguimiento · intento ${f.NumeroIntento||''}`,f.FechaHora]),
    ...(row.Estado==='Cerrada'&&row.FechaCierre?[['Resolución',row.FechaCierre]]:[])
  ];
  const traceRowH=4.1;
  const traceHeight=8+traceRows.length*traceRowH+2;
  if(y+traceHeight>pageH-bottom)newPage('Trazabilidad del expediente');
  doc.setFont('helvetica','bold');doc.setFontSize(8.6);doc.setTextColor(...dark);
  doc.text('TRAZABILIDAD DEL EXPEDIENTE',left,y);
  y+=2.5;doc.setDrawColor(...line);doc.line(left,y,pageW-right,y);y+=4.2;
  traceRows.forEach(([label,date])=>{
    doc.setFont('helvetica','normal');doc.setFontSize(7.4);doc.setTextColor(...dark);
    doc.text(label,left+2,y);
    doc.setTextColor(...muted);
    doc.text(shortDateTime(date),pageW-right-2,y,{align:'right'});
    y+=traceRowH;
  });
  y+=1.5;

  const total=doc.getNumberOfPages();
  const generated=new Date().toLocaleString('es-ES');
  for(let p=1;p<=total;p++){
    doc.setPage(p);doc.setDrawColor(...line);doc.line(left,pageH-12,pageW-right,pageH-12);
    doc.setFont('helvetica','normal');doc.setFontSize(6.7);doc.setTextColor(...muted);
    doc.text(`${officialName} · INC-${shortId} · ${generated}`,left,pageH-7);
    doc.text(`Página ${p} de ${total}`,pageW-right,pageH-7,{align:'right'});
  }

  const plate=normalizePlateClient(row.MatriculaObservada||row.MatriculaInfraccion||row.MatriculaHabitualOrigen||'SIN_MATRICULA');
  if(options.asBlob)return doc.output('blob');
  doc.save(`Informe_Incidencia_${plate}_${shortId}.pdf`);
}
async function uploadIncidentCloseReports(row,housingLabel){
  const to64=blob=>new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
    reader.onerror=()=>reject(reader.error||new Error('No se pudo leer el informe PDF'));
    reader.readAsDataURL(blob);
  });
  // El informe oficial de la plataforma se genera una sola vez.
  // ADMIN y propietario reciben el mismo objeto privado, byte por byte.
  const pdf=await generateIncidentPdf(row,housingLabel,{asBlob:true});
  if(pdf.size>10*1024*1024)throw new Error('El PDF supera 10 MB.');
  await call('uploadIncidentPdf',{id:row.ID_Incidencia,audience:'ADMIN',pdfBase64:await to64(pdf)});
}

function parkingScorePanel(row,all,ownerId,options={}){
 const home=all.filter(x=>row.ID_Vivienda&&x.ID_Vivienda===row.ID_Vivienda),owned=ownerId?all.filter(x=>x.ID_PropietarioAlHecho===ownerId):[];
 const rules=options.rules||parkingComplianceActiveRules();
 const current=parkingScore(home,{rules}),person=ownerId?parkingScore(owned,{rules}):null;
 const prospective=options.action?parkingScore(home,{rules,closeId:row.ID_Incidencia,action:options.action}):null;
 const nextOwner=options.action&&ownerId?parkingScore(owned,{rules,closeId:row.ID_Incidencia,action:options.action}):null;
 const result=(name,score,after)=>`<div class="card incident-stat-card" style="flex:1;min-width:220px">
   <span>${name}</span><b>${score?score.score+'/100':'Sin atribución verificada'}</b>
   <small>${score?`${score.open} abiertas · ${score.closed} confirmadas · ${score.excluded} excluidas · ${score.followups} seguimientos`:'Sin historial atribuible'}</small>
   ${score?.recovery?`<small>Recuperación: +${score.recovery} puntos</small>`:''}
   ${after?`<small><b>Simulación:</b> ${score.score}/100 → ${after.score}/100</small>`:''}
 </div>`;
 const entries=current.items.slice(0,12);
 return `<section class="card incident-compliance-panel" id="incident-compliance-panel" style="margin:1rem 0">
   <div class="head"><h3>Antecedentes y puntuación de cumplimiento</h3><span class="system-pill ok">Reglas v${esc(rules.version||0)}</span></div>
   <p class="muted">Índice explicable de ${esc(rules.window_days)} días. Las solicitudes no descuentan puntos. Los cierres anulados, infundados, sin actuación o con datos corregidos se excluyen.</p>
   <div style="display:flex;flex-wrap:wrap;gap:.75rem">${result('Vivienda',current,prospective)}${result('Propietario',person,nextOwner)}</div>
   <p class="muted">Origen: reglas activas de la comunidad y fundamentos congelados al cerrar. Eventos vinculados se computan una sola vez (${current.duplicates} duplicado${current.duplicates===1?'':'s'} excluido${current.duplicates===1?'':'s'}).</p>
   <details><summary>Ver antecedentes y desglose</summary>
   <ul>${entries.map(x=>`<li>${esc(shortDateTime(x.row.FechaHora))} · ${esc(x.row.Tipo)} · ${esc(x.row.Estado)} · ${x.attempts+1} intentos · ${x.loss?`−${x.loss}`:'0'} puntos · ${esc(x.origin)}${x.linked>1?` · ${x.linked} eventos vinculados`:''}</li>`).join('')||'<li>Sin antecedentes computables.</li>'}</ul>
   ${current.recovery?`<p><b>Puntos recuperados:</b> +${current.recovery} tras ${current.daysWithoutDetection} días sin nuevas detecciones y sin casos abiertos.</p>`:''}
   </details>
 </section>`;
}
function parkingCompliancePanel(row,allRows,options={}){return parkingScorePanel(row,allRows,options.ownerId||row.ID_PropietarioAlHecho||'',options)}
async function incidents(openId=''){
  try{
    const focusId=openId||state.cache.incidentFocus||'';delete state.cache.incidentFocus;const navPreset=state.cache.incidentPreset||null;delete state.cache.incidentPreset;
    const response=await call('listIncidentsPayload');const rows=Array.isArray(response)?response:(Array.isArray(response?.rows)?response.rows:[]);if(!Array.isArray(rows))throw new Error('Respuesta inválida al cargar incidencias.');if(response?.complianceRules)parkingComplianceSetRules(response.complianceRules);state.cache.incidents=rows;const ui=viewUiState('incidents');let page=ui.page||1,sortKey=ui.sortKey||'FechaHora',sortDir=ui.sortDir||'desc',viewMode=ui.viewMode||'dossiers';
    const types=['Matrícula no registrada','Acceso no autorizado','QR no presentado','QR no corresponde con matrícula','Uso indebido','Vehículo inmovilizado / posible abandono','Estacionamiento o ubicación indebida','Fuga / pérdida de líquidos','Otro'];
    const priorities=[...new Set(rows.map(r=>r.Prioridad).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
    // Auto-calculate previous week (Mon-Sun) in Madrid timezone
    const prevWeek = previousWeekMadrid();
    $('#main').innerHTML=`<div class="head incidents-head"><div><h1>Incidencias</h1><div class="muted">Bandeja de gestión con agrupación independiente por vivienda, propietario o matrícula.</div></div><div class="actions incident-export-actions">${exportButtonsHtml('incidents-export')}</div></div>${hasUiRole('ADMIN')?`<section class="incident-weekly-workspace" aria-labelledby="incident-weekly-title"><div class="incident-weekly-heading"><div><div class="incident-weekly-eyebrow">REPORTES · ADMINISTRACIÓN</div><h2 id="incident-weekly-title">Informe semanal</h2><p>Generación y consulta de informes Excel.</p></div><div class="incident-weekly-status">Solo ADMIN / ROOT</div></div><div class="incident-weekly-body"><div class="incident-weekly-generate"><div class="incident-weekly-label">Semana anterior · hora Madrid</div><div class="incident-weekly-dates">${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(prevWeek.start+'T12:00:00Z'))} – ${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(prevWeek.end+'T12:00:00Z'))}</div><input type="hidden" id="incident-report-period" value="${prevWeek.start}"><input type="hidden" id="incident-report-period-end" value="${prevWeek.end}"><button type="button" class="incident-weekly-primary" id="incident-weekly-report">Generar Excel semanal</button></div><div class="incident-weekly-history"><label for="incident-report-history" class="incident-weekly-label">Informes guardados</label><div class="incident-weekly-history-controls"><select id="incident-report-history" aria-label="Informes guardados"><option value="">Seleccionar informe</option></select><button type="button" class="secondary" id="incident-download-weekly-report" disabled>Descargar informe</button></div><div class="incident-weekly-hint">Seleccioná un informe existente para descargarlo.</div><div class="actions" style="margin-top:.7rem;flex-wrap:wrap"><button type="button" class="secondary" id="incident-weekly-versions" disabled>Ver versiones</button><button type="button" class="secondary" id="incident-weekly-regenerate" disabled>Regenerar</button></div><div id="incident-weekly-version-controls" hidden><label for="incident-weekly-version-list">Versión disponible</label><select id="incident-weekly-version-list" aria-label="Versiones del informe"></select><button type="button" class="secondary" id="incident-weekly-restore">Restaurar versión seleccionada</button></div></div></div></section>`:''}<div id="incident-editor"></div><div id="incident-detail"></div><div id="incident-dossier"></div><div class="incident-overview" id="incident-overview"><div class="card incident-stat-card"><span>Incidencias abiertas</span><b id="inc-stat-open">0</b><small>Pendientes de resolver</small></div><div class="card incident-stat-card"><span>Críticas</span><b id="inc-stat-critical">0</b><small>Abiertas con prioridad crítica</small></div><div class="card incident-stat-card"><span>Vehículos afectados</span><b id="inc-stat-vehicles">0</b><small>Matrículas con casos abiertos</small></div><div class="card incident-stat-card"><span>Intentos abiertos</span><b id="inc-stat-attempts">0</b><small>Acumulados en incidencias abiertas</small></div></div><div class="mobile-filter-toggle-wrap">
      <button type="button" class="secondary mobile-filter-toggle" id="incident-filter-toggle">
        Filtros
      </button>
    </div><div class="incident-viewbar"><div class="incident-view-tabs"><button type="button" class="secondary" id="incident-view-housing">Por vivienda</button><button type="button" class="secondary" id="incident-view-owner">Por propietario</button><button type="button" class="secondary" id="incident-view-dossiers">Por matrícula</button><button type="button" class="secondary" id="incident-view-list">Lista de incidencias</button></div><span class="count" id="incident-count"></span></div><div class="filterbar admin-record-filterbar admin-incident-filters"><div class="field filter-search"><label>Buscar</label><input id="incident-search" class="search" placeholder="Matrícula, vivienda, propietario, tipo o descripción..."></div>${periodFilterFields('incident')}<div class="field"><label>Estado</label><select id="incident-state"><option value="Abierta" selected>Abiertas</option><option value="">Todas</option><option>Cerrada</option></select></div><div class="field"><label>Prioridad</label><select id="incident-priority"><option value="">Todas</option>${priorities.map(v=>`<option>${esc(v)}</option>`).join('')}</select></div><div class="field"><label>Tipo</label><select id="incident-type"><option value="">Todos</option>${types.map(v=>`<option>${esc(v)}</option>`).join('')}</select></div><div class="field"><label>Origen</label><select id="incident-origin"><option value="">Todos</option>${[...new Set(rows.map(r=>r.OrigenControl||'Manual'))].sort().map(v=>`<option>${esc(v)}</option>`).join('')}</select></div></div><div id="incident-dossier-list" class="incident-dossier-list"></div><div id="incident-flat-list" class="tablebox compact-table admin-record-tablebox hide"><table class="table responsive-data-table admin-record-table admin-incident-table"><thead><tr><th class="sortable-th" data-sort="FechaHora">Fecha</th><th class="sortable-th" data-sort="MatriculaObservada">Matrícula</th><th class="sortable-th" data-sort="Vivienda">Vivienda</th><th class="sortable-th" data-sort="Tipo">Incidencia</th><th class="sortable-th" data-sort="Prioridad">Prioridad</th><th class="sortable-th" data-sort="Intentos">Intentos</th><th class="sortable-th" data-sort="Estado">Estado</th><th>Acciones</th></tr></thead><tbody id="incident-body"></tbody></table><div id="incident-empty" class="empty hide">No hay incidencias.</div></div><div id="incident-pager"></div>`;
    const housingMap=Object.fromEntries((state.cache.formOptions?.housing||[]).map(h=>[h.ID_Vivienda,h]));
    const incidentPlate=r=>normalizePlateClient(r.MatriculaInfraccion||r.MatriculaHabitualOrigen||r.MatriculaObservada||r.MatriculaHabitualVehiculo||'')||'SIN MATRÍCULA';
    const incidentHouse=r=>recordHousingLabel(r,housingMap[r.ID_Vivienda]);
    let groupByHousing=ui.groupMode?ui.groupMode==='housing':ui.groupByHousing!==false,groupByOwner=ui.groupMode==='owner';
    const dossierKey=r=>groupByOwner?(r.ID_PropietarioAlHecho?`OWNER:${r.ID_PropietarioAlHecho}`:`INC:${r.ID_Incidencia}`):groupByHousing?`HOUSING:${r.ID_Vivienda||'unassigned'}`:(incidentPlate(r)==='SIN MATRÍCULA'?`INC:${r.ID_Incidencia||''}`:`PLATE:${incidentPlate(r)}`);
    const rowsForDossier=key=>String(key||'').startsWith('PLATE:')?rows.filter(r=>dossierKey(r)===key):rows.filter(r=>dossierKey(r)===key);
    const lastActivity=r=>{const fs=Array.isArray(r.Seguimientos)?r.Seguimientos:[];return r.UltimoSeguimiento||(fs.length?fs[fs.length-1].FechaHora:'')||r.FechaHora||''};
    const activityTs=r=>{const t=Date.parse(lastActivity(r));return Number.isFinite(t)?t:0};
    const priorityRank=v=>{const x=String(v||'').toLowerCase();return x==='crítica'?4:x==='alta'?3:x==='media'?2:1};
    const relationCount=r=>incidentRelatedPlatesClient(r,incidentRelatedCasesClient(r,rows),incidentPlate).length;
    bindPeriodVisibility('incident');
    const repeatOnly=!!navPreset?.followup;
    const focusHousingId=navPreset?.housingId||'';
    const focusOwnerId=navPreset?.ownerId||'';
    const filtered=()=>{
      const q=$('#incident-search').value.trim().toLowerCase(),type=$('#incident-type').value,status=$('#incident-state').value,origin=$('#incident-origin').value,priority=$('#incident-priority').value,period=$('#incident-period').value,from=$('#incident-from').value,to=$('#incident-to').value;
      saveViewUiState('incidents',{q,type,status,origin,priority,period,from,to,page,sortKey,sortDir,viewMode,groupByHousing,groupMode:groupByOwner?'owner':groupByHousing?'housing':'plate',v:'1.2.13.14-FIX11.10'});
      const val=(r,k)=>k==='Vivienda'?incidentHouse(r):k==='MatriculaObservada'?incidentPlate(r):k==='Intentos'?Number(r.Intentos||1):r[k]||'';
      return rows.filter(r=>(!focusHousingId||r.ID_Vivienda===focusHousingId)&&(!focusOwnerId||r.ID_PropietarioAlHecho===focusOwnerId)&&(!type||r.Tipo===type)&&(!status||r.Estado===status)&&(!origin||(r.OrigenControl||'Manual')===origin)&&(!priority||r.Prioridad===priority)&&(!repeatOnly||Number(r.Intentos||1)>1)&&periodMatches(r.FechaHora,period,from,to)&&[...Object.values(r),recordHousingLabel(r,housingMap[r.ID_Vivienda])].join(' ').toLowerCase().includes(q)).sort((a,b)=>{const c=String(val(a,sortKey)).localeCompare(String(val(b,sortKey)),'es',{numeric:true,sensitivity:'base'});return sortDir==='asc'?c:-c});
    };
    const detail=r=>{
      const canSeeActors=hasUiRole('ADMIN');
      const h=housingMap[r.ID_Vivienda],host=$('#incident-detail'),linked=!!r.ID_Vehiculo,isMoto=(r.TipoVehiculo||r.TipoVehiculoOrigen)==='Moto',actions=r.AccionesDisponibles||['Sin actuación','Aviso al propietario','Otra'];
      const qrLinked=incidentIsQrLinkedCase(r),relatedCases=incidentRelatedCasesClient(r,rows),relatedPlates=incidentRelatedPlatesClient(r,relatedCases,incidentPlate);
      const observedPlate=r.MatriculaHabitualVehiculo||r.MatriculaHabitualOrigen||r.MatriculaObservada||'vehículo observado',qrOwnerPlate=r.MatriculaRelacionada||r.MatriculaAutorizada||'vehículo propietario del QR';
      const actionLabel=a=>r.Tipo==='QR no corresponde con matrícula'&&a==='Revocar QR'?`Revocar QR de ${qrOwnerPlate}`:r.Tipo==='QR no corresponde con matrícula'&&a==='Suspender vehículo'?`Suspender vehículo ${observedPlate}`:r.Tipo==='QR no corresponde con matrícula'&&a==='Mantener suspensión'?`Mantener suspensión de ${observedPlate}`:a;
      const linkedLabel=x=>`${x.Tipo}${x.Situacion?` · ${x.Situacion}`:''} · ${incidentPlate(x)}`;
      const eventParticipants=event=>{const participants=event?rows.filter(row=>row.ID_Evento===event||(row.Seguimientos||[]).some(s=>s.ID_EventoSeguimiento===event)):[];return qrLinked?participants.filter(incidentIsQrLinkedCase):participants};
      const eventFollowupCount=x=>eventParticipants(x.ID_EventoSeguimiento||'').length||1;
      const eventFollowupRelated=x=>eventParticipants(x.ID_EventoSeguimiento||'').filter(row=>row.ID_Incidencia!==r.ID_Incidencia).map(linkedLabel);
      const topActions=`<div class="actions">${hasUiRole('ADMIN')&&r.Estado==='Abierta'?`<button class="secondary" id="inc-detail-pdf">Generar PDF provisional</button><button id="inc-detail-close-case">Resolver incidencia</button>`:''}${hasUiRole('ADMIN')&&r.Estado==='Cerrada'?'<button class="secondary" id="inc-detail-official-pdf">Ver / descargar PDF</button>':''}<button class="secondary" id="inc-detail-close">Cerrar detalle</button></div>`;
      const relationHtml=qrLinked&&relatedPlates.length?`<div class="message"><b>Vehículos relacionados (${relatedPlates.length}):</b><div>${relatedPlates.map(x=>`<span class="subtle"><b>${esc(x)}</b></span>`).join(' · ')}</div></div>`:(!qrLinked&&r.MatriculaRelacionada?`<div class="message"><b>Relacionado con:</b> ${esc(r.MatriculaRelacionada)}${r.ID_Evento?` · Evento ${esc(r.ID_Evento)}`:''}</div>`:'');
      const linkedHtml=relatedCases.length?`<div class="message"><b>${qrLinked?'Incidencias vinculadas por uso de QR':'Incidencias vinculadas'}:</b><div class="actions">${relatedCases.map(x=>`<button type="button" class="secondary inc-linked" data-id="${esc(x.ID_Incidencia)}">${esc(linkedLabel(x))}</button>`).join('')}</div></div>`:'';
      const meaningful=v=>{const x=String(v??'').trim();return x&&!['—','-','No aplica'].includes(x)};
      const identificationMethod=r.OrigenControl==='QR'?'QR':(r.Tipo==='QR no presentado'?'Matrícula · QR no presentado':'Matrícula');
      const observedIncidentPlate=r.MatriculaObservada||r.MatriculaInfraccion||r.MatriculaHabitualOrigen||r.MatriculaHabitualVehiculo||'';
      const qrAssociatedPlate=r.OrigenControl==='QR'?(r.MatriculaAutorizada||r.MatriculaRelacionada||''):'';
      const technicalItems=[
        ['Método de identificación',identificationMethod],
        ['Matrícula observada',observedIncidentPlate],
        ['Matrícula asociada al QR',qrAssociatedPlate],
        ['Causa',r.Causa||''],
        ['Situación detectada',r.EstadoOrigen||r.Situacion||''],
        ['Vehículo vinculado',linked?(r.MatriculaHabitualVehiculo||r.MatriculaHabitualOrigen||r.MatriculaAutorizada||''):''],
        ['Tipo vehículo',linked?(isMoto?'Moto':r.TipoVehiculo||r.TipoVehiculoOrigen||'Vehículo'):''],
        ['Estado actual',linked?r.EstadoVehiculo||'':''],
        ['Estado al crear',linked?r.EstadoVehiculoOrigen||'':''],
        ['Slot origen',linked&&!isMoto?r.SlotOrigen||'':''],
        ['Slot actual',linked&&!isMoto?(r.Slot||r.SlotActual||''):''],
        ['QR al crear',linked&&!isMoto?r.QREstadoOrigen||'':''],
        ['QR actual',linked&&!isMoto?r.EstadoQR||'':'']
      ].filter(([label,v])=>meaningful(v)&&!['Método de identificación','Matrícula observada','Tipo vehículo','Estado actual','Estado al crear','Estado al registrar','QR al crear','QR al registrar','QR actual','Slot actual','Situación detectada'].includes(label));
      if(r.Tipo==='Vehículo inmovilizado / posible abandono'){
        technicalItems.push(['ITV vencida',r.ITV_Vencida||'No verificado'],['Fuga / pérdida',r.FugaLiquidos||'No']);
      }
      const technicalHtml=technicalItems.length?`<details class="incident-technical"><summary>Datos técnicos <span>${technicalItems.length}</span></summary><div class="incident-technical-grid">${technicalItems.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div></details>`:'';
      const followupsHtml=(r.Seguimientos||[]).length?`<section class="incident-detail-section incident-timeline"><div class="incident-section-title"><div><span class="eyebrow">EVOLUCIÓN</span><h4>Seguimientos</h4></div><span class="count">${esc((r.Seguimientos||[]).length)}</span></div>${(r.Seguimientos||[]).map(x=>{const eventCount=eventFollowupCount(x),related=eventFollowupRelated(x),actor=x.NombreUsuario||x.Usuario||'Usuario técnico / ROOT';return `<article class="incident-followup"><div class="incident-followup-head"><div><b>Intento ${esc(x.NumeroIntento||'')}</b><span>${esc(shortDateTime(x.FechaHora))}</span></div>${canSeeActors?`<span class="incident-actor">Registrado por ${esc(actor)}</span>`:''}</div><div class="incident-followup-meta">${x.Situacion?`<div><small>Situación</small><b>${esc(x.Situacion)}</b></div>`:''}${x.MatriculaObservada?`<div><small>Matrícula observada</small><b>${esc(x.MatriculaObservada)}</b></div>`:''}${x.MatriculaAutorizada?`<div><small>Matrícula QR</small><b>${esc(x.MatriculaAutorizada)}</b></div>`:''}</div>${eventCount>1?`<div class="subtle"><b>Evento vinculado:</b> ${esc(eventCount)} incidencias en este intento</div>`:''}${related.length?`<div class="subtle"><b>Relacionadas:</b> ${esc(related.join(' · '))}</div>`:''}${x.Observacion?`<div class="incident-narrative">${esc(x.Observacion)}</div>`:''}${incidentEvidenceLinks(x,'Evidencia seguimiento')}</article>`}).join('')}</section>`:'';
      const auditHtml=canSeeActors?`<div class="incident-audit-line"><span><b>Registrada por:</b> ${esc(r.NombreUsuario||r.Usuario||'Usuario técnico / ROOT')}</span><span>${esc(shortDateTime(r.FechaHora))}</span></div>`:'';
      const resolutionHtml=r.Estado==='Cerrada'?`<section class="incident-resolution"><div class="incident-resolution-head"><div><span class="eyebrow">RESOLUCIÓN</span><h4>${esc(r.AccionCierre||'Sin actuación')}</h4></div><span class="status">Cerrada</span></div><div class="incident-resolution-meta"><div><small>Fecha y hora</small><b>${esc(shortDateTime(r.FechaCierre))}</b></div>${canSeeActors?`<div><small>Cerrada por</small><b>${esc(r.NombreUsuarioCierre||r.UsuarioCierre||'Usuario técnico / ROOT')}</b></div>`:''}</div>${r.ComentarioCierre?`<div class="incident-narrative">${esc(r.ComentarioCierre)}</div>`:''}</section>`:'';
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
/* v6 - information density: current essentials visible, full history in native disclosure */
.parking-case-v4 .parking-case-compact{gap:12px}
.parking-case-v4 .parking-case-extra{padding:11px 14px!important}
.parking-case-v4 .parking-case-extra>summary{cursor:pointer;font-size:12px;font-weight:700;color:#27594b}
.parking-case-v4 .parking-case-extra[open]>summary{margin-bottom:12px}
.parking-case-v4 .parking-case-inline-extra{border-top:1px solid #e8efeb;margin-top:12px;padding-top:12px}
.parking-case-v4 .parking-case-inline-extra .incident-primary-grid{margin-top:10px}
.parking-case-v4 .parking-case-overview{gap:8px}
</style>
        <header class="parking-case-hero">
          <div class="parking-case-hero-title"><small>${esc(appDisplayName()||'Parking Comunidad')} · EXPEDIENTE DE INCIDENCIA</small>
            <h3>${esc(r.Tipo)} · ${esc(incidentPlate(r))}</h3>
            <div class="incident-header-status"><span class="status ${r.Estado==='Cerrada'?'':'bad'}">${esc(r.Estado||'Abierta')}</span>
              <span class="incident-priority ${String(r.Prioridad||'Normal').toLowerCase()}">${esc(r.Prioridad||'Normal')}</span>
              <span>${esc(r.Intentos||1)} intento${Number(r.Intentos||1)===1?'':'s'}</span></div>
            <div class="parking-case-hero-code" title="${esc(r.ID_Incidencia||'')}">${esc(r.ID_Incidencia?'INC-'+String(r.ID_Incidencia).slice(-8).toUpperCase():'')}</div>
          </div>${topActions}
        </header>
        <div class="parking-case-inner parking-case-compact">
          <div class="parking-case-overview">
            <div><small>Vivienda</small><b>${esc(recordHousingLabel(r,h))}</b></div>
            <div><small>Fecha de registro</small><b>${esc(shortDateTime(r.FechaHora))}</b></div>
            <div><small>Vehículo</small><b>${esc(incidentPlate(r))} · ${esc(linked?r.EstadoVehiculo||'No informado':'No informado')}</b></div>
          </div>
          <div class="parking-case-columns">
            <div class="parking-case-column parking-case-main">
              <details class="parking-case-section parking-case-extra">
                <summary>Identificación y origen</summary>
                <div class="incident-primary-grid">
                  <div><small>Identificación</small><b>${esc(identificationMethod)}</b></div>
                  <div><small>Origen</small><b>${esc(r.OrigenControl||'Manual')}</b></div>
                  ${r.Situacion?`<div><small>Situación</small><b>${esc(r.Situacion)}</b></div>`:''}
                </div>
              </details>
              <section class="parking-case-section">        <section class="incident-detail-section">
          <div class="incident-section-title"><div><span class="eyebrow">REGISTRO INICIAL</span><h4>Hechos registrados</h4></div></div>
          <div class="incident-narrative">${esc(r.Descripcion||'Sin descripción.')}</div>
          ${relationHtml}${linkedHtml}
          ${r.MatriculaAutorizada&&['QR no corresponde con matrícula','Uso indebido','Acceso no autorizado'].includes(r.Tipo)&&r.OrigenControl==='QR'?`<div class="subtle"><b>Matrícula asociada al QR:</b> ${esc(r.MatriculaAutorizada)}</div>`:''}
          <div class="incident-evidence-section">
            <div class="incident-section-title compact"><h4>Evidencias iniciales</h4></div>
            <div class="incident-main-evidence">${incidentEvidenceLinks(r,'Evidencia inicial')}</div>
          </div>
        </section>
</section>
              <div class="parking-case-followups">${followupsHtml}</div>
              <div class="parking-case-resolution">${resolutionHtml}</div>
            </div>
            <aside class="parking-case-column parking-case-side">
              <section class="parking-case-section">
                <h4>Estado actual del vehículo</h4>
                <div class="incident-primary-grid">
                  <div><small>Tipo de vehículo</small><b>${esc(linked?(isMoto?'Moto':r.TipoVehiculo||r.TipoVehiculoOrigen||'No informado'):'No informado')}</b></div>
                  <div><small>Estado actual</small><b>${esc(linked?r.EstadoVehiculo||'No informado':'No informado')}</b></div>
                  ${!isMoto&&linked&&r.EstadoQR?`<div><small>QR actual</small><b>${esc(r.EstadoQR)}</b></div>`:''}
                  ${!isMoto&&linked&&(r.Slot||r.SlotActual)?`<div><small>Slot actual</small><b>${esc(r.Slot||r.SlotActual)}</b></div>`:''}
                </div>
                <details class="parking-case-extra parking-case-inline-extra">
                  <summary>Datos originales del vehículo</summary>
                  <div class="incident-primary-grid">
                    <div><small>Estado al registrar</small><b>${esc(r.EstadoVehiculoOrigen||'No informado')}</b></div>
                    ${!isMoto?`<div><small>QR al registrar</small><b>${esc(r.QREstadoOrigen||'No informado')}</b></div>`:''}
                    ${!isMoto&&r.SlotOrigen?`<div><small>Slot origen</small><b>${esc(r.SlotOrigen)}</b></div>`:''}
                    ${qrAssociatedPlate?`<div><small>Matrícula asociada al QR</small><b>${esc(qrAssociatedPlate)}</b></div>`:''}
                  </div>
                </details>
              </section>
              ${auditHtml}
              ${technicalHtml?`<section class="parking-case-section">${technicalHtml}</section>`:""}
              <div class="parking-case-score">${parkingCompliancePanel(r,rows).replace('id="incident-compliance-panel"','id="incident-compliance-detail-panel"')}</div>
            </aside>
          </div>
          <div id="incident-close-editor"></div>
        </div>
      </section>`;
      $('#inc-detail-close').onclick=()=>host.innerHTML='';const pdfBtn=$('#inc-detail-pdf');if(pdfBtn)pdfBtn.onclick=async()=>{busy(pdfBtn);try{await generateIncidentPdf(r,recordHousingLabel(r,h));toast('PDF generado.')}catch(e){toast(e.message||'No se pudo generar el PDF.',true)}finally{busy(pdfBtn,false)}};document.querySelectorAll('.inc-linked').forEach(b=>b.onclick=()=>detail(rows.find(x=>x.ID_Incidencia===b.dataset.id)));
      // parking_official_pdf_single_button_v1: download only the stored, shared final report.
      const officialPdf=$('#inc-detail-official-pdf');
      let prepareOfficialPdf=false;
      if(officialPdf)officialPdf.onclick=async()=>{
        busy(officialPdf);
        try {
          if(prepareOfficialPdf){
            await uploadIncidentCloseReports(r,recordHousingLabel(r,h));
            prepareOfficialPdf=false;
            officialPdf.textContent='Ver / descargar PDF';
            toast('PDF oficial preparado correctamente.');
          }
          const result=await call('downloadIncidentPdf',{id:r.ID_Incidencia});
          if(result?.missing){
            prepareOfficialPdf=true;
            officialPdf.textContent='Preparar PDF oficial';
            toast('Preparar PDF de cierre');
            return;
          }
          if(!result?.url)throw new Error('No se encontró el PDF oficial del expediente.');
          const anchor=document.createElement('a');
          anchor.href=result.url;
          anchor.target='_blank';
          anchor.rel='noopener noreferrer';
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        }catch(e){toast(e.message||'No se pudo preparar o abrir el PDF oficial.',true)}
        finally{busy(officialPdf,false)}
      };
      const close=$('#inc-detail-close-case');
      if(close)close.onclick=()=>{
        $('#incident-close-editor').innerHTML=`<form class="form" id="incident-close-form" style="margin-top:1rem"><div class="field"><label>Acción realizada</label><select name="AccionCierre" id="incident-close-action" required><option value="">Selecciona una acción</option>${actions.map(x=>`<option value="${esc(x)}">${esc(actionLabel(x))}</option>`).join('')}</select></div><div class="field wide"><label>Comentario de cierre</label><textarea name="ComentarioCierre" required placeholder="Qué se hizo, contacto con propietario, observaciones..."></textarea></div><div class="message wide" id="incident-action-help"></div><div class="wide actions"><button>CONFIRMAR Y CERRAR</button><button type="button" class="secondary" id="cancel-close-inc">Cancelar</button></div></form>`;
        const actionSel=$('#incident-close-action'),help=$('#incident-action-help');
        const refreshAction=()=>{const a=actionSel.value;const mismatch=r.Tipo==='QR no corresponde con matrícula';const messages={'Revocar QR':mismatch?`Se revocará el QR presentado, perteneciente a ${qrOwnerPlate}. El vehículo observado ${observedPlate} no cambia de estado.`:'El QR quedará revocado. El vehículo seguirá activo.','Renovar QR':'El QR anterior quedará invalidado y se generará uno nuevo.','Suspender vehículo':mismatch?`Se suspenderá el vehículo observado ${observedPlate}. El QR presentado de ${qrOwnerPlate} no se modifica.`:(isMoto?'La moto quedará suspendida.':'El vehículo quedará suspendido, liberará su slot y quedará sin QR asignado.'),'Dar de baja':isMoto?'La moto quedará dada de baja.':'El vehículo quedará dado de baja, liberará el slot y quedará sin QR asignado.','Mantener suspensión':mismatch?`La incidencia se cerrará manteniendo suspendido el vehículo observado ${observedPlate}.`:'La incidencia se cerrará manteniendo el vehículo suspendido.','Aviso al propietario':'Se registrará que se realizó un aviso. Esta acción no envía automáticamente un email ni una notificación.','Datos corregidos':'Se registrará que los datos fueron corregidos. Esta acción no modifica automáticamente la ficha del vehículo o vivienda.'};help.textContent=messages[a]||'La incidencia se cerrará con la acción seleccionada.'};
        const updateCompliancePreview=action=>{const panel=$('#incident-compliance-detail-panel');if(panel)panel.outerHTML=parkingCompliancePanel(r,rows,action?{action}:{}).replace('id="incident-compliance-panel"','id="incident-compliance-detail-panel"')};
        actionSel.onchange=()=>{refreshAction();updateCompliancePreview(actionSel.value)};refreshAction();
        $('#cancel-close-inc').onclick=()=>{$('#incident-close-editor').innerHTML='';updateCompliancePreview('')};
        $('#incident-close-form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target)),action=data.AccionCierre;if(!action){toast('Selecciona la acción realizada.',true);return}if(!String(data.ComentarioCierre||'').trim()){toast('El comentario de cierre es obligatorio.',true);return}const mutating=['Revocar QR','Renovar QR','Suspender vehículo','Dar de baja'].includes(action),mismatch=r.Tipo==='QR no corresponde con matrícula',effects={'Revocar QR':mismatch?`Se revocará únicamente el QR presentado de ${qrOwnerPlate}.`:'El vehículo seguirá activo y su QR quedará revocado.','Renovar QR':'Se invalidará el QR anterior y se generará uno nuevo.','Suspender vehículo':mismatch?`Se suspenderá únicamente el vehículo observado ${observedPlate}.`:(isMoto?'La moto quedará suspendida.':'El vehículo quedará suspendido, liberará su slot y quedará sin QR asignado.'),'Dar de baja':isMoto?'La moto quedará de baja.':'El vehículo quedará de baja, liberará el slot y quedará sin QR asignado.'},target=action==='Revocar QR'&&mismatch?qrOwnerPlate:observedPlate;if(mutating&&!confirm(`${actionLabel(action)}.\n\n${effects[action]||''}\n\nObjetivo: ${target}.\n\n¿Confirmar y cerrar la incidencia?`))return;const b=e.submitter;busy(b);try{await call('closeIncident',Object.assign({id:r.ID_Incidencia},data));
      toast('Incidencia cerrada. Preparando notificaciones.');
      try{
        const refreshed=await call('listIncidentsPayload');
        const closed=(refreshed.rows||[]).find(x=>x.ID_Incidencia===r.ID_Incidencia);
        if(!closed||closed.Estado!=='Cerrada')throw new Error('No se pudo recuperar el informe final.');
        await uploadIncidentCloseReports(closed,recordHousingLabel(closed,housingMap[closed.ID_Vivienda]));
        toast('Informes de cierre preparados para notificación.');
      }catch(pdfError){
        toast('Cierre guardado, pero falta preparar el PDF para email: '+(pdfError.message||pdfError),true);
      }
      invalidateClientParkingData();incidents()}catch(x){toast(x.message,true);busy(b,false)}};
      };
      host.scrollIntoView({behavior:'smooth',block:'start'});
    };
    const dossierIncidentItem=(r,closed)=>{const rel=relationCount(r),when=lastActivity(r)||r.FechaHora;return `<article class="incident-dossier-item ${closed?'is-closed':''}"><div class="incident-dossier-item-main"><div class="incident-dossier-item-title"><b>${esc(r.Tipo||'Incidencia')}</b>${r.Situacion?`<span>${esc(r.Situacion)}</span>`:''}</div><div class="incident-dossier-item-meta"><span class="incident-priority ${String(r.Prioridad||'Normal').toLowerCase()}">${esc(r.Prioridad||'Normal')}</span><span>${esc(r.Intentos||1)} intento(s)</span><span>${esc(shortDateTime(when))}</span>${rel?`<span>${rel} relacionado(s)</span>`:''}</div>${r.Descripcion?`<div class="subtle incident-dossier-description">${esc(r.Descripcion)}</div>`:''}</div><button type="button" class="secondary inc-dossier-incident" data-id="${esc(r.ID_Incidencia)}">Ver detalle</button></article>`};
    const showDossier=key=>{
      const items=rowsForDossier(key).sort((a,b)=>activityTs(b)-activityTs(a)),host=$('#incident-dossier');if(!items.length){host.innerHTML='';return}
      const current=items[0],plate=incidentPlate(current),house=incidentHouse(current),open=items.filter(r=>r.Estado!=='Cerrada'),closed=items.filter(r=>r.Estado==='Cerrada'),attempts=open.reduce((n,r)=>n+Number(r.Intentos||1),0),relations=[...new Set(items.flatMap(r=>incidentRelatedPlatesClient(r,incidentRelatedCasesClient(r,rows),incidentPlate)))],vehicleState=current.EstadoVehiculo||current.EstadoVehiculoOrigen||'';
      host.innerHTML=`<section class="card incident-dossier-detail"><div class="head"><div><div class="eyebrow">EXPEDIENTE</div><h2>${esc(plate)}</h2><div class="muted">${esc(house||'Sin vivienda asociada')}${vehicleState?` · Estado del vehículo: ${esc(vehicleState)}`:''}</div></div><button type="button" class="secondary" id="incident-dossier-close">Cerrar expediente</button></div><div class="incident-dossier-metrics"><div><b>${open.length}</b><span>Abiertas</span></div><div><b>${attempts}</b><span>Intentos abiertos</span></div><div><b>${closed.length}</b><span>Resueltas</span></div><div><b>${relations.length}</b><span>Relacionados</span></div></div>${relations.length?`<div class="message incident-dossier-relations"><b>Vehículos relacionados:</b> ${relations.map(x=>`<span>${esc(x)}</span>`).join(' · ')}</div>`:''}<div class="incident-dossier-section"><div class="incident-dossier-section-head"><h3>Incidencias abiertas</h3><span>${open.length}</span></div>${open.length?open.map(r=>dossierIncidentItem(r,false)).join(''):'<div class="empty compact-empty">No hay incidencias abiertas.</div>'}</div><div class="incident-dossier-section"><div class="incident-dossier-section-head"><h3>Histórico resuelto</h3><span>${closed.length}</span></div>${closed.length?closed.slice(0,8).map(r=>dossierIncidentItem(r,true)).join(''):'<div class="empty compact-empty">No hay incidencias resueltas.</div>'}${closed.length>8?`<div class="subtle">Se muestran las 8 más recientes de ${closed.length}.</div>`:''}</div></section>`;
      $('#incident-dossier-close').onclick=()=>host.innerHTML='';document.querySelectorAll('.inc-dossier-incident').forEach(b=>b.onclick=()=>{const target=rows.find(r=>r.ID_Incidencia===b.dataset.id);if(target)detail(target)});host.scrollIntoView({behavior:'smooth',block:'start'});
    };
    const renderSummary=()=>{const open=rows.filter(r=>r.Estado!=='Cerrada'),critical=open.filter(r=>String(r.Prioridad||'').toLowerCase()==='crítica'),vehicleKeys=new Set(open.map(incidentPlate).filter(x=>x!=='SIN MATRÍCULA')),attempts=open.reduce((n,r)=>n+Number(r.Intentos||1),0);$('#inc-stat-open').textContent=open.length;$('#inc-stat-critical').textContent=critical.length;$('#inc-stat-vehicles').textContent=vehicleKeys.size;$('#inc-stat-attempts').textContent=attempts};
    const renderDossiers=list=>{
      const grouped=new Map();list.forEach(r=>{const key=dossierKey(r);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r)});
      const groups=[...grouped.entries()].map(([key,items])=>{const all=rowsForDossier(key),openAll=all.filter(r=>r.Estado!=='Cerrada'),latest=all.slice().sort((a,b)=>activityTs(b)-activityTs(a))[0]||items[0],rank=Math.max(0,...openAll.map(r=>priorityRank(r.Prioridad)));return {key,items,all,openAll,latest,rank}}).sort((a,b)=>b.rank-a.rank||activityTs(b.latest)-activityTs(a.latest)||naturalSort(incidentPlate(a.latest),incidentPlate(b.latest)));
      const pages=Math.max(1,Math.ceil(groups.length/PAGE_SIZE));page=Math.min(page,pages);const slice=groups.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);$('#incident-count').textContent=`${groups.length} expediente${groups.length===1?'':'s'} · ${list.length} incidencia${list.length===1?'':'s'}`;
      $('#incident-dossier-list').innerHTML=slice.map(g=>{const plate=incidentPlate(g.latest),house=incidentHouse(g.latest),owner=g.latest.NombrePropietarioAlHecho||'Sin atribución verificada',attempts=g.openAll.reduce((n,r)=>n+Number(r.Intentos||1),0),relations=[...new Set(g.all.flatMap(r=>incidentRelatedPlatesClient(r,incidentRelatedCasesClient(r,rows),incidentPlate)))],openTypes=[...new Set(g.openAll.map(r=>r.Tipo+(r.Situacion?` · ${r.Situacion}`:'')))],critical=g.openAll.some(r=>priorityRank(r.Prioridad)===4),last=lastActivity(g.latest),title=groupByOwner?owner:groupByHousing?(house||'Sin vivienda identificada'):plate,subtitle=groupByOwner?`${new Set(g.all.map(r=>r.ID_Vivienda).filter(Boolean)).size} vivienda(s) vinculada(s)`:house||'Sin vivienda asociada';return `<article class="card incident-dossier-card ${critical?'has-critical':''}"><div class="incident-dossier-card-main"><div class="incident-dossier-card-title"><div><b class="incident-dossier-plate">${esc(title)}</b><span class="subtle">${esc(subtitle)}</span></div><div class="incident-dossier-status">${critical?'<span class="incident-priority crítica">Crítica</span>':''}<span class="status ${g.openAll.length?'bad':''}">${g.openAll.length} abierta${g.openAll.length===1?'':'s'}</span></div></div><div class="incident-dossier-card-metrics"><span><b>${attempts}</b> intentos</span><span><b>${relations.length}</b> relacionados</span><span>Última actividad <b>${esc(shortDateTime(last))}</b></span></div><div class="incident-dossier-tags">${openTypes.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}${openTypes.length>3?`<span>+${openTypes.length-3}</span>`:''}</div></div><div class="incident-dossier-card-action"><button type="button" class="secondary inc-open-dossier" data-key="${esc(g.key)}">Ver expediente</button></div></article>`}).join('')||'<div class="card empty">No hay expedientes que coincidan con los filtros.</div>';
      $('#incident-pager').innerHTML=pagerHtml('incident',page,groups.length);document.querySelectorAll('.inc-open-dossier').forEach(b=>b.onclick=()=>showDossier(b.dataset.key));const prev=$('#incident-prev'),next=$('#incident-next');if(prev)prev.onclick=()=>{page--;render()};if(next)next.onclick=()=>{page++;render()};
    };
    const renderList=list=>{
      const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));page=Math.min(page,pages);const slice=list.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);$('#incident-count').textContent=`Mostrando ${slice.length?((page-1)*PAGE_SIZE+1):0}–${Math.min(page*PAGE_SIZE,list.length)} de ${list.length}`;
      $('#incident-body').innerHTML=slice.map(r=>{const plate=incidentPlate(r),house=incidentHouse(r);return `<tr><td data-label="Fecha">${esc(shortDateTime(r.FechaHora))}</td><td data-label="Matrícula"><b>${esc(plate)}</b></td><td data-label="Vivienda">${esc(house)}</td><td data-label="Incidencia"><b>${esc(r.Tipo)}</b>${r.Situacion?`<div class="subtle">Situación: ${esc(r.Situacion)}</div>`:''}${r.Causa?`<div class="subtle">Causa: ${esc(r.Causa)}</div>`:''}</td><td data-label="Prioridad"><span class="incident-priority ${String(r.Prioridad||'Normal').toLowerCase()}">${esc(r.Prioridad||'Normal')}</span></td><td data-label="Intentos"><b>${esc(r.Intentos||1)}</b>${r.UltimoSeguimiento?`<span class="subtle">${esc(shortDateTime(r.UltimoSeguimiento))}</span>`:''}</td><td data-label="Estado"><span class="status ${r.Estado==='Cerrada'?'':'bad'}">${esc(r.Estado||'Abierta')}</span></td><td data-label="Acciones">${actionMenuHtml(`<button class="secondary inc-view" data-id="${esc(r.ID_Incidencia)}">Ver</button><button class="secondary inc-row-dossier" data-key="${esc(dossierKey(r))}">Expediente</button>`)}</td></tr>`}).join('');$('#incident-empty').classList.toggle('hide',!!list.length);$('#incident-pager').innerHTML=pagerHtml('incident',page,list.length);document.querySelectorAll('.inc-view').forEach(b=>b.onclick=()=>detail(rows.find(r=>r.ID_Incidencia===b.dataset.id)));document.querySelectorAll('.inc-row-dossier').forEach(b=>b.onclick=()=>showDossier(b.dataset.key));const prev=$('#incident-prev'),next=$('#incident-next');if(prev)prev.onclick=()=>{page--;render()};if(next)next.onclick=()=>{page++;render()};
    };
    const render=()=>{const list=filtered();state.cache.incidentsFiltered=list;renderSummary();const dossiers=viewMode==='dossiers';$('#incident-dossier-list').classList.toggle('hide',!dossiers);$('#incident-flat-list').classList.toggle('hide',dossiers);$('#incident-view-dossiers').classList.toggle('active',dossiers&&!groupByHousing&&!groupByOwner);$('#incident-view-housing').classList.toggle('active',dossiers&&groupByHousing);$('#incident-view-owner').classList.toggle('active',dossiers&&groupByOwner);$('#incident-view-list').classList.toggle('active',!dossiers);if(dossiers)renderDossiers(list);else renderList(list)};
    // Load historical reports from parking_weekly_reports table
    async function loadHistoricalReports() {
      try {
        const response = await call('listWeeklyReports');
        const reports = Array.isArray(response) ? response : (response?.reports || []);
        const select = $('#incident-report-history');
        if (!select) return;
        // Keep the first option (placeholder)
        select.innerHTML = '<option value="">— Informes guardados —</option>';
        for (const r of reports) {
          if (r.state === 'ready' && r.period_start && r.period_end) {
            const opt = document.createElement('option');
            opt.value = r.period_start;
            opt.dataset.periodEnd = r.period_end;
            opt.textContent = `${r.period_start} → ${r.period_end} (${r.generated_at ? new Date(r.generated_at).toLocaleDateString('es-ES') : 'sin fecha'})`;
            select.appendChild(opt);
          }
        }
      } catch (e) {
        // Una consulta iniciada en una sesión anterior no debe reabrir ni
        // contaminar la pantalla de login tras SIGNED_OUT.
        if(state.authClosing||!state.token||!$('#incident-report-history'))return;
        console.error('Failed to load historical reports:', e);
      }
    }

    // Initial load of historical reports
    if (hasUiRole('ADMIN')) loadHistoricalReports();

    const reportButton=$('#incident-weekly-report');
    if(reportButton)reportButton.onclick=async()=>{busy(reportButton);try{
      const result=await call('weeklyManualReport');
      const period = result.period || result.report?.period;
      if (period) {
        // Update date inputs with the returned period
        $('#incident-report-period').value = period.start;
        $('#incident-report-period-end').value = period.end;
        // Solo un informe realmente disponible permite descarga.
        const reportReady=result.report?.status === 'ready' || result.report?.status === 'already_ready';
        $('#incident-download-weekly-report').disabled = !reportReady;
        if(weeklyVersionButton)weeklyVersionButton.disabled = !reportReady;
        if(weeklyRegenerateButton)weeklyRegenerateButton.disabled = !reportReady;
        // Refresh historical reports list
        loadHistoricalReports();
      }
      toast(result.report?.status==='already_ready'?'Informe semanal ya generado.':'Informe semanal Excel generado. Envío en cola.');
    }catch(e){toast(e.message||'No se pudo generar el informe.',true)}
    finally{busy(reportButton,false)}};

    const historySelect=$('#incident-report-history');
    if(historySelect)historySelect.onchange=()=>{
      const opt = historySelect.options[historySelect.selectedIndex];
      if (opt && opt.value) {
        $('#incident-report-period').value = opt.value;
        $('#incident-report-period-end').value = opt.dataset.periodEnd || '';
        $('#incident-download-weekly-report').disabled = false;
        if(weeklyVersionButton)weeklyVersionButton.disabled=false;
        if(weeklyRegenerateButton)weeklyRegenerateButton.disabled=false;
        if(weeklyVersionPanel)weeklyVersionPanel.hidden=true;
      } else {
        $('#incident-download-weekly-report').disabled = true;
        if(weeklyVersionButton)weeklyVersionButton.disabled=true;
        if(weeklyRegenerateButton)weeklyRegenerateButton.disabled=true;
        if(weeklyVersionPanel)weeklyVersionPanel.hidden=true;
      }
    };


    // These operations are available only for an already saved historical week.
    const weeklyVersionButton=$('#incident-weekly-versions');
    const weeklyRegenerateButton=$('#incident-weekly-regenerate');
    const weeklyVersionsSelect=$('#incident-weekly-version-list');
    const weeklyVersionPanel=$('#incident-weekly-version-controls');
    const weeklyPeriod=()=>({period_start:$('#incident-report-period')?.value||'',
      period_end:$('#incident-report-period-end')?.value||''});
    const reloadWeeklyVersions=async()=>{
      const period=weeklyPeriod();
      if(!period.period_start||!period.period_end)return;
      const response=await call('listWeeklyReportVersions',period);
      if(!weeklyVersionsSelect||!weeklyVersionPanel)return;
      weeklyVersionsSelect.innerHTML='';
      for(const version of [{id:'original',generated_at:'',active:response.original?.active},...(response.versions||[])]){
        const option=document.createElement('option');
        option.value=version.id;
        option.textContent=(version.id==='original'?'Original':version.generated_at||version.id)+(version.active?' · ACTIVA':'');
        weeklyVersionsSelect.appendChild(option);
      }
      weeklyVersionPanel.hidden=false;
    };
    if(weeklyVersionButton)weeklyVersionButton.onclick=async()=>{
      busy(weeklyVersionButton,true);
      try{await reloadWeeklyVersions()}catch(e){toast(e.message||'No se pudieron consultar las versiones.',true)}
      finally{busy(weeklyVersionButton,false)}
    };
    if(weeklyRegenerateButton)weeklyRegenerateButton.onclick=async()=>{
      if(!confirm('Se generará una nueva versión del Excel, conservando la original. ¿Continuar?'))return;
      busy(weeklyRegenerateButton,true);
      try{
        const out=await call('regenerateWeeklyReport',weeklyPeriod());
        toast(out.status==='regenerated'?'Nueva versión generada.':'Informe sin cambios.');
        await reloadWeeklyVersions();
      }catch(e){toast(e.message||'No se pudo regenerar el Excel.',true)}
      finally{busy(weeklyRegenerateButton,false)}
    };
    const weeklyRestoreButton=$('#incident-weekly-restore');
    if(weeklyRestoreButton)weeklyRestoreButton.onclick=async()=>{
      const version_id=weeklyVersionsSelect?.value;
      if(!version_id||!confirm('Esta versión pasará a ser la activa. Se conservarán las demás. ¿Restaurar?'))return;
      busy(weeklyRestoreButton,true);
      try{
        const out=await call('restoreWeeklyReport',{...weeklyPeriod(),version_id});
        toast(out.status==='already_active'?'Esta versión ya estaba activa.':'Versión restaurada.');
        await reloadWeeklyVersions();
      }catch(e){toast(e.message||'No se pudo restaurar la versión.',true)}
      finally{busy(weeklyRestoreButton,false)}
    };

    const downloadReportButton=$('#incident-download-weekly-report');
    if(downloadReportButton)downloadReportButton.onclick=async()=>{
      const periodStart = $('#incident-report-period').value;
      const periodEnd = $('#incident-report-period-end').value;
      if (!periodStart || !periodEnd) {
        toast('Selecciona un periodo válido.', true);
        return;
      }
      try{
        const result=await call('downloadWeeklyReport',{period_start:periodStart,period_end:periodEnd});
        if(result?.url){
          const anchor=document.createElement('a');
          anchor.href=result.url;
          anchor.target='_blank';
          anchor.rel='noopener noreferrer';
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          toast('Descargando informe semanal...');
        }else{
          toast('No se encontró el informe para el periodo seleccionado.',true);
        }
      }catch(e){toast(e.message||'No se pudo descargar el informe.',true)}
    };
    $('#incidents-export-xlsx').onclick=()=>downloadXlsx(`incidencias_${new Date().toISOString().slice(0,10)}.xlsx`,state.cache.incidentsFiltered||filtered(),null,'Incidencias').catch(err);$('#incidents-export-csv').onclick=()=>downloadCsv(`incidencias_${new Date().toISOString().slice(0,10)}.csv`,state.cache.incidentsFiltered||filtered());
    $('#incident-search').value=navPreset?.search||ui.q||'';$('#incident-state').value=navPreset?.status!==undefined?navPreset.status:(ui.status===undefined?'Abierta':ui.status);$('#incident-priority').value=ui.priority||'';$('#incident-type').value=ui.type||'';$('#incident-origin').value=ui.origin||'';$('#incident-period').value=ui.period||'';$('#incident-from').value=ui.from||'';$('#incident-to').value=ui.to||'';bindPeriodVisibility('incident');
    const reset=()=>{page=1;$('#incident-dossier').innerHTML='';render()};$('#incident-search').oninput=reset;['incident-state','incident-priority','incident-type','incident-origin','incident-period','incident-from','incident-to'].forEach(id=>$("#"+id).onchange=reset);
    $('#incident-view-dossiers').onclick=()=>{groupByHousing=false;groupByOwner=false;viewMode='dossiers';page=1;$('#incident-detail').innerHTML='';render()};$('#incident-view-housing').onclick=()=>{groupByHousing=true;groupByOwner=false;viewMode='dossiers';page=1;$('#incident-detail').innerHTML='';render()};$('#incident-view-owner').onclick=()=>{groupByHousing=false;groupByOwner=true;viewMode='dossiers';page=1;$('#incident-detail').innerHTML='';render()};$('#incident-view-list').onclick=()=>{viewMode='list';page=1;$('#incident-dossier').innerHTML='';render()};
    document.querySelectorAll('.sortable-th').forEach(th=>{th.dataset.dir=th.dataset.sort===sortKey?sortDir:'';th.onclick=()=>{const k=th.dataset.sort;sortDir=sortKey===k&&sortDir==='asc'?'desc':'asc';sortKey=k;page=1;document.querySelectorAll('.sortable-th').forEach(x=>x.dataset.dir=x.dataset.sort===sortKey?sortDir:'');render()}});
    const incidentFilterToggle=$('#incident-filter-toggle');
    const incidentFilterBar=document.querySelector('.admin-incident-filters');
    if(incidentFilterToggle&&incidentFilterBar){
      incidentFilterBar.classList.add('mobile-filter-collapsed');
      incidentFilterToggle.onclick=()=>{
        const collapsed=incidentFilterBar.classList.toggle('mobile-filter-collapsed');
        incidentFilterToggle.textContent=collapsed?'Filtros':'Ocultar filtros';
      };
    }

    render();if(focusId){const target=rows.find(r=>r.ID_Incidencia===focusId);if(target){showDossier(dossierKey(target));detail(target)}}
  }catch(e){err(e)}
}

function incidentTypeFromStatus(status){const map={'MATRICULA NO REGISTRADA':'Matrícula no registrada','QR REVOCADO':'Acceso no autorizado','NO AUTORIZADO':'Acceso no autorizado','MATRICULA TEMPORAL NO VIGENTE':'Acceso no autorizado','MATRICULA HABITUAL NO VIGENTE':'Acceso no autorizado','VEHICULO DESASIGNADO':'Acceso no autorizado','VEHICULO INACTIVO':'Acceso no autorizado','VEHICULO SUSPENDIDO':'Acceso no autorizado','VEHICULO DE BAJA':'Acceso no autorizado'};return map[status]||''}
function incidentSituationFromStatus(status){const map={'MATRICULA NO REGISTRADA':'Matrícula no registrada','QR REVOCADO':'QR revocado','NO AUTORIZADO':'Otra condición de autorización','MATRICULA TEMPORAL NO VIGENTE':'Matrícula no vigente','MATRICULA HABITUAL NO VIGENTE':'Matrícula no vigente','VEHICULO DESASIGNADO':'Vehículo desasignado','VEHICULO INACTIVO':'Vehículo desasignado','VEHICULO SUSPENDIDO':'Vehículo suspendido','VEHICULO DE BAJA':'Vehículo de baja'};return map[status]||''}
function incidentSituationOptionsClient(type){const map={'Acceso no autorizado':['Vehículo suspendido','Vehículo de baja','QR revocado','Matrícula no vigente','Otra condición de autorización'],'Uso indebido':['Cesión de QR','Uso de QR ajeno'],'Vehículo inmovilizado / posible abandono':['Posible abandono','Vehículo inmovilizado','Avería prolongada'],'Estacionamiento o ubicación indebida':['Bloquea acceso / vías','Moto fuera de zona autorizada','Plaza incorrecta','Zona común'],'Fuga / pérdida de líquidos':['Aceite','Refrigerante','Combustible','Otro líquido']};return map[type]||[]}
function incidentTypesForContext(p){
  const observational=['Vehículo inmovilizado / posible abandono','Estacionamiento o ubicación indebida','Fuga / pérdida de líquidos'],v=p.vehicle||{},status=p.status||'',source=p.source||'Manual',contextual=incidentTypeFromStatus(status);
  if(source==='Manual'&&!status)return ['Otro',...observational];
  if(source==='QR'&&v.ID_Vehiculo&&v.Tipo!=='Moto'){
    const out=[];
    if(contextual)out.push(contextual);
    out.push('QR no corresponde con matrícula','Uso indebido',...observational,'Otro');
    return [...new Set(out)];
  }
  if(contextual)return [contextual];
  if(status==='AUTORIZADO'&&v.Tipo==='Moto')return observational;
  if(status==='AUTORIZADO'&&source==='MATRICULA'){
    const out=[];if(v.ID_Vehiculo&&v.QR_Estado==='Activo')out.push('QR no presentado');return [...out,...observational,'Otro'];
  }
  return [...observational,'Otro'];
}
function incidentScenarioHelp(type){const map={'Matrícula no registrada':'La matrícula consultada no existe en el sistema.','Acceso no autorizado':'Agrupa vehículo suspendido, de baja, QR revocado u otra condición que impide el acceso.','QR no presentado':'El vehículo tiene QR activo, pero fue identificado mediante búsqueda por matrícula.','QR no corresponde con matrícula':'Compara el vehículo del QR con la matrícula realmente observada. Si son de distinto propietario, el sistema crea las incidencias vinculadas que correspondan.','Uso indebido':'Si el QR es de otro propietario se crean Cesión de QR + Uso de QR ajeno. Si el vehículo observado no está autorizado, Acceso no autorizado se registra además como un evento independiente.','Vehículo inmovilizado / posible abandono':'Permite registrar ITV vencida y fuga/pérdida de líquidos como datos adicionales.','Estacionamiento o ubicación indebida':'Bloqueo de acceso/vías, moto fuera de zona, plaza incorrecta o zona común.','Fuga / pérdida de líquidos':'Puede registrarse aunque el vehículo esté autorizado y operativo.','Otro':'Última opción cuando el caso no encaja en los tipos anteriores.'};return map[type]||''}
function normalizePlateClient(v){return String(v||'').replace(/[\s-]/g,'').toUpperCase()}
function incidentForm(prefill=state.scanResult){
  const p=prefill||{},v=p.vehicle||{},origin=p.source||'Manual',status=p.status||(origin==='Manual'?'Registro manual':''),host=state.view==='control'?$('#control-body'):$('#incident-editor'),allowedTypes=incidentTypesForContext(Object.assign({},p,{source:origin,status:status})),fixedType=origin==='QR'?'':incidentTypeFromStatus(status),suggested=fixedType||allowedTypes[0]||'Otro',basePlate=p.query||p.currentPlate||v.MatriculaHabitual||'',authorizedPlate=origin==='QR'?(v.MatriculaHabitual||p.currentPlate||''):'';
  host.innerHTML=`<form class="card form incident-create-form" id="incident-form"><h2 class="wide">Registrar incidencia</h2><div class="field"><label>Matrícula observada</label><input name="MatriculaObservada" id="incident-observed-plate" value="${esc(basePlate)}" required></div><div class="field"><label>Situación detectada por Control</label><input value="${esc(status||'Registro manual')}" disabled></div><div class="field"><label>Tipo</label>${fixedType?`<input value="${esc(fixedType)}" disabled><input type="hidden" name="Tipo" id="incident-create-type" value="${esc(fixedType)}">`:`<select name="Tipo" id="incident-create-type">${allowedTypes.map(x=>`<option ${x===suggested?'selected':''}>${esc(x)}</option>`).join('')}</select>`}</div><div class="field hide" id="incident-authorized-field"><label>Matrícula asociada al QR</label><input name="MatriculaAutorizada" id="incident-authorized-plate" value="${esc(authorizedPlate)}" ${origin==='QR'?'readonly':''}></div><div class="field hide" id="incident-situation-field"><label>Situación</label><select name="Situacion" id="incident-situation"></select></div><div class="field hide" id="incident-itv-field"><label>ITV vencida</label><select name="ITV_Vencida"><option>No verificado</option><option>Sí</option><option>No</option></select></div><div class="field hide" id="incident-leak-field"><label>Fuga / pérdida de líquidos</label><select name="FugaLiquidos"><option>No</option><option>Sí</option></select></div><div class="message wide" id="incident-scenario-help"></div><div class="field wide"><label>Observación *</label><textarea name="Descripcion" required placeholder="Describe lo observado..."></textarea></div><div class="field wide"><label>Fotos / evidencias * <span class="muted">(máx. 5)</span></label><input id="photo" type="file" accept="image/*" capture="environment" multiple required><span class="subtle">Selecciona entre 1 y 5 fotografías. Se guardarán vinculadas a esta incidencia.</span><div id="incident-photo-status" class="subtle"></div></div><input type="hidden" name="Foto"><input type="hidden" name="FotosJson"><input type="hidden" name="EstadoOrigen" value="${esc(status)}"><input type="hidden" name="OrigenControl" value="${esc(origin)}"><div class="wide actions"><button type="submit">REGISTRAR INCIDENCIA</button><button type="button" class="secondary" id="cancel-inc">Cancelar</button></div></form>`;
  const typeSel=$('#incident-create-type'),authorized=$('#incident-authorized-field'),authorizedInput=$('#incident-authorized-plate'),observed=$('#incident-observed-plate'),situationBox=$('#incident-situation-field'),situationSel=$('#incident-situation'),itv=$('#incident-itv-field'),leak=$('#incident-leak-field'),help=$('#incident-scenario-help');
  const refresh=()=>{const t=typeSel.value,opts=incidentSituationOptionsClient(t),defaultSituation=t==='Acceso no autorizado'?incidentSituationFromStatus(status):'',qrPair=origin==='QR'&&['QR no corresponde con matrícula','Uso indebido'].includes(t);authorized.classList.toggle('hide',!qrPair);if(qrPair&&normalizePlateClient(observed.value)===normalizePlateClient(authorizedInput.value))observed.value='';if(origin==='QR'&&!qrPair&&!observed.value)observed.value=basePlate;situationBox.classList.toggle('hide',!opts.length);situationSel.innerHTML=opts.map(x=>`<option ${x===defaultSituation?'selected':''}>${esc(x)}</option>`).join('');itv.classList.toggle('hide',t!=='Vehículo inmovilizado / posible abandono');leak.classList.toggle('hide',t!=='Vehículo inmovilizado / posible abandono');help.textContent=incidentScenarioHelp(t)};
  if(typeSel.tagName==='SELECT')typeSel.onchange=refresh;refresh();
  $('#cancel-inc').onclick=()=>state.view==='control'?control():incidents();
  $('#photo').onchange=async e=>{const files=[...(e.target.files||[])];const status=$('#incident-photo-status');if(!files.length)return;if(files.length>5){toast('Puedes adjuntar un máximo de 5 fotografías.',true);e.target.value='';return}if(files.some(file=>file.size>12*1024*1024)){toast('Cada foto original debe pesar como máximo 12 MB.',true);e.target.value='';return}const submit=$('#incident-form button[type=submit]');busy(submit);status.textContent=`Subiendo 0/${files.length}…`;try{const urls=[];for(let i=0;i<files.length;i++){const dataUrl=await optimizedImageData(files[i]);const out=await call('uploadPhoto',{dataUrl});urls.push(out.url);status.textContent=`Subiendo ${i+1}/${files.length}…`}$('#incident-form [name=Foto]').value=urls[0]||'';$('#incident-form [name=FotosJson]').value=JSON.stringify(urls);status.textContent=`${urls.length} foto${urls.length===1?'':'s'} lista${urls.length===1?'':'s'} para registrar.`;toast(`${urls.length} foto${urls.length===1?'':'s'} subida${urls.length===1?'':'s'}.`)}catch(x){e.target.value='';$('#incident-form [name=Foto]').value='';$('#incident-form [name=FotosJson]').value='';status.textContent='';err(x)}finally{busy(submit,false)}};
  $('#incident-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;busy(b);const data=Object.fromEntries(new FormData(e.target));try{data.Fotos=JSON.parse(data.FotosJson||'[]')}catch(_){data.Fotos=[]}delete data.FotosJson;if(!data.Fotos.length){toast('Debes adjuntar al menos una fotografía antes de registrar la incidencia.',true);busy(b,false);return}data.Foto=data.Fotos[0];if(origin==='QR'&&['QR no corresponde con matrícula','Uso indebido'].includes(data.Tipo)){if(!normalizePlateClient(data.MatriculaObservada)){toast('Indica la matrícula realmente observada.',true);busy(b,false);return}if(normalizePlateClient(data.MatriculaObservada)===normalizePlateClient(data.MatriculaAutorizada)){toast('La matrícula observada debe ser distinta de la asociada al QR.',true);busy(b,false);return}}Object.assign(data,{ID_Vivienda:v.ID_Vivienda||'',ID_Vehiculo:v.ID_Vehiculo||''});try{const out=await call('saveIncident',data);if(out.mode==='BLOCKED'){toast(out.message||'Ya existe una incidencia equivalente hoy.',true);busy(b,false);return}if(out.mode==='FOLLOWUP_REQUIRED'){const refs=(out.existing||[]).map(x=>`${x.ID_Incidencia} · ${x.Tipo}${x.Situacion?' · '+x.Situacion:''}`).join('\n');if(!confirm(`Ya existe una incidencia abierta equivalente:\n\n${refs}\n\n¿Registrar el intento de hoy como seguimiento?`)){busy(b,false);return}await call('saveIncidentFollowup',Object.assign({},data,{ids:out.existingIds,Observacion:data.Descripcion}));toast('Seguimiento diario registrado.');state.scanResult=null;state.view==='control'?control():incidents(out.existingIds[0]);return}const count=(out.IDs||[]).length;const linked=(out.created||[]).map(x=>x.Tipo+(x.Situacion?` · ${x.Situacion}`:'')).join(' / ');toast(count>1?`${count} incidencias vinculadas registradas${linked?`: ${linked}`:''}.`:`Incidencia ${out.ID_Incidencia} registrada.`);state.scanResult=null;state.view==='control'?control():incidents(out.ID_Incidencia)}catch(x){toast(x.message,true);busy(b,false)}};
  host.scrollIntoView({behavior:'smooth'});
}
function fileData(file){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(file)})}
async function optimizedImageData(file){try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);if(bitmap.close)bitmap.close();return canvas.toDataURL('image/jpeg',.82)}catch(e){return fileData(file)}}
