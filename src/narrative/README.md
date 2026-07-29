# 叙事「活动 (Activity)」层

本目录存放游戏中**可独立抽离**的叙事呈现模块，与每章的「互动逻辑」解耦。
目的：让协作者可以并行实现同一段叙事的不同表现形式，之后替换文件 / import 即可择优保留，不影响章节互动。

## 统一接口（duck-typed，无需强制继承）

任何活动模块导出一个类，至少实现以下方法（presentational 活动可不实现输入方法）：

| 方法 | 必填 | 说明 |
|---|---|---|
| `start(payload)` | 是 | 进入活动，payload 为上下文（如 `frames`、`chapterNumber`、`memoryFrom/To`、`images`）。 |
| `update(dt)` | 是 | 每帧推进，单位秒。 |
| `render(ctx, width, height)` | 是 | 在 1280×720 逻辑画布上绘制。 |
| `handleDown(point)` / `handleMove` / `handleUp` / `handleCancel` | 否 | 需要交互的活动实现（point 为设计坐标）。 |
| 完成信号 | 是（二选一） | 暴露 `get isFinished()` 返回 true，或 `start` 时传 `onComplete` 回调。 |

章节只负责**驱动**活动：在对应 phase 里 `new XActivity(game)` → `start(payload)` → 每帧 `activity.update(dt)` / `activity.render(ctx,w,h)` → 输入转发 `activity.handleDown(point)` → 活动完成后切到下一 phase。

## 现有活动
- `FlashbackActivity` — 通用帧序列交叉淡入（Ch2 5 帧 / Ch3 4 帧 / Ch9 crafting 闪回复用）。
- `MontageActivity` — 终章无操作蒙太奇（Ch10）。
- `src/ui/ArtworkMemoryReport` — 章节记忆报告（也是活动，接口为 `open/update/render/handleDown/isReady` + `onContinue`）。

## 如何替换 / 新增一种表现形式
1. 在 `src/narrative/` 新建 `XxxActivity.js`，实现上述接口。
2. 在章节文件中把 `import { FlashbackActivity }` 换成你的类即可，章节其余代码不变。
3. 旧文件保留不删，便于对比择优。
