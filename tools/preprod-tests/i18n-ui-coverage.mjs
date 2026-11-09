import fs from 'node:fs';
import vm from 'node:vm';

const read = file =>
  fs.readFileSync(file, 'utf8');

const source =
  read('assets/js/i18n.js') +
  '\nglobalThis.__parkingI18n = PARKING_I18N;';

const storage = new Map();

const context = {
  console,
  navigator: {
    language: 'es-ES',
    languages: ['es-ES']
  },
  location: {
    reload() {}
  },
  localStorage: {
    getItem(key) {
      return storage.has(key)
        ? storage.get(key)
        : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    }
  },
  document: {
    documentElement: {
      lang: 'es'
    },
    body: null,
    addEventListener() {}
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const dict =
  context.__parkingI18n;

if(!dict?.es || !dict?.en){
  console.error(
    'FAIL diccionarios ES/EN no disponibles'
  );
  process.exit(1);
}

function flatten(obj, prefix=''){
  const out = {};

  for(const [key,value] of Object.entries(obj)){
    const path =
      prefix
        ? `${prefix}.${key}`
        : key;

    if(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ){
      Object.assign(
        out,
        flatten(value,path)
      );
    }else{
      out[path]=value;
    }
  }

  return out;
}

const es=flatten(dict.es);
const en=flatten(dict.en);

const esKeys=
  Object.keys(es).sort();

const enKeys=
  Object.keys(en).sort();

const missingEn=
  esKeys.filter(
    key=>!(key in en)
  );

const missingEs=
  enKeys.filter(
    key=>!(key in es)
  );

const emptyEs=
  esKeys.filter(
    key=>
      String(es[key]??'').trim()===''
  );

const emptyEn=
  enKeys.filter(
    key=>
      String(en[key]??'').trim()===''
  );

const sameUnexpected=
  esKeys.filter(key=>{
    if(!(key in en))return false;

    const a=
      String(es[key]??'').trim();

    const b=
      String(en[key]??'').trim();

    if(!a || !b)return false;

    const allowedSame = new Set([
      'language.es',
      'language.en',
      'auth.email',
      'common.csv',
      'common.no'
    ]);

    return (
      a===b &&
      !allowedSame.has(key)
    );
  });

const checks = [];

checks.push([
  'diccionario EN cubre todas las claves ES',
  missingEn.length===0,
  missingEn
]);

checks.push([
  'diccionario ES cubre todas las claves EN',
  missingEs.length===0,
  missingEs
]);

checks.push([
  'diccionario ES sin valores vacíos',
  emptyEs.length===0,
  emptyEs
]);

checks.push([
  'diccionario EN sin valores vacíos',
  emptyEn.length===0,
  emptyEn
]);

checks.push([
  'traducciones EN no replican ES accidentalmente',
  sameUnexpected.length===0,
  sameUnexpected
]);

const files = {
  'assets/js/auth-navigation.js':
    read('assets/js/auth-navigation.js'),

  'assets/js/core.js':
    read('assets/js/core.js')
};

const forbidden = [
  'Accede con tu email y contraseña.',
  '¿Olvidaste tu contraseña?',
  'Si todavía no tienes contraseña',
  '>Mis datos<',
  '>Salir<',
  '>Más secciones<',
  'Cargando datos…',
  'No tienes permisos para acceder a Configuración.',
  '>Restablecer contraseña<',
  '>Crear nueva contraseña<',
  '>Comprobar de nuevo<',
  '>Acceso técnico ROOT<'
];

for(const [file,text] of Object.entries(files)){
  const found =
    forbidden.filter(
      value=>text.includes(value)
    );

  checks.push([
    `${file} sin literales comunes ES ya migrados`,
    found.length===0,
    found
  ]);
}

let failed=0;

for(const [label,ok,details] of checks){
  console.log(
    `${ok?'OK  ':'FAIL'} ${label}`
  );

  if(!ok){
    failed++;

    for(const item of details){
      console.log(`     - ${item}`);
    }
  }
}

console.log(
  `Claves ES: ${esKeys.length}`
);

console.log(
  `Claves EN: ${enKeys.length}`
);

if(failed){
  console.error(
    `I18N UI coverage: ${failed} fallo(s)`
  );
  process.exit(1);
}

console.log(
  `I18N UI coverage: OK (${checks.length}/${checks.length})`
);
