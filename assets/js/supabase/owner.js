(() => {
  'use strict';

  window.ParkingSupabaseOwner = ({
    sb,
    unwrap,
    appBootstrap,
    profilesById,
    mapHousing,
    mapVehicle,
    mapRequest,
    listIncidents
  }) => {
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

      const ownerUserId = await ownerScopeUserId();

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

    return {
      ownerScopeUserId,
      ownerBundle
    };
  };
})();
