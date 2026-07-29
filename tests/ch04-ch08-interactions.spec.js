import { expect, test } from 'playwright/test';

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000/';

function toViewport(rect, point) {
  return {
    x: rect.x + (point.x / 1280) * rect.width,
    y: rect.y + (point.y / 720) * rect.height,
  };
}

test('第8关的挥手回退可完成，且没有页面错误', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => Boolean(window.__debug__))).toBe(true);

  await page.evaluate(() => window.__debug__.switchTo('ch08'));
  await page.waitForTimeout(700);
  const rect = await page.locator('#gameCanvas').boundingBox();
  expect(rect).not.toBeNull();

  await page.mouse.click(...Object.values(toViewport(rect, { x: 790, y: 617 })));
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.__debug__.state().chapter)).toBe('ch08');
  expect(await page.evaluate(() => window.__debug__.inspect().chapterDetail.phase)).toBe('wave');

  const path = [{ x: 160, y: 520 }, { x: 670, y: 390 }, { x: 1100, y: 530 }].map(point => toViewport(rect, point));
  await page.mouse.move(path[0].x, path[0].y);
  await page.mouse.down();
  await page.mouse.move(path[1].x, path[1].y);
  await page.mouse.move(path[2].x, path[2].y);
  await page.mouse.up();

  await expect.poll(() => page.evaluate(() => window.__debug__.inspect().chapterDetail.phase)).toBe('reveal');
  expect(errors).toEqual([]);
});
