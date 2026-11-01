(() => {
  'use strict';

  window.ParkingSupabaseSystem = ({
    sb,
    unwrap,
    sessionUser,
    parkingAdmin,
    appBootstrap,
    invalidate,
    consistencyReport,
    setPublicStateCache
  }) => {
    let systemStatusCache = null;
    let systemStatusCachedAt = 0;

    const SYSTEM_STATUS_TTL_MS = 45000;

    function perfLevel(ms) {
      if (ms > 1800) return 'slow';
      if (ms > 800) return 'warn';
      return 'good';
    }

    async function timed(label, loader) {
      const started = performance.now();

      try {
        const value = await loader();
        const ms = Math.max(
          1,
          Math.round(performance.now() - started)
        );

        return {
          label,
          ok: true,
          ms,
          level: perfLevel(ms),
          value
        };
      } catch (error) {
        const ms = Math.max(
          1,
          Math.round(performance.now() - started)
        );

        return {
          label,
          ok: false,
          ms,
          level: 'slow',
          error
        };
      }
    }

    async function edgeOptions(functionName) {
      const response = await fetch(
        `${window.SUPABASE_CONFIG.url}/functions/v1/${functionName}`,
        {
          method: 'OPTIONS',
          cache: 'no-store'
        }
      );

      if (
        !response.ok &&
        response.status !== 204
      ) {
        throw new Error(
          `${functionName}: HTTP ${response.status}`
        );
      }

      return true;
    }

    function clearSystemStatusCache() {
      systemStatusCache = null;
      systemStatusCachedAt = 0;
    }

    async function systemStatus(payload = {}) {
      const force = !!payload.force;

      if (
        !force &&
        systemStatusCache &&
        Date.now() - systemStatusCachedAt <
          SYSTEM_STATUS_TTL_MS
      ) {
        return {
          ...systemStatusCache,
          cached: true
        };
      }

      const overallStarted = performance.now();

      const [
        database,
        auth,
        rls,
        adminEdge,
        legacyEdge
      ] = await Promise.all([
        timed(
          'Base de datos',
          async () =>
            unwrap(
              await sb.rpc('root_system_status')
            )
        ),

        timed(
          'Supabase Auth',
          async () => {
            const user = await sessionUser();

            if (!user?.id) {
              throw new Error(
                'La sesión de Supabase Auth no pudo verificarse.'
              );
            }

            return user;
          }
        ),

        timed(
          'RLS / bootstrap',
          async () => {
            const boot = await appBootstrap(true);

            if (!boot.user.IsRoot) {
              throw new Error(
                'ROOT no verificado por las políticas de acceso.'
              );
            }

            return boot;
          }
        ),

        timed(
          'parking-admin',
          async () =>
            parkingAdmin('systemPing', {})
        ),

        timed(
          'legacy-auth-migrate',
          async () =>
            edgeOptions('legacy-auth-migrate')
        )
      ]);

      if (!database.ok) {
        throw database.error;
      }

      const status = database.value || {};

      const services = [
        {
          label: 'Base de datos',
          ok: database.ok,
          detail: database.ok
            ? 'PostgreSQL / Supabase disponible'
            : String(
                database.error?.message ||
                'No disponible'
              ),
          ms: database.ms,
          level: database.level
        },
        {
          label: 'Supabase Auth',
          ok: auth.ok,
          detail: auth.ok
            ? 'Sesión autenticada válida'
            : String(
                auth.error?.message ||
                'No disponible'
              ),
          ms: auth.ms,
          level: auth.level
        },
        {
          label: 'RLS / bootstrap',
          ok: rls.ok,
          detail: rls.ok
            ? 'Permisos ROOT y bootstrap verificados'
            : String(
                rls.error?.message ||
                'No disponible'
              ),
          ms: rls.ms,
          level: rls.level
        },
        {
          label: 'Edge · parking-admin',
          ok: adminEdge.ok,
          detail: adminEdge.ok
            ? 'Función autenticada disponible'
            : String(
                adminEdge.error?.message ||
                'No disponible'
              ),
          ms: adminEdge.ms,
          level: adminEdge.level
        },
        {
          label: 'Edge · legacy-auth-migrate',
          ok: legacyEdge.ok,
          detail: legacyEdge.ok
            ? 'Endpoint disponible'
            : String(
                legacyEdge.error?.message ||
                'No disponible'
              ),
          ms: legacyEdge.ms,
          level: legacyEdge.level
        }
      ];

      const totalMs = Math.max(
        1,
        Math.round(
          performance.now() - overallStarted
        )
      );

      const result = {
        ok: services.every(item => item.ok),
        backendVersion:
          status.backendVersion ||
          'Supabase migration 129',
        schemaVersion:
          status.schemaVersion ||
          '20261029012900',
        environment:
          location.pathname.includes(
            '/preproduccion/'
          )
            ? 'PREPRODUCCIÓN'
            : 'PRODUCCIÓN',
        hosting: 'GitHub Pages',
        repository:
          'floresderiviera/parking-comunidad',
        timeZone: 'Europe/Madrid',
        checkedAt:
          status.checkedAt ||
          new Date().toISOString(),
        services,
        performance: {
          totalMs
        },
        counts: status,
        maintenance:
          status.maintenance || {
            enabled: false,
            message: ''
          },
        integrations:
          status.integrations || {}
      };

      systemStatusCache = result;
      systemStatusCachedAt = Date.now();

      return result;
    }

    async function systemSetMaintenance(
      payload = {}
    ) {
      const result = unwrap(
        await sb.rpc(
          'parking_set_maintenance',
          {
            p_enabled: !!payload.enabled,
            p_message: String(
              payload.message || ''
            )
          }
        )
      );

      setPublicStateCache(result);

      invalidate();
      clearSystemStatusCache();

      return result;
    }

    function systemLegacyBridgeStatus() {
      return parkingAdmin(
        'legacyBridgeStatus',
        {}
      );
    }

    function systemLegacyBridgeAction(
      payload = {}
    ) {
      return parkingAdmin(
        'legacyBridgeCommand',
        {
          domain: payload.domain,
          command: payload.command,
          args: payload.args || {}
        }
      );
    }

    function systemLegacyBridgeCommandStatus(
      payload = {}
    ) {
      return parkingAdmin(
        'legacyBridgeCommandStatus',
        {
          id: payload.id
        }
      );
    }

    function systemBackupStatus() {
      return parkingAdmin(
        'legacyBackupStatus',
        {}
      );
    }

    function systemBackupRunNow() {
      return parkingAdmin(
        'legacyBackupRunNow',
        {}
      );
    }

    async function systemRoundTripPing() {
      const ping = await timed(
        'Ping',
        async () =>
          unwrap(
            await sb.rpc(
              'parking_system_ping'
            )
          )
      );

      if (!ping.ok) {
        throw ping.error;
      }

      return {
        serverMs: ping.ms,
        checkedAt:
          ping.value?.checkedAt ||
          new Date().toISOString()
      };
    }

    async function systemDiagnostics(
      payload = {}
    ) {
      const mode = String(
        payload.mode || 'quick'
      );

      const started = performance.now();
      const tests = [];

      const database = await timed(
        'Base de datos',
        async () =>
          unwrap(
            await sb.rpc(
              'root_system_diagnostics'
            )
          )
      );

      tests.push({
        label: database.label,
        detail: database.ok
          ? `Esquema ${
              database.value?.schemaVersion ||
              'Supabase'
            }`
          : String(
              database.error?.message ||
              'Error'
            ),
        ok: database.ok,
        ms: database.ms,
        level: database.level
      });

      const auth = await timed(
        'Supabase Auth',
        async () => {
          const user = await sessionUser();

          if (!user?.id) {
            throw new Error(
              'Sesión no válida'
            );
          }

          return user;
        }
      );

      tests.push({
        label: auth.label,
        detail: auth.ok
          ? 'Sesión autenticada válida'
          : String(
              auth.error?.message ||
              'Error'
            ),
        ok: auth.ok,
        ms: auth.ms,
        level: auth.level
      });

      const rls = await timed(
        'RLS / bootstrap',
        async () => {
          const boot =
            await appBootstrap(true);

          if (!boot.user.IsRoot) {
            throw new Error(
              'ROOT no verificado'
            );
          }

          return boot;
        }
      );

      tests.push({
        label: rls.label,
        detail: rls.ok
          ? 'Permisos ROOT y bootstrap correctos'
          : String(
              rls.error?.message ||
              'Error'
            ),
        ok: rls.ok,
        ms: rls.ms,
        level: rls.level
      });

      const admin = await timed(
        'Edge · parking-admin',
        async () =>
          parkingAdmin(
            'systemPing',
            {}
          )
      );

      tests.push({
        label: admin.label,
        detail: admin.ok
          ? 'Disponible'
          : String(
              admin.error?.message ||
              'Error'
            ),
        ok: admin.ok,
        ms: admin.ms,
        level: admin.level
      });

      const legacy = await timed(
        'Edge · legacy-auth-migrate',
        async () =>
          edgeOptions(
            'legacy-auth-migrate'
          )
      );

      tests.push({
        label: legacy.label,
        detail: legacy.ok
          ? 'Endpoint disponible'
          : String(
              legacy.error?.message ||
              'Error'
            ),
        ok: legacy.ok,
        ms: legacy.ms,
        level: legacy.level
      });

      if (mode === 'full') {
        const consistency = await timed(
          'Consistencia',
          async () =>
            consistencyReport()
        );

        const issues = consistency.ok
          ? Number(
              consistency.value?.errors ||
              0
            ) +
            Number(
              consistency.value?.warnings ||
              0
            )
          : null;

        tests.push({
          label: consistency.label,
          detail: consistency.ok
            ? `${issues ?? 0} observaciones detectadas`
            : String(
                consistency.error?.message ||
                'Error'
              ),
          ok: consistency.ok,
          ms: consistency.ms,
          level: consistency.level
        });
      }

      const totalMs = Math.max(
        1,
        Math.round(
          performance.now() - started
        )
      );

      const ok = tests.every(
        test => test.ok
      );

      return {
        checkedAt:
          new Date().toISOString(),
        totalMs,
        level: ok
          ? perfLevel(totalMs)
          : 'slow',
        tests
      };
    }

    function systemPerformanceHistory() {
      return {
        health: [],
        history: []
      };
    }

    function systemRecordClientPerformance() {
      return {
        ok: true
      };
    }

    function systemSheetsRealBenchmark() {
      throw new Error(
        'Google Sheets ya no es el backend de la aplicación. Las integraciones heredadas de correo y documentos se controlan por separado.'
      );
    }

    return {
      systemStatus,
      systemSetMaintenance,
      systemLegacyBridgeStatus,
      systemLegacyBridgeAction,
      systemLegacyBridgeCommandStatus,
      systemBackupStatus,
      systemBackupRunNow,
      systemRoundTripPing,
      systemDiagnostics,
      systemPerformanceHistory,
      systemRecordClientPerformance,
      systemSheetsRealBenchmark
    };
  };
})();
