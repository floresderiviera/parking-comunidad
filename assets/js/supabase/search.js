(() => {
  'use strict';

  window.ParkingSupabaseSearch = ({
    appBootstrap,
    listHousing,
    listVehicles,
    listIncidents,
    listRequests
  }) => {
    async function globalSearch(payload) {
      const query = String(payload.q || '').trim().toLowerCase();
      const boot = await appBootstrap();
      const canAdmin =
        boot.user.IsRoot ||
        boot.roles.includes('ADMIN');

      const [housing, vehicles, incidents, requests] =
        await Promise.all([
          canAdmin ? listHousing() : Promise.resolve([]),
          listVehicles(),
          listIncidents(),
          canAdmin ? listRequests() : Promise.resolve([])
        ]);

      const rows = [];

      if (canAdmin) {
        housing
          .filter((h) =>
            Object.values(h)
              .join(' ')
              .toLowerCase()
              .includes(query)
          )
          .slice(0, 8)
          .forEach((h) =>
            rows.push({
              type: 'Vivienda',
              title: h.Vivienda,
              detail: h.Responsable,
              view: 'housingDetail',
              id: h.ID_Vivienda
            })
          );
      }

      vehicles
        .filter((v) =>
          Object.values(v)
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
        .slice(0, 8)
        .forEach((v) =>
          rows.push({
            type: 'Vehículo',
            title: v.MatriculaHabitual,
            detail: `${v.Marca} ${v.Modelo}`.trim(),
            view: 'vehicleDetail',
            id: v.ID_Vehiculo,
            search: v.MatriculaHabitual
          })
        );

      incidents
        .filter((i) =>
          Object.values(i)
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
        .slice(0, 8)
        .forEach((i) =>
          rows.push({
            type: 'Incidencia',
            title: i.Tipo,
            detail: i.MatriculaObservada,
            view: 'incidents',
            id: i.ID_Incidencia
          })
        );

      if (canAdmin) {
        requests
          .filter((r) =>
            Object.values(r)
              .join(' ')
              .toLowerCase()
              .includes(query)
          )
          .slice(0, 8)
          .forEach((r) =>
            rows.push({
              type: 'Solicitud',
              title: r.Tipo,
              detail: r.MatriculaHabitual,
              view: 'requests',
              id: r.ID_Solicitud
            })
          );
      }

      return rows.slice(0, 20);
    }

    return {
      globalSearch
    };
  };
})();
