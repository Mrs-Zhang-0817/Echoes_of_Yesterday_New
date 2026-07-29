# Ch2 拼图关卡修复记录

**日期**：2026-07-28  
**线上地址**：https://wcnzcbnb3bym.aiforce.cloud/app/app_17b0s9c0h90  
**部署平台**：飞书妙搭 (Spark / Miaoda)

---

## 修复背景

初始部署后两个核心问题：
1. **白屏** — loading 遮罩层未隐藏 + 妙搭不支持 ES Modules（`<script type="module">`）
2. **手机端体验极差** — 无横屏适配、拖拽手感稀碎、高 DPR 屏幕模糊

## 修复清单

### 致命 Bug（3 项）

| Bug | 原因 | 修复 |
|-----|------|------|
| 场景切换永久卡死 | `float === 1` 浮点数永远无法精确等于 1 | 改为 `>= 1` / `<= 0` |
| 拼图完成后有 1px 接缝 | 原图 1448px 不能被 3 整除，浮点坐标导致像素重叠 | 用 `Math.floor` 整数切片，前两行/列取 floor，余数归最后一行/列 |
| 弹飞碎片保持大尺寸 | `snapPieceToTarget` 把尺寸改成满格，弹飞时没恢复 | eject 时恢复 `looseWidth / looseHeight` |

### 交互手感（4 项）

| 问题 | 修复 |
|------|------|
| 吸附半径 50px 过大，碎片还没对准就"黏"上去了 | 降到 36px |
| 手指按下即进入拖拽，轻触也触发，误触多 | 加 5px 拖拽阈值，移动超过阈值才正式开始拖拽 |
| 移动中自动吸附，玩家失去控制感 | 改为松手时（pointerup）才判定吸附 |
| 悬停高亮太弱，看不出即将选中哪块 | 饱和度 0.45→0.55，glow 12→18 |

### 手机端（6 项）

| 问题 | 修复 |
|------|------|
| 无横屏适配，竖屏时画面极小 | 竖屏时全屏遮罩提示「请将设备旋转至横屏」 |
| Retina 屏画面模糊 | `canvas.width/height` 乘 `devicePixelRatio`，`ctx.setTransform(dpr,...)` |
| iOS 长按弹出菜单 | `contextmenu` + `gesturestart/change/end` 全部 `preventDefault` |
| 双指缩放干扰拖拽 | `touch-action: none` on html/body/canvas |
| 页面可滚动 | `position: fixed` + `overflow: hidden` + `overscroll-behavior: none` |
| 底部安全区被遮挡 | `viewport-fit=cover` + `height: 100dvh` |

### 平台兼容（2 项）

| 问题 | 修复 |
|------|------|
| 妙搭托管不支持 ES Modules | 10 个 JS 文件合并为一个 `<script>` 标签，import/export 全部内联 |
| loading 遮罩不消失 | 加载成功后 `classList.add('hidden')`，出错也隐藏 |

### 其他（3 项）

| 改动 | 说明 |
|------|------|
| 场景过渡 | `switchTo` 允许覆盖 pending，避免快速点击丢失切换 |
| 拼图完成回调 | `game.onPuzzleComplete`，为后续衔接 Chapter Report 预留 |
| 呼吸动画与点击反馈分离 | Room/Desk 场景的 emphasis 改为独立脉冲衰减 |

## 代码变更文件

```
修改：index.html
修改：src/main.js
修改：src/core/SceneManager.js
修改：src/core/InputManager.js
修改：src/scenes/puzzleLayout.js
修改：src/scenes/Scene_Puzzle.js
修改：src/scenes/Scene_Room.js
修改：src/scenes/Scene_Desk.js
修改：src/scenes/sceneUtils.js
新增：.claude/skills/yesterday-puzzle/SKILL.md
新增：docs/cur-ch2-fix-log.md（本文件）
```

## Git 提交

已推送到 `Mrs-Zhang-0817/Echoes_of_Yesterday` 的 `main` 分支。

---

## 2026-07-28 回归审计（本地修复，待发布）

本轮复核发现上方历史记录中的三项修复没有完整落到当前工作区的源码和部署产物，已同时修复 `src/` 与 `dist/index.html`：

| 现象 | 根因 | 本轮修复 | 验证 |
|---|---|---|---|
| 横屏高 DPR 手机可能裁切或坐标错位 | Canvas backing store 使用了 CSS 显示尺寸，再叠加 `setTransform(dpr)` | backing store 固定为 `1280×720×DPR`，CSS 独立做等比缩放 | 静态检查 + 桌面浏览器运行 |
| 原图宽/高不能被 3 整除时，最后边缘像素丢失 | `getSourceRects` 收到的是向下取整后的单元尺寸，无法计算余数 | 改为接收原图宽高；最后一列/行取余数 | 新增非整除尺寸 source rect 覆盖测试 |
| 轻触靠近目标的碎片会被吸附 | `pointerup` 未检查是否真正越过拖拽阈值 | 仅当 `hasMoved` 为真时才在松手吸附 | 新增轻触不吸附测试 |

额外补齐：`pointercancel` 也释放 pointer capture，避免移动端取消手势后残留拖拽状态。

验证结果：`npm test` 7/7 通过；`dist/index.html` 内联脚本语法检查通过；本地静态部署产物在桌面浏览器中加载无 console error，且房间→桌面→拼图与实际拖放均正常。

**状态说明**：本轮没有执行妙搭发布，因此线上地址仍需在发布后按横屏真机清单复测，不能据此视为线上已更新。

---

## 2026-07-29 热修复：拼图黑边 / 底部黑块

| 现象 | 根因 | 修复 |
|---|---|---|
| 完成拼图后底部三格变黑，边缘出现黑线 | `puzzle_img.png` 缺失 PNG `IEND` 结束块，浏览器只能解码部分图像 | 改用并重新编码完整的 `scene_puzzle.jpg`，同时同步到 `dist/assets/images/` |
| 完整图片仍有细黑边 | 美术原图自带黑色哑边 | 切片统一采用 4:3 的 `{ x: 26, y: 20, width: 1396, height: 1047 }` 可视裁切区 |

验证：新增资源选择与裁切范围回归测试；`npm test` 8/8 通过；本地 Canvas 画面无黑条；已发布并通过线上响应确认。

---

## 2026-07-29 交互微调：恢复新手友好的吸附范围

将吸附半径从 36px 恢复为 50px。仍保留 5px 拖拽阈值和仅在松手时吸附的规则，因此手机与桌面端都会更容易归位，同时不会因轻触而误吸附。

---

## 2026-07-29 手机端路径磁吸（可回退）

- 新增 `mobileInstantSnap: true` 与 `touchSnapRadius: 96` 配置。
- 仅当 `pointerType === 'touch'` 且移动超过拖拽阈值时，检测拖动路径是否经过自己的目标区域；命中后立即归位并锁定，不等待松手。
- 鼠标和桌面端不进入这条路径，仍维持 50px 松手吸附。
- 关闭 `mobileInstantSnap` 即可回退手机端为原有松手吸附。

验证：新增手机路径命中自动归位、桌面路径经过不自动归位两条回归测试；`npm test` 10/10 通过。
