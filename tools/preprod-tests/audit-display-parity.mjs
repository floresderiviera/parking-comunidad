import fs from 'node:fs';

const management = fs.readFileSync(
  'assets/js/admin/management.js',
  'utf8'
);

const auditAdapter = fs.readFileSync(
  'assets/js/supabase/audit.js',
  'utf8'
);

const auditUi = fs.readFileSync(
  'assets/js/admin/audit.js',
  'utf8'
);

const checks = [
  [
    'Responsable de vivienda permite markup controlado',
    management.includes(
      "kind==='housing'&&col==='Responsable'?value:esc(value)"
    )
  ],
  [
    'tabla usa renderer específico de celdas',
    management.includes('renderDisplayCell(kind,r,x)')
  ],
  [
    'auditoría lee metadata old/new',
    auditAdapter.includes("metadataSide(row.metadata, 'old')") &&
      auditAdapter.includes("metadataSide(row.metadata, 'new')")
  ],
  [
    'UPDATE se expande por campos modificados',
    auditAdapter.includes('rows.flatMap') &&
      auditAdapter.includes('changedFields.map')
  ],
  [
    'campos técnicos no contaminan Antes/Después',
    auditAdapter.includes("'updated_at'") &&
      auditAdapter.includes("'normalized_habitual_plate'")
  ],
  [
    'token QR nunca se expone en auditoría',
    auditAdapter.includes("'qr_token'")
  ],
  [
    'false y cero no se muestran como vacío',
    auditUi.includes(
      "value===null||value===undefined||value===''"
    )
  ]
];

let failed = 0;

for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`Audit/display parity: ${failed} fallo(s)`);
  process.exit(1);
}

console.log(`Audit/display parity: OK (${checks.length}/${checks.length})`);
