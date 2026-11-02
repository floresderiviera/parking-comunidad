import fs from 'node:fs';
const adapter = fs.readFileSync(new URL('../../assets/js/supabase-final-adapter.js', import.meta.url), 'utf8');
const router = fs.readFileSync(new URL('../../assets/js/supabase/router.js', import.meta.url), 'utf8');
const runtime = fs.readFileSync(new URL('../../assets/js/supabase/runtime.js', import.meta.url), 'utf8');
const referenceData = fs.readFileSync(new URL('../../assets/js/supabase/reference-data.js', import.meta.url), 'utf8');
const owner = fs.readFileSync(new URL('../../assets/js/supabase/owner.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../../assets/js/supabase/search.js', import.meta.url), 'utf8');
const checks = [
  ['adapter/router integran módulo Search',
    adapter.includes('ParkingSupabaseSearch')
    && router.includes('globalSearch')],
  ['globalSearch calcula canAdmin', search.includes("const canAdmin =") && search.includes("boot.user.IsRoot") && search.includes("boot.roles.includes('ADMIN')")],
  ['viviendas solo se buscan para admin/root', search.includes('canAdmin ? listHousing() : Promise.resolve([])')],
  ['solicitudes solo se buscan para admin/root', search.includes('canAdmin ? listRequests() : Promise.resolve([])')],
  ['housingDetail tiene guard admin/root', referenceData.includes('No tienes permisos para consultar el detalle de viviendas.')],
  ['vehicleHistory tiene guard admin/root', referenceData.includes('No tienes permisos para consultar el historial completo del vehículo.')],
  ['CanSystem solo ROOT', runtime.includes('CanSystem:') && runtime.includes('!!profile.is_root')],
  ['CanConfigure ROOT o ADMIN', runtime.includes('CanConfigure:') && runtime.includes("roles.includes('ADMIN')")],
  ['adapter/router integran módulo Owner',
    adapter.includes('ParkingSupabaseOwner')
    && router.includes('ownerBundle')],
  ['ownerBundle filtra viviendas por responsable', owner.includes(".eq('responsible_user_id', ownerUserId)")],
  ['ownerBundle filtra vehiculos por viviendas propias', owner.includes(".in('dwelling_id', housingIds)")],
  ['ROOT resuelve propietario normal por email visible', owner.includes('const ownerUserId = await ownerScopeUserId();') && owner.includes(".eq('is_root', false)") && owner.includes(".ilike('email', visibleEmail)")]
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);

console.log('Role parity static tests: OK');
