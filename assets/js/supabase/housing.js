(() => {
  'use strict';

  window.ParkingSupabaseHousing = ({
    sb,
    unwrap,
    invalidate,
    cached,
    profilesById
  }) => {
    if (!sb || !unwrap || !invalidate || !cached || !profilesById) {
      throw new Error('ParkingSupabaseHousing: faltan dependencias.');
    }

    function mapHousing(row, owner = null) {
      return {
        ID_Vivienda: row.id,
        CommunityId: row.community_id,
        Vivienda: row.display_name || '',
        Bloque: row.block || '',
        Planta: row.floor || '',
        Apartamento: row.apartment || '',
        Responsable: owner?.email || '',
        Propietario: owner?.name || owner?.email || '',
        ResponsableUserId: row.responsible_user_id || '',
        Estado: row.state === 'Activo' ? 'Activa' : 'Inactiva',
        Observaciones: row.observations || ''
      };
    }

    async function listHousing() {
      return cached('housing', async () => {
        const [rows, profiles] = await Promise.all([
          unwrap(
            await sb
              .from('dwellings')
              .select('*')
              .order('block')
              .order('floor')
              .order('apartment')
          ) || [],
          profilesById()
        ]);

        return rows.map((row) =>
          mapHousing(
            row,
            profiles.get(row.responsible_user_id)
          )
        );
      });
    }

    async function saveHousing(payload) {
      const row = unwrap(
        await sb.rpc('save_parking_housing', {
          p_payload: payload || {}
        })
      );

      invalidate();

      const profiles = await profilesById();

      return mapHousing(
        row,
        profiles.get(row.responsible_user_id)
      );
    }

    return {
      mapHousing,
      listHousing,
      saveHousing
    };
  };
})();
