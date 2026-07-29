# 《昨日重现》开发规范 v1.0

> X7 团队 · 2026-07-29  
> 全作品 = 一片 Canvas（1280×720），零 DOM UI，零外部依赖

---

## 一、技术铁律

| 项 | 规定 |
|----|------|
| 渲染 | **纯 Canvas 2D**，整个作品只有一个 `<canvas>` |
| 分辨率 | **1280 × 720** 逻辑坐标，等比缩放适配所有屏幕 |
| 输入 | **Pointer Events**，走 `InputManager` 统一分发 |
| 弹层 | **Canvas 自绘**，禁止 `alert/confirm/prompt` |
| 坐标 | 所有代码用 1280×720，不碰 DPR |
| 图片 | 全本地**相对路径**，零网络请求 |
| 进度 | `localStorage`，key 前缀 `ye_v1_` |
| 打包 | 单文件 `index.html`，ES Modules 全部内联 |
| 文案 | 禁用 "游戏/玩家/输赢"，用 "章节/体验/继续" |

### 兼容兜底

- `ctx.filter` 不用 → 效果用**离屏 Canvas**预生成
- `navigator.vibrate` → `try/catch` 包裹（iOS 不支持）
- 图片加载失败 → 重试 1 次 → 自绘占位
- 全局 `try/catch` 兜底 → 错误时 Canvas 绘制提示文字

---

## 二、项目结构

```
src/
├── main.js                   # 入口：初始化 Canvas → 加载图片 → 注册章节 → 启动
├── core/
│   ├── Game.js               # rAF 主循环（dt cap 0.1s）
│   ├── InputManager.js       # Pointer 事件 → 逻辑坐标转换
│   ├── Loader.js             # Promise.all 图片预加载
│   ├── ChapterManager.js     # 章节注册/切换/fade 过渡
│   ├── ProgressStore.js      # localStorage 进度读写
│   └── Overlay.js            # Canvas 自绘弹层
├── chapters/                 # 每章一个文件
│   ├── ch01_intro.js
│   ├── ch02_puzzle.js        # 拼图（已有）
│   ├── ch03_maze.js          # 迷宫（已有）
│   ├── ch04_police.js
│   ├── ch05_door.js
│   ├── ch06_stir.js
│   ├── ch07_night.js
│   ├── ch08_sign.js          # 签字（已有逻辑，需重写生命周期）
│   ├── ch09_chime.js
│   └── ch10_report.js
├── utils/
│   ├── sceneUtils.js         # roundedRect, drawPrompt, drawImageCover
│   └── puzzleLayout.js       # Ch2 拼图布局
└── data/
    └── chapters.json         # 章节元数据（标题/文案/记忆值）
```

---

## 三、Chapter 接口（必须遵守）

每一章的 JS 文件导出同一个类的构造函数：

```javascript
export class ChapterNN {
  constructor(game) {
    // game = { canvas, ctx, width:1280, height:720, images, input, progress, overlay }
  }

  onEnter() {}          // 注册 input.setHandlers()，初始化状态
  onExit() {}           // 清空 handler，清理 timer
  update(dt) {}         // dt 秒，已 cap 0.1
  render(ctx) {}        // 绘制，坐标系 1280×720

  get isComplete() {}   // return boolean，ChapterManager 读取
}
```

**规则：**

- `onEnter` / `onExit` 必须配对，`onExit` 清空所有 input handler
- `update` 中不要做渲染，`render` 中不要改状态
- `isComplete` 只读，不要在 getter 里改状态
- 章节之间不互相引用，不访问其他章节的内部状态
- 需要触发章节切换时，调用 `game.chapterManager.next()`

---

## 四、game 对象（全局共享）

```javascript
const game = {
  canvas,          // HTMLCanvasElement
  ctx,             // CanvasRenderingContext2D
  width: 1280,     // 逻辑宽度（永远不变）
  height: 720,     // 逻辑高度（永远不变）
  images: {},      // Loader 加载的图片 { key: HTMLImageElement }
  input,           // InputManager 实例
  chapterManager,  // ChapterManager 实例
  progress,        // ProgressStore 实例
  overlay,         // Overlay 实例
};
```

---

## 五、输入规范

```javascript
// 在每个 Chapter 的 onEnter 中注册
this.game.input.setHandlers({
  down(point)  { /* point = { x, y, pointerId, pointerType } */ },
  move(point)  { /* x, y 已是 1280×720 逻辑坐标 */ },
  up(point)    {},
  cancel()     {},
});
```

- 所有坐标已自动转换为 1280×720，直接使用
- 不要在 Chapter 中自己 `addEventListener`
- `onExit` 中调用 `game.input.setHandlers()`（无参 = 清空）

---

## 六、弹层规范

```javascript
// 结算弹层
game.overlay.show({
  type: 'complete',                               // 'prompt' | 'complete' | 'error'
  title: '记忆恢复了一些……',
  message: '但那抹色彩，终究会慢慢褪去……',
  buttons: [
    { text: '继续下一章节', action: () => game.chapterManager.next() }
  ]
});
```

**弹层铁律：**
- 全屏半透明黑色遮罩 + 居中圆角卡片
- 同时只允许一个弹层处于激活态
- 结算弹层必须有 "下一步" 按钮
- 按钮文字不使用 "游戏/通关/胜利"

---

## 七、命名约定

| 类别 | 规则 | 示例 |
|------|------|------|
| 文件名 | 小写 + 下划线 | `ch02_puzzle.js`, `chapter_manager.js` |
| 类名 | PascalCase | `Chapter02`, `ChapterManager` |
| 常量 | UPPER_SNAKE | `DESIGN_W`, `DESIGN_H`, `PASS_SCORE` |
| localStorage key | `ye_v1_` 前缀 | `ye_v1_progress`, `ye_v1_settings` |
| 用户可见文案 | 不用 "游戏" 字眼 | `"继续下一章节"` 而非 `"下一关"` |

---

## 八、代码注意事项

- 不碰 DPR，不调 `canvas.width = xxx * dpr`（入口统一处理）
- 不自己调 `requestAnimationFrame`（走 Game 主循环的 `update`）
- 不自己 `addEventListener`（走 `InputManager.setHandlers`）
- 不在 Chapter 中创建 DOM 元素
- 图片路径全部用相对路径，不写死绝对路径

---

## 九、开发期 → 上线打包

开发期用 ES Modules（`import/export`），上线时用 `build.js` 拼接为单文件：

```
开发时：
  浏览器打开 index.html（需要本地服务器，因为 ES Modules 不支持 file://）

上线打包：
  node build.js → build_out/index.html（单文件，可直接打开或上传）
```

`build.js` 做的事：把所有 JS 文件按顺序拼接 → 去掉 `import/export` 行 → 嵌入 `<script>` 标签。

---

## 十、自检清单（上传前逐项勾）

- [ ] zip 解压根目录直接可见 `index.html`
- [ ] 零网络请求，零外部资源
- [ ] 未使用 `alert/confirm/prompt/print`
- [ ] 所有弹层为 Canvas 自绘
- [ ] 用户可见文案无 "游戏" 字样
- [ ] 横屏满铺无黑边，竖屏出旋转提示
- [ ] 全局 `try/catch` 错误兜底
- [ ] localStorage key 带 `ye_v1_` 前缀
- [ ] zip < 8MB
- [ ] 无 `__MACOSX` / `.DS_Store`
