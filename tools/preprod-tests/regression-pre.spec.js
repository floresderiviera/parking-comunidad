const { test, expect } = require('@playwright/test');

const PRE =
  'https://floresderiviera.github.io/parking-comunidad/preproduccion/';

const ACCOUNTS = {
  ROOT: {
    email: process.env.E2E_ROOT_EMAIL || '',
    password: process.env.E2E_ROOT_PASSWORD || ''
  },
  ADMIN: {
    email: process.env.E2E_ADMIN_EMAIL || '',
    password: process.env.E2E_ADMIN_PASSWORD || ''
  },
  CONTROL: {
    email: process.env.E2E_CONTROL_EMAIL || '',
    password: process.env.E2E_CONTROL_PASSWORD || ''
  },
  PROPIETARIO: {
    email: process.env.E2E_OWNER_EMAIL || '',
    password: process.env.E2E_OWNER_PASSWORD || ''
  }
};

const NAV = {
  ADMIN: [
    ['dashboard', 'Resumen'],
    ['dataReview', 'Revisión de datos'],
    ['users', 'Usuarios'],
    ['housing', 'Viviendas'],
    ['vehicles', 'Vehículos'],
    ['incidents', 'Incidencias'],
    ['requests', 'Solicitudes'],
    ['audit', 'Auditoría'],
    ['config', 'Configuración']
  ],
  CONTROL: [
    ['control', 'Control'],
    ['incidents', 'Incidencias']
  ],
  PROPIETARIO: [
    ['ownerHome', 'Inicio'],
    ['ownerHousing', 'Mis viviendas'],
    ['ownerVehicles', 'Mis vehículos'],
    ['ownerIncidents', 'Mis incidencias'],
    ['ownerRequests', 'Mis solicitudes']
  ]
};

function monitorBrowser(page) {
  const errors = [];
  let context = 'inicio';

  page.on('pageerror', error => {
    errors.push(`[${context}] pageerror: ${error.message}`);
  });

  page.on('console', msg => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('Failed to load resource')
    ) {
      errors.push(`[${context}] console: ${msg.text()}`);
    }
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();

    const expectedLogout401 =
      context.endsWith(':Logout') &&
      status === 401 &&
      url.startsWith(
        'https://tefnzjvylcvffnorgzls.supabase.co/rest/v1/'
      );

    if (status >= 400 && !expectedLogout401) {
      errors.push(
        `[${context}] HTTP ${status} ${url}`
      );
    }
  });

  return {
    errors,
    setContext(value) {
      context = value || 'sin contexto';
    }
  };
}

async function login(page, account) {
  await page.goto(PRE, {
    waitUntil: 'networkidle'
  });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.reload({
    waitUntil: 'networkidle'
  });

  await expect(
    page.locator('#login-form')
  ).toBeVisible();

  await page.locator('#email').fill(
    account.email
  );

  await page.locator('#password').fill(
    account.password
  );

  await page
    .getByRole('button', { name: 'Entrar' })
    .click();

  await expect(
    page.locator('#logout')
  ).toBeVisible({
    timeout: 15000
  });

  await expect(
    page.locator('#nav')
  ).toBeVisible();
}

async function ensureRole(page, role) {
  const selector = page.locator('#role-switch');

  if (await selector.count()) {
    const values = await selector
      .locator('option')
      .evaluateAll(options =>
        options.map(option => option.value)
      );

    expect(
      values,
      `La cuenta E2E no tiene asignado el perfil ${role}`
    ).toContain(role);

    if (await selector.inputValue() !== role) {
      await selector.selectOption(role);
      await waitViewReady(page);
    }

    return;
  }

  const single = (
    await page.locator('.role-single').innerText()
  ).trim();

  expect(
    single,
    `La cuenta E2E no tiene asignado el perfil ${role}`
  ).toBe(role);
}

async function waitViewReady(page) {
  await expect(
    page.locator('#main')
  ).toBeVisible();

  await expect(
    page.locator('#main .retry-state')
  ).toHaveCount(0);

  await expect
    .poll(
      async () => {
        return page
          .locator('#main')
          .innerText()
          .catch(() => '');
      },
      {
        timeout: 15000
      }
    )
    .not.toBe('');
}

async function assertDesktopNavigation(
  page,
  expected
) {
  const buttons =
    page.locator('#nav button[data-view]');

  await expect(buttons).toHaveCount(
    expected.length
  );

  for (const [view, label] of expected) {
    const item =
      page.locator(
        `#nav button[data-view="${view}"]`
      );

    await expect(item).toBeVisible();
    await expect(item).toHaveText(label);
  }
}

async function navigateAll(
  page,
  expected,
  monitor
) {
  for (const [view] of expected) {
    monitor?.setContext(`vista:${view}`);

    const item =
      page.locator(
        `#nav button[data-view="${view}"]`
      );

    await item.click();

    await waitViewReady(page);

    await expect(
      page.locator('#main .retry-state')
    ).toHaveCount(0);
  }
}

async function clickStable(page, selector) {
  let lastError;

  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const locator = page.locator(selector);

      await expect(locator).toBeVisible({
        timeout: 5000
      });

      await locator.click({
        timeout: 5000
      });

      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(150);
    }
  }

  throw lastError;
}

async function openProfile(page) {
  await page.locator('#profile-link').click();

  await waitViewReady(page);

  await expect(
    page.locator('#main .retry-state')
  ).toHaveCount(0);
}

async function logout(page) {
  await page.locator('#logout').click();

  await expect(
    page.locator('#login-form')
  ).toBeVisible({
    timeout: 10000
  });
}

/* =========================================================
 * ROOT
 * ========================================================= */

test.describe('PRE · ROOT', () => {
  test.skip(
    !ACCOUNTS.ROOT.email ||
    !ACCOUNTS.ROOT.password,
    'Faltan secrets E2E ROOT'
  );

  test('login, navegación ADMIN, Sistema y logout', async ({ page }) => {
    const monitor =
      monitorBrowser(page);
    const { errors } = monitor;

    await login(
      page,
      ACCOUNTS.ROOT
    );

    await ensureRole(page, 'ADMIN');

    await assertDesktopNavigation(
      page,
      NAV.ADMIN
    );

    await navigateAll(
      page,
      NAV.ADMIN,
      monitor
    );

    monitor.setContext('ROOT:Configuración');

    await page
      .locator(
        '#nav button[data-view="config"]'
      )
      .click();

    await waitViewReady(page);

    const systemTab =
      page.locator(
        '[data-config-tab="system"]'
      );

    await expect(
      systemTab
    ).toBeVisible();

    monitor.setContext('ROOT:Sistema');

    await clickStable(
      page,
      '[data-config-tab="system"]'
    );

    await expect(
      page.getByRole(
        'heading',
        { name: 'Sistema' }
      ).first()
    ).toBeVisible({
      timeout: 15000
    });

    await expect(
      page.locator(
        '#main .retry-state'
      )
    ).toHaveCount(0);

    monitor.setContext('ROOT:Perfil');
    await openProfile(page);

    monitor.setContext('ROOT:Logout');
    await logout(page);

    expect(errors).toEqual([]);
  });
});

/* =========================================================
 * ADMIN
 * ========================================================= */

test.describe('PRE · ADMIN', () => {
  test.skip(
    !ACCOUNTS.ADMIN.email ||
    !ACCOUNTS.ADMIN.password,
    'Faltan secrets E2E ADMIN'
  );

  test('navegación completa sin acceso a Sistema', async ({ page }) => {
    const monitor =
      monitorBrowser(page);
    const { errors } = monitor;

    await login(
      page,
      ACCOUNTS.ADMIN
    );

    await ensureRole(page, 'ADMIN');

    await assertDesktopNavigation(
      page,
      NAV.ADMIN
    );

    await navigateAll(
      page,
      NAV.ADMIN,
      monitor
    );

    await page
      .locator(
        '#nav button[data-view="config"]'
      )
      .click();

    await waitViewReady(page);

    await expect(
      page.locator(
        '[data-config-tab="system"]'
      )
    ).toHaveCount(0);

    await openProfile(page);

    monitor.setContext('ADMIN:Logout');
    await logout(page);

    expect(errors).toEqual([]);
  });
});

/* =========================================================
 * CONTROL
 * ========================================================= */

test.describe('PRE · CONTROL', () => {
  test.skip(
    !ACCOUNTS.CONTROL.email ||
    !ACCOUNTS.CONTROL.password,
    'Faltan secrets E2E CONTROL'
  );

  test('solo ve Control e Incidencias', async ({ page }) => {
    const monitor =
      monitorBrowser(page);
    const { errors } = monitor;

    await login(
      page,
      ACCOUNTS.CONTROL
    );

    await ensureRole(page, 'CONTROL');

    await assertDesktopNavigation(
      page,
      NAV.CONTROL
    );

    await navigateAll(
      page,
      NAV.CONTROL,
      monitor
    );

    await expect(
      page.locator(
        '#nav button[data-view="config"]'
      )
    ).toHaveCount(0);

    monitor.setContext('CONTROL:control');

    await page
      .locator('#nav button[data-view="control"]')
      .click();

    await waitViewReady(page);

    await expect(
      page.locator('#scan')
    ).toBeVisible();

    await expect(
      page.locator('#plate')
    ).toBeVisible();

    await openProfile(page);

    monitor.setContext('CONTROL:Logout');
    await logout(page);

    expect(errors).toEqual([]);
  });
});

/* =========================================================
 * PROPIETARIO
 * ========================================================= */

test.describe('PRE · PROPIETARIO', () => {
  test.skip(
    !ACCOUNTS.PROPIETARIO.email ||
    !ACCOUNTS.PROPIETARIO.password,
    'Faltan secrets E2E PROPIETARIO'
  );

  test('navega únicamente por sus vistas', async ({ page }) => {
    const monitor =
      monitorBrowser(page);
    const { errors } = monitor;

    await login(
      page,
      ACCOUNTS.PROPIETARIO
    );

    await ensureRole(page, 'PROPIETARIO');

    await assertDesktopNavigation(
      page,
      NAV.PROPIETARIO
    );

    await navigateAll(
      page,
      NAV.PROPIETARIO,
      monitor
    );

    await expect(
      page.locator(
        '#nav button[data-view="config"]'
      )
    ).toHaveCount(0);

    await expect(
      page.locator(
        '#nav button[data-view="control"]'
      )
    ).toHaveCount(0);

    await openProfile(page);

    monitor.setContext('PROPIETARIO:Logout');
    await logout(page);

    expect(errors).toEqual([]);
  });
});
