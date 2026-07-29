# 《昨日重现》统一技术架构与开发规范 v1.0

> 2026-07-29 · X7 团队  
> 覆盖范围：全部 10 章 Canvas 互动关卡 + 启动/加载/结算

---

## 一、现状盘点

### 1.1 已有模块（3/10 关卡有互动代码）

| 模块 | 来源 | 代码行数 | 架构 |
|------|------|----------|------|
| Ch2 拼图 | `src/scenes/Scene_Puzzle.js` + `puzzleLayout.js` + `src/core/*` | ~900 行 | Canvas 引擎，模块化 |
| Ch3 迷宫连线 | xyqbranch `Scene_Maze.js` + `mazeLayout.js` | ~460 行 | 同引擎接口（onEnter/update/render） |
| Ch8 签字 | `sign_to_whiteboard.html` / `whiteboard.html` | 287/452 行 | **独立架构**，自带 rAF+setInterval+DPR |

### 1.2 问题

| 问题 | 影响 |
|------|------|
| Ch8 签字是独立 app（自带 rAF/DPR/事件系统） | 无法直接接入骨架 |
| Ch2 拼图、Ch3 迷宫引擎一致，但缺少 ChapterManager | 没法串联 |
| 三个模块各自写了 event 绑定和 canvas 尺寸管理 | 重复代码，维护负担 |
| 产物形态不一致：Ch2 dist 是单文件合并版，开发环境是 ES Modules | 打包策略要统一 |

---

## 二、目标产物形态

按照抖音互动空间规则：

```
build_out/
├── index.html           # 唯一入口，所有 JS/CSS 全部内联进一个 <script>
└── assets/images/       # 相对路径引用的压缩图片
    ├── scene_puzzle.jpg
    ├── scene_maze_map.png
    ├── sign_scene.png
    ├── scene_room.jpg / scene_desk.jpg
    └── chXX_bg.jpg ...
```

- zip 根目录 = `index.html` 直接可见
- 无 `__MACOSX`、`.DS_Store`
- zip 总体积 < 8MB

---

## 三、统一技术选型

### 3.1 核心决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染方案 | **HTML5 Canvas 2D**（整个作品 = 一个 canvas） | 拼图和迷宫已验证，跨平台一致，无 CSS 兼容问题 |
| 分辨率 | **1280 × 720 逻辑分辨率**，等比缩放 | 已用全项目 |
| DPR | canvas backing store `width×dpr`，CSS 等比例缩放 | fix-log 已验证方案 |
| 输入 | **Pointer Events**（pointerdown/move/up/cancel），统一处理 touch + mouse | InputManager 已验证 |
| 架构 | **ChapterManager** 驱动，每章 = 一个 Scene 类 | 跟现有 SceneManager 模式兼容 |
| 打包 | JS/CSS 全内联单 `<script>`，用 `build.js`（Node，无依赖）拼接 | 妙搭不认 ES Modules |

### 3.2 禁止清单（抖音规则映射到技术层）

- ❌ `alert()` / `confirm()` / `prompt()` → 用自绘弹层
- ❌ `eval()` / `new Function()` → 不存在的需求
- ❌ 外部网络请求 → 全本地资源
- ❌ 外部跳转 / `<iframe>` → 不存在的需求
- ❌ 面向用户文案出现"游戏"字样 → 用"章节""体验""关卡"

### 3.3 兜底规则

- `ctx.filter` 不可靠（iOS Safari <18）→ 褪色/灰度等效果用**离屏 Canvas 预生成**
- 图片加载失败 → 内置重试 1 次 → 失败显示自绘占位
- 所有章节统一 `try/catch` 包裹 `window.addEventListener('load', ...)` → 自绘错误弹层
- `navigator.vibrate` 用 try/catch 包裹（iOS 不支持时静默跳过）

---

## 四、统一架构

### 4.1 目录结构（开发态）

```
src/
├── main.js                       # 入口：Canvas初始化、图片加载、骨架串联
├── core/
│   ├── Game.js                   # rAF 主循环，dt cap 0.1s
│   ├── InputManager.js           # Pointer Events 统一封装
│   ├── Loader.js                 # 图片预加载 Promise.all
│   ├── ChapterManager.js         # ★ 新：章节注册/切换/过渡，替代 SceneManager
│   ├── ProgressStore.js          # ★ 新：localStorage 进度管理
│   └── Overlay.js               # ★ 新：自绘弹层系统
├── chapters/                     # ★ 每关一个文件，统一实现 Chapter 接口
│   ├── ch01_intro.js             # 镜前
│   ├── ch02_puzzle.js            # 拼图（从 Scene_Puzzle 移植）
│   ├── ch03_maze.js              # 迷宫连线（从 Scene_Maze 移植）
│   ├── ch04_police.js            # 警局
│   ├── ch05_door.js              # 归家开门
│   ├── ch06_stir.js              # 搅拌面条
│   ├── ch07_night.js             # 夜醒找门锁
│   ├── ch08_sign.js              # 签字（从 sign_to_whiteboard 重写）
│   ├── ch09_chime.js             # 风铃
│   └── ch10_report.js            # 记忆报告
├── utils/
│   ├── sceneUtils.js             # roundedRect, drawPrompt, drawImageCover 等
│   └── puzzleLayout.js           # Ch2 拼图布局（可复用逻辑）
└── data/
    └── chapters.json             # 章节元数据（标题/文案/记忆值）
```

### 4.2 Chapter 统一接口

**每一章必须实现以下 5 个方法：**

```javascript
// 所有坐标均为 1280×720 逻辑坐标系
export class Chapter {
  constructor(game) {}  // game = { canvas, ctx, width:1280, height:720, images, input, progress, overlay }

  onEnter() {}          // 注册 input.setHandlers(), 初始化状态
  onExit() {}           // input.setHandlers() 清空, 清理 timer
  update(dt) {}         // dt 单位秒，最大值已 cap 0.1
  render(ctx) {}        // 绘制到 ctx，坐标系为 1280×720

  get isComplete() {}   // 返回 boolean，由 ChapterManager 读取
}
```

### 4.3 ChapterManager 工作流

```
ChapterManager.register('ch02', Chapter02);
ChapterManager.switchTo('ch02');

切换流程：
  currentScene.onExit()
  → new Chapter(game) → newScene.onEnter()
  → transition.fadeOut→fadeIn (300ms 黑屏)
```

### 4.4 ProgressStore 接口

```javascript
const progress = new ProgressStore('ye_v1');
// 存
progress.save({ chapter: 2, memory: 15, completed: [1, 2], ts: Date.now() });
// 读
const data = progress.load(); // { chapter: 2, memory: 15, ... } | null
// 完成一章
progress.markChapterComplete(chapterNum, memoryValue);
```

### 4.5 Overlay 系统

所有弹层（提示/确认/结算/错误）必须用 Canvas 自绘，不由 DOM 实现。

```javascript
// 使用方式
game.overlay.show({
  type: 'complete',      // 'prompt' | 'confirm' | 'complete' | 'error'
  title: '记忆恢复了一些……',
  message: '但那抹色彩，终究会慢慢褪去……',
  buttons: [
    { text: '继续', action: () => ChapterManager.next() }
  ]
});
```

弹层规则：
- 全屏半透明黑色遮罩 + 居中卡片
- 同时只允许一个弹层激活
- 按钮必须显式绑定 action，不依赖任何浏览器原生弹窗
- 结算类弹层必须有"下一步"按钮

---

## 五、三个已有关卡的重写/移植方案

### 5.1 Ch2 拼图 — **移植**

现状：`Scene_Puzzle.js` + `puzzleLayout.js` 已按 Chapter 接口实现。

需改动：
- [ ] 内部 `game.sceneManager.switchTo()` → 改为 `game.chapterManager.next()`
- [ ] 褪色效果使用离屏 Canvas 预生成灰度版（替代 `ctx.filter='saturate(…)'`）
- [ ] 完成回调从 `game.onPuzzleComplete` → 触发 `game.overlay.show()` 结算

### 5.2 Ch3 迷宫 — **移植**

现状：`Scene_Maze.js` 已按统一接口实现（onEnter/update/render 全有）。

需改动：
- [ ] 节点坐标基于地图图片微调
- [ ] 完成回调接入 ChapterManager + Overlay
- [ ] 提示文案审核（无"游戏"字样）

### 5.3 Ch8 签字 — **重写**

现状：独立 app，自带完整输入/渲染/DPR/计时系统。

需重写为 Chapter 接口：
```
保留：
  ✓ 笔画分类算法（classifyStroke — 横/竖/撇/捺/点/折）
  ✓ 畸变规则（横↔竖、撇↔捺）
  ✓ 匹配评分逻辑（matchStr）
  ✓ 纸纹渲染

重写：
  ✗ 独立 rAF → 接入 Game.gameLoop（update 回调）
  ✗ 独立 setInterval 计时 → 用 dt 累加实现
  ✗ 独立 DPR 管理 → 用全局 resizeCanvas
  ✗ DOM overlay（#timeoutOverlay/#passOverlay）→ Canvas Overlay
  ✗ addEventListener 绑定 → InputManager.setHandlers
```

重写后签名：
```javascript
// src/chapters/ch08_sign.js
export class Chapter08 {
  constructor(game) {}  // game.input 可用
  onEnter() {}          // 注册 pointer handlers
  update(dt) {}         // 计时 + 分数更新
  render(ctx) {}        // 纸张背景 + 变形笔画 + 按钮
  get isComplete() {}   // S.passed
}
```

---

## 六、进度按序

### 6.1 优先级

| 优先级 | 任务 | 负责 | 验收标准 |
|--------|------|------|----------|
| 🔴 P0 | ChapterManager + Chapter 接口 + ProgressStore + Overlay | A | 切换 2 章不报错，进度可存可取 |
| 🔴 P0 | Ch2 拼图移植到 Chapter 接口 | A | 拖拽+吸附+褪色，npm test 10/10 |
| 🔴 P0 | 占位章节（Ch1/4/5/6/7/9/10）注册，长按 1s 切章 | A/B/C | 全线 1→10 可导航 |
| 🔴 P0 | build.js 拼接脚本 | A | 输出单文件 index.html |
| 🟡 P1 | Ch3 迷宫移植 | C | 连线正确，死胡同检测 |
| 🟡 P1 | Ch8 签字重写 | A | 写"向阳"匹配通过 |
| 🟡 P1 | Ch1 镜前特效 | B | 点击碎裂粒子 |
| 🟡 P1 | Ch4 警局 + Ch5 归家 | C/B | 双热区+数字键盘 |
| 🟢 P2 | Ch6/7/9 关卡 | 并行 | 各关可过 |
| 🟢 P2 | Ch10 记忆报告 | A | 10章进度展示+淡出 |

---

## 七、规范约定

### 7.1 命名

- 文件名小写下划线：`ch02_puzzle.js`、`chapter_manager.js`
- 类名 PascalCase：`Chapter02`、`ChapterManager`
- 常量 UPPER_SNAKE：`DESIGN_W = 1280`、`DESIGN_H = 720`
- localStorage key：`ye_v1`（业务前缀 + 版本号）
- 面向用户文案：`"继续下一章节"` 而非 `"下一关"`

### 7.2 坐标与单位

- 所有开发坐标系 = **1280 × 720 逻辑像素**
- 图片原图尺寸各不同，通过缩放适配
- DPR 只在 resizeCanvas 中处理，各章节代码不碰 DPR

### 7.3 输入规范

- 统一通过 `game.input.setHandlers({ down, move, up, cancel })` 注册
- 每个 pointer 事件收到的 `point` 已经是逻辑坐标（1280×720）
- 章节的 `onExit` 必须清空 handler 防止残留

### 7.4 错误处理

```javascript
window.addEventListener('load', () => {
  try {
    initApp();
  } catch (error) {
    // 自绘错误弹层（Canvas 覆盖）
    // 显示"出错了，请重启试试"
  }
});
```

---

## 八、build.js 拼接规则

```javascript
// build.js（Node，无依赖）
// 输入：src/ 目录下的模块文件
// 输出：build_out/index.html（单文件）

// 拼接顺序：
// 1. index.html 的 <!DOCTYPE>…<canvas>…<script>
// 2. core/*.js（Game, InputManager, Loader, ChapterManager, ProgressStore, Overlay）
// 3. utils/*.js（sceneUtils, puzzleLayout）
// 4. chapters/*.js（全部章节按编号顺序）
// 5. main.js（入口 + 初始化逻辑）
// 6. </script></body></html>

// 把 import/export 语句替换为直接引用
// （简单方案：concat 所有文件，去掉 import/export 行，
//   用全局 game 对象传递依赖）
```

---

## 九、自检清单

提交前逐项确认：

- [ ] zip 解压根目录 = `index.html`
- [ ] 无任何网络请求
- [ ] 不使用 `alert/confirm/prompt/print`
- [ ] 所有弹层为自绘 Canvas
- [ ] 文案无"游戏"字样
- [ ] 横屏铺满无黑边，竖屏出旋转提示
- [ ] 有全局错误兜底 try/catch
- [ ] localStorage key 带 `ye_` 前缀
- [ ] zip 总大小 < 8MB
- [ ] 无 `__MACOSX` / `.DS_Store`
