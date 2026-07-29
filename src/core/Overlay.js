import { roundedRect } from '../utils/sceneUtils.js';

export class Overlay {
  constructor(game) {
    this.game = game;
    this.active = null;
    this._savedHandlers = null;
  }

  show(config) {
    // 防止每帧重复弹
    if (this.active) return;
    this.active = { ...config, time: 0 };
    // 接管输入：保存当前 handler，设置 overlay 自己的 handler
    this._savedHandlers = { ...this.game.input.handlers };
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  hide() {
    this.active = null;
    // 还原之前保存的 handler
    if (this._savedHandlers && Object.keys(this._savedHandlers).length > 0) {
      this.game.input.setHandlers(this._savedHandlers);
    } else {
      this.game.input.setHandlers();
    }
    this._savedHandlers = null;
  }

  isActive() {
    return this.active !== null;
  }

  handleDown(point) {
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

    // 卡片背景
    roundedRect(ctx, cx, cy, cardW, cardH, r);
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
    cardGrad.addColorStop(0, '#fcf5e6');
    cardGrad.addColorStop(1, '#f0deb4');
    ctx.fillStyle = cardGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(42, 26, 12, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

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

      roundedRect(ctx, bx, by, btnW, btnH, 8);
      ctx.fillStyle = '#4d3420';
      ctx.fill();

      ctx.fillStyle = '#fcf5e6';
      ctx.font = '600 16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText(btns[i].text, bx + btnW / 2, by + btnH / 2);
    }

    ctx.restore();
  }
}
