(() => {
  'use strict';

  window.ParkingSupabaseControl = ({
    sb,
    unwrap,
    joinedReferenceData,
    mapVehicle,
    mapHousing,
    mapPeriod,
    normalizePlate,
    listControlOpenIncidents,
    controlOpenIncidentsFromList
  }) => {
    async function parkingControl(kind, rawValue) {
      let value = String(rawValue || '').trim();

      if (kind === 'QR') {
        try {
          value =
            new URL(value).searchParams.get('q') ||
            value;
        } catch (_) {}
      }

      const result = unwrap(
        await sb.rpc('resolve_parking_control', {
          p_kind: kind,
          p_value: value
        })
      );

      const refs = await joinedReferenceData();

      const vehicle = mapVehicle(
        result.vehicle,
        result.temporaryPeriod
          ? [result.temporaryPeriod]
          : []
      );

      const housing = result.housing
        ? mapHousing(
            result.housing,
            refs.profiles.get(
              result.housing.responsible_user_id
            )
          )
        : null;

      const owner =
        result.housing?.responsible_user_id
          ? refs.profiles.get(
              result.housing.responsible_user_id
            )
          : null;

      const controlPlate =
        result.currentPlate ||
        (
          kind === 'MATRICULA'
            ? value
            : vehicle?.MatriculaHabitual || ''
        );

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
        query:
          kind === 'MATRICULA'
            ? normalizePlate(value)
            : '',
        vehicle,
        housing,
        owner: owner
          ? {
              Nombre: owner.name,
              Email: owner.email
            }
          : null,
        currentPlate: result.currentPlate || '',
        isTemporary: !!result.isTemporary,
        temporaryPeriod:
          mapPeriod(result.temporaryPeriod),
        longStay: result.longStay
          ? {
              FechaInicio:
                result.longStay.start_date,
              FechaFin:
                result.longStay.end_date
            }
          : null,
        openIncidents
      };
    }

    return {
      parkingControl
    };
  };
})();
