import fs from 'node:fs';

const i18n=
  fs.readFileSync(
    'assets/js/i18n.js',
    'utf8'
  );

const checks=[
  [
    'runtime contiene mapa UI EN',
    i18n.includes(
      'const PARKING_UI_EN_EXACT='
    )
  ],
  [
    'runtime traduce texto dinámico',
    i18n.includes(
      'function uiTranslateDynamic('
    )
  ],
  [
    'runtime traduce DOM',
    i18n.includes(
      'function translateRenderedUi('
    )
  ],
  [
    'runtime observa contenido nuevo',
    i18n.includes(
      'new MutationObserver('
    )
  ],
  [
    'options preservan value original',
    i18n.includes(
      "if(!el.hasAttribute('value'))"
    ) &&
    i18n.includes(
      "el.setAttribute("
    )
  ],
  [
    'estados internos permanecen ES',
    i18n.includes(
      "'Suspendido':'Suspended'"
    ) &&
    i18n.includes(
      "'Desasignado':'Unassigned'"
    )
  ],
  [
    'roles internos permanecen ES',
    i18n.includes(
      "PROPIETARIO:'Owner'"
    )
  ],
  [
    'control traducido',
    i18n.includes(
      "'Control de acceso':'Access control'"
    )
  ],
  [
    'admin traducido',
    i18n.includes(
      "'Configuración':'Settings'"
    )
  ],
  [
    'owner traducido',
    i18n.includes(
      "'Mis vehículos':'My vehicles'"
    )
  ]
];

let failed=0;

for(const [label,ok] of checks){
  console.log(
    `${ok?'OK  ':'FAIL'} ${label}`
  );

  if(!ok)failed++;
}

if(failed){
  console.error(
    `I18N runtime parity: ${failed} fallo(s)`
  );
  process.exit(1);
}

console.log(
  `I18N runtime parity: OK (${checks.length}/${checks.length})`
);
