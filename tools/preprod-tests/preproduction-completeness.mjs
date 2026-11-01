import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../../index.html');
const adapter = read('../../assets/js/supabase-final-adapter.js');
const admin = read('../../supabase/functions/parking-admin/index.ts');
const migration = read('../../supabase/migrations/20261029012300_preproduction_admin_completeness.sql');

const checks = [
  ['preproducción no carga POC adapter', !html.includes('supabase-poc-adapter.js')],
  ['preproducción carga módulo requests', html.includes('supabase/requests.js')],
  ['preproducción carga módulo temporary periods', html.includes('supabase/temporary-periods.js')],
  ['preproducción carga módulo vehicles', html.includes('supabase/vehicles.js')],
  ['preproducción carga módulo housing', html.includes('supabase/housing.js')],
  ['preproducción carga módulo users', html.includes('supabase/users.js')],
  ['preproducción carga módulo audit', html.includes('supabase/audit.js')],
  ['preproducción carga módulo evidence', html.includes('supabase/evidence.js')],
  ['preproducción carga módulo incidents', html.includes('supabase/incidents.js')],
  ['preproducción carga módulo control', html.includes('supabase/control.js')],
  ['preproducción carga módulo dashboard', html.includes('supabase/dashboard.js')],
  ['preproducción carga módulo owner', html.includes('supabase/owner.js')],
  ['preproducción carga módulo search', html.includes('supabase/search.js')],
  ['preproducción carga módulo system', html.includes('supabase/system.js')],
  ['preproducción carga final adapter', html.includes('supabase-final-adapter.js')],
  ['final adapter inicializa Supabase', adapter.includes('window.supabase.createClient') && adapter.includes('window.parkingSupabase = sb')],
  ['final adapter integra módulo control', adapter.includes('window.ParkingSupabaseControl({') && adapter.includes("case 'scanQr': return parkingControl('QR', payload.token)") && adapter.includes("case 'searchPlate': return parkingControl('MATRICULA', payload.plate)")],
  ['final adapter integra módulo system',
    adapter.includes('window.ParkingSupabaseSystem({')
    && adapter.includes("case 'systemStatus':")
    && adapter.includes('systemApi.systemStatus(payload)')
    && adapter.includes('systemApi.systemDiagnostics(payload)')],
  ['owner import template implementado', adapter.includes("case 'ownerImportTemplate'")],
  ['owner import preview implementado', adapter.includes("case 'previewOwnerImport'") && admin.includes("action === 'previewOwnerImport'")],
  ['owner import apply implementado', adapter.includes("case 'applyOwnerImport'") && admin.includes("action === 'applyOwnerImport'")],
  ['consistency report implementado', adapter.includes("case 'consistencyReport'") && migration.includes('parking_consistency_report')],
  ['consistency fix implementado', adapter.includes("case 'consistencyFix'") && migration.includes('parking_consistency_fix')],
  ['upload logo implementado', adapter.includes("case 'uploadLogo'") && adapter.includes("from('parking-public')")],
  ['bucket público controlado por RLS', migration.includes("'parking-public'") && migration.includes('parking_public_insert_admin')],
  ['index carga adaptador final', read('../../index.html').includes('supabase-final-adapter.js')],
  ['service role no aparece en frontend final', !adapter.includes('SUPABASE_SERVICE_ROLE_KEY')],
  ['ROOT no se crea como membership normal desde owner import', !admin.includes("roles: ['ROOT']")]
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
