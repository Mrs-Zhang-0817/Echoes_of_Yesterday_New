// 《昨日重现》入口
import { Game } from './core/Game.js';
import { InputManager } from './core/InputManager.js';
import { Loader } from './core/Loader.js';
import { ChapterManager } from './core/ChapterManager.js';
import { ProgressStore } from './core/ProgressStore.js';
import { Overlay } from './core/Overlay.js';

import { Chapter02 } from './chapters/ch02_puzzle.js';
import { Chapter03 } from './chapters/ch03_maze.js';
import { Chapter08 } from './chapters/ch08_sign.js';

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
      puzzle: './assets/images/scene_puzzle.jpg',
      mazeMap: './assets/images/scene_maze_map.png',
      sign: './assets/images/sign_scene.png',
    };

    const images = await Loader.loadImages(manifest, (loaded, total) => {
      drawStatus(`正在唤醒记忆……${loaded}/${total}`);
    });

    const game = { canvas, ctx, width: DESIGN_W, height: DESIGN_H, images };
    game.input = new InputManager(canvas, DESIGN_W, DESIGN_H);
    game.progress = new ProgressStore('ye_v1_progress');
    game.overlay = new Overlay(game);
    game.chapterManager = new ChapterManager(game);

    // 注册章节
    game.chapterManager.register('ch02', Chapter02);
    game.chapterManager.register('ch03', Chapter03);
    game.chapterManager.register('ch08', Chapter08);

    window.game = game;

    // 从进度恢复
    const saved = game.progress.load();
    const startChapter = saved?.chapter ? `ch${String(saved.chapter).padStart(2, '0')}` : 'ch02';
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
