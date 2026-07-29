# 《昨日重现》Echoes_of_Yesterday_New — 代码审计报告

> 审计时间：2026-07-29 16:41  
> 审计对象：工作区根目录（= 仓库 `Mrs-Zhang-0817/Echoes_of_Yesterday_New` 的本地副本）  
> 审计方式：直接读取源码 + 构建产物（`build_out/index.html`）+ 交叉比对本地文档（`docs/code-review-report.md`、`plan-review-2026-07-29.md`、`cur-ch2-fix-log.md`、`unified-tech-spec-v1.0.md`、`DEVELOPMENT_STANDARD.md`、`project-context.md`）  
> 结论：**当前提交（"统一Chapter架构 + Ch2/Ch3/Ch8整合"）的产物无法正常运行**——核心渲染/调度循环 `Game.js` 仍停留在旧的 `SceneManager` 接口，而入口只创建了 `ChapterManager`，导致启动即崩溃；即使修好循环，完成结算的 `Overlay` 也从未被渲染或接管输入，ch02/ch03/ch08 均会卡死在结算。

---

## 一、🔴 阻断级问题（产品跑不起来 / 必卡死）

### B1. `Game.js` 未迁移到 `ChapterManager`，启动即崩
- **现象**：`build_out/index.html` 一打开就白屏/冻结。
- **根因**：`src/core/Game.js` 的 `loop()` 仍调用旧接口：
  - `this.game.sceneManager.update(dt)`（Game.js:18）
  - `this.game.sceneManager.currentScene?.render(...)`（Game.js:20）
  - `this.game.sceneManager.renderTransition(...)`（Game.js:21）
  
  但 `src/main_new.js`（构建入口）只创建了 `game.chapterManager`（main_new.js:97），**从未创建 `game.sceneManager`**。且 `ChapterManager` 根本没有 `currentScene` 属性、也没有 `render()` 方法。
- **实证**：`grep` 构建产物，`sceneManager` 出现 3 次（全在 Game.js），`chapterManager` 9 次。运行到首帧 rAF 即 `TypeError: Cannot read properties of undefined`。
- **连带缺失**：新架构下 `Chapter` 的 `render(ctx)` 与 `Overlay.render()` **从未被任何地方调用**——渲染管线整体没接通。

### B2. `Overlay` 结算层是死代码（不可见、点不动）
- `src/core/Overlay.js` 的 `show()` 只把配置存进 `this.active`，**从不调用 `game.input.setHandlers` 接管输入**；同时 `Game` 循环也从不调用 `overlay.render()`。
- 结果：`ChapterManager.update()` 检测到 `isComplete` 后会 `overlay.show(...)` 并置 `phase='blocked'`，但用户**既看不到结算卡片，也点不了"继续下一章节"**。
- 影响：ch02、ch03 完成后软锁死。

### B3. ch08 完成后不推进，也软锁
- `src/chapters/ch08_sign.js`：完成后 `this._completed = true`，但 UI 上只有"再写一次"→ `resetAll()`（ch08_sign.js:201-204），**从不调用 `game.chapterManager.next()`**。
- 同时它自带 `renderOverlay` + `checkButtonClick` 自己画弹层，**绕过了统一的 `Overlay` 系统**（违反规范 §4.5）。结果：ch08 能玩能判，但永远停在"辨认成功"循环，无法进入下一章。

---

## 二、🟡 高优先级（功能/架构缺陷）

### H1. 只实现 3/10 章，无其余 7 章骨架
- 仅 `ch02_puzzle / ch03_maze / ch08_sign` 注册；`next()` 链路为 ch02→ch03→ch08。
- 缺 ch01/04/05/06/07/09/10 的占位/骨架，**无法实现"1→10 全程可导航"**。
- 直接违反 `plan-review-2026-07-29.md` **R4**（要求第一天就注册全部 10 章骨架，占位章节也有完整文案演出）。

### H2. 进度恢复无兜底，老用户可能白屏
- `main_new.js:107-109`：`saved.chapter` 若为 5/6/7/9/10 等未注册章 → `switchTo('ch05')` 因 `registry.has` 为 false 静默返回 → `currentChapter` 为 null → 空白屏。
- 应 `clamp` 到最近已注册章或强行回退 ch02。

### H3. 源码/构建产物漂移，重建不可靠
- 构建脚本 `build.cjs` **只写 `build_out/index.html`，不拷贝资源**；`build_out/assets/images/` 是手工镜像。
- 源码 `assets/images/` 中 `scene_maze_map.png` **不存在**（构建产物里却有），且混有损坏/冗余文件（见 L2）。`node build.cjs` 从干净源码重建后，引用 `scene_maze_map.png` 会 404。
- 需要把"资源拷贝"纳入 `build.cjs`，或明确 `build_out/assets` 的来源，消除漂移。

---

## 三、🟢 中低优先级（规范偏离 / 代码卫生）

### L1. 双线重复代码未清理（老问题复发）
- `src/scenes/` 与 `src/chapters/` 完全重复：`scenes/puzzleLayout.js`≡`utils/puzzleLayout.js`、`scenes/sceneUtils.js`≡`utils/sceneUtils.js`（md5 一致）。
- `src/main.js`（旧 Scene 入口）、`src/core/SceneManager.js`、`dist/`（旧 SceneManager 构建）均未被 `build.cjs` 使用，是死代码。
- 这正是 `plan-review` **R5**（单文件+并行+无版本控制=互相覆盖）担心的"双线并存"问题，依旧存在。

### L2. 多份入口 HTML 漂移，上传以哪份为准不明
- 根 `index.html` / `whiteboard.html` / `sign_to_whiteboard.html` / `dist/index.html`（旧）/ `build_out/index.html`（新）共存。
- 规范唯一产物应为 `build_out/index.html` + `assets/images/`，但源码目录里还有多份，发布时极易传错（呼应 `plan-review` **R11**）。

### L3. 源码 `assets/images/` 含 22MB+ 冗余/损坏文件
- 实测 10 个文件约 25MB：`puzzle_img.png`（损坏，缺 IEND，违反 `plan-review` **R9** 清理要求，仍保留）、`拼图.png`、`桌面.png`、`scene_room.jpg`、`scene_desk.jpg`、`tmp_客厅场景底图.png` 等大量未引用副本。
- 注意：实际构建产物 `build_out` 已裁剪，仅 7.1MB（<8MB，合规），所以**线上包体积没问题**，问题在源码卫生与重建可复现性。

### L4. 文档 + 代码对 localStorage key 自相矛盾
- `DEVELOPMENT_STANDARD.md` 要求前缀 `ye_v1_`；`unified-tech-spec-v1.0.md` §4.4 却用 `new ProgressStore('ye_v1')`（key=`ye_v1`）。
- `main_new.js` 用 `'ye_v1_progress'`（符合前者，但与后者不一致）。`ProgressStore` 直接把传入串当 key——若有人按 tech-spec 传 `'ye_v1'`，会另开一份进度，互相看不见。

### L5. `data/chapters.json` 缺失，章节元数据硬编码
- 规范 §4.1 要求 `src/data/chapters.json`（标题/文案/记忆值），实际 `src/data/` 为空，记忆值（15/22/72）散落在各章 `markChapterComplete(...)` 里，未集中管理。

### L6. `Loader` 无失败重试
- 规范 §3.3 要求"失败重试 1 次 → 自绘占位"。当前 `Loader.loadImages` 任一图失败即 `Promise.all` 整体 reject → boot 直接"出错了"。（首屏还强耦合全部 3 张图，一张挂全崩。）

### L7. ch08 `update` 中 `totalDT` 被重复累加
- `ch08_sign.js:277` 已 `this.totalDT += dt`，writing 分支 `:299` 又 `this.totalDT += dt`。当前 `totalDT` 未参与任何判定（计时只看 `elapsed`），属冗余；建议删掉一处避免后续误用。

---

## 四、值得肯定的地方（别只看见问题）

- **ch02 拼图实现质量高**：离屏 Canvas 预生成灰度替代 `ctx.filter`（合规）、拖拽 5px 阈值 + 仅松手吸附 + 移动端路径磁吸、非整除原图整数切片、DPR/横屏适配、Pointer Capture 全部到位——这是 `cur-ch2-fix-log.md` 里反复修复沉淀下来的成果。
- **新代码严格守规**：无 `alert/confirm/prompt`、无网络请求、无 `ctx.filter`；`navigator.vibrate` 均 `try/catch` 包裹；`InputManager` 坐标转换/手势/上下文菜单阻止完善。
- **架构方向对**：`Chapter` 接口、`ChapterManager`、`Overlay`、`ProgressStore` 的抽象设计合理，修复 B1/B2 后即可跑通。
- **构建产物体积合规**：`build_out` 7.1MB < 8MB，zip 根目录直见 `index.html`。

---

## 五、修复建议（按优先级）

| 序 | 动作 | 关键文件 |
|----|------|----------|
| 1 | **重写 `Game.loop`** 改为驱动 ChapterManager：`chapterManager.update(dt)` → `chapterManager.currentChapter?.render(ctx)` → `chapterManager.renderTransition(ctx)` → `overlay.render(ctx)` | `src/core/Game.js` |
| 2 | **接通 Overlay**：`Overlay.show()` 内 `game.input.setHandlers(this._inputHandlers)`；`Overlay.hide()` 内恢复章节 handler | `src/core/Overlay.js` |
| 3 | **ch08 完成后调用 `game.chapterManager.next()`**，并删除自带 overlay、统一走 `Overlay` | `src/chapters/ch08_sign.js` |
| 4 | **进度恢复兜底**：`switchTo` 前 `clamp` 到最近已注册章 | `src/main_new.js` |
| 5 | **注册 7 个占位章节**（ch01/04/05/06/07/09/10），保证 1→10 可导航 | `src/main_new.js` + `src/chapters/` |
| 6 | **清理死代码**：删 `src/main.js`、`src/core/SceneManager.js`、`src/scenes/`、`dist/`；在 `build.cjs` 中加资源拷贝步骤，消除源/产物漂移 | 多文件 |
| 7 | **统一 localStorage key**（两份文档对齐为 `ye_v1_` 前缀）并清理 `assets/images/` 冗余/损坏文件 | `docs/*`、`assets/` |
| 8 | **补 `Loader` 重试 + 占位图**；删 ch08 `totalDT` 重复累加 | `src/core/Loader.js`、`ch08_sign.js` |

> 最致命的 B1+B2 本质是"提交了未打通的架构"——和 `code-review-report.md`（旧仓库）指出的"架构未对接"是**同一类失误的重复发生**。建议把"改了核心接口必须跑一次 `node build.cjs` + 桌面/真机冒烟"列为提交前硬卡点。
