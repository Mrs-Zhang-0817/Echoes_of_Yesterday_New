import { test, expect } from 'playwright/test';
import path from 'node:path';

test('手机横屏下报告 UI 保持在画布内且按钮热区可用', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.SERVER_URL || 'http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => Boolean(window.game && window.__debug__))).toBe(true);
  await page.evaluate(() => window.__debug__.switchTo('ch10'));
  await page.waitForTimeout(700);
  await page.evaluate(() => { window.game.chapterManager.currentChapter.phase = 'report'; });
  await page.waitForTimeout(150);

  const layout = await page.evaluate(() => {
    const rect = document.getElementById('gameCanvas').getBoundingClientRect();
    const button = window.game.chapterManager.currentChapter.restartBtn;
    return { width: rect.width, height: rect.height, ratio: rect.width / rect.height, button };
  });
  expect(layout.width).toBeLessThanOrEqual(844);
  expect(layout.height).toBeLessThanOrEqual(390);
  expect(layout.ratio).toBeCloseTo(16 / 9, 2);
  expect(layout.button).toEqual({ x: 550, y: 660, w: 180, h: 42 });
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(process.cwd(), 'visual-reports', 'mobile-report-ui.png') });
  await page.close();
});
