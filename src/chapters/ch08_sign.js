// Ch8 签字——从独立 app 重写为 Chapter 接口

function avg(arr) { return arr.reduce((s, v) => v + s, 0) / arr.length; }

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// 笔画分类
function classifyStroke(pts) {
  if (pts.length < 3) return 'dot';
  const bb = bbox(pts);
  const diag = Math.hypot(bb.w, bb.h);
  if (diag < 18) return 'dot';

  const dx = pts[pts.length - 1].x - pts[0].x;
  const dy = pts[pts.length - 1].y - pts[0].y;
  const len = Math.hypot(dx, dy);
  if (len < 12) return 'dot';

  let dirChanges = 0, prevDir = null;
  const step = Math.max(1, Math.floor(pts.length / 8));
  for (let i = step; i < pts.length - step; i += step) {
    const cd = { x: pts[i].x - pts[i - step].x, y: pts[i].y - pts[i - step].y };
    const nd = Math.hypot(cd.x, cd.y);
    if (nd < 4) continue;
    const deg = Math.atan2(cd.y, cd.x) * 57.3;
    if (prevDir !== null && Math.abs(deg - prevDir) > 40) dirChanges++;
    prevDir = deg;
  }
  if (dirChanges >= 2) return 'fold';

  let angle = Math.atan2(dy, dx) * 57.3;
  if (angle < 0) angle += 180;
  const ratio = bb.w / (bb.h || 1);

  if (ratio > 2.2) return 'horizontal';
  if (ratio < 0.45) return 'vertical';
  if (angle < 30 || angle > 150) return 'horizontal';
  if (angle > 65 && angle < 115) return 'vertical';
  if (angle >= 30 && angle <= 65) return 'na';
  if (angle >= 115 && angle <= 150) return 'pie';
  return 'horizontal';
}

// 畸变规则：横↔竖、撇↔捺
function deformStroke(pts, type) {
  if (pts.length < 2) return { deformed: [...pts], type };
  const cx = avg(pts.map(p => p.x)), cy = avg(pts.map(p => p.y));
  switch (type) {
    case 'horizontal':
    case 'vertical':
      return {
        type: type === 'horizontal' ? 'vertical' : 'horizontal',
        deformed: pts.map(p => ({ x: cx + (p.y - cy), y: cy - (p.x - cx) })),
      };
    case 'pie':
      return { type: 'na', deformed: pts.map(p => ({ x: cx - (p.x - cx), y: p.y })) };
    case 'na':
      return { type: 'pie', deformed: pts.map(p => ({ x: cx - (p.x - cx), y: p.y })) };
    default:
      return { deformed: [...pts], type };
  }
}

export class Chapter08 {
  constructor(game) {
    this.game = game;
    this.DW = 1280; this.DH = 720;
    this.strokes = [];
    this.cur = [];
    this.wDown = false;
    this.wPid = null;
    this.attempts = 0;
    this.passed = false;
    this.hintShown = false;
    this.elapsed = 0;
    this.totalDT = 0;

    // 纸张纹理
    this.texture = [];
    for (let i = 0; i < 120; i++) {
      this.texture.push({ x: Math.random() * this.DW, y: Math.random() * this.DH, r: 0.3 + Math.random() * 2.8, a: 0.015 + Math.random() * 0.04 });
    }

    this.MAX_ATTEMPTS = 5;
    this.PASS_SCORE = 80;
    this.TIMEOUT_SEC = 10;
    this._completed = false;

    // 缩放参数
    const imgW = 1448, imgH = 1086;
    const sc = Math.max(this.DW / imgW, this.DH / imgH);
    const cropIx = 910, cropIy = 772, cropIw = 510, cropIh = 118;
    this.cropCx = cropIx * sc; this.cropCy = cropIy * sc + (this.DH - imgH * sc) / 2;
    this.cropW = cropIw * sc; this.cropH = cropIh * sc;
    this.zoomScale = Math.min(this.DW / this.cropW, this.DH / this.cropH) * 0.96;
    this.targetCx = 1240 * sc; this.targetCy = 806 * sc + (this.DH - imgH * sc) / 2;

    // 阶段
    this.phase = 'sign'; // sign → zoom → writing
    this.phaseTime = 0;
    this.zoomT = 0;
    this.zoomF = 0;
    this.waitT = 0;
    this.timeoutActive = false;
    this.timeoutFired = false;
  }

  get isComplete() { return this._completed; }
  get completeTitle() { return '辨认成功'; }
  get completeMessage() { return '李向阳'; }

  onEnter() {
    this.game.input.setHandlers({
      down: p => this.handleDown(p),
      move: p => this.handleMove(p),
      up: p => this.handleUp(p),
      cancel: () => this.handleCancel(),
    });
    this.phase = 'sign';
    this.phaseTime = 0;
  }

  onExit() {
    this.game.input.setHandlers();
    if (this.timeoutTimer) clearInterval(this.timeoutTimer);
  }

  handleDown(point) {
    if (this.phase === 'writing' && !this.passed) {
      this.wDown = true;
      this.wPid = point.pointerId;
      this.cur = [point];
      return;
    }
    // 检查弹层按钮（超时/提示/通过）
    this.checkButtonClick(point);
  }

  handleMove(point) {
    if (this.phase === 'writing' && this.wDown && point.pointerId === this.wPid) {
      const last = this.cur[this.cur.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
      this.cur.push(point);
    }
  }

  handleUp(point) {
    if (this.phase !== 'writing' || !this.wDown) return;
    this.wDown = false;
    this.wPid = null;
    if (this.cur.length >= 4) {
      const type = classifyStroke(this.cur);
      const { deformed } = deformStroke(this.cur, type);
      this.strokes.push({ raw: [...this.cur], deformed, type });
    }
    this.cur = [];
  }

  handleCancel() {
    this.wDown = false;
    this.wPid = null;
    this.cur = [];
  }

  checkButtonClick(point) {
    // "清除"按钮
    const cw = 90, ch = 36, cx = this.DW - cw - 20 - 124, cy = this.DH - ch - 16;
    if (point.x >= cx && point.x <= cx + cw && point.y >= cy && point.y <= cy + ch) {
      this.strokes = [];
      this.cur = [];
      return;
    }
    // "提交"按钮
    const bw = 110, bh = 40, bx = this.DW - bw - 20, by = this.DH - bh - 16;
    if (point.x >= bx && point.x <= bx + bw && point.y >= by && point.y <= by + bh) {
      this.submit();
      return;
    }
    // 弹层按钮
    if (this.timeoutFired) {
      this.timeoutFired = false;
      this.elapsed = 0;
      this.totalDT = 0;
      try { navigator.vibrate?.(10); } catch {}
      return;
    }
    if (this.showHint) {
      this.showHint = false;
      try { navigator.vibrate?.(10); } catch {}
      return;
    }
    if (this._completed) {
      this.resetAll();
      return;
    }
  }

  submit() {
    if (this.passed || this.strokes.length < 5) return;
    if (this.matchSignature()) {
      this.passed = true;
      this._completed = true;
      this.game.progress.markChapterComplete(8, 72);
      try { navigator.vibrate?.(15); } catch {}
      return;
    }
    this.attempts++;
    if (this.attempts >= this.MAX_ATTEMPTS && !this.hintShown) {
      this.hintShown = true;
      this.showHint = true;
    }
  }

  matchSignature() {
    const all = this.strokes.map(s => s.raw);
    if (all.length < 6) return false;
    const zones = [[], []];
    for (const pts of all) {
      zones[Math.min(1, Math.floor((avg(pts.map(p => p.x)) / this.DW) * 2))].push(pts);
    }
    if (zones[0].length < 3 || zones[1].length < 3) return false;
    let sc = 0;
    let z0h = false, z0v = false, z0f = false;
    for (const pts of zones[0]) {
      const t = classifyStroke(pts);
      if (t === 'horizontal') z0h = true;
      if (t === 'vertical') z0v = true;
      if (t === 'fold') z0f = true;
    }
    sc += Math.min(20, zones[0].length * 4);
    if (z0h && z0v && z0f) sc += 18;
    else if (z0h && z0v) sc += 12;

    let z1h = false, z1v = false;
    for (const pts of zones[1]) {
      const t = classifyStroke(pts);
      if (t === 'horizontal') z1h = true;
      if (t === 'vertical') z1v = true;
    }
    sc += Math.min(20, zones[1].length * 4);
    if (z1h && z1v) sc += 18;
    else if (z1h || z1v) sc += 8;
    if (z0h && z0v && z1h && z1v) sc += 10;
    sc += Math.min(8, Math.max(0, all.length - 6));
    return sc >= this.PASS_SCORE;
  }

  resetAll() {
    this.strokes = [];
    this.cur = [];
    this.attempts = 0;
    this.passed = false;
    this.hintShown = false;
    this.elapsed = 0;
    this.totalDT = 0;
    this.timeoutActive = false;
    this.timeoutFired = false;
    this.showHint = false;
    this._completed = false;
    this.phase = 'sign';
    this.phaseTime = 0;
    this.zoomT = 0;
    this.zoomF = 0;
    this.waitT = 0;
  }

  update(dt) {
    this.totalDT += dt;

    // phase transitions
    if (this.phase === 'sign') {
      this.phaseTime += dt;
      if (this.phaseTime >= 2.5) {
        this.phase = 'zoom';
        this.phaseTime = 0;
      }
    } else if (this.phase === 'zoom') {
      this.phaseTime += dt;
      const DUR = 1.6;
      const raw = Math.min(1, this.phaseTime / DUR);
      this.zoomT = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      this.zoomF = raw > 0.6 ? Math.min(1, 1 - Math.pow(1 - (raw - 0.6) / 0.4, 2)) : 0;
      if (raw >= 1) {
        this.phase = 'writing';
        this.elapsed = 0;
        this.timeoutActive = true;
        this.timeoutFired = false;
      }
    } else if (this.phase === 'writing' && this.timeoutActive && !this.passed) {
      this.totalDT += dt;
      // 用 totalDT 的方式计时（简化：每10次 update 约1秒）
      // 改用 dt 累加
      const prevElapsed = this.elapsed;
      this.elapsed += dt;
      const newSec = Math.floor(this.elapsed);
      const prevSec = Math.floor(prevElapsed);
      if (this.elapsed >= this.TIMEOUT_SEC && !this.timeoutFired) {
        this.timeoutFired = true;
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.DW, this.DH);

    if (this.phase === 'sign') {
      this.renderSign(ctx);
    } else if (this.phase === 'zoom') {
      this.renderZoom(ctx);
    } else {
      this.renderPaper(ctx);
      this.renderWriting(ctx);

      // 按钮
      this.drawButton(ctx, this.DW - 90 - 20 - 124, this.DH - 36 - 16, 90, 36, '清除', '#b89a72');
      this.drawButton(ctx, this.DW - 110 - 20, this.DH - 40 - 16, 110, 40, '提 交', '#f5e6c8', '#4d3420');
    }

    // 弹层
    if (this.timeoutFired) this.renderOverlay(ctx, '时间过了许久', '连笔写——手记得的，疾病夺不走', '再试试');
    if (this.showHint) this.renderOverlay(ctx, '笔迹畸变规则', '横↔竖、撇↔捺，试试连笔写', '明白了');
    if (this._completed) this.renderOverlay(ctx, '辨认成功', '——\n李向阳', '再写一次', true);
  }

  renderSign(ctx) {
    // 优先使用走廊场景底图作为背景
    const bg = this.game.images.ch8_corridor;
    if (bg) {
      const iw = 1280, ih = 720;
      const sc = Math.max(this.DW / (bg.width || iw), this.DH / (bg.height || ih));
      const ox = (this.DW - (bg.width || iw) * sc) / 2;
      const oy = (this.DH - (bg.height || ih) * sc) / 2;
      ctx.drawImage(bg, ox, oy, (bg.width || iw) * sc, (bg.height || ih) * sc);
      // 暗色遮罩保证表单可读
      ctx.fillStyle = 'rgba(10, 6, 4, 0.45)';
      ctx.fillRect(0, 0, this.DW, this.DH);
    }

    const img = this.game.images.sign;
    if (!img) return;
    const iw = 1448, ih = 1086;
    const sc = Math.max(this.DW / iw, this.DH / ih);
    const ox = (this.DW - iw * sc) / 2, oy = (this.DH - ih * sc) / 2;
    ctx.drawImage(img, ox, oy, iw * sc, ih * sc);
  }

  renderZoom(ctx) {
    const img = this.game.images.sign;
    if (!img) return;
    const iw = 1448, ih = 1086;
    const sc = Math.max(this.DW / iw, this.DH / ih);
    const t = this.zoomT;
    const s = 1 + (this.zoomScale - 1) * t;
    const camX = this.DW / 2 + (this.targetCx - this.DW / 2) * t;
    const camY = this.DH / 2 + (this.targetCy - this.DH / 2) * t;
    let tx = this.DW / 2 - camX * s, ty = this.DH / 2 - camY * s;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(s, s);
    const ox = (this.DW - iw * sc) / 2, oy = (this.DH - ih * sc) / 2;
    ctx.drawImage(img, ox, oy, iw * sc, ih * sc);
    ctx.restore();
  }

  renderPaper(ctx) {
    // 优先使用真实纸张纹理底图
    const paper = this.game.images.paperBase;
    const noise = this.game.images.paperNoise;
    if (paper) {
      ctx.drawImage(paper, 0, 0, this.DW, this.DH);
    } else {
      const g = ctx.createLinearGradient(0, 0, this.DW * 0.4, this.DH);
      g.addColorStop(0, '#fcf5e6'); g.addColorStop(0.4, '#f7ecd0');
      g.addColorStop(0.7, '#f2e2bc'); g.addColorStop(1, '#e8d4a0');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.DW, this.DH);
    }
    // 纸张噪点叠加
    if (noise) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.drawImage(noise, 0, 0, this.DW, this.DH);
      ctx.restore();
    }

    for (const d of this.texture) {
      ctx.fillStyle = `rgba(139,105,20,${d.a})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  renderWriting(ctx) {
    for (const s of this.strokes) this.drawInk(ctx, s.deformed, false);
    if (this.cur.length >= 2) this.drawInk(ctx, this.cur, true);
  }

  drawInk(ctx, pts, ghost) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 };
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }
    ctx.strokeStyle = ghost ? 'rgba(30,16,8,0.18)' : '#1a0e06';
    ctx.lineWidth = ghost ? 2 : 2.6;
    ctx.stroke();
    ctx.restore();
  }

  drawButton(ctx, x, y, w, h, text, bgColor, textColor) {
    ctx.save();
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.fillStyle = textColor || '#1f1409';
    ctx.font = '600 16px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.restore();
  }

  renderOverlay(ctx, title, message, btnText, isPass) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.DW, this.DH);

    const cardW = 380, cardH = 280;
    const cx = (this.DW - cardW) / 2, cy = (this.DH - cardH) / 2;

    ctx.beginPath();
    const r = 16;
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.quadraticCurveTo(cx + cardW, cy, cx + cardW, cy + r);
    ctx.lineTo(cx + cardW, cy + cardH - r);
    ctx.quadraticCurveTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.quadraticCurveTo(cx, cy + cardH, cx, cy + cardH - r);
    ctx.lineTo(cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
    grad.addColorStop(0, '#fcf5e6');
    grad.addColorStop(1, '#f0deb4');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = isPass ? '#2d6e2d' : '#2a1a0c';
    ctx.font = isPass ? 'bold 24px "PingFang SC", system-ui, sans-serif' : 'bold 22px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, this.DW / 2, cy + 55);

    ctx.fillStyle = '#4d3420';
    ctx.font = '17px "PingFang SC", system-ui, sans-serif';
    const lines = message.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, this.DW / 2, cy + 110 + i * 28);
    });

    // 按钮
    const btnW = 180, btnH = 44, bx = (this.DW - btnW) / 2, by = cy + cardH - 50 - btnH / 2;
    ctx.beginPath();
    const br = 8;
    ctx.moveTo(bx + br, by - btnH / 2);
    ctx.lineTo(bx + btnW - br, by - btnH / 2);
    ctx.quadraticCurveTo(bx + btnW, by - btnH / 2, bx + btnW, by - btnH / 2 + br);
    ctx.lineTo(bx + btnW, by + btnH / 2 - br);
    ctx.quadraticCurveTo(bx + btnW, by + btnH / 2, bx + btnW - br, by + btnH / 2);
    ctx.lineTo(bx + br, by + btnH / 2);
    ctx.quadraticCurveTo(bx, by + btnH / 2, bx, by + btnH / 2 - br);
    ctx.lineTo(bx, by - btnH / 2 + br);
    ctx.quadraticCurveTo(bx, by - btnH / 2, bx + br, by - btnH / 2);
    ctx.closePath();
    ctx.fillStyle = '#4d3420';
    ctx.fill();
    ctx.fillStyle = '#fcf5e6';
    ctx.font = '600 16px "PingFang SC", system-ui, sans-serif';
    ctx.fillText(btnText, bx + btnW / 2, by);

    ctx.restore();
  }
}
