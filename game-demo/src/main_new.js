// 《昨日重现》入口
import { Game } from './core/Game.js';
import { InputManager } from './core/InputManager.js';
import { Loader } from './core/Loader.js';
import { ChapterManager } from './core/ChapterManager.js';
import { ProgressStore } from './core/ProgressStore.js';
import { Overlay } from './core/Overlay.js';
import { createDebugAPI } from './dev/DebugAPI.js';

import { Chapter01 } from './chapters/ch01_intro.js';
import { Chapter02 } from './chapters/ch02_puzzle.js';
import { Chapter03 } from './chapters/ch03_maze.js';
import { Chapter04 } from './chapters/ch04_police.js';
import { Chapter05 } from './chapters/ch05_door.js';
import { Chapter06 } from './chapters/ch06_table.js';
import { Chapter07 } from './chapters/ch07_night.js';
import { Chapter08 } from './chapters/ch08_sign.js';
import { Chapter09 } from './chapters/ch09_chime.js';
import { Chapter10 } from './chapters/ch10_report.js';
import CHAPTERS from './data/chapters.json' with { type: 'json' };
import assetManifest from './data/assetManifest.js';

const DESIGN_W = 1280;
const DESIGN_H = 720;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dpr = 1;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  const { innerWidth: w, innerHeight: h } = window;

  scale = Math.min(w / DESIGN_W, h / DESIGN_H);
  const displayW = DESIGN_W * scale;
  const displayH = DESIGN_H * scale;
  offsetX = (w - displayW) / 2;
  offsetY = (h - displayH) / 2;

  canvas.width = Math.round(DESIGN_W * dpr);
  canvas.height = Math.round(DESIGN_H * dpr);

  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
  canvas.style.left = offsetX + 'px';
  canvas.style.top = offsetY + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 300));
resizeCanvas();

// 竖屏提示
function createRotateHint() {
  const el = document.createElement('div');
  el.id = 'rotate-hint';
  el.innerHTML = `<div style="position:fixed;inset:0;z-index:9999;background:#0d0805;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#d4b896;font-family:system-ui,sans-serif;"><div style="font-size:64px;margin-bottom:20px;">📱</div><p style="font-size:20px;letter-spacing:0.1em;">请将设备旋转至横屏</p><p style="font-size:14px;opacity:0.5;margin-top:8px;">横屏体验更佳</p></div>`;
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

const rotateHint = createRotateHint();

function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  rotateHint.style.display = isPortrait ? 'block' : 'none';
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 300));
checkOrientation();

// Loading
function drawStatus(message) {
  ctx.fillStyle = '#0d0906';
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  ctx.fillStyle = '#f4e2bd';
  ctx.font = '500 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, DESIGN_W / 2, DESIGN_H / 2);
}

async function bootGame(startChapter) {
  drawStatus('正在唤醒记忆……');

  // 确保 canvas 可见并调整尺寸
  document.getElementById('gameCanvas').style.display = 'block';

  try {
    const images = await Loader.loadImages(assetManifest, (loaded, total) => {
      drawStatus(`正在唤醒记忆……${loaded}/${total}`);
    });

    const game = { canvas, ctx, width: DESIGN_W, height: DESIGN_H, images };
    game.input = new InputManager(canvas, DESIGN_W, DESIGN_H);
    game.progress = new ProgressStore('ye_v1_progress');
    game.overlay = new Overlay(game);
    game.chapterManager = new ChapterManager(game);

    // 注册全部 10 章（章节配置统一来自 chapters.json）
    const CHAPTER_CLASSES = [null, Chapter01, Chapter02, Chapter03, Chapter04, Chapter05, Chapter06, Chapter07, Chapter08, Chapter09, Chapter10];
    const sortedChapters = [...CHAPTERS].sort((a, b) => a.order - b.order);
    sortedChapters.forEach(ch => {
      const key = `ch${String(ch.order).padStart(2, '0')}`;
      game.chapterManager.register(key, CHAPTER_CLASSES[ch.order]);
    });

    window.game = game;

    // ===== 调试接口（开发态）=====
    //   window.__debug__.inspect()    — 完整快照（含章节内部状态 + 交互热区）
    //   window.__debug__.state()      — 全局状态摘要
    //   window.__debug__.screenshotMeta() — Playwright 截图验证元数据
    //   键盘：D=状态快照 | F=强制完成 | 1-0=跳转章节
    const debugAPI = createDebugAPI(game);
    window.__debug__ = debugAPI;

    window.addEventListener('keydown', e => {
      if (e.key === 'd' || e.key === 'D') {
        const snap = debugAPI.inspect();
        console.group('🛠 DebugAPI 完整快照');
        console.log(JSON.stringify(snap, null, 2));
        console.groupEnd();
        // 表格视图只显示概要字段
        console.table({
          chapter: snap.chapter,
          phase: snap.chapterDetail ? snap.chapterDetail.phase : '?',
          overlayActive: snap.overlay ? snap.overlay.active : false,
          zones: snap.chapterDetail ? (snap.chapterDetail.interactiveZones || []).length : 0,
          progress: snap.progress ? snap.progress.memory : 0,
        });
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) debugAPI.switchTo('ch0' + num);
      if (num === 0) debugAPI.switchTo('ch10');
      if (e.key === 'f' || e.key === 'F') {
        debugAPI.forceComplete();
        console.log('Forced complete on current chapter');
      }
    });
    console.log('🛠 调试面板就绪 | D=状态快照(inspect) | F=强制完成 | 1-0=跳转 | window.__debug__ 可用');

    // 从传递给 bootGame 的 startChapter 参数决定起始章节
    const REGISTERED = sortedChapters.map(ch => `ch${String(ch.order).padStart(2, '0')}`);
    if (!REGISTERED.includes(startChapter)) {
      const chNum = parseInt(startChapter.replace('ch', ''), 10);
      const closest = REGISTERED.map(r => parseInt(r.replace('ch', ''), 10))
        .filter(n => n <= chNum)
        .sort((a, b) => b - a)[0];
      startChapter = closest ? `ch${String(closest).padStart(2, '0')}` : 'ch01';
    }
    game.chapterManager.switchTo(startChapter);

    new Game(game).start();

    // 隐藏 loading 遮罩
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  } catch (error) {
    console.error(error);
    ctx.fillStyle = '#0d0906';
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    ctx.fillStyle = '#d4b896';
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('出错了，请重启试试……', DESIGN_W / 2, DESIGN_H / 2);
    // 显示 loading，让用户能看到错误信息
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// 挂载到全局，供主菜单模块（MainMenu.js）调用
window.bootGame = bootGame;
