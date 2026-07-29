export class Overlay {
  constructor(game) {
    this.game = game;
    this.active = null;
    this._inputHandlers = null;
    this._savedHandlers = null;
  }

  show(config) {
    if (this.active) return;
    this.active = { ...config, time: 0 };
    // 保存当前 handler，hide 时还原
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
    if (this._savedHandlers && Object.keys(this._savedHandlers).length > 0) {
      this.game.input.setHandlers(this._savedHandlers);
    } else {
      this.game.input.setHandlers();
    }
    this._savedHandlers = null;
  }

  isActive() { return this.active !== null; }

  handleDown(point) {
    if (!this.active) return;
    const buttons = this.active.buttons || [];
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
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

    // 卡片背景
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
    ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
    ctx.arcTo(cx + r, cy + cardH, cx, cy + cardH, r);
    ctx.arcTo(cx, cy + r, cx, cy, r);
    ctx.closePath();
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

    // 消息（支持多行）
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

      // 按钮背景
      ctx.beginPath();
      const br = 8;
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + btnW - br, by);
      ctx.arcTo(bx + btnW, by, bx + btnW, by + br, br);
      ctx.arcTo(bx + btnW, by + btnH, bx + btnW - br, by + btnH, br);
      ctx.arcTo(bx + br, by + btnH, bx, by + btnH, br);
      ctx.arcTo(bx, by + br, bx, by, br);
      ctx.closePath();
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
