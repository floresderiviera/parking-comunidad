'use strict';

/*
 * 6A-C1
 * Composition root ESM.
 *
 * Los módulos funcionales ParkingSupabase* siguen siendo globals
 * temporalmente. Runtime/reference/router se migrarán a imports reales
 * en el siguiente corte.
 */

const runtime =
  window.ParkingSupabaseRuntime();

const {
  sb,
  cached,
  invalidate,
  unwrap,
  normalizePlate,
  asDate,
  dataUrlBlob,
  parkingAdmin,
  appBootstrap
} = runtime;

const authApi =
  window.ParkingSupabaseAuth({
    sb,
    unwrap,
    invalidate,
    appBootstrap
  });

const {
  sessionUser
} = authApi;

const profileApi =
  window.ParkingSupabaseProfile({
    sb,
    unwrap,
    invalidate,
    appBootstrap,
    sessionUser
  });

const temporaryPeriodsApi =
  window.ParkingSupabaseTemporaryPeriods({
    sb,
    unwrap,
    invalidate,
    asDate,
    sessionUser
  });

const {
  mapPeriod
} = temporaryPeriodsApi;

const vehiclesApi =
  window.ParkingSupabaseVehicles({
    sb,
    unwrap,
    invalidate,
    cached,
    asDate,
    mapPeriod
  });

const {
  mapVehicle,
  listVehicles
} = vehiclesApi;

let listHousing;

const usersApi =
  window.ParkingSupabaseUsers({
    sb,
    unwrap,
    cached,
    listHousing:
      (...args) =>
        listHousing(...args)
  });

const {
  profilesById,
  listUsers,
  formOptions
} = usersApi;

const auditApi =
  window.ParkingSupabaseAudit({
    sb,
    unwrap,
    profilesById
  });

const {
  listAudit
} = auditApi;

const housingApi =
  window.ParkingSupabaseHousing({
    sb,
    unwrap,
    invalidate,
    cached,
    profilesById
  });

({
  listHousing
} = housingApi);

const {
  mapHousing
} = housingApi;

let joinedReferenceData;

const requestsApi =
  window.ParkingSupabaseRequests({
    sb,
    unwrap,
    invalidate,
    joinedReferenceData:
      (...args) =>
        joinedReferenceData(...args)
  });

const {
  mapRequest,
  listRequests
} = requestsApi;

const evidenceApi =
  window.ParkingSupabaseEvidence({
    sb,
    unwrap,
    dataUrlBlob,
    appBootstrap,
    sessionUser
  });

const {
  evidenceUrl,
  registerEvidence
} = evidenceApi;

const incidentsApi =
  window.ParkingSupabaseIncidents({
    sb,
    unwrap,
    invalidate,
    asDate,
    normalizePlate,
    joinedReferenceData:
      (...args) =>
        joinedReferenceData(...args),
    evidenceUrl,
    registerEvidence,
    appBootstrap
  });

const {
  buildIncidentCandidates,
  incidentObservedAccess,
  incidentAllowedActionsClient,
  resolveIncidentPlate,
  publicFollowupPlan,
  listIncidents,
  listControlOpenIncidents,
  controlOpenIncidentsFromList
} = incidentsApi;

const referenceData =
  window.ParkingSupabaseReferenceData({
    sb,
    unwrap,
    invalidate,
    cached,
    appBootstrap,
    listHousing,
    listVehicles,
    profilesById,
    listRequests,
    listIncidents,
    listAudit
  });

({
  joinedReferenceData
} = referenceData);

const controlApi =
  window.ParkingSupabaseControl({
    sb,
    unwrap,
    joinedReferenceData,
    mapVehicle,
    mapHousing,
    mapPeriod,
    normalizePlate,
    listControlOpenIncidents,
    controlOpenIncidentsFromList
  });

const dashboardApi =
  window.ParkingSupabaseDashboard({
    sb,
    unwrap,
    asDate,
    listHousing,
    listVehicles,
    listRequests,
    listIncidents
  });

const ownerApi =
  window.ParkingSupabaseOwner({
    sb,
    unwrap,
    appBootstrap,
    profilesById,
    mapHousing,
    mapVehicle,
    mapRequest,
    listIncidents
  });

const searchApi =
  window.ParkingSupabaseSearch({
    appBootstrap,
    listHousing,
    listVehicles,
    listIncidents,
    listRequests
  });

const settingsApi =
  window.ParkingSupabaseSettings({
    sb,
    unwrap,
    invalidate,
    appBootstrap,
    dataUrlBlob
  });

const systemApi =
  window.ParkingSupabaseSystem({
    sb,
    unwrap,
    sessionUser,
    parkingAdmin,
    appBootstrap,
    invalidate,
    consistencyReport:
      (...args) =>
        settingsApi
          .consistencyReport(
            ...args
          ),
    setPublicStateCache:
      runtime
        .setPublicStateCache
  });

const adminUsersApi =
  window.ParkingSupabaseAdminUsers({
    parkingAdmin,
    invalidate
  });

const adminImportApi =
  window.ParkingSupabaseAdminImport({
    listHousing,
    parkingAdmin,
    invalidate
  });

const adminDataApi =
  window.ParkingSupabaseAdminData({
    listUsers,
    formOptions,
    listHousing,
    listVehicles,
    listRequests,
    listIncidents
  });

const router =
  window.ParkingSupabaseRouter({
    runtime,
    authApi,
    profileApi,
    temporaryPeriodsApi,
    vehiclesApi,
    usersApi,
    auditApi,
    housingApi,
    requestsApi,
    evidenceApi,
    incidentsApi,
    controlApi,
    dashboardApi,
    ownerApi,
    searchApi,
    settingsApi,
    systemApi,
    adminUsersApi,
    adminImportApi,
    adminDataApi,
    referenceData
  });

window.server = router.server;

window.defaultViewForRole =
  function finalDefaultViewForRole(
    role
  ) {
    return role === 'ADMIN'
      ? 'dashboard'
      : role === 'CONTROL'
        ? 'control'
        : 'ownerHome';
  };

if (
  window
    .PARKING_PREPROD_TEST_HOOKS
) {
  window
    .__parkingPreprodTestHooks = {
      buildIncidentCandidates,
      incidentObservedAccess,
      incidentAllowedActionsClient,
      resolveIncidentPlate,
      publicFollowupPlan
    };
}

authApi.bindAuthState();

console.info(
  '[Parking Comunidad] adaptador Supabase final activo'
);

// app-init debe ejecutarse únicamente después de completar
// toda la composición Supabase.
const appInitScript = document.createElement('script');
appInitScript.src =
  new URL('../app-init.js', import.meta.url).href;
appInitScript.dataset.parkingEsmBoot = '1';
appInitScript.onerror = () => {
  console.error(
    '[Parking Comunidad] no se pudo cargar app-init.js'
  );
};
document.body.appendChild(appInitScript);
