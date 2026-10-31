(() => {
  'use strict';

  window.ParkingSupabaseVehicles = ({
    sb,
    unwrap,
    invalidate,
    cached,
    asDate,
    mapPeriod
  }) => {
    if (!sb || !unwrap || !invalidate || !cached || !asDate || !mapPeriod) {
      throw new Error('ParkingSupabaseVehicles: faltan dependencias.');
    }

    function mapVehicle(row, periods = []) {
      if (!row) return null;

      const today = new Date().toISOString().slice(0, 10);

      const activePeriods = periods
        .filter((p) => p.vehicle_id === row.id && p.state !== 'Anulado')
        .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));

      const current =
        activePeriods.find(
          (p) => asDate(p.starts_at) <= today && asDate(p.ends_at) >= today
        ) || null;

      const upcoming =
        activePeriods.find(
          (p) => asDate(p.starts_at) > today
        ) || null;

      return {
        ID_Vehiculo: row.id,
        ID_Vivienda: row.dwelling_id,
        CommunityId: row.community_id,
        Slot: row.slot == null ? '' : String(row.slot),
        MatriculaHabitual: row.habitual_plate || '',
        MatriculaTemporal: current?.temporary_plate || '',
        TemporalDesde: current?.starts_at || '',
        TemporalHasta: current?.ends_at || '',
        Marca: row.make || '',
        Modelo: row.model || '',
        Tipo: row.type || 'Particular',
        Estado: row.state || '',
        QR_Token: row.qr_token || '',
        QR_Estado: row.qr_state || '',
        Observaciones: row.observations || '',
        CreatedAt: row.created_at || '',
        FechaAlta: row.created_at || '',
        PeriodoTemporalActual: mapPeriod(current),
        ProximoPeriodoTemporal: mapPeriod(upcoming)
      };
    }

    async function listVehicles() {
      return cached('vehicles', async () => {
        const [vehicles, periods] = await Promise.all([
          unwrap(
            await sb
              .from('vehicles')
              .select('*')
              .order('habitual_plate')
          ) || [],
          unwrap(
            await sb
              .from('temporary_periods')
              .select('*')
              .order('starts_at')
          ) || []
        ]);

        return vehicles.map((row) => mapVehicle(row, periods));
      });
    }

    async function renewQr(payload) {
      const vehicleId =
        payload.id ||
        payload.ID_Vehiculo ||
        payload.vehicleId ||
        payload.vehicle_id;

      if (!vehicleId) {
        throw new Error('Vehículo no encontrado.');
      }

      const result = unwrap(
        await sb.rpc('renew_parking_qr', {
          p_vehicle_id: vehicleId
        })
      );

      invalidate();

      return mapVehicle(result.vehicle || result, []);
    }

    async function replaceVehicle(payload) {
      const vehicleId =
        payload.ID_Vehiculo ||
        payload.id ||
        payload.vehicleId ||
        payload.vehicle_id;

      if (!vehicleId) {
        throw new Error('Vehículo a reemplazar no encontrado.');
      }

      const result = unwrap(
        await sb.rpc('replace_parking_vehicle', {
          p_vehicle_id: vehicleId,
          p_habitual_plate: String(payload.MatriculaHabitual || '').trim(),
          p_type: payload.Tipo || 'Particular',
          p_make: payload.Marca || '',
          p_model: payload.Modelo || '',
          p_observations: payload.Observaciones || ''
        })
      );

      invalidate();

      const vehicles = await listVehicles();

      const oldVehicle =
        vehicles.find((v) => v.ID_Vehiculo === result.oldVehicleId) || null;

      const newVehicle =
        vehicles.find((v) => v.ID_Vehiculo === result.newVehicleId) || null;

      if (!newVehicle) {
        throw new Error(
          'El reemplazo se realizó pero no se pudo recargar el nuevo vehículo.'
        );
      }

      return {
        oldVehicle,
        newVehicle
      };
    }

    async function saveVehicle(payload) {
      try {
        const row = unwrap(
          await sb.rpc('save_parking_vehicle', {
            p_payload: payload || {}
          })
        );

        invalidate();

        return mapVehicle(row, []);
      } catch (error) {
        const text = `${error?.message || ''} ${error?.details || ''}`;

        if (
          text.includes('vehicles_plate_unique_per_community') ||
          text.includes('normalized_habitual_plate')
        ) {
          throw new Error(
            'La matrícula ya está registrada en otro vehículo. Edita o consolida el registro existente.'
          );
        }

        if (
          text.includes('vehicles_slot_unique') ||
          text.includes('dwelling_id, slot')
        ) {
          throw new Error(
            'Ese slot ya está ocupado por otro vehículo activo.'
          );
        }

        throw error;
      }
    }

    async function assignVehicleSlot(payload = {}) {
      const vehicleId =
        payload.ID_Vehiculo ||
        payload.vehicleId ||
        payload.vehicle_id ||
        payload.id;

      const slot = Number(payload.Slot || payload.slot);

      if (!vehicleId) {
        throw new Error('Vehículo no encontrado.');
      }

      const data = unwrap(
        await sb.rpc('assign_vehicle_slot', {
          p_vehicle_id: vehicleId,
          p_slot: slot,
          p_confirm_replace: !!payload.confirmReplace
        })
      );

      invalidate();
      return data;
    }

    async function releaseVehicleSlot(payload = {}) {
      const vehicleId =
        payload.ID_Vehiculo ||
        payload.vehicleId ||
        payload.vehicle_id ||
        payload.id;

      if (!vehicleId) {
        throw new Error('Vehículo no encontrado.');
      }

      const data = unwrap(
        await sb.rpc('release_vehicle_slot', {
          p_vehicle_id: vehicleId
        })
      );

      invalidate();
      return data;
    }

    async function bulkVehiclePreview(payload = {}) {
      const ids = Array.isArray(payload.ids)
        ? payload.ids.filter(Boolean)
        : [];

      if (!ids.length) {
        throw new Error('Selecciona al menos un vehículo.');
      }

      return unwrap(
        await sb.rpc('bulk_vehicle_preview', {
          p_vehicle_ids: ids,
          p_action: payload.action
        })
      );
    }

    async function bulkVehicleAction(payload = {}) {
      const ids = Array.isArray(payload.ids)
        ? payload.ids.filter(Boolean)
        : [];

      if (!ids.length) {
        throw new Error('Selecciona al menos un vehículo.');
      }

      const data = unwrap(
        await sb.rpc('bulk_vehicle_action', {
          p_vehicle_ids: ids,
          p_action: payload.action
        })
      );

      invalidate();
      return data;
    }

    return {
      mapVehicle,
      listVehicles,
      saveVehicle,
      renewQr,
      replaceVehicle,
      assignVehicleSlot,
      releaseVehicleSlot,
      bulkVehiclePreview,
      bulkVehicleAction
    };
  };
})();
