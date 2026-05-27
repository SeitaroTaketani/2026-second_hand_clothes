import { test, expect } from '@playwright/test';

test('debug: country click investigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app-root-2026-second_hand_clothes .loader').waitFor({ state: 'hidden', timeout: 30000 });
  console.log('Loader hidden');
  
  // Give flows time to render
  await page.waitForTimeout(2000);
  
  const nodeCount = await page.locator('#app-root-2026-second_hand_clothes circle.country-node').count();
  console.log('Country nodes:', nodeCount);
  
  if (nodeCount > 0) {
    const node = page.locator('#app-root-2026-second_hand_clothes circle.country-node').first();
    const box = await node.boundingBox();
    console.log('First node bbox:', JSON.stringify(box));
    
    const nodeInfo = await node.evaluate(el => ({
      r: el.getAttribute('r'),
      opacity: getComputedStyle(el).opacity,
      cx: el.getAttribute('cx'),
      cy: el.getAttribute('cy'),
      pointerEvents: getComputedStyle(el).pointerEvents,
    }));
    console.log('Node info:', JSON.stringify(nodeInfo));
    
    // Listen for the custom event before clicking
    const eventFired = await page.evaluate(() => {
      return new Promise((resolve) => {
        const root = document.querySelector('#app-root-2026-second_hand_clothes .app');
        if (root) {
          root.addEventListener('shc:country-click', (e) => resolve('fired:' + e.detail), { once: true });
        }
        setTimeout(() => resolve('timeout'), 5000);
      });
    });
    // This won't work because evaluate runs synchronously...
    
    // Instead, set up listener THEN click
    await page.evaluate(() => {
      window._clickDetected = false;
      const root = document.querySelector('#app-root-2026-second_hand_clothes .app');
      if (root) {
        root.addEventListener('shc:country-click', (e) => { window._clickDetected = e.detail; }, { once: true });
      }
    });
    
    await node.click();
    await page.waitForTimeout(500);
    
    const detected = await page.evaluate(() => window._clickDetected);
    console.log('Click detected iso:', detected);
    
    const panelClass = await page.locator('#app-root-2026-second_hand_clothes .insight-panel').getAttribute('class');
    console.log('Panel class:', panelClass);
  }
});
