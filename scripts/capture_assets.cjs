// 《昨日重现》美术素材逆向验证 - Playwright截图脚本
// 运行: node scripts/capture_assets.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_URL = 'http://127.0.0.1:3001/index.html';
const DESIGN_W = 1280, DESIGN_H = 720;
const OUTPUT_DIR = path.join(__dirname, '..', 'verified_screenshots');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
const REPORT_DIR = path.join(ASSETS_DIR, 'report');

// 确保输出目录存在
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 渲染位置映射（从asset_render_map.json精简）
const IMAGE_MAP = [
  // Fullscreen backgrounds
  { key:'ch4_police_01', chapter:'ch04', phase:null, type:'fullscreen', desc:'警局场景背景' },
  { key:'ch8_corridor', chapter:'ch08', phase:'mirror', type:'fullscreen', desc:'走廊底图' },
  { key:'ch5_bg_elevator', chapter:'ch05', phase:'gating2', type:'fullscreen', desc:'电梯场景底图' },
  { key:'ch6_bg_diningroom', chapter:'ch06', phase:'gating1', type:'fullscreen', desc:'餐桌场景底图' },
  { key:'ch7_bg_bedroom_night', chapter:'ch07', phase:'nightNarrative', type:'fullscreen', desc:'卧室夜景底图' },
  { key:'ch9_balcony', chapter:'ch09', phase:'intro', type:'fullscreen', desc:'阳台夜景' },
  { key:'ch10_livingroom', chapter:'ch10', phase:'porridge', type:'fullscreen', desc:'客厅场景' },
  { key:'mainMenuBg', chapter:'ch01', phase:'idle', type:'fullscreen', desc:'镜子房间背景' },
  { key:'ch3_map_phone', chapter:'ch03', phase:'idle', type:'fullscreen', desc:'城市地图迷宫' },
  { key:'reportBase', chapter:'ch10', phase:'finalReport', type:'fullscreen', desc:'记忆报告背景' },
  { key:'paperBase', chapter:'ch04', phase:'signature', type:'fullscreen', desc:'签名纸底图' },

  // Positioned elements
  { key:'ch4_police_03', chapter:'ch04', phase:'bracelet', type:'positioned', rect:[320,264,320,320], desc:'手环焦点图' },
  { key:'ch4_police_08', chapter:'ch04', phase:'form', type:'positioned', rect:[200,330,200,200], desc:'重逢焦点图' },
  { key:'ch8_mirror_wall', chapter:'ch08', phase:'mirror', type:'positioned', rect:[370,42,540,520], desc:'墙面镜框' },
  { key:'ch8_mirror_stranger', chapter:'ch08', phase:'mirror', type:'positioned', rect:[500,115,280,360], desc:'镜中陌生人' },
  { key:'ch8_crack', chapter:'ch08', phase:'mirror', type:'positioned', rect:[470,92,340,420], desc:'镜面裂纹' },
  { key:'ch8_mirror_smile', chapter:'ch08', phase:'reveal', type:'positioned', rect:[500,115,280,360], desc:'镜中微笑' },
  { key:'ch7_door_lock', chapter:'ch07', phase:'flashlightSearch', type:'positioned', rect:[610,450,60,100], desc:'门锁' },
  { key:'ch7_hallucination_shadow', chapter:'ch07', phase:'hallucinationClear', type:'positioned', rect:[520,200,240,320], desc:'幻觉阴影' },
  { key:'ch7_flashlight_beam', chapter:'ch07', phase:'flashlightSearch', type:'positioned_click', desc:'手电筒光束' },
  { key:'ch6_bowl_noodles', chapter:'ch06', phase:'gating2', type:'positioned', rect:[380,380,520,250], desc:'面条碗' },
  { key:'ch9_pipes', chapter:'ch09', phase:'intro', type:'positioned', rect:[440,10,400,350], desc:'风铃管' },
  { key:'ch10_porridge', chapter:'ch10', phase:'porridge', type:'positioned', rect:[500,400,280,200], desc:'粥碗' },
  { key:'ch5_sunflower_sticker', chapter:'ch05', phase:'gating2', type:'positioned', rect:[600,360,68,68], desc:'向日葵贴纸' },
  { key:'ch5_elevator_sunflower_panel', chapter:'ch05', phase:'gating2', type:'positioned', rect:[390,50,500,620], desc:'向日葵面板' },

  // Flashback frames (ch02)
  { key:'ch2_flashback_01', chapter:'ch02', phase:'flashback', type:'fullscreen', desc:'闪回帧1(放学)' },
  { key:'ch2_flashback_02', chapter:'ch02', phase:'flashback', type:'fullscreen', desc:'闪回帧2' },
  { key:'ch2_flashback_03', chapter:'ch02', phase:'flashback', type:'fullscreen', desc:'闪回帧3' },
  { key:'ch2_flashback_04', chapter:'ch02', phase:'flashback', type:'fullscreen', desc:'闪回帧4' },
  { key:'ch2_flashback_05', chapter:'ch02', phase:'flashback', type:'fullscreen', desc:'闪回帧5' },

  // Flashback frames (ch03)
  { key:'ch3_cityup_01', chapter:'ch03', phase:'cityFlashback', type:'fullscreen', desc:'城市闪回1' },
  { key:'ch3_cityup_02', chapter:'ch03', phase:'cityFlashback', type:'fullscreen', desc:'城市闪回2' },
  { key:'ch3_cityup_03', chapter:'ch03', phase:'cityFlashback', type:'fullscreen', desc:'城市闪回3' },
  { key:'ch3_cityup_04', chapter:'ch03', phase:'cityFlashback', type:'fullscreen', desc:'城市闪回4' },

  // Ch09 flashback
  { key:'ch9_father_building_chime', chapter:'ch09', phase:'flashback', type:'fullscreen', desc:'父建风铃闪回' },

  // Ch10 montage frames
  { key:'ch10_daughter_porridge_closeup', chapter:'ch10', phase:'montage', type:'fullscreen', desc:'女儿粥碗特写' },
  { key:'ch10_father_daughter_embrace', chapter:'ch10', phase:'montage', type:'fullscreen', desc:'父女拥抱' },

  // Puzzle
  { key:'puzzle', chapter:'ch02', phase:'playing', type:'fullscreen', desc:'拼图底图' },
];

// Not rendered (only document, no screenshots)
const NOT_RENDERED = [
  'ch2_tinbox_open', 'ch2_key_inside', 'ch2_candy_inside',
  'ch3_bg_old_community', 'ch3_bg_city_street', 'ch3_bg_school_gate', 'ch3_npc_passerby', 'ch3_red_scarf_girl',
  'ch4_police_02', 'ch4_police_04', 'ch4_police_05', 'ch4_police_06', 'ch4_police_07',
  'sign', 'ch8_hourglass', 'ch8_radio', 'ch8_radio_knob',
  'ch9_notebook', 'ch9_notebook_glyphs', 'paperNoise', 'buttonFrame',
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // Set viewport to match design resolution
  await page.setViewportSize({ width: DESIGN_W, height: DESIGN_H });

  console.log(`导航到 ${GAME_URL}...`);
  await page.goto(GAME_URL, { waitUntil: 'networkidle' });

  // 等待游戏加载完成（debug API 可用）
  await page.waitForFunction(() => {
    return typeof window.__debug__ !== 'undefined' && typeof window.game !== 'undefined';
  }, { timeout: 20000 });
  console.log('游戏加载完成');

  // 等启动画面/loading消失
  await sleep(3000);

  const results = [];

  // 遍历每一张图片
  for (const img of IMAGE_MAP) {
    const { key, chapter, phase, type, rect, desc } = img;
    const fileName = getFileName(key);
    const originalPath = findOriginalFile(key);
    const existsOnDisk = fs.existsSync(originalPath);

    console.log(`\n[${key}] ${desc} (ch${chapter}, phase:${phase}, type:${type})`);

    try {
      // 切换到目标章节
      console.log(`  切换到 ${chapter}...`);
      await page.evaluate((ch) => {
        window.__debug__.switchTo(ch);
      }, chapter);
      await sleep(2500); // 等待过渡动画

      // 检查canvas是否渲染
      const meta = await page.evaluate(() => window.__debug__.screenshotMeta());
      console.log(`  当前状态: chapter=${meta.chapter}, phase=${meta.phase}`);

      // 对于需要特定phase的，检查是否能进入
      if (phase && phase.includes('flashback')) {
        // Flashback需要先完成当前章节的前置阶段
        // 尝试通过forceComplete跳过前置阶段
        console.log(`  尝试触发flashback阶段...`);

        if (chapter === 'ch02') {
          // Ch2: 需要先完成拼图
          try {
            await page.evaluate(() => {
              const ch = window.game.chapterManager.currentChapter;
              if (ch && ch._completed === false && ch.phase !== 'flashback') {
                // 强制跳转到flashback
                ch.phase = 'completeHold';
                ch.phaseTime = 4; // 超过3s阈值
                // 手动触发flashback创建
                if (typeof ch.flashback?.start === 'function') {
                  ch.phase = 'flashback';
                  ch.phaseTime = 0;
                }
              }
            });
            await sleep(500);
          } catch(e) { console.log(`  flashback触发异常: ${e.message}`); }
        } else if (chapter === 'ch03') {
          try {
            await page.evaluate(() => {
              const ch = window.game.chapterManager.currentChapter;
              if (ch && ch.phase !== 'cityFlashback') {
                ch.points = []; // 清空路径
                ch.phase = 'drawing';
                ch.phaseTime = 5; // 超过绘制时间
              }
            });
            await sleep(500);
          } catch(e) {}
        } else if (chapter === 'ch09') {
          try {
            await page.evaluate(() => {
              const ch = window.game.chapterManager.currentChapter;
              if (ch && ch.state !== 'flashback') {
                ch.state = 'flashback';
                ch.stateTime = 0;
              }
            });
            await sleep(500);
          } catch(e) {}
        }
        await sleep(1000);
      }

      // 检查当前phase，如果不对则尝试forceComplete + 重切换
      const meta2 = await page.evaluate(() => window.__debug__.screenshotMeta());
      console.log(`  截图前状态: phase=${meta2.phase}`);

      // 对于需要点击交互才能进入的phase（如signature需要点击电话）
      if (phase === 'signature' && meta2.phase !== 'signature') {
        console.log(`  尝试进入signature阶段...`);
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch.phase === 'phone') {
              // 模拟点击电话区域(200,310-350)
              ch.phase = 'ringing';
              ch.phaseTime = 1.5; // 跳过3次铃声
            }
            if (ch && ch.phase === 'ringing') {
              ch.phaseTime = 1.5;
            }
          });
          await sleep(2000);
        } catch(e) {}
      }

      // 进入bracelet/form阶段需要先通过signature
      if ((phase === 'bracelet' || phase === 'form') && meta2.phase !== phase) {
        console.log(`  尝试进入${phase}阶段...`);
        try {
          await page.evaluate((targetPhase) => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch) {
              if (ch.phase === 'phone') { ch.phase = 'ringing'; ch.phaseTime = 1.5; }
              if (ch.phase === 'ringing') { ch.phaseTime = 1.5; }
              if (ch.phase === 'signature') {
                if (ch.signature) {
                  ch.signature.attempts = 3;
                  ch.signature._complete = true;
                }
                ch.phase = 'form';
                ch.phaseTime = 0;
              }
            }
          }, phase);
          await sleep(1500);
        } catch(e) {}
      }

      // 进入hallucinationClear或doorOpen
      if (chapter === 'ch07' && (phase === 'hallucinationClear' || phase === 'doorOpen')) {
        try {
          await page.evaluate((p) => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch) ch.phase = p;
          }, phase);
          await sleep(1500);
        } catch(e) {}
      }

      // ch10: 提前进入montage/reunion/finalReport
      if (chapter === 'ch10' && phase !== 'porridge') {
        try {
          await page.evaluate((p) => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch._go) {
              ch._go(p);
            }
          }, phase);
          await sleep(2000);
        } catch(e) {
          console.log(`  ch10跳转失败: ${e.message}`);
        }
      }

      // ch04 需要点击bracelet进入手环揭示
      if (phase === 'bracelet' && chapter === 'ch04') {
        await sleep(500);
      }

      // 对于flashlightSearch + 需要点击来显示手指光束的
      if (phase === 'flashlightSearch' && type === 'positioned_click') {
        try {
          await page.mouse.move(640, 360);
          await page.mouse.down();
          await sleep(200);
          await page.mouse.up();
          await sleep(300);
        } catch(e) {}
      }

      // 对ch08 reveal阶段：需要强制进入
      if (phase === 'reveal' && chapter === 'ch08') {
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch) {
              ch.phase = 'reveal';
              ch.phaseTime = 0.5;
            }
          });
          await sleep(1000);
        } catch(e) {}
      }

      // ch05 gating2阶段
      if (phase === 'gating2') {
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch.phase !== 'gating2' && ch.phase !== 'gating2_elevating') {
              ch.phase = 'gating2';
              ch.phaseTime = 0;
            }
          });
          await sleep(1500);
        } catch(e) {}
      }

      // ch06 gating2
      if (phase === 'gating2' && chapter === 'ch06') {
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch.phase !== 'gating2') {
              ch.phase = 'gating2';
              ch.phaseTime = 0;
            }
          });
          await sleep(1500);
        } catch(e) {}
      }

      // ch09 flashback
      if (phase === 'flashback' && chapter === 'ch09') {
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch.state !== 'flashback') {
              ch.state = 'flashback';
              ch.stateTime = 0;
            }
          });
          await sleep(1000);
        } catch(e) {}
      }

      // ch10 finalReport
      if (phase === 'finalReport' && chapter === 'ch10') {
        try {
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch._go) {
              ch._go('reunion');
            }
          });
          await sleep(4000);
          await page.evaluate(() => {
            const ch = window.game.chapterManager.currentChapter;
            if (ch && ch._go) {
              ch._go('finalReport');
            }
          });
          await sleep(2000);
        } catch(e) {}
      }

      // 截图
      // 先整体截图canvas区域
      const canvasRect = await page.evaluate(() => {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      });

      // 保存全屏截图
      const fullScreenshotPath = path.join(OUTPUT_DIR, `${key}_full.png`);
      await page.screenshot({
        path: fullScreenshotPath,
        clip: { x: canvasRect.x, y: canvasRect.y, width: canvasRect.w, height: canvasRect.h }
      });

      // 对positioned类型，裁剪指定区域
      let cropPath = null;
      if (type === 'positioned' && rect) {
        cropPath = path.join(OUTPUT_DIR, `${key}_crop.png`);
        const [rx, ry, rw, rh] = rect;
        await page.screenshot({
          path: cropPath,
          clip: {
            x: canvasRect.x + rx * (canvasRect.w / DESIGN_W),
            y: canvasRect.y + ry * (canvasRect.h / DESIGN_H),
            width: rw * (canvasRect.w / DESIGN_W),
            height: rh * (canvasRect.h / DESIGN_H),
          }
        });
      }

      result = {
        key, fileName, chapter, phase, type, desc,
        existsOnDisk,
        fullScreenshot: path.basename(fullScreenshotPath),
        cropScreenshot: cropPath ? path.basename(cropPath) : null,
        status: 'captured'
      };
    } catch(e) {
      console.error(`  截图失败: ${e.message}`);
      result = {
        key, desc,
        existsOnDisk: findOriginalFile(key) ? true : false,
        status: 'error',
        error: e.message
      };
    }

    results.push(result);
  }

  // 检查未渲染图片的文件存在性
  for (const key of NOT_RENDERED) {
    results.push({
      key,
      fileName: getFileName(key),
      chapter: '-',
      phase: 'none',
      type: 'notRendered',
      desc: '已预加载但代码未渲染',
      existsOnDisk: fs.existsSync(findOriginalFile(key)),
      status: 'notRendered'
    });
  }

  // 保存结果JSON
  const outputPath = path.join(OUTPUT_DIR, 'capture_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n完成！共处理 ${results.length} 张图片`);
  console.log(`截图保存至: ${OUTPUT_DIR}`);
  console.log(`结果JSON: ${outputPath}`);

  await browser.close();
}

function getFileName(key) {
  const map = {
    'puzzle': 'scene_puzzle.jpg',
    'reportBase': 'report_base.png',
    'mainMenuBg': 'main_menu_bg.jpg',
    'deskBg': 'desk_bg.jpg',
    'paperBase': 'paper_base.png',
    'paperNoise': 'paper_noise.png',
    'buttonFrame': 'button_frame.png',
    'sign': 'sign_scene.png',
  };
  if (map[key]) return map[key];
  // 猜测命名: key + .png 或 key + .jpg
  return key + '.png';
}

function findOriginalFile(key) {
  const fileName = getFileName(key);
  const paths = [
    path.join(ASSETS_DIR, fileName),
    path.join(ASSETS_DIR, key.replace(/_/g, '') + '.jpg'),
    path.join(ASSETS_DIR, key.replace(/_/g, '') + '.png'),
    path.join(REPORT_DIR, path.basename(fileName)),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  // Try wildcard
  if (key.startsWith('report/')) {
    const p = path.join(REPORT_DIR, path.basename(key.replace('report/', '')));
    if (fs.existsSync(p)) return p;
  }
  return fileName;
}

main().catch(e => {
  console.error('脚本异常:', e);
  process.exit(1);
});
