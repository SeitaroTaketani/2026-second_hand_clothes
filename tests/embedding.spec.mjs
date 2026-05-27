/**
 * Embedding test for §12 — verify that dist assets can be loaded in a host page
 * and that no styles/events leak outside #app-root-2026-second_hand_clothes.
 *
 * Run:  npx playwright test tests/embedding.spec.mjs --reporter=list
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const APP_TIMEOUT = 30_000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

// Build a minimal host page that embeds the dist assets
function buildEmbeddingHTML() {
  const cssFile = fs.readdirSync(path.join(DIST_DIR, 'css')).find(f => f.endsWith('.css'));
  const jsFile = fs.readdirSync(path.join(DIST_DIR, 'js')).find(f => f.endsWith('.js') && !f.endsWith('.map'));

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Embedding test host</title>
  <!-- Simulate existing host-page styles. App CSS must NOT override these. -->
  <style>
    body { font-family: Georgia, serif; background: #f5f5f5; margin: 20px; }
    .host-heading { color: purple; }
    .host-para { color: green; font-size: 16px; }
  </style>
</head>
<body>
  <!-- Host page content that must stay untouched by the embedded app -->
  <h1 class="host-heading">Host page heading — must stay purple</h1>
  <p class="host-para">Host body text — must stay green</p>

  <!-- The embedded app -->
  <div id="app-root-2026-second_hand_clothes" style="width:100%;height:600px;"></div>
  <link rel="stylesheet" href="/css/${cssFile}"/>
  <script type="module" src="/js/${jsFile}"></script>
</body>
</html>`;
}

test.describe('§12 Embedding isolation test', () => {
  test.beforeEach(async ({ page }) => {
    const html = buildEmbeddingHTML();

    // Intercept the root request to serve our embedding HTML
    await page.route('/', async route => {
      await route.fulfill({ contentType: 'text/html', body: html });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for app to boot
    await page
      .locator('#app-root-2026-second_hand_clothes .loader')
      .waitFor({ state: 'hidden', timeout: APP_TIMEOUT });
  });

  // ── host-page element styles must not be overridden ─────────────────────────
  test('host-page heading color (purple) is NOT overridden by app CSS', async ({ page }) => {
    const h1 = page.locator('h1.host-heading');
    const color = await h1.evaluate(el => getComputedStyle(el).color);
    // purple = rgb(128, 0, 128)
    expect(color).toBe('rgb(128, 0, 128)');
  });

  test('host-page paragraph color (green) is NOT overridden by app CSS', async ({ page }) => {
    const p = page.locator('p.host-para');
    const color = await p.evaluate(el => getComputedStyle(el).color);
    // green = rgb(0, 128, 0)
    expect(color).toBe('rgb(0, 128, 0)');
  });

  test('host-page body background is NOT overridden by app CSS', async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // #f5f5f5 = rgb(245, 245, 245)
    expect(bg).toBe('rgb(245, 245, 245)');
  });

  // ── app must not pollute global scope ───────────────────────────────────────
  test('body has no insight-open or other app classes added by the app', async ({ page }) => {
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toMatch(/insight-open/);
  });

  // ── app renders correctly when embedded ─────────────────────────────────────
  test('app renders inside #app-root without errors', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    await expect(root).toBeVisible();
    const svg = root.locator('.map-container svg');
    await expect(svg).toBeVisible({ timeout: APP_TIMEOUT });
  });

  test('no JS errors thrown during boot', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Re-navigate to capture any errors
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page
      .locator('#app-root-2026-second_hand_clothes .loader')
      .waitFor({ state: 'hidden', timeout: APP_TIMEOUT });
    // Filter out known benign browser warnings
    const realErrors = errors.filter(
      e => !e.includes('favicon') && !e.includes('ResizeObserver'),
    );
    expect(realErrors).toHaveLength(0);
  });
});
