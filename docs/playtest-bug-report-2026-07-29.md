# 《昨日重现》1~10 关实测 Bug 报告与修改建议

> 2026-07-29 · 测试对象：`build_out/index.html`（`node build.cjs` 最新构建）
> 测试方法：① 3 路智能体并行逐行审查（core+ch01-03 / ch04-06 / ch07-10+构建链路）② Playwright 无头浏览器实机试玩（冷启动、逐章乱点乱拖 fuzz、强制完成链路、针对性复现），截图存 `/tmp/echo_playtest/shots/`，原始日志 `/tmp/echo_playtest/report.txt`

## 总体结论

- ✅ 好消息：冷启动正常、10 章全部可进入并渲染、全程 fuzz **0 条控制台报错**、ch01→04、ch08→10 完成链路可正常推进
- 🔴 坏消息：**第 8 关无法正常通关（必现）**、**ch05/06/07 通关即毁档（必现）**、完成弹层跨章节残留——这三个是发布阻断级

---

## 🔴 P0 阻断级（必修）

### 1. 第 8 关无法通关：提交按钮永远点不到 【实机实锤】
- 位置：`src/chapters/ch08_sign.js:135-143`
- 根因：`handleDown` 在 `phase==='writing' && !passed` 时直接落笔并 `return`，永远走不到 `checkButtonClick`。而"提交/清除"按钮和超时弹层、提示弹层的唯一消除入口都在 `checkButtonClick` 里。
- 实测：进入 writing 阶段，画满 6 笔合法笔画后点击提交按钮（1205,684）→ `attempts=0、passed=false`，**完全无响应**；超时弹层出现后连点各处也无法消除（`timeoutFired` 永不清零）。
- 修法：`handleDown` 开头先做按钮/弹层命中判断：
  ```js
  handleDown(point) {
    // 弹层优先消除
    if (this.timeoutFired || this.showHint) { this.checkButtonClick(point); return; }
    // 按钮区域优先（底部一条）
    if (point.y >= this.DH - 72 && this.checkButtonClick(point)) return; // checkButtonClick 需返回 true/false
    if (this.phase === 'writing' && !this.passed) { /* 落笔 */ }
  }
  ```

### 2. ch05/06/07 通关即毁档：整份进度被覆盖成一个字符串 【实机实锤】
- 位置：`ch05_door.js:229`、`ch06_table.js:172`、`ch07_night.js:184`
- 根因：`ProgressStore.save(data)` 是**全量覆盖**接口，三章却调 `progress.save('chXX_complete', true)` → localStorage 里整份 JSON 被写成 `"ch05_complete"` 字符串。
- 实测：先通关 ch02/ch03（`{"chapter":3,"memory":22,"completed":[2,3]}`），触发 ch05 完成 → 存档变成 `"ch05_complete"`，刷新后**从第 1 章重来**。
- 修法：三处统一改为 `this.game.progress.markChapterComplete(5, 40)` / `(6, 52)` / `(7, 60)`（数值对齐 ch10 的 CHAPTERS 表）。另建议给 `ProgressStore.save` 加参数类型断言防再犯。

### 3. 完成弹层每帧重复 show + 跨章节残留劫持输入 【实机实锤】
- 位置：`ch05_door.js:227-238`、`ch06_table.js:170-181`、`ch07_night.js:175-194`（自弹 overlay）；`src/core/Overlay.js:22-27`（hide 回调 onEnter）
- 根因链：① 三章在 complete 阶段**每帧**调 `overlay.show()`（无 `isActive()` 守卫）；② `Overlay.hide()` 会回调 `currentChapter.onEnter()` 重置章节；③ ChapterManager 又会因 `isComplete` 再弹一次通用弹层，与章节自弹的互相覆盖（Ch7 的"找到门锁"与通用"记忆恢复了一些……"标题互抢）。
- 实测：ch05 完成后点"继续下一章节"→ 已切到 ch06，但 ch05 的弹层**依然挂在屏幕上**继续劫持输入；再点一次可能触发 `next()` 直接跳过 ch06。
- 修法（推荐做减法）：**删掉三章的自弹 overlay 代码**，统一走 ChapterManager 的 `isComplete` 弹层（用 `completeTitle/completeMessage` 自定义文案）；`Overlay.hide()` 去掉 `onEnter()` 回调，改为只恢复输入 handler（可在 show 时保存 `game.input` 当前 handlers，hide 时还原）。

### 4. Ch4~7 完成状态未入库 → 终章报告显示未完成
- 位置：同问题 2 三处 + `ch04_police.js`（仅置 `_completed`，什么都没存）
- 后果：`ch10_report.js` 读 `progress.completed` 数组渲染 10 章清单，第 4~7 章永远显示未完成，"记忆恢复 100%"的核心叙事被击穿。
- 修法：与问题 2 一并修——四章统一 `markChapterComplete(n, 对应记忆值)`。

---

## 🟡 P1 体验级（强烈建议修）

### 5. 刷新后重玩已通关章节 【实机实锤】
- 位置：`ProgressStore.js:28`（`data.chapter = Math.max(..., chapterNum)` 存的是"已通关章"）+ `main_new.js:123`（恢复时直接进该章）
- 实测：通关 ch03 后刷新 → 从 ch03 重玩（应进 ch04）。
- 修法：`markChapterComplete` 里存 `data.chapter = Math.min(chapterNum + 1, 10)`，或恢复时 `+1`。二选一，别都改。

### 6. 终章"重新开始"跳过序章 【实机实锤】
- 位置：`ch10_report.js:90`：`switchTo('ch02')`
- 实测：点"重新开始"→ 直接进 ch02，跳过 ch01 序曲。
- 修法：改 `switchTo('ch01')`。

### 7. 记忆数值三套来源互相矛盾
- `data/chapters.json`、`ch10_report.js:3-14` 硬编码 CHAPTERS、各章 `markChapterComplete` 实际写入值（如 ch09 写 45 但 ch10 表里是 85）三者不一致，终章进度条与章节标签对不上。
- 修法：以 `ch10_report.js` 的表为准（5/15/22/30/40/52/60/72/85/100），全局 grep 校准；`chapters.json` 若无人消费建议直接删除。

### 8. 图片 404 时 1×1 占位图会让 ch02 每帧抛错冻屏
- 位置：`Loader.js:29-41`（占位图 1×1）→ `puzzleLayout.js:21`（切片宽高=0）→ `ch02_puzzle.js:231`（`getImageData(0,0,0,0)` 抛 IndexSizeError）
- 修法：占位画布改成 1280×720 纯色；`getImageData` 前加宽高>0 守卫。

### 9. `ctx.roundRect` 无 polyfill，旧安卓 WebView 全崩
- 位置：`sceneUtils.js`、`Overlay.js:73/115`、`ch02_puzzle.js:257` 等多处
- 修法：入口处加 polyfill（十行以内），或统一走 `sceneUtils.roundedRect` 手绘路径版。

### 10. ch05 电梯按钮悬停反馈失效
- 位置：`ch05_door.js:213`（update 每帧 `hoveredBtn=-1`）而 gating2 的 handleMove 从不写它
- 修法：gating2 阶段 handleMove 里按 `getButtonRect` 命中写 `hoveredBtn`，删掉每帧重置。

### 11. Ch8 提交阈值错位：5 笔必败还计次
- 位置：`ch08_sign.js:201`（`<5` 拦截）vs `:218`（`matchSignature` 要求 `>=6`）
- 后果：恰好 5 笔提交 → 必失败且白白消耗 attempts（共 5 次机会）。
- 修法：`:201` 改 `< 6`。

### 12. 多指触控状态脆弱（ch05/ch06/ch08）
- 单值 `dragging/isLocking/lockTargetIdx`，第二根手指会切换锁定目标、残留 `lockProgress`；ch06 `fingerX/Y` 在 up/cancel 不复位。真机双指误触概率不低。
- 修法：记录首个 `pointerId`，忽略其余指针；up/cancel 时复位 finger 坐标。

---

## 🟢 P2 卫生级（有空再修）

13. **根目录 `index.html` 仍加载旧入口 `src/main.js`**（只有 Ch2 旧版）——本地 `npx serve .` 打开的不是全章节版本，容易误导联调；建议改为 `src/main_new.js` 或删除旧入口。
14. `build.cjs:47-48` export 剥离正则脆弱：一旦有人写 `export default` 会产出 `default class` 语法错误的产物；建议收紧正则或换 esbuild。
15. 孤儿代码：`src/scenes/Scene_Room.js:26`、`Scene_Desk.js:26` 引用不存在的 `game.images.room/desk`；`ch02_puzzle.js:5-19` `createGrayscaleImage` 死代码；`Loader.js:39-40` `_displayW/H` 设而未用。
16. ChapterManager 末章防御：`next()` 在最后一章静默失败 + `transition.phase='blocked'` 永不解除。当前被 ch10 的 `isComplete→false` 规避，但属于地雷——任何人给 ch10 加完成态就会卡死。建议 `next()` 加末章分支。
17. 完成态渲染空窗：ch05/06 完成后到弹层出现有 2.5s 画面冻结，建议补一个淡出/文字过渡。
18. 文案合规 ✅：全部章节未发现"游戏"字样；资源覆盖 ✅：build_out 三张图与所有引用匹配（迷宫图只在 build_out 有，`assets/images/` 源目录缺 `scene_maze_map.png`，重构建依赖 build_out 里的旧拷贝，建议把图补回源目录）。

---

## 修复优先级排序（建议一次提交一组）

| 批次 | 内容 | 涉及文件 |
|------|------|----------|
| ① 通关阻断 | Bug 1（Ch8 按钮）+ Bug 11（阈值） | ch08_sign.js |
| ② 存档系统 | Bug 2+4+5+7（毁档/入库/恢复点/数值统一） | ch04~07、ProgressStore.js |
| ③ 弹层统一 | Bug 3（删自弹、修 hide、统一 ChapterManager 弹层）+ Bug 16 | ch05/06/07、Overlay.js、ChapterManager.js |
| ④ 兼容加固 | Bug 8（占位图）+ Bug 9（roundRect polyfill）+ Bug 12（多指） | Loader.js、入口、各章 |
| ⑤ 体验修补 | Bug 6+10+13+17 | ch10、ch05、index.html |

修完 ①②③ 后建议重跑一遍全流程实测（脚本已留存：`/tmp/echo_playtest/playtest.mjs`、`playtest2.mjs`，可直接复用）。
