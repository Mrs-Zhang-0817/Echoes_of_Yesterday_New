// 第三阶段：补全 ch10 后续阶段 + Overlay 记忆报告截图
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'http://127.0.0.1:3001/index.html';
const DESIGN_W = 1280, DESIGN_H = 720;
const OUTPUT_DIR = path.join(__dirname, '..', 'verified_screenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: DESIGN_W, height: DESIGN_H });

  await page.goto(GAME_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.__debug__ !== 'undefined', { timeout: 20000 });
  await sleep(3000);

  let total = 0;

  // ===== Ch10 各阶段 =====
  async function gotoCh10Phase(phase, label) {
    await page.evaluate(() => window.__debug__.switchTo('ch10'));
    await sleep(2000);
    await page.evaluate((p) => {
      const ch = window.game.chapterManager.currentChapter;
      ch.phase = p;
      ch.phaseTime = 0;
    }, phase);
    await sleep(3000);
    const fname = `ch10_${phase}_full.png`;
    await page.screenshot({
      path: path.join(OUTPUT_DIR, fname),
      clip: await page.evaluate(() => {
        const c = document.getElementById('gameCanvas').getBoundingClientRect();
        return { x: c.x, y: c.y, width: c.width, height: c.height };
      })
    });
    console.log(`  OK: ${fname} — ${label}`);
    total++;
  }

  console.log('\n=== Ch10 montage ===');
  await gotoCh10Phase('montage', '蒙太奇阶段');
  console.log('=== Ch10 reunion ===');
  await gotoCh10Phase('reunion', '拥抱定格');
  console.log('=== Ch10 finalReport ===');
  await gotoCh10Phase('finalReport', '记忆报告页');

  // ===== Overlay 记忆报告 =====
  console.log('\n=== Overlay 记忆报告 ===');
  for (let chNum = 1; chNum <= 10; chNum++) {
    await page.evaluate(() => {
      if (window.game.overlay?.hide) window.game.overlay.hide();
    });
    await sleep(500);

    const chId = chNum < 10 ? `0${chNum}` : '10';
    const memTo = [0,5,15,22,30,40,52,60,72,85,100][chNum];
    const memFrom = chNum === 1 ? 0 : [0,5,15,22,30,40,52,60,72,85,100][chNum-1];

    await page.evaluate(({n, from, to}) => {
      const ov = window.game.overlay;
      if (ov?.show) ov.show({ type:'complete', chapterNumber:n, memoryFrom:from, memoryTo:to, onContinue:()=>{} });
    }, { n: chNum, from: memFrom, to: memTo });
    await sleep(3000);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `overlay_ch${chId}_full.png`),
      clip: await page.evaluate(() => {
        const c = document.getElementById('gameCanvas').getBoundingClientRect();
        return { x: c.x, y: c.y, width: c.width, height: c.height };
      })
    });
    console.log(`  overlay_ch${chId}_full.png — 第${chNum}章完成报告`);
    total++;
  }

  console.log(`\n完成！共 ${total} 张截图`);

  // 统计所有截图
  const all = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`verified_screenshots/ 总计 ${all.length} 张 PNG 截图`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
