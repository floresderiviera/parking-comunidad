(() => {
  'use strict';

  window.ParkingSupabaseAudit = ({
    sb,
    unwrap,
    profilesById
  }) => {
    if (!sb || !unwrap || !profilesById) {
      throw new Error('ParkingSupabaseAudit: faltan dependencias.');
    }

    async function listAudit() {
      const rows = [];
      const pageSize = 1000;

      for (let offset = 0; offset < 20000; offset += pageSize) {
        const page =
          unwrap(
            await sb
              .from('audit_log')
              .select('*')
              .order('occurred_at', { ascending: false })
              .range(offset, offset + pageSize - 1)
          ) || [];

        rows.push(...page);

        if (page.length < pageSize) {
          break;
        }
      }

      const profiles = await profilesById();

      return rows.map((row) => ({
        ID_Auditoria: row.id,
        FechaHora: row.occurred_at,
        Usuario:
          row.actor_email ||
          profiles.get(row.actor_user_id || row.user_id)?.email ||
          '',
        UsuarioNombre:
          profiles.get(row.actor_user_id || row.user_id)?.name ||
          row.actor_email ||
          '',
        Accion: row.action,
        Entidad: row.entity,
        ID_Entidad: row.entity_id || row.legacy_entity_id || '',
        Campo: row.field || '',
        ValorAnterior: row.previous_value || '',
        ValorNuevo: row.new_value || '',
        Observaciones: row.observations || '',
        Origen: row.source
      }));
    }

    return {
      listAudit
    };
  };
})();
