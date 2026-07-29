# 《昨日重现》Chapter 2 — 拼图关卡实现方案

## 一、项目背景

### 1.1 项目概况

| 维度 | 说明 |
|------|------|
| 作品名 | 《昨日重现》 |
| 主题 | 第一人称体验阿尔茨海默患者从迷失到短暂清醒的全过程 |
| 比赛 | 抖音AI创变者计划 2026大区赛 · 赛道一 互动空间 |
| 技术栈 | 纯 HTML5 Canvas，零外部依赖 |
| 队伍 | X7，4名大一学生 |
| 时长 | 约20分钟，共10章 |
| 状态 | 从零开始构建，当前聚焦 Ch2 拼图关卡 |

### 1.2 10章情感弧线

```
序曲(Ch1) → 日常困惑(Ch2) → 迷途(Ch3) → 警局(Ch4) → 归家(Ch5)
→ 温暖日常(Ch6) → 惊悚夜醒(Ch7) → 自我和解(Ch8) → 风铃(Ch9) → 认出(Ch10)
```

### 1.3 Chapter 2 在全局中的位置

- **章节名**：接女儿放学
- **时长**：约 3 分钟
- **核心互动**：拼图 + 找钥匙
- **叙事功能**：从 Ch1 的"我是谁"困惑过渡到"我有一个女儿"的身份确认
- **记忆进度**：5% → 15%
- **医学隐喻**：视觉色彩丧失、短期记忆断层 → 拼图恢复彩色 = 记忆短暂恢复

### 1.4 策划案原文（Ch2 相关）

> 走到床边书桌前，面前是一个被打乱的相框。拼图内容：中年主人公和女儿第一天上学时在校门口的合照（槐树、扎辫子小女孩、年轻男人）。
>
> **互动A：拼图** — 6块碎片。拖拽移动+双指旋转。靠近正确位置自动吸附（40px）。每拼对一块→该区域恢复彩色。拼完→整张照片彩色展示。但彩色只停留3秒，然后饱和度缓慢下降——拼好的记忆又开始褪色。
>
> **互动B：找钥匙** — 回到书桌，台历变成了上锁的糖盒……（后续迭代实现）

---

## 二、美术资源

### 2.1 飞书素材文档

- **URL**：https://wcnzcbnb3bym.feishu.cn/wiki/TWQjwGO2AiZ2urkxL0ucZF7Hn3f
- **文档 ID**：`ERXadFUFWoiPDsxBPGJcsAbEntc`
- **版本**：revision 7

### 2.2 已下载资源清单

| 文件名 | 用途 | 格式 | 尺寸 | 大小 |
|--------|------|------|------|------|
| `scene_room.jpg` | 家场景（老人卧室/客厅），画面中有桌子 | PNG RGB | 1672×941 | ~1.5MB |
| `scene_desk.jpg` | 桌面特写，桌上散落拼图碎片 | PNG RGB | 1672×941 | ~1.5MB |
| `scene_puzzle.jpg` | 拼图完整原图（推测为父女合照） | JPEG | 1448×1086 | 待确认 |

### 2.3 图片场景映射

```
scene_room.jpg  →  Scene_Room   (场景一：点击桌子热区)
scene_desk.jpg  →  Scene_Desk   (场景二：点击拼图热区)
scene_puzzle.jpg →  Scene_Puzzle (场景三：3×3 拼图交互)
```

> **注意**：`scene_room.jpg` 和 `scene_desk.jpg` 虽后缀为 `.jpg`，实际是 PNG 格式。代码加载不受影响（浏览器根据文件头识别）。

---

## 三、技术架构

### 3.1 设计原则

- **零外部依赖**：纯 HTML5 Canvas 2D API + Vanilla JS ES Modules
- **移动端优先**：触屏拖拽为核心交互，同时兼容桌面鼠标
- **场景驱动**：每章/每个画面一个 Scene，统一生命周期管理
- **逻辑分辨率**：1280×720，等比缩放适配任意屏幕

### 3.2 项目结构

```
抖音大区赛/
├── index.html                    # 入口，全屏 Canvas
├── assets/
│   └── images/
│       ├── scene_room.jpg        # 家场景背景
│       ├── scene_desk.jpg        # 桌面特写
│       └── scene_puzzle.jpg      # 拼图原图
├── src/
│   ├── main.js                   # 入口：Canvas初始化、场景注册、启动
│   ├── core/
│   │   ├── Game.js               # 游戏主循环 (rAF)
│   │   ├── Loader.js             # 图片预加载
│   │   ├── InputManager.js       # touch/mouse 统一事件层
│   │   └── SceneManager.js       # 场景注册/切换/过渡动画
│   └── scenes/
│       ├── Scene_Room.js         # 场景1：家 → 点击桌子
│       ├── Scene_Desk.js         # 场景2：桌面特写 → 点击拼图
│       └── Scene_Puzzle.js       # 场景3：3×3拼图核心交互
└── README.md                     # 本文件
```

### 3.3 各模块职责

#### `index.html`
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,
        maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>昨日重现 - Ch2 拼图</title>
  <style>
    * { margin: 0; padding: 0; overflow: hidden; }
    canvas { display: block; background: #000; }
  </style>
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

#### `main.js` — 入口文件
- 创建 Canvas，设置逻辑分辨率 1280×720
- CSS `object-fit: contain` 方式等比缩放填满视口
- 初始化 `InputManager`，绑定 Canvas 事件
- 调用 `Loader.loadImages(manifest)` 预加载全部图片
- 注册三个 Scene 到 `SceneManager`
- 启动主循环 `Game.start()`，首个场景 `Scene_Room`
- 全局 `game` 对象挂载：`{ canvas, ctx, sceneManager, images, input, width: 1280, height: 720 }`

#### `Game.js` — 游戏主循环
```javascript
// 伪代码
class Game {
  constructor(game) {
    this.game = game;
    this.lastTime = 0;
  }

  start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = timestamp;

    const scene = this.game.sceneManager.currentScene;
    if (scene && scene.update) scene.update(dt);
    if (scene && scene.render) {
      this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
      scene.render(this.game.ctx);
    }
    // 场景过渡层
    this.game.sceneManager.renderTransition(this.game.ctx);

    requestAnimationFrame(t => this.loop(t));
  }
}
```

#### `Loader.js` — 资源加载
```javascript
// 输入：{ key: 'assets/images/scene_room.jpg', ... }
// 输出：{ key: HTMLImageElement, ... }
// 使用 Promise.all 并行加载
// 加载完成后存入 game.images
```

#### `InputManager.js` — 输入统一层
- 监听 `touchstart/mousedown` → 统一为 `pointerdown { x, y }`
- 监听 `touchmove/mousemove` → 统一为 `pointermove { x, y }`
- 监听 `touchend/mouseup` → 统一为 `pointerup { x, y }`
- `x, y` 为逻辑坐标（物理像素 → 逻辑分辨率映射）
- 每个 Scene 在 `onEnter` 时注册回调，`onExit` 时注销
- 防止移动端默认行为（`preventDefault` 阻止页面滚动/缩放）

#### `SceneManager.js` — 场景管理
```javascript
class SceneManager {
  constructor(game) { /* ... */ }

  register(name, SceneClass)  // 注册场景类
  switchTo(name)               // 切场：fadeOut → new Scene.onEnter() → fadeIn
  get currentScene()           // 返回当前活跃 Scene 实例

  // 过渡动画
  // alpha: 0→1 (fadeIn) 或 1→0 (fadeOut)
  // 时长：300ms
  // renderTransition(ctx) 在主循环中绘制半透明遮罩
}
```

---

## 四、场景详细设计

### 4.1 Scene_Room — 家场景

**画面**：全屏绘制 `scene_room.jpg`

**提示文字**：
- 位置：画面底部居中，距底部 40px
- 内容："点击桌子看看……"
- 样式：白色半透明底 + 黑色文字，字号 24px，带呼吸闪烁动画（opacity 0.6↔1.0，周期 2s）

**桌子热区**：
- 方式一：硬编码矩形（根据实际图片中桌子位置手动标定，如 `{ x: 400, y: 300, w: 500, h: 350 }`）
- 方式二：点击任意位置都触发（简化，首版可直接用）
- 推荐先用方式二快速验证，后续根据实际图片调热区

**交互**：
- 点击热区 → `game.sceneManager.switchTo('desk')`
- 如果点击了非热区 → 提示文字短暂高亮/放大，暗示玩家点桌子

**过渡**：淡入淡出 300ms

**生命周期**：
```
onEnter()  → 注册 click handler
onExit()   → 注销 handler
update(dt) → 更新提示文字呼吸动画
render(ctx) → 绘制背景图 → 绘制提示文字
```

---

### 4.2 Scene_Desk — 桌面特写

**画面**：全屏绘制 `scene_desk.jpg`

**提示文字**：
- 位置：画面顶部居中
- 内容："桌上有散落的拼图……"
- 样式同上，呼吸动画

**拼图热区**：
- 方式一：画面中央大矩形（拼图散落在桌面中央区域）
- 方式二：点击任意位置触发
- 首版用方式二

**交互**：
- 点击 → `game.sceneManager.switchTo('puzzle')`

**过渡**：淡入淡出 300ms

---

### 4.3 Scene_Puzzle — 3×3 拼图交互（核心）

#### 4.3.1 布局参数

```
┌──────────────────────────────────────────────────┐
│                   1280  (逻辑宽)                   │
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │           拼图面板区域                     │   │
│   │           (居中，约 900×675)              │   │
│   │                                          │   │
│   │   ┌──────┬──────┬──────┐                 │   │
│   │   │  0   │  1   │  2   │                 │   │
│   │   ├──────┼──────┼──────┤                 │   │
│   │   │  3   │  4   │  5   │   3×3 网格      │   │
│   │   ├──────┼──────┼──────┤                 │   │
│   │   │  6   │  7   │  8   │                 │   │
│   │   └──────┴──────┴──────┘                 │   │
│   │                                          │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   "将拼图碎片拖到正确的位置……"                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

| 参数 | 值 | 说明 |
|------|-----|------|
| 逻辑分辨率 | 1280×720 | Canvas 内坐标 |
| 拼图原图尺寸 | 1448×1086 | `scene_puzzle.jpg` |
| 拼图面板宽度 | 900px | 原图等比缩放到适合屏幕 |
| 拼图面板高度 | 675px | 900 × 1086/1448 |
| 网格 | 3×3 | 每格约 300×225 |
| 单块碎片宽度 | 300px | 900 / 3 |
| 单块碎片高度 | 225px | 675 / 3 |
| 吸附半径 | 50px | 手指松开时与目标位置的距离阈值 |
| 打乱偏移范围 | ±100~250px | 碎片散落位置的随机范围 |

#### 4.3.2 拼图切片过程

```
1. 创建离屏 Canvas（1448×1086），绘制 scene_puzzle.jpg
2. 循环 i=0..2, j=0..2：
   - 切出子图：ctx.drawImage(offCanvas, j*482, i*362, 482, 362, 0, 0, 482, 362)
   - 转为独立 Image 或存为离屏 Canvas
   - 生成 piece 对象：
     {
       id: i*3 + j,           // 0~8，正确位置的编号
       image: Image,           // 该块的位图
       gridX: i, gridY: j,    // 网格坐标
       targetX: panelX + j * 300,  // 目标 X（面板内）
       targetY: panelY + i * 225,  // 目标 Y（面板内）
       currentX: random,       // 当前 X（散落位置）
       currentY: random,       // 当前 Y（散落位置）
       width: 300,
       height: 225,
       placed: false,          // 是否已归位
       dragging: false,        // 是否正在拖拽
       saturation: 0,          // 当前饱和度
     }
3. 将 9 个 piece 按 Fisher-Yates 打乱
4. 为每个 piece 生成散落位置（确保不重叠）
```

#### 4.3.3 散落位置生成算法

```javascript
// 面板外围环形散落
function scatterPieces(pieces, panelX, panelY, panelW, panelH) {
  const scattered = [...pieces];
  // Fisher-Yates shuffle
  for (let i = scattered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scattered[i], scattered[j]] = [scattered[j], scattered[i]];
  }

  // 每个碎片分配到面板周围的槽位
  // 上排 3 个（面板上方）、下排 3 个（面板下方）、左 1 个、右 2 个
  const slots = generateScatterSlots(panelX, panelY, panelW, panelH, pieces.length);
  scattered.forEach((piece, i) => {
    piece.currentX = slots[i].x;
    piece.currentY = slots[i].y;
  });
}
```

散落区域：面板上下左右各留 80px 缓冲区，确保碎片不完全在目标面板内。

#### 4.3.4 拖拽交互流程

```
┌──────────────┐
│  pointerdown │ → 遍历所有 piece（从未归位的倒序，优先选上层）
└──────┬───────┘     命中检测：点是否在 piece.currentX/Y 矩形内
       │             命中 → piece.dragging = true
       ↓             piece.offsetX/Y = pointer - piece.current（手指偏移）
┌──────────────┐
│  pointermove │ → 如果 piece.dragging:
└──────┬───────┘     piece.currentX = pointer.x - piece.offsetX
       │             piece.currentY = pointer.y - piece.offsetY
       ↓             将该 piece 移到渲染数组末尾（置于最上层）
┌──────────────┐
│  pointerup   │ → 如果 piece.dragging:
└──────────────┘     piece.dragging = false
                     检查是否在目标吸附范围：
                     dist = sqrt((piece.currentX - piece.targetX)^2
                               + (piece.currentY - piece.targetY)^2)
                     if dist <= 50px:
                       piece.currentX = piece.targetX  (吸附)
                       piece.currentY = piece.targetY
                       piece.placed = true
                       piece.saturation = 1            (恢复彩色)
                       播放反馈：navigator.vibrate(15) + 粒子特效
                     else:
                       留在当前位置（不弹回）
```

#### 4.3.5 渲染逻辑

```javascript
render(ctx) {
  // 1. 背景：深色/毛玻璃效果
  drawBackground(ctx);

  // 2. 面板：半透明虚线网格，暗示目标位置
  drawTargetGrid(ctx);

  // 3. 已归位的碎片：绘制在面板位置，正常彩色
  for (const piece of pieces.filter(p => p.placed)) {
    ctx.filter = 'saturate(1)';
    ctx.drawImage(piece.image, piece.targetX, piece.targetY, piece.width, piece.height);
  }

  // 4. 正在拖拽的碎片：绘制在手指位置，跟随移动，最上层
  // 5. 未归位的碎片：绘制在散落位置，灰度化
  for (const piece of pieces.filter(p => !p.placed)) {
    ctx.filter = piece.dragging ? 'saturate(0.3)' : 'saturate(0)';
    ctx.drawImage(piece.image, piece.currentX, piece.currentY, piece.width, piece.height);
  }
  ctx.filter = 'none';

  // 6. 提示文字
  drawHint(ctx);
}
```

#### 4.3.6 完成判定与展示

```
所有 9 块 placed === true：

1. 整张照片彩色展示（ctx.filter = 'saturate(1)'）
2. 显示文字："记忆恢复了一些……" ，带温暖色调光晕
3. 持续 3 秒
4. 🎬 饱和度缓慢下降动画（2秒内 saturate 1→0.3）→ 隐喻"记忆开始褪色"
5. 文字更新："但那抹色彩，终究会慢慢褪去……"
6. 500ms 后 → 控制台输出 "Ch2 拼图完成"（后续衔接到找钥匙玩法或 Ch3）
```

---

## 五、视觉风格约定

| 元素 | 处理方式 |
|------|----------|
| 场景背景 | 直接绘制美术提供的全屏图 |
| 未归位拼图碎片 | `ctx.filter = 'saturate(0)'` 灰度化 |
| 拖拽中的碎片 | `saturate(0.3)` 微色 + `drop-shadow(3px 3px 6px rgba(0,0,0,0.5))` |
| 已归位碎片 | `saturate(1)` 完整彩色 |
| 目标网格 | 半透明白色虚线，3×3，暗示拼图目标位置 |
| 提示文字 | 白色半透明底 + 黑色文字，底部居中，呼吸动画 |
| 场景过渡 | 纯黑遮罩，300ms fade in/out |

---

## 六、策划案差异说明

当前实现与策划案的差异及原因：

| 维度 | 策划案 | 本次实现 | 原因 |
|------|--------|----------|------|
| 碎片数量 | 6块 | 9块（3×3） | 美术是完整长方形图片，3×3 切割均匀 |
| 双指旋转 | 有（旋转步进15°） | 无 | 9块方格无需旋转，碎片本身是矩形切块 |
| 找钥匙玩法 | Ch2 第二部分 | 暂不实现 | 首版聚焦拼图核心交互验证 |
| 彩色停留 | 3秒 | 3秒 | 一致 |
| 饱和度褪色 | 有 | 有（2秒） | 一致 |
| 吸附半径 | 40px | 50px | 略放宽适配触屏手感 |

---

## 七、实现步骤

### Phase 1：骨架搭建（先跑通场景切换）

| 步骤 | 文件 | 内容 |
|------|------|------|
| 1 | `index.html` | 全屏 Canvas 模板 |
| 2 | `src/main.js` | Canvas 初始化、全局 game 对象 |
| 3 | `src/core/Game.js` | rAF 主循环 |
| 4 | `src/core/Loader.js` | 图片预加载 |
| 5 | `src/core/InputManager.js` | touch/mouse 统一 |
| 6 | `src/core/SceneManager.js` | 场景切换 + 淡入淡出过渡 |

**验证标准**：浏览器打开 → 黑屏 → 控制台无报错 → `game` 对象可访问。

### Phase 2：简单场景（验证场景切换链路）

| 步骤 | 文件 | 内容 |
|------|------|------|
| 7 | `src/scenes/Scene_Room.js` | 绘制 scene_room.jpg + 点击切换 |
| 8 | `src/scenes/Scene_Desk.js` | 绘制 scene_desk.jpg + 点击切换 |

**验证标准**：Room 点击 → Desk 点击 → （先跳转到占位场景确认链路通）。

### Phase 3：拼图核心（最复杂的部分）

| 步骤 | 文件 | 内容 |
|------|------|------|
| 9 | `src/scenes/Scene_Puzzle.js` | 切片 → 打乱 → 拖拽 → 吸附 → 完成判定 |

**验证标准**：
- 进入拼图场景 → 9 块灰度碎片散落在面板周围
- 手指拖拽某块 → 跟随移动，置于最上层
- 拖到目标位置附近松手 → 吸附 + 恢复彩色 + 震动反馈
- 9 块全部归位 → 彩色展示 3s → 褪色动画 → 完成

### Phase 4：联调打磨

| 步骤 | 内容 |
|------|------|
| 10 | 三场景串联完整走通 |
| 11 | 过渡动画参数微调 |
| 12 | 触屏手感优化（吸附阈值、拖拽灵敏度） |
| 13 | 移动端真机测试 |

---

## 八、已知待确认项

| 序号 | 问题 | 影响 | 优先级 |
|------|------|------|--------|
| 1 | `scene_puzzle.jpg` 实际内容是什么？构图是否适合 3×3 切割？ | 切割方案可能需要调整（如主体居中 → 切 3×3 会把人脸切碎） | 🔴 高 |
| 2 | 桌子热区 & 拼图热区的精确像素位置 | 如果不用"点击任意位置"，需要标定热区 | 🟡 中 |
| 3 | 策划案写的是 6 块碎片，是否必须严格按 6 块？ | 影响拼图切割逻辑 | 🟡 中 |
| 4 | 碎片松手后不吸附时，是留在原地还是弹回散落位置？ | 影响拖拽手感 | 🟢 低 |
| 5 | 是否需要音效/震动反馈？ | 影响交互完整度 | 🟢 低 |
| 6 | 三个场景图片的 URL 是否有有效期？是否需要重新下载？ | 飞书图片链接可能有过期时间 | 🟡 中 |

---

## 九、技术限制与风险

| 风险 | 影响 | 应对 |
|------|------|------|
| `ctx.filter` 在部分浏览器不支持 | 灰度/饱和度效果失效 | 备用方案：离屏 Canvas 逐像素处理，或直接忽略视觉效果 |
| 拼图原图过大（1448×1086，可能 ~500KB+） | 加载慢 | Loader 加 loading 进度条 |
| 移动端 Safari `navigator.vibrate` 不支持 | 震动反馈失效 | 改为视觉反馈（粒子迸发） |
| 飞书图片链接过期 | 图片无法加载 | 重新从飞书文档获取最新下载链接 |
| ES Modules 在旧浏览器不支持 | 无法运行 | 目标为现代移动浏览器（iOS 15+/Android Chrome 90+），无需 polyfill |

---

## 十、文件清单总览

```
抖音大区赛/
├── index.html                         # ← 新建
├── assets/
│   └── images/
│       ├── scene_room.jpg             # ✔ 已下载 (1672×941 PNG)
│       ├── scene_desk.jpg             # ✔ 已下载 (1672×941 PNG)
│       └── scene_puzzle.jpg           # ✔ 已下载 (1448×1086 JPEG)
├── src/
│   ├── main.js                        # ← 新建
│   ├── core/
│   │   ├── Game.js                    # ← 新建
│   │   ├── Loader.js                  # ← 新建
│   │   ├── InputManager.js            # ← 新建
│   │   └── SceneManager.js            # ← 新建
│   └── scenes/
│       ├── Scene_Room.js              # ← 新建
│       ├── Scene_Desk.js              # ← 新建
│       └── Scene_Puzzle.js            # ← 新建
└── README.md                          # ← 本文件
```

---

> **下一步**：确认待确认项后，按 Phase 1→2→3→4 顺序实现。Phase 1-2 预计 1 小时内完成，Phase 3 拼图核心是重头。
