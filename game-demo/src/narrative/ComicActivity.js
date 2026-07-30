// Canvas 漫画演出「活动」：配置驱动，逐格裁剪显示漫画分镜。
// 纯呈现型，点击推进。通过 isFinished / onComplete 通知章节切换。
export class ComicActivity {
  constructor(game) {
    this.game = game;
    this.config = null;
    this.imageKey = '';
    this.currentPanel = 0;
    this.fadeDuration = 0.4;
    this.fadeTimer = 0;
    this.fading = false;
    this.finished = false;
    this.onComplete = null;
    this.time = 0;
    this._clickCooldown = 0;
    this._cbFired = false;
    this._img = null;
  }

  start({ config, imageKey, onComplete } = {}) {
    this.config = config;
    this.imageKey = imageKey;
    this.currentPanel = 0;
    this.time = 0;
    this.fadeTimer = 0;
    this.fading = false;
    this.finished = false;
    this._cbFired = false;
    this._clickCooldown = 0;
    this.onComplete = onComplete;
    this._img = null;

    const img = this.game.images[imageKey];
    // 兼容 Image (naturalWidth) 和 placeholder Canvas (width)
    if (img && (img.naturalWidth || img.width > 0 || img.naturalHeight || img.height > 0)) {
      this._img = img;
    } else {
      // 图片尚未加载完成 → 延迟重试一次
      setTimeout(() => {
        const retry = this.game.images[imageKey];
        if (retry && (retry.naturalWidth || retry.width > 0)) {
          this._img = retry;
          this._setupInput();
        } else {
          this._fireDone(); // 实在加载不了就跳过漫画
        }
      }, 800);
      return this;
    }

    this._setupInput();
    return this;
  }

  _setupInput() {
    this.game.input.setHandlers({
      down: () => {
        if (this._clickCooldown > 0) return;
        this._clickCooldown = 0.35;
        this.next();
      },
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  _fireDone() {
    if (this._cbFired) return;
    this._cbFired = true;
    this.finished = true;
    this.game.input.setHandlers();
    if (this.onComplete) { const cb = this.onComplete; this.onComplete = null; cb(); }
  }

  next() {
    if (this.finished) return;
    if (!this.fading && this.currentPanel >= this.config.panels.length) {
      this._fireDone();
      return;
    }
    if (this.fading) {
      this.fadeTimer = this.fadeDuration;
      return;
    }
    this.currentPanel++;
    this.fadeTimer = 0;
    if (this.currentPanel > this.config.panels.length) {
      this._fireDone();
    } else {
      this.fading = true;
    }
  }

  update(dt) {
    if (this.finished) return;
    this.time += dt;
    if (this._clickCooldown > 0) {
      this._clickCooldown = Math.max(0, this._clickCooldown - dt);
    }
    if (this.fading) {
      this.fadeTimer += dt;
      if (this.fadeTimer >= this.fadeDuration) {
        this.fadeTimer = this.fadeDuration;
        this.fading = false;
        if (this.currentPanel >= this.config.panels.length) {
          this._fireDone();
        }
      }
    }
  }

  render(ctx, width, height) {
    if (this.finished) return;

    const img = this._img;
    if (!this.config || !img) return;

    ctx.save();
    ctx.fillStyle = '#090807';
    ctx.fillRect(0, 0, width, height);

    const imgW = img.naturalWidth || img.width || width;
    const imgH = img.naturalHeight || img.height || height;
    if (!imgW || !imgH) { ctx.restore(); return; }

    const scale = Math.max(width / imgW, height / imgH);
    const ox = (width - imgW * scale) / 2;
    const oy = (height - imgH * scale) / 2;

    for (let i = 0; i < this.currentPanel; i++) {
      const panel = this.config.panels[i];
      if (!panel) continue;
      const pts = panel.points;

      let alpha = 1;
      if (i === this.currentPanel - 1 && this.fading) {
        alpha = Math.min(1, this.fadeTimer / this.fadeDuration);
      }
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(ox + (pts[0][0] / 100) * imgW * scale, oy + (pts[0][1] / 100) * imgH * scale);
      for (let p = 1; p < pts.length; p++) {
        ctx.lineTo(ox + (pts[p][0] / 100) * imgW * scale, oy + (pts[p][1] / 100) * imgH * scale);
      }
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, ox, oy, imgW * scale, imgH * scale);
      ctx.restore();
    }

    if (!this._cbFired) {
      const pa = 0.3 + 0.3 * Math.sin(this.time * 2);
      ctx.save();
      ctx.globalAlpha = pa;
      ctx.fillStyle = '#d4b896';
      ctx.font = '16px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('点击继续', width / 2, height - 20);
      ctx.restore();
    }

    ctx.restore();
  }

  get isFinished() { return this.finished || this._cbFired; }
}
