// DanmakuEngine — 独立弹幕引擎
// 纯 Canvas 2D 文字漂移动画，对象池复用，零外部依赖
//
// 用法：
//   const engine = new DanmakuEngine(messages, options);
//   engine.start();
//   engine.update(dt);
//   engine.render(ctx);

export const DEFAULT_MESSAGES = [
  '你不是一个人。',
  '总有人在牵挂着你。',
  '黑暗只是暂时的。',
  '慢慢来，不着急。',
  '我们都在这。',
  '微光就在前方。',
  '深呼吸，放轻松。',
  '有人在前方为你留了一盏灯。',
  '你被爱着。',
  '别怕，往前走吧。',
  '记得那年的风铃声吗？',
  '有人在等你回家。',
  '月光会照进来的。',
  '你走过的路，都算数。',
  '每一段记忆都是珍贵的。',
  '总有一束光为你而来。',
  '黑夜再长，也有尽头。',
  '他们都在为你加油。',
  '你从来都不是孤身一人。',
  '再试一次，你可以的。',
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 柔和暖色系：琥珀 / 奶油 / 浅金
const WARM_COLORS = [
  [240, 192, 64],   // 金色
  [212, 184, 150],  // 暖奶油
  [255, 220, 140],  // 浅金
  [220, 170, 100],  // 琥珀
  [200, 160, 100],  // 古铜金
];

function pickColor() {
  return WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)];
}

export class DanmakuEngine {
  /**
   * @param {string[]} messages - 弹幕文案数组
   * @param {object} [opts]
   * @param {number} [opts.poolSize=25] - 对象池容量
   * @param {number} [opts.maxActive=8] - 同时最多活跃弹幕数
   * @param {[number,number]} [opts.speedRange=[40,80]] - 漂移速度范围 px/s
   * @param {[number,number]} [opts.spawnInterval=[1.5,3.5]] - 生成间隔范围 s
   * @param {[number,number]} [opts.fontSizeRange=[16,24]] - 字号范围 px
   * @param {number} [opts.screenWidth=1280]
   * @param {number} [opts.screenHeight=720]
   * @param {number} [opts.marginTop=100]
   * @param {number} [opts.marginBottom=160]
   */
  constructor(messages, opts = {}) {
    this.messages = messages && messages.length > 0 ? messages : DEFAULT_MESSAGES;

    // 配置
    this.poolSize = opts.poolSize || 25;
    this.maxActive = opts.maxActive || 8;
    this.speedMin = (opts.speedRange && opts.speedRange[0]) || 40;
    this.speedMax = (opts.speedRange && opts.speedRange[1]) || 80;
    this.spawnMin = (opts.spawnInterval && opts.spawnInterval[0]) || 1.5;
    this.spawnMax = (opts.spawnInterval && opts.spawnInterval[1]) || 3.5;
    this.fontMin = (opts.fontSizeRange && opts.fontSizeRange[0]) || 16;
    this.fontMax = (opts.fontSizeRange && opts.fontSizeRange[1]) || 24;
    this.screenWidth = opts.screenWidth || 1280;
    this.screenHeight = opts.screenHeight || 720;
    this.marginTop = opts.marginTop || 100;
    this.marginBottom = opts.marginBottom || 160;

    // 进入/退出时长
    this.enterDuration = 0.6;
    this.exitDuration = 0.8;

    // 行轨道冷却
    this._rowCooldown = 1.2;
    this._rowCount = 6;
    this._rowTimers = new Array(this._rowCount).fill(this._rowCooldown);

    // 状态
    this._running = false;
    this._spawnTimer = 0;
    this._gameTime = 0;
    this._intensity = 1; // 0~1，外部控制生成频率

    // 对象池
    this._pool = [];
    for (let i = 0; i < this.poolSize; i++) {
      this._pool.push(this._createDeadItem());
    }
  }

  // ---- 公有 API ----

  start() {
    this._running = true;
    this._spawnTimer = 0;
    this._gameTime = 0;
  }

  pause() {
    this._running = false;
  }

  resume() {
    this._running = true;
  }

  stop() {
    this._running = false;
    this._gameTime = 0;
    this._spawnTimer = 0;
    // 回收所有活跃弹幕
    for (const item of this._pool) {
      item.state = 'dead';
      item.alpha = 0;
    }
    this._rowTimers.fill(this._rowCooldown);
  }

  /** 设置生成强度 0-1 */
  setIntensity(v) {
    this._intensity = Math.max(0, Math.min(1, v));
  }

  get intensity() {
    return this._intensity;
  }

  get activeCount() {
    let n = 0;
    for (const item of this._pool) {
      if (item.state !== 'dead') n++;
    }
    return n;
  }

  get isRunning() {
    return this._running;
  }

  // ---- 每帧更新 ----

  update(dt) {
    if (!this._running) return;
    this._gameTime += dt;

    // 更新行冷却
    for (let r = 0; r < this._rowCount; r++) {
      this._rowTimers[r] += dt;
    }

    // 更新每条弹幕
    for (const item of this._pool) {
      if (item.state === 'dead') continue;

      item.life += dt;
      item.x -= item.speed * dt;

      // 垂直微摆
      item._swayPhase += dt * item._swaySpeed;
      item._sway = Math.sin(item._swayPhase) * item._swayAmp;

      switch (item.state) {
        case 'entering':
          item.enterTimer += dt;
          if (item.enterTimer >= this.enterDuration) {
            item.state = 'floating';
            item.alpha = 1;
          } else {
            item.alpha = this._easeIn(item.enterTimer / this.enterDuration);
          }
          break;

        case 'floating':
          // 到达左边缘 → 开始退出
          if (item.x < -item._textWidth) {
            item.state = 'exiting';
            item.exitTimer = 0;
          }
          break;

        case 'exiting':
          item.exitTimer += dt;
          if (item.exitTimer >= this.exitDuration) {
            item.state = 'dead';
            item.alpha = 0;
            // 释放行冷却
            this._rowTimers[item._row] = 0;
          } else {
            item.alpha = 1 - this._easeIn(item.exitTimer / this.exitDuration);
          }
          break;
      }

      // 强制回收：活太久或漂出太远
      if (item.life > 20 || item.x < -this.screenWidth) {
        item.state = 'dead';
        item.alpha = 0;
      }
    }

    // 生成新弹幕
    if (this._intensity <= 0) return;
    this._spawnTimer += dt;
    const interval = this.spawnMin + (this.spawnMax - this.spawnMin) * (1 - this._intensity * 0.7);
    while (this._spawnTimer >= interval) {
      this._spawnTimer -= interval + rand(-0.3, 0.3); // 加抖动
      this._trySpawn();
    }
  }

  // ---- 每帧渲染 ----

  render(ctx) {
    ctx.save();
    for (const item of this._pool) {
      if (item.state === 'dead' || item.alpha <= 0.005) continue;

      const [r, g, b] = item._color;
      const a = item.alpha;

      // 主体文字
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.font = `${item.fontSize}px "PingFang SC", system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const drawY = item.y + (item._sway || 0);
      ctx.fillText(item.text, item.x, drawY);

      // 微光晕（shadow blur 模拟）
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.25})`;
      ctx.fillText(item.text, item.x - 1, drawY);
    }
    ctx.restore();
  }

  // ---- 内部 ----

  _createDeadItem() {
    return {
      text: '',
      x: 0,
      y: 0,
      speed: 0,
      alpha: 0,
      life: 0,
      fontSize: 16,
      state: 'dead',
      enterTimer: 0,
      exitTimer: 0,
      _color: [220, 190, 140],
      _textWidth: 0,
      _row: 0,
      _sway: 0,
      _swayPhase: Math.random() * Math.PI * 2,
      _swaySpeed: rand(0.8, 2.0),
      _swayAmp: rand(1, 4),
    };
  }

  _trySpawn() {
    if (this.activeCount >= this.maxActive) return;

    // 找空闲池项
    let item = null;
    for (const p of this._pool) {
      if (p.state === 'dead') {
        item = p;
        break;
      }
    }
    if (!item) {
      // 池满：回收最左边那条
      let oldest = null;
      for (const p of this._pool) {
        if (p.state === 'dead') continue;
        if (!oldest || p.x < oldest.x) oldest = p;
      }
      if (oldest) {
        oldest.state = 'dead';
        item = oldest;
      } else {
        return;
      }
    }

    // 选行（优先冷却完毕的）
    const availableRows = [];
    for (let r = 0; r < this._rowCount; r++) {
      if (this._rowTimers[r] >= this._rowCooldown) {
        availableRows.push(r);
      }
    }
    let row;
    if (availableRows.length > 0) {
      row = pickRandom(availableRows);
    } else {
      // 全部冷却中，选冷却时间最长的
      let maxCd = -1;
      for (let r = 0; r < this._rowCount; r++) {
        if (this._rowTimers[r] > maxCd) {
          maxCd = this._rowTimers[r];
          row = r;
        }
      }
    }

    // 计算 Y
    const usableHeight = this.screenHeight - this.marginTop - this.marginBottom;
    const rowHeight = usableHeight / this._rowCount;
    const y = this.marginTop + row * rowHeight + rowHeight / 2 + rand(-8, 8);

    // 初始化
    item.text = pickRandom(this.messages);
    item.fontSize = rand(this.fontMin, this.fontMax);
    item.speed = rand(this.speedMin, this.speedMax);
    item.x = this.screenWidth + rand(20, 200);
    item.y = y;
    item.life = 0;
    item.alpha = 0;
    item.state = 'entering';
    item.enterTimer = 0;
    item.exitTimer = 0;
    item._color = pickColor();
    item._textWidth = item.text.length * item.fontSize * 0.8; // CJK 估测
    item._row = row;
    item._sway = 0;
    item._swayPhase = Math.random() * Math.PI * 2;
    item._swaySpeed = rand(0.8, 2.0);
    item._swayAmp = rand(1, 4);

    // 行冷却开始
    this._rowTimers[row] = 0;
  }

  _easeIn(t) {
    // ease-in quad
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
