(() => {
  'use strict';

  window.ParkingSupabaseRequests = ({
    sb,
    unwrap,
    invalidate,
    joinedReferenceData
  }) => {
    if (!sb || !unwrap || !invalidate || !joinedReferenceData) {
      throw new Error('ParkingSupabaseRequests: faltan dependencias.');
    }

    function mapRequest(row, refs) {
      const h = refs.housingById.get(row.dwelling_id) || {};
      const v = refs.vehicleById.get(row.vehicle_id) || {};
      const requester = refs.profiles.get(row.requested_by) || {};
      const resolver = refs.profiles.get(row.resolved_by) || {};
      const requestOwner = refs.profiles.get(row.responsible_at_request_user_id) || {};

      return {
        ID_Solicitud: row.id,
        ID_Vivienda: row.dwelling_id,
        ID_Vehiculo: row.vehicle_id || '',
        ID_PropietarioAlHecho: row.responsible_at_request_user_id || '',
        NombrePropietarioAlHecho: requestOwner.name || requestOwner.email || '',
        FechaHora: row.requested_at,
        Usuario: requester.email || '',
        NombreSolicitante: requester.name || requester.email || '',
        Bloque: h.Bloque || '',
        Planta: h.Planta || '',
        Apartamento: h.Apartamento || '',
        MatriculaHabitual: v.MatriculaHabitual || row.origin_plate || '',
        MatriculaOrigen: row.origin_plate || '',
        TipoVehiculo: v.Tipo || row.origin_vehicle_type || '',
        Slot: v.Slot || row.origin_slot || '',
        QR_Estado: v.QR_Estado || row.origin_qr_state || '',
        // Datos del vehículo AHORA (pueden cambiar después de solicitar).
        EstadoVehiculo: v.Estado || '',
        EstadoQR: v.QR_Estado || '',
        SlotActual: v.Slot || '',
        // Fotografía del vehículo cuando se creó la solicitud.
        EstadoVehiculoOrigen: row.origin_vehicle_state || '',
        QREstadoOrigen: row.origin_qr_state || '',
        SlotOrigen: row.origin_slot == null ? '' : String(row.origin_slot),
        Tipo: row.type,
        Estado: row.state,
        Motivo: row.reason || '',
        FechaInicio: row.start_date || '',
        FechaFin: row.end_date || '',
        FechaResolucion: row.resolved_at || '',
        UsuarioResolucion: resolver.email || '',
        NombreResolucion: resolver.name || resolver.email || '',
        ObservacionesResolucion: row.resolution_notes || ''
      };
    }

    async function listRequests() {
      const [rows, refs] = await Promise.all([
        unwrap(
          await sb
            .from('requests')
            .select('*')
            .order('requested_at', { ascending: false })
        ) || [],
        joinedReferenceData()
      ]);

      return rows.map((row) => mapRequest(row, refs));
    }

    async function createRequest(payload) {
      const created = unwrap(
        await sb.rpc('create_parking_request', {
          p_vehicle_id: payload.ID_Vehiculo,
          p_type: payload.Tipo,
          p_reason: String(payload.Motivo || '').trim(),
          p_start_date: payload.FechaInicio || null,
          p_end_date: payload.FechaFin || null
        })
      );

      invalidate();

      return {
        ok: true,
        ID_Solicitud: created.id
      };
    }

    async function resolveRequest(payload) {
      const data = unwrap(
        await sb.rpc('resolve_parking_request', {
          p_request_id: payload.id,
          p_decision: payload.decision,
          p_notes: payload.observaciones || ''
        })
      );

      invalidate();
      return data;
    }

    return {
      mapRequest,
      listRequests,
      createRequest,
      resolveRequest
    };
  };
})();
