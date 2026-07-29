// 章节记忆报告渲染器 —— 一个可独立抽离的「叙事活动」。
// 由 Overlay 在普通章节完成时调用；只负责呈现报告底图 + 进度动画 + 继续按钮，
// 不触碰章节互动逻辑。统一接口：open / update / render / handleDown / isReady（见 src/narrative/README.md）。
import { roundedRect } from '../utils/sceneUtils.js';

export const REPORT_PROGRESS = [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100];

const ASSET_BASE = './assets/images/report/';
const BASE_URL = './assets/images/report_base.png';

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
  return `${ASSET_BASE}ch${String(chapterNumber).padStart(2, '0')}.png`;
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

    this._baseEntry = null;
    this._chapterEntry = null;
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

    this._baseEntry = loadImage(BASE_URL);
    this._chapterEntry = loadImage(getReportAssetPath(chapterNumber));
    this._btnEntry = loadImage(`${ASSET_BASE}button_continue.png`);

    this._layoutButton();

    if (this._reduced) {
      this._progress = memoryTo;
    }
    return this;
  }

  isReady() {
    if (this._reduced) return true;
    const baseOk = this._baseEntry && this._baseEntry.loaded;
    const chapOk = this._chapterEntry && this._chapterEntry.loaded;
    return !!(baseOk && chapOk);
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

    // 1) 通用底图铺满（任何章都有，保证不白屏）
    this._drawCover(this._baseEntry, ctx, width, height, 1);
    // 2) 章节专属底图（未失败则覆盖在通用底图之上）
    if (this._chapterEntry && this._chapterEntry.loaded && !this._chapterEntry.failed) {
      this._drawCover(this._chapterEntry, ctx, width, height, 1);
    }

    // 3) 遮罩 + 文案 + 进度条
    ctx.save();
    ctx.fillStyle = 'rgba(12, 8, 5, 0.30)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#f4e2bd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 27px "PingFang SC", system-ui, sans-serif';
    ctx.fillText(`第 ${this.chapterNumber} 章 · 记忆恢复`, width / 2, height * 0.15);

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

    // 4) 继续按钮
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
    if (!r || !this._btnEntry || !this._btnEntry.loaded || this._btnEntry.failed) return;
    const scale = width / 1280; // 设计坐标 → 实际坐标
    const dx = r.x * scale;
    const dy = r.y * scale;
    const dw = r.w * scale;
    const dh = r.h * scale;
    ctx.save();
    ctx.drawImage(this._btnEntry.img, dx, dy, dw, dh);
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
