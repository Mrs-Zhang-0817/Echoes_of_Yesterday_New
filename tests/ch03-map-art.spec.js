import { expect, test } from 'playwright/test';

const serverUrl = process.env.SERVER_URL || 'http://127.0.0.1:3000/';

test('第 3 章加载并绘制专用的交互地图素材', async ({ page }, testInfo) => {
  await page.goto(serverUrl, { waitUntil: 'networkidle' });
  await page.locator('#BTN_START_MEMORY').click();
  await expect.poll(() => page.evaluate(() => {
    const map = window.game?.images?.ch3_map_phone;
    return Boolean(map?.complete && map.naturalWidth > 0);
  })).toBe(true);

  await page.evaluate(() => {
    const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    window.__ch3MapDrawn = false;
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image === window.game?.images?.ch3_map_phone) window.__ch3MapDrawn = true;
      return originalDrawImage.call(this, image, ...args);
    };
    window.__debug__.switchTo('ch03');
  });
  await expect.poll(() => page.evaluate(() => window.__ch3MapDrawn)).toBe(true);
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath('ch03-map.png') });
});
