(() => {
  'use strict';

  window.ParkingSupabaseAdminImport = ({
    listHousing,
    parkingAdmin,
    invalidate
  }) => {
    async function ownerImportTemplate() {
      const rows = await listHousing();

      const sorted = rows
        .slice()
        .sort((a, b) =>
          String(a.Vivienda || '')
            .localeCompare(
              String(b.Vivienda || ''),
              'es',
              {
                numeric: true,
                sensitivity: 'base'
              }
            )
        );

      if (!sorted.length) {
        return [
          {
            Vivienda: 'Bloque 1, 1º A',
            Propietario: '',
            Email: ''
          }
        ];
      }

      return sorted.map(row => ({
        Vivienda: row.Vivienda,
        Propietario:
          row.Propietario || '',
        Email:
          row.Responsable || ''
      }));
    }

    function previewOwnerImport(
      payload = {}
    ) {
      return parkingAdmin(
        'previewOwnerImport',
        payload
      );
    }

    async function applyOwnerImport(
      payload = {}
    ) {
      const data = await parkingAdmin(
        'applyOwnerImport',
        payload
      );

      invalidate();

      return data;
    }

    return {
      ownerImportTemplate,
      previewOwnerImport,
      applyOwnerImport
    };
  };
})();
