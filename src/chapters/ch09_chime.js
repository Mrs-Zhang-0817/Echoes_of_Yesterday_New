import { drawPrompt } from '../utils/sceneUtils.js';

// 音符数据结构
const NOTES = [
  { id: 'do',  label: 'Do',  color: '#e8a840', targetX: 340, targetY: 360 },
  { id: 're',  label: 'Re',  color: '#d4746c', targetX: 440, targetY: 360 },
  { id: 'mi',  label: 'Mi',  color: '#a890c8', targetX: 540, targetY: 360 },
  { id: 'fa',  label: 'Fa',  color: '#7db8a0', targetX: 640, targetY: 360 },
  { id: 'sol', label: 'Sol', color: '#6898c8', targetX: 740, targetY: 360 },
];

const NOTE_W = 60;
const NOTE_H = 80;
const DW = 1280;
const DH = 720;

// 绘制单个音符碎片
function drawNote(ctx, x, y, w, h, color, label, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha !== undefined ? alpha : 1.0;

  // 椭圆头：音符上半部
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.35, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // 竖线：从椭圆底部向下
  ctx.beginPath();
  ctx.moveTo(x + w * 0.6, y + h * 0.6);
  ctx.lineTo(x + w * 0.6, y + h * 0.95);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 小旗标：从竖线顶部向右画小曲线
  ctx.beginPath();
  ctx.moveTo(x + w * 0.6, y + h * 0.6);
  ctx.quadraticCurveTo(x + w * 0.9, y + h * 0.5, x + w * 0.75, y + h * 0.68);
  ctx.quadraticCurveTo(x + w * 0.9, y + h * 0.75, x + w * 0.6, y + h * 0.78);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // label：底部居中写字母
  ctx.fillStyle = 'white';
  ctx.font = '14px system-ui, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, x + w / 2, y + h - 4);

  ctx.restore();
}

export class Chapter09 {
  constructor(game) {
    this.game = game;
    this._completed = false;
    this.state = 'playing'; // playing → complete
    this.completeAnimTime = 0;

    // 为每个音符初始化散落位置
    this.notes = NOTES.map(n => {
      const offsetX = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 70);
      const offsetY = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 70);
      let cx = n.targetX + offsetX;
      let cy = n.targetY + offsetY;
      // 确保不跑到画面外
      cx = Math.max(30, Math.min(1250 - NOTE_W, cx));
      cy = Math.max(50, Math.min(670 - NOTE_H, cy));
      return {
        ...n,
        currentX: cx,
        currentY: cy,
        placed: false,
      };
    });

    // 拖拽状态
    this.dragging = false;
    this.dragIndex = -1;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '记忆的风铃'; }
  get completeMessage() { return 'Do Re Mi Fa Sol……风铃响了。'; }

  onEnter() {
    this.game.input.setHandlers({
      down: p => this.handleDown(p),
      move: p => this.handleMove(p),
      up: p => this.handleUp(p),
      cancel: () => this.handleCancel(),
    });
  }

  onExit() {
    this.game.input.setHandlers();
  }

  handleDown(point) {
    if (this.state !== 'playing') return;

    // 从最上层（数组末尾）开始检测
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (n.placed) continue;
      const halfW = NOTE_W / 2;
      const halfH = NOTE_H / 2;
      if (
        point.x >= n.currentX &&
        point.x <= n.currentX + NOTE_W &&
        point.y >= n.currentY &&
        point.y <= n.currentY + NOTE_H
      ) {
        this.dragging = true;
        this.dragIndex = i;
        this.dragOffsetX = point.x - n.currentX;
        this.dragOffsetY = point.y - n.currentY;
        break;
      }
    }
  }

  handleMove(point) {
    if (!this.dragging || this.dragIndex < 0) return;
    const n = this.notes[this.dragIndex];
    n.currentX = point.x - this.dragOffsetX;
    n.currentY = point.y - this.dragOffsetY;
  }

  handleUp(point) {
    if (!this.dragging || this.dragIndex < 0) return;
    this.dragging = false;
    const n = this.notes[this.dragIndex];
    const dist = Math.hypot(n.currentX - n.targetX, n.currentY - n.targetY);
    if (dist < 50) {
      // 吸附到目标位置
      n.currentX = n.targetX;
      n.currentY = n.targetY;
      n.placed = true;
      // 震动反馈
      try { navigator.vibrate?.(15); } catch {}
    }
    this.dragIndex = -1;

    // 检查是否全部归位
    if (this.notes.every(no => no.placed)) {
      this.state = 'complete';
      this.completeAnimTime = 0;
      this._completed = true;
      this.game.progress.markChapterComplete(9, 85);
    }
  }

  handleCancel() {
    this.dragging = false;
    this.dragIndex = -1;
  }

  update(dt) {
    if (this.state === 'complete') {
      this.completeAnimTime += dt;
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, DW, DH);

    // 1. 优先使用真实阳台场景底图，加载失败回退程序化渐变
    const balcImg = this.game.images.ch9_balcony;
    if (balcImg) {
      const sc = Math.max(DW / (balcImg.width || 1280), DH / (balcImg.height || 720));
      const ox = (DW - (balcImg.width || 1280) * sc) / 2;
      const oy = (DH - (balcImg.height || 720) * sc) / 2;
      ctx.drawImage(balcImg, ox, oy, (balcImg.width || 1280) * sc, (balcImg.height || 720) * sc);
      // 暗色遮罩保证音符可读性
      ctx.fillStyle = 'rgba(12, 8, 6, 0.42)';
      ctx.fillRect(0, 0, DW, DH);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, DH);
      bgGrad.addColorStop(0, '#2a1810');
      bgGrad.addColorStop(0.5, '#3d2018');
      bgGrad.addColorStop(1, '#5a3028');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, DW, DH);
    }

    // 2. 风铃管（真实素材替代程序化窗框线条）
    const pipesImg = this.game.images.ch9_pipes;
    if (pipesImg) {
      const pw = pipesImg.width, ph = pipesImg.height;
      const scP = Math.min(DW / pw, 350 / ph); // 缩放到合适大小放在顶部
      const px = (DW - pw * scP) / 2;
      const py = 10;
      ctx.drawImage(pipesImg, px, py, pw * scP, ph * scP);
    } else {
      // 回退：程序化窗框
      ctx.save();
      ctx.strokeStyle = '#4a3020';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 30, 1200, 200);
      ctx.beginPath();
      ctx.moveTo(40, 130); ctx.lineTo(1240, 130);
      ctx.moveTo(660, 30); ctx.lineTo(660, 230);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 55); ctx.lineTo(1240, 55);
      ctx.moveTo(40, 80); ctx.lineTo(1240, 80);
      ctx.stroke();
      ctx.restore();
    }

    // 谱本符号使用正式绘制稿，完成时自然显现为记忆线索。
    const glyphsImg = this.game.images.ch9_notebook_glyphs;
    if (glyphsImg) {
      ctx.save();
      ctx.globalAlpha = this.state === 'complete' ? 0.9 : 0.55;
      ctx.drawImage(glyphsImg, DW - 310, DH - 245, 250, 200);
      ctx.restore();
    }

    // 3. 吊线：从窗框底部垂下 5 条细线，对应音符目标位置
    ctx.save();
    ctx.strokeStyle = '#6a5040';
    ctx.lineWidth = 1.2;
    for (const n of this.notes) {
      // 线从窗框底部（y=230）到音符目标位置的上端（targetY - NOTE_H/2）
      const topY = 230;
      const bottomY = n.targetY + NOTE_H * 0.35; // 连到椭圆头中心高度
      ctx.beginPath();
      ctx.moveTo(n.targetX + NOTE_W / 2, topY);
      ctx.lineTo(n.targetX + NOTE_W / 2, bottomY);
      ctx.stroke();
    }
    ctx.restore();

    // 4. 目标槽位虚线框
    for (const n of this.notes) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(200, 180, 160, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(n.targetX, n.targetY, NOTE_W, NOTE_H, 6);
      ctx.stroke();
      ctx.restore();
    }

    // 5. 已归位的音符（在目标位置）
    for (const n of this.notes) {
      if (n.placed) {
        // 完成后的风铃摆动动画
        if (this.state === 'complete' && this.completeAnimTime < 1.5) {
          const swing = Math.sin(this.completeAnimTime * 8) * 6 * (1 - this.completeAnimTime / 1.5);
          ctx.save();
          ctx.translate(n.currentX + NOTE_W / 2, n.currentY + NOTE_H * 0.35);
          ctx.rotate(swing * Math.PI / 180);
          drawNote(ctx, -NOTE_W / 2, -NOTE_H * 0.35, NOTE_W, NOTE_H, n.color, n.label);
          ctx.restore();
        } else {
          drawNote(ctx, n.currentX, n.currentY, NOTE_W, NOTE_H, n.color, n.label);
        }
      }
    }

    // 6. 未归位的音符（在散落位置或拖拽位置）
    for (let i = 0; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.placed || i === this.dragIndex) continue;
      drawNote(ctx, n.currentX, n.currentY, NOTE_W, NOTE_H, n.color, n.label);
    }

    // 7. 拖拽中的音符（最上层）
    if (this.dragging && this.dragIndex >= 0) {
      const n = this.notes[this.dragIndex];
      ctx.save();
      ctx.shadowColor = 'rgba(255, 220, 160, 0.4)';
      ctx.shadowBlur = 16;
      drawNote(ctx, n.currentX, n.currentY, NOTE_W, NOTE_H, n.color, n.label);
      ctx.restore();
    }

    // 8. 提示文字
    drawPrompt(ctx, '将音符拖拽到风铃上', DW / 2, DH - 40, 0);
  }
}
