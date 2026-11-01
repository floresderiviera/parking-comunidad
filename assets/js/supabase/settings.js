(() => {
  'use strict';

  window.ParkingSupabaseSettings = ({
    sb,
    unwrap,
    invalidate,
    appBootstrap,
    dataUrlBlob
  }) => {
    const SETTING_KEYS = [
      'NombreOficial',
      'Descripcion',
      'EmailContacto',
      'Direccion',
      'LogoUrl',
      'IncidenciaAtencionDesde',
      'IncidenciaAltaDesde',
      'IncidenciaCriticaDesde',
      'ColorPrincipal',
      'ColorSecundario',
      'ColorAcento'
    ];

    const NUMERIC_KEYS = new Set([
      'IncidenciaAtencionDesde',
      'IncidenciaAltaDesde',
      'IncidenciaCriticaDesde'
    ]);

    function normalizeSettingsPayload(payload = {}) {
      const out = {};

      for (const key of SETTING_KEYS) {
        if (!(key in payload)) continue;

        if (NUMERIC_KEYS.has(key)) {
          const value = Number(payload[key]);

          if (!Number.isFinite(value)) {
            throw new Error(`El valor de ${key} no es válido.`);
          }

          out[key] = Math.trunc(value);
          continue;
        }

        out[key] = String(payload[key] ?? '').trim();
      }

      const attention = out.IncidenciaAtencionDesde;
      const high = out.IncidenciaAltaDesde;
      const critical = out.IncidenciaCriticaDesde;

      if (
        attention !== undefined &&
        high !== undefined &&
        critical !== undefined &&
        !(
          attention >= 2 &&
          high > attention &&
          critical > high
        )
      ) {
        throw new Error(
          'Los umbrales de incidencias deben cumplir: Atención >= 2, Alta > Atención y Crítica > Alta.'
        );
      }

      for (const key of [
        'ColorPrincipal',
        'ColorSecundario',
        'ColorAcento'
      ]) {
        if (
          key in out &&
          out[key] &&
          !/^#[0-9a-f]{6}$/i.test(out[key])
        ) {
          throw new Error(
            `El color ${key} debe tener formato hexadecimal #RRGGBB.`
          );
        }
      }

      return out;
    }

    async function getSettings() {
      return (await appBootstrap()).settings;
    }

    async function saveSettings(payload = {}) {
      const boot = await appBootstrap();

      if (
        !boot.user.IsRoot &&
        !boot.roles.includes('ADMIN')
      ) {
        throw new Error(
          'No tienes permisos para modificar la configuración.'
        );
      }

      const settings = normalizeSettingsPayload(payload);

      const rows = Object.entries(settings).map(
        ([key, value]) => ({
          community_id: boot.communityId,
          key,
          value
        })
      );

      if (rows.length) {
        const result = await sb
          .from('community_settings')
          .upsert(rows, {
            onConflict: 'community_id,key'
          });

        if (result.error) {
          throw result.error;
        }
      }

      invalidate();

      const refreshed = await appBootstrap(true);

      return refreshed.settings;
    }

    async function uploadLogo(payload = {}) {
      const boot = await appBootstrap();

      if (
        !boot.user.IsRoot &&
        !boot.roles.includes('ADMIN')
      ) {
        throw new Error(
          'No tienes permisos para modificar el logo.'
        );
      }

      const { blob, mime } =
        dataUrlBlob(payload.dataUrl);

      if (
        !/^image\/(png|jpeg|jpg|webp|gif)$/i.test(
          mime
        )
      ) {
        throw new Error(
          'El archivo de logo no es una imagen válida. Usa PNG, JPG, WEBP o GIF.'
        );
      }

      if (blob.size > 3 * 1024 * 1024) {
        throw new Error(
          'El logo no puede superar 3 MB una vez optimizado.'
        );
      }

      const normalizedMime =
        mime.toLowerCase() === 'image/jpg'
          ? 'image/jpeg'
          : mime.toLowerCase();

      const extension =
        normalizedMime === 'image/jpeg'
          ? 'jpg'
          : normalizedMime.split('/')[1];

      const objectPath =
        `${boot.communityId}/logos/` +
        `logo-${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const uploaded = await sb.storage
        .from('parking-public')
        .upload(objectPath, blob, {
          cacheControl: '3600',
          contentType: normalizedMime,
          upsert: false
        });

      if (uploaded.error) {
        throw uploaded.error;
      }

      const publicUrl = sb.storage
        .from('parking-public')
        .getPublicUrl(objectPath)
        .data.publicUrl;

      return {
        id: objectPath,
        url: publicUrl,
        name:
          objectPath.split('/').pop() ||
          'logo'
      };
    }

    async function consistencyReport() {
      return unwrap(
        await sb.rpc(
          'parking_consistency_report'
        )
      );
    }

    async function consistencyFix(payload = {}) {
      const result = unwrap(
        await sb.rpc(
          'parking_consistency_fix',
          {
            p_code: payload.code,
            p_vehicle_id:
              payload.vehicleId
          }
        )
      );

      invalidate();

      return result;
    }

    return {
      getSettings,
      saveSettings,
      uploadLogo,
      consistencyReport,
      consistencyFix
    };
  };
})();
