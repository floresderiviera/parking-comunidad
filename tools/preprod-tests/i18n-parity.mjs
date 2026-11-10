import fs from 'node:fs';

const i18n=fs.readFileSync(
  'assets/js/i18n.js',
  'utf8'
);

const builder=fs.readFileSync(
  'tools/frontend/build-bundle.mjs',
  'utf8'
);

const required=[
  "es:{",
  "en:{",
  "function t(",
  "function setParkingLanguage(",
  "function languageSelectorHtml(",
  "function bindLanguageSelectors(",
  "function translateStatus(",
  "function translateRole(",
  "PARKING_LANGUAGE_KEY='parking_language'"
];

const checks=[
  ...required.map(value=>[
    `i18n contiene ${value}`,
    i18n.includes(value)
  ]),
  [
    'i18n es el primer módulo del bundle',
    builder.indexOf("'assets/js/i18n.js'") <
      builder.indexOf("'assets/js/core.js'")
  ],
  [
    'no se traduce el valor interno de roles',
    i18n.includes("roles:{") &&
      i18n.includes("PROPIETARIO:'Owner'")
  ],
  [
    'no se cambia el valor interno de estados',
    i18n.includes("Suspendido:'Suspended'") &&
      i18n.includes("Baja:'Deactivated'")
  ]
];

let failed=0;

for(const [label,ok] of checks){
  console.log(`${ok?'OK  ':'FAIL'} ${label}`);
  if(!ok)failed++;
}

if(failed){
  console.error(`I18N parity: ${failed} fallo(s)`);
  process.exit(1);
}

console.log(`I18N parity: OK (${checks.length}/${checks.length})`);
