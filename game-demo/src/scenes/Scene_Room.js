import { drawImageCover, drawPrompt } from './sceneUtils.js';

const TABLE_HOT_ZONE = { x: 285, y: 475, width: 785, height: 245 };

export class SceneRoom {
  constructor(game) { this.game = game; this.time = 0; this.emphasis = 0; }

  onEnter() { this.game.input.setHandlers({ up: point => this.handleUp(point) }); }
  onExit() { this.game.input.setHandlers(); }

  handleUp(point) {
    const zone = TABLE_HOT_ZONE;
    if (point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height) {
      this.game.sceneManager.switchTo('desk');
    } else {
      this.emphasis = 1;
    }
  }

  update(dt) {
    this.time += dt;
    this.emphasis = Math.max(0, this.emphasis - dt * 2);
  }

  render(ctx) {
    drawImageCover(ctx, this.game.images.room, this.game.width, this.game.height);
    const breathing = 0.5 + 0.25 * Math.sin(this.time * 1.8);
    const alpha = Math.max(breathing, this.emphasis * 0.6);
    drawPrompt(ctx, '点击桌子看看……', this.game.width / 2, this.game.height - 48, alpha - 0.4);
  }
}
