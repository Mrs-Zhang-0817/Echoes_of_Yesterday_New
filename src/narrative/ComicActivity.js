// Canvas 漫画演出「活动」：整张漫画页淡入呈现。
// 美术本身已完成分镜与构图，运行时不得再裁切；点击翻到下一张。
export class ComicActivity {
  constructor(game) {
    this.game = game;
    this.config = null;
    this.imageKey = '';
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
    this.time = 0;
    this.fadeTimer = 0;
    this.fading = true;
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
    if (this.fading) {
      this.fadeTimer = this.fadeDuration;
      this.fading = false;
      return;
    }
    this._fireDone();
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
        this.fading = false;
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

    // contain 而非 cover：宁可留极细边，也绝不裁掉漫画的任意一格。
    const scale = Math.min(width / imgW, height / imgH);
    const ox = (width - imgW * scale) / 2;
    const oy = (height - imgH * scale) / 2;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this.fadeTimer / this.fadeDuration);
    ctx.drawImage(img, ox, oy, imgW * scale, imgH * scale);
    ctx.restore();

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
