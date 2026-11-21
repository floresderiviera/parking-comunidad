import fs from 'node:fs';

const read = p => fs.readFileSync(p,'utf8');
const incidents = read('assets/js/supabase/incidents.js');
const admin = read('assets/js/admin/incidents.js');

const ok = (cond,msg) => {
  if(!cond){
    console.error('FAIL',msg);
    process.exitCode=1;
  } else {
    console.log('OK  ',msg);
  }
};

ok(incidents.includes("function mapFollowup(row, refs = null"),'followup actor mapping optional');
ok(incidents.includes("mapFollowup(row, null)"),'CONTROL followups strip actor data');
ok(incidents.includes("false\\n      )") || incidents.includes("false\n      )"),'CONTROL incidents strip actor data');

ok(admin.includes("const canSeeActors=hasUiRole('ADMIN')"),'UI actor visibility restricted to ADMIN active role');
ok(
  admin.includes('canSeeActors?`<span class="incident-actor">Registrado por ${esc(actor)}</span>`:\'\''),
  'followup actor visible only to ADMIN'
);
ok(admin.includes("actor=x.NombreUsuario||x.Usuario||'Usuario técnico / ROOT'"),'ROOT null followup actor fallback');
ok(admin.includes("incident-technical-grid") && admin.includes("Método de identificación"),'ADMIN identification method visible');
ok(admin.includes("const auditHtml=canSeeActors?"),'incident creator conditional');
ok(admin.includes("const resolutionHtml=r.Estado==='Cerrada'?") && admin.includes("canSeeActors?`<div><small>Cerrada por"),'closer conditional');

const pdfStart=admin.indexOf("async function generateIncidentPdf");
const pdfEnd=admin.indexOf("async function incidents(",pdfStart);
ok(pdfStart>=0,'PDF generator found');
ok(pdfEnd>pdfStart,'PDF generator boundary found');
const pdf=admin.slice(pdfStart,pdfEnd);

ok(pdf.includes("heading('Hechos registrados'"),'PDF includes facts section');
ok(pdf.includes("TRAZABILIDAD DEL EXPEDIENTE") && pdf.includes("traceRows"),'PDF includes traceability');
ok(!pdf.includes('NombreUsuario'), 'PDF excludes internal creator names');
ok(!pdf.includes('UsuarioCierre'), 'PDF excludes internal closer names');
ok(!pdf.includes('Norma o criterio'), 'PDF excludes rule placeholder');
ok(!pdf.includes('Penalización'), 'PDF excludes duplicated penalty block');
ok(!pdf.includes('Observaciones'), 'PDF excludes redundant observations section');

if(process.exitCode) process.exit(process.exitCode);
console.log('Incident audit visibility/PDF: OK');
