const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const I18N = fs.readFileSync(
  path.join(process.cwd(), 'assets/js/i18n.js'),
  'utf8'
);

async function mount(page, language='en') {
  await page.route(
    'http://parking.test/',
    async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!doctype html>
          <html lang="es">
            <head>
              <meta charset="utf-8">
              <title>Parking i18n test</title>
            </head>
            <body>
              <div id="fixture"></div>
            </body>
          </html>
        `
      });
    }
  );

  await page.addInitScript(lang => {
    localStorage.setItem(
      'parking_language',
      lang
    );
  }, language);

  await page.goto(
    'http://parking.test/',
    {
      waitUntil: 'domcontentloaded'
    }
  );

  await page.evaluate(
    ({ source }) => {
      eval(source);
    },
    {
      source: I18N
    }
  );
}
test('EN traduce estados visibles y preserva values internos', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <label>Estado</label>
      <select id="estado">
        <option>Activo</option>
        <option selected>Suspendido</option>
        <option>Desasignado</option>
        <option>Baja</option>
      </select>
    `;
  });

  const select = page.locator('#estado');

  await expect(
    page.getByText('Status', { exact: true })
  ).toBeVisible();

  await expect(
    select.locator('option').nth(0)
  ).toHaveText('Active');

  await expect(
    select.locator('option').nth(1)
  ).toHaveText('Suspended');

  await expect(
    select.locator('option').nth(2)
  ).toHaveText('Unassigned');

  await expect(
    select.locator('option').nth(3)
  ).toHaveText('Deactivated');

  expect(
    await select.locator('option').nth(0).getAttribute('value')
  ).toBe('Activo');

  expect(
    await select.locator('option').nth(1).getAttribute('value')
  ).toBe('Suspendido');

  expect(
    await select.locator('option').nth(2).getAttribute('value')
  ).toBe('Desasignado');

  expect(
    await select.locator('option').nth(3).getAttribute('value')
  ).toBe('Baja');

  expect(
    await select.inputValue()
  ).toBe('Suspendido');
});

test('EN preserva valores internos de solicitudes', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <select id="request-state">
        <option value="Abierta" selected>Abierta</option>
        <option value="Aprobada">Aprobada</option>
        <option value="Rechazada">Rechazada</option>
      </select>
    `;
  });

  const select = page.locator('#request-state');

  await expect(
    select.locator('option').nth(0)
  ).toHaveText('Open');

  await expect(
    select.locator('option').nth(1)
  ).toHaveText('Approved');

  await expect(
    select.locator('option').nth(2)
  ).toHaveText('Rejected');

  expect(
    await select.inputValue()
  ).toBe('Abierta');

  await select.selectOption('Aprobada');

  expect(
    await select.inputValue()
  ).toBe('Aprobada');
});

test('EN traduce contenido insertado después del arranque', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <h1>Mis vehículos</h1>
      <button>Guardar</button>
    `;
  });

  await expect(
    page.getByRole('heading', { name: 'My vehicles' })
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Save' })
  ).toBeVisible();
});

test('ES mantiene la interfaz española', async ({ page }) => {
  await mount(page, 'es');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <h1>Mis vehículos</h1>
      <select id="estado">
        <option selected>Suspendido</option>
      </select>
    `;
  });

  await expect(
    page.getByRole('heading', { name: 'Mis vehículos' })
  ).toBeVisible();

  await expect(
    page.locator('#estado option')
  ).toHaveText('Suspendido');

  expect(
    await page.locator('#estado').inputValue()
  ).toBe('Suspendido');
});

test('preferencia EN persiste en localStorage y lang HTML', async ({ page }) => {
  await mount(page, 'en');

  expect(
    await page.evaluate(
      () => localStorage.getItem('parking_language')
    )
  ).toBe('en');

  expect(
    await page.locator('html').getAttribute('lang')
  ).toBe('en');
});
