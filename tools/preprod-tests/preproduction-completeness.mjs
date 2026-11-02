import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../../index.html');
const adapter = read('../../assets/js/supabase-final-adapter.js');
const entry = read('../../assets/js/supabase/entry.js');
const runtime = read('../../assets/js/supabase/runtime.js');
const referenceData = read('../../assets/js/supabase/reference-data.js');
const router = read('../../assets/js/supabase/router.js');
const backendSurface = [adapter, runtime, referenceData, router].join('\n');
const authModule = read('../../assets/js/supabase/auth.js');
const profileModule = read('../../assets/js/supabase/profile.js');
const adminUsers = read('../../assets/js/supabase/admin-users.js');
const adminImport = read('../../assets/js/supabase/admin-import.js');
const adminData = read('../../assets/js/supabase/admin-data.js');
const settings = read('../../assets/js/supabase/settings.js');
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
  ['preproducción carga módulo settings', html.includes('supabase/settings.js')],
  ['preproducción carga módulo system', html.includes('supabase/system.js')],
  ['preproducción carga módulo admin users', html.includes('supabase/admin-users.js')],
  ['preproducción carga módulo admin import', html.includes('supabase/admin-import.js')],
  ['preproducción carga módulo admin data', html.includes('supabase/admin-data.js')],
  ['preproducción carga módulo auth', html.includes('supabase/auth.js')],
  ['preproducción carga módulo profile', html.includes('supabase/profile.js')],
  ['preproducción carga runtime', html.includes('supabase/runtime.js')],
  ['preproducción carga reference data', html.includes('supabase/reference-data.js')],
  ['preproducción carga router', html.includes('supabase/router.js')],
  ['preproducción carga entry ESM',
    html.includes('type="module"')
    && html.includes('supabase/entry.js')],
  ['runtime inicializa Supabase', runtime.includes('window.supabase.createClient') && runtime.includes('window.parkingSupabase = sb')],
  ['adapter/router integran módulo control',
    adapter.includes('window.ParkingSupabaseControl({')
    && router.includes("case 'scanQr':")
    && router.includes("case 'searchPlate':")
    && router.includes("parkingControl(")],
  ['final adapter integra módulo system',
    adapter.includes('window.ParkingSupabaseSystem({')
    && router.includes("case 'systemStatus':")
    && router.includes('.systemStatus(')
    && router.includes('.systemDiagnostics(')],
  ['final adapter integra módulo settings',
    adapter.includes('window.ParkingSupabaseSettings({')
    && router.includes('.getSettings()')
    && router.includes('.saveSettings(')
    && router.includes('.uploadLogo(')
    && router.includes('.consistencyReport()')
    && router.includes('.consistencyFix(')],
  ['final adapter integra módulos auth/profile',
    adapter.includes('window.ParkingSupabaseAuth({')
    && adapter.includes('window.ParkingSupabaseProfile({')
    && router.includes('authApi.login(')
    && router.includes('.requestPasswordReset(')
    && router.includes('.completePasswordReset(')
    && router.includes('authApi.logout()')
    && router.includes('.updateProfile(')
    && router.includes('.changePassword(')
    && adapter.includes('authApi.bindAuthState()')
    && authModule.includes('sessionUser')
    && profileModule.includes('changePassword')],

  ['final adapter integra módulos admin',
    adapter.includes('window.ParkingSupabaseAdminUsers({')
    && adapter.includes('window.ParkingSupabaseAdminImport({')
    && adapter.includes('window.ParkingSupabaseAdminData({')
    && router.includes('.saveUser(')
    && router.includes('.ownerImportTemplate()')
    && router.includes('.managerData(')],

  ['owner import template implementado', router.includes("case 'ownerImportTemplate'")],
  ['owner import preview implementado', router.includes("case 'previewOwnerImport'") && admin.includes("action === 'previewOwnerImport'")],
  ['owner import apply implementado', router.includes("case 'applyOwnerImport'") && admin.includes("action === 'applyOwnerImport'")],
  ['consistency report implementado',
    router.includes("case 'consistencyReport'")
    && settings.includes("'parking_consistency_report'")
    && migration.includes('parking_consistency_report')],
  ['consistency fix implementado',
    router.includes("case 'consistencyFix'")
    && settings.includes("'parking_consistency_fix'")
    && migration.includes('parking_consistency_fix')],
  ['upload logo implementado',
    router.includes("case 'uploadLogo'")
    && settings.includes("from('parking-public')")],
  ['save settings implementado',
    router.includes("case 'saveSettings'")
    && settings.includes("from('community_settings')")
    && settings.includes(".upsert(rows")
    && settings.includes("onConflict: 'community_id,key'")],
  ['bucket público controlado por RLS', migration.includes("'parking-public'") && migration.includes('parking_public_insert_admin')],
  ['index carga composition root ESM',
    read('../../index.html').includes('supabase/entry.js')
    && entry.includes('window.server = router.server')],
  ['service role no aparece en frontend final', !backendSurface.includes('SUPABASE_SERVICE_ROLE_KEY')],
  ['ROOT no se crea como membership normal desde owner import', !admin.includes("roles: ['ROOT']")]
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
