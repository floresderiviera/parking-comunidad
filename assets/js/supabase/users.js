(() => {
  'use strict';

  window.ParkingSupabaseUsers = ({
    sb,
    unwrap,
    cached,
    listHousing
  }) => {
    if (!sb || !unwrap || !cached || !listHousing) {
      throw new Error('ParkingSupabaseUsers: faltan dependencias.');
    }

    async function profilesById() {
      return cached('profilesById', async () => {
        const rows =
          unwrap(
            await sb
              .from('profiles')
              .select('user_id,email,name,state,last_access_at,is_root')
          ) || [];

        return new Map(
          rows.map((row) => [row.user_id, row])
        );
      });
    }

    async function listUsers() {
      return cached('users', async () => {
        const [profiles, memberships, housing] = await Promise.all([
          unwrap(
            await sb
              .from('profiles')
              .select('user_id,email,name,state,last_access_at,is_root')
          ) || [],
          unwrap(
            await sb
              .from('community_members')
              .select('user_id,roles,state')
          ) || [],
          listHousing()
        ]);

        const membershipByUser = new Map(
          memberships.map((row) => [row.user_id, row])
        );

        return profiles
          .filter((profile) => !profile.is_root)
          .map((profile) => {
            const member = membershipByUser.get(profile.user_id);
            const assigned = housing.filter(
              (h) => h.ResponsableUserId === profile.user_id
            );

            return {
              ID_Usuario: profile.user_id,
              Email: profile.email || '',
              Nombre: profile.name || profile.email || '',
              Rol: (member?.roles || []).join(','),
              Estado: profile.state || member?.state || 'Activo',
              LastAccessAt: profile.last_access_at || '',
              ViviendasAsignadas: assigned
                .map((h) => h.Vivienda)
                .join(' · ')
            };
          });
      });
    }

    async function formOptions() {
      const [housing, users] = await Promise.all([
        listHousing(),
        listUsers()
      ]);

      return {
        housing,
        owners: users
      };
    }

    return {
      profilesById,
      listUsers,
      formOptions
    };
  };
})();
