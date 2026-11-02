import fs from 'node:fs';

const read = (path) =>
  fs.readFileSync(
    new URL(`../../${path}`, import.meta.url),
    'utf8'
  );

const html = read('index.html');
const entry = read('assets/js/supabase/entry.js');
const vite = read('vite.config.mjs');

const checks = [
  [
    'index carga composition root como module',
    html.includes('type="module"') &&
    html.includes('assets/js/supabase/entry.js')
  ],
  [
    'index ya no ejecuta final adapter clásico',
    !html.includes(
      '<script src="./assets/js/supabase-final-adapter.js'
    )
  ],
  [
    'index ya no arranca app-init prematuramente',
    !html.includes(
      '<script src="./assets/js/app-init.js'
    )
  ],
  [
    'entry instala server después de componer APIs',
    entry.includes('window.server = router.server')
  ],
  [
    'entry instala navegación por rol',
    entry.includes('window.defaultViewForRole')
  ],
  [
    'entry enlaza Auth state',
    entry.includes('authApi.bindAuthState()')
  ],
  [
    'entry arranca app-init al final',
    entry.includes("document.createElement('script')") &&
    entry.includes("../app-init.js")
  ],
  [
    'Vite construye entry real',
    vite.includes(
      "input: 'assets/js/supabase/entry.js'"
    ) &&
    vite.includes(
      "entryFileNames: 'assets/js/supabase/entry.js'"
    )
  ],
  [
    'Vite ya no usa empty entry',
    !vite.includes('vite-empty-entry.js') &&
    !vite.includes('.vite-empty.js')
  ]
];

let failed = 0;

for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);

console.log('ESM entry parity: OK');
