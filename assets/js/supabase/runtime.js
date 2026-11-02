(() => {
  'use strict';

  window.ParkingSupabaseRuntime = function ParkingSupabaseRuntime() {
    const cfg = window.SUPABASE_CONFIG;

    if (
      !cfg?.url ||
      !cfg?.publishableKey ||
      cfg.publishableKey === 'PEGAR_AQUI_PUBLISHABLE_KEY'
    ) {
      throw new Error('Falta configurar la Publishable Key de Supabase.');
    }

    let sb = window.parkingSupabase;

    if (!sb) {
      if (!window.supabase?.createClient) {
        throw new Error('No se pudo cargar supabase-js.');
      }

      sb = window.supabase.createClient(
        cfg.url,
        cfg.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      window.parkingSupabase = sb;
    }

    const CACHE_MS = 15000;
    const cache = new Map();

    let bootstrapCache = null;
    let publicStateCache = null;
    let publicStateCachedAt = 0;

    const cached = async (key, loader, ttl = CACHE_MS) => {
      const hit = cache.get(key);

      if (
        hit &&
        Date.now() - hit.at < ttl
      ) {
        return hit.value;
      }

      const value = await loader();

      cache.set(
        key,
        {
          at: Date.now(),
          value
        }
      );

      return value;
    };

    const invalidate = () => {
      cache.clear();
      bootstrapCache = null;
    };

    const unwrap = (result) => {
      if (result.error) throw result.error;
      return result.data;
    };

    const normalizePlate = (value) => String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    const asDate = (value) => value
      ? String(value).slice(0, 10)
      : '';

    const dataUrlBlob = (dataUrl) => {
      const [head, encoded] = String(dataUrl || '').split(',');

      if (!head || !encoded) {
        throw new Error('La imagen no es válida.');
      }

      const mime =
        head.match(/^data:([^;]+);base64$/)?.[1] ||
        'image/jpeg';

      const bytes = atob(encoded);
      const out = new Uint8Array(bytes.length);

      for (
        let i = 0;
        i < bytes.length;
        i += 1
      ) {
        out[i] = bytes.charCodeAt(i);
      }

      return {
        blob: new Blob(
          [out],
          { type: mime }
        ),
        mime
      };
    };

    async function parkingAdmin(
      action,
      payload = {}
    ) {
      const {
        data: sessionData,
        error: sessionError
      } = await sb.auth.getSession();

      const accessToken =
        sessionData?.session?.access_token;

      if (
        sessionError ||
        !accessToken
      ) {
        throw new Error(
          'La sesión ha caducado. Vuelve a iniciar sesión.'
        );
      }

      const response = await fetch(
        `${cfg.url}/functions/v1/parking-admin`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            apikey: cfg.publishableKey,
            authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            action,
            payload
          }),
          cache: 'no-store'
        }
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.error ||
          'No se pudo completar la operación administrativa.'
        );
      }

      return body;
    }

    async function publicAppState(
      force = false
    ) {
      if (
        !force &&
        publicStateCache &&
        Date.now() - publicStateCachedAt < 5000
      ) {
        return publicStateCache;
      }

      try {
        const data =
          unwrap(
            await sb.rpc(
              'parking_public_state'
            )
          ) || {};

        publicStateCache = data;
        publicStateCachedAt = Date.now();

        return data;
      } catch (_) {
        return {
          maintenance: {
            enabled: false,
            message: ''
          },
          settings:
            window.INITIAL_PUBLIC_SETTINGS ||
            {}
        };
      }
    }

    function setPublicStateCache(value) {
      publicStateCache = value;
      publicStateCachedAt = Date.now();
    }

    async function appBootstrap(
      force = false
    ) {
      if (
        !force &&
        bootstrapCache
      ) {
        return bootstrapCache;
      }

      const data =
        unwrap(
          await sb.rpc(
            'app_bootstrap'
          )
        );

      const profile =
        data.profile ||
        {};

      const memberships =
        data.memberships ||
        [];

      const roles = profile.is_root
        ? [
            ...new Set([
              'ROOT',
              'ADMIN',
              ...(
                data.technical_functional_roles ||
                []
              ).filter(
                (role) => role !== 'ADMIN'
              )
            ])
          ]
        : [
            ...new Set(
              memberships.flatMap(
                (membership) =>
                  membership.roles ||
                  []
              )
            )
          ];

      const settings =
        Object.fromEntries(
          Object.entries(
            data.settings ||
            {}
          )
        );

      bootstrapCache = {
        user: {
          ID_Usuario: profile.user_id,
          Email: profile.email || '',
          Nombre:
            profile.name ||
            profile.email ||
            '',
          Rol: roles.join(','),
          Estado:
            profile.state ||
            'Activo',
          IsRoot: !!profile.is_root,
          CanConfigure:
            !!profile.is_root ||
            roles.includes('ADMIN'),
          CanSystem:
            !!profile.is_root
        },
        roles,
        communityId:
          data.community_id,
        dwelling:
          data.dwelling,
        settings,
        provider: 'SUPABASE',
        environment: 'staging'
      };

      return bootstrapCache;
    }

    return {
      sb,
      cached,
      invalidate,
      unwrap,
      normalizePlate,
      asDate,
      dataUrlBlob,
      parkingAdmin,
      publicAppState,
      setPublicStateCache,
      appBootstrap
    };
  };
})();
