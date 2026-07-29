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
    this.game.sceneManager.update(dt);
    this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
    this.game.sceneManager.currentScene?.render(this.game.ctx);
    this.game.sceneManager.renderTransition(this.game.ctx);
    requestAnimationFrame(next => this.loop(next));
  }
}
