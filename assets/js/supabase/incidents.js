(() => {
  'use strict';

  window.ParkingSupabaseIncidents = ({
    sb,
    unwrap,
    invalidate,
    asDate,
    normalizePlate,
    joinedReferenceData,
    evidenceUrl,
    registerEvidence,
    appBootstrap
  }) => {
    if (
      !sb ||
      !unwrap ||
      !invalidate ||
      !asDate ||
      !normalizePlate ||
      !joinedReferenceData ||
      !evidenceUrl ||
      !registerEvidence ||
      !appBootstrap
    ) {
      throw new Error('ParkingSupabaseIncidents: faltan dependencias.');
    }

    const INCIDENT_TYPES = [
      'Matrícula no registrada',
      'Acceso no autorizado',
      'QR no presentado',
      'QR no corresponde con matrícula',
      'Uso indebido',
      'Vehículo inmovilizado / posible abandono',
      'Estacionamiento o ubicación indebida',
      'Fuga / pérdida de líquidos',
      'Otro'
    ];

    const madridDay = () => new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const incidentDerivedFromStatus = (status, source, vehicle) => {
      const map = {
        'MATRICULA NO REGISTRADA': {
          type: 'Matrícula no registrada',
          situation: 'Matrícula no registrada',
          cause: ''
        },
        'VEHICULO DESASIGNADO': {
          type: 'Acceso no autorizado',
          situation: 'Vehículo desasignado',
          cause: 'Vehículo desasignado'
        },
        'VEHICULO INACTIVO': {
          type: 'Acceso no autorizado',
          situation: 'Vehículo desasignado',
          cause: 'Vehículo desasignado'
        },
        'VEHICULO SUSPENDIDO': {
          type: 'Acceso no autorizado',
          situation: 'Vehículo suspendido',
          cause: 'Vehículo suspendido'
        },
        'VEHICULO DE BAJA': {
          type: 'Acceso no autorizado',
          situation: 'Vehículo de baja',
          cause: 'Vehículo de baja'
        },
        'QR REVOCADO': {
          type: 'Acceso no autorizado',
          situation: 'QR revocado',
          cause: 'QR revocado'
        },
        'MATRICULA TEMPORAL NO VIGENTE': {
          type: 'Acceso no autorizado',
          situation: 'Matrícula no vigente',
          cause: 'Matrícula temporal no vigente'
        },
        'MATRICULA HABITUAL NO VIGENTE': {
          type: 'Acceso no autorizado',
          situation: 'Matrícula no vigente',
          cause: 'Matrícula habitual no vigente'
        },
        'NO AUTORIZADO': {
          type: 'Acceso no autorizado',
          situation: 'Otra condición de autorización',
          cause: 'No autorizado'
        }
      };

      if (map[String(status || '')]) {
        return map[String(status || '')];
      }

      if (
        String(status || '') === 'AUTORIZADO' &&
        String(source || '') === 'MATRICULA' &&
        vehicle &&
        vehicle.type !== 'Moto' &&
        vehicle.qr_state === 'Activo'
      ) {
        return {
          type: 'QR no presentado',
          situation: 'QR activo no presentado',
          cause: 'Identificación realizada por matrícula'
        };
      }

      return null;
    };

  function mapFollowup(row, photoUrl = '') {
    return {
      ID_Seguimiento: row.id,
      ID_Incidencia: row.incident_id,
      ID_EventoSeguimiento: row.followup_event_id || '',
      NumeroIntento: row.attempt_number,
      FechaHora: row.occurred_at,
      MatriculaObservada: row.observed_plate || '',
      MatriculaAutorizada: row.authorized_plate || '',
      Situacion: row.situation || '',
      Observacion: row.observation || '',
      Foto: photoUrl
    };
  }

  function incidentAllowedActionsClient(row, refs) {
    const actions = ['Sin actuación', 'Aviso al propietario'];
    const add = (value) => { if (!actions.includes(value)) actions.push(value); };
    const vehicle = refs.vehicleById.get(row.vehicle_id) || null;
    const state = vehicle?.Estado || row.origin_vehicle_state || '';
    const type = row.type || '';
    const situation = row.situation || '';
    const moto = (vehicle?.Tipo || row.origin_vehicle_type) === 'Moto';
    if (type === 'Uso indebido') {
      if (situation === 'Cesión de QR') {
        if (vehicle && state === 'Activo') {
          if (!moto && vehicle.QR_Estado !== 'Revocado') add('Revocar QR');
          add('Suspender vehículo');
        } else if (vehicle && state === 'Suspendido') add('Mantener suspensión');
        add('Otra');
      } else if (situation === 'Uso de QR ajeno') {
        if (vehicle && state === 'Activo') add('Suspender vehículo');
        else if (vehicle && state === 'Suspendido') add('Mantener suspensión');
        add('Otra');
      } else {
        if (vehicle && state === 'Activo') add('Suspender vehículo');
        else if (vehicle && state === 'Suspendido') add('Mantener suspensión');
        add('Otra');
      }
    } else if (type === 'QR no corresponde con matrícula') {
      let qrVehicle = row.related_vehicle_id ? refs.vehicleById.get(row.related_vehicle_id) : null;
      if (!qrVehicle) {
        const relatedPlate = normalizePlate(row.authorized_plate || row.related_plate);
        qrVehicle = refs.vehicles.find((v) => normalizePlate(v.MatriculaHabitual) === relatedPlate || normalizePlate(v.MatriculaTemporal) === relatedPlate) || null;
      }
      if (qrVehicle && qrVehicle.Tipo !== 'Moto' && qrVehicle.Estado === 'Activo' && qrVehicle.QR_Estado !== 'Revocado') add('Revocar QR');
      if (vehicle && state === 'Activo') add('Suspender vehículo');
      else if (vehicle && state === 'Suspendido') add('Mantener suspensión');
      add('Otra');
    } else if (type === 'Acceso no autorizado') {
      if (vehicle && state === 'Suspendido') add('Mantener suspensión');
      if (vehicle && state === 'Activo' && !moto && (situation === 'QR revocado' || vehicle.QR_Estado === 'Revocado')) add('Renovar QR');
      add('Datos corregidos'); add('Otra');
    } else if (type === 'QR no presentado') {
      add('Otra');
    } else if (type === 'Matrícula no registrada') {
      add('Datos corregidos'); add('Otra');
    } else {
      add('Datos corregidos'); add('Otra');
    }
    return actions;
  }

  function mapIncident(row, refs, followups, photoUrl = '') {
    const h = refs.housingById.get(row.dwelling_id) || {};
    const v = refs.vehicleById.get(row.vehicle_id) || {};
    const creator = refs.profiles.get(row.created_by) || {};
    const closer = refs.profiles.get(row.closed_by) || {};
    return {
      ID_Incidencia: row.id,
      ID_Evento: row.event_id || '',
      ID_Vivienda: row.dwelling_id || '',
      ID_Vehiculo: row.vehicle_id || '',
      FechaHora: row.occurred_at,
      Usuario: creator.email || '',
      NombreUsuario: creator.name || creator.email || '',
      Bloque: h.Bloque || '',
      Planta: h.Planta || '',
      Apartamento: h.Apartamento || '',
      MatriculaObservada: row.observed_plate || '',
      MatriculaInfraccion: row.infraction_plate || '',
      MatriculaAutorizada: row.authorized_plate || '',
      MatriculaRelacionada: row.related_plate || '',
      ID_ViviendaRelacionada: row.related_dwelling_id || '',
      ID_VehiculoRelacionado: row.related_vehicle_id || '',
      MatriculaHabitualVehiculo: v.MatriculaHabitual || '',
      MatriculaHabitualOrigen: row.origin_habitual_plate || '',
      TipoVehiculo: v.Tipo || row.origin_vehicle_type || '',
      TipoVehiculoOrigen: row.origin_vehicle_type || '',
      EstadoVehiculo: v.Estado || '',
      EstadoVehiculoOrigen: row.origin_vehicle_state || '',
      QR_Estado: v.QR_Estado || '',
      QR_EstadoOrigen: row.origin_qr_state || '',
      SlotOrigen: row.origin_slot || '',
      Tipo: row.type,
      Descripcion: row.description || '',
      Foto: photoUrl,
      Estado: row.state,
      OrigenControl: row.control_origin || 'Manual',
      EstadoOrigen: row.origin_state || '',
      Situacion: row.situation || '',
      Causa: row.cause || '',
      Intentos: row.attempts || 1,
      Prioridad: row.priority || 'Normal',
      UltimoSeguimiento: row.last_followup_at || '',
      ITV_Vencida: row.expired_itv ? 'Sí' : 'No verificado',
      FugaLiquidos: row.fluid_leak ? 'Sí' : 'No',
      FechaCierre: row.closed_at || '',
      UsuarioCierre: closer.email || '',
      NombreUsuarioCierre: closer.name || closer.email || '',
      AccionCierre: row.close_action || '',
      ComentarioCierre: row.close_comment || '',
      AccionesDisponibles: incidentAllowedActionsClient(row, refs),
      Seguimientos: followups
    };
  }

  async function listIncidents() {
    const [rows, followupRows, refs] = await Promise.all([
      unwrap(await sb.from('incidents').select('*').order('occurred_at', { ascending: false })) || [],
      unwrap(await sb.from('incident_followups').select('*').order('occurred_at')) || [],
      joinedReferenceData()
    ]);
    const paths = [...rows.map((r) => r.photo_url), ...followupRows.map((r) => r.photo_url)].filter(Boolean);
    const urlPairs = await Promise.all(paths.map(async (path) => [path, await evidenceUrl(path)]));
    const urls = new Map(urlPairs);
    const followupsByIncident = new Map();

    followupRows.forEach((row) => {
      const key = row.incident_id || '';
      if (!key) return;

      if (!followupsByIncident.has(key)) {
        followupsByIncident.set(key, []);
      }

      followupsByIncident.get(key).push(
        mapFollowup(
          row,
          urls.get(row.photo_url) || ''
        )
      );
    });

    return rows.map((row) => mapIncident(
      row,
      refs,
      followupsByIncident.get(row.id) || [],
      urls.get(row.photo_url) || ''
    ));
  }


  async function listControlOpenIncidents(vehicle, plate) {
    const normalizedPlate = normalizePlate(plate || '');
    const vehicleId = vehicle?.ID_Vehiculo || vehicle?.id || '';

    const filters = [];

    if (vehicleId) {
      filters.push(`vehicle_id.eq.${vehicleId}`);
      filters.push(`related_vehicle_id.eq.${vehicleId}`);
    }

    if (normalizedPlate) {
      filters.push(`observed_plate.eq.${normalizedPlate}`);
      filters.push(`related_plate.eq.${normalizedPlate}`);
      filters.push(`authorized_plate.eq.${normalizedPlate}`);
    }

    if (!filters.length) {
      return [];
    }

    const rows =
      unwrap(
        await sb
          .from('incidents')
          .select('*')
          .neq('state', 'Cerrada')
          .or(filters.join(','))
          .order('occurred_at', { ascending: false })
      ) || [];

    if (!rows.length) {
      return [];
    }

    const incidentIds = rows
      .map((row) => row.id)
      .filter(Boolean);

    const [followupRows, refs] = await Promise.all([
      incidentIds.length
        ? unwrap(
            await sb
              .from('incident_followups')
              .select('*')
              .in('incident_id', incidentIds)
              .order('occurred_at')
          ) || []
        : [],
      joinedReferenceData()
    ]);

    const followupsByIncident = new Map();

    followupRows.forEach((row) => {
      const key = row.incident_id || '';
      if (!key) return;

      if (!followupsByIncident.has(key)) {
        followupsByIncident.set(key, []);
      }

      followupsByIncident.get(key).push(
        mapFollowup(row)
      );
    });

    return rows.map((row) =>
      mapIncident(
        row,
        refs,
        followupsByIncident.get(row.id) || []
      )
    );
  }

  function controlOpenIncidentsFromList(vehicle, plate, incidents) {
    const today = madridDay();
    const query = normalizePlate(plate);
    const open = incidents.filter((row) => row.Estado === 'Abierta');
    const isLinkedQr = (row) => row.OrigenControl === 'QR' && ((row.Tipo === 'Uso indebido' && ['Cesión de QR', 'Uso de QR ajeno'].includes(row.Situacion)) || row.Tipo === 'Matrícula no registrada');
    const eventIds = (row) => new Set([row.ID_Evento, ...(row.Seguimientos || []).map((f) => f.ID_EventoSeguimiento)].filter(Boolean));
    const events = new Map(open.map((row) => [row.ID_Incidencia, eventIds(row)]));
    const shares = (a, b) => {
      const aa = events.get(a.ID_Incidencia) || new Set();
      const bb = events.get(b.ID_Incidencia) || new Set();
      for (const id of aa) if (bb.has(id)) return true;
      return false;
    };
    const brief = (row) => {
      const createdToday = asDate(row.FechaHora) === today;
      const followedToday = (row.Seguimientos || []).some((f) => asDate(f.FechaHora) === today);
      const linkedQr = isLinkedQr(row);
      return {
        ...row,
        canFollowup: linkedQr || (!createdToday && !followedToday),
        createdToday,
        followedToday,
        relationAware: linkedQr
      };
    };
    return open
      .filter((row) => (vehicle && row.ID_Vehiculo === vehicle.ID_Vehiculo) || (!vehicle && query && normalizePlate(row.MatriculaObservada) === query))
      .map((row) => {
        const own = brief(row);
        const qrLinked = isLinkedQr(row);
        const linked = row.ID_Evento
          ? open.filter((other) => shares(row, other) && (qrLinked ? isLinkedQr(other) : !isLinkedQr(other))).map(brief)
          : [own];
        own.linkedOpenIncidents = linked;
        own.linkedCount = linked.length;
        own.canFollowup = linked.some((item) => item.canFollowup);
        return own;
      })
      .sort((a, b) => String(b.FechaHora).localeCompare(String(a.FechaHora)));
  }

  async function incidentContext() {
    const [vehicles, periods, dwellings, requests] = await Promise.all([
      unwrap(await sb.from('vehicles').select('*')) || [],
      unwrap(await sb.from('temporary_periods').select('*')) || [],
      unwrap(await sb.from('dwellings').select('*')) || [],
      unwrap(await sb.from('requests').select('*').eq('type', 'PERMANENCIA_PROLONGADA').eq('state', 'Aprobada')) || []
    ]);
    return {
      vehicles, periods, dwellings, requests,
      vehiclesById: new Map(vehicles.map((v) => [v.id, v])),
      dwellingsById: new Map(dwellings.map((d) => [d.id, d]))
    };
  }

  function currentTemporaryRaw(vehicleId, ctx) {
    const today = madridDay();
    return ctx.periods
      .filter((p) => p.vehicle_id === vehicleId && p.state !== 'Anulado' && asDate(p.starts_at) <= today && asDate(p.ends_at) >= today)
      .sort((a, b) => String(b.starts_at).localeCompare(String(a.starts_at)))[0] || null;
  }

  function resolveIncidentPlate(value, ctx) {
    const plate = normalizePlate(value);
    if (!plate) return { plate: '', vehicle: null, kind: '', period: null, valid: false, status: '' };
    const vehicle = ctx.vehicles.find((v) => normalizePlate(v.habitual_plate) === plate) || null;
    if (vehicle) {
      const current = vehicle.state === 'Activo' ? currentTemporaryRaw(vehicle.id, ctx) : null;
      if (current && normalizePlate(current.temporary_plate) !== plate) {
        return { plate, vehicle, kind: 'HABITUAL_NO_VIGENTE', period: current, valid: false, status: 'MATRICULA HABITUAL NO VIGENTE' };
      }
      return { plate, vehicle, kind: 'HABITUAL', period: null, valid: true, status: '' };
    }
    const matching = ctx.periods
      .filter((p) => normalizePlate(p.temporary_plate) === plate)
      .sort((a, b) => String(b.starts_at).localeCompare(String(a.starts_at)));
    if (!matching.length) return { plate, vehicle: null, kind: 'NO_REGISTRADA', period: null, valid: false, status: 'MATRICULA NO REGISTRADA' };
    const today = madridDay();
    const validPeriod = matching.find((p) => p.state !== 'Anulado' && asDate(p.starts_at) <= today && asDate(p.ends_at) >= today) || null;
    const period = validPeriod || matching[0];
    const related = ctx.vehiclesById.get(period.vehicle_id) || null;
    if (!related) return { plate, vehicle: null, kind: 'NO_REGISTRADA', period, valid: false, status: 'MATRICULA NO REGISTRADA' };
    if (validPeriod && related.state === 'Activo') return { plate, vehicle: related, kind: 'TEMPORAL_VIGENTE', period: validPeriod, valid: true, status: '' };
    return { plate, vehicle: related, kind: 'TEMPORAL_NO_VIGENTE', period, valid: false, status: 'MATRICULA TEMPORAL NO VIGENTE' };
  }

  function approvedLongStay(vehicleId, ctx) {
    const today = madridDay();
    return ctx.requests.find((r) => r.vehicle_id === vehicleId && asDate(r.start_date) <= today && asDate(r.end_date) >= today) || null;
  }

  function incidentObservedAccess(identity, ctx) {
    const v = identity?.vehicle || null;
    if (!v) return { authorized: false, status: 'MATRICULA NO REGISTRADA', situation: 'Matrícula no registrada', cause: 'Matrícula no registrada' };
    if (identity.status === 'MATRICULA TEMPORAL NO VIGENTE') return { authorized: false, status: identity.status, situation: 'Matrícula no vigente', cause: 'Matrícula temporal no vigente' };
    if (identity.status === 'MATRICULA HABITUAL NO VIGENTE') return { authorized: false, status: identity.status, situation: 'Matrícula no vigente', cause: 'Matrícula habitual no vigente' };
    if (v.state === 'Desasignado') return { authorized: false, status: 'VEHICULO DESASIGNADO', situation: 'Vehículo desasignado', cause: 'Vehículo desasignado' };
    if (v.state === 'Suspendido') return { authorized: false, status: 'VEHICULO SUSPENDIDO', situation: 'Vehículo suspendido', cause: 'Vehículo suspendido' };
    if (v.state === 'Baja') return { authorized: false, status: 'VEHICULO DE BAJA', situation: 'Vehículo de baja', cause: 'Vehículo de baja' };
    const h = ctx.dwellingsById.get(v.dwelling_id) || null;
    if (v.state !== 'Activo' || !h || h.state !== 'Activo') return { authorized: false, status: 'NO AUTORIZADO', situation: 'Otra condición de autorización', cause: 'Vehículo o vivienda no activa' };
    if (approvedLongStay(v.id, ctx)) return { authorized: true, status: 'AUTORIZADO', situation: '', cause: 'Permanencia prolongada aprobada' };
    if (v.type !== 'Moto' && ![1, 2, '1', '2'].includes(v.slot)) return { authorized: false, status: 'NO AUTORIZADO', situation: 'Otra condición de autorización', cause: 'Vehículo sin slot autorizado' };
    if (v.type !== 'Moto' && v.qr_token && v.qr_state === 'Revocado') return { authorized: false, status: 'QR REVOCADO', situation: 'QR revocado', cause: 'QR revocado' };
    return { authorized: true, status: 'AUTORIZADO', situation: '', cause: '' };
  }

  function normalizeLegacyIncidentType(type, status) {
    const legacy = {
      'QR revocado': ['Acceso no autorizado', 'QR revocado'],
      'Vehículo suspendido': ['Acceso no autorizado', 'Vehículo suspendido'],
      'Vehículo de baja': ['Acceso no autorizado', 'Vehículo de baja'],
      'Vehículo sin QR': ['QR no presentado', 'QR activo no presentado']
    };
    if (legacy[type]) return { type: legacy[type][0], situation: legacy[type][1] };
    const d = incidentDerivedFromStatus(status, '', null);
    return { type: type || d?.type || 'Otro', situation: d?.situation || '' };
  }

  function incidentBaseCandidate(payload, vehicle, eventId) {
    const normalized = normalizeLegacyIncidentType(String(payload.Tipo || '').trim(), String(payload.EstadoOrigen || '').trim());
    const derived = incidentDerivedFromStatus(payload.EstadoOrigen, payload.OrigenControl, vehicle);
    let type = String(payload.Tipo || '').trim();
    if (!INCIDENT_TYPES.includes(type)) type = (derived && derived.type) || normalized.type;
    if (!INCIDENT_TYPES.includes(type)) type = 'Otro';
    const situation = String(payload.Situacion || '').trim() || ((derived && derived.type === type) ? derived.situation : normalized.situation);
    const cause = String(payload.Causa || '').trim() || ((derived && derived.type === type) ? derived.cause : '');
    const observed = normalizePlate(payload.MatriculaObservada);
    return {
      observed_plate: observed || null,
      infraction_plate: normalizePlate(payload.MatriculaInfraccion) || observed || normalizePlate(vehicle?.habitual_plate) || null,
      authorized_plate: normalizePlate(payload.MatriculaAutorizada) || null,
      dwelling_id: vehicle?.dwelling_id || payload.ID_Vivienda || null,
      vehicle_id: vehicle?.id || payload.ID_Vehiculo || null,
      type,
      description: String(payload.Descripcion || payload.Observacion || '').trim(),
      photo_url: payload.Foto || null,
      control_origin: String(payload.OrigenControl || 'Manual'),
      origin_state: String(payload.EstadoOrigen || 'Registro manual'),
      origin_vehicle_state: vehicle?.state || null,
      origin_qr_state: vehicle ? (vehicle.type === 'Moto' ? 'No aplica' : vehicle.qr_state || null) : null,
      origin_vehicle_type: vehicle?.type || null,
      origin_slot: vehicle && vehicle.type !== 'Moto' ? vehicle.slot : null,
      origin_habitual_plate: normalizePlate(vehicle?.habitual_plate) || null,
      expired_itv: String(payload.ITV_Vencida || '') === 'Sí',
      event_id: eventId || crypto.randomUUID(),
      situation: situation || null,
      cause: cause || null,
      related_dwelling_id: null,
      related_vehicle_id: null,
      related_plate: null,
      fluid_leak: type === 'Fuga / pérdida de líquidos' || String(payload.FugaLiquidos || '') === 'Sí'
    };
  }

  function validateIncidentCandidate(row, vehicle) {
    const type = row.type;
    if (type === 'Matrícula no registrada' && vehicle) throw new Error('La matrícula indicada está registrada. Revisa el tipo de incidencia.');
    if (['QR no presentado', 'QR no corresponde con matrícula'].includes(type) && !vehicle) throw new Error('Este tipo de incidencia requiere vincular un vehículo registrado.');
    if (['QR no presentado', 'QR no corresponde con matrícula'].includes(type) && vehicle?.type === 'Moto') throw new Error('Este tipo no aplica a motos, que se controlan por matrícula.');
    if (type === 'QR no corresponde con matrícula') {
      if (!row.observed_plate || !row.authorized_plate) throw new Error('Indica la matrícula observada y la matrícula asociada al QR.');
      if (row.observed_plate === row.authorized_plate) throw new Error('La matrícula observada coincide con la asociada al QR.');
    }
    if (type === 'Vehículo inmovilizado / posible abandono' && !row.situation) throw new Error('Selecciona la situación observada.');
    if (type === 'Estacionamiento o ubicación indebida' && !row.situation) throw new Error('Selecciona la situación de estacionamiento o ubicación.');
    if (type === 'Uso indebido' && !row.situation) throw new Error('Selecciona la situación de uso indebido.');
  }

  function accessCandidate(payload, identity, ctx, eventId) {
    const access = incidentObservedAccess(identity, ctx);
    if (access.authorized || !identity.vehicle) return null;
    const row = incidentBaseCandidate({ ...payload, Tipo: 'Acceso no autorizado', Situacion: access.situation, Causa: access.cause, EstadoOrigen: access.status, ID_Vehiculo: identity.vehicle.id, ID_Vivienda: identity.vehicle.dwelling_id, MatriculaObservada: identity.plate }, identity.vehicle, eventId);
    row.observed_plate = identity.plate;
    row.infraction_plate = identity.plate;
    return row;
  }

  function sameIncidentOwner(a, b, ctx) {
    if (!a || !b) return false;
    const ah = ctx.dwellingsById.get(a.dwelling_id);
    const bh = ctx.dwellingsById.get(b.dwelling_id);
    return !!(ah?.responsible_user_id && bh?.responsible_user_id && ah.responsible_user_id === bh.responsible_user_id);
  }

  function buildIncidentCandidates(payload, ctx) {
    const authorized = normalizePlate(payload.MatriculaAutorizada);
    const observed = normalizePlate(payload.MatriculaObservada);
    const origin = String(payload.OrigenControl || 'Manual');
    let primary = payload.ID_Vehiculo ? ctx.vehiclesById.get(payload.ID_Vehiculo) || null : null;
    if (!primary && authorized) primary = resolveIncidentPlate(authorized, ctx).vehicle;
    if (!primary && observed) primary = resolveIncidentPlate(observed, ctx).vehicle;

    if (origin === 'QR' && primary && observed) {
      const qrVehicle = primary;
      const observedIdentity = resolveIncidentPlate(observed, ctx);
      const observedVehicle = observedIdentity.vehicle;
      const sameVehicle = !!(observedVehicle && observedVehicle.id === qrVehicle.id);
      if (!sameVehicle) {
        const commonEvent = crypto.randomUUID();
        const candidates = [];
        const access = observedVehicle ? incidentObservedAccess(observedIdentity, ctx) : null;
        if (observedVehicle && sameIncidentOwner(qrVehicle, observedVehicle, ctx)) {
          const mismatch = incidentBaseCandidate({ ...payload, Tipo: 'QR no corresponde con matrícula', Situacion: 'Vehículo del mismo propietario', Causa: 'Se utilizó el QR de otro vehículo del mismo propietario', EstadoOrigen: access?.status || payload.EstadoOrigen, MatriculaAutorizada: authorized || qrVehicle.habitual_plate, MatriculaObservada: observed, ID_Vehiculo: observedVehicle.id, ID_Vivienda: observedVehicle.dwelling_id }, observedVehicle, commonEvent);
          mismatch.infraction_plate = observed;
          mismatch.related_dwelling_id = qrVehicle.dwelling_id;
          mismatch.related_vehicle_id = qrVehicle.id;
          mismatch.related_plate = normalizePlate(qrVehicle.habitual_plate);
          candidates.push(mismatch);
        } else {
          const giver = incidentBaseCandidate({ ...payload, Tipo: 'Uso indebido', Situacion: 'Cesión de QR', Causa: 'QR utilizado por otro vehículo', MatriculaAutorizada: authorized || qrVehicle.habitual_plate, MatriculaObservada: observed, ID_Vehiculo: qrVehicle.id, ID_Vivienda: qrVehicle.dwelling_id }, qrVehicle, commonEvent);
          giver.infraction_plate = normalizePlate(qrVehicle.habitual_plate) || authorized;
          giver.related_dwelling_id = observedVehicle?.dwelling_id || null;
          giver.related_vehicle_id = observedVehicle?.id || null;
          giver.related_plate = observed;
          candidates.push(giver);
          if (observedVehicle) {
            const userRow = incidentBaseCandidate({ ...payload, Tipo: 'Uso indebido', Situacion: 'Uso de QR ajeno', Causa: 'QR perteneciente a otro propietario', EstadoOrigen: access?.status || payload.EstadoOrigen, MatriculaAutorizada: authorized || qrVehicle.habitual_plate, MatriculaObservada: observed, ID_Vehiculo: observedVehicle.id, ID_Vivienda: observedVehicle.dwelling_id }, observedVehicle, commonEvent);
            userRow.infraction_plate = observed;
            userRow.related_dwelling_id = qrVehicle.dwelling_id;
            userRow.related_vehicle_id = qrVehicle.id;
            userRow.related_plate = normalizePlate(qrVehicle.habitual_plate);
            candidates.push(userRow);
          } else {
            const unknown = incidentBaseCandidate({ ...payload, Tipo: 'Matrícula no registrada', Situacion: 'Matrícula no registrada', Causa: 'Vehículo observado usando QR ajeno', MatriculaAutorizada: authorized || qrVehicle.habitual_plate, MatriculaObservada: observed, ID_Vehiculo: '', ID_Vivienda: '' }, null, commonEvent);
            unknown.vehicle_id = null;
            unknown.dwelling_id = null;
            unknown.infraction_plate = observed;
            unknown.related_dwelling_id = qrVehicle.dwelling_id;
            unknown.related_vehicle_id = qrVehicle.id;
            unknown.related_plate = normalizePlate(qrVehicle.habitual_plate);
            candidates.push(unknown);
          }
        }
        if (observedVehicle) {
          const blockedAccess = accessCandidate(payload, observedIdentity, ctx, crypto.randomUUID());
          if (blockedAccess) candidates.push(blockedAccess);
        }
        candidates.forEach((row) => validateIncidentCandidate(row, row.vehicle_id ? ctx.vehiclesById.get(row.vehicle_id) : null));
        return candidates;
      }
      const observedAccess = incidentObservedAccess(observedIdentity, ctx);
      if (!observedAccess.authorized) {
        const row = accessCandidate(payload, observedIdentity, ctx, crypto.randomUUID());
        if (row) return [row];
      }
      if (['QR no corresponde con matrícula', 'Uso indebido'].includes(String(payload.Tipo || ''))) {
        throw new Error('La matrícula observada corresponde al mismo vehículo (matrícula habitual o temporal vigente). Selecciona otra incidencia si corresponde.');
      }
    }

    const row = incidentBaseCandidate(payload, primary, crypto.randomUUID());
    validateIncidentCandidate(row, primary);
    return [row];
  }

  async function buildFollowupCandidates(payload, ctx) {
    const anchor = unwrap(await sb.from('incidents').select('*').eq('id', payload.anchorId).single());
    if (anchor.state !== 'Abierta') throw new Error(`La incidencia ${anchor.id} ya no está abierta.`);
    const eventRows = anchor.event_id
      ? (unwrap(await sb.from('incidents').select('*').eq('community_id', anchor.community_id).eq('event_id', anchor.event_id)) || [])
      : [anchor];
    const dynamicQr = eventRows.some((r) => r.control_origin === 'QR') || anchor.control_origin === 'QR';
    if (!dynamicQr) return [];
    let primaryId = anchor.vehicle_id;
    let primaryDwelling = anchor.dwelling_id;
    let type = anchor.type;
    let situation = anchor.situation;
    let cause = anchor.cause;
    let authorized = normalizePlate(anchor.authorized_plate);
    const giver = eventRows.find((r) => r.type === 'Uso indebido' && r.situation === 'Cesión de QR' && r.vehicle_id);
    const mismatch = eventRows.find((r) => r.type === 'QR no corresponde con matrícula' && r.related_vehicle_id);
    const qrUser = eventRows.find((r) => r.type === 'Uso indebido' && r.situation === 'Uso de QR ajeno' && r.related_vehicle_id);
    if (giver) {
      primaryId = giver.vehicle_id; primaryDwelling = giver.dwelling_id; type = 'Uso indebido'; situation = 'Cesión de QR'; cause = giver.cause || 'QR utilizado por otro vehículo';
      authorized = normalizePlate(giver.authorized_plate || giver.infraction_plate || giver.origin_habitual_plate);
    } else if (mismatch) {
      primaryId = mismatch.related_vehicle_id; primaryDwelling = mismatch.related_dwelling_id; type = 'QR no corresponde con matrícula'; situation = mismatch.situation; cause = mismatch.cause;
      authorized = normalizePlate(mismatch.authorized_plate || mismatch.related_plate);
    } else if (qrUser) {
      primaryId = qrUser.related_vehicle_id; primaryDwelling = qrUser.related_dwelling_id; type = 'Uso indebido'; situation = 'Cesión de QR'; cause = 'QR utilizado por otro vehículo';
      authorized = normalizePlate(qrUser.authorized_plate || qrUser.related_plate);
    }
    const observed = normalizePlate(payload.MatriculaObservada) || normalizePlate(anchor.observed_plate) || normalizePlate(anchor.infraction_plate);
    return buildIncidentCandidates({
      ...payload,
      Tipo: type, Situacion: situation, Causa: cause, OrigenControl: anchor.control_origin || 'Manual',
      EstadoOrigen: payload.EstadoOrigen || anchor.origin_state || '', ID_Vehiculo: primaryId, ID_Vivienda: primaryDwelling,
      MatriculaAutorizada: authorized, MatriculaObservada: observed,
      Descripcion: payload.Observacion || payload.Descripcion || anchor.description, Foto: payload.Foto || anchor.photo_url
    }, ctx);
  }

  function publicFollowupPlan(raw) {
    const label = (row = {}) => ({
      ID_Incidencia: row.id || '', ID_Evento: row.event_id || '', Tipo: row.type || '', Situacion: row.situation || '', Causa: row.cause || '',
      ID_Vehiculo: row.vehicle_id || '', ID_Vivienda: row.dwelling_id || '', Matricula: normalizePlate(row.infraction_plate || row.observed_plate || row.origin_habitual_plate),
      MatriculaObservada: normalizePlate(row.observed_plate), MatriculaAutorizada: normalizePlate(row.authorized_plate),
      ID_VehiculoRelacionado: row.related_vehicle_id || '', MatriculaRelacionada: normalizePlate(row.related_plate)
    });
    return {
      ok: true, canSave: !!raw.canSave, anchor: label(raw.anchor || {}), occurrenceEventId: raw.occurrenceEventId || '',
      linkedOriginal: (raw.linkedOriginal || []).map(label), summary: raw.summary || {},
      operations: (raw.operations || []).map((op) => ({ action: op.action, reason: op.reason || '', ...label(op.action === 'CREATE' ? (op.candidate || {}) : (op.existing || {})) }))
    };
  }

  async function saveIncident(payload) {
    const boot = await appBootstrap();
    if (!String(payload.Descripcion || '').trim()) throw new Error('Completa la observación / descripción.');
    if (!String(payload.Foto || '').trim()) throw new Error('Debes adjuntar una fotografía antes de registrar la incidencia.');
    const ctx = await incidentContext();
    const candidates = buildIncidentCandidates(payload, ctx);
    const result = unwrap(await sb.rpc('save_parking_incident_candidates', { p_community_id: boot.communityId, p_candidates: candidates }));
    const createdRows = result.created || [];
    for (const row of createdRows) await registerEvidence(payload.Foto, row.id, null);
    invalidate();
    if (result.mode === 'CREATED') {
      return {
        mode: 'CREATED',
        ID_Incidencia: createdRows[0]?.id || '',
        IDs: createdRows.map((row) => row.id),
        ID_Evento: createdRows[0]?.event_id || '',
        created: createdRows.map((row) => ({ ID_Incidencia: row.id, Tipo: row.type, Situacion: row.situation || '', ID_Vehiculo: row.vehicle_id || '' })),
        reused: result.reused || [], message: result.message || ''
      };
    }
    const existing = result.existing || [];
    return {
      mode: result.mode,
      existingIds: existing.map((row) => row.id),
      existing: existing.map((row) => ({ ID_Incidencia: row.id, Tipo: row.type, Situacion: row.situation || '', FechaHora: row.occurred_at, Intentos: row.attempts || 1, Prioridad: row.priority || 'Normal' })),
      blockedIds: (result.blocked || []).map((row) => row.id),
      message: result.message || ''
    };
  }

  async function previewIncidentFollowup(payload) {
    const ctx = await incidentContext();
    const anchorId = payload.anchorId || (Array.isArray(payload.ids) ? payload.ids[0] : '') || payload.id;
    if (!anchorId) throw new Error('No se indicó la incidencia a seguir.');
    const candidates = await buildFollowupCandidates({ ...payload, anchorId }, ctx);
    const raw = unwrap(await sb.rpc('preview_parking_incident_followup', { p_anchor_id: anchorId, p_candidates: candidates }));
    return publicFollowupPlan(raw);
  }

  async function saveIncidentFollowup(payload) {
    const ctx = await incidentContext();
    const anchorId = payload.anchorId || (Array.isArray(payload.ids) ? payload.ids[0] : '') || payload.id;
    if (!anchorId) throw new Error('No se indicó la incidencia a seguir.');
    const candidates = await buildFollowupCandidates({ ...payload, anchorId }, ctx);
    const out = unwrap(await sb.rpc('save_parking_incident_followup', {
      p_anchor_id: anchorId,
      p_candidates: candidates,
      p_observation: String(payload.Observacion || payload.Descripcion || '').trim(),
      p_photo_url: payload.Foto || ''
    }));
    for (const followupId of (out.followupIds || [])) await registerEvidence(payload.Foto, null, followupId);
    for (const row of (out.created || [])) await registerEvidence(payload.Foto, row.id, null);
    invalidate();
    return { updated: out.updated || [], created: (out.created || []).map((row) => ({ ID_Incidencia: row.id, Tipo: row.type, Situacion: row.situation || '', ID_Vehiculo: row.vehicle_id || '' })), skipped: out.skipped || [], plan: publicFollowupPlan(out.plan || {}) };
  }

    return {
      INCIDENT_TYPES,
      madridDay,
      incidentDerivedFromStatus,
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
    };
  };
})();
