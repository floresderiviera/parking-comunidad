(() => {
  'use strict';

  const AUDIT_HIDDEN_FIELDS = new Set([
    'id',
    'community_id',
    'legacy_id',
    'created_at',
    'updated_at',
    'qr_token',
    'normalized_habitual_plate',
    'normalized_temporary_plate'
  ]);

  const AUDIT_FIELD_LABELS = {
    block: 'Bloque',
    floor: 'Planta',
    apartment: 'Apartamento',
    display_name: 'Vivienda',
    responsible_user_id: 'Responsable',
    habitual_plate: 'Matrícula habitual',
    temporary_plate: 'Matrícula temporal',
    slot: 'Slot',
    type: 'Tipo',
    state: 'Estado',
    qr_state: 'Estado QR',
    observations: 'Observaciones',
    make: 'Marca',
    model: 'Modelo',
    starts_at: 'Desde',
    ends_at: 'Hasta',
    reason: 'Motivo',
    resolution_notes: 'Resolución',
    description: 'Descripción',
    priority: 'Prioridad',
    situation: 'Situación',
    cause: 'Causa'
  };

  function metadataSide(metadata, key) {
    if (!metadata || typeof metadata !== 'object') return null;
    const value = metadata[key];
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : null;
  }

  function comparableAuditValue(value) {
    return JSON.stringify(value === undefined ? null : value);
  }

  function displayAuditValue(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function auditFieldLabel(key) {
    return AUDIT_FIELD_LABELS[key] || key;
  }

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

      return rows.flatMap((row) => {
        const base = {
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
        };

        if (String(row.action || '').toUpperCase() !== 'UPDATE') {
          return [base];
        }

        const oldData = metadataSide(row.metadata, 'old');
        const newData = metadataSide(row.metadata, 'new');

        if (!oldData || !newData) {
          return [base];
        }

        const changedFields = [
          ...new Set([
            ...Object.keys(oldData),
            ...Object.keys(newData)
          ])
        ]
          .filter((key) => !AUDIT_HIDDEN_FIELDS.has(key))
          .filter(
            (key) =>
              comparableAuditValue(oldData[key]) !==
              comparableAuditValue(newData[key])
          );

        if (!changedFields.length) {
          return [base];
        }

        return changedFields.map((key) => ({
          ...base,
          ID_Auditoria: `${row.id}:${key}`,
          Campo: auditFieldLabel(key),
          ValorAnterior: displayAuditValue(oldData[key]),
          ValorNuevo: displayAuditValue(newData[key])
        }));
      });
    }

    return {
      listAudit
    };
  };
})();
