(() => {
  'use strict';

  window.ParkingSupabaseEvidence = ({
    sb,
    unwrap,
    dataUrlBlob,
    appBootstrap,
    sessionUser
  }) => {
    if (
      !sb ||
      !unwrap ||
      !dataUrlBlob ||
      !appBootstrap ||
      !sessionUser
    ) {
      throw new Error('ParkingSupabaseEvidence: faltan dependencias.');
    }

    async function evidenceUrl(path) {
      if (!path || !String(path).startsWith('storage:')) {
        return path || '';
      }

      const objectPath = String(path).slice('storage:'.length);

      const result = await sb.storage
        .from('parking-private')
        .createSignedUrl(objectPath, 900);

      return result.error ? '' : result.data.signedUrl;
    }

    async function uploadPhoto(payload) {
      const boot = await appBootstrap();
      const { blob, mime } = dataUrlBlob(payload.dataUrl);

      if (blob.size > 10 * 1024 * 1024) {
        throw new Error(
          'La fotografía supera el máximo de 10 MB.'
        );
      }

      const extension =
        mime === 'image/png'
          ? 'png'
          : mime === 'image/webp'
            ? 'webp'
            : 'jpg';

      const objectPath =
        `${boot.communityId}/pending/` +
        `${crypto.randomUUID()}.${extension}`;

      const result = await sb.storage
        .from('parking-private')
        .upload(
          objectPath,
          blob,
          {
            contentType: mime,
            upsert: false
          }
        );

      if (result.error) {
        throw result.error;
      }

      return {
        url: `storage:${objectPath}`
      };
    }

    async function registerEvidence(
      photoPath,
      incidentId = null,
      followupId = null
    ) {
      if (!photoPath?.startsWith('storage:')) {
        return;
      }

      const boot = await appBootstrap();
      const user = await sessionUser();

      const row = {
        community_id: boot.communityId,
        incident_id: incidentId,
        followup_id: followupId,
        object_path: photoPath.slice('storage:'.length),
        created_by: boot.user.IsRoot ? null : user.id,
        metadata: {
          source: 'SUPABASE_FRONTEND'
        }
      };

      unwrap(
        await sb
          .from('file_objects')
          .insert(row)
      );
    }

    return {
      evidenceUrl,
      uploadPhoto,
      registerEvidence
    };
  };
})();
