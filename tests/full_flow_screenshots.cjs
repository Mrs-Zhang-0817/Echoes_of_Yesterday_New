// 全流程截图验收测试
// 操作前截图 → 操作后截图 → 分析卡关位置

const { chromium } = require('playwright');
const path = require('path');

const URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots_audit');
const SCREENSHOT_INDEX = [];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, label) {
  const filename = `${String(SCREENSHOT_INDEX.length).padStart(3, '0')}_${label}.png`;
  SCREENSHOT_INDEX.push(filename);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
  console.log(`  📸 ${filename}`);
}

async function click(page, x, y) {
  await page.mouse.click(x, y);
  await sleep(300);
}

async function drag(page, x1, y1, x2, y2) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await sleep(50);
  await page.mouse.move(x2, y2, { steps: 10 });
  await sleep(50);
  await page.mouse.up();
  await sleep(300);
}

async function waitForCanvas(page) {
  await page.waitForSelector('canvas#gameCanvas', { timeout: 30000 });
  await page.waitForFunction(() => {
    const canvas = document.getElementById('gameCanvas');
    return canvas && canvas.style.display !== 'none';
  }, { timeout: 15000 });
  await sleep(2000);
}

(async () => {
  const fs = require('fs');
  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('\n=== 主菜单截图 ===');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await sleep(1000);
  await screenshot(page, '01_main_menu');

  // 点"开始回忆"
  await page.click('#BTN_START_MEMORY');
  await sleep(500);
  await waitForCanvas(page);

  console.log('\n=== Ch1 镜前 ===');
  await screenshot(page, 'ch01_01_idle');
  // 点镜子区域
  await click(page, 640, 340);
  await sleep(500);
  await screenshot(page, 'ch01_02_shattering');
  // 等碎裂完成
  await sleep(2500);
  await screenshot(page, 'ch01_03_after_shatter');

  // 等漫画播放（5个场景，每个约0.5s点击）
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await sleep(1000);
  await screenshot(page, 'ch01_04_after_comics');

  // 尝试点"继续"按钮（在报告页）
  await sleep(1000);
  await click(page, 640, 600);
  await sleep(500);
  await screenshot(page, 'ch01_05_after_continue');

  console.log('\n=== Ch2 拼图 ===');
  await waitForCanvas(page);
  await sleep(1000);
  await screenshot(page, 'ch02_01_comics_playing');

  // 等漫画（4个场景）
  for (let i = 0; i < 15; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await sleep(1000);
  await screenshot(page, 'ch02_02_puzzle_start');

  // 拖拼图——依次拖每个碎片到目标位置
  const pieces = [
    { from: [350, 350], to: [380, 280] },
    { from: [450, 360], to: [570, 280] },
    { from: [550, 350], to: [760, 280] },
    { from: [350, 450], to: [380, 460] },
    { from: [450, 460], to: [570, 460] },
    { from: [550, 460], to: [760, 460] },
    { from: [350, 550], to: [380, 640] },
    { from: [450, 560], to: [570, 640] },
    { from: [550, 550], to: [760, 640] },
  ];
  for (const p of pieces) {
    await drag(page, p.from[0], p.from[1], p.to[0], p.to[1]);
    await sleep(500);
  }
  await sleep(2000);
  await screenshot(page, 'ch02_03_puzzle_done');

  // 等闪回+漫画
  await sleep(4000);
  for (let i = 0; i < 15; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await sleep(1500);
  await screenshot(page, 'ch02_04_after_complete');

  // 点继续
  await click(page, 640, 600);
  await sleep(1000);
  await screenshot(page, 'ch02_05_continue_clicked');

  console.log('\n=== Ch3 迷途 ===');
  await waitForCanvas(page);
  // 等漫画（8个场景）
  for (let i = 0; i < 25; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await sleep(1000);
  await screenshot(page, 'ch03_01_maze_start');

  // 连线——从起点画到终点
  await page.mouse.move(200, 500);
  await page.mouse.down();
  for (let x = 200; x < 800; x += 30) {
    await page.mouse.move(x, 500 - Math.sin(x * 0.02) * 50, { steps: 3 });
    await sleep(30);
  }
  await page.mouse.up();
  await sleep(2000);
  await screenshot(page, 'ch03_02_route_drawn');

  // 等 success → comic
  await sleep(4000);
  for (let i = 0; i < 15; i++) {
    await sleep(400);
    await page.mouse.click(640, 360);
  }
  await sleep(1500);
  await screenshot(page, 'ch03_03_after_complete');

  // 点继续
  await click(page, 640, 600);
  await sleep(1000);
  await screenshot(page, 'ch03_04_continue');

  console.log('\n=== Ch4 警局 ===');
  await waitForCanvas(page);
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await sleep(500);
  await screenshot(page, 'ch04_01_phone');

  // 点电话区域
  await click(page, 280, 420);
  await sleep(3000);
  await screenshot(page, 'ch04_02_after_phone');

  // 签字区域——随便画
  await page.mouse.move(400, 400);
  await page.mouse.down();
  for (let x = 300; x < 700; x += 20) {
    await page.mouse.move(x, 350 + Math.sin(x * 0.05) * 30, { steps: 2 });
    await sleep(20);
  }
  await page.mouse.up();
  await sleep(500);

  // 点提交按钮
  await click(page, 640, 550);
  await sleep(1000);
  await screenshot(page, 'ch04_03_form');

  // 点手环
  await click(page, 120, 560);
  await sleep(3000);
  await screenshot(page, 'ch04_04_bracelet');

  // 等漫画
  for (let i = 0; i < 15; i++) {
    await sleep(400);
    await page.mouse.click(640, 360);
  }
  await sleep(1500);
  await screenshot(page, 'ch04_05_complete');

  await click(page, 640, 600);
  await sleep(1000);
  await screenshot(page, 'ch04_06_continue');

  console.log('\n=== Ch5 归家 ===');
  await waitForCanvas(page);
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await screenshot(page, 'ch05_01_elevator');

  // 点电梯按钮
  await click(page, 640, 400);
  await sleep(3000);
  await screenshot(page, 'ch05_02_elevating');

  // 等漫画
  for (let i = 0; i < 15; i++) {
    await sleep(400);
    await page.mouse.click(640, 360);
  }
  await sleep(1500);
  await screenshot(page, 'ch05_03_complete');

  await click(page, 640, 600);
  await sleep(1000);

  console.log('\n=== Ch6 餐桌 ===');
  await waitForCanvas(page);
  for (let i = 0; i < 15; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }
  await screenshot(page, 'ch06_01_bowl');

  // 搅拌——在碗区域画圈
  await page.mouse.move(640, 500);
  await page.mouse.down();
  for (let a = 0; a < Math.PI * 6; a += 0.3) {
    await page.mouse.move(640 + Math.sin(a) * 100, 500 + Math.cos(a) * 60, { steps: 3 });
    await sleep(30);
  }
  await page.mouse.up();
  await sleep(3000);
  await screenshot(page, 'ch06_02_after_stir');

  // 等漫画
  for (let i = 0; i < 15; i++) {
    await sleep(400);
    await page.mouse.click(640, 360);
  }
  await sleep(1500);
  await screenshot(page, 'ch06_03_complete');

  await click(page, 640, 600);
  await sleep(1000);

  console.log('\n=== Ch7 夜醒 ===');
  await waitForCanvas(page);
  await sleep(2000);
  await screenshot(page, 'ch07_01_night');

  // 点气泡（找门锁前先点屏幕）
  for (let i = 0; i < 5; i++) {
    await click(page, 200 + i * 200, 200 + i * 50);
    await sleep(800);
  }
  await screenshot(page, 'ch07_02_bubbles');

  // 找门锁（拖拽手电筒）
  for (let x = 100; x < 1100; x += 100) {
    await page.mouse.move(x, 360);
    await sleep(200);
  }
  await sleep(2000);
  await screenshot(page, 'ch07_03_door_found');

  // 等待完成
  await sleep(3000);
  await screenshot(page, 'ch07_04_complete');

  await click(page, 640, 600);
  await sleep(1000);

  console.log('\n=== Ch8 镜子 ===');
  await waitForCanvas(page);
  await sleep(500);
  await screenshot(page, 'ch08_01_mirror');

  // 等漫画
  for (let i = 0; i < 5; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }

  // 微笑检测或挥手
  await click(page, 660, 600);
  await sleep(1000);
  await screenshot(page, 'ch08_02_wave');

  // 挥手——从左到右
  await page.mouse.move(200, 400);
  await page.mouse.down();
  for (let x = 200; x < 900; x += 30) {
    await page.mouse.move(x, 400 + Math.sin(x * 0.03) * 40, { steps: 3 });
    await sleep(30);
  }
  await page.mouse.up();
  await sleep(3000);
  await screenshot(page, 'ch08_03_complete');

  await click(page, 640, 600);
  await sleep(1000);

  console.log('\n=== Ch9 风铃 ===');
  await waitForCanvas(page);
  await sleep(500);
  await screenshot(page, 'ch09_01_comic');
  for (let i = 0; i < 5; i++) {
    await sleep(500);
    await page.mouse.click(640, 360);
  }

  // 拖音符到目标槽
  for (let i = 0; i < 4; i++) {
    const fromX = 300 + i * 240;
    const toX = 360 + i * 190;
    await drag(page, fromX, 200, toX, 430);
    await sleep(800);
  }
  await screenshot(page, 'ch09_02_glyphs');

  await sleep(2000);
  await screenshot(page, 'ch09_03_rhythm');

  // 点音符轨道（节奏游戏）
  for (let i = 0; i < 5; i++) {
    await click(page, 640, 400);
    await sleep(800);
  }
  await sleep(2000);
  await screenshot(page, 'ch09_04_complete');

  await click(page, 640, 600);
  await sleep(1000);

  console.log('\n=== Ch10 认出 ===');
  await waitForCanvas(page);
  await sleep(1000);
  await screenshot(page, 'ch10_01_porridge');

  // 点粥
  await click(page, 640, 500);
  await sleep(5000);
  await screenshot(page, 'ch10_02_montage');

  await sleep(4000);
  await screenshot(page, 'ch10_03_report');

  // 点重新开始
  await click(page, 640, 670);
  await sleep(2000);
  await screenshot(page, 'ch10_04_restart');

  console.log(`\n=== 完成！共 ${SCREENSHOT_INDEX.length} 张截图 ===`);
  console.log(`截图目录: ${SCREENSHOT_DIR}`);

  await browser.close();
})();
