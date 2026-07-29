// 章节记忆报告渲染器 —— 一个可独立抽离的「叙事活动」。
// 由 Overlay 在普通章节完成时调用；只负责呈现报告底图 + 进度动画 + 继续按钮，
// 不触碰章节互动逻辑。统一接口：open / update / render / handleDown / isReady（见 src/narrative/README.md）。
import { roundedRect } from '../utils/sceneUtils.js';
import CHAPTERS from '../data/chapters.json' with { type: 'json' };

const _sorted = [...CHAPTERS].sort((a, b) => a.order - b.order);
export const REPORT_PROGRESS = [0, ..._sorted.map(ch => ch.memoryUnlock)];

const ASSET_BASE = './assets/images/report/';
const BASE_URL = './assets/images/report_base.png';
const REPORT_SCENE_PATHS = [
  null,
  './assets/images/ch1_bg_bedroom.jpg',
  './assets/images/ch2_bg_livingroom.png',
  './assets/images/ch3_bg_old_community.jpg',
  './assets/images/ch4_police_03.png',
  './assets/images/ch5_bg_elevator.png',
  './assets/images/ch6_bg_diningroom.jpg',
  './assets/images/ch7_bg_bedroom_night.jpg',
  './assets/images/ch8_corridor.jpg',
  './assets/images/ch9_balcony.jpg',
  './assets/images/ch10_livingroom.jpg',
];

// 报告底板左侧的大照片框；所有章节共用同一位置，仅替换其中的原场景图。
const PHOTO_SLOT = { x: 145, y: 282, width: 420, height: 318 };

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

export function getReportScenePath(chapterNumber) {
  return REPORT_SCENE_PATHS[chapterNumber] || REPORT_SCENE_PATHS[1];
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
    this._chapterEntry = loadImage(getReportScenePath(chapterNumber));
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

    // 1) 报告底板铺满（任何章都有，保证不白屏）
    this._drawCover(this._baseEntry, ctx, width, height, 1);
    // 2) 章节原场景图贴入底板的照片框，不能再整张覆盖报告底板。
    if (this._chapterEntry && this._chapterEntry.loaded && !this._chapterEntry.failed) {
      this._drawPhoto(this._chapterEntry, ctx);
    }

    // 3) 只保留进度条；标题已经印在报告底板上，避免重复叠字。
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

  _drawPhoto(entry, ctx) {
    const { img } = entry;
    const { x, y, width, height } = PHOTO_SLOT;
    const imageRatio = (img.width || 1) / (img.height || 1);
    const slotRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let drawX = x;
    let drawY = y;

    if (imageRatio > slotRatio) {
      drawWidth = height * imageRatio;
      drawX = x - (drawWidth - width) / 2;
    } else {
      drawHeight = width / imageRatio;
      drawY = y - (drawHeight - height) / 2;
    }

    ctx.save();
    roundedRect(ctx, x, y, width, height, 5);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(88, 57, 27, 0.55)';
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y, width, height, 5);
    ctx.stroke();
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
