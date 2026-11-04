const safeJsonParse = (value, fallback = []) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value ?? fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (_error) {
    return fallback;
  }
};

function loadClientCallMetrics() {
  try {
    const rows = safeJsonParse(
      localStorage.getItem(CLIENT_CALL_STORAGE_KEY),
      []
    );
    return Array.isArray(rows) ? rows.slice(-160) : [];
  } catch (_error) {
    return [];
  }
}

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

function loadExternal(key, urls, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  state.libs = state.libs || {};
  if (state.libs[key]) return state.libs[key];

  state.libs[key] = new Promise(async (resolve, reject) => {
    for (const url of urls) {
      try {
        await new Promise((ok, no) => {
          const script = document.createElement('script');
          const timer = setTimeout(() => {
            script.remove();
            no(new Error(`No se pudo cargar: ${url}`));
          }, 8000);

          script.onload = () => {
            clearTimeout(timer);
            ok();
          };
          script.onerror = () => {
            clearTimeout(timer);
            no(new Error(`Error al cargar: ${url}`));
          };
          script.src = url;
          document.head.appendChild(script);
        });

        if (window[globalName]) {
          resolve(window[globalName]);
          return;
        }
      } catch (_error) {
        // intenta con el siguiente fallback
      }
    }

    reject(new Error(`No se pudo cargar ${globalName}`));
  });

  state.libs[key].catch(() => {
    delete state.libs[key];
  });

  return state.libs[key];
}
