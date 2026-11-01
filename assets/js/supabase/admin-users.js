(() => {
  'use strict';

  window.ParkingSupabaseAdminUsers = ({
    parkingAdmin,
    invalidate
  }) => {
    function resetRedirectTo() {
      return (
        location.origin +
        location.pathname +
        '?resetPassword=1'
      );
    }

    async function saveUser(payload = {}) {
      const data = await parkingAdmin(
        'saveUser',
        {
          ...payload,
          AccessRedirectTo: resetRedirectTo()
        }
      );

      invalidate();

      return data;
    }

    function adminGenerateTemporaryPassword(
      payload = {}
    ) {
      return parkingAdmin(
        'generateTemporaryPassword',
        {
          id:
            payload.id ||
            payload.ID_Usuario
        }
      );
    }

    function adminSendPasswordReset(
      payload = {}
    ) {
      return parkingAdmin(
        'sendPasswordReset',
        {
          id:
            payload.id ||
            payload.ID_Usuario,
          redirectTo: resetRedirectTo()
        }
      );
    }

    function closeUserSessions(
      payload = {}
    ) {
      return parkingAdmin(
        'closeSessions',
        {
          id:
            payload.id ||
            payload.ID_Usuario
        }
      );
    }

    return {
      saveUser,
      adminGenerateTemporaryPassword,
      adminSendPasswordReset,
      closeUserSessions
    };
  };
})();
