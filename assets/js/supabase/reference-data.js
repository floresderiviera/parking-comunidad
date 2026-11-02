(() => {
  'use strict';

  window.ParkingSupabaseReferenceData =
    function ParkingSupabaseReferenceData({
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
    }) {
      async function joinedReferenceData() {
        return cached(
          'joinedReferenceData',
          async () => {
            const [
              housing,
              vehicles,
              profiles
            ] = await Promise.all([
              listHousing(),
              listVehicles(),
              profilesById()
            ]);

            return {
              housing,
              vehicles,
              profiles,
              housingById: new Map(
                housing.map(
                  (row) => [
                    row.ID_Vivienda,
                    row
                  ]
                )
              ),
              vehicleById: new Map(
                vehicles.map(
                  (row) => [
                    row.ID_Vehiculo,
                    row
                  ]
                )
              )
            };
          }
        );
      }

      async function closeIncident(
        payload
      ) {
        const data = unwrap(
          await sb.rpc(
            'close_parking_incident',
            {
              p_incident_id:
                payload.id,
              p_action:
                payload.AccionCierre,
              p_comment:
                payload.ComentarioCierre
            }
          )
        );

        invalidate();

        return data;
      }

      async function housingDetail(
        payload
      ) {
        const boot =
          await appBootstrap();

        if (
          !boot.user.IsRoot &&
          !boot.roles.includes('ADMIN')
        ) {
          throw new Error(
            'No tienes permisos para consultar el detalle de viviendas.'
          );
        }

        const [
          refs,
          requests,
          incidents
        ] = await Promise.all([
          joinedReferenceData(),
          listRequests(),
          listIncidents()
        ]);

        const housing =
          refs.housingById.get(
            payload.id
          );

        return {
          housing,
          owner: housing
            ? refs.profiles.get(
                housing.ResponsableUserId
              )
            : null,
          vehicles:
            refs.vehicles.filter(
              (vehicle) =>
                vehicle.ID_Vivienda ===
                payload.id
            ),
          requests:
            requests.filter(
              (request) =>
                request.ID_Vivienda ===
                payload.id
            ),
          incidents:
            incidents.filter(
              (incident) =>
                incident.ID_Vivienda ===
                payload.id
            )
        };
      }

      async function vehicleHistory(
        payload
      ) {
        const boot =
          await appBootstrap();

        if (
          !boot.user.IsRoot &&
          !boot.roles.includes('ADMIN')
        ) {
          throw new Error(
            'No tienes permisos para consultar el historial completo del vehículo.'
          );
        }

        const refs =
          await joinedReferenceData();

        const vehicle =
          refs.vehicleById.get(
            payload.id
          );

        const audits =
          (
            await listAudit()
          ).filter(
            (row) =>
              row.ID_Entidad ===
              payload.id
          );

        return {
          vehicle,
          events:
            audits.map(
              (row) => ({
                type: row.Accion,
                title: row.Entidad,
                date: row.FechaHora,
                user:
                  row.UsuarioNombre,
                detail:
                  row.Observaciones
              })
            )
        };
      }

      return {
        joinedReferenceData,
        closeIncident,
        housingDetail,
        vehicleHistory
      };
    };
})();
