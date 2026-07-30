// 章节记忆报告渲染器（UI v1.1）—— 使用每章独立的美术底图。
// 由 Overlay 在普通章节完成时调用；只负责呈现报告底图 + 进度动画 + 继续按钮，
// 不触碰章节互动逻辑。统一接口：open / update / render / handleDown / isReady（见 src/narrative/README.md）。
import { roundedRect } from '../utils/sceneUtils.js';
import CHAPTERS from '../data/chapters.json' with { type: 'json' };

const _sorted = [...CHAPTERS].sort((a, b) => a.order - b.order);
export const REPORT_PROGRESS = [0, ..._sorted.map(ch => ch.memoryUnlock)];

const ASSET_BASE = './assets/art/report/';
const BUTTON_URL = `${ASSET_BASE}button_continue.jpg`;

// 按 URL 缓存 Image，避免重复网络请求 / 重复解码
const _cache = new Map();

function loadImage(url) {
  if (_cache.has(url)) return _cache.get(url);
  const entry = { img: new Image(), loaded: false, failed: false };
  entry.img.onload = () => { entry.loaded = true; };
  entry.img.onerror = () => { entry.loaded = true; entry.failed = true; };
  entry.img.src = url;
  _cache.set(url, entry);
  return entry;
}

export function getReportAssetPath(chapterNumber) {
  return `${ASSET_BASE}ch${String(chapterNumber).padStart(2, '0')}.jpg`;
}

function reducedMotion() {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export class ArtworkMemoryReport {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.chapterNumber = 0;
    this.memoryFrom = 0;
    this.memoryTo = 0;
    this.onContinue = null;

    this._bgEntry = null;
    this._btnEntry = null;

    this._progress = 0;
    this._elapsed = 0;
    this._duration = 1.8;
    this._reduced = reducedMotion();
    this._btnRect = null;
    this._done = false;
  }

  open({ chapterNumber, memoryFrom, memoryTo, onContinue }) {
    this.active = true;
    this.chapterNumber = chapterNumber;
    this.memoryFrom = memoryFrom;
    this.memoryTo = memoryTo;
    this.onContinue = onContinue;
    this._elapsed = 0;
    this._done = false;
    this._progress = memoryFrom;

    // UI v1.1：每章独立报告底图（已包含照片、标题、装饰），不再用通用底板+场景图拼接
    this._bgEntry = loadImage(getReportAssetPath(chapterNumber));
    this._btnEntry = loadImage(BUTTON_URL);

    this._layoutButton();

    if (this._reduced) {
      this._progress = memoryTo;
    }
    return this;
  }

  isReady() {
    if (this._reduced) return true;
    return !!(this._bgEntry && this._bgEntry.loaded);
  }

  update(dt) {
    if (!this.active || this._reduced) return;
    if (this._elapsed < this._duration) {
      this._elapsed = Math.min(this._duration, this._elapsed + dt);
      const t = this._elapsed / this._duration;
      const eased = 1 - Math.pow(1 - t, 3);
      this._progress = this.memoryFrom + (this.memoryTo - this.memoryFrom) * eased;
    }
  }

  render(ctx, width, height) {
    if (!this.active) return;

    // 1) 章节报告底图铺满（UI v1.1 每章独立设计，已包含照片框、标题、装饰元素）
    this._drawCover(this._bgEntry, ctx, width, height, 1);

    // 2) 进度条 + 百分比数值
    ctx.save();
    const barW = width * 0.5;
    const barH = 14;
    const bx = (width - barW) / 2;
    const by = height * 0.80;
    ctx.fillStyle = 'rgba(255, 247, 231, 0.16)';
    roundedRect(ctx, bx, by, barW, barH, 7);
    ctx.fill();
    const ratio = Math.max(0, Math.min(1, this._progress / 100));
    ctx.fillStyle = '#e9c27a';
    roundedRect(ctx, bx, by, Math.max(barH, barW * ratio), barH, 7);
    ctx.fill();

    ctx.font = '700 24px "PingFang SC", system-ui, sans-serif';
    ctx.fillText(`${Math.round(this._progress)}%`, width / 2, by - 24);
    ctx.restore();

    // 3) 继续按钮
    this._drawButton(ctx, width, height);
  }

  handleDown(point) {
    if (!this.active || this._done) return;
    const r = this._btnRect;
    if (!r) return;
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
      this._done = true;
      this.active = false;
      this.onContinue?.();
    }
  }

  // —— 内部 ——
  _layoutButton() {
    const w = 300;
    const h = Math.round(w * 843 / 1866); // 与 button_continue.png 比例一致
    this._btnRect = { x: (1280 - w) / 2, y: 720 - h - 56, w, h };
  }

  _drawButton(ctx, width, height) {
    const r = this._btnRect;
    if (!r) return;
    const scale = width / 1280;
    const dx = r.x * scale;
    const dy = r.y * scale;
    const dw = r.w * scale;
    const dh = r.h * scale;
    ctx.save();

    // 如果按钮图片加载成功，绘制图片；否则绘制 Canvas 文字按钮
    if (this._btnEntry && this._btnEntry.loaded && !this._btnEntry.failed) {
      ctx.drawImage(this._btnEntry.img, dx, dy, dw, dh);
    } else {
      // Canvas 文字按钮兜底
      const cx = dx + dw / 2;
      const cy = dy + dh / 2;
      const radius = Math.min(dw, dh) * 0.45;
      const grad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, radius);
      grad.addColorStop(0, '#c4a060');
      grad.addColorStop(1, '#8B6914');
      ctx.shadowColor = 'rgba(139, 105, 20, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = grad;
      ctx.beginPath();
      roundedRect(ctx, dx, dy, dw, dh, dh / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff8e7';
      ctx.font = `500 ${Math.round(dh * 0.42)}px "PingFang SC", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('继续下一章节', cx, cy + 1);
    }

    ctx.restore();
  }

  _drawCover(entry, ctx, width, height, alpha) {
    if (!entry || !entry.loaded || entry.failed) return;
    const img = entry.img;
    const iw = img.width || 1;
    const ih = img.height || 1;
    const ir = iw / ih;
    const cr = width / height;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = height; dw = height * ir; dx = (width - dw) / 2; dy = 0; }
    else { dw = width; dh = width / ir; dx = 0; dy = (height - dh) / 2; }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }
}
