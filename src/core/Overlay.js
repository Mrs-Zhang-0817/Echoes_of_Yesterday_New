import { roundedRect } from '../utils/sceneUtils.js';

export class Overlay {
  constructor(game) {
    this.game = game;
    this.active = null; // null 或 { type, title, message, buttons, time }
    this._inputHandlers = null;
  }

  show(config) {
    this.active = { ...config, time: 0 };
    // 接管输入：在弹层激活时，原始章节的 input handler 被临时覆盖
    this._inputHandlers = {
      down: point => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    };
  }

  hide() {
    this.active = null;
    // 恢复时由章节的 onEnter 重新设置 handler
  }

  isActive() {
    return this.active !== null;
  }

  handleDown(point) {
    if (!this.active) return;
    const buttons = this.active.buttons || [];
    for (const btn of buttons) {
      if (this.hitButton(point, btn)) {
        btn.action?.();
        this.hide();
        return;
      }
    }
  }

  hitButton(point, btn) {
    const bbox = btn.bbox;
    if (!bbox) return false;
    return point.x >= bbox.x && point.x <= bbox.x + bbox.w &&
           point.y >= bbox.y && point.y <= bbox.y + bbox.h;
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

    // 卡片背景
    roundedRect(ctx, cx, cy, cardW, cardH, 16);
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
    ctx.fillText(config.title, width / 2, cy + 48);

    // 消息
    if (config.message) {
      ctx.fillStyle = '#4d3420';
      ctx.font = '17px system-ui, "PingFang SC", sans-serif';
      ctx.fillText(config.message, width / 2, cy + 100);
    }

    // 按钮
    const btns = config.buttons || [];
    const btnW = 180;
    const btnH = 44;
    const gap = 16;
    const totalBtnW = btns.length * btnW + (btns.length - 1) * gap;
    const startBtnX = (width - totalBtnW) / 2;
    const btnY = cy + cardH - 50 - btnH / 2;

    config._btnRects = [];

    for (let i = 0; i < btns.length; i++) {
      const bx = startBtnX + i * (btnW + gap);
      const by = btnY - btnH / 2;
      config._btnRects.push({ x: bx, y: by, w: btnW, h: btnH });
      btns[i].bbox = { x: bx, y: by, w: btnW, h: btnH };

      // 按钮背景
      roundedRect(ctx, bx, by, btnW, btnH, 8);
      ctx.fillStyle = '#4d3420';
      ctx.fill();

      // 按钮文字
      ctx.fillStyle = '#fcf5e6';
      ctx.font = '600 16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText(btns[i].text, bx + btnW / 2, by + btnH / 2);
    }

    ctx.restore();
  }
}
