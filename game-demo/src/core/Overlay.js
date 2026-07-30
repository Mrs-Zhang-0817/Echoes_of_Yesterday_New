import { ArtworkMemoryReport } from '../ui/ArtworkMemoryReport.js';

export class Overlay {
  constructor(game) {
    this.game = game;
    this.active = null;
    this._report = null; // 章节完成报告（可抽离的叙事活动）
  }

  show(config) {
    if (this.active) return;
    this.active = { ...config, time: 0 };

    // 章节完成 → 委托 Canvas 报告渲染器，由它接管输入与绘制
    if (config.type === 'complete' && config.chapterNumber != null) {
      this._report = new ArtworkMemoryReport(this.game);
      this._report.open({
        chapterNumber: config.chapterNumber,
        memoryFrom: config.memoryFrom,
        memoryTo: config.memoryTo,
        onContinue: () => { config.onContinue?.(); this.hide(); },
      });
      this.game.input.setHandlers({
        down: point => this._report?.handleDown(point),
        move: () => {},
        up: () => {},
        cancel: () => {},
      });
    }
  }

  hide() {
    if (!this.active) return;
    this.active = null;
    this._report = null;
    this.game.input.setHandlers({});
    this.game.chapterManager.currentChapter?.onEnter?.();
  }

  isActive() {
    return this.active !== null;
  }

  update(dt) {
    if (this.active) {
      this.active.time += dt;
      this._report?.update(dt);
    }
  }

  render(ctx) {
    if (!this.active) return;

    if (this._report) {
      const { width, height } = this.game;
      this._report.render(ctx, width, height);
    }
  }
}
