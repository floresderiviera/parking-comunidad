(() => {
  'use strict';

  window.ParkingSupabaseDashboard = ({
    sb,
    unwrap,
    asDate,
    listHousing,
    listVehicles,
    listRequests,
    listIncidents
  }) => {
    if (
      !sb ||
      !unwrap ||
      !asDate ||
      !listHousing ||
      !listVehicles ||
      !listRequests ||
      !listIncidents
    ) {
      throw new Error('ParkingSupabaseDashboard: faltan dependencias.');
    }

    async function dashboard() {
      const [
        summary,
        housing,
        vehicles,
        requests,
        incidents,
        periods
      ] = await Promise.all([
        unwrap(await sb.rpc('app_dashboard')),
        listHousing(),
        listVehicles(),
        listRequests(),
        listIncidents(),
        unwrap(
          await sb
            .from('temporary_periods')
            .select('*')
            .neq('state', 'Anulado')
        ) || []
      ]);

      const activeHousingRows =
        housing.filter((h) => h.Estado === 'Activa');

      const activeHousingIds =
        new Set(activeHousingRows.map((h) => h.ID_Vivienda));

      const housingById =
        new Map(housing.map((h) => [h.ID_Vivienda, h]));

      const vehicleById =
        new Map(vehicles.map((v) => [v.ID_Vehiculo, v]));

      const activeVehicles =
        vehicles.filter((v) => v.Estado === 'Activo');

      const activeCars =
        activeVehicles.filter((v) => v.Tipo !== 'Moto');

      const activeMotorcycles =
        activeVehicles.filter((v) => v.Tipo === 'Moto').length;

      const activeSlotVehicles =
        activeCars.filter((v) =>
          ['1', '2'].includes(String(v.Slot))
        );

      const occupiedSlots =
        activeSlotVehicles.filter((v) =>
          activeHousingIds.has(v.ID_Vivienda)
        ).length;

      const slotCapacity = activeHousingRows.length * 2;

      const openIncidents =
        incidents.filter((i) => i.Estado !== 'Cerrada');

      const pendingRequests =
        requests.filter((r) =>
          ['Abierta', 'Pendiente'].includes(r.Estado)
        );

      const activeWithoutQrRows =
        activeSlotVehicles.filter((v) => v.QR_Estado !== 'Activo');

      const qrVehicles =
        vehicles.filter(
          (v) =>
            v.Tipo !== 'Moto' &&
            ['1', '2'].includes(String(v.Slot))
        );

      const revoked =
        qrVehicles.filter((v) => v.QR_Estado === 'Revocado').length;

      const now = Date.now();
      const cutoff = now - 30 * 86400000;
      const previousCutoff = now - 60 * 86400000;

      const timestamp = (value) => {
        const parsed = Date.parse(String(value || ''));
        return Number.isFinite(parsed) ? parsed : 0;
      };

      const isRecent = (value) =>
        timestamp(value) >= cutoff;

      const isPrevious = (value) =>
        timestamp(value) >= previousCutoff &&
        timestamp(value) < cutoff;

      const incidents30 =
        incidents.filter((row) => isRecent(row.FechaHora)).length;

      const requests30 =
        requests.filter((row) => isRecent(row.FechaHora)).length;

      const newVehicles30 =
        vehicles.filter((row) => isRecent(row.CreatedAt)).length;

      const incidentsPrev30 =
        incidents.filter((row) => isPrevious(row.FechaHora)).length;

      const requestsPrev30 =
        requests.filter((row) => isPrevious(row.FechaHora)).length;

      const newVehiclesPrev30 =
        vehicles.filter((row) => isPrevious(row.CreatedAt)).length;

      const today =
        new Date().toISOString().slice(0, 10);

      const in7 =
        new Date(now + 7 * 86400000)
          .toISOString()
          .slice(0, 10);

      const temporaryCurrent =
        periods.filter((period) => {
          const vehicle = vehicleById.get(period.vehicle_id);

          return (
            vehicle?.Estado === 'Activo' &&
            asDate(period.starts_at) <= today &&
            asDate(period.ends_at) >= today
          );
        });

      const temporaryExpiring7Rows =
        temporaryCurrent.filter(
          (period) =>
            asDate(period.ends_at) >= today &&
            asDate(period.ends_at) <= in7
        );

      const formatShortDate = (value) => {
        const date = new Date(String(value || ''));

        return Number.isNaN(date.getTime())
          ? String(value || '')
          : new Intl.DateTimeFormat(
              'es-ES',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }
            ).format(date);
      };

      const housingLabel = (h) =>
        h
          ? `Bloque ${h.Bloque}, ${h.Planta} ${h.Apartamento}`
          : 'Sin vivienda';

      const attention = [];

      activeWithoutQrRows
        .slice(0, 3)
        .forEach((vehicle) => {
          attention.push({
            type: 'vehicle',
            label:
              `${vehicle.MatriculaHabitual || 'Vehículo'} · QR no válido`,
            detail:
              housingLabel(
                housingById.get(vehicle.ID_Vivienda)
              ),
            vehicleId: vehicle.ID_Vehiculo
          });
        });

      temporaryExpiring7Rows
        .slice()
        .sort((a, b) =>
          String(a.ends_at).localeCompare(String(b.ends_at))
        )
        .slice(0, 3)
        .forEach((period) => {
          const vehicle =
            vehicleById.get(period.vehicle_id);

          attention.push({
            type: 'temporary',
            label:
              `${period.temporary_plate || 'Temporal'} · ` +
              `vence ${formatShortDate(period.ends_at)}`,
            detail:
              `${vehicle?.MatriculaHabitual || 'Vehículo'} · ` +
              `${housingLabel(
                housingById.get(vehicle?.ID_Vivienda)
              )}`,
            vehicleId: vehicle?.ID_Vehiculo || ''
          });
        });

      const openByHousing = new Map();

      openIncidents.forEach((incident) => {
        const vehicle =
          incident.ID_Vehiculo
            ? vehicleById.get(incident.ID_Vehiculo)
            : null;

        const housingId =
          incident.ID_Vivienda ||
          vehicle?.ID_Vivienda ||
          '';

        if (housingId) {
          openByHousing.set(
            housingId,
            (openByHousing.get(housingId) || 0) + 1
          );
        }
      });

      [...openByHousing.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([housingId, count]) => {
          attention.push({
            type: 'housing',
            label:
              housingLabel(housingById.get(housingId)),
            detail:
              `${count} incidencias pendientes`,
            housingId
          });
        });

      const oldestRequest =
        pendingRequests
          .slice()
          .sort((a, b) =>
            String(a.FechaHora)
              .localeCompare(String(b.FechaHora))
          )[0];

      if (oldestRequest) {
        const vehicle =
          vehicleById.get(oldestRequest.ID_Vehiculo);

        const requestLabel =
          oldestRequest.Tipo === 'REACTIVACION_VEHICULO'
            ? 'Activación'
            : oldestRequest.Tipo === 'RENOVACION_QR'
              ? 'Renovación QR'
              : 'Permanencia';

        attention.push({
          type: 'request',
          label:
            `${requestLabel} · ` +
            `${vehicle?.MatriculaHabitual ||
              oldestRequest.MatriculaHabitual ||
              'Vehículo'}`,
          detail:
            `Abierta desde ${formatShortDate(
              oldestRequest.FechaHora
            )}`,
          requestId: oldestRequest.ID_Solicitud
        });
      }

      const oldestIncident =
        openIncidents
          .slice()
          .sort((a, b) =>
            String(a.FechaHora)
              .localeCompare(String(b.FechaHora))
          )[0];

      if (oldestIncident) {
        attention.push({
          type: 'incident',
          label:
            `${oldestIncident.Tipo || 'Incidencia'} · ` +
            `${oldestIncident.MatriculaObservada ||
              'Sin matrícula'}`,
          detail:
            `Pendiente desde ${formatShortDate(
              oldestIncident.FechaHora
            )}`,
          incidentId: oldestIncident.ID_Incidencia
        });
      }

      const ageDays = (value) => {
        const valueTs = timestamp(value);
        return valueTs
          ? Math.floor((now - valueTs) / 86400000)
          : 0;
      };

      pendingRequests
        .filter((row) => ageDays(row.FechaHora) > 3)
        .slice(0, 3)
        .forEach((row) => {
          const vehicle =
            vehicleById.get(row.ID_Vehiculo);

          attention.push({
            type: 'request',
            label:
              `Solicitud > 3 días · ` +
              `${vehicle?.MatriculaHabitual ||
                row.MatriculaHabitual ||
                'Vehículo'}`,
            detail:
              `Abierta ${ageDays(row.FechaHora)} días`,
            requestId: row.ID_Solicitud
          });
        });

      openIncidents
        .filter((row) => ageDays(row.FechaHora) > 7)
        .slice(0, 3)
        .forEach((row) => {
          attention.push({
            type: 'incident',
            label:
              `Incidencia > 7 días · ` +
              `${row.MatriculaObservada ||
                'Sin matrícula'}`,
            detail:
              `${row.Tipo || ''} · ` +
              `${ageDays(row.FechaHora)} días`,
            incidentId: row.ID_Incidencia
          });
        });

      activeSlotVehicles
        .filter(
          (vehicle) =>
            !activeHousingIds.has(vehicle.ID_Vivienda)
        )
        .slice(0, 3)
        .forEach((vehicle) => {
          attention.push({
            type: 'vehicle',
            label:
              `${vehicle.MatriculaHabitual || 'Vehículo'} · ` +
              'vivienda no válida',
            detail:
              'Vehículo activo asociado a vivienda inactiva/inexistente',
            vehicleId: vehicle.ID_Vehiculo
          });
        });

      const slotSeen = new Set();

      activeSlotVehicles.forEach((vehicle) => {
        const key =
          `${vehicle.ID_Vivienda}|${vehicle.Slot}`;

        if (slotSeen.has(key)) {
          attention.push({
            type: 'vehicle',
            label:
              `${vehicle.MatriculaHabitual || 'Vehículo'} · ` +
              'slot duplicado',
            detail:
              `Slot ${vehicle.Slot} duplicado en la vivienda`,
            vehicleId: vehicle.ID_Vehiculo
          });
        }

        slotSeen.add(key);
      });

      return {
        activeHousing: activeHousingRows.length,
        totalHousing: housing.length,
        activeVehicles: activeVehicles.length,
        activeSlotVehicles: activeSlotVehicles.length,
        activeMotorcycles,
        suspendedVehicles:
          vehicles.filter(
            (v) => v.Estado === 'Suspendido'
          ).length,
        inactiveVehicles:
          vehicles.filter(
            (v) => v.Estado === 'Desasignado'
          ).length,
        lowVehicles:
          vehicles.filter(
            (v) => v.Estado === 'Baja'
          ).length,
        occupiedSlots,
        availableSlots:
          Math.max(0, slotCapacity - occupiedSlots),
        slotCapacity,
        pendingRequests: pendingRequests.length,
        openIncidents: openIncidents.length,
        repeatOpenIncidents:
          openIncidents.filter(
            (i) => Number(i.Intentos) > 1
          ).length,
        revoked,
        activeWithoutQr: activeWithoutQrRows.length,
        temporary: temporaryCurrent.length,
        temporaryExpiring7:
          temporaryExpiring7Rows.length,
        incidents30,
        requests30,
        newVehicles30,
        trends: {
          incidents: {
            current: incidents30,
            previous: incidentsPrev30
          },
          requests: {
            current: requests30,
            previous: requestsPrev30
          },
          vehicles: {
            current: newVehicles30,
            previous: newVehiclesPrev30
          }
        },
        attention: attention.slice(0, 20),
        backendSummary: summary
      };
    }

    return {
      dashboard
    };
  };
})();
