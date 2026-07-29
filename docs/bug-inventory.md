# 卡关与 Bug 清单（Phase 1 诊断产出）

诊断日期：2026-07-29（fix/stability 分支，基线 438b902）
方法：10 章代码静态审读 + Playwright 运行时逐章巡检（switchTo → 渲染观察 → forceComplete → overlay 点击推进）
运行时结果：10 章加载/渲染 **0 控制台报错**，强推链 ch01→ch10 全通，截图存 `test-results/phase1_chXX.png`

---

## P0 · 硬卡关（真实玩家无法通关）

### P0-1 ch08 签字关：提交/清除按钮永远点不到 ⛔
- 文件：`src/chapters/ch08_sign.js:137-146`
- 根因：`handleDown` 在 `phase==='writing' && !passed` 时无条件开始笔画并 `return`，`checkButtonClick` 永远不会执行。点按钮 = 落一个 1 点的笔画（<4 点被丢弃），按钮无任何响应
- 后果：`submit()` 永不可达 → `_completed` 永不置真 → **玩家永久卡在签字阶段**（这极可能就是用户反馈"卡关"的主要来源）
- 修法方向：handleDown 先判按钮区命中（按钮区坐标固定在右下角），未命中才开始笔画

## P1 · 严重体验问题

### P1-1 ch07 完成后从不写存档
- 文件：`src/chapters/ch07_night.js:173-179`
- ch07 是全部 10 章中唯一没有调用 `markChapterComplete` 的章节
- 后果：① 打完 ch07 刷新 → 回退到 ch06；② ch10 终章报告页读 `completed[]`，ch07 永远显示未完成
- 修法方向：`_complete = true` 处补 `markChapterComplete(7, 62)`（记忆值介于 ch06=52 和 ch08=72 之间，按曲线定）

### P1-2 进度恢复回退一章
- 文件：`src/main_new.js:186-195` + `src/core/ProgressStore.js:28`
- `markChapterComplete(N)` 存 `chapter=N`（已完成的章），重载后 `startChapter = chN` → 玩家每次刷新都要**重打刚打完的那一章**
- 修法方向：恢复时取 `min(N+1, 10)`，或存档时存下一章编号

### P1-3 ch05/ch06 记忆百分比文案与存档不一致（审查报告已知）
- ch05：存 memory=40，overlay 显示"记忆解锁 35%"（运行时已实证）
- ch06：存 memory=52，显示"记忆解锁 45%"
- 修法方向：统一为实际值，或改纯叙事文案

### P1-4 ch08 签名判定阈值过高（软卡关，待 P0-1 修复后实测）
- 文件：`src/chapters/ch08_sign.js:223-255`，`PASS_SCORE=80`
- 启发式笔画分类器要求 ~8 笔且左右半区含横/竖/折，普通玩家极难达标；第 5 次失败才出提示
- 修法方向：降阈值 / 减少必需笔画 / 失败 2 次即给强提示或跳过入口

## P2 · 结构风险与质量问题

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| P2-1 | 单图加载失败 = 全游戏白屏 | `core/Loader.js:13` + `main_new.js` boot catch | Promise.all 一图 reject 即整体失败，只显示"出错了"。**美术替换期间高危**（换图手滑即全黑）→ Phase 3 必修：失败降级为占位图 |
| P2-2 | `Overlay.hide()` 回调 `currentChapter.onEnter()` | `core/Overlay.js:27` | ch08/ch10 的 onEnter 非幂等（重置 phase）。当前未触发实际 bug，属结构隐患 → Phase 3 改为恢复输入 handler 专用方法 |
| P2-3 | ch02 构造函数直接读 `game.images.puzzle.width` | `chapters/ch02_puzzle.js:25` | 图缺失时 activate 崩溃冻结。P2-1 修复后此问题需一并防御 |
| P2-4 | DebugAPI inspect 大数组输出不可控 | `dev/DebugAPI.js` | 审查报告已知，仅调试体验 |
| P2-5 | 3 个测试失败（缺 Echoes dist 产物） | `rendered-html.test.mjs` / `puzzleLayout.test.js` | 与主线无关，标 skip |
| P2-6 | ch03 终点判定需精确落在半径 50 内 | `ch03_mazeLayout.js:88-92` | 可重试非死锁；若玩家反馈迷宫难通过再调 |

## 各章健康总览

| 章节 | 运行时渲染 | isComplete 可达性 | 存档 | 结论 |
|------|-----------|------------------|------|------|
| ch01 | ✅ 0 错 | ✅ 3 击/点镜可达 | ✅ (1,5) | 健康 |
| ch02 | ✅ | ✅ 拼图完成可达 | ✅ (2,15) | P2-3 隐患 |
| ch03 | ✅ | ✅ 画线可达 | ✅ (3,22) | P2-6 偏难 |
| ch04 | ✅ | ✅ 点电话→手环 | ✅ (4,30) | 健康 |
| ch05 | ✅ | ✅ 门槛偏高可达 | ✅ (5,40) | P1-3 文案 |
| ch06 | ✅ | ✅ 操作繁琐可达 | ✅ (6,52) | P1-3 文案 |
| ch07 | ✅ | ✅ 60s 超时兜底 | ❌ **无存档** | P1-1 |
| ch08 | ✅ | ⛔ **提交不可达** | ✅ (8,72)* | **P0-1** |
| ch09 | ✅ | ✅ 拖 5 音符可达 | ✅ (9,85) | 健康 |
| ch10 | ✅ | 终章设计不推进 | reset 入口 | 健康 |

\* ch08 存档代码存在但因 P0-1 永不执行

## 修复顺序建议（Phase 2 执行序）

1. **P0-1** ch08 按钮命中优先于笔画（一处改动，立刻解卡）
2. **P1-1** ch07 补存档 + **P1-2** 恢复不回退（两处小改，一起回归）
3. **P1-3** 文案统一（纯文案）
4. **P1-4** 签名阈值实测调参（依赖 1）
5. **P2-1/2/3** 结构加固（归入 Phase 3，独立 commit）

每项一个 commit，改完跑 `test-results/phase1-runtime-check.cjs` 回归 + 受影响章节手测。
