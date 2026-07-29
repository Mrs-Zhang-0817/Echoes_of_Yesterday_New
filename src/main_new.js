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

async function boot() {
  drawStatus('正在唤醒记忆……');

  try {
    const manifest = {
      // —— Ch2 拼图 ——
      puzzle:     './assets/images/scene_puzzle.jpg',
      // —— Ch4 警局 ——
      ch4_police_01: './assets/images/ch4_police_01.png',
      ch4_police_02: './assets/images/ch4_police_02.png',
      ch4_police_03: './assets/images/ch4_police_03.png',
      ch4_police_04: './assets/images/ch4_police_04.png',
      ch4_police_05: './assets/images/ch4_police_05.png',
      ch4_police_06: './assets/images/ch4_police_06.png',
      ch4_police_07: './assets/images/ch4_police_07.png',
      ch4_police_08: './assets/images/ch4_police_08.png',
      // —— Ch8 签字关卡 ——
      sign:              './assets/images/sign_scene.png',
      ch8_corridor:      './assets/images/ch8_corridor.jpg',
      ch8_mirror_wall:   './assets/images/ch8_mirror_wall.png',
      ch8_mirror_stranger:'./assets/images/ch8_mirror_stranger.png',
      ch8_crack:         './assets/images/ch8_crack.png',
      ch8_hourglass:     './assets/images/ch8_hourglass.png',
      ch8_radio:         './assets/images/ch8_radio.png',
      // —— Ch9 风铃 ——
      ch9_balcony:  './assets/images/ch9_balcony.jpg',
      ch9_pipes:    './assets/images/ch9_pipes.png',
      ch9_notebook: './assets/images/ch9_notebook.png',
      // —— Ch10 终章 ——
      reportBase:     './assets/images/report_base.png',
      ch10_livingroom:'./assets/images/ch10_livingroom.jpg',
      ch10_porridge:  './assets/images/ch10_porridge.png',
      // —— 全局场景 & UI ——
      mainMenuBg:  './assets/images/main_menu_bg.jpg',
      deskBg:      './assets/images/desk_bg.jpg',
      paperBase:   './assets/images/paper_base.png',
      paperNoise:  './assets/images/paper_noise.png',
      buttonFrame: './assets/images/button_frame.png',
    };

    const images = await Loader.loadImages(manifest, (loaded, total) => {
      drawStatus(`正在唤醒记忆……${loaded}/${total}`);
    });

    const game = { canvas, ctx, width: DESIGN_W, height: DESIGN_H, images };
    game.input = new InputManager(canvas, DESIGN_W, DESIGN_H);
    game.progress = new ProgressStore('ye_v1_progress');
    game.overlay = new Overlay(game);
    game.chapterManager = new ChapterManager(game);

    // 注册全部 10 章
    game.chapterManager.register('ch01', Chapter01);
    game.chapterManager.register('ch02', Chapter02);
    game.chapterManager.register('ch03', Chapter03);
    game.chapterManager.register('ch04', Chapter04);
    game.chapterManager.register('ch05', Chapter05);
    game.chapterManager.register('ch06', Chapter06);
    game.chapterManager.register('ch07', Chapter07);
    game.chapterManager.register('ch08', Chapter08);
    game.chapterManager.register('ch09', Chapter09);
    game.chapterManager.register('ch10', Chapter10);

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

    // 从进度恢复（clamp 到已注册章节，防止白屏）
    const REGISTERED = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10'];
    const saved = game.progress.load();
    // P1-2 修复：saved.chapter 记录的是"已完成章号"，恢复时应从下一章开始，否则每次刷新都要重打刚打完的那章
    const resumeNum = saved?.chapter ? Math.min(saved.chapter + 1, 10) : 1;
    let startChapter = `ch${String(resumeNum).padStart(2, '0')}`;
    if (!REGISTERED.includes(startChapter)) {
      const chNum = parseInt(startChapter.replace('ch', ''), 10);
      const closest = REGISTERED.map(r => parseInt(r.replace('ch', ''), 10))
        .filter(n => n <= chNum)
        .sort((a, b) => b - a)[0];
      startChapter = closest ? `ch${String(closest).padStart(2, '0')}` : 'ch01';
    }
    game.chapterManager.switchTo(startChapter);

    new Game(game).start();

    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
      setTimeout(() => loadingEl.remove(), 600);
    }
  } catch (error) {
    console.error(error);
    ctx.fillStyle = '#0d0906';
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    ctx.fillStyle = '#d4b896';
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('出错了，请重启试试……', DESIGN_W / 2, DESIGN_H / 2);
  }
}

boot();
