(() => {
  'use strict';

  window.ParkingSupabaseAuth = ({
    sb,
    unwrap,
    invalidate,
    appBootstrap
  }) => {
    async function sessionUser() {
      const { data, error } =
        await sb.auth.getUser();

      if (error || !data?.user) {
        throw new Error(
          'La sesión ha caducado. Vuelve a iniciar sesión.'
        );
      }

      return data.user;
    }

    function resetRedirectTo() {
      return (
        location.origin +
        location.pathname +
        '?resetPassword=1'
      );
    }

    async function login(email, password) {
      const response = await fetch(
        `${window.SUPABASE_CONFIG.url}/functions/v1/legacy-auth-migrate`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            apikey:
              window.SUPABASE_CONFIG.publishableKey
          },
          body: JSON.stringify({
            email,
            password
          }),
          cache: 'no-store'
        }
      );

      const body =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !body.session?.access_token ||
        !body.session?.refresh_token
      ) {
        throw new Error(
          body.error ||
          'Credenciales no válidas.'
        );
      }

      unwrap(
        await sb.auth.setSession({
          access_token:
            body.session.access_token,
          refresh_token:
            body.session.refresh_token
        })
      );

      const boot =
        await appBootstrap(true);

      if (boot.user.IsRoot) {
        await sb.rpc(
          'record_root_session_event',
          {
            p_action: 'LOGIN'
          }
        );
      }

      return {
        token:
          body.session.access_token,
        user: boot.user,
        migrated: !!body.migrated
      };
    }

    async function requestPasswordReset(
      emailValue
    ) {
      const email =
        String(emailValue || '')
          .trim()
          .toLowerCase();

      if (
        !email ||
        !/^\S+@\S+\.\S+$/.test(email)
      ) {
        throw new Error(
          'Introduce un email válido.'
        );
      }

      const { error } =
        await sb.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              resetRedirectTo()
          }
        );

      if (error) {
        throw new Error(
          'No se pudo solicitar el restablecimiento. Inténtalo de nuevo.'
        );
      }

      return { ok: true };
    }

    async function completePasswordReset(
      passwordValue
    ) {
      const password =
        String(passwordValue || '');

      if (
        password.length < 8 ||
        !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(
          password
        ) ||
        !/\d/.test(password)
      ) {
        throw new Error(
          'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
        );
      }

      const session =
        await sb.auth.getSession();

      if (
        session.error ||
        !session.data.session
      ) {
        throw new Error(
          'El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.'
        );
      }

      const updated =
        await sb.auth.updateUser({
          password
        });

      if (updated.error) {
        throw new Error(
          updated.error.message ||
          'No se pudo actualizar la contraseña.'
        );
      }

      return { ok: true };
    }

    async function logout() {
      try {
        const boot =
          await appBootstrap();

        if (boot.user.IsRoot) {
          await sb.rpc(
            'record_root_session_event',
            {
              p_action: 'LOGOUT'
            }
          );
        }
      } catch (_) {}

      invalidate();

      unwrap(
        await sb.auth.signOut()
      );

      return true;
    }

    function bindAuthState() {
      sb.auth.onAuthStateChange(
        (event, session) => {
          if (session?.access_token) {
            localStorage.setItem(
              'parking_token',
              session.access_token
            );
          }

          if (event === 'SIGNED_OUT') {
            localStorage.removeItem(
              'parking_token'
            );

            invalidate();
          }
        }
      );
    }

    return {
      sessionUser,
      login,
      requestPasswordReset,
      completePasswordReset,
      logout,
      bindAuthState
    };
  };
})();
