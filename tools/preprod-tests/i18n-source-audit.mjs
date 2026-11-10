import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOTS = [
  'assets/js',
  'scanner',
  'index.html',
  'preproduccion'
];

const EXCLUDED = new Set([
  'assets/js/app.bundle.js',
  'assets/js/i18n.js'
]);

const SPANISH_HINT = /[áéíóúñü¿¡]|\b(?:acción|acciones|activo|activa|administración|anular|anterior|abrir|auditoría|baja|buscar|cámara|cancelar|cerrar|comprobar|configuración|contraseña|control|datos|detalle|desde|después|editar|eliminar|estado|fecha|filtros|guardar|hasta|incidencia|incidencias|matrícula|mantenimiento|motivo|moto|nuevo|nueva|observación|período|propietario|registro|resumen|selecciona|sesión|siguiente|sistema|slot|solicitud|solicitudes|temporal|usuario|vehículo|vehículos|vivienda|viviendas|volver)\b/i;

const SAFE_INTERNAL = new Set([
  'Activo', 'Activa', 'Inactivo', 'Inactiva', 'Suspendido',
  'Desasignado', 'Baja', 'Revocado', 'Abierta', 'Cerrada',
  'Aprobada', 'Rechazada', 'Moto', 'Particular', 'Empresa',
  'Alquiler', 'Otro', 'PROPIETARIO', 'CONTROL', 'ADMIN', 'ROOT',
  'FechaHora', 'ID_Vivienda', 'ID_Vehiculo', 'ID_Usuario',
  'MatriculaHabitual', 'MatriculaTemporal', 'FechaInicio', 'FechaFin',
  'Urbanización Flores de Riviera'
]);

function walk(target, out = []) {
  if (!fs.existsSync(target)) return out;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) {
      if (['dist', 'node_modules', 'reports'].includes(name)) continue;
      walk(path.join(target, name), out);
    }
  } else if (/\.(?:js|html)$/i.test(target)) {
    const normalized = target.split(path.sep).join('/');
    if (!EXCLUDED.has(normalized)) out.push(normalized);
  }
  return out;
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\$\{[^}]+\}/g, '2')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const i18nSource = fs.readFileSync('assets/js/i18n.js', 'utf8') + `
globalThis.__parkingAuditI18n = {
  dictionary: PARKING_I18N,
  exact: PARKING_UI_EN_EXACT,
  attributes: PARKING_UI_EN_ATTRIBUTES,
  translate: uiTranslateDynamic
};`;

const context = {
  console,
  navigator: { language: 'en', languages: ['en'] },
  localStorage: { getItem: () => 'en', setItem() {} },
  location: { reload() {} },
  document: {
    documentElement: { lang: 'en' },
    body: null,
    addEventListener() {}
  }
};

vm.createContext(context);
vm.runInContext(i18nSource, context);

const runtime = context.__parkingAuditI18n;

function flattenValues(object, out = []) {
  for (const value of Object.values(object || {})) {
    if (value && typeof value === 'object') flattenValues(value, out);
    else out.push(String(value ?? ''));
  }
  return out;
}

const DICTIONARY_ES = new Set(flattenValues(runtime.dictionary.es));

function managed(value) {
  const candidate = clean(value);
  if (!candidate || candidate.length < 2) return true;
  if (candidate.length > 280) return true;
  if (/=>|\b(?:const|return|function|async)\b|\$\(|\.innerHTML/.test(candidate)) return true;
  if (!SPANISH_HINT.test(candidate)) return true;
  if (SAFE_INTERNAL.has(candidate)) return true;
  if (DICTIONARY_ES.has(candidate)) return true;
  if (runtime.exact[candidate] || runtime.attributes[candidate]) return true;
  return runtime.translate(candidate) !== candidate;
}

function collect(file) {
  const source = fs.readFileSync(file, 'utf8');
  const findings = [];
  const patterns = [
    /<[a-z][^>]*>([^<>{}]+)</gi,
    /(?:placeholder|title|aria-label|data-label)\s*=\s*["']([^"']+)["']/g,
    /(?:uiConfirm|confirm|uiPrompt|prompt|toast|show)\s*\(\s*(["'`])([\s\S]*?)\1/g,
    /(?:textContent|innerText)\s*=\s*(["'`])([\s\S]*?)\1/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      const raw = match[2] ?? match[1] ?? '';
      const candidate = clean(raw);
      if (!managed(candidate)) {
        findings.push({
          file,
          line: lineAt(source, match.index),
          text: candidate.slice(0, 240)
        });
      }
    }
  }

  return findings;
}

const files = [...new Set(ROOTS.flatMap(target => walk(target)))].sort();
const findings = files.flatMap(collect);
const unique = [...new Map(
  findings.map(item => [`${item.file}:${item.line}:${item.text}`, item])
).values()];

for (const item of unique) {
  console.log(`${item.file}:${item.line}: ${item.text}`);
}

console.log(`I18N source audit: ${unique.length} residuo(s) potencial(es) en ${files.length} archivo(s)`);

if (unique.length) process.exit(1);
