(() => {
  'use strict';

  window.ParkingSupabaseTemporaryPeriods = ({
    sb,
    unwrap,
    invalidate,
    asDate,
    sessionUser
  }) => {
    if (!sb || !unwrap || !invalidate || !asDate || !sessionUser) {
      throw new Error('ParkingSupabaseTemporaryPeriods: faltan dependencias.');
    }

    function mapPeriod(row) {
      if (!row) return null;

      return {
        ID_Periodo: row.id,
        ID_Temporal: row.id,
        ID_Vehiculo: row.vehicle_id,
        MatriculaTemporal: row.temporary_plate,
        Desde: asDate(row.starts_at),
        Hasta: asDate(row.ends_at),
        Estado: row.state,
        Observaciones: row.observations || '',
        CreatedAt: row.created_at || ''
      };
    }

    function mapTemporaryPeriodLegacy(row) {
      if (!row) return null;

      return {
        ID_Periodo: row.id,
        ID_Temporal: row.id,
        ID_Vehiculo: row.vehicle_id,
        MatriculaTemporal: row.temporary_plate,
        MatriculaTemporalNormalizada: row.normalized_temporary_plate || '',
        Desde: asDate(row.starts_at),
        Hasta: asDate(row.ends_at),
        Estado: row.state,
        Observaciones: row.observations || '',
        FechaAlta: row.created_at || '',
        UsuarioAlta: row.created_by || ''
      };
    }

    async function listTemporaryPeriods(payload = {}) {
      const vehicleId =
        payload.ID_Vehiculo ||
        payload.vehicleId ||
        payload.vehicle_id ||
        payload.id;

      if (!vehicleId) {
        throw new Error('No se pudo determinar el vehículo.');
      }

      const rows = unwrap(
        await sb
          .from('temporary_periods')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('starts_at', { ascending: true })
      ) || [];

      return rows.map(mapTemporaryPeriodLegacy);
    }

    async function saveTemporaryPeriod(payload = {}) {
      const vehicleId =
        payload.ID_Vehiculo ||
        payload.vehicleId ||
        payload.vehicle_id;

      const periodId =
        payload.ID_Periodo ||
        payload.ID_Temporal ||
        payload.periodId ||
        payload.period_id;

      const temporaryPlate = String(
        payload.MatriculaTemporal ||
        payload.temporaryPlate ||
        payload.temporary_plate ||
        ''
      ).trim().toUpperCase();

      const startsAt = String(
        payload.Desde ||
        payload.desde ||
        payload.startsAt ||
        payload.starts_at ||
        ''
      ).trim();

      const endsAt = String(
        payload.Hasta ||
        payload.hasta ||
        payload.endsAt ||
        payload.ends_at ||
        ''
      ).trim();

      const observations = String(
        payload.Observaciones ||
        payload.observations ||
        ''
      ).trim();

      if (!vehicleId) {
        throw new Error('No se pudo determinar el vehículo.');
      }

      if (!temporaryPlate || !startsAt || !endsAt) {
        throw new Error('Completa matrícula temporal, desde y hasta.');
      }

      if (endsAt < startsAt) {
        throw new Error('La fecha hasta no puede ser anterior a la fecha desde.');
      }

      const vehicle = unwrap(
        await sb
          .from('vehicles')
          .select('id,community_id,state,habitual_plate,normalized_habitual_plate')
          .eq('id', vehicleId)
          .single()
      );

      if (!vehicle) {
        throw new Error('Vehículo no encontrado.');
      }

      if (vehicle.state !== 'Activo') {
        throw new Error(
          'Solo se pueden crear o modificar períodos mientras el vehículo está activo.'
        );
      }

      if (periodId) {
        const previous = unwrap(
          await sb
            .from('temporary_periods')
            .select('id,vehicle_id,state')
            .eq('id', periodId)
            .single()
        );

        if (!previous || previous.vehicle_id !== vehicleId) {
          throw new Error('Período no válido.');
        }
      }

      const row = {
        community_id: vehicle.community_id,
        vehicle_id: vehicleId,
        temporary_plate: temporaryPlate,
        starts_at: startsAt,
        ends_at: endsAt,
        observations,
        state: payload.Estado || 'Activo'
      };

      let saved;

      if (periodId) {
        saved = unwrap(
          await sb
            .from('temporary_periods')
            .update(row)
            .eq('id', periodId)
            .select()
            .single()
        );
      } else {
        const user = await sessionUser();

        saved = unwrap(
          await sb
            .from('temporary_periods')
            .insert({
              ...row,
              created_by: user.id
            })
            .select()
            .single()
        );
      }

      invalidate();
      return mapTemporaryPeriodLegacy(saved);
    }

    async function extendTemporaryPeriod(payload = {}) {
      const periodId =
        payload.ID_Periodo ||
        payload.ID_Temporal ||
        payload.periodId ||
        payload.period_id;

      const newUntil = String(
        payload.Hasta ||
        payload.hasta ||
        payload.endsAt ||
        ''
      ).trim();

      if (!periodId) {
        throw new Error('Período no encontrado.');
      }

      const period = unwrap(
        await sb
          .from('temporary_periods')
          .select('*')
          .eq('id', periodId)
          .single()
      );

      if (!period) {
        throw new Error('Período no encontrado.');
      }

      if (period.state === 'Anulado') {
        throw new Error('No se puede prorrogar un período anulado.');
      }

      if (!newUntil || newUntil <= asDate(period.ends_at)) {
        throw new Error(
          'La nueva fecha debe ser posterior a la fecha final actual.'
        );
      }

      const extra = String(payload.Observaciones || '').trim();

      const observations = [
        period.observations || '',
        extra
      ].filter(Boolean).join(' | ');

      return saveTemporaryPeriod({
        ID_Periodo: period.id,
        ID_Vehiculo: period.vehicle_id,
        MatriculaTemporal: period.temporary_plate,
        Desde: asDate(period.starts_at),
        Hasta: newUntil,
        Observaciones: observations,
        Estado: 'Activo'
      });
    }

    async function deleteTemporaryPeriod(payload = {}) {
      const periodId =
        payload.ID_Periodo ||
        payload.ID_Temporal ||
        payload.periodId ||
        payload.period_id ||
        payload.id;

      if (!periodId) {
        throw new Error('Período no encontrado.');
      }

      const row = unwrap(
        await sb
          .from('temporary_periods')
          .update({ state: 'Anulado' })
          .eq('id', periodId)
          .select()
          .single()
      );

      invalidate();
      return mapTemporaryPeriodLegacy(row);
    }

    return {
      mapPeriod,
      mapTemporaryPeriodLegacy,
      listTemporaryPeriods,
      saveTemporaryPeriod,
      extendTemporaryPeriod,
      deleteTemporaryPeriod
    };
  };
})();
