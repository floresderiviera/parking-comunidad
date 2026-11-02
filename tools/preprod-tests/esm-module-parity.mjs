import fs from 'node:fs';

const read = (path) =>
  fs.readFileSync(
    new URL(`../../${path}`, import.meta.url),
    'utf8'
  );

const html = read('index.html');
const entry = read('assets/js/supabase/entry.js');
const runtime = read('assets/js/supabase/runtime.js');
const referenceData =
  read('assets/js/supabase/reference-data.js');
const router =
  read('assets/js/supabase/router.js');
const workflow =
  read('.github/workflows/deploy-pages.yml');

const checks = [
  [
    'runtime exporta factory ESM',
    runtime.includes(
      'export function createRuntime()'
    )
  ],
  [
    'reference data exporta factory ESM',
    referenceData.includes(
      'export function createReferenceData('
    )
  ],
  [
    'router exporta factory ESM',
    router.includes(
      'export function createRouter('
    )
  ],
  [
    'runtime ya no registra factory global',
    !runtime.includes(
      'window.ParkingSupabaseRuntime'
    )
  ],
  [
    'reference data ya no registra factory global',
    !referenceData.includes(
      'window.ParkingSupabaseReferenceData'
    )
  ],
  [
    'router ya no registra factory global',
    !router.includes(
      'window.ParkingSupabaseRouter'
    )
  ],
  [
    'entry importa runtime',
    entry.includes(
      "import { createRuntime } from './runtime.js'"
    )
  ],
  [
    'entry importa reference data',
    entry.includes(
      "import { createReferenceData } from './reference-data.js'"
    )
  ],
  [
    'entry importa router',
    entry.includes(
      "import { createRouter } from './router.js'"
    )
  ],
  [
    'entry usa factories ESM',
    entry.includes('createRuntime()') &&
    entry.includes('createReferenceData({') &&
    entry.includes('createRouter({')
  ],
  [
    'index no carga runtime como script clásico',
    !html.includes(
      '<script src="./assets/js/supabase/runtime.js'
    )
  ],
  [
    'index no carga reference data como script clásico',
    !html.includes(
      '<script src="./assets/js/supabase/reference-data.js'
    )
  ],
  [
    'index no carga router como script clásico',
    !html.includes(
      '<script src="./assets/js/supabase/router.js'
    )
  ],
  [
    'index usa entry 6A-C2',
    html.includes(
      'supabase/entry.js?v=esm-6a2'
    )
  ],
  [
    'workflow publica entry Vite en PROD',
    workflow.includes(
      'main-src/dist/assets/js/supabase/entry.js'
    )
  ],
  [
    'workflow publica entry Vite en PRE',
    workflow.includes(
      'pre-src/dist/assets/js/supabase/entry.js'
    )
  ]
];

let failed = 0;

for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);

console.log('ESM module parity: OK');
