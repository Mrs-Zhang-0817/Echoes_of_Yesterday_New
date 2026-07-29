import { REPORT_PROGRESS } from '../ui/ArtworkMemoryReport.js';

export class ChapterManager {
  constructor(game) {
    this.game = game;
    this.registry = new Map();
    this.currentChapter = null;
    this.pendingChapter = null;
    this.transition = { phase: 'idle', alpha: 0, duration: 0.3 };
    this.chapterOrder = [];
    this._completeFired = false;
  }

  register(name, ChapterClass) {
    this.registry.set(name, ChapterClass);
    if (!this.chapterOrder.includes(name)) {
      this.chapterOrder.push(name);
    }
  }

  switchTo(name) {
    if (!this.registry.has(name)) return;
    // 清除旧 overlay，防止级联推进
    this.game.overlay?.hide();
    this._completeFired = false;
    if (!this.currentChapter) {
      this.activate(name);
      this.transition = { ...this.transition, phase: 'in', alpha: 1 };
      return;
    }
    this.pendingChapter = name;
    this.transition.phase = 'out';
  }

  next() {
    const idx = this.chapterOrder.indexOf(this.pendingChapter || this.currentName);
    if (idx >= 0 && idx < this.chapterOrder.length - 1) {
      this.switchTo(this.chapterOrder[idx + 1]);
    }
  }

  get currentName() {
    for (const [name, cls] of this.registry) {
      if (this.currentChapter instanceof cls) return name;
    }
    return null;
  }

  activate(name) {
    if (this.currentChapter) {
      this.currentChapter.onExit?.();
      this.currentChapter = null;
    }
    const ChapterClass = this.registry.get(name);
    if (!ChapterClass) return;
    this.currentChapter = new ChapterClass(this.game);
    this.currentChapter.onEnter?.();
  }

  update(dt) {
    this.currentChapter?.update?.(dt);

    // 检查是否完成 → 弹 overlay（只弹一次）
    if (this.currentChapter?.isComplete && !this._completeFired && this.transition.phase === 'idle') {
      this._completeFired = true;
      const chapterNumber = parseInt((this.currentName || 'ch0').replace('ch', ''), 10) || 0;
      const memoryTo = REPORT_PROGRESS[chapterNumber] ?? 0;
      const memoryFrom = REPORT_PROGRESS[chapterNumber - 1] ?? 0;
      this.game.overlay?.show?.({
        type: 'complete',
        chapterNumber,
        memoryFrom,
        memoryTo,
        onContinue: () => this.next(),
      });
      this.transition.phase = 'blocked';
    }

    // blocked ≠ 跳过过渡 —— overlay action 调 next/switchTo 后会设 phase='out'
    if (this.transition.phase === 'out') {
      this.transition.alpha += dt / this.transition.duration;
      if (this.transition.alpha >= 1) {
        this.transition.alpha = 1;
        this.activate(this.pendingChapter);
        this.pendingChapter = null;
        this.transition.phase = 'in';
      }
    } else if (this.transition.phase === 'in') {
      this.transition.alpha -= dt / this.transition.duration;
      if (this.transition.alpha <= 0) {
        this.transition.alpha = 0;
        this.transition.phase = 'idle';
        this._completeFired = false;
      }
    }
  }

  renderTransition(ctx) {
    if (this.transition.alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${this.transition.alpha})`;
    ctx.fillRect(0, 0, this.game.width, this.game.height);
    ctx.restore();
  }
}
