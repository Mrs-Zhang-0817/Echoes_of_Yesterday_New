// 第二阶段修复：处理需要阶段推进的章节和Overlay截图
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

  console.log('Loading game...');
  await page.goto(GAME_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.__debug__ !== 'undefined', { timeout: 20000 });
  await sleep(3000);
  console.log('Game loaded.');

  const results = [];

  // ========== 1. ch04 - 推进阶段，截取signature/form/bracelet ==========
  console.log('\n=== PART 1: ch04 phase progression ===');
  await page.evaluate(() => window.__debug__.switchTo('ch04'));
  await sleep(2000);

  // 推进到signature
  console.log('  Advancing ch04: phone → ringing → signature');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'ringing';
    ch.phaseTime = 1.5;
  });
  await sleep(2000); // 等待phase切换

  // 现在应该在signature阶段，截取paperBase
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch04_signature_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch04 signature (paperBase)');
  results.push({ key: 'ch04_signature', desc: '警局签名阶段 - paperBase签名纸覆盖', status: 'captured' });

  // 推进到form
  console.log('  Advancing: signature → form');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    if (ch.signature) { ch.signature.attempts = 3; ch.signature._complete = true; }
    ch.phase = 'form';
    ch.phaseTime = 0.5;
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch04_form_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch04 form (police_08 focused)');
  results.push({ key: 'ch04_form', desc: '警局表单阶段 - ch4_police_08焦点图', status: 'captured' });

  // 推进到bracelet
  console.log('  Advancing: form → bracelet');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'bracelet';
    ch.phaseTime = 0.5;
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch04_bracelet_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch04 bracelet (police_03 focused)');
  results.push({ key: 'ch04_bracelet', desc: '警局手环揭示 - ch4_police_03焦点', status: 'captured' });

  // ========== 2. ch05 - 推进到gating2（电梯内部） ==========
  console.log('\n=== PART 2: ch05 phase progression ===');
  await page.evaluate(() => window.__debug__.switchTo('ch05'));
  await sleep(2000);

  console.log('  Advancing ch05: narrative → gating2');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    if (ch._state) ch._state = 'gating2';
    ch.phase = 'gating2';
    ch.phaseTime = 0;
  });
  await sleep(2000);

  // 第一次截图可能不对，重试
  for (let retry = 0; retry < 3; retry++) {
    const meta = await page.evaluate(() => window.__debug__.screenshotMeta());
    console.log(`  ch05 state: phase=${meta.phase}`);
    if (meta.phase === 'gating2' || meta.phase === 'gating2_elevating') break;
    await page.evaluate(() => {
      const ch = window.game.chapterManager.currentChapter;
      ch.phase = 'gating2'; ch.phaseTime = 0;
    });
    await sleep(1000);
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch05_gating2_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch05 gating2 (elevator)');
  results.push({ key: 'ch05_gating2', desc: '电梯内部阶段 - bg_elevator+sunflower_panel', status: 'captured' });

  // ========== 3. ch06 - 推进到gating2（餐桌） ==========
  console.log('\n=== PART 3: ch06 phase progression ===');
  // 先重新切换确保干净状态
  await page.evaluate(() => window.__debug__.switchTo('ch01'));
  await sleep(1000);
  await page.evaluate(() => window.__debug__.switchTo('ch06'));
  await sleep(2000);

  console.log('  Advancing ch06: narrative → gating2');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'gating2';
    ch.phaseTime = 0;
  });
  await sleep(2000);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch06_gating2_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch06 gating2 (dining table + bowl noodles)');
  results.push({ key: 'ch06_gating2', desc: '餐桌阶段 - bg_diningroom+bowl_noodles', status: 'captured' });

  // ========== 4. ch07 - 推进多种阶段 ==========
  console.log('\n=== PART 4: ch07 phase progression ===');
  await page.evaluate(() => window.__debug__.switchTo('ch07'));
  await sleep(2000);

  // 保持在nightNarrative（已有截图），推进到flashlightSearch
  console.log('  Advancing ch07: nightNarrative → socialLights → flashlightSearch');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'flashlightSearch';
    ch.phaseTime = 10;
  });
  await sleep(1500);

  // 点击一次激活手电筒光束
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await sleep(300);
  await page.mouse.up();
  await sleep(300);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch07_flashlight_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch07 flashlightSearch');
  results.push({ key: 'ch07_flashlightSearch', desc: '黑暗摸索 - door_lock+flashlight_beam', status: 'captured' });

  // 推进到hallucinationClear
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'hallucinationClear';
    ch.phaseTime = 0.3;
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch07_hallucination_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch07 hallucinationClear');
  results.push({ key: 'ch07_hallucinationClear', desc: '幻觉散去 - hallucination_shadow', status: 'captured' });

  // ========== 5. ch08 - 推进到reveal ==========
  console.log('\n=== PART 5: ch08 reveal ===');
  await page.evaluate(() => window.__debug__.switchTo('ch08'));
  await sleep(2000);

  console.log('  Advancing ch08: mirror → reveal');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'reveal';
    ch.phaseTime = 0.6;
  });
  await sleep(1500);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch08_reveal_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch08 reveal (mirror_smile)');
  results.push({ key: 'ch08_reveal', desc: '镜中微笑揭示 - mirror_smile淡入', status: 'captured' });

  // ========== 6. ch10 - montage, reunion, finalReport ==========
  console.log('\n=== PART 6: ch10 phase progression ===');
  await page.evaluate(() => window.__debug__.switchTo('ch10'));
  await sleep(2000);

  // montage
  console.log('  Advancing: porridge → montage');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    // MontageActivity uses import so it may not be in global scope
    // We need to manually set up the montage frames
    ch.phase = 'montage';
    ch.phaseTime = 0;
  });
  await sleep(3000); // 等待字幕交叉淡入

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch10_montage_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch10 montage');
  results.push({ key: 'ch10_montage', desc: '蒙太奇阶段 - livingroom/porridge/closeup/embrace', status: 'captured' });

  // reunion
  console.log('  Advancing: montage → reunion');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'reunion';
    ch.phaseTime = 0;
  });
  await sleep(3000);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch10_reunion_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch10 reunion (embrace)');
  results.push({ key: 'ch10_reunion', desc: '拥抱定格 - father_daughter_embrace', status: 'captured' });

  // finalReport
  console.log('  Advancing: reunion → finalReport');
  await page.evaluate(() => {
    const ch = window.game.chapterManager.currentChapter;
    ch.phase = 'finalReport';
    ch.phaseTime = 0;
  });
  await sleep(3000);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'ch10_finalreport_full.png'),
    clip: await page.evaluate(() => {
      const c = document.getElementById('gameCanvas').getBoundingClientRect();
      return { x: c.x, y: c.y, width: c.width, height: c.height };
    })
  });
  console.log('  Captured ch10 finalReport (reportBase)');
  results.push({ key: 'ch10_finalReport', desc: '记忆报告 - reportBase', status: 'captured' });

  // ========== 7. Overlay 记忆报告（所有章节）==========
  console.log('\n=== PART 7: Overlay memory reports ===');

  for (let chNum = 1; chNum <= 10; chNum++) {
    const chId = chNum < 10 ? `ch0${chNum}` : `ch10`;
    console.log(`  Triggering overlay for chapter ${chNum}...`);

    // 清除overlay先
    await page.evaluate(() => {
      if (window.game.overlay && window.game.overlay.hide) window.game.overlay.hide();
    });

    // 触发overlay
    await page.evaluate((n) => {
      const overlay = window.game.overlay;
      if (overlay && overlay.show) {
        overlay.show({
          type: 'complete',
          chapterNumber: n,
          memoryFrom: n === 1 ? 0 : (n-1)*10,
          memoryTo: n * 10,
          onContinue: () => {}
        });
      }
    }, chNum);
    await sleep(3000);

    // Check if overlay rendered
    const overlayActive = await page.evaluate(() => {
      return !!(window.game.overlay && window.game.overlay.active);
    });
    console.log(`  Overlay active: ${overlayActive}`);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `overlay_ch${chId}_full.png`),
      clip: await page.evaluate(() => {
        const c = document.getElementById('gameCanvas').getBoundingClientRect();
        return { x: c.x, y: c.y, width: c.width, height: c.height };
      })
    });
    console.log(`  Captured overlay ch${chNum}`);
    results.push({ key: `overlay_ch${chNum}`, desc: `第${chNum}章完成报告`, status: 'captured' });

    // 关闭overlay
    await page.evaluate(() => {
      if (window.game.overlay && window.game.overlay.hide) window.game.overlay.hide();
    });
    await sleep(500);
  }

  // Save results
  const resultPath = path.join(OUTPUT_DIR, 'capture_results_phase2.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\nPhase 2 complete! ${results.length} screenshots captured.`);
  console.log(`Results: ${resultPath}`);

  await browser.close();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
