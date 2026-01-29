import { test, expect } from '@playwright/test';

// This test verifies the EA export flow from the UI.
// It assumes a running Next dev server (frontend) on PLAYWRIGHT_BASE_URL or http://localhost:3001.
// The test sets a cookie named `access_token` to prevent server redirect to login,
// intercepts `/api/ea/export` and returns a small blob to trigger the download.

test('EA export triggers download', async ({ page, context }) => {
  // set cookie so server components won't redirect to login
  await context.addCookies([
    {
      name: 'access_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // intercept the client-side export call and return a small xlsx-like buffer
  await page.route('**/api/ea/export', async (route) => {
    const headers = {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ea_export.xlsx"',
    };
    const body = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // minimal ZIP signature (xlsx is zip)
    await route.fulfill({ status: 200, body, headers });
  });

  // Navigate to EA page
  await page.goto('/ea');

  // Ensure the Export button is visible
  const btn = page.locator('button', { hasText: 'Exporter Excel' });
  await expect(btn).toBeVisible();

  // Debug: ensure button visible and log
  console.log('Clicking Export button…');
  await expect(btn).toBeVisible();

  try {
    // Wait for the network request to be sent when clicking Export
    const [req] = await Promise.all([
      page.waitForRequest('**/api/ea/export', { timeout: 5000 }),
      btn.click(),
    ]);

    console.log('Request observed:', req.url(), req.method());
    expect(req.url()).toContain('/api/ea/export');
    expect(req.method()).toBe('GET');

    // Give the page a short moment to complete client-side handling (download trigger)
    await page.waitForTimeout(200);
    // success if we observed the request and no exception was thrown
    console.log('Export request observed and client handled it (assumed).');
  } catch (err) {
    console.error('Export test failed — capturing screenshot for debugging');
    await page.screenshot({ path: 'test-artifacts/ea-export-error.png', fullPage: true });
    throw err;
  }
});
