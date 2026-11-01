(() => {
  'use strict';

  window.ParkingSupabaseProfile = ({
    sb,
    unwrap,
    invalidate,
    appBootstrap,
    sessionUser
  }) => {
    async function updateProfile(
      payload = {}
    ) {
      const user =
        await sessionUser();

      unwrap(
        await sb
          .from('profiles')
          .update({
            name:
              String(
                payload.Nombre || ''
              ).trim()
          })
          .eq(
            'user_id',
            user.id
          )
      );

      invalidate();

      return appBootstrap(true);
    }

    async function changePassword(
      payload = {}
    ) {
      const boot =
        await appBootstrap();

      if (boot.user.IsRoot) {
        throw new Error(
          'La contraseña técnica ROOT se gestiona mediante el procedimiento seguro de administración.'
        );
      }

      const currentPassword =
        String(
          payload.currentPassword ||
          payload.PasswordActual ||
          ''
        );

      const newPassword =
        String(
          payload.newPassword ||
          payload.password ||
          payload.PasswordNueva ||
          ''
        );

      if (!currentPassword) {
        throw new Error(
          'Introduce tu contraseña actual.'
        );
      }

      if (
        newPassword.length < 8 ||
        !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(
          newPassword
        ) ||
        !/\d/.test(newPassword)
      ) {
        throw new Error(
          'La contraseña nueva debe tener al menos 8 caracteres, una letra y un número.'
        );
      }

      const reauth =
        await sb.auth.signInWithPassword({
          email: boot.user.Email,
          password: currentPassword
        });

      if (
        reauth.error ||
        !reauth.data.session
      ) {
        throw new Error(
          'La contraseña actual no es correcta.'
        );
      }

      unwrap(
        await sb.auth.updateUser({
          password: newPassword
        })
      );

      return true;
    }

    return {
      updateProfile,
      changePassword
    };
  };
})();
