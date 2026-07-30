---
source: /Users/onebilion/One Billion/当前项目/亡羊补牢/.claude/skills/yesterday-puzzle/SKILL.md
date: 未标注（Skill 定义，持续更新）
status: 有效（Ch2 拼图关卡全流程参考）
---

# 拼图项目技能文档

> 对应 `yesterday-puzzle` Skill，覆盖 Ch2 拼图关卡的完整开发/部署/调试图谱。

## 项目定位

《昨日重现》(Echoes of Yesterday) 是抖音大区赛黑客松作品，纯 HTML5 Canvas 第一人称阿尔茨海默叙事互动游戏，10 章约 20 分钟。本 Skill 聚焦 **Ch2 拼图关卡**。

## 核心技术决策

### 1. Canvas 分辨率与缩放

- **逻辑分辨率**：1280×720（16:9），所有游戏坐标以此为准
- **DPR 适配**：Canvas 物理像素 = 逻辑分辨率 × `devicePixelRatio`，CSS 缩放至显示尺寸；使用 `ctx.setTransform(dpr,0,0,dpr,0,0)` 消除模糊
- **等比缩放**：`Math.min(w/1280, h/720)` 保持比例，居中显示

### 2. 横屏适配（三层策略）

1. **强制横屏遮罩**：竖屏时全屏半透明提示
2. **orientationchange 监听**：延迟 300ms 重新计算尺寸
3. **CSS 防护**：`touch-action: none` + `overscroll-behavior: none` + `position: fixed` + `user-select: none`

### 3. Pointer Events 统一输入

- 一套 `pointerdown/move/up/cancel` 覆盖 mouse/touch/pen
- `setPointerCapture`：手指滑出 canvas 事件不丢失
- `pointercancel` 必须处理：来电/系统手势 → 重置拖拽状态
- `contextmenu` 阻止 + `gesturestart/change/end` 阻止

### 4. 拼图交互参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 吸附半径 | 50px | 归位判定距离 |
| 手机路径磁吸 | 96px | 手指路径经过目标即刻归位 |
| 拖拽阈值 | 5px | 过滤手指自然抖动 |
| 碎片缩放（散落区） | 0.7x | 与归位区区分 |
| 弹飞动画 | 0.32s ease-out-back | 弹性不拖沓 |
| 高亮响应 | dt*12 渐变 | 约 5 帧达高亮（60fps） |

### 5. 拼图切片（防接缝）

原图 1448×1086 不能被 3 整除，浮点坐标导致 1px 缝隙。修复方案：`Math.floor(width/3)` 整数取整，前两列/行各取 floor 像素，余数全给最后一列/行。

### 6. 场景过渡

淡入淡出 300ms（黑色遮罩 alpha 渐变），关键修复：`alpha >= 1` 和 `alpha <= 0` 使用 `>=`/`<=` 而非 `===`。

## 已知 Bug 修复清单

| # | Bug | 修复 |
|---|-----|------|
| 1 | 场景过渡永久卡死 | `===` → `>=` / `<=` |
| 2 | 拼图切片 1px 接缝 | 浮点 source 坐标 → 整数像素 |
| 3 | 弹飞碎片保持大尺寸 | eject 时恢复 `looseWidth/looseHeight` |
| 4 | 吸附半径过大 50px | 降低到 36px（后续调整为 50px 更宽容） |
| 5 | 拖拽无阈值误触多 | 添加 5px dragThreshold |
| 6 | 无横屏提示 | 创建竖屏遮罩 + orientationchange 监听 |
| 7 | DPR 不处理 Retina 模糊 | CSS 缩放 + canvas 物理像素 + setTransform |
| 8 | iOS 长按菜单/手势冲突 | contextmenu/gesturestart 阻止 + touch-action:none |
| 10 | hoveredPiece 高亮太弱 | 饱和度 0.45→0.55，glow 12→18 |
| 11 | 场景点击反馈公式奇怪 | emphasis 改为脉冲衰减 |
| 12 | 拼图完成无回调 | `game.onPuzzleComplete` 回调 |
| 13 | canvas 缺少 touch-action:none | CSS 补充 |

## 部署流程

### 本地预览

```bash
cd 抖音大区赛/dist
python3 -m http.server 8080
```

### 妙搭（Spark/Miaoda）部署

- 打包为单文件 HTML（ES Module → 内嵌 script），图片保持外部引用
- 部署命令使用 `lark-cli` 发布到 `app_17b0s9c0h90`
- 部署地址：`https://wcnzcbnb3bym.aiforce.cloud/app/app_17b0s9c0h90`

### ES Module 合并规则

妙搭托管不支持 ES Modules。合并规则：import 语句注释掉、export 关键字移除、按依赖顺序拼接（Game → Loader → sceneUtils → puzzleLayout → InputManager → SceneManager → Scene_Room → Scene_Desk → Scene_Puzzle → main）。

## 测试方法

### 单元测试

```bash
node --test tests/puzzleLayout.test.js
```

覆盖：碎片创建、source rect 全覆盖、轻触不吸附、手机路径磁吸、吸附判定、弹飞碰撞检测。

### 本地冒烟测试

使用 Headless Chrome 截图 + Python 像素分析验证渲染完整性。

### 发布前验收矩阵

1. `npm test` 通过
2. 桌面 1280×720 无 console error，拼图链路可达
3. 横屏 844×390/DPR 2 无裁切；竖屏显示旋转提示
4. `dist/index.html` 语法检查 + 本地复测后发布

## 约束与陷阱

- 妙搭不支持 ES Modules → 必须打包
- 图片必须外部引用（base64 超 10MB 限制）
- iOS Safari 不支持 `screen.orientation.lock` → 竖屏遮罩兜底
- `ctx.filter` 部分旧浏览器不支持
- 图片尺寸不能被 3 整除 → 必须整数像素切片

## 跨端回归经验（重要）

- 本地开发入口与妙搭单文件脚本必须同步修改
- 未执行发布和线上复测前，不能称"线上已修复"
- InputManager 使用 `getBoundingClientRect()` 映射回 1280×720，不能直接使用 `offsetX/offsetY`
- Ch2 当前使用重新编码的 `scene_puzzle.jpg`，裁掉黑色哑边区域 `{ x: 26, y: 20, width: 1396, height: 1047 }`
- 手机端 `mobileInstantSnap` 与桌面端松手吸附行为不同，不能共用

> 交叉引用：项目整体状态见 `01-02-PROJECT_STATUS-项目状态.md`；详细 Bug 清单见 `docs/bug-inventory.md`。
