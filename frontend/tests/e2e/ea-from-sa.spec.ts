import { test, expect } from '@playwright/test';

test('SA selection pre-fills EA form', async ({ page, context }) => {
  // set cookie to avoid server-side redirect to login
  await context.addCookies([
    { name: 'access_token', value: 'test-token', domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);

  const hits: string[] = [];
  await page.route('**/api/sa/eligible', (route) => {
    console.log('route /api/sa/eligible intercepted');
    hits.push('eligible');
    return route.fulfill({ status: 200, body: JSON.stringify([{ id: '5', sa_number: 'SA250005', supplier_name: 'Fourn', remaining_quantity: 85.5, quantity_unit: 'TONNE' }]) });
  });

  await page.route('**/api/customers', (route) => { hits.push('customers'); return route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, code: 'C1', name: 'Client 1', is_active: true }]) }); });
  await page.route('**/api/sa-families', (route) => { hits.push('families'); return route.fulfill({ status: 200, body: JSON.stringify([{ id: 2, label: 'Famille A', scrap_percent: 5 }, { id: 3, label: 'Famille B', scrap_percent: 6 }]) }); });
  await page.route('**/api/sa/for-ea/5', (route) => { hits.push('for-ea'); return route.fulfill({ status: 200, body: JSON.stringify({ id: '5', family_id: 2, max_export_quantity: 85.5, quantity_unit: 'TONNE', description: 'Article SA' }) }); });

  // articles per family
  await page.route('**/api/articles?family_id=2', (route) => { hits.push('articles2'); return route.fulfill({ status: 200, body: JSON.stringify([{ id: 21, product_ref: 'REF-AAA', label: 'Produit A' }, { id: 22, product_ref: 'REF-BBB', label: 'Produit B' }]) }); });
  await page.route('**/api/articles?family_id=3', (route) => { hits.push('articles3'); return route.fulfill({ status: 200, body: JSON.stringify([{ id: 31, product_ref: 'REF-CCC', label: 'Produit C' }]) }); });

  let lastHmr = 0;
  page.on('console', (msg) => {
    const text = String(msg.text());
    console.log('PAGE LOG >', text);
    if (text.includes('Fast Refresh') || text.includes('[HMR]')) lastHmr = Date.now();
  });

  async function waitForQuiet(ms = 500, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (Date.now() - lastHmr > ms) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('No quiet period observed');
  }

  await page.goto('/ea/new');
  await page.screenshot({ path: 'test-artifacts/ea-from-sa-before.png', fullPage: true });

  // Wait until our route handler was hit to avoid races with HMR/rebuild
  async function waitForHit(name: string, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (hits.includes(name)) return;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`route ${name} not hit within ${timeout}ms`);
  }

  try {
    await waitForHit('eligible', 15000);
    // now wait for the SA option to appear in the select (populated after client fetch)
    await page.waitForSelector('label:has-text("SA à lier") select option:has-text("SA250005")', { state: 'attached', timeout: 15000 });
    // wait a short quiet period (no HMR) before interacting
    await waitForQuiet(300, 10000);
  } catch (err) {
    console.error('SA option not found after navigation; capturing screenshot', err);
    try { await page.screenshot({ path: 'test-artifacts/ea-from-sa-missing.png', fullPage: true }); } catch (_) {}
    throw err;
  }

  // Select SA with retries in case HMR detaches/refreshes the DOM
  async function selectWithRetry(selector: string, value: string, attempts = 5) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        await page.selectOption(selector, value);
        return;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    throw lastErr;
  }

  await selectWithRetry('label:has-text("SA à lier") select', '5', 8);

  // Expect family to be set
  await expect(page.locator('label:has-text("Famille") select').first()).toHaveValue('2');

  // Expect linked quantity input to be set
  await expect(page.locator('label:has-text("Quantité EA à lier") input')).toHaveValue('85.5');

  // Wait for articles to load and search
  await page.waitForSelector('label:has-text("Article") select option:has-text("REF-AAA")', { state: 'attached', timeout: 10000 });
  await page.fill('input[placeholder^="Rechercher"]', 'AAA');
  await expect(page.locator('label:has-text("Article") select')).toContainText('REF-AAA');

  // switch family to 3 and back to 2 (cache should restore original list)
  await page.selectOption('label:has-text("Famille") select', '3');
  await expect(page.locator('label:has-text("Famille") select').first()).toHaveValue('3');
  await page.selectOption('label:has-text("Famille") select', '2');
  await expect(page.locator('label:has-text("Famille") select').first()).toHaveValue('2');
  await expect(page.locator('label:has-text("Article") select')).toContainText('REF-AAA');
});
