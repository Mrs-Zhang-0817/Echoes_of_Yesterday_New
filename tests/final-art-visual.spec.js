import { test, expect } from 'playwright/test';
import path from 'node:path';

const serverUrl = process.env.SERVER_URL || 'http://127.0.0.1:3000/';
const reportDir = path.join(process.cwd(), 'visual-reports');

const states = [
  ['ch02', 'fadeMemory', 1], ['ch03', 'success', 0.7], ['ch05', 'gating2', 0],
  ['ch06', 'gating1', 0], ['ch07', 'searching', 0], ['ch08', 'sign', 0], ['ch09', null, 0],
];

test('正式美术在各自交互画面完成加载且没有运行时错误', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(serverUrl, { waitUntil: 'networkidle' });
  await page.locator('#BTN_START_MEMORY').click();
  await expect.poll(() => page.evaluate(() => Boolean(window.game && window.__debug__))).toBe(true);

  for (const [chapter, phase, phaseTime] of states) {
    await page.evaluate(([id, nextPhase, nextTime]) => {
      window.__debug__.switchTo(id);
    }, [chapter, phase, phaseTime]);
    await page.waitForTimeout(700);
    await page.evaluate(([id, nextPhase, nextTime]) => {
      const current = window.game.chapterManager.currentChapter;
      if (nextPhase) { current.phase = nextPhase; current.phaseTime = nextTime; }
      if (id === 'ch07') { current.fingerActive = true; current.fingerX = 640; current.fingerY = 500; }
    }, [chapter, phase, phaseTime]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(reportDir, `${chapter}_final-art.png`) });
  }

  const missing = await page.evaluate(() => Object.entries(window.game.images)
    .filter(([, image]) => !image.complete || image.naturalWidth === 0).map(([key]) => key));
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});
