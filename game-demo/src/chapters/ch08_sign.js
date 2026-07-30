import { SmileDetector } from '../interactions/SmileDetector.js';
import { getChapterComics, getComicScene } from '../data/comicConfig.js';
import { ComicActivity } from '../narrative/ComicActivity.js';

export class Chapter08 {
  constructor(game) {
    this.game = game;
    this.DW = 1280;
    this.DH = 720;
    this.phase = 'mirror';
    this.phaseTime = 0;
    this._completed = false;
    this.sampleTime = 0;
    this.sampling = false;
    this.wavePoints = [];
    this.wavePointerId = null;
    this.cameraRect = { x: 360, y: 590, width: 260, height: 54 };
    this.waveRect = { x: 660, y: 590, width: 260, height: 54 };
    this.detector = game.createSmileDetector?.() || new SmileDetector();
    this.statusText = '镜中那个人，为什么也在看着我？';
    this.comic = null;
    this._comicQueue = [];
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '认出了自己'; }
  get completeMessage() { return '他不是陌生人。那是我自己。'; }

  onEnter() {
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: point => this.handleMove(point),
      up: point => this.handleUp(point),
      cancel: () => this.handleCancel(),
    });
    this._goto('mirror');
  }

  onExit() {
    this.game.input.setHandlers();
    this.detector.stop();
  }

  handleDown(point) {
    if (this.phase === 'mirror') {
      if (this._contains(this.cameraRect, point)) {
        this._startCamera();
      } else if (this._contains(this.waveRect, point)) {
        this._goto('wave');
      }
      return;
    }
    if (this.phase === 'camera') {
      if (this._contains(this.waveRect, point)) this._goto('wave');
      return;
    }
    if (this.phase === 'wave') {
      this.wavePointerId = point.pointerId;
      this.wavePoints = [{ x: point.x, y: point.y }];
    }
  }

  handleMove(point) {
    if (this.phase !== 'wave' || point.pointerId !== this.wavePointerId) return;
    const last = this.wavePoints[this.wavePoints.length - 1];
    if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 8) {
      this.wavePoints.push({ x: point.x, y: point.y });
    }
  }

  handleUp(point) {
    if (this.phase !== 'wave' || point.pointerId !== this.wavePointerId) return;
    if (this._isWave(this.wavePoints)) this._goto('reveal');
    else {
      this.statusText = '从左到右挥一次手，让镜中的他跟着你。';
      this.wavePoints = [];
    }
    this.wavePointerId = null;
  }

  handleCancel() {
    this.wavePoints = [];
    this.wavePointerId = null;
  }

  // ---- 漫画播放 ----

  _playComics(chapterKey, onAllComplete) {
    const scenes = getChapterComics(chapterKey);
    if (!scenes || scenes.length === 0) { onAllComplete(); return; }
    this._comicQueue = [...scenes];
    this._playNextComic(onAllComplete);
  }

  _playNextComic(onAllComplete) {
    if (this._comicQueue.length === 0) { onAllComplete(); return; }
    const sceneKey = this._comicQueue.shift();
    const config = getComicScene(sceneKey);
    if (!config) { this._playNextComic(onAllComplete); return; }
    this.comic = new ComicActivity(this.game);
    this.comic.start({
      config,
      imageKey: config.imageKey,
      onComplete: () => { this._playNextComic(onAllComplete); },
    });
  }

  update(dt) {
    if (this.comic && !this.comic.isFinished) {
      this.comic.update(dt);
      return;
    }

    this.phaseTime += dt;
    if (this.phase !== 'camera') {
      if (this.phase === 'reveal' && this.phaseTime >= 1.4 && !this._completed) {
        this._goto('complete');
        this._playComics('ch08', () => {
          this._completed = true;
          this.game.progress.markChapterComplete(8, 72);
        });
      }
      return;
    }

    this.sampleTime += dt;
    if (!this.sampling && this.sampleTime >= 0.2) {
      this.sampleTime = 0;
      this.sampling = true;
      this.detector.sample().then(result => {
        if (this.phase !== 'camera') return;
        if (result.state === 'smiling') this._goto('reveal');
        else if (result.state === 'failed') this._goto('wave');
        else this.statusText = `保持微笑… ${Math.min(100, Math.round(result.happy * 100))}%`;
      }).finally(() => { this.sampling = false; });
    }
    if (this.phaseTime >= 8) this._goto('wave');
  }

  render(ctx) {
    if (this.comic && !this.comic.isFinished) {
      this.comic.render(ctx, this.DW, this.DH);
      return;
    }

    this._drawBackground(ctx);
    this._drawMirror(ctx);
    if (this.phase === 'mirror') this._drawChoice(ctx);
    if (this.phase === 'camera') this._drawCamera(ctx);
    if (this.phase === 'wave') this._drawWave(ctx);
    if (this.phase === 'reveal') this._drawReveal(ctx);
  }

  _goto(phase) {
    if (this.phase === 'camera' && phase !== 'camera') this.detector.stop();
    this.phase = phase;
    this.phaseTime = 0;
    this.sampleTime = 0;
    if (phase === 'mirror') this.statusText = '镜中那个人，为什么也在看着我？';
    if (phase === 'wave') this.statusText = '从左到右挥一次手，让镜中的他跟着你。';
    if (phase === 'reveal') this.statusText = '他……在学我？不对，这好像是我自己。';
  }

  async _startCamera() {
    this.statusText = '正在打开前置摄像头…';
    const started = await this.detector.start();
    if (started) {
      this._goto('camera');
      this.statusText = '看着镜头，保持微笑 1.5 秒。';
    } else {
      this._goto('wave');
    }
  }

  _drawBackground(ctx) {
    const corridor = this.game.images.ch8_corridor;
    if (corridor) ctx.drawImage(corridor, 0, 0, this.DW, this.DH);
    else {
      const gradient = ctx.createLinearGradient(0, 0, this.DW, this.DH);
      gradient.addColorStop(0, '#273241');
      gradient.addColorStop(1, '#11151e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.DW, this.DH);
    }
    ctx.fillStyle = 'rgba(6, 10, 18, 0.36)';
    ctx.fillRect(0, 0, this.DW, this.DH);
  }

  _drawMirror(ctx) {
    const mirror = this.game.images.ch8_mirror_wall;
    if (mirror) ctx.drawImage(mirror, 370, 42, 540, 520);
    else {
      ctx.fillStyle = '#6a7280';
      ctx.fillRect(400, 62, 480, 480);
      ctx.fillStyle = '#1a202d';
      ctx.fillRect(424, 86, 432, 432);
    }

    const reveal = this.phase === 'reveal' ? Math.min(1, this.phaseTime / 1.2) : 0;
    const stranger = this.game.images.ch8_mirror_stranger;
    const smile = this.game.images.ch8_mirror_smile;
    const portrait = this.phase === 'camera' && this.detector.video?.readyState >= 2 ? null : stranger;
    if (portrait) {
      ctx.save();
      ctx.globalAlpha = 1 - reveal;
      ctx.drawImage(portrait, 500, 115, 280, 360);
      ctx.restore();
    }
    if (smile && reveal > 0) {
      ctx.save();
      ctx.globalAlpha = reveal;
      ctx.drawImage(smile, 500, 115, 280, 360);
      ctx.restore();
    }

    const crack = this.game.images.ch8_crack;
    if (crack) {
      ctx.save();
      ctx.globalAlpha = 0.82 * (1 - reveal);
      ctx.drawImage(crack, 470, 92, 340, 420);
      ctx.restore();
    }
  }

  _drawChoice(ctx) {
    this._drawText(ctx, this.statusText, 640, 580, 24, '#f2e6d5');
    this._drawButton(ctx, this.cameraRect, '开启前置摄像头', '#d9b374', '#2b1d12');
    this._drawButton(ctx, this.waveRect, '不用摄像头，挥手', '#304156', '#edf3fa');
  }

  _drawCamera(ctx) {
    const video = this.detector.video;
    if (video?.readyState >= 2) {
      ctx.save();
      ctx.translate(640, 295);
      ctx.scale(-1, 1);
      ctx.drawImage(video, -140, -180, 280, 360);
      ctx.restore();
    }
    this._drawText(ctx, this.statusText, 640, 580, 22, '#f2e6d5');
    this._drawButton(ctx, this.waveRect, '改用挥手通关', '#304156', '#edf3fa');
  }

  _drawWave(ctx) {
    this._drawText(ctx, this.statusText, 640, 580, 23, '#f2e6d5');
    if (this.wavePoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#e9c77f';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.wavePoints[0].x, this.wavePoints[0].y);
      for (let index = 1; index < this.wavePoints.length; index += 1) ctx.lineTo(this.wavePoints[index].x, this.wavePoints[index].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawReveal(ctx) {
    const light = Math.min(1, this.phaseTime / 1.2);
    const glow = ctx.createRadialGradient(640, 295, 20, 640, 295, 450);
    glow.addColorStop(0, `rgba(252, 214, 135, ${0.22 * light})`);
    glow.addColorStop(1, 'rgba(252, 214, 135, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.DW, this.DH);
    this._drawText(ctx, this.statusText, 640, 580, 24, '#fff4d8');
  }

  _drawButton(ctx, rect, label, background, color) {
    ctx.save();
    this._roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
    ctx.fillStyle = background;
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = '600 18px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
  }

  _drawText(ctx, text, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 8, 14, 0.52)';
    this._roundedRect(ctx, 250, y - size, 780, size + 24, 18);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `500 ${size}px "PingFang SC", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _isWave(points) {
    if (points.length < 3) return false;
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    return Math.max(...xs) - Math.min(...xs) >= this.DW * 0.35 && Math.max(...ys) - Math.min(...ys) >= 50;
  }

  _contains(rect, point) {
    return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
  }

  _roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
