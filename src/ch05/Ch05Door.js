import { drawPrompt, roundedRect } from '../utils/sceneUtils.js';

const SUNFLOWER_TARGET = { x: 640, y: 280, radius: 55 };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function vibe(ms) {
  try { navigator.vibrate(ms); } catch (e) {}
}

export class Ch05Door {
  constructor(game) {
    this.game = game;
    this.phase = 'comicIntro';
    this.phaseTime = 0;
    this._complete = false;
    this.time = 0;
    this.elevateOffset = 0;
    this.successFlash = 0;
    this.comicPage = 0;
    this._progressSaved = false;

    this.comicPages = [
      './assets/images/ch5_bg_elevator.jpg',
      './assets/images/ch5_elevator_sunflower_panel.jpg',
    ];
    this.narrativeLines = [
      '走出警局，坐上了女儿的车。',
      '窗外的霓虹灯流光溢彩……',
      '车子驶入了住了几十年的老小区。',
      '可是在夜色中，这里却像一个巨大的迷宫。',
    ];
  }

  get isComplete() { return this._complete; }

  async onEnter() {
    const loadImg = (src) => new Promise((res, rej) => {
      const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
    if (!this._comicImgs && this.comicPages) {
      try { this._comicImgs = await Promise.all(this.comicPages.map(loadImg)); }
      catch (err) { this._comicImgs = []; }
    }
    if (!this._images) {
      try {
        this._images = {
          ch5_bg_elevator: await loadImage('./assets/images/ch5_bg_elevator.jpg'),
          ch5_elevator_sunflower_panel: await loadImage('./assets/images/ch5_elevator_sunflower_panel.jpg'),
          ch5_sunflower_sticker: await loadImage('./assets/images/ch5_sunflower_sticker.jpg'),
          ch5_floor_1: await loadImage('./assets/images/ch5_floor_1.jpg'),
          ch5_floor_2: await loadImage('./assets/images/ch5_floor_2.jpg'),
          ch5_floor_3: await loadImage('./assets/images/ch5_floor_3.jpg'),
          ch5_floor_4: await loadImage('./assets/images/ch5_floor_4.jpg'),
          ch5_floor_5: await loadImage('./assets/images/ch5_floor_5.jpg'),
        };
      } catch (err) { console.error('Ch5 images:', err); }
    }
    this.game.showHint('');
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  onExit() {
    this.game.input.setHandlers();
    this.game.showHint('');
  }

  handleDown(point) {
    try {
      if (this.phase === 'comicIntro') {
        this.comicPage++;
        if (this.comicPage >= (this._comicImgs?.length || 1)) {
          this.phase = 'narrative';
          this.phaseTime = 0;
        }
        return;
      }
      if (this.phase === 'comicOutro') {
        this.phase = 'complete';
        this.phaseTime = 0;
        return;
      }
      if (this.phase === 'narrative') {
        if (this.phaseTime > 1.5) {
          this.phase = 'gating2';
          this.phaseTime = 0;
        }
      } else if (this.phase === 'gating2') {
        const dx = point.x - SUNFLOWER_TARGET.x;
        const dy = point.y - SUNFLOWER_TARGET.y;
        if (Math.hypot(dx, dy) <= SUNFLOWER_TARGET.radius) {
          this.phase = 'gating2_elevating';
          this.phaseTime = 0;
          this.successFlash = 1;
          this.elevateOffset = 0;
          vibe(15);
        } else { vibe(30); }
      }
    } catch (e) { console.error('Ch05 handleDown:', e); }
  }

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;
    switch (this.phase) {
      case 'narrative':
        if (this.phaseTime >= 6) { this.phase = 'gating2'; this.phaseTime = 0; }
        break;
      case 'gating2_elevating':
        this.successFlash = Math.max(0, this.successFlash - dt * 1.5);
        this.elevateOffset += dt * 180;
        if (this.phaseTime >= 2.5) {
          this.phase = 'comicOutro';
          this.phaseTime = 0;
          this.comicPage = 0;
        }
        break;
      case 'complete':
        if (!this._progressSaved) {
          this._progressSaved = true;
          this.game.progress.markChapterComplete(5, 40);
          setTimeout(() => this.game.goMemoryReport('chapter_05'), 500);
        }
        break;
    }
  }

  render(ctx) {
    try { this._renderSafe(ctx); }
    catch (e) {
      ctx.fillStyle = '#0a0806';
      ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
  }

  _renderSafe(ctx) {
    const { width, height } = this.game;
    switch (this.phase) {
      case 'comicIntro':
      case 'comicOutro':
        this.renderComic(ctx, width, height);
        break;
      case 'narrative': this.renderNarrative(ctx); break;
      case 'gating2': this.renderGating2(ctx); break;
      case 'gating2_elevating': this.renderGating2Elevating(ctx); break;
      default:
        ctx.fillStyle = '#0a0806';
        ctx.fillRect(0, 0, width, height);
    }
  }

  renderComic(ctx, width, height) {
    const img = this._comicImgs?.[this.comicPage];
    if (img) {
      const scale = Math.max(width / img.width, height / img.height);
      const iw = img.width * scale, ih = img.height * scale;
      ctx.drawImage(img, (width - iw) / 2, (height - ih) / 2, iw, ih);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, height - 55, width, 55);
    ctx.fillStyle = '#d4b896';
    ctx.font = '16px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击继续', width / 2, height - 28);
  }

  renderNarrative(ctx) {
    const { width, height } = this.game;
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, width, height);
    const alpha = Math.min(1, this.phaseTime / 1.5);
    const textIdx = Math.min(Math.floor(this.phaseTime / 1.2), this.narrativeLines.length - 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d4b896';
    ctx.font = '500 28px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = Math.floor((this.phaseTime - textIdx * 1.2) / 0.03);
    const line = this.narrativeLines[textIdx];
    if (line) ctx.fillText(line.slice(0, Math.min(chars, line.length)), width / 2, height / 2 - 20);
    if (this.phaseTime > 3.5) {
      ctx.globalAlpha = Math.min(1, (this.phaseTime - 3.5) / 0.8);
      ctx.fillStyle = '#8a7a6a';
      ctx.font = '16px system-ui, "PingFang SC", sans-serif';
      ctx.fillText('点击或触摸继续……', width / 2, height - 60);
    }
    ctx.restore();
  }

  renderGating2(ctx) {
    const { width, height } = this.game;
    this.drawElevatorBg(ctx, width, height);
    const panel = this._images?.ch5_elevator_sunflower_panel;
    if (panel) {
      const panelScale = width / panel.width;
      const cropH = panel.height * 0.42;
      const displayH = cropH * panelScale;
      ctx.drawImage(panel, 0, 0, panel.width, cropH, 0, 80, width, displayH);
      const grad = ctx.createLinearGradient(0, 80 + displayH, 0, 80 + displayH + 80);
      grad.addColorStop(0, 'rgba(42,32,22,0.6)');
      grad.addColorStop(1, 'rgba(42,32,22,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 80 + displayH, width, 80);
    }
    const tx = width / 2, ty = 280;
    for (let i = 0; i < 3; i++) {
      const r = 35 + i * 16 + Math.sin(this.time * 3 + i) * 5;
      ctx.strokeStyle = `rgba(240, 192, 64, ${0.25 - i * 0.06})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.drawAIHint(ctx, width);
  }

  drawElevatorBg(ctx, width, height) {
    const elevator = this._images?.ch5_bg_elevator;
    if (elevator) {
      ctx.drawImage(elevator, 0, 0, width, height);
      ctx.fillStyle = 'rgba(15, 13, 12, 0.24)';
      ctx.fillRect(0, 0, width, height);
      return;
    }
    ctx.fillStyle = '#3a3835';
    ctx.fillRect(0, 0, width, height);
  }

  drawAIHint(ctx, width) {
    ctx.save();
    const hintX = width - 20, hintY = 50, hintW = 280, hintH = 80;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundedRect(ctx, hintX - hintW, hintY - 10, hintW, hintH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 192, 64, 0.3)';
    ctx.lineWidth = 1;
    roundedRect(ctx, hintX - hintW, hintY - 10, hintW, hintH, 10);
    ctx.stroke();
    ctx.fillStyle = '#f0c040';
    ctx.font = '14px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('AI 管家', hintX - 12, hintY + 4);
    ctx.fillStyle = '#d4c8b8';
    ctx.font = '15px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('"您的家在有向日葵贴纸的那一层。"', hintX - 12, hintY + 30);
    ctx.restore();
  }

  renderGating2Elevating(ctx) {
    const { width, height } = this.game;
    const floor = Math.max(1, Math.min(5, Math.floor(this.phaseTime / 0.5) + 1));
    const floorImg = this._images?.[`ch5_floor_${floor}`];
    ctx.save();
    if (floorImg) ctx.drawImage(floorImg, 0, 0, width, height);
    else this.drawElevatorBg(ctx, width, height);
    ctx.restore();
    if (this.successFlash > 0) {
      ctx.fillStyle = `rgba(240, 192, 64, ${this.successFlash * 0.08})`;
      ctx.fillRect(0, 0, width, height);
    }
    const shake = this.phaseTime < 1 ? Math.sin(this.phaseTime * 40) * 3 : 0;
    ctx.fillStyle = '#d4b896';
    ctx.font = 'bold 36px system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${floor}F`, width / 2 + shake, height / 2 - 40);
    ctx.fillStyle = '#a09080';
    ctx.font = '20px system-ui, "PingFang SC", sans-serif';
    ctx.fillText('电梯缓缓上升……', width / 2 + shake, height / 2 + 20);
  }
}
