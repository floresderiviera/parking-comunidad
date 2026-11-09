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


test('EN cubre residuos dinámicos de Users Properties Vehicles y temporales', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <section>
        <button id="new-fullwidth">＋ Nuevo</button>

        <h2>Editar usuarios</h2>

        <div>
          <label>Viviendas asignadas</label>
          <p>La asignación se gestiona desde Viviendas mediante el propietario responsable.</p>
        </div>

        <h2>Vivienda y propietario</h2>
        <button>Abrir vehículos de esta vivienda</button>

        <form>
          <label>Marca</label>
          <input>
          <label>Modelo</label>
          <input>
          <div id="temporary-help">
            Las matrículas temporales se gestionan desde el botón
            <b>Temporales</b>
            del vehículo y admiten varios períodos.
          </div>
        </form>

        <h1>Períodos temporales</h1>
        <button>＋ Nuevo período</button>
        <h2>Vigente</h2>
        <h2>Próximos</h2>
        <h2>Históricos</h2>
        <h2>Anulados</h2>
        <div>Sin períodos.</div>
        <h2>Línea de tiempo</h2>
      </section>
    `;
  });

  await expect(
    page.getByRole('button', { name: '+ New', exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Edit user', exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Assigned properties', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(
      'Assignment is managed from Properties through the responsible owner.',
      { exact: true }
    )
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Property and owner', exact: true })
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: 'Open vehicles for this property',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText('Make', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText('Model', { exact: true })
  ).toBeVisible();

  await expect(
    page.locator('#temporary-help')
  ).toContainText(
    "Temporary plates are managed from the vehicle's"
  );

  await expect(
    page.locator('#temporary-help')
  ).toContainText('Temporary plates');

  await expect(
    page.locator('#temporary-help')
  ).toContainText(
    'button and can have multiple periods.'
  );

  await expect(
    page.getByRole('heading', {
      name: 'Temporary plate periods',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: '+ New period',
      exact: true
    })
  ).toBeVisible();

  for (const heading of [
    'Current',
    'Upcoming',
    'History',
    'Cancelled',
    'Timeline'
  ]) {
    await expect(
      page.getByRole('heading', {
        name: heading,
        exact: true
      })
    ).toBeVisible();
  }

  await expect(
    page.getByText('No periods.', { exact: true })
  ).toBeVisible();
});

test('EN no modifica data-label usados estructuralmente por CSS responsive', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <table>
        <tbody>
          <tr>
            <td id="property-cell" data-label="Vivienda">Bloque 1, 1 A</td>
            <td id="state-cell" data-label="Estado">Activo</td>
            <td id="actions-cell" data-label="Acciones">
              <button>Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  });

  await expect(
    page.locator('#state-cell')
  ).toHaveText('Active');

  await expect(
    page.getByRole('button', { name: 'Edit', exact: true })
  ).toBeVisible();

  expect(
    await page.locator('#property-cell').getAttribute('data-label')
  ).toBe('Vivienda');

  expect(
    await page.locator('#state-cell').getAttribute('data-label')
  ).toBe('Estado');

  expect(
    await page.locator('#actions-cell').getAttribute('data-label')
  ).toBe('Acciones');
});

test('EN cubre residuos detectados en QA visual Admin Owner y Control', async ({ page }) => {
  await mount(page, 'en');

  await page.evaluate(() => {
    document.querySelector('#fixture').innerHTML = `
      <section>
        <h2 id="access">Acceso de YAEL NAVAS PADILLA</h2>
        <h2>Acceso asistido</h2>
        <button>Generar contraseña temporal</button>

        <h2>Nuevo vehículo</h2>
        <h2 id="replace">Reemplazar vehículo · 2825GYF</h2>
        <div>Los dos slots están ocupados: el vehículo quedará Desasignado.</div>

        <h2>Buscar matrícula</h2>
        <div>Situación detectada por Control</div>
        <div>Registro manual</div>
        <div>ITV vencida</div>

        <h2 id="stay">Solicitar permanencia prolongada · 2825GYF</h2>
        <label>Motivo de permanencia</label>
        <label>Detalle del motivo (opcional)</label>
        <button>Enviar solicitud</button>

        <div id="slots">2/2 ocupados · 0 libres</div>
        <div id="property-count">1 vivienda asociada a tu usuario</div>
        <div id="vehicle-detail">Ficha del vehículo · Bloque 1, 1 A</div>
        <div id="open-incidents">Incidencias abiertas (3)</div>
      </section>
    `;
  });

  await expect(
    page.locator('#access')
  ).toHaveText('Access for YAEL NAVAS PADILLA');

  await expect(
    page.getByRole('heading', {
      name: 'Assisted access',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: 'Generate temporary password',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByRole('heading', {
      name: 'New vehicle',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.locator('#replace')
  ).toHaveText('Replace vehicle · 2825GYF');

  await expect(
    page.getByText(
      'Both slots are occupied: the vehicle will remain Unassigned.',
      { exact: true }
    )
  ).toBeVisible();

  await expect(
    page.getByRole('heading', {
      name: 'Search plate',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText(
      'Situation detected by Access Control',
      { exact: true }
    )
  ).toBeVisible();

  await expect(
    page.getByText('Manual entry', { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText(
      'Expired vehicle inspection',
      { exact: true }
    )
  ).toBeVisible();

  await expect(
    page.locator('#stay')
  ).toHaveText(
    'Request extended stay · 2825GYF'
  );

  await expect(
    page.getByText('Reason for stay', {
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByText('Reason details (optional)', {
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: 'Submit request',
      exact: true
    })
  ).toBeVisible();

  await expect(
    page.locator('#slots')
  ).toHaveText('2/2 occupied · 0 free');

  await expect(
    page.locator('#property-count')
  ).toHaveText(
    '1 property associated with your account'
  );

  await expect(
    page.locator('#vehicle-detail')
  ).toHaveText(
    'Vehicle details · Bloque 1, 1 A'
  );

  await expect(
    page.locator('#open-incidents')
  ).toHaveText('Open incidents (3)');
});
