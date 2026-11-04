const state = {
  token: localStorage.getItem('parking_token') || '',
  user: null,
  view: '',
  cache: {
    bootstrap: {
      settings: (typeof INITIAL_PUBLIC_SETTINGS !== 'undefined' && INITIAL_PUBLIC_SETTINGS) || {},
    },
  },
  scanResult: null,
  scanner: null,
  libs: {},
  nav: null,
};

const APP_FRONTEND_VERSION = location.pathname.includes('/preproduccion/') ? '2.0.0-preprod.4' : '2.0.0';

function appSettings() {
  return state.cache?.bootstrap?.settings || {};
}

function appDisplayName() {
  return appSettings().NombreOficial || 'Parking Comunidad';
}

function appDescription() {
  return appSettings().Descripcion || appSettings().NombreCorto || 'Gestión de acceso y parking de la comunidad';
}

function appLogoUrl() {
  return appSettings().LogoUrl || '';
}

function appBrandHtml(compact = false) {
  const logo = appLogoUrl();
  const name = appDisplayName();
  return `<span class="brand-identity ${compact ? 'compact' : ''}">${logo ? `<img class="brand-logo" src="${esc(logo)}" alt="${esc(name)}">` : '<span class="brand-fallback">P</span>'}<span class="brand-name">${esc(name)}</span></span>`;
}

function applyParkingSettings(settings = {}) {
  const root = document.documentElement;
  if (settings.ColorPrincipal) root.style.setProperty('--brand', settings.ColorPrincipal);
  if (settings.ColorSecundario) root.style.setProperty('--dark', settings.ColorSecundario);
  if (settings.ColorAcento) root.style.setProperty('--accent', settings.ColorAcento);

  document.title = settings.NombreOficial || 'Parking Comunidad';

  const logo = String(settings.LogoUrl || '').trim();
  if (logo) {
    let favicon = document.querySelector('link[data-parking-favicon]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.dataset.parkingFavicon = '1';
      document.head.appendChild(favicon);
    }
    favicon.href = logo;

    let apple = document.querySelector('link[data-parking-apple-icon]');
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.dataset.parkingAppleIcon = '1';
      document.head.appendChild(apple);
    }
    apple.href = logo;
  } else {
    document.querySelector('link[data-parking-favicon]')?.remove();
    document.querySelector('link[data-parking-apple-icon]')?.remove();
  }
}

function renderMaintenanceScreen(publicState = {}) {
  const maintenance = publicState.maintenance || {};
  const settings = Object.assign({}, window.INITIAL_PUBLIC_SETTINGS || {}, publicState.settings || {});
  applyParkingSettings(settings);

  const name = settings.NombreOficial || 'Parking Comunidad';
  const logo = settings.LogoUrl || '';

  $('#app').innerHTML = `<main class="maintenance-page"><section class="card maintenance-card"><div class="maintenance-brand">${logo ? `<img src="${esc(logo)}" alt="Logo de ${esc(name)}">` : '<div class="mark">P</div>'}</div><div class="eyebrow">MANTENIMIENTO</div><h1>${esc(name)}</h1><p>${esc(maintenance.message || 'Sistema temporalmente en mantenimiento. Vuelve a intentarlo en breve.')}</p><div class="maintenance-note">El acceso y el escáner están temporalmente pausados para evitar cambios durante la actualización.</div><div class="actions maintenance-actions"><button type="button" class="secondary" id="maintenance-retry">Comprobar de nuevo</button><button type="button" class="secondary" id="maintenance-root-login">Acceso técnico ROOT</button></div></section></main>`;

  const retry = $('#maintenance-retry');
  if (retry) retry.onclick = () => location.reload();

  const rootLogin = $('#maintenance-root-login');
  if (rootLogin) rootLogin.onclick = () => login('Modo mantenimiento activo. Acceso exclusivo ROOT.');
}

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const SERVER_TIMEOUT_MS = 18000;
const RETRYABLE_ACTIONS = new Set([
  'bootstrap',
  'dashboard',
  'listUsers',
  'managerData',
  'listHousing',
  'listVehicles',
  'formOptions',
  'listIncidents',
  'listIncidentsPayload',
  'listAudit',
  'listRequests',
  'ownerBundle',
  'listTemporaryPeriods',
  'globalSearch',
  'housingDetail',
  'vehicleHistory',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function server(fn, ...args) {
  if (typeof window.server === 'function') {
    return window.server(fn, ...args);
  }

  return Promise.reject(new Error('El servidor no está disponible en este entorno.'));
}

const CLIENT_CALL_STORAGE_KEY = 'parking_client_metrics_v1';

function safeJsonParse(value, fallback = []) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value ?? fallback;
  }

  try {
    return JSON.parse(value) ?? fallback;
  } catch (_error) {
    return fallback;
  }
}

function loadClientCallMetrics() {
  try {
    const rows = safeJsonParse(localStorage.getItem(CLIENT_CALL_STORAGE_KEY), []);
    return Array.isArray(rows) ? rows.slice(-160) : [];
  } catch (_error) {
    return [];
  }
}

const CLIENT_CALL_METRICS = loadClientCallMetrics();

function persistClientCallMetrics() {
  try {
    localStorage.setItem(CLIENT_CALL_STORAGE_KEY, JSON.stringify(CLIENT_CALL_METRICS.slice(-160)));
  } catch (_error) {
    // no-op
  }
}

function recordClientCall(action, ms, ok, error = '') {
  CLIENT_CALL_METRICS.push({
    action: String(action || ''),
    ms: Math.max(0, Math.round(ms || 0)),
    ok: !!ok,
    error: ok ? '' : String(error || '').slice(0, 300),
    at: Date.now(),
  });

  if (CLIENT_CALL_METRICS.length > 160) {
    CLIENT_CALL_METRICS.splice(0, CLIENT_CALL_METRICS.length - 160);
  }

  persistClientCallMetrics();
}

function percentileClient(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] || 0;
}

function clientCallSummary() {
  const map = {};
  CLIENT_CALL_METRICS.forEach((x) => {
    const k = x.action || '—';
    const m = map[k] || (map[k] = { action: k, count: 0, total: 0, max: 0, errors: 0, times: [] });
    m.count += 1;
    m.total += Number(x.ms || 0);
    m.max = Math.max(m.max, Number(x.ms || 0));
    m.times.push(Number(x.ms || 0));
    if (!x.ok) m.errors += 1;
  });

  return Object.values(map)
    .map((x) => ({
      action: x.action,
      count: x.count,
      total: Math.round(x.total),
      avg: Math.round(x.total / Math.max(1, x.count)),
      max: Math.round(x.max),
      p95: Math.round(percentileClient(x.times, 0.95)),
      errors: x.errors,
    }))
    .sort((a, b) => b.total - a.total);
}

function clientObservability() {
  const rows = [...CLIENT_CALL_METRICS];
  const total = rows.length;
  const errors = rows.filter((x) => !x.ok);
  const times = rows.map((x) => Number(x.ms || 0));
  const slow = rows.filter((x) => Number(x.ms || 0) > 2000);

  return {
    total,
    success: total - errors.length,
    errors: errors.length,
    successRate: total ? Math.round(((total - errors.length) / total) * 1000) / 10 : 100,
    avg: total ? Math.round(times.reduce((a, b) => a + b, 0) / total) : 0,
    p95: Math.round(percentileClient(times, 0.95)),
    slow: slow.length,
    recentErrors: errors.slice(-10).reverse(),
    recentSlow: slow.slice(-10).reverse(),
  };
}

function clearClientObservability() {
  CLIENT_CALL_METRICS.splice(0);
  persistClientCallMetrics();
}

async function call(action, payload = {}) {
  const attempts = RETRYABLE_ACTIONS.has(action) ? 2 : 1;
  let last;
  const callStarted = performance.now();

  for (let i = 0; i < attempts; i += 1) {
    try {
      const value = await server('api', state.token, action, payload);
      recordClientCall(action, performance.now() - callStarted, true);
      return value;
    } catch (error) {
      last = error;

      if (/sesión|session/i.test(error.message || '')) {
        recordClientCall(action, performance.now() - callStarted, false, error.message || String(error));
        localStorage.removeItem('parking_token');
        state.token = '';
        state.user = null;
        throw error;
      }

      if (/mantenimiento/i.test(error.message || '')) {
        try {
          const publicState = await server('getPublicAppState');
          renderMaintenanceScreen(publicState);
        } catch (_inner) {
          // no-op
        }
        recordClientCall(action, performance.now() - callStarted, false, error.message || String(error));
        throw error;
      }

      if (i + 1 < attempts) {
        await sleep(650);
      }
    }
  }

  recordClientCall(action, performance.now() - callStarted, false, last?.message || String(last || ''));
  throw last;
}

function busy(el, on = true) {
  if (el) el.disabled = on;
}

function toast(message, bad = false) {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.className = `message ${bad ? 'bad' : ''}`;
  t.textContent = message;
  t.style.cssText = 'position:fixed;right:1rem;bottom:1rem;z-index:999;max-width:420px;';
  clearTimeout(t.timer);
  t.timer = setTimeout(() => t.remove(), 4500);
}

function loadExternal(key, urls, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  state.libs = state.libs || {};
  if (state.libs[key]) return state.libs[key];

  state.libs[key] = new Promise((resolve, reject) => {
    const queue = [...urls];
    const attempt = () => {
      const url = queue.shift();
      if (!url) {
        reject(new Error(`No se pudo cargar ${globalName}`));
        return;
      }

      const script = document.createElement('script');
      const timer = setTimeout(() => {
        script.remove();
        attempt();
      }, 8000);

      script.onload = () => {
        clearTimeout(timer);
        if (window[globalName]) {
          resolve(window[globalName]);
        } else {
          attempt();
        }
      };

      script.onerror = () => {
        clearTimeout(timer);
        attempt();
      };

      script.src = url;
      document.head.appendChild(script);
    };

    attempt();
  });

  state.libs[key].catch(() => {
    delete state.libs[key];
  });

  return state.libs[key];
}

const ensureQr = () => loadExternal('qr', [
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
], 'QRCode');

const ensureScanner = () => loadExternal('scanner', [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
], 'Html5Qrcode');

function qrTarget(token) {
  const base = window.WEB_APP_URL || location.href.split('?')[0];
  return `${base}?q=${encodeURIComponent(token)}`;
}

function qrSize() {
  return Math.max(220, Math.min(280, window.innerWidth - 80));
}

const ensureXlsx = () => loadExternal('xlsx', [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
], 'XLSX');

function excelValue(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return v;
}

async function downloadXlsx(filename, rows, columns, sheetName = 'Datos') {
  const data = rows || [];
  if (!data.length) {
    toast('No hay registros para exportar.', true);
    return;
  }

  const XLSX = await ensureXlsx();
  const cols = columns && columns.length ? columns : [...new Set(data.flatMap((r) => Object.keys(r || {})))];
  const normalized = data.map((r) => Object.fromEntries(cols.map((c) => [c, excelValue(r?.[c])])));
  const ws = XLSX.utils.json_to_sheet(normalized, { header: cols, cellDates: true });
  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(Math.max(0, cols.length - 1))}${data.length + 1}` };
  ws['!cols'] = cols.map((c) => ({ wch: Math.min(42, Math.max(12, String(c).length + 2, ...data.slice(0, 200).map((r) => String(r?.[c] ?? '').length + 2))) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName || 'Datos').slice(0, 31));
  XLSX.writeFile(wb, filename, { cellDates: true, compression: true });
}

function exportButtonsHtml(prefix = 'export-current') {
  return `<div class="export-actions"><button class="secondary" id="${prefix}-xlsx">Exportar Excel</button><button class="secondary compact" id="${prefix}-csv">CSV</button></div>`;
}

function downloadCsv(filename, rows, columns) {
  const cols = columns && columns.length ? columns : [...new Set((rows || []).flatMap((r) => Object.keys(r || {})))];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\ufeff' + [cols.map(cell).join(';'), ...(rows || []).map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const UI_STATE_KEY = `parking_ui_state_v3_${APP_FRONTEND_VERSION}`;

function loadUiState() {
  try {
    return safeJsonParse(sessionStorage.getItem(UI_STATE_KEY), {});
  } catch (_error) {
    return {};
  }
}

function saveUiState(patch) {
  try {
    const next = Object.assign({}, loadUiState(), patch || {});
    sessionStorage.setItem(UI_STATE_KEY, JSON.stringify(next));
    return next;
  } catch (_error) {
    return {};
  }
}

function viewUiState(view = state.view) {
  const all = loadUiState();
  return (all.views && all.views[view]) || {};
}

function saveViewUiState(view, patch) {
  try {
    const all = loadUiState();
    const views = Object.assign({}, all.views || {});
    views[view] = Object.assign({}, views[view] || {}, patch || {});
    all.views = views;
    sessionStorage.setItem(UI_STATE_KEY, JSON.stringify(all));
    return all;
  } catch (_error) {
    return {};
  }
}

function rememberCurrentView(view) {
  if (view) saveUiState({ view });
}

function clearUiState() {
  try {
    sessionStorage.removeItem(UI_STATE_KEY);
  } catch (_error) {
    // no-op
  }
}

function defaultViewForRole(role) {
  return role === 'ADMIN' ? 'dashboard' : role === 'CONTROL' ? 'control' : 'ownerHome';
}

function actionMenuHtml(inner, label = 'Acciones') {
  return `<details class="action-menu"><summary>${esc(label)}</summary><div class="action-menu-panel">${inner}</div></details>`;
}

function clientDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function periodMatches(value, period, from = '', to = '') {
  if (!period) return true;
  const d = clientDateOnly(value);
  if (!d) return false;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateAgo = (days) => {
    const x = new Date(now);
    x.setDate(x.getDate() - days);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };

  if (period === 'today') return d === today;
  if (period === '7') return d >= dateAgo(6) && d <= today;
  if (period === '30') return d >= dateAgo(29) && d <= today;
  if (period === 'month') return d.slice(0, 7) === today.slice(0, 7);
  if (period === 'prevmonth') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.slice(0, 7) === `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }
  if (period === 'custom') {
    const fromDate = from || '';
    const toDate = to || '';
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  }
  return true;
}

function periodFilterFields(prefix) {
  return `<div class="field"><label>Período</label><select id="${prefix}-period"><option value="">Todo</option><option value="today">Hoy</option><option value="7">7 días</option><option value="30">30 días</option><option value="month">Mes actual</option><option value="prevmonth">Mes anterior</option><option value="custom">Personalizado</option></select></div><div class="field period-custom hide" id="${prefix}-from-wrap"><label>Desde</label><input type="date" id="${prefix}-from"></div><div class="field period-custom hide" id="${prefix}-to-wrap"><label>Hasta</label><input type="date" id="${prefix}-to"></div>`;
}

function bindPeriodVisibility(prefix) {
  const period = $(`#${prefix}-period`);
  const fromWrap = $(`#${prefix}-from-wrap`);
  const toWrap = $(`#${prefix}-to-wrap`);
  if (!period) return;

  const refresh = () => {
    const show = period.value === 'custom';
    if (fromWrap) fromWrap.classList.toggle('hide', !show);
    if (toWrap) toWrap.classList.toggle('hide', !show);
  };

  period.addEventListener('change', refresh);
  refresh();
}

function groupedRowsStable(rows, groupKey, sortFn, groupOrderFn) {
  const sorted = [...(rows || [])].sort(sortFn);
  const groups = new Map();
  sorted.forEach((row) => {
    const key = groupKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  let entries = [...groups.entries()];
  if (groupOrderFn) entries = entries.sort(groupOrderFn);
  return entries;
}

(function installFloatingActionMenus() {
  if (window.__parkingFloatingMenusInstalled) return;
  window.__parkingFloatingMenusInstalled = true;

  const reset = (details) => {
    if (!details) return;
    const panel = details.querySelector('.action-menu-panel');
    if (panel) {
      delete panel.dataset.floating;
      panel.style.position = '';
      panel.style.left = '';
      panel.style.top = '';
      panel.style.right = '';
      panel.style.bottom = '';
    }
  };

  const sync = (details) => {
    if (!details) return;
    if (details.open) {
      document.querySelectorAll('details.action-menu[open]').forEach((item) => {
        if (item !== details) {
          item.open = false;
          reset(item);
        }
      });
    }
  };

  document.addEventListener('click', (event) => {
    const summary = event.target.closest?.('details.action-menu > summary');
    if (!summary) return;
    const details = summary.parentElement;
    setTimeout(() => sync(details), 0);
  }, true);

  document.addEventListener('toggle', (event) => {
    const details = event.target;
    if (details instanceof HTMLDetailsElement && details.classList.contains('action-menu')) {
      sync(details);
    }
  }, true);
})();

window.APP_FRONTEND_VERSION = APP_FRONTEND_VERSION;
window.state = state;
window.appSettings = appSettings;
window.appDisplayName = appDisplayName;
window.appDescription = appDescription;
window.appLogoUrl = appLogoUrl;
window.appBrandHtml = appBrandHtml;
window.applyParkingSettings = applyParkingSettings;
window.renderMaintenanceScreen = renderMaintenanceScreen;
window.toast = toast;
window.busy = busy;
window.call = call;
window.loadExternal = loadExternal;
window.ensureQr = ensureQr;
window.ensureScanner = ensureScanner;
window.qrTarget = qrTarget;
window.qrSize = qrSize;
window.ensureXlsx = ensureXlsx;
window.downloadXlsx = downloadXlsx;
window.downloadCsv = downloadCsv;
window.defaultViewForRole = defaultViewForRole;
window.actionMenuHtml = actionMenuHtml;
window.periodMatches = periodMatches;
window.bindPeriodVisibility = bindPeriodVisibility;
window.loadUiState = loadUiState;
window.saveUiState = saveUiState;
window.viewUiState = viewUiState;
window.saveViewUiState = saveViewUiState;
window.rememberCurrentView = rememberCurrentView;
window.clearUiState = clearUiState;
window.groupedRowsStable = groupedRowsStable;

export {
  state,
  appSettings,
  appDisplayName,
  appDescription,
  appLogoUrl,
  appBrandHtml,
  applyParkingSettings,
  renderMaintenanceScreen,
  safeJsonParse,
  loadUiState,
  saveUiState,
  viewUiState,
  saveViewUiState,
  rememberCurrentView,
  clearUiState,
  defaultViewForRole,
  actionMenuHtml,
  periodMatches,
  bindPeriodVisibility,
  groupedRowsStable,
};
