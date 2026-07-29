import { drawPrompt, roundedRect } from './sceneUtils.js';
import { DEFAULT_PUZZLE_LAYOUT, createPuzzlePieces, ejectPiecesBlockingTarget, getTopmostPieceAt, pathPassesNearTarget, snapPieceToTarget } from './puzzleLayout.js';

export class ScenePuzzle {
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
    this.completionLogged = false;
    // 拖拽阈值：按下后移动超过此距离才算拖拽，防止误触
    this.dragThreshold = 5;
    this.hasMoved = false;
  }

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
    // 置于最上层
    this.pieces.splice(this.pieces.indexOf(piece), 1);
    this.pieces.push(piece);
  }

  handleMove(point) {
    if (!this.draggedPiece) {
      // hover 高亮
      this.hoveredPiece = getTopmostPieceAt(this.pieces, point.x, point.y);
      return;
    }
    if (point.pointerId !== this.activePointerId) return;

    // 拖拽阈值检测
    if (!this.hasMoved) {
      const dx = point.x - this.dragStartX;
      const dy = point.y - this.dragStartY;
      if (Math.hypot(dx, dy) < this.dragThreshold) return;
      this.hasMoved = true;
    }

    const { safeMargin } = DEFAULT_PUZZLE_LAYOUT;
    const piece = this.draggedPiece;
    const previousX = piece.x;
    const previousY = piece.y;
    piece.x = Math.max(safeMargin,
      Math.min(this.game.width - piece.width - safeMargin, point.x - this.offset.x));
    piece.y = Math.max(safeMargin,
      Math.min(this.game.height - piece.height - safeMargin, point.y - this.offset.y));

    if (DEFAULT_PUZZLE_LAYOUT.mobileInstantSnap && point.pointerType === 'touch' &&
      pathPassesNearTarget(previousX, previousY, piece.x, piece.y, piece.targetX, piece.targetY, DEFAULT_PUZZLE_LAYOUT.touchSnapRadius)) {
      piece.x = piece.targetX;
      piece.y = piece.targetY;
      piece.width = piece.targetWidth;
      piece.height = piece.targetHeight;
      piece.placed = true;
      piece.dragging = false;
      this.hasMoved = false;
      this.finishPlacement(piece);
    }
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
    navigator.vibrate?.(15);
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
    // 高亮动画
    for (const piece of this.pieces) {
      const target = (piece === this.draggedPiece || piece === this.hoveredPiece) ? 1 : 0;
      piece.highlight += (target - piece.highlight) * Math.min(1, dt * 12);
    }
    // 弹飞动画
    for (const piece of this.pieces) {
      if (!piece.ejection) continue;
      piece.ejection.elapsed += dt;
      const t = Math.min(1, piece.ejection.elapsed / piece.ejection.duration);
      // ease-out-back
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
    // 粒子
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
      return p.life > 0;
    });
    // 完成阶段
    if (this.phase === 'completeHold') {
      this.phaseTime += dt;
      if (this.phaseTime >= 3) {
        this.phase = 'fadeMemory';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'fadeMemory') {
      this.phaseTime += dt;
      if (this.phaseTime >= 2 && !this.completionLogged) {
        this.completionLogged = true;
        this.game.onPuzzleComplete?.();
      }
    }
  }

  drawPiece(ctx, piece, saturation) {
    const image = this.game.images.puzzle;
    ctx.filter = `saturate(${saturation}) brightness(${1 + saturation * 0.18})`;
    ctx.drawImage(
      image,
      piece.sourceX, piece.sourceY, piece.sourceW, piece.sourceH,
      piece.x, piece.y, piece.width, piece.height,
    );
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
    ctx.filter = 'none';
    this.drawParticles(ctx);

    const panel = DEFAULT_PUZZLE_LAYOUT.panel;
    if (this.phase === 'completeHold') drawPrompt(ctx, '记忆恢复了一些……', width / 2, 55, 0.6);
    else if (this.phase === 'fadeMemory') drawPrompt(ctx, '但那抹色彩，终究会慢慢褪去……', width / 2, 55, 0.35);
    else drawPrompt(ctx, '将拼图碎片拖到正确的位置', width / 2, panel.y + panel.height + 37, 0);
  }
}
