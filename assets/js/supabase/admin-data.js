(() => {
  'use strict';

  window.ParkingSupabaseAdminData = ({
    listUsers,
    formOptions,
    listHousing,
    listVehicles,
    listRequests,
    listIncidents
  }) => {
    async function managerData(
      payload = {}
    ) {
      const kind = payload.kind;

      if (kind === 'users') {
        const [rows, options] =
          await Promise.all([
            listUsers(),
            formOptions()
          ]);

        return {
          rows,
          options
        };
      }

      if (kind === 'housing') {
        const [rows, options] =
          await Promise.all([
            listHousing(),
            formOptions()
          ]);

        return {
          rows,
          options
        };
      }

      if (kind === 'vehicles') {
        const [
          rows,
          options,
          requests,
          incidents
        ] = await Promise.all([
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

      throw new Error(
        `managerData no soporta el tipo "${kind || ''}".`
      );
    }

    return {
      managerData
    };
  };
})();
