import { test, expect } from 'playwright/test';
import path from 'node:path';

test('手机横屏下报告 UI 保持在画布内且按钮热区可用', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.SERVER_URL || 'http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.locator('#BTN_START_MEMORY').click();
  await expect.poll(() => page.evaluate(() => Boolean(window.game && window.__debug__))).toBe(true);
  await page.evaluate(() => {
    window.game.overlay.show({
      type: 'complete',
      chapterNumber: 8,
      memoryFrom: 60,
      memoryTo: 72,
    });
  });
  await expect.poll(() => page.evaluate(() => window.game.overlay._report?.isReady())).toBe(true);
  await page.waitForTimeout(1900);

  const layout = await page.evaluate(() => {
    const rect = document.getElementById('gameCanvas').getBoundingClientRect();
    const button = window.game.overlay._report._btnRect;
    const pixels = window.game.ctx.getImageData(0, 0, 1, 1).data;
    return { width: rect.width, height: rect.height, ratio: rect.width / rect.height, button, pixels: [...pixels] };
  });
  expect(layout.width).toBeLessThanOrEqual(844);
  expect(layout.height).toBeLessThanOrEqual(390);
  expect(layout.ratio).toBeCloseTo(16 / 9, 2);
  expect(layout.button).toEqual({ x: 490, y: 528, w: 300, h: 136 });
  expect(layout.pixels.some(value => value > 20)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(process.cwd(), 'visual-reports', 'mobile-report-ui.png') });
  await page.close();
});
