import { Game } from './core/Game.js';
import { InputManager } from './core/InputManager.js';
import { Loader } from './core/Loader.js';
import { SceneManager } from './core/SceneManager.js';
import { SceneRoom } from './scenes/Scene_Room.js';
import { SceneDesk } from './scenes/Scene_Desk.js';
import { ScenePuzzle } from './scenes/Scene_Puzzle.js';

const DESIGN_W = 1280;
const DESIGN_H = 720;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ====== DPR 适配 ======
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const { innerWidth: w, innerHeight: h } = window;

  // 等比缩放：保持 16:9 比例，最大化填满屏幕
  scale = Math.min(w / DESIGN_W, h / DESIGN_H);
  const displayW = DESIGN_W * scale;
  const displayH = DESIGN_H * scale;
  offsetX = (w - displayW) / 2;
  offsetY = (h - displayH) / 2;

  // Canvas 物理像素
  canvas.width = Math.round(DESIGN_W * dpr);
  canvas.height = Math.round(DESIGN_H * dpr);

  // CSS 显示
  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
  canvas.style.left = offsetX + 'px';
  canvas.style.top = offsetY + 'px';

  // 重置变换：先 scale(dpr) 让 1 逻辑像素 = 1 CSS 像素，再无缩放渲染
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 300));
resizeCanvas();

// ====== 横屏提示 ======
function createRotateHint() {
  const el = document.createElement('div');
  el.id = 'rotate-hint';
  el.innerHTML = `
    <div style="
      position:fixed; inset:0; z-index:9999; background:#0d0805;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      color:#d4b896; font-family:system-ui, sans-serif;
    ">
      <div style="font-size:64px; margin-bottom:20px;">📱</div>
      <p style="font-size:20px; letter-spacing:0.1em;">请将设备旋转至横屏</p>
      <p style="font-size:14px; opacity:0.5; margin-top:8px;">横屏体验更佳</p>
    </div>`;
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

// ====== 启动 ======
function updateLoading(percent, hint) {
  const bar = document.getElementById('loadBar');
  const hintEl = document.getElementById('loadHint');
  if (bar) bar.style.width = `${percent}%`;
  if (hintEl && hint) hintEl.textContent = hint;
}

function drawStatus(message, detail = '') {
  ctx.fillStyle = '#0d0906';
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  ctx.fillStyle = '#f4e2bd';
  ctx.font = '500 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, DESIGN_W / 2, DESIGN_H / 2 - 10);
  if (detail) {
    ctx.fillStyle = '#c9ae81';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(detail, DESIGN_W / 2, DESIGN_H / 2 + 32);
  }
}

async function boot() {
  drawStatus('正在唤醒记忆……', '加载画面 0 / 3');
  try {
    const manifest = {
      room: './assets/images/room_bg.png',
      desk: './assets/images/desk_bg.png',
      puzzle: './assets/images/scene_puzzle.jpg',
    };

    const images = await Loader.loadImages(manifest, (loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      updateLoading(pct, `加载画面 ${loaded} / ${total}`);
      drawStatus('正在唤醒记忆……', `加载画面 ${loaded} / ${total}`);
    });

    const game = { canvas, ctx, width: DESIGN_W, height: DESIGN_H, images };
    game.input = new InputManager(canvas, DESIGN_W, DESIGN_H);
    game.sceneManager = new SceneManager(game);
    game.sceneManager.register('room', SceneRoom);
    game.sceneManager.register('desk', SceneDesk);
    game.sceneManager.register('puzzle', ScenePuzzle);

    // 拼图完成回调
    game.onPuzzleComplete = () => {
      console.info('Ch2 拼图完成 ✓');
    };

    window.game = game;
    game.sceneManager.switchTo('room');
    new Game(game).start();

    // 隐藏 loading
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
      setTimeout(() => loadingEl.remove(), 600);
    }
  } catch (error) {
    console.error(error);
    drawStatus('画面加载失败', error.message);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

boot();
