(() => {
  'use strict';

  const cfg = window.SUPABASE_CONFIG;

  if (
    !cfg?.url ||
    !cfg?.publishableKey ||
    cfg.publishableKey === 'PEGAR_AQUI_PUBLISHABLE_KEY'
  ) {
    throw new Error('Falta configurar la Publishable Key de Supabase.');
  }

  let sb = window.parkingSupabase;

  if (!sb) {
    if (!window.supabase?.createClient) {
      throw new Error('No se pudo cargar supabase-js.');
    }

    sb = window.supabase.createClient(
      cfg.url,
      cfg.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    window.parkingSupabase = sb;
  }
  const CACHE_MS = 15000;
  const cache = new Map();
  let bootstrapCache = null;
  let publicStateCache = null;
  let publicStateCachedAt = 0;

  const cached = async (key, loader, ttl = CACHE_MS) => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.value;
    const value = await loader();
    cache.set(key, { at: Date.now(), value });
    return value;
  };

  const invalidate = () => {
    cache.clear();
    bootstrapCache = null;
  };

  const unwrap = (result) => {
    if (result.error) throw result.error;
    return result.data;
  };

  const normalizePlate = (value) => String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const asDate = (value) => value ? String(value).slice(0, 10) : '';

  const dataUrlBlob = (dataUrl) => {
    const [head, encoded] = String(dataUrl || '').split(',');
    if (!head || !encoded) throw new Error('La imagen no es válida.');
    const mime = head.match(/^data:([^;]+);base64$/)?.[1] || 'image/jpeg';
    const bytes = atob(encoded);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) out[i] = bytes.charCodeAt(i);
    return { blob: new Blob([out], { type: mime }), mime };
  };

  async function sessionUser() {
    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');
    return data.user;
  }

  async function parkingAdmin(action, payload = {}) {
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (sessionError || !accessToken) throw new Error('La sesión ha caducado. Vuelve a iniciar sesión.');

    const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/parking-admin`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: window.SUPABASE_CONFIG.publishableKey,
        authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ action, payload }),
      cache: 'no-store'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'No se pudo completar la operación administrativa.');
    return body;
  }

  async function publicAppState(force = false) {
    if (!force && publicStateCache && Date.now() - publicStateCachedAt < 5000) return publicStateCache;
    try {
      const data = unwrap(await sb.rpc('parking_public_state')) || {};
      publicStateCache = data;
      publicStateCachedAt = Date.now();
      return data;
    } catch (_) {
      return { maintenance: { enabled: false, message: '' }, settings: window.INITIAL_PUBLIC_SETTINGS || {} };
    }
  }

  function perfLevel(ms) {
    if (ms > 1800) return 'slow';
    if (ms > 800) return 'warn';
    return 'good';
  }

  async function timed(label, loader) {
    const started = performance.now();
    try {
      const value = await loader();
      const ms = Math.max(1, Math.round(performance.now() - started));
      return { label, ok: true, ms, level: perfLevel(ms), value };
    } catch (error) {
      const ms = Math.max(1, Math.round(performance.now() - started));
      return { label, ok: false, ms, level: 'slow', error };
    }
  }

  async function edgeOptions(functionName) {
    const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      cache: 'no-store'
    });
    if (!response.ok && response.status !== 204) throw new Error(`${functionName}: HTTP ${response.status}`);
    return true;
  }

  async function appBootstrap(force = false) {
    if (!force && bootstrapCache) return bootstrapCache;
    const data = unwrap(await sb.rpc('app_bootstrap'));
    const profile = data.profile || {};
    const memberships = data.memberships || [];
    const roles = profile.is_root
      ? [...new Set(['ROOT', 'ADMIN', ...(data.technical_functional_roles || []).filter((role) => role !== 'ADMIN')])]
      : [...new Set(memberships.flatMap((m) => m.roles || []))];
    const settings = Object.fromEntries(Object.entries(data.settings || {}).map(([key, value]) => [key, value]));
    bootstrapCache = {
      user: {
        ID_Usuario: profile.user_id,
        Email: profile.email || '',
        Nombre: profile.name || profile.email || '',
        Rol: roles.join(','),
        Estado: profile.state || 'Activo',
        IsRoot: !!profile.is_root,
        CanConfigure: !!profile.is_root || roles.includes('ADMIN'),
        CanSystem: !!profile.is_root
      },
      roles,
      communityId: data.community_id,
      dwelling: data.dwelling,
      settings,
      provider: 'SUPABASE',
      environment: 'staging'
    };
    return bootstrapCache;
  }

  const temporaryPeriodsApi = window.ParkingSupabaseTemporaryPeriods({
    sb,
    unwrap,
    invalidate,
    asDate,
    sessionUser
  });

  const {
    mapPeriod,
    mapTemporaryPeriodLegacy,
    listTemporaryPeriods,
    saveTemporaryPeriod,
    extendTemporaryPeriod,
    deleteTemporaryPeriod
  } = temporaryPeriodsApi;

  const vehiclesApi = window.ParkingSupabaseVehicles({
    sb,
    unwrap,
    invalidate,
    cached,
    asDate,
    mapPeriod
  });

  const {
    mapVehicle,
    listVehicles,
    saveVehicle,
    renewQr,
    replaceVehicle,
    assignVehicleSlot,
    releaseVehicleSlot,
    bulkVehiclePreview,
    bulkVehicleAction
  } = vehiclesApi;

  const usersApi = window.ParkingSupabaseUsers({
    sb,
    unwrap,
    cached,
    listHousing: (...args) => listHousing(...args)
  });

  const {
    profilesById,
    listUsers,
    formOptions
  } = usersApi;

  const housingApi = window.ParkingSupabaseHousing({
    sb,
    unwrap,
    invalidate,
    cached,
    profilesById
  });

  const {
    mapHousing,
    listHousing,
    saveHousing
  } = housingApi;

  async function joinedReferenceData() {
    return cached('joinedReferenceData', async () => {
      const [housing, vehicles, profiles] = await Promise.all([
        listHousing(),
        listVehicles(),
        profilesById()
      ]);

      return {
        housing,
        vehicles,
        profiles,
        housingById: new Map(
          housing.map((row) => [row.ID_Vivienda, row])
        ),
        vehicleById: new Map(
          vehicles.map((row) => [row.ID_Vehiculo, row])
        )
      };
    });
  }

  const requestsApi = window.ParkingSupabaseRequests({
    sb,
    unwrap,
    invalidate,
    joinedReferenceData
  });

  const {
    mapRequest,
    listRequests,
    createRequest,
    resolveRequest
  } = requestsApi;

  async function evidenceUrl(path) {
    if (!path || !String(path).startsWith('storage:')) return path || '';
    const objectPath = String(path).slice('storage:'.length);
    const result = await sb.storage.from('parking-private').createSignedUrl(objectPath, 900);
    return result.error ? '' : result.data.signedUrl;
  }

  async function parkingControl(kind, rawValue) {
    let value = String(rawValue || '').trim();
    if (kind === 'QR') {
      try { value = new URL(value).searchParams.get('q') || value; } catch (_) {}
    }
    const result = unwrap(await sb.rpc('resolve_parking_control', { p_kind: kind, p_value: value }));
    const refs = await joinedReferenceData();
    const vehicle = mapVehicle(result.vehicle, result.temporaryPeriod ? [result.temporaryPeriod] : []);
    const housing = result.housing ? mapHousing(result.housing, refs.profiles.get(result.housing.responsible_user_id)) : null;
    const owner = result.housing?.responsible_user_id ? refs.profiles.get(result.housing.responsible_user_id) : null;
    const controlPlate =
      result.currentPlate ||
      (kind === 'MATRICULA'
        ? value
        : vehicle?.MatriculaHabitual || '');

    const relevantIncidents =
      await listControlOpenIncidents(
        vehicle,
        controlPlate
      );

    const openIncidents =
      controlOpenIncidentsFromList(
        vehicle,
        controlPlate,
        relevantIncidents
      );
    return {
      status: result.status,
      source: kind,
      query: kind === 'MATRICULA' ? normalizePlate(value) : '',
      vehicle,
      housing,
      owner: owner ? { Nombre: owner.name, Email: owner.email } : null,
      currentPlate: result.currentPlate || '',
      isTemporary: !!result.isTemporary,
      temporaryPeriod: mapPeriod(result.temporaryPeriod),
      longStay: result.longStay ? { FechaInicio: result.longStay.start_date, FechaFin: result.longStay.end_date } : null,
      openIncidents
    };
  }

  async function uploadPhoto(payload) {
    const boot = await appBootstrap();
    const { blob, mime } = dataUrlBlob(payload.dataUrl);
    if (blob.size > 10 * 1024 * 1024) throw new Error('La fotografía supera el máximo de 10 MB.');
    const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `${boot.communityId}/pending/${crypto.randomUUID()}.${extension}`;
    const result = await sb.storage.from('parking-private').upload(objectPath, blob, { contentType: mime, upsert: false });
    if (result.error) throw result.error;
    return { url: `storage:${objectPath}` };
  }

  async function registerEvidence(photoPath, incidentId = null, followupId = null) {
    if (!photoPath?.startsWith('storage:')) return;
    const boot = await appBootstrap();
    const user = await sessionUser();
    const row = {
      community_id: boot.communityId,
      incident_id: incidentId,
      followup_id: followupId,
      object_path: photoPath.slice('storage:'.length),
      created_by: boot.user.IsRoot ? null : user.id,
      metadata: { source: 'SUPABASE_FRONTEND' }
    };
    unwrap(await sb.from('file_objects').insert(row));
  }

  const incidentsApi = window.ParkingSupabaseIncidents({
    sb,
    unwrap,
    invalidate,
    asDate,
    normalizePlate,
    joinedReferenceData,
    evidenceUrl,
    registerEvidence,
    appBootstrap
  });

  const {
    mapFollowup,
    incidentAllowedActionsClient,
    mapIncident,
    listIncidents,
    listControlOpenIncidents,
    controlOpenIncidentsFromList,
    incidentContext,
    currentTemporaryRaw,
    resolveIncidentPlate,
    approvedLongStay,
    incidentObservedAccess,
    normalizeLegacyIncidentType,
    incidentBaseCandidate,
    validateIncidentCandidate,
    accessCandidate,
    sameIncidentOwner,
    buildIncidentCandidates,
    buildFollowupCandidates,
    publicFollowupPlan,
    saveIncident,
    previewIncidentFollowup,
    saveIncidentFollowup
  } = incidentsApi;

  async function listAudit() {
    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; offset < 20000; offset += pageSize) {
      const page = unwrap(await sb.from('audit_log').select('*').order('occurred_at', { ascending: false }).range(offset, offset + pageSize - 1)) || [];
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    const profiles = await profilesById();
    return rows.map((row) => ({
      ID_Auditoria: row.id,
      FechaHora: row.occurred_at,
      Usuario: row.actor_email || profiles.get(row.actor_user_id || row.user_id)?.email || '',
      UsuarioNombre: profiles.get(row.actor_user_id || row.user_id)?.name || row.actor_email || '',
      Accion: row.action,
      Entidad: row.entity,
      ID_Entidad: row.entity_id || row.legacy_entity_id || '',
      Campo: row.field || '',
      ValorAnterior: row.previous_value || '',
      ValorNuevo: row.new_value || '',
      Observaciones: row.observations || '',
      Origen: row.source
    }));
  }

  async function dashboard() {
    const [summary, housing, vehicles, requests, incidents, periods] = await Promise.all([
      unwrap(await sb.rpc('app_dashboard')),
      listHousing(), listVehicles(), listRequests(), listIncidents(),
      unwrap(await sb.from('temporary_periods').select('*').neq('state', 'Anulado')) || []
    ]);

    const activeHousingRows = housing.filter((h) => h.Estado === 'Activa');
    const activeHousingIds = new Set(activeHousingRows.map((h) => h.ID_Vivienda));
    const housingById = new Map(housing.map((h) => [h.ID_Vivienda, h]));
    const vehicleById = new Map(vehicles.map((v) => [v.ID_Vehiculo, v]));
    const activeVehicles = vehicles.filter((v) => v.Estado === 'Activo');
    const activeCars = activeVehicles.filter((v) => v.Tipo !== 'Moto');
    const activeMotorcycles = activeVehicles.filter((v) => v.Tipo === 'Moto').length;
    const activeSlotVehicles = activeCars.filter((v) => ['1', '2'].includes(String(v.Slot)));
    const occupiedSlots = activeSlotVehicles.filter((v) => activeHousingIds.has(v.ID_Vivienda)).length;
    const slotCapacity = activeHousingRows.length * 2;
    const openIncidents = incidents.filter((i) => i.Estado !== 'Cerrada');
    const pendingRequests = requests.filter((r) => ['Abierta', 'Pendiente'].includes(r.Estado));
    const activeWithoutQrRows = activeSlotVehicles.filter((v) => v.QR_Estado !== 'Activo');
    const qrVehicles = vehicles.filter((v) => v.Tipo !== 'Moto' && ['1', '2'].includes(String(v.Slot)));
    const revoked = qrVehicles.filter((v) => v.QR_Estado === 'Revocado').length;

    const now = Date.now();
    const cutoff = now - 30 * 86400000;
    const previousCutoff = now - 60 * 86400000;
    const timestamp = (value) => {
      const parsed = Date.parse(String(value || ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const isRecent = (value) => timestamp(value) >= cutoff;
    const isPrevious = (value) => timestamp(value) >= previousCutoff && timestamp(value) < cutoff;
    const incidents30 = incidents.filter((row) => isRecent(row.FechaHora)).length;
    const requests30 = requests.filter((row) => isRecent(row.FechaHora)).length;
    const newVehicles30 = vehicles.filter((row) => isRecent(row.CreatedAt)).length;
    const incidentsPrev30 = incidents.filter((row) => isPrevious(row.FechaHora)).length;
    const requestsPrev30 = requests.filter((row) => isPrevious(row.FechaHora)).length;
    const newVehiclesPrev30 = vehicles.filter((row) => isPrevious(row.CreatedAt)).length;

    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(now + 7 * 86400000).toISOString().slice(0, 10);
    const temporaryCurrent = periods.filter((period) => {
      const vehicle = vehicleById.get(period.vehicle_id);
      return vehicle?.Estado === 'Activo' && asDate(period.starts_at) <= today && asDate(period.ends_at) >= today;
    });
    const temporaryExpiring7Rows = temporaryCurrent.filter((period) => asDate(period.ends_at) >= today && asDate(period.ends_at) <= in7);

    const formatShortDate = (value) => {
      const date = new Date(String(value || ''));
      return Number.isNaN(date.getTime()) ? String(value || '') : new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    };
    const housingLabel = (h) => h ? `Bloque ${h.Bloque}, ${h.Planta} ${h.Apartamento}` : 'Sin vivienda';
    const attention = [];

    activeWithoutQrRows.slice(0, 3).forEach((vehicle) => {
      attention.push({
        type: 'vehicle',
        label: `${vehicle.MatriculaHabitual || 'Vehículo'} · QR no válido`,
        detail: housingLabel(housingById.get(vehicle.ID_Vivienda)),
        vehicleId: vehicle.ID_Vehiculo
      });
    });

    temporaryExpiring7Rows
      .slice()
      .sort((a, b) => String(a.ends_at).localeCompare(String(b.ends_at)))
      .slice(0, 3)
      .forEach((period) => {
        const vehicle = vehicleById.get(period.vehicle_id);
        attention.push({
          type: 'temporary',
          label: `${period.temporary_plate || 'Temporal'} · vence ${formatShortDate(period.ends_at)}`,
          detail: `${vehicle?.MatriculaHabitual || 'Vehículo'} · ${housingLabel(housingById.get(vehicle?.ID_Vivienda))}`,
          vehicleId: vehicle?.ID_Vehiculo || ''
        });
      });

    const openByHousing = new Map();
    openIncidents.forEach((incident) => {
      const vehicle = incident.ID_Vehiculo ? vehicleById.get(incident.ID_Vehiculo) : null;
      const housingId = incident.ID_Vivienda || vehicle?.ID_Vivienda || '';
      if (housingId) openByHousing.set(housingId, (openByHousing.get(housingId) || 0) + 1);
    });
    [...openByHousing.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([housingId, count]) => attention.push({
        type: 'housing',
        label: housingLabel(housingById.get(housingId)),
        detail: `${count} incidencias pendientes`,
        housingId
      }));

    const oldestRequest = pendingRequests.slice().sort((a, b) => String(a.FechaHora).localeCompare(String(b.FechaHora)))[0];
    if (oldestRequest) {
      const vehicle = vehicleById.get(oldestRequest.ID_Vehiculo);
      const requestLabel = oldestRequest.Tipo === 'REACTIVACION_VEHICULO' ? 'Activación' : oldestRequest.Tipo === 'RENOVACION_QR' ? 'Renovación QR' : 'Permanencia';
      attention.push({ type: 'request', label: `${requestLabel} · ${vehicle?.MatriculaHabitual || oldestRequest.MatriculaHabitual || 'Vehículo'}`, detail: `Abierta desde ${formatShortDate(oldestRequest.FechaHora)}`, requestId: oldestRequest.ID_Solicitud });
    }

    const oldestIncident = openIncidents.slice().sort((a, b) => String(a.FechaHora).localeCompare(String(b.FechaHora)))[0];
    if (oldestIncident) attention.push({ type: 'incident', label: `${oldestIncident.Tipo || 'Incidencia'} · ${oldestIncident.MatriculaObservada || 'Sin matrícula'}`, detail: `Pendiente desde ${formatShortDate(oldestIncident.FechaHora)}`, incidentId: oldestIncident.ID_Incidencia });

    const ageDays = (value) => {
      const valueTs = timestamp(value);
      return valueTs ? Math.floor((now - valueTs) / 86400000) : 0;
    };
    pendingRequests.filter((row) => ageDays(row.FechaHora) > 3).slice(0, 3).forEach((row) => {
      const vehicle = vehicleById.get(row.ID_Vehiculo);
      attention.push({ type: 'request', label: `Solicitud > 3 días · ${vehicle?.MatriculaHabitual || row.MatriculaHabitual || 'Vehículo'}`, detail: `Abierta ${ageDays(row.FechaHora)} días`, requestId: row.ID_Solicitud });
    });
    openIncidents.filter((row) => ageDays(row.FechaHora) > 7).slice(0, 3).forEach((row) => {
      attention.push({ type: 'incident', label: `Incidencia > 7 días · ${row.MatriculaObservada || 'Sin matrícula'}`, detail: `${row.Tipo || ''} · ${ageDays(row.FechaHora)} días`, incidentId: row.ID_Incidencia });
    });
    activeSlotVehicles.filter((vehicle) => !activeHousingIds.has(vehicle.ID_Vivienda)).slice(0, 3).forEach((vehicle) => attention.push({ type: 'vehicle', label: `${vehicle.MatriculaHabitual || 'Vehículo'} · vivienda no válida`, detail: 'Vehículo activo asociado a vivienda inactiva/inexistente', vehicleId: vehicle.ID_Vehiculo }));

    const slotSeen = new Set();
    activeSlotVehicles.forEach((vehicle) => {
      const key = `${vehicle.ID_Vivienda}|${vehicle.Slot}`;
      if (slotSeen.has(key)) attention.push({ type: 'vehicle', label: `${vehicle.MatriculaHabitual || 'Vehículo'} · slot duplicado`, detail: `Slot ${vehicle.Slot} duplicado en la vivienda`, vehicleId: vehicle.ID_Vehiculo });
      slotSeen.add(key);
    });

    return {
      activeHousing: activeHousingRows.length,
      totalHousing: housing.length,
      activeVehicles: activeVehicles.length,
      activeSlotVehicles: activeSlotVehicles.length,
      activeMotorcycles,
      suspendedVehicles: vehicles.filter((v) => v.Estado === 'Suspendido').length,
      inactiveVehicles: vehicles.filter((v) => v.Estado === 'Desasignado').length,
      lowVehicles: vehicles.filter((v) => v.Estado === 'Baja').length,
      occupiedSlots,
      availableSlots: Math.max(0, slotCapacity - occupiedSlots),
      slotCapacity,
      pendingRequests: pendingRequests.length,
      openIncidents: openIncidents.length,
      repeatOpenIncidents: openIncidents.filter((i) => Number(i.Intentos) > 1).length,
      revoked,
      activeWithoutQr: activeWithoutQrRows.length,
      temporary: temporaryCurrent.length,
      temporaryExpiring7: temporaryExpiring7Rows.length,
      incidents30,
      requests30,
      newVehicles30,
      trends: {
        incidents: { current: incidents30, previous: incidentsPrev30 },
        requests: { current: requests30, previous: requestsPrev30 },
        vehicles: { current: newVehicles30, previous: newVehiclesPrev30 }
      },
      attention: attention.slice(0, 20),
      backendSummary: summary
    };
  }

  async function ownerScopeUserId() {
    const boot = await appBootstrap();
    if (!boot.user.IsRoot) return boot.user.ID_Usuario;

    const visibleEmail = String(boot.user.Email || '').trim().toLowerCase();
    if (!visibleEmail) return '';

    const result = await sb
      .from('profiles')
      .select('user_id,email,is_root')
      .eq('is_root', false)
      .ilike('email', visibleEmail)
      .limit(1);
    const rows = unwrap(result) || [];
    return rows[0]?.user_id || '';
  }

  async function ownerBundle() {
    const boot = await appBootstrap();

    const ownerUserId =
      boot.user?.ID_Usuario ||
      boot.user?.user_id ||
      boot.user?.id ||
      '';

    if (!ownerUserId) {
      return {
        housing: [],
        vehicles: [],
        requests: [],
        incidents: []
      };
    }

    const [profileMap, housingRows] = await Promise.all([
      profilesById(),
      unwrap(
        await sb
          .from('dwellings')
          .select('*')
          .eq('responsible_user_id', ownerUserId)
          .order('block')
          .order('floor')
          .order('apartment')
      ) || []
    ]);

    const housing = housingRows.map((row) =>
      mapHousing(
        row,
        profileMap.get(row.responsible_user_id)
      )
    );

    const housingIds = housingRows
      .map((row) => row.id)
      .filter(Boolean);

    if (!housingIds.length) {
      return {
        housing,
        vehicles: [],
        requests: [],
        incidents: []
      };
    }

    const [vehicleRows, periods, requestRows] =
      await Promise.all([
        unwrap(
          await sb
            .from('vehicles')
            .select('*')
            .in('dwelling_id', housingIds)
            .order('habitual_plate')
        ) || [],

        unwrap(
          await sb
            .from('temporary_periods')
            .select('*')
            .in(
              'vehicle_id',
              (
                unwrap(
                  await sb
                    .from('vehicles')
                    .select('id')
                    .in('dwelling_id', housingIds)
                ) || []
              ).map((row) => row.id)
            )
            .order('starts_at')
        ) || [],

        unwrap(
          await sb
            .from('requests')
            .select('*')
            .in('dwelling_id', housingIds)
            .order('requested_at', { ascending: false })
        ) || []
      ]);

    const vehicles = vehicleRows.map((row) =>
      mapVehicle(row, periods)
    );

    const refs = {
      housing,
      vehicles,
      profiles: profileMap,
      housingById: new Map(
        housing.map((row) => [
          row.ID_Vivienda,
          row
        ])
      ),
      vehicleById: new Map(
        vehicles.map((row) => [
          row.ID_Vehiculo,
          row
        ])
      )
    };

    const requests = requestRows.map((row) =>
      mapRequest(row, refs)
    );

    const vehicleIds = new Set(
      vehicles
        .map((row) => row.ID_Vehiculo)
        .filter(Boolean)
    );

    const allIncidents = await listIncidents();

    const incidents = allIncidents.filter(
      (row) =>
        housingIds.includes(row.ID_Vivienda) ||
        vehicleIds.has(row.ID_Vehiculo)
    );

    return {
      housing,
      vehicles,
      requests,
      incidents
    };
  }

  async function globalSearch(payload) {
    const query = String(payload.q || '').trim().toLowerCase();
    const boot = await appBootstrap();
    const canAdmin = boot.user.IsRoot || boot.roles.includes('ADMIN');
    const [housing, vehicles, incidents, requests] = await Promise.all([
      canAdmin ? listHousing() : Promise.resolve([]),
      listVehicles(),
      listIncidents(),
      canAdmin ? listRequests() : Promise.resolve([])
    ]);
    const rows = [];
    if (canAdmin) housing.filter((h) => Object.values(h).join(' ').toLowerCase().includes(query)).slice(0, 8).forEach((h) => rows.push({ type: 'Vivienda', title: h.Vivienda, detail: h.Responsable, view: 'housingDetail', id: h.ID_Vivienda }));
    vehicles.filter((v) => Object.values(v).join(' ').toLowerCase().includes(query)).slice(0, 8).forEach((v) => rows.push({ type: 'Vehículo', title: v.MatriculaHabitual, detail: `${v.Marca} ${v.Modelo}`.trim(), view: 'vehicleDetail', id: v.ID_Vehiculo, search: v.MatriculaHabitual }));
    incidents.filter((i) => Object.values(i).join(' ').toLowerCase().includes(query)).slice(0, 8).forEach((i) => rows.push({ type: 'Incidencia', title: i.Tipo, detail: i.MatriculaObservada, view: 'incidents', id: i.ID_Incidencia }));
    if (canAdmin) requests.filter((r) => Object.values(r).join(' ').toLowerCase().includes(query)).slice(0, 8).forEach((r) => rows.push({ type: 'Solicitud', title: r.Tipo, detail: r.MatriculaHabitual, view: 'requests', id: r.ID_Solicitud }));
    return rows.slice(0, 20);
  }

  async function ownerImportTemplate() {
    const rows = await listHousing();
    const sorted = rows.slice().sort((a, b) => String(a.Vivienda || '').localeCompare(String(b.Vivienda || ''), 'es', { numeric: true, sensitivity: 'base' }));
    if (!sorted.length) return [{ Vivienda: 'Bloque 1, 1º A', Propietario: '', Email: '' }];
    return sorted.map((row) => ({ Vivienda: row.Vivienda, Propietario: row.Propietario || '', Email: row.Responsable || '' }));
  }

  async function uploadLogo(payload) {
    const boot = await appBootstrap();
    const { blob, mime } = dataUrlBlob(payload.dataUrl);
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(mime)) throw new Error('El archivo de logo no es una imagen válida. Usa PNG, JPG, WEBP o GIF.');
    if (blob.size > 3 * 1024 * 1024) throw new Error('El logo no puede superar 3 MB una vez optimizado.');
    const normalizedMime = mime.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mime.toLowerCase();
    const extension = normalizedMime === 'image/jpeg' ? 'jpg' : normalizedMime.split('/')[1];
    const objectPath = `${boot.communityId}/logos/logo-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const uploaded = await sb.storage.from('parking-public').upload(objectPath, blob, {
      cacheControl: '3600',
      contentType: normalizedMime,
      upsert: false
    });
    if (uploaded.error) throw uploaded.error;
    const publicUrl = sb.storage.from('parking-public').getPublicUrl(objectPath).data.publicUrl;
    return { id: objectPath, url: publicUrl, name: objectPath.split('/').pop() || 'logo' };
  }

  async function consistencyReport() {
    return unwrap(await sb.rpc('parking_consistency_report'));
  }

  async function consistencyFix(payload) {
    const result = unwrap(await sb.rpc('parking_consistency_fix', {
      p_code: payload.code,
      p_vehicle_id: payload.vehicleId
    }));
    invalidate();
    return result;
  }

  let systemStatusCache = null;
  let systemStatusCachedAt = 0;
  const SYSTEM_STATUS_TTL_MS = 45000;

  async function action(name, payload = {}) {
    if (name !== 'bootstrap' && !name.startsWith('system')) {
      const publicState = await publicAppState();
      if (publicState?.maintenance?.enabled) {
        const boot = await appBootstrap();
        if (!boot.user.IsRoot) throw new Error(publicState.maintenance.message || 'Sistema temporalmente en mantenimiento.');
      }
    }
    switch (name) {
      case 'bootstrap': return appBootstrap();
      case 'dashboard': return dashboard();
      case 'listUsers': return listUsers();
      case 'listHousing': return listHousing();
      case 'listVehicles': return listVehicles();
      case 'formOptions': return formOptions();
      case 'listRequests': return listRequests();
      case 'listIncidents':
      case 'listIncidentsPayload': return { rows: await listIncidents() };
      case 'listAudit': return listAudit();
      case 'ownerBundle': return ownerBundle();
      case 'scanQr': return parkingControl('QR', payload.token);
      case 'searchPlate': return parkingControl('MATRICULA', payload.plate);
      case 'uploadPhoto': return uploadPhoto(payload);
      case 'saveIncident': return saveIncident(payload);
      case 'saveIncidentFollowup': return saveIncidentFollowup(payload);
      case 'previewIncidentFollowup': return previewIncidentFollowup(payload);
      case 'closeIncident': {
        const data = unwrap(await sb.rpc('close_parking_incident', { p_incident_id: payload.id, p_action: payload.AccionCierre, p_comment: payload.ComentarioCierre }));
        invalidate(); return data;
      }
      case 'saveVehicle': return saveVehicle(payload);
      case 'saveHousing': return saveHousing(payload);

      case 'listTemporaryPeriods':
        return listTemporaryPeriods(payload);

      case 'saveTemporaryPeriod':
        return saveTemporaryPeriod(payload);

      case 'extendTemporaryPeriod':
        return extendTemporaryPeriod(payload);

      case 'deleteTemporaryPeriod':
        return deleteTemporaryPeriod(payload);

      case 'assignVehicleSlot':
        return assignVehicleSlot(payload);

      case 'releaseVehicleSlot':
        return releaseVehicleSlot(payload);

      case 'bulkVehiclePreview':
        return bulkVehiclePreview(payload);

      case 'bulkVehicleAction':
        return bulkVehicleAction(payload);

      case 'renewQr': return renewQr(payload);
      case 'replaceVehicle': return replaceVehicle(payload);
      case 'createRequest': return createRequest(payload);
      case 'resolveRequest': return resolveRequest(payload);
      case 'getSettings': return (await appBootstrap()).settings;
      case 'saveSettings': return saveSettings(payload);
      case 'ownerImportTemplate': return ownerImportTemplate();
      case 'previewOwnerImport': return parkingAdmin('previewOwnerImport', payload);
      case 'applyOwnerImport': {
        const data = await parkingAdmin('applyOwnerImport', payload);
        invalidate();
        return data;
      }
      case 'consistencyReport': return consistencyReport();
      case 'consistencyFix': return consistencyFix(payload);
      case 'uploadLogo': return uploadLogo(payload);
      case 'globalSearch': return globalSearch(payload);
      case 'housingDetail': {
        const boot = await appBootstrap();
        if (!boot.user.IsRoot && !boot.roles.includes('ADMIN')) throw new Error('No tienes permisos para consultar el detalle de viviendas.');
        const [refs, requests, incidents] = await Promise.all([joinedReferenceData(), listRequests(), listIncidents()]);
        const housing = refs.housingById.get(payload.id);
        return { housing, owner: housing ? refs.profiles.get(housing.ResponsableUserId) : null, vehicles: refs.vehicles.filter((v) => v.ID_Vivienda === payload.id), requests: requests.filter((r) => r.ID_Vivienda === payload.id), incidents: incidents.filter((i) => i.ID_Vivienda === payload.id) };
      }
      case 'vehicleHistory': {
        const boot = await appBootstrap();
        if (!boot.user.IsRoot && !boot.roles.includes('ADMIN')) throw new Error('No tienes permisos para consultar el historial completo del vehículo.');
        const refs = await joinedReferenceData();
        const vehicle = refs.vehicleById.get(payload.id);
        const audits = (await listAudit()).filter((row) => row.ID_Entidad === payload.id);
        return { vehicle, events: audits.map((row) => ({ type: row.Accion, title: row.Entidad, date: row.FechaHora, user: row.UsuarioNombre, detail: row.Observaciones })) };
      }
      case 'saveUser': {
        const data = await parkingAdmin('saveUser', {
          ...payload,
          AccessRedirectTo:
            location.origin +
            location.pathname +
            '?resetPassword=1'
        });
        invalidate();
        return data;
      }
      case 'adminGenerateTemporaryPassword':
        return parkingAdmin('generateTemporaryPassword', {
          id: payload.id || payload.ID_Usuario
        });
      case 'adminSendPasswordReset':
        return parkingAdmin('sendPasswordReset', {
          id: payload.id || payload.ID_Usuario,
          redirectTo:
            location.origin +
            location.pathname +
            '?resetPassword=1'
        });
      case 'closeUserSessions':
        return parkingAdmin('closeSessions', { id: payload.id || payload.ID_Usuario });
      case 'updateProfile': {
        const user = await sessionUser();
        unwrap(await sb.from('profiles').update({ name: String(payload.Nombre || '').trim() }).eq('user_id', user.id));
        invalidate(); return appBootstrap(true);
      }
      case 'changePassword': {
        const boot = await appBootstrap();
        if (boot.user.IsRoot) throw new Error('La contraseña técnica ROOT se gestiona mediante el procedimiento seguro de administración.');
        const currentPassword = String(payload.currentPassword || payload.PasswordActual || '');
        const newPassword = String(payload.newPassword || payload.password || payload.PasswordNueva || '');
        if (!currentPassword) throw new Error('Introduce tu contraseña actual.');
        if (newPassword.length < 8 || !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(newPassword) || !/\d/.test(newPassword)) {
          throw new Error('La contraseña nueva debe tener al menos 8 caracteres, una letra y un número.');
        }
        const reauth = await sb.auth.signInWithPassword({ email: boot.user.Email, password: currentPassword });
        if (reauth.error || !reauth.data.session) throw new Error('La contraseña actual no es correcta.');
        unwrap(await sb.auth.updateUser({ password: newPassword }));
        return true;
      }
      case 'systemStatus': {
        const force = !!payload.force;
        if (!force && systemStatusCache && Date.now() - systemStatusCachedAt < SYSTEM_STATUS_TTL_MS) {
          return { ...systemStatusCache, cached: true };
        }

        const overallStarted = performance.now();
        const [database, auth, rls, adminEdge, legacyEdge] = await Promise.all([
          timed('Base de datos', async () => unwrap(await sb.rpc('root_system_status'))),
          timed('Supabase Auth', async () => {
            const user = await sessionUser();
            if (!user?.id) throw new Error('La sesión de Supabase Auth no pudo verificarse.');
            return user;
          }),
          timed('RLS / bootstrap', async () => {
            const boot = await appBootstrap(true);
            if (!boot.user.IsRoot) throw new Error('ROOT no verificado por las políticas de acceso.');
            return boot;
          }),
          timed('parking-admin', async () => parkingAdmin('systemPing', {})),
          timed('legacy-auth-migrate', async () => edgeOptions('legacy-auth-migrate'))
        ]);
        if (!database.ok) throw database.error;
        const status = database.value || {};
        const services = [
          { label: 'Base de datos', ok: database.ok, detail: database.ok ? 'PostgreSQL / Supabase disponible' : String(database.error?.message || 'No disponible'), ms: database.ms, level: database.level },
          { label: 'Supabase Auth', ok: auth.ok, detail: auth.ok ? 'Sesión autenticada válida' : String(auth.error?.message || 'No disponible'), ms: auth.ms, level: auth.level },
          { label: 'RLS / bootstrap', ok: rls.ok, detail: rls.ok ? 'Permisos ROOT y bootstrap verificados' : String(rls.error?.message || 'No disponible'), ms: rls.ms, level: rls.level },
          { label: 'Edge · parking-admin', ok: adminEdge.ok, detail: adminEdge.ok ? 'Función autenticada disponible' : String(adminEdge.error?.message || 'No disponible'), ms: adminEdge.ms, level: adminEdge.level },
          { label: 'Edge · legacy-auth-migrate', ok: legacyEdge.ok, detail: legacyEdge.ok ? 'Endpoint disponible' : String(legacyEdge.error?.message || 'No disponible'), ms: legacyEdge.ms, level: legacyEdge.level }
        ];
        const totalMs = Math.max(1, Math.round(performance.now() - overallStarted));
        const result = {
          ok: services.every((item) => item.ok),
          backendVersion: status.backendVersion || 'Supabase migration 129',
          schemaVersion: status.schemaVersion || '20261029012900',
          environment: location.pathname.includes('/preproduccion/')?'PREPRODUCCIÓN':'PRODUCCIÓN',
          hosting: 'GitHub Pages',
          repository: 'floresderiviera/parking-comunidad',
          timeZone: 'Europe/Madrid',
          checkedAt: status.checkedAt || new Date().toISOString(),
          services,
          performance: { totalMs },
          counts: status,
          maintenance: status.maintenance || { enabled: false, message: '' },
          integrations: status.integrations || {}
        };

        systemStatusCache = result;
        systemStatusCachedAt = Date.now();
        return result;
      }
      case 'systemSetMaintenance': {
        const result = unwrap(await sb.rpc('parking_set_maintenance', {
          p_enabled: !!payload.enabled,
          p_message: String(payload.message || '')
        }));
        publicStateCache = result;
        publicStateCachedAt = Date.now();
        invalidate();
        systemStatusCache = null;
        systemStatusCachedAt = 0;
        return result;
      }
      case 'systemLegacyBridgeStatus': return parkingAdmin('legacyBridgeStatus', {});
      case 'systemLegacyBridgeAction': return parkingAdmin('legacyBridgeCommand', { domain: payload.domain, command: payload.command, args: payload.args || {} });
      case 'systemLegacyBridgeCommandStatus': return parkingAdmin('legacyBridgeCommandStatus', { id: payload.id });

      case 'systemBackupStatus':
        return parkingAdmin('legacyBackupStatus', {});

      case 'systemBackupRunNow':
        return parkingAdmin('legacyBackupRunNow', {});
      case 'systemRoundTripPing': {
        const ping = await timed('Ping', async () => unwrap(await sb.rpc('parking_system_ping')));
        if (!ping.ok) throw ping.error;
        return { serverMs: ping.ms, checkedAt: ping.value?.checkedAt || new Date().toISOString() };
      }
      case 'systemDiagnostics': {
        const mode = String(payload.mode || 'quick');
        const started = performance.now();
        const tests = [];
        const database = await timed('Base de datos', async () => unwrap(await sb.rpc('root_system_diagnostics')));
        tests.push({ label: database.label, detail: database.ok ? `Esquema ${database.value?.schemaVersion || 'Supabase'}` : String(database.error?.message || 'Error'), ok: database.ok, ms: database.ms, level: database.level });
        const auth = await timed('Supabase Auth', async () => {
          const user = await sessionUser();
          if (!user?.id) throw new Error('Sesión no válida');
          return user;
        });
        tests.push({ label: auth.label, detail: auth.ok ? 'Sesión autenticada válida' : String(auth.error?.message || 'Error'), ok: auth.ok, ms: auth.ms, level: auth.level });

        const rls = await timed('RLS / bootstrap', async () => {
          const boot = await appBootstrap(true);
          if (!boot.user.IsRoot) throw new Error('ROOT no verificado');
          return boot;
        });
        tests.push({ label: rls.label, detail: rls.ok ? 'Permisos ROOT y bootstrap correctos' : String(rls.error?.message || 'Error'), ok: rls.ok, ms: rls.ms, level: rls.level });
        const admin = await timed('Edge · parking-admin', async () => parkingAdmin('systemPing', {}));
        tests.push({ label: admin.label, detail: admin.ok ? 'Disponible' : String(admin.error?.message || 'Error'), ok: admin.ok, ms: admin.ms, level: admin.level });
        const legacy = await timed('Edge · legacy-auth-migrate', async () => edgeOptions('legacy-auth-migrate'));
        tests.push({ label: legacy.label, detail: legacy.ok ? 'Endpoint disponible' : String(legacy.error?.message || 'Error'), ok: legacy.ok, ms: legacy.ms, level: legacy.level });
        if (mode === 'full') {
          const consistency = await timed('Consistencia', async () => consistencyReport());
          const issues = consistency.ok ? Number(consistency.value?.errors || 0) + Number(consistency.value?.warnings || 0) : null;
          tests.push({ label: consistency.label, detail: consistency.ok ? `${issues ?? 0} observaciones detectadas` : String(consistency.error?.message || 'Error'), ok: consistency.ok, ms: consistency.ms, level: consistency.level });
        }
        const totalMs = Math.max(1, Math.round(performance.now() - started));
        const ok = tests.every((test) => test.ok);
        return { checkedAt: new Date().toISOString(), totalMs, level: ok ? perfLevel(totalMs) : 'slow', tests };
      }
      case 'systemPerformanceHistory': return { health: [], history: [] };
      case 'systemRecordClientPerformance': return { ok: true };
      case 'systemSheetsRealBenchmark': throw new Error('Google Sheets ya no es el backend de la aplicación. Las integraciones heredadas de correo y documentos se controlan por separado.');
      case 'managerData': {
        const kind = payload?.kind;

        if (kind === 'users') {
          const [rows, options] = await Promise.all([
            listUsers(),
            formOptions()
          ]);
          return { rows, options };
        }

        if (kind === 'housing') {
          const [rows, options] = await Promise.all([
            listHousing(),
            formOptions()
          ]);
          return { rows, options };
        }

        if (kind === 'vehicles') {
          const [rows, options, requests, incidents] = await Promise.all([
            listVehicles(),
            formOptions(),
            listRequests(),
            listIncidents()
          ]);

          return {
            rows,
            options,
            requests,
            incidents,
            requestStats: {}
          };
        }

        throw new Error(`managerData no soporta el tipo "${kind || ''}".`);
      }

      default:
        throw new Error(`Acción Supabase no soportada: "${name}".`);
    }
  }

  async function login(email, password) {
    const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/legacy-auth-migrate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: window.SUPABASE_CONFIG.publishableKey },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.session?.access_token || !body.session?.refresh_token) {
      throw new Error(body.error || 'Credenciales no válidas.');
    }
    unwrap(await sb.auth.setSession({ access_token: body.session.access_token, refresh_token: body.session.refresh_token }));
    const boot = await appBootstrap(true);
    if (boot.user.IsRoot) await sb.rpc('record_root_session_event', { p_action: 'LOGIN' });
    return { token: body.session.access_token, user: boot.user, migrated: !!body.migrated };
  }

  server = async function finalSupabaseServer(fn, ...args) {
    if (fn === 'loginWithPassword') return login(args[0], args[1]);

    if (fn === 'requestPasswordReset') {
      const email = String(args[0] || '').trim().toLowerCase();

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('Introduce un email válido.');
      }

      const redirectTo = location.origin + location.pathname + '?resetPassword=1';

      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        throw new Error('No se pudo solicitar el restablecimiento. Inténtalo de nuevo.');
      }

      return { ok: true };
    }

    if (fn === 'completePasswordReset') {
      const password = String(args[0] || '');

      if (
        password.length < 8 ||
        !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) ||
        !/\d/.test(password)
      ) {
        throw new Error('La contraseña debe tener al menos 8 caracteres, una letra y un número.');
      }

      const session = await sb.auth.getSession();

      if (session.error || !session.data.session) {
        throw new Error('El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.');
      }

      const updated = await sb.auth.updateUser({ password });

      if (updated.error) {
        throw new Error(updated.error.message || 'No se pudo actualizar la contraseña.');
      }

      return { ok: true };
    }

    if (fn === 'logout') {
      try {
        const boot = await appBootstrap();
        if (boot.user.IsRoot) await sb.rpc('record_root_session_event', { p_action: 'LOGOUT' });
      } catch (_) {}
      invalidate();
      unwrap(await sb.auth.signOut());
      return true;
    }
    if (fn === 'getPublicParkingSettings') {
      try { return unwrap(await sb.rpc('parking_public_settings')) || window.INITIAL_PUBLIC_SETTINGS || {}; } catch (_) { return window.INITIAL_PUBLIC_SETTINGS || {}; }
    }
    if (fn === 'getPublicAppState') return publicAppState(true);
    if (fn === 'api') return action(args[1], args[2] || {});
    throw new Error(`Operación de backend no soportada: "${fn}".`);
  };

  // Restore the stable landing views after adapter initialization.
  defaultViewForRole = function finalDefaultViewForRole(role) {
    return role === 'ADMIN' ? 'dashboard' : role === 'CONTROL' ? 'control' : 'ownerHome';
  };

  if (window.PARKING_PREPROD_TEST_HOOKS) {
    window.__parkingPreprodTestHooks = {
      buildIncidentCandidates,
      incidentObservedAccess,
      incidentAllowedActionsClient,
      resolveIncidentPlate,
      publicFollowupPlan
    };
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) localStorage.setItem('parking_token', session.access_token);
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('parking_token');
      invalidate();
    }
  });

  console.info('[Parking Comunidad] adaptador Supabase final activo');
})();
