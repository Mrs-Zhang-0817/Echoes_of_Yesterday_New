---
source: docs/superpowers/plans/2026-07-30-canvas-report-and-narrative.md
date: 2026-07-30
status: planning
related: docs/ref/08-03-Ch4-Ch7-Ch8交互实现计划.md
---

# Canvas 报告与叙事整合计划

## 目标

将 UI v1.1 报告美术、飞书十章关键叙事和已完成的 Ch5 电梯改动整合进当前单 Canvas 游戏，并完成可验证的 100% 结局闭环。

## 约束

- 唯一仓库为 `Echoes_of_Yesterday_New.git`；绝不触碰 `Echoes_of_Yesterday/`
- 游戏保持单一 `#gameCanvas` 和 1280×720 横屏逻辑画布
- 报告资产按需加载，不加入首屏全量预加载清单
- 报告进度固定序列：`0→5→15→22→30→40→52→60→72→85→100`
- 不新增第三方依赖

## 9 个任务分解

### Task 1: 导入报告资产并建立 Canvas 报告渲染器

- 创建 `assets/images/report/ch01.png` … `ch10.png`
- 创建 `assets/images/report/button_continue.png`（透明按钮）
- 创建 `src/ui/ArtworkMemoryReport.js`
  - 支持 `open({ chapterNumber, memoryFrom, memoryTo, onContinue })`, `update(dt)`, `render(ctx)`, `handleDown(point)`, `isReady()`
  - Canvas 原生渲染，惰性加载图片
  - 1.8 秒进度动画插值，减少运动时跳过动画
- 单位测试：`tests/artwork-memory-report.test.js`

### Task 2: 将普通章节结算接入报告渲染器

- 改 `src/core/Overlay.js`：`config.type === 'complete'` 时委托给报告渲染器
- 改 `src/core/ChapterManager.js`：从完成章采集 chapter number + 前后记忆值
- Overlay 保留传统卡片路径用于非 complete 类型

### Task 3: 合并临时 Ch5 向日葵电梯成果

- 改 `src/chapters/ch05_door.js`
- 创建 `assets/images/ch5_elevator_sunflower_panel.png`
- 点击中央向日葵热区 → 楼层上升动画（1-5F）→ 完成

### Task 4: 修正 Ch2/Ch3 的闪回节奏与叙事衔接

- Ch2 状态序：`completeHold → puzzleFadeOut → flashback → complete`
- Ch3 状态序：`successHold → routeFadeOut → cityFlashback → complete`
- 闪回帧交叉淡入（0.8~1.2 秒/帧），非硬切

### Task 5: 补齐 Ch4/Ch6 的关键物件和交互稳定性

- Ch4：使用 `ch4_police_03`（手环焦点）和 `ch4_police_08`（重逢焦点）
- Ch6：粒子配置扩大吸引半径（≥110），速度阻尼，稳定目标锁定（≥55）

### Task 6: 生成并接入三张叙事关键帧

| 文件 | 场景描述 |
|------|---------|
| `ch9_father_building_chime.png` | 年轻父亲制作金属风铃，温馨家庭环境 |
| `ch10_daughter_porridge_closeup.png` | 中年女儿端着粥，认出父亲的特写 |
| `ch10_father_daughter_embrace.png` | 父女拥抱高潮，晨光中的克制重逢 |

- 16:9 场景帧，无水印/文字/赛博/现代 UI
- 暖调低饱和水彩/旧照片视觉语言

### Task 7: 补齐 Ch7/Ch8 的可读链路与宽松通关

- Ch7 状态序：`nightNarrative → socialLights → flashlightSearch → hallucinationClear → doorOpen → complete`
- Ch8：暴露 `cameraPlaceholderRect`，接受"向阳"粗略笔画或挥手回退
- 不调用 `getUserMedia`，不请求摄像头权限

### Task 8: 重建 Ch9 为两段风铃互动，并实现 Ch10 终局

- Ch9 状态序：`intro → colorRebuild → flashback → rhythmGame → resolve → complete`
- Ch9 色块重构：4 色编码扭曲字形，拖入对应色轨吸附
- Ch9 音游：音符下落 → 点匹配管道 → Combo 累计 → 房间冷转暖
- Ch10 状态序：`porridge → montage → reunion → finalReport`
- Ch10 最终报告写入 `markChapterComplete(10, 100)`

### Task 9: 全流程验收、文档和提交准备

- 全自动化测试 + 浏览器端到端验收
- 截图覆盖：报告布局、闪回、Ch5 电梯、Ch6 粒子、Ch9 双段、Ch10 100%报告
- 更新描述文档，记录最终状态

## 报告进度固定序列

| 章节 | memoryFrom | memoryTo |
|------|-----------|----------|
| ch01 | 0 | 5 |
| ch02 | 5 | 15 |
| ch03 | 15 | 22 |
| ch04 | 22 | 30 |
| ch05 | 30 | 40 |
| ch06 | 40 | 52 |
| ch07 | 52 | 60 |
| ch08 | 60 | 72 |
| ch09 | 72 | 85 |
| ch10 | 85 | 100 |
