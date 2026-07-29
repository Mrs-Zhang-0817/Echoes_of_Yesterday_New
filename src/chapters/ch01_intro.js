import { drawImageCover, drawPrompt, roundedRect } from '../utils/sceneUtils.js';

// 镜子椭圆参数
const MIRROR_CX = 640;
const MIRROR_CY = 340;
const MIRROR_RX = 250;
const MIRROR_RY = 325;
const FRAME_WIDTH = 14;
const FRAME_INNER_RX = MIRROR_RX - FRAME_WIDTH;
const FRAME_INNER_RY = MIRROR_RY - FRAME_WIDTH;

export class Chapter01 {
  constructor(game) {
    this.game = game;
    this.phase = 'idle';
    this.phaseTime = 0;
    this._completed = false;
    this.clickCount = 0;       // idle 阶段点击次数计数
    this.shatterParticles = []; // shattering 阶段的碎片粒子
    this.cracks = [];          // 裂纹线段列表
    this.cracksVisible = false;
    this.breathTime = Math.random() * Math.PI * 2; // 呼吸动画起始相位
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '回忆的碎片'; }
  get completeMessage() { return '镜中的自己……是谁？'; }

  onEnter() {
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: () => {},
      up: () => {},
      cancel: () => {},
    });
  }

  onExit() {
    this.game.input.setHandlers();
  }

  handleDown(point) {
    if (this.phase === 'complete') return;

    if (this.phase === 'shattering') return;

    // idle: 点击镜子热区或累计点击 3 次都触发碎裂
    const dx = point.x - MIRROR_CX;
    const dy = point.y - MIRROR_CY;
    const inMirror = (dx * dx) / (MIRROR_RX * MIRROR_RX) + (dy * dy) / (MIRROR_RY * MIRROR_RY) <= 1;

    this.clickCount++;
    if (inMirror || this.clickCount >= 3) {
      this.startShattering();
    }
  }

  startShattering() {
    this.phase = 'shattering';
    this.phaseTime = 0;
    this.cracksVisible = false;
    this.shatterParticles = [];
    this.cracks = [];

    // 生成 30 个碎片粒子
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      const size = 4 + Math.random() * 10;
      // 粒子颜色：铜色到白色渐变
      const t = Math.random();
      const r = Math.round(180 + t * 75);
      const g = Math.round(130 + t * 125);
      const b = Math.round(70 + t * 185);
      const color = `rgb(${r},${g},${b})`;
      this.shatterParticles.push({
        x: MIRROR_CX,
        y: MIRROR_CY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        rotation: 0,
        spin: (Math.random() - 0.5) * 8,
        color,
        life: 1.5 + Math.random() * 1.0,
      });
    }

    // 生成裂纹线（5-7 条从中心辐射的随机锯齿线）
    const crackCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < crackCount; i++) {
      const baseAngle = (Math.PI * 2 / crackCount) * i + (Math.random() - 0.5) * 0.6;
      const length = 120 + Math.random() * 200;
      const segments = [];
      let cx = MIRROR_CX;
      let cy = MIRROR_CY;
      let segs = 3 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segs; s++) {
        const segAngle = baseAngle + (Math.random() - 0.5) * 0.4;
        const segLen = length / segs * (0.7 + Math.random() * 0.6);
        const nx = cx + Math.cos(segAngle) * segLen;
        const ny = cy + Math.sin(segAngle) * segLen;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx;
        cy = ny;
      }
      this.cracks.push(segments);
    }

    try { navigator.vibrate?.(30); } catch {}
  }

  update(dt) {
    this.breathTime += dt;

    if (this.phase === 'idle') return;

    if (this.phase === 'shattering') {
      this.phaseTime += dt;

      // 0.3 秒后显示裂纹
      if (this.phaseTime >= 0.3 && !this.cracksVisible) {
        this.cracksVisible = true;
      }

      // 更新粒子物理
      const gravity = 80;
      for (const p of this.shatterParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += gravity * dt;
        p.rotation += p.spin * dt;
        p.life -= dt;
      }

      // 移除生命周期结束的粒子
      this.shatterParticles = this.shatterParticles.filter(p => p.life > 0);

      // 2 秒后进入 complete
      if (this.phaseTime >= 2) {
        this.phase = 'complete';
        this._completed = true;
        this.game.progress.markChapterComplete(1, 5);
      }
    }
  }

  render(ctx) {
    const { width, height } = this.game;

    // === 背景：优先使用主界面底图，加载失败回退程序化渐变 ===
    const bgImg = this.game.images.mainMenuBg;
    if (bgImg && !bgImg._placeholder) {
      drawImageCover(ctx, bgImg, width, height);
      // 压暗遮罩，保证镜面与文字可读性
      ctx.fillStyle = 'rgba(13, 8, 5, 0.55)';
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 500);
      bgGrad.addColorStop(0, '#1a1010');
      bgGrad.addColorStop(1, '#0d0805');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // === 镜框光晕 ===
    const glowGrad = ctx.createRadialGradient(MIRROR_CX, MIRROR_CY, MIRROR_RY * 0.3, MIRROR_CX, MIRROR_CY, MIRROR_RY * 1.2);
    glowGrad.addColorStop(0, 'rgba(180, 140, 80, 0.12)');
    glowGrad.addColorStop(1, 'rgba(180, 140, 80, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.ellipse(MIRROR_CX, MIRROR_CY, MIRROR_RX + 30, MIRROR_RY + 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // === 铜色镜框（外椭圆） ===
    ctx.save();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = FRAME_WIDTH;
    ctx.beginPath();
    ctx.ellipse(MIRROR_CX, MIRROR_CY, MIRROR_RX, MIRROR_RY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 镜框高光线（上半内侧）
    ctx.strokeStyle = 'rgba(230, 200, 120, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(MIRROR_CX, MIRROR_CY - 4, MIRROR_RX - 2, MIRROR_RY - 6, 0, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();

    // === 镜面（椭圆内深灰区域） ===
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(MIRROR_CX, MIRROR_CY, FRAME_INNER_RX, FRAME_INNER_RY, 0, 0, Math.PI * 2);
    ctx.clip();

    // 镜面底色
    const mirrorGrad = ctx.createRadialGradient(MIRROR_CX - 40, MIRROR_CY - 40, 30, MIRROR_CX, MIRROR_CY, FRAME_INNER_RY);
    mirrorGrad.addColorStop(0, '#3a3528');
    mirrorGrad.addColorStop(0.5, '#2a251a');
    mirrorGrad.addColorStop(1, '#1a150e');
    ctx.fillStyle = mirrorGrad;
    ctx.fillRect(MIRROR_CX - FRAME_INNER_RX, MIRROR_CY - FRAME_INNER_RY, FRAME_INNER_RX * 2, FRAME_INNER_RY * 2);

    // 镜面呼吸光晕
    if (this.phase === 'idle') {
      const breathAlpha = 0.05 + Math.sin(this.breathTime * (Math.PI * 2 / 3)) * 0.05 + 0.05;
      const breathGrad = ctx.createRadialGradient(MIRROR_CX, MIRROR_CY, 30, MIRROR_CX, MIRROR_CY, FRAME_INNER_RY * 0.7);
      breathGrad.addColorStop(0, `rgba(200, 170, 100, ${breathAlpha})`);
      breathGrad.addColorStop(1, 'rgba(200, 170, 100, 0)');
      ctx.fillStyle = breathGrad;
      ctx.fillRect(MIRROR_CX - FRAME_INNER_RX, MIRROR_CY - FRAME_INNER_RY, FRAME_INNER_RX * 2, FRAME_INNER_RY * 2);

      // 镜面微弱的反射高光
      ctx.fillStyle = 'rgba(255, 240, 200, 0.03)';
      ctx.beginPath();
      ctx.ellipse(MIRROR_CX - 50, MIRROR_CY - 70, 80, 40, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // === 裂纹（shattering 0.3s 后开始绘制） ===
    if (this.phase === 'shattering' && this.cracksVisible) {
      ctx.save();
      // 裂纹随时间逐渐加深
      const crackVisibility = Math.min(1, (this.phaseTime - 0.3) / 0.5);
      ctx.strokeStyle = `rgba(80, 60, 40, ${0.4 * crackVisibility})`;
      ctx.lineWidth = 2;
      for (const segments of this.cracks) {
        for (const seg of segments) {
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
      }
      // 第二条细裂纹
      ctx.strokeStyle = `rgba(200, 170, 130, ${0.2 * crackVisibility})`;
      ctx.lineWidth = 1;
      for (const segments of this.cracks) {
        for (const seg of segments) {
          const mx = (seg.x1 + seg.x2) / 2 + (Math.random() - 0.5) * 4;
          const my = (seg.y1 + seg.y2) / 2 + (Math.random() - 0.5) * 4;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(mx, my);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // === 碎片粒子 ===
    for (const p of this.shatterParticles) {
      const alpha = Math.min(1, p.life * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // 绘制小三角形碎片
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.5, -s * 0.6);
      ctx.lineTo(-s * 0.4, s * 0.7);
      ctx.closePath();
      ctx.fill();

      // 碎片边缘微光
      ctx.strokeStyle = `rgba(255, 220, 160, ${alpha * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // === 底部分阶段提示 ===
    if (this.phase === 'idle') {
      drawPrompt(ctx, '凝视镜中的自己……', width / 2, height - 50, 0);
    } else if (this.phase === 'shattering') {
      const holdAlpha = Math.min(1, this.phaseTime / 0.5);
      ctx.save();
      ctx.globalAlpha = 1 - holdAlpha;
      drawPrompt(ctx, '凝视镜中的自己……', width / 2, height - 50, 0);
      ctx.restore();
    }
  }
}
