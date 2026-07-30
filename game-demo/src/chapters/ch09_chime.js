import { drawPrompt } from '../utils/sceneUtils.js';
import { FlashbackActivity } from '../narrative/FlashbackActivity.js';
import { getChapterComics, getComicScene } from '../data/comicConfig.js';
import { ComicActivity } from '../narrative/ComicActivity.js';

// Ch9 状态顺序（用于测试与叙事衔接一致性校验）
export const CH9_STATES = ['intro', 'colorRebuild', 'flashback', 'rhythmGame', 'resolve', 'complete'];

// 4 色音符（与节奏关 4 根管一一对应）
const GLYPHS = [
  { id: 'g1', label: 'Do', color: '#e8a840' },
  { id: 'g2', label: 'Re', color: '#d4746c' },
  { id: 'g3', label: 'Mi', color: '#a890c8' },
  { id: 'g4', label: 'Fa', color: '#7db8a0' },
];

// 4 个目标槽（五线谱上的彩色位置）
const SLOTS = GLYPHS.map((g, i) => ({
  color: g.color,
  label: g.label,
  cx: 360 + i * 190,
  cy: 430,
}));

// 散落初始位置（中心坐标）
const SCATTER = [
  { x: 300, y: 165 },
  { x: 560, y: 135 },
  { x: 820, y: 145 },
  { x: 1000, y: 205 },
];

const DW = 1280;
const DH = 720;
const NOTE_W = 70;
const NOTE_H = 90;
const SNAP_DIST = 75;

// 绘制单个彩色音符碎片
function drawGlyph(ctx, x, y, w, h, color, label, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha !== undefined ? alpha : 1.0;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.35, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.6, y + h * 0.6);
  ctx.lineTo(x + w * 0.6, y + h * 0.95);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.font = '14px system-ui, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, x + w / 2, y + h - 4);
  ctx.restore();
}

export class Chapter09 {
  constructor(game) {
    this.game = game;
    this.state = 'intro';
    this.phaseTime = 0;
    this._completed = false;

    // 彩色音符（colorRebuild 阶段）
    this.glyphs = GLYPHS.map((g, i) => ({
      ...g,
      x: SCATTER[i].x - NOTE_W / 2,
      y: SCATTER[i].y - NOTE_H / 2,
      placed: false,
    }));
    this.dragging = false;
    this.dragIndex = -1;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // 闪回活动（叙事活动，可独立替换）
    this.flashback = null;

    // 节奏关
    this.lanes = GLYPHS.map((g, i) => ({ color: g.color, label: g.label, cx: 320 + i * 200 }));
    this.notes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.1;
    this.notesSpawned = 0;
    this.totalNotes = 10;
    this.hitLine = 600;
    this.hits = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.consecutiveMiss = 0;
    this.slowMode = false;
    this.score = 0;
    this.comic = null;
    this._comicQueue = [];
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '记忆的风铃'; }
  get completeMessage() { return 'Do Re Mi Fa……风铃重新响了。'; }

  onEnter() {
    this.game.input.setHandlers({
      down: p => this.handleDown(p),
      move: p => this.handleMove(p),
      up: p => this.handleUp(p),
      cancel: () => this.handleCancel(),
    });
  }

  onExit() {
    this.game.input.setHandlers();
  }

  // 状态切换 + 进入初始化
  _go(next) {
    this.state = next;
    this.phaseTime = 0;
    if (next === 'flashback') {
      this.flashback = new FlashbackActivity(this.game);
      this.flashback.start({
        frames: ['ch9_father_building_chime'],
        perFrame: 2.6,
        crossfade: 0.5,
        onComplete: () => this._go('rhythmGame'),
      });
    } else if (next === 'complete') {
      this._completed = true;
      this.game.progress.markChapterComplete(9, 85);
    }
  }

  _laneAt(x) {
    const idx = Math.round((x - 320) / 200);
    return idx >= 0 && idx < this.lanes.length ? idx : -1;
  }

  _tryHit(laneIdx) {
    // 命中该 lane 中最接近判定线的未结算音符
    let target = null;
    let bestY = Infinity;
    for (const note of this.notes) {
      if (note.resolved || note.lane !== laneIdx) continue;
      if (note.y > this.hitLine - 90 && note.y < this.hitLine + 90) {
        if (note.y < bestY) { bestY = note.y; target = note; }
      }
    }
    if (target) {
      target.resolved = true;
      target.hit = true;
      this.hits++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.consecutiveMiss = 0;
      this.score += 10 + this.combo;
      try { navigator.vibrate?.(15); } catch {}
    }
    // 空击/过早击打：忽略（宽容判定）
  }

  handleDown(point) {
    if (this.state === 'intro') {
      this._go('colorRebuild');
      return;
    }
    if (this.state === 'colorRebuild') {
      for (let i = this.glyphs.length - 1; i >= 0; i--) {
        const n = this.glyphs[i];
        if (n.placed) continue;
        if (point.x >= n.x && point.x <= n.x + NOTE_W &&
            point.y >= n.y && point.y <= n.y + NOTE_H) {
          this.dragging = true;
          this.dragIndex = i;
          this.dragOffsetX = point.x - n.x;
          this.dragOffsetY = point.y - n.y;
          break;
        }
      }
      return;
    }
    if (this.state === 'rhythmGame') {
      const laneIdx = this._laneAt(point.x);
      if (laneIdx >= 0) this._tryHit(laneIdx);
    }
    // flashback / resolve / complete：无交互
  }

  handleMove(point) {
    if (this.state !== 'colorRebuild' || !this.dragging || this.dragIndex < 0) return;
    const n = this.glyphs[this.dragIndex];
    n.x = point.x - this.dragOffsetX;
    n.y = point.y - this.dragOffsetY;
  }

  handleUp() {
    if (this.state !== 'colorRebuild' || !this.dragging || this.dragIndex < 0) return;
    this.dragging = false;
    const n = this.glyphs[this.dragIndex];
    const slot = SLOTS[this.dragIndex];
    const cx = n.x + NOTE_W / 2;
    const cy = n.y + NOTE_H / 2;
    if (Math.hypot(cx - slot.cx, cy - slot.cy) < SNAP_DIST) {
      n.x = slot.cx - NOTE_W / 2;
      n.y = slot.cy - NOTE_H / 2;
      n.placed = true;
    }
    this.dragIndex = -1;
    if (this.glyphs.every(g => g.placed)) this._go('flashback');
  }

  handleCancel() {
    this.dragging = false;
    this.dragIndex = -1;
  }

  // ---- 漫画播放 ----

  _playComics(chapterKey, onAllComplete) {
    const scenes = getChapterComics(chapterKey);
    if (!scenes || scenes.length === 0) { onAllComplete(); return; }
    this._comicQueue = [...scenes];
    this._playNextComic(onAllComplete);
  }

  _playNextComic(onAllComplete) {
    if (this._comicQueue.length === 0) { onAllComplete(); return; }
    const sceneKey = this._comicQueue.shift();
    const config = getComicScene(sceneKey);
    if (!config) { this._playNextComic(onAllComplete); return; }
    this.comic = new ComicActivity(this.game);
    this.comic.start({
      config,
      imageKey: config.imageKey,
      onComplete: () => { this._playNextComic(onAllComplete); },
    });
  }

  update(dt) {
    if (this.comic && !this.comic.isFinished) {
      this.comic.update(dt);
      return;
    }

    this.phaseTime += dt;
    switch (this.state) {
      case 'intro':
        if (this.phaseTime >= 3) this._go('colorRebuild');
        break;
      case 'colorRebuild':
        break; // 拖拽驱动
      case 'flashback':
        this.flashback?.update(dt);
        break;
      case 'rhythmGame':
        this._updateRhythm(dt);
        break;
      case 'resolve':
        if (this.phaseTime >= 2.5 && !this._completed) {
          this._playComics('ch09', () => {
            this._go('complete');
          });
        }
        break;
      case 'complete':
        break;
    }
  }

  _updateRhythm(dt) {
    if (this.notesSpawned < this.totalNotes) {
      this.spawnTimer += dt;
      const interval = this.slowMode ? this.spawnInterval * 1.6 : this.spawnInterval;
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        const lane = Math.floor(Math.random() * this.lanes.length);
        this.notes.push({ lane, y: -40, resolved: false });
        this.notesSpawned++;
      }
    }
    const speed = this.slowMode ? 150 : 230;
    for (const note of this.notes) {
      if (note.resolved) continue;
      note.y += speed * dt;
      if (note.y > this.hitLine + 90) {
        note.resolved = true;
        note.missed = true;
        this.combo = 0;
        this.consecutiveMiss++;
        if (this.consecutiveMiss >= 3) this.slowMode = true; // 连续 3 次失误 → 自动慢速
      }
    }
    if (this.notesSpawned >= this.totalNotes && this.notes.every(n => n.resolved)) {
      this._go('resolve');
    }
  }

  // ===================== 渲染 =====================
  _drawBackdrop(ctx) {
    const balcImg = this.game.images.ch9_balcony;
    if (balcImg) {
      const sc = Math.max(DW / (balcImg.width || 1280), DH / (balcImg.height || 720));
      const ox = (DW - (balcImg.width || 1280) * sc) / 2;
      const oy = (DH - (balcImg.height || 720) * sc) / 2;
      ctx.drawImage(balcImg, ox, oy, (balcImg.width || 1280) * sc, (balcImg.height || 720) * sc);
      ctx.fillStyle = 'rgba(12, 8, 6, 0.42)';
      ctx.fillRect(0, 0, DW, DH);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, DH);
      bgGrad.addColorStop(0, '#2a1810');
      bgGrad.addColorStop(0.5, '#3d2018');
      bgGrad.addColorStop(1, '#5a3028');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, DW, DH);
    }
    const pipesImg = this.game.images.ch9_pipes;
    if (pipesImg) {
      const pw = pipesImg.width, ph = pipesImg.height;
      const scP = Math.min(DW / pw, 350 / ph);
      ctx.drawImage(pipesImg, (DW - pw * scP) / 2, 10, pw * scP, ph * scP);
    }
  }

  render(ctx) {
    if (this.comic && !this.comic.isFinished) {
      this.comic.render(ctx, this.DW, this.DH);
      return;
    }

    switch (this.state) {
      case 'intro':
        this._renderIntro(ctx);
        break;
      case 'colorRebuild':
        this._renderColorRebuild(ctx);
        break;
      case 'flashback':
        this.flashback?.render(ctx, DW, DH);
        break;
      case 'rhythmGame':
        this._renderRhythm(ctx);
        break;
      case 'resolve':
        this._renderResolve(ctx);
        break;
      case 'complete':
        this._drawBackdrop(ctx);
        drawPrompt(ctx, '风铃重新响了。', DW / 2, DH - 60, 0);
        break;
    }
  }

  _renderIntro(ctx) {
    this._drawBackdrop(ctx);
    drawPrompt(ctx, '风铃碎了，记忆也碎了……把色彩重新拼回五线谱。', DW / 2, 600, 0.4);
    drawPrompt(ctx, '（轻触继续）', DW / 2, 650, 0);
  }

  _renderColorRebuild(ctx) {
    this._drawBackdrop(ctx);

    // 五线谱横线
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 200, 170, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const y = 380 + i * 24;
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(1160, y);
      ctx.stroke();
    }
    ctx.restore();

    // 目标槽
    for (const s of SLOTS) {
      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.cx - NOTE_W / 2, s.cy - NOTE_H / 2, NOTE_W, NOTE_H, 8);
      ctx.stroke();
      ctx.restore();
    }

    // 已放置 & 未放置音符
    for (const n of this.glyphs) {
      if (n === this.glyphs[this.dragIndex]) continue;
      const alpha = n.placed ? 1 : 0.95;
      if (n.placed) {
        ctx.save();
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 14;
        drawGlyph(ctx, n.x, n.y, NOTE_W, NOTE_H, n.color, n.label, alpha);
        ctx.restore();
      } else {
        drawGlyph(ctx, n.x, n.y, NOTE_W, NOTE_H, n.color, n.label, alpha);
      }
    }
    if (this.dragging && this.dragIndex >= 0) {
      const n = this.glyphs[this.dragIndex];
      ctx.save();
      ctx.shadowColor = 'rgba(255, 220, 160, 0.5)';
      ctx.shadowBlur = 18;
      drawGlyph(ctx, n.x, n.y, NOTE_W, NOTE_H, n.color, n.label);
      ctx.restore();
    }

    drawPrompt(ctx, '把彩色音符拖到对应颜色的槽位', DW / 2, 680, 0);
  }

  _renderRhythm(ctx) {
    this._drawBackdrop(ctx);

    // 冷→暖渐变（随连击升温）
    const t = Math.max(0, Math.min(1, this.combo / 8));
    const r = Math.round(40 + t * 140);
    const g = Math.round(70 - t * 0);
    const b = Math.round(120 - t * 80);
    ctx.save();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.14)`;
    ctx.fillRect(0, 0, DW, DH);
    ctx.restore();

    // 4 条轨道 + 底部风铃管
    for (const lane of this.lanes) {
      ctx.save();
      ctx.strokeStyle = 'rgba(220, 200, 170, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lane.cx, 60);
      ctx.lineTo(lane.cx, this.hitLine + 40);
      ctx.stroke();
      // 管子
      ctx.fillStyle = lane.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(lane.cx - 16, this.hitLine - 10, 32, 90, 10);
      ctx.fill();
      ctx.restore();
    }

    // 判定线
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.8)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(255, 230, 170, 0.7)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(180, this.hitLine);
    ctx.lineTo(1100, this.hitLine);
    ctx.stroke();
    ctx.restore();

    // 下落音符
    for (const note of this.notes) {
      if (note.resolved) continue;
      const lane = this.lanes[note.lane];
      ctx.save();
      ctx.fillStyle = lane.color;
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(lane.cx, note.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // HUD：分数 + 连击
    ctx.save();
    ctx.fillStyle = '#f4e2bd';
    ctx.font = '600 24px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`分数 ${this.score}`, 40, 30);
    if (this.combo > 1) {
      ctx.textAlign = 'center';
      ctx.font = `800 ${28 + Math.min(this.combo, 12)}px system-ui, "PingFang SC", sans-serif`;
      ctx.fillStyle = '#ffd37a';
      ctx.fillText(`连击 x${this.combo}`, DW / 2, 28);
    }
    if (this.slowMode) {
      ctx.textAlign = 'right';
      ctx.font = '500 18px system-ui, "PingFang SC", sans-serif';
      ctx.fillStyle = 'rgba(255,220,170,0.7)';
      ctx.fillText('慢速模式', DW - 40, 34);
    }
    ctx.restore();

    drawPrompt(ctx, '跟着节奏，点亮风铃', DW / 2, 690, 0);
  }

  _renderResolve(ctx) {
    this._drawBackdrop(ctx);
    // 暖色脉冲
    const pulse = 0.4 + 0.3 * Math.sin(this.phaseTime * 4);
    ctx.save();
    ctx.fillStyle = `rgba(255, 200, 120, ${pulse * 0.18})`;
    ctx.fillRect(0, 0, DW, DH);
    ctx.restore();
    // 已归位音符发光
    for (const s of SLOTS) {
      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 20;
      drawGlyph(ctx, s.cx - NOTE_W / 2, s.cy - NOTE_H / 2, NOTE_W, NOTE_H, s.color, s.label);
      ctx.restore();
    }
    drawPrompt(ctx, '记忆重新拼合，风铃轻轻摇晃……', DW / 2, 660, 0.4);
  }
}
