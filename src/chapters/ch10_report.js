import { drawImageCover, drawPrompt, roundedRect } from '../utils/sceneUtils.js';

const CHAPTERS = [
  { id: 1, title: '序曲·镜前', memory: 5 },
  { id: 2, title: '接女儿放学', memory: 15 },
  { id: 3, title: '迷途', memory: 22 },
  { id: 4, title: '警局', memory: 30 },
  { id: 5, title: '归家迷途', memory: 40 },
  { id: 6, title: '餐桌上的博弈', memory: 52 },
  { id: 7, title: '惊悚夜醒', memory: 60 },
  { id: 8, title: '自我和解', memory: 72 },
  { id: 9, title: '风铃', memory: 85 },
  { id: 10, title: '认出·不迷路', memory: 100 },
];

export class Chapter10 {
  constructor(game) {
    this.game = game;

    // 状态机
    this.phase = 'porridge'; // porridge → fadeout → report（终态，不推进下一章）
    this.phaseTime = 0;
    this.totalTime = 0;

    // 蒸汽粒子
    this.steam = [];
    // 点击热区（粥碗中心 + 半径）
    this.bowlCx = 640;
    this.bowlCy = 500;
    this.bowlRx = 140;
    this.bowlRy = 60;
    this.bowlHitRadius = 150;

    // 重新开始按钮
    this.restartBtn = { x: 550, y: 660, w: 180, h: 42 };
  }

  get isComplete() { return false; } // 终章，永远不推进

  onEnter() {
    this._initSteam();
    this.phase = 'porridge';
    this.phaseTime = 0;
    this.totalTime = 0;

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

  _initSteam() {
    // 生成 10~15 个蒸汽粒子
    const count = 10 + Math.floor(Math.random() * 6);
    this.steam = [];
    for (let i = 0; i < count; i++) {
      this.steam.push({
        x: this.bowlCx + (Math.random() - 0.5) * this.bowlRx * 1.2,
        y: this.bowlCy - 40 + (Math.random() - 0.5) * 30,
        speed: 25 + Math.random() * 35,
        drift: (Math.random() - 0.5) * 40,
        life: Math.random(),
        phase: Math.random() * Math.PI * 2,
        size: 5 + Math.random() * 8,
      });
    }
  }

  handleDown(point) {
    if (this.phase === 'porridge') {
      // 点击粥碗热区 → 进入 fadeout
      const dist = Math.hypot(point.x - this.bowlCx, point.y - this.bowlCy);
      if (dist <= this.bowlHitRadius) {
        this.phase = 'fadeout';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'report') {
      // 点击"重新开始"按钮
      const btn = this.restartBtn;
      if (point.x >= btn.x && point.x <= btn.x + btn.w &&
          point.y >= btn.y && point.y <= btn.y + btn.h) {
        this.game.progress.reset();
        setTimeout(() => {
          this.game.chapterManager.switchTo('ch01'); // 回到序曲，不跳过ch01
        }, 100);
      }
    }
  }

  update(dt) {
    this.totalTime += dt;
    this.phaseTime += dt;

    switch (this.phase) {
      case 'porridge':
        this._updateSteam(dt);
        break;
      case 'fadeout':
        // 白色遮罩 2s 过渡完成 → 进入 report
        if (this.phaseTime >= 2.0) {
          this.phase = 'report';
          this.phaseTime = 0;
        }
        break;
      case 'report':
        // 无更新逻辑，静态报告页
        break;
    }
  }

  _updateSteam(dt) {
    for (const s of this.steam) {
      s.life += dt * 0.35;
      if (s.life > 1) {
        // 重置到粥面
        s.life = 0;
        s.x = this.bowlCx + (Math.random() - 0.5) * this.bowlRx * 1.2;
        s.y = this.bowlCy - 40;
      }
      // 向上飘
      s.y -= s.speed * dt;
      // 水平漂移
      s.x += Math.sin(s.life * Math.PI * 2 + s.phase) * s.drift * dt;
    }
  }

  render(ctx) {
    switch (this.phase) {
      case 'porridge':
        this._renderPorridge(ctx);
        break;
      case 'fadeout':
        this._renderPorridge(ctx);
        this._renderFadeout(ctx);
        break;
      case 'report':
        this._renderReport(ctx);
        break;
    }
  }

  // ========================
  // 阶段1：porridge - 桌上热粥
  // ========================

  _renderPorridge(ctx) {
    const { width, height } = this.game;

    // 暖色调室内渐变背景（#3d2018 → #1a0e06）
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#3d2018');
    bgGrad.addColorStop(1, '#1a0e06');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 木桌（画面下方深棕色矩形条，约 1280×80）
    const tableY = height - 80;
    ctx.fillStyle = '#2a1508';
    ctx.fillRect(0, tableY, width, 80);

    // 木纹线条
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let y = tableY + 6; y < height - 4; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 桌面高光
    ctx.fillStyle = 'rgba(255,240,220,0.04)';
    ctx.fillRect(0, tableY, width, 3);

    // 碗（椭圆形，米白瓷碗 #f5ecd7）
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#f5ecd7';
    ctx.beginPath();
    ctx.ellipse(this.bowlCx, this.bowlCy, this.bowlRx, this.bowlRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 碗口边缘高光
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(this.bowlCx, this.bowlCy - 2, this.bowlRx - 4, this.bowlRy - 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 粥面（碗内稍小的椭圆，颜色 #e8d5b0）
    ctx.fillStyle = '#e8d5b0';
    ctx.beginPath();
    ctx.ellipse(this.bowlCx, this.bowlCy - 6, this.bowlRx - 16, this.bowlRy - 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 粥面纹理细节 — 轻微起伏
    ctx.strokeStyle = 'rgba(200,180,150,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sx = this.bowlCx + Math.cos(angle) * (this.bowlRx - 30);
      const sy = this.bowlCy - 6 + Math.sin(angle) * (this.bowlRy - 15);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 5, angle, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // 蒸汽粒子
    ctx.save();
    for (const s of this.steam) {
      // 透明度呼吸：根据 life 做正弦
      const alpha = Math.sin(s.life * Math.PI) * 0.25;
      if (alpha <= 0) continue;
      ctx.fillStyle = `rgba(240, 230, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (0.6 + 0.4 * Math.sin(s.life * Math.PI * 3)), 0, Math.PI * 2);
      ctx.fill();

      // 柔和发光
      const glowAlpha = alpha * 0.3;
      ctx.fillStyle = `rgba(240, 230, 210, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 提示文字
    drawPrompt(ctx, '桌上有一碗热粥……喝下去吧。', width / 2, 620, 0);
  }

  // ========================
  // 阶段2：fadeout - 白色遮罩过渡
  // ========================

  _renderFadeout(ctx) {
    const { width, height } = this.game;
    const alpha = Math.min(1, this.phaseTime / 2.0);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  // ========================
  // 阶段3：report - 记忆报告页
  // ========================

  _renderReport(ctx) {
    const { width, height } = this.game;

    // 底板：优先使用 report_base.png 素材，加载失败回退程序化纸张
    const baseImg = this.game.images.reportBase;
    if (baseImg && !baseImg._placeholder) {
      drawImageCover(ctx, baseImg, width, height);
    } else {
      // 纸张底色：米黄色做旧纸张 #f5ecd7
      ctx.fillStyle = '#f5ecd7';
      ctx.fillRect(0, 0, width, height);

      // 纸张纹理：散布 60 个微小噪点（#d4c4a0 色调，opacity 0.03~0.08）
      ctx.save();
      const seed = 42; // 固定种子，使噪点每次一致
      for (let i = 0; i < 60; i++) {
        const nx = ((i * 137 + seed * 73) % width);
        const ny = ((i * 251 + seed * 97) % height);
        const opacity = 0.03 + (i % 6) * 0.01;
        ctx.fillStyle = `rgba(212, 196, 160, ${opacity})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- 标题区 ---
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "记忆报告" 大字
    ctx.fillStyle = '#2a1a0c';
    ctx.font = 'bold 36px "PingFang SC", system-ui, sans-serif';
    ctx.fillText('记忆报告', width / 2, 60);

    // 分隔线
    ctx.strokeStyle = '#c4a878';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((width - 300) / 2, 92);
    ctx.lineTo((width + 300) / 2, 92);
    ctx.stroke();

    ctx.restore();

    // --- 10章列表 ---
    const progress = this.game.progress.load() || { chapter: 1, memory: 0, completed: [] };
    const completed = progress.completed || [];

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const listStartY = 130;
    const lineHeight = 48;

    for (let i = 0; i < CHAPTERS.length; i++) {
      const ch = CHAPTERS[i];
      const y = listStartY + i * lineHeight;
      const isCompleted = completed.includes(ch.id);

      // 当前行高亮（如果已完成或当前章节）
      if (isCompleted) {
        ctx.save();
        ctx.fillStyle = 'rgba(196, 168, 120, 0.2)';
        roundedRect(ctx, 180, y - lineHeight / 2 + 2, 860, lineHeight - 4, 6);
        ctx.fill();
        ctx.restore();
      }

      // 序号+标题 (x:200)
      ctx.save();
      if (isCompleted) {
        ctx.fillStyle = '#2a1a0c';
      } else {
        ctx.fillStyle = '#b8a488';
      }
      ctx.font = '500 20px "PingFang SC", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const label = `${String(ch.id).padStart(2, '0')} ${ch.title}`;
      ctx.fillText(label, 200, y);

      // 状态标记 (x:1000)
      ctx.textAlign = 'right';
      ctx.font = '500 20px "PingFang SC", system-ui, sans-serif';
      if (isCompleted) {
        ctx.fillStyle = '#2a1a0c';
        ctx.fillText('✅', 1000, y);
      } else {
        ctx.fillStyle = '#b8a488';
        ctx.fillText('◻', 1000, y);
      }
      ctx.restore();

      // 记忆值标签（左侧边距区域显示 memory 数值）
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      if (isCompleted) {
        ctx.fillStyle = '#8a7a60';
      } else {
        ctx.fillStyle = '#d0c0a0';
      }
      ctx.font = '14px "PingFang SC", system-ui, sans-serif';
      ctx.fillText(`${ch.memory}%`, 170, y);
      ctx.restore();
    }

    ctx.restore();

    // --- 记忆值进度条 (y:610) ---
    ctx.save();

    const memory = progress.memory || 0;
    const barX = 340;
    const barY = 610;
    const barW = 600;
    const barH = 20;
    const barR = 10;

    // 标签
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a1a0c';
    ctx.font = '500 18px "PingFang SC", system-ui, sans-serif';
    ctx.fillText('记忆恢复进度', 200, barY + barH / 2);

    // 进度条背景
    ctx.fillStyle = '#e0d0b0';
    roundedRect(ctx, barX, barY, barW, barH, barR);
    ctx.fill();

    // 进度条填充
    const fillW = Math.min(barW, (barW * memory) / 100);
    if (fillW > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      fillGrad.addColorStop(0, '#c4a060');
      fillGrad.addColorStop(1, '#8B6914');
      ctx.fillStyle = fillGrad;
      roundedRect(ctx, barX, barY, fillW, barH, barR);
      ctx.fill();
    }

    // 百分比数字（右侧）
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a1a0c';
    ctx.font = 'bold 22px "PingFang SC", system-ui, sans-serif';
    ctx.fillText(`${memory}%`, barX + barW + 15, barY + barH / 2);

    ctx.restore();

    // --- "重新开始" 按钮 (y:660) ---
    ctx.save();

    const btn = this.restartBtn;
    // 圆角矩形
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#4d3420';
    roundedRect(ctx, btn.x, btn.y, btn.w, btn.h, 21);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 按钮文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 18px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重新开始', btn.x + btn.w / 2, btn.y + btn.h / 2);

    ctx.restore();
  }
}
