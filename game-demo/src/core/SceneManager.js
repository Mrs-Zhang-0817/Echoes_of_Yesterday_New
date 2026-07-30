export class SceneManager {
  constructor(game) {
    this.game = game;
    this.registry = new Map();
    this.currentScene = null;
    this.pendingScene = null;
    this.transition = { phase: 'idle', alpha: 0, duration: 0.3 };
    this.onComplete = null;
  }

  register(name, SceneClass) {
    this.registry.set(name, SceneClass);
  }

  switchTo(name) {
    // 允许立即切换（覆盖 pending）
    if (!this.registry.has(name)) return;
    if (!this.currentScene) {
      this.activate(name);
      this.transition = { ...this.transition, phase: 'in', alpha: 1 };
      return;
    }
    this.pendingScene = name;
    this.transition.phase = 'out';
  }

  activate(name) {
    this.currentScene?.onExit?.();
    const SceneClass = this.registry.get(name);
    this.currentScene = new SceneClass(this.game);
    this.currentScene.onEnter?.();
  }

  update(dt) {
    this.currentScene?.update?.(dt);

    if (this.transition.phase === 'out') {
      this.transition.alpha += dt / this.transition.duration;
      if (this.transition.alpha >= 1) {
        this.transition.alpha = 1;
        this.activate(this.pendingScene);
        this.pendingScene = null;
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
