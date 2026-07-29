export class ChapterManager {
  constructor(game) {
    this.game = game;
    this.registry = new Map();
    this.currentChapter = null;
    this.pendingChapter = null;
    this.transition = { phase: 'idle', alpha: 0, duration: 0.3 };
    this.chapterOrder = [];
  }

  register(name, ChapterClass) {
    this.registry.set(name, ChapterClass);
    if (!this.chapterOrder.includes(name)) {
      this.chapterOrder.push(name);
    }
  }

  switchTo(name) {
    if (!this.registry.has(name)) return;
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

    // 检查是否完成
    if (this.currentChapter?.isComplete && this.transition.phase === 'idle') {
      this.game.overlay?.show?.({
        type: 'complete',
        title: this.currentChapter.completeTitle || '记忆恢复了一些……',
        message: this.currentChapter.completeMessage || '',
        buttons: [
          { text: '继续下一章节', action: () => this.next() }
        ]
      });
      // 只弹一次
      this.transition.phase = 'blocked';
      return;
    }

    if (this.transition.phase === 'blocked') return;

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
