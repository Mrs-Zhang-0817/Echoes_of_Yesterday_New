import { DEFAULT_PUZZLE_LAYOUT, createPuzzlePieces, ejectPiecesBlockingTarget, getTopmostPieceAt, pathPassesNearTarget, snapPieceToTarget } from '../utils/puzzleLayout.js';
import { drawPrompt, roundedRect } from '../utils/sceneUtils.js';

export class Chapter02 {
  constructor(game) {
    this.game = game;
    const img = game.images.puzzle;
    this.pieces = createPuzzlePieces(img.width, img.height);
    this.draggedPiece = null;
    this.hoveredPiece = null;
    this.activePointerId = null;
    this.offset = { x: 0, y: 0 };
    this.particles = [];
    this.phase = 'playing';
    this.phaseTime = 0;
    this._completed = false;
    this.dragThreshold = 5;
    this.hasMoved = false;
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '记忆恢复了一些……'; }
  get completeMessage() { return '但那抹色彩，终究会慢慢褪去……'; }

  onEnter() {
    this.game.input.setHandlers({
      down: point => this.handleDown(point),
      move: point => this.handleMove(point),
      up: point => this.handleUp(point),
      cancel: () => this.handleCancel(),
      leave: () => { this.hoveredPiece = null; },
    });
  }

  onExit() {
    this.game.input.setHandlers();
  }

  handleDown(point) {
    if (this.phase !== 'playing' || this.draggedPiece) return;
    const piece = getTopmostPieceAt(this.pieces, point.x, point.y);
    if (!piece) return;
    this.draggedPiece = piece;
    this.activePointerId = point.pointerId;
    this.dragStartX = point.x;
    this.dragStartY = point.y;
    this.hasMoved = false;
    piece.dragging = true;
    this.offset = { x: point.x - piece.x, y: point.y - piece.y };
    this.pieces.splice(this.pieces.indexOf(piece), 1);
    this.pieces.push(piece);
  }

  handleMove(point) {
    if (!this.draggedPiece) {
      this.hoveredPiece = getTopmostPieceAt(this.pieces, point.x, point.y);
      return;
    }
    if (point.pointerId !== this.activePointerId) return;

    if (!this.hasMoved) {
      const dx = point.x - this.dragStartX;
      const dy = point.y - this.dragStartY;
      if (Math.hypot(dx, dy) < this.dragThreshold) return;
      this.hasMoved = true;
    }

    const { safeMargin } = DEFAULT_PUZZLE_LAYOUT;
    const piece = this.draggedPiece;
    piece.x = Math.max(safeMargin,
      Math.min(this.game.width - piece.width - safeMargin, point.x - this.offset.x));
    piece.y = Math.max(safeMargin,
      Math.min(this.game.height - piece.height - safeMargin, point.y - this.offset.y));
  }

  handleUp(point) {
    if (this.draggedPiece && point.pointerId === this.activePointerId) {
      const piece = this.draggedPiece;
      piece.dragging = false;
      this.draggedPiece = null;
      this.activePointerId = null;

      if (this.hasMoved && snapPieceToTarget(piece, DEFAULT_PUZZLE_LAYOUT.snapRadius)) {
        this.finishPlacement(piece);
      }
      this.hasMoved = false;
    }
  }

  handleCancel() {
    if (this.draggedPiece) {
      this.draggedPiece.dragging = false;
      this.draggedPiece = null;
      this.activePointerId = null;
      this.hoveredPiece = null;
      this.hasMoved = false;
    }
  }

  finishPlacement(piece) {
    this.draggedPiece = null;
    this.activePointerId = null;
    this.hoveredPiece = null;
    try { navigator.vibrate?.(15); } catch {}
    this.spawnParticles(piece.x + piece.width / 2, piece.y + piece.height / 2);
    for (const ejectedPiece of ejectPiecesBlockingTarget(this.pieces, piece)) {
      this.spawnParticles(ejectedPiece.x + ejectedPiece.width / 2, ejectedPiece.y + ejectedPiece.height / 2, '#f1b09a', 8);
    }
    if (this.pieces.every(c => c.placed)) {
      this.phase = 'completeHold';
      this.phaseTime = 0;
    }
  }

  spawnParticles(x, y, color = '#ffd37a', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 65;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.45 + Math.random() * 0.25, color });
    }
  }

  update(dt) {
    for (const piece of this.pieces) {
      const target = (piece === this.draggedPiece || piece === this.hoveredPiece) ? 1 : 0;
      piece.highlight += (target - piece.highlight) * Math.min(1, dt * 12);
    }
    for (const piece of this.pieces) {
      if (!piece.ejection) continue;
      piece.ejection.elapsed += dt;
      const t = Math.min(1, piece.ejection.elapsed / piece.ejection.duration);
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      piece.x = piece.ejection.fromX + (piece.ejection.toX - piece.ejection.fromX) * eased;
      piece.y = piece.ejection.fromY + (piece.ejection.toY - piece.ejection.fromY) * eased;
      if (t >= 1) {
        piece.x = piece.ejection.toX;
        piece.y = piece.ejection.toY;
        piece.ejection = null;
        piece.ejecting = false;
      }
    }
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
      return p.life > 0;
    });
    if (this.phase === 'completeHold') {
      this.phaseTime += dt;
      if (this.phaseTime >= 3) {
        this.phase = 'fadeMemory';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'fadeMemory') {
      this.phaseTime += dt;
      if (this.phaseTime >= 2 && !this._completed) {
        this._completed = true;
        this.game.progress.markChapterComplete(2, 15);
      }
    }
  }

  render(ctx) {
    const { width, height } = this.game;
    ctx.save();
    ctx.fillStyle = '#100c09';
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width / 2, height / 2, 30, width / 2, height / 2, 650);
    glow.addColorStop(0, 'rgba(139, 91, 43, 0.55)');
    glow.addColorStop(1, 'rgba(16, 12, 9, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    this.drawGrid(ctx);
    const fading = this.phase === 'fadeMemory' ? Math.min(1, this.phaseTime / 2) : 0;
    for (const piece of this.pieces) {
      if (piece.placed) {
        this.drawPiece(ctx, piece, 1 - fading * 0.7);
      } else {
        ctx.save();
        if (piece.dragging || piece.highlight > 0.05) {
          ctx.shadowColor = piece.dragging ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 211, 122, 0.75)';
          ctx.shadowBlur = piece.dragging ? 9 : 18 * piece.highlight;
          ctx.shadowOffsetX = piece.dragging ? 4 : 0;
          ctx.shadowOffsetY = piece.dragging ? 5 : 0;
        }
        this.drawPiece(ctx, piece, piece.dragging ? 0.7 : 0.25 + piece.highlight * 0.55);
        ctx.restore();
      }
    }
    this.drawParticles(ctx);

    const panel = DEFAULT_PUZZLE_LAYOUT.panel;
    if (this.phase === 'completeHold') drawPrompt(ctx, '记忆恢复了一些……', width / 2, 55, 0.6);
    else if (this.phase === 'fadeMemory') drawPrompt(ctx, '但那抹色彩，终究会慢慢褪去……', width / 2, 55, 0.35);
    else drawPrompt(ctx, '将拼图碎片拖到正确的位置', width / 2, panel.y + panel.height + 37, 0);
  }

  drawPiece(ctx, piece, saturation) {
    const image = this.game.images.puzzle;
    // 使用离屏 Canvas 预生成的灰度图来替代 ctx.filter
    if (saturation < 0.5) {
      if (!piece._grayCache) {
        // 首次渲染时创建该碎片的灰度版本
        const grayCanvas = document.createElement('canvas');
        grayCanvas.width = piece.sourceW;
        grayCanvas.height = piece.sourceH;
        const gctx = grayCanvas.getContext('2d');
        gctx.drawImage(image, piece.sourceX, piece.sourceY, piece.sourceW, piece.sourceH, 0, 0, piece.sourceW, piece.sourceH);
        const imageData = gctx.getImageData(0, 0, grayCanvas.width, grayCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = data[i + 1] = data[i + 2] = avg;
        }
        gctx.putImageData(imageData, 0, 0);
        piece._grayCache = grayCanvas;
      }
      // 混合：灰度 → 彩色
      ctx.globalAlpha = saturation * 2; // 0.25 → 0.5, 0.5 → 1.0
      ctx.drawImage(image, piece.sourceX, piece.sourceY, piece.sourceW, piece.sourceH, piece.x, piece.y, piece.width, piece.height);
      ctx.globalAlpha = 1;
      if (saturation * 2 < 1) {
        ctx.globalAlpha = 1 - saturation * 2;
        ctx.drawImage(piece._grayCache, 0, 0, piece.sourceW, piece.sourceH, piece.x, piece.y, piece.width, piece.height);
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.drawImage(image, piece.sourceX, piece.sourceY, piece.sourceW, piece.sourceH, piece.x, piece.y, piece.width, piece.height);
    }
  }

  drawGrid(ctx) {
    const { panel } = DEFAULT_PUZZLE_LAYOUT;
    ctx.save();
    roundedRect(ctx, panel.x - 12, panel.y - 12, panel.width + 24, panel.height + 24, 16);
    ctx.fillStyle = 'rgba(255, 242, 210, 0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 244, 219, 0.55)';
    ctx.setLineDash([10, 9]);
    ctx.lineWidth = 2;
    for (let c = 0; c <= 3; c++) {
      const x = panel.x + c * panel.width / 3;
      ctx.beginPath(); ctx.moveTo(x, panel.y); ctx.lineTo(x, panel.y + panel.height); ctx.stroke();
    }
    for (let r = 0; r <= 3; r++) {
      const y = panel.y + r * panel.height / 3;
      ctx.beginPath(); ctx.moveTo(panel.x, y); ctx.lineTo(panel.x + panel.width, y); ctx.stroke();
    }
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
