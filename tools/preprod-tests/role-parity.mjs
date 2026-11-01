import fs from 'node:fs';
const adapter = fs.readFileSync(new URL('../../assets/js/supabase-final-adapter.js', import.meta.url), 'utf8');
const owner = fs.readFileSync(new URL('../../assets/js/supabase/owner.js', import.meta.url), 'utf8');
const search = fs.readFileSync(new URL('../../assets/js/supabase/search.js', import.meta.url), 'utf8');
const checks = [
  ['adapter integra módulo Search', adapter.includes('window.ParkingSupabaseSearch({') && adapter.includes('globalSearch')],
  ['globalSearch calcula canAdmin', search.includes("const canAdmin =") && search.includes("boot.user.IsRoot") && search.includes("boot.roles.includes('ADMIN')")],
  ['viviendas solo se buscan para admin/root', search.includes('canAdmin ? listHousing() : Promise.resolve([])')],
  ['solicitudes solo se buscan para admin/root', search.includes('canAdmin ? listRequests() : Promise.resolve([])')],
  ['housingDetail tiene guard admin/root', adapter.includes('No tienes permisos para consultar el detalle de viviendas.')],
  ['vehicleHistory tiene guard admin/root', adapter.includes('No tienes permisos para consultar el historial completo del vehículo.')],
  ['CanSystem solo ROOT', adapter.includes('CanSystem: !!profile.is_root')],
  ['CanConfigure ROOT o ADMIN', adapter.includes("CanConfigure: !!profile.is_root || roles.includes('ADMIN')")],
  ['adapter integra módulo Owner', adapter.includes('window.ParkingSupabaseOwner({') && adapter.includes('ownerBundle')],
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
