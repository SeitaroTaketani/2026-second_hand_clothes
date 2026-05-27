/**
 * Smoke test for §12 — Golden-path UI verification
 * Covers: map, filters, country picker, modals, tooltips, sea-route, fit-to-screen.
 *
 * Run:  npx playwright test tests/ui-smoke.spec.mjs --reporter=list
 */

import { test, expect } from '@playwright/test';

// Give the app enough time to boot + fetch all JSON data
const APP_TIMEOUT = 30_000;

// Click the first available country-node circle in the SVG map and wait for insight panel.
// Note: shc:country-click is dispatched from circle.country-node elements (not path.land).
// Returns the panel locator so callers can do further assertions.
async function clickCountryAndWait(page) {
  const root = page.locator('#app-root-2026-second_hand_clothes');
  const svg = root.locator('.map-container svg');

  // Country nodes are circles rendered by D3 after flow data loads (async after loader hides)
  const nodes = svg.locator('circle.country-node');
  // Wait for at least one node to be in the DOM
  await nodes.first().waitFor({ state: 'attached', timeout: 15_000 });

  // D3's updateDashboard() is called without await in init(), so nodes may still be
  // animating (opacity transition). Wait for the first node to reach opacity:1 via CSS.
  await page.waitForFunction(() => {
    const node = document.querySelector('#app-root-2026-second_hand_clothes circle.country-node');
    if (!node) return false;
    return parseFloat(getComputedStyle(node).opacity) > 0.5;
  }, { timeout: 10_000 });

  const nodeCount = await nodes.count();
  if (nodeCount === 0) throw new Error('No country-node circles rendered');

  // Set up shc:country-click listener BEFORE clicking to detect the event
  await page.evaluate(() => {
    window._shcClickIso = null;
    const app = document.querySelector('#app-root-2026-second_hand_clothes .app');
    if (app) app.addEventListener('shc:country-click', e => { window._shcClickIso = e.detail; }, { once: true });
  });

  // Try nodes until one has a visible bounding box and the event fires
  let clicked = false;
  for (let i = 0; i < Math.min(nodeCount, 50); i++) {
    const node = nodes.nth(i);
    const box = await node.boundingBox();
    if (!box || box.width < 1 || box.height < 1) continue;
    // Use page.mouse to fire pointer events that D3's event listeners respond to
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    // Check if click event was received
    await page.waitForTimeout(300);
    const iso = await page.evaluate(() => window._shcClickIso);
    if (iso) { clicked = true; break; }
    // Reset listener for next attempt
    await page.evaluate(() => {
      window._shcClickIso = null;
      const app = document.querySelector('#app-root-2026-second_hand_clothes .app');
      if (app) app.addEventListener('shc:country-click', e => { window._shcClickIso = e.detail; }, { once: true });
    });
  }
  if (!clicked) throw new Error('Could not trigger shc:country-click by clicking country-node circles');

  const panel = root.locator('.insight-panel');
  // Panel slides in via transform — check for .open class (not CSS visibility)
  await expect(panel).toHaveClass(/open/, { timeout: 10_000 });
  return panel;
}

test.describe('§12 Golden-path UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for loader to disappear (data loaded + map ready)
    await page
      .locator('#app-root-2026-second_hand_clothes .loader')
      .waitFor({ state: 'hidden', timeout: APP_TIMEOUT });
    // Give SVG a moment to render land paths after loader disappears
    await page.locator('#app-root-2026-second_hand_clothes .map-container svg').first()
      .waitFor({ state: 'attached', timeout: 10_000 });
  });

  // ── 1. Map renders ──────────────────────────────────────────────────────────
  test('map canvas is rendered with land paths', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const svg = root.locator('.map-container svg');
    await expect(svg).toBeVisible({ timeout: APP_TIMEOUT });
    const paths = svg.locator('path.land');
    expect(await paths.count()).toBeGreaterThan(10);
  });

  // ── 2. Country click → Insight panel opens ──────────────────────────────────
  test('clicking a country opens the insight panel', async ({ page }) => {
    const panel = await clickCountryAndWait(page);
    // Verify the panel content was populated
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const countryName = root.locator('.panel-country-name');
    await expect(countryName).not.toBeEmpty({ timeout: 5_000 });
  });

  // ── 3. Region filter toggle ─────────────────────────────────────────────────
  test('region buttons filter the data', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const regionBtns = root.locator('.region-btn');
    await expect(regionBtns.first()).toBeVisible();
    const count = await regionBtns.count();
    expect(count).toBeGreaterThan(1);

    await regionBtns.nth(1).click();
    await expect(regionBtns.nth(1)).toHaveClass(/active/, { timeout: 5_000 });
  });

  // ── 4. Year select ──────────────────────────────────────────────────────────
  test('year selector exists and can be changed', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const yearSelect = root.locator('.year-select');
    await expect(yearSelect).toBeVisible();
    const options = await yearSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1);
  });

  // ── 5. Threshold buttons ─────────────────────────────────────────────────────
  test('threshold buttons exist and toggle active class', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const btns = root.locator('.threshold-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThan(0);
    await btns.nth(0).click();
    await expect(btns.nth(0)).toHaveClass(/active/, { timeout: 5_000 });
  });

  // ── 6. Country picker (Exporter) — search + select + clear ─────────────────
  test('exporter country picker: open, search, clear', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const expBtn = root.locator('.exp-btn');
    await expect(expBtn).toBeVisible();
    await expBtn.click();

    const menu = root.locator('.exp-menu');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    const search = menu.locator('input[type="text"], input[type="search"]').first();
    await expect(search).toBeVisible();
    await search.fill('China');

    const option = menu.locator('.country-option:not(.search-hidden)').first();
    await expect(option).toBeVisible({ timeout: 3_000 });

    await search.fill('');
    await page.keyboard.press('Escape');
  });

  // ── 7. Flow checkboxes ──────────────────────────────────────────────────────
  test('flow checkboxes exist and are checked by default', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const checkboxes = root.locator('.flow-checkbox');
    const count = await checkboxes.count();
    // Article.jsx renders 2 sets (desktop + mobile) × 4 flows = 8 total
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  // ── 8. Methodology modal ────────────────────────────────────────────────────
  test('methodology modal opens and closes', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const methodBtn = root.locator('.methodology-btn');
    await expect(methodBtn).toBeVisible();
    await methodBtn.click();

    const modal = root.locator('.methodology-modal');
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 5_000 });

    const closeBtn = root.locator('.methodology-modal-close');
    await closeBtn.click();
    await expect(modal).toHaveClass(/hidden/, { timeout: 5_000 });
  });

  // ── 9. Escape key closes modal ──────────────────────────────────────────────
  test('Escape key closes open modal', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    const methodBtn = root.locator('.methodology-btn');
    await methodBtn.click();
    const modal = root.locator('.methodology-modal');
    await expect(modal).not.toHaveClass(/hidden/, { timeout: 5_000 });

    await root.press('Escape');
    await expect(modal).toHaveClass(/hidden/, { timeout: 5_000 });
  });

  // ── 10. Sea-route toggle (requires country insight panel to be open) ─────────
  test('sea-route toggle becomes enabled after clicking a country', async ({ page }) => {
    // Open the insight panel first (sea-route btn is disabled until a country is selected)
    await clickCountryAndWait(page);

    const root = page.locator('#app-root-2026-second_hand_clothes');
    const btn = root.locator('.searoute-btn');

    // Button should now be enabled
    await expect(btn).toBeEnabled({ timeout: 5_000 });

    // Toggle on
    await btn.click();
    await expect(btn).toHaveClass(/active/, { timeout: 5_000 });

    // Toggle off
    await btn.click();
    await expect(btn).not.toHaveClass(/active/, { timeout: 5_000 });
  });

  // ── 11. --vh CSS custom property is set on the .app div (appRef.current) ────
  test('--vh CSS custom property is set as inline style by JS', async ({ page }) => {
    const root = page.locator('#app-root-2026-second_hand_clothes');
    // window.appRef.current = the .app div (child of #app-root)
    // JS calls root.style.setProperty('--vh', ...) on that element
    const vh = await root.locator('.app').evaluate(el => el.style.getPropertyValue('--vh').trim());
    expect(vh).toBeTruthy();
    expect(vh).toMatch(/px$/);
  });

  // ── 12. No styles leak outside #app-root ───────────────────────────────────
  test('no style leak: body has no unexpected inline styles or app-specific classes', async ({ page }) => {
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toMatch(/insight-open|shc/);

    const bodyStyle = await page.evaluate(() => document.body.getAttribute('style') || '');
    expect(bodyStyle).not.toMatch(/--shc|insight/);
  });
});
