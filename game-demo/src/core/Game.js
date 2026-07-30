export class Game {
  constructor(game) {
    this.game = game;
    this.lastTime = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(timestamp => this.loop(timestamp));
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // ChapterManager 驱动
    this.game.chapterManager.update(dt);
    this.game.overlay?.update?.(dt);

    // 渲染
    this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
    this.game.chapterManager.currentChapter?.render?.(this.game.ctx);
    this.game.chapterManager.renderTransition(this.game.ctx);
    this.game.overlay?.render?.(this.game.ctx);

    requestAnimationFrame(next => this.loop(next));
  }
}
