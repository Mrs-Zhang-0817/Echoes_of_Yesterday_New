import { roundedRect } from '../utils/sceneUtils.js';
import { drawArchiveButton, drawArchivePanel, drawArchiveStamp } from '../ui/ArchiveUI.js';

export class Overlay {
  constructor(game) {
    this.game = game;
    this.active = null;
    this._overlayHandlers = null;
  }

  show(config) {
    if (this.active) return;
    this.active = { ...config, time: 0 };

    // 接管输入
    this._overlayHandlers = {
      down: point => this._handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    };
    this.game.input.setHandlers(this._overlayHandlers);
  }

  hide() {
    this.active = null;
    this.game.input.setHandlers();
    this.game.chapterManager.currentChapter?.onEnter?.();
  }

  isActive() {
    return this.active !== null;
  }

  _handleDown(point) {
    if (!this.active) return;
    const buttons = this.active.buttons || [];
    for (const btn of buttons) {
      const bbox = btn.bbox;
      if (!bbox) continue;
      if (point.x >= bbox.x && point.x <= bbox.x + bbox.w &&
          point.y >= bbox.y && point.y <= bbox.y + bbox.h) {
        btn.action?.();
        this.hide();
        return;
      }
    }
  }

  update(dt) {
    if (this.active) this.active.time += dt;
  }

  render(ctx) {
    if (!this.active) return;
    const { width, height } = this.game;
    const config = this.active;

    // 半透明遮罩
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);

    // 居中卡片
    const cardW = 420;
    const cardH = 280;
    const cx = (width - cardW) / 2;
    const cy = (height - cardH) / 2;
    const centerX = width / 2;
    const r = 16;

    drawArchivePanel(ctx, cx, cy, cardW, cardH, '记忆档案');
    drawArchiveStamp(ctx, cx + cardW - 42, cy + 38, '已记录');

    // 标题
    ctx.fillStyle = '#2a1a0c';
    ctx.font = 'bold 24px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.title, centerX, cy + 48);

    // 消息
    if (config.message) {
      ctx.fillStyle = '#4d3420';
      ctx.font = '17px system-ui, "PingFang SC", sans-serif';
      const lines = config.message.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, cy + 100 + i * 26);
      });
    }

    // 按钮
    const btns = config.buttons || [];
    const btnW = 180;
    const btnH = 44;
    const gap = 16;
    const totalBtnW = btns.length * btnW + (btns.length - 1) * gap;
    const startBtnX = (width - totalBtnW) / 2;
    const btnTop = cy + cardH - 68;

    for (let i = 0; i < btns.length; i++) {
      const bx = startBtnX + i * (btnW + gap);
      const by = btnTop;
      btns[i].bbox = { x: bx, y: by, w: btnW, h: btnH };

      btns[i].bbox = drawArchiveButton(ctx, bx, by, btnW, btnH, btns[i].text);
    }

    ctx.restore();
  }
}
