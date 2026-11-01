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

  page.on('pageerror', error => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`console: ${msg.text()}`);
    }
  });

  return errors;
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
  expected
) {
  for (const [view] of expected) {
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
    const errors =
      monitorBrowser(page);

    await login(
      page,
      ACCOUNTS.ROOT
    );

    await assertDesktopNavigation(
      page,
      NAV.ADMIN
    );

    await navigateAll(
      page,
      NAV.ADMIN
    );

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

    await systemTab.click();

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

    await openProfile(page);

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
    const errors =
      monitorBrowser(page);

    await login(
      page,
      ACCOUNTS.ADMIN
    );

    await assertDesktopNavigation(
      page,
      NAV.ADMIN
    );

    await navigateAll(
      page,
      NAV.ADMIN
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
    const errors =
      monitorBrowser(page);

    await login(
      page,
      ACCOUNTS.CONTROL
    );

    await assertDesktopNavigation(
      page,
      NAV.CONTROL
    );

    await navigateAll(
      page,
      NAV.CONTROL
    );

    await expect(
      page.locator(
        '#nav button[data-view="config"]'
      )
    ).toHaveCount(0);

    await expect(
      page.locator('#scan')
    ).toBeVisible();

    await expect(
      page.locator('#plate')
    ).toBeVisible();

    await openProfile(page);

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
    const errors =
      monitorBrowser(page);

    await login(
      page,
      ACCOUNTS.PROPIETARIO
    );

    await assertDesktopNavigation(
      page,
      NAV.PROPIETARIO
    );

    await navigateAll(
      page,
      NAV.PROPIETARIO
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

    await logout(page);

    expect(errors).toEqual([]);
  });
});
