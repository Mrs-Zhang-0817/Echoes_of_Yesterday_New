import { drawImageCover, drawPrompt } from './sceneUtils.js';

const PUZZLE_ZONE = { x: 300, y: 120, width: 690, height: 430 };

export class SceneDesk {
  constructor(game) { this.game = game; this.time = 0; this.emphasis = 0; }

  onEnter() { this.game.input.setHandlers({ up: point => this.handleUp(point) }); }
  onExit() { this.game.input.setHandlers(); }

  handleUp(point) {
    const zone = PUZZLE_ZONE;
    if (point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height) {
      this.game.sceneManager.switchTo('puzzle');
    } else {
      this.emphasis = 1;
    }
  }

  update(dt) {
    this.time += dt;
    this.emphasis = Math.max(0, this.emphasis - dt * 2);
  }

  render(ctx) {
    drawImageCover(ctx, this.game.images.desk, this.game.width, this.game.height);
    const breathing = 0.5 + 0.25 * Math.sin(this.time * 1.8);
    const alpha = Math.max(breathing, this.emphasis * 0.6);
    drawPrompt(ctx, '桌上有散落的拼图……', this.game.width / 2, 48, alpha - 0.4);
  }
}
