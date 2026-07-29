# 《昨日重现》美术视觉排查与修复任务书

> **目标：** 让 Codex 无需人工干预，自动完成所有美术资源的视觉验证、问题发现和修复。
> **前置：** 已启动本地服务器 `http://127.0.0.1:3001/`，项目已 clone 到本地。
> **截图基准目录：** `verified_screenshots/`（已包含 72 张各章节阶段截图，供参考对比）

---

## 一、排查范围

共 74 张图片，分 3 类处理：

| 类别 | 数量 | 处理方式 |
|------|------|---------|
| **A 类：需要视觉比对** | 36 张 | 需要用浏览器打开、截图，肉眼或工具比对原图与游戏渲染效果 |
| **B 类：需要交互触发** | 6 张 | 需要鼠标交互才能显示在画布上 |
| **C 类：仅预加载未渲染** | 22 张 | 文件存在即可，不需比对 |
| **记忆报告 Overlay** | 12 张 | 已完成截图，需检查叠层是否正确 |

---

## 二、前置准备

### 2.1 启动服务器（如果未启动）
```bash
cd /Users/onebilion/One\ Billion/当前项目/抖音大区赛
python3 -m http.server 3001 &
open http://127.0.0.1:3001/
```

### 2.2 安装依赖
```bash
npm install playwright
npx playwright install chromium
```

### 2.3 准备素材目录
```bash
mkdir -p visual_check_report
```

---

## 三、A 类：全屏背景视觉比对（11 张）

### 操作步骤

对每一张背景图：

1. 在浏览器打开 `http://127.0.0.1:3001/index.html`
2. 在 DevTools Console 中执行章节跳转
3. 观察全屏画面，与原图进行以下维度的判断

### 3.1 全屏背景清单

| # | 图片键 | 文件 | 章节 | 跳转命令 | 关注点 |
|---|--------|------|------|---------|--------|
| 1 | `mainMenuBg` | `assets/images/main_menu_bg.jpg` | ch01 | `__debug__.switchTo('ch01')` | 5120x2880 缩到 1280x720，检查是否变形 |
| 2 | `ch4_police_01` | `assets/images/ch4_police_01.png` | ch04 | `__debug__.switchTo('ch04')` | 1672x941 vs 1280x720 缩放比例 |
| 3 | `ch5_bg_elevator` | `assets/images/ch5_bg_elevator.png` | ch05 | `__debug__.switchTo('ch05'); let c=__debug__.inspect(); c.chapterDetail.phase='gating2'` | 电梯内部，推进到gating2阶段 |
| 4 | `ch6_bg_diningroom` | `assets/images/ch6_bg_diningroom.jpg` | ch06 | `__debug__.switchTo('ch06'); let c=__debug__.inspect(); c.chapterDetail.phase='gating2'` | 餐桌背景，多图叠层 |
| 5 | `ch7_bg_bedroom_night` | `assets/images/ch7_bg_bedroom_night.jpg` | ch07 | `__debug__.switchTo('ch07')` | 卧室夜景，72%暗色遮罩是否过暗 |
| 6 | `ch8_corridor` | `assets/images/ch8_corridor.jpg` | ch08 | `__debug__.switchTo('ch08')` | 走廊，36%遮罩 |
| 7 | `ch9_balcony` | `assets/images/ch9_balcony.jpg` | ch09 | `__debug__.switchTo('ch09')` | 阳台夜景，42%遮罩 |
| 8 | `ch10_livingroom` | `assets/images/ch10_livingroom.jpg` | ch10 | `__debug__.switchTo('ch10')` | 客厅，38%遮罩 |
| 9 | `ch3_map_phone` | `assets/images/ch3_map_phone.png` | ch03 | `__debug__.switchTo('ch03')` | 地图用 contain 缩放，检查是否居中 |
| 10 | `paperBase` | `assets/images/paper_base.png` | ch04 | 切换到 ch04，推进 ringing→signature | 签名阶段覆盖 |
| 11 | `reportBase` | `assets/images/report_base.png` | ch10 | ch10 finalReport 阶段或 overlay | 报告底图 |

### 3.2 检查清单（每张图逐项检查）

```json
{
  "图片键": "ch4_police_01",
  "检查项": {
    "内容匹配": "画面是否确实是警局场景？有没有放错图（比如放了卧室图）？",
    "缩放变形": "素材比例 vs Canvas比例，是否有拉伸/压扁？计算：原图宽高比 / Canvas宽高比，偏离>10%标记",
    "裁切丢失": "用 drawImageCover 时，边缘重要内容是否被裁掉？",
    "遮罩过暗": "暗色遮罩叠加后，细节是否完全不可辨认？",
    "清晰度": "原图在缩放后是否出现严重模糊/锯齿？"
  },
  "结论": "PASS / FAIL（说明问题）"
}
```

---

## 四、A 类：定位元素视觉比对（14 张）

这些图片在 Canvas 上按精确坐标渲染。除了内容匹配外，还需检查 **尺寸缩放导致的细节丢失**。

### 4.1 定位元素清单

| # | 图片键 | 原图尺寸 | 渲染尺寸 | 缩放比 | 章节 | 推进到阶段 |
|---|--------|---------|---------|--------|------|-----------|
| 1 | `ch4_police_03` | 1448x1086 | 320x320(圆形裁剪) | 22% | ch04 | form→bracelet |
| 2 | `ch4_police_08` | 1672x941 | 200x200(圆形裁剪) | ~12% | ch04 | ringing→signature→form |
| 3 | `ch8_mirror_wall` | 350x450 | 540x520 | 154%放大 | ch08 | 默认 |
| 4 | `ch8_mirror_stranger` | 300x400 | 280x360 | 93% | ch08 | 默认 |
| 5 | `ch8_mirror_smile` | 300x400 | 280x360 | 93% | ch08 | mirror→reveal |
| 6 | `ch8_crack` | 350x450 | 340x420 | 97% | ch08 | 默认 |
| 7 | `ch7_door_lock` | 971x1619 | 60x100 | **仅6%！** | ch07 | 默认→flashlightSearch |
| 8 | `ch7_hallucination_shadow` | 1024x1536 | 240x320 | 23% | ch07 | flashlightSearch→hallucinationClear |
| 9 | `ch7_flashlight_beam` | 1254x1254 | 230x230 | 18% | ch07 | 需鼠标点击激活 |
| 10 | `ch6_bowl_noodles` | 1465x1074 | 520x250 | 36% | ch06 | narrative→gating2 |
| 11 | `ch9_pipes` | 400x500 | ~400x350 | 87% | ch09 | 默认 |
| 12 | `ch10_porridge` | 250x250 | ~140x140 | 56% | ch10 | 默认 |
| 13 | `ch5_sunflower_sticker` | 1254x1254 | 68x68 | **仅5%！** | ch05 | 推进到gating2 |
| 14 | `ch5_elevator_sunflower_panel` | 941x1672 | 500x620 | 53% | ch05 | 推进到gating2 |

### 4.2 特别关注项

**严重缩放比案例**（可能肉眼可见的细节丢失）：

```javascript
// 这些图片需要重点检查：
const CRITICAL = [
  { key: 'ch7_door_lock',   ratio: '6%',  issue: '原图971x1619缩到60x100，头发/纹理完全丢失' },
  { key: 'ch5_sunflower_sticker', ratio: '5%', issue: '原图1254x1254缩到68x68，花瓣细节不可见' },
  { key: 'ch4_police_08',   ratio: '12%', issue: '原图1672x941缩到200x200圆形，人脸细节丢失' },
  { key: 'ch4_police_03',   ratio: '22%', issue: '原图1448x1086缩到320x320圆形，手环细节丢失' },
];
```

检查方法：在浏览器打开游戏到对应阶段，用 DevTools 截取该元素区域，打开原图对比。如果缩放过导致关键内容（人脸、文字、标志物）无法辨认，记录为 BUG。

---

## 五、B 类：需交互触发的图片（6 张）

这些图片不能通过简单的 `switchTo` + `forceComplete` 触发，需要模拟用户交互。

| # | 图片键 | 章节 | 触发方式 | 预期效果 |
|---|--------|------|---------|---------|
| 1 | `ch4_police_03` | ch04 | 推进到 bracelet 阶段后截图 | 手环聚焦图圆形居中 |
| 2 | `ch4_police_08` | ch04 | 推进到 form 阶段后截图 | 重逢焦点图从左侧缩放淡入 |
| 3 | `ch7_flashlight_beam` | ch07 | 切换到 flashlightSearch 后**点击 Canvas** | 手指周围出现光束光照 |
| 4 | `ch7_door_lock` | ch07 | 靠近门锁位置(640,500)时显示 | 门锁半透明显现 |
| 5 | `ch7_hallucination_shadow` | ch07 | 进入 hallucinationClear 阶段 | 阴影居中显示并逐渐淡出 |
| 6 | `ch8_mirror_smile` | ch08 | 推进到 reveal 阶段 | smile覆盖stranger |

**Playwright 脚本参考**（如果需要自动化验证）：
```javascript
// 直接注入代码修改 phase 来推进状态机
await page.evaluate(() => {
  const ch = window.game.chapterManager.currentChapter;
  ch.phase = 'bracelet';  // ch04 手环阶段
  // 或
  ch.phase = 'reveal';    // ch08 揭示阶段
  ch.phaseTime = 0.5;
});
```

**注意：** 有些章节的 phase 推进后图片不会立即渲染（因为有缓动动画），需要等 1-2 秒再截图。

---

## 六、C 类：检查多图叠层顺序（5 个场景）

这些场景涉及多张图片在同一个 Canvas 区域叠放，叠层顺序或半透明混合可能出错。

### 6.1 ch08 镜子场景叠层

```javascript
// 叠层顺序（从下到上）：
// 1. ch8_corridor (走廊背景) — 全屏图层0
// 2. ch8_mirror_wall (镜框) — 位置(370,42) 540x520
// 3. ch8_mirror_stranger (陌生人) — 位置(500,115) 280x360，alpha=1
//    或 ch8_mirror_smile (微笑) — 只在reveal阶段，alpha从0→1
// 4. ch8_crack (裂纹) — 位置(470,92) 340x420，alpha=0.82
//    reveal阶段alpha=0.82*(1-revealProgress)淡出
```

**验证方式：**
- 在浏览器切换到 ch08 → 默认是 mirror 阶段 → 应该看到：走廊背景 + 镜框 + 陌生人 + 裂纹
- 推进到 reveal 阶段 → 应该看到：stranger 淡出 + smile 淡入 + crack 淡出
- **检查点：** crack 是否覆盖在 stranger 之上（应该覆盖），stranger 和 smile 是否在镜框内部

### 6.2 ch10 porridge 阶段叠层

```javascript
// 叠层顺序（从下到上）：
// 1. ch10_livingroom (客厅背景) — 全屏，38%暗色遮罩
// 2. ch10_porridge (粥碗) — 居中(bowlCx,bowlCy)，缩放绘制
// 3. 程序化蒸汽粒子 — 在碗上方飘动
```

**验证方式：** 切换到 ch10 → 默认 porridge 阶段 → 看到客厅背景上有碗和蒸汽粒子

### 6.3 ch07 搜索阶段叠层

```javascript
// 叠层顺序（从下到上）：
// 1. ch7_bg_bedroom_night — 全屏，88%暗色遮罩（几乎全黑）
// 2. 程序化噪点
// 3. ch7_flashlight_beam — 跟随手指，alpha=0.28
// 4. ch7_door_lock — 在门锁位置(640,500)，呼吸透明度
// 5. 超时后：暖色月光从左上角扩散
// 6. 幻觉散去阶段：ch7_hallucination_shadow — 居中偏上，alpha从0.85→0
```

### 6.4 ch05 电梯面板叠层

```javascript
// 1. ch5_bg_elevator — 全屏，24%暗色遮罩
// 2. ch5_elevator_sunflower_panel — 覆盖在电梯面板位置
// 3. ch5_sunflower_sticker — 在正确楼层按钮上
```

**验证方式：** 切换到 ch05 → 推进到 gating2 → 检查 panel 和 sticker 位置是否重叠正确

### 6.5 ch04 手环揭示叠层

```javascript
// 1. ch4_police_01 — 全屏，30%暗色遮罩
// 2. 程序化桌子
// 3. 程序化电话（phone阶段）
// 4. paperBase覆盖（signature阶段）
// 5. 程序化登记单（form阶段）+ ch4_police_08圆形聚焦
// 6. ch4_police_03圆形聚焦（bracelet阶段）
```

---

## 七、已知问题排查清单

以下是飞书文档及代码分析中发现的疑似问题，需要核实并修复：

### 7.1 ch07 门锁过于模糊（高优先级）

**问题描述：** 原图 `ch7_door_lock.png` 尺寸 971x1619，渲染尺寸仅 **60x100**（缩放比 6%）。在极暗背景（88%遮罩）下，玩家几乎看不清门锁细节，导致难以找到交互目标。

**修复方案：**
```javascript
// 方案A：增大渲染尺寸（推荐）
// 修改 src/chapters/ch07_night.js
// 原：ctx.drawImage(lock, this.lockX - 30, this.lockY - 50, 60, 100);
// 改：ctx.drawImage(lock, this.lockX - 45, this.lockY - 75, 90, 150);

// 方案B：增加光晕范围，辅助视觉引导
```

### 7.2 ch05 向日葵贴纸缩放过小（中优先级）

**问题描述：** 原图 `ch5_sunflower_sticker.png` 尺寸 1254x1254，渲染尺寸仅 **68x68**。在电梯面板背景下，玩家可能注意不到。

**修复方案：**
```javascript
// 修改 src/chapters/ch05_door.js
// 原：screenW=68, screenH=68
// 改：加呼吸放大动画或增大到96x96
```

### 7.3 ch04 phase 推进无自然交互（中优先级）

**问题描述：** ch04 从 phone → ringing → signature → form → bracelet 的推进纯靠代码注入，没有自然用户交互路径能走完全程（signature 阶段匹配"向阳"笔画困难）。

**排查方式：** 正常玩游戏到 ch04，看是否能自然推进到 bracelet 阶段展示 `ch4_police_03`。

### 7.4 scene_puzzle.jpg 拼图裁剪完整性（中优先级）

**问题描述：** 拼图底图 `scene_puzzle.jpg`（1448x1086）被裁剪为 3x3 的 9 个碎片。需要检查拼图区域是否覆盖原图全部有效区域。

**排查方式：** 切换到 ch02，检查拼图碎片边缘是否有黑色缝隙或内容重叠。

### 7.5 ch08 镜框与镜中人位置对齐（低优先级）

**问题描述：** 镜框位置 `(370,42) 540x520`，陌生人位置 `(500,115) 280x360`。需要确认陌生人/Smile 是否在镜框内部居中，没有偏移。

### 7.6 ch09 风铃管位置（低优先级）

**问题描述：** `ch9_pipes.png` 渲染在阳台背景顶部，高度限制 350px。需确认风铃管是否遮挡了阳台的关键元素。

### 7.7 记忆报告 Overlay 底图内容匹配（低优先级）

**问题描述：** 10 个章节的 report 底图 `report/ch01~10.png` 是否与章节内容匹配（例如 ch02 报告底图是否和拼图主题相关，ch04 是否和警局相关）。

---

## 八、排查结果记录模板

### 8.1 全屏背景检查表

逐章执行，填写表格：

```markdown
## 全屏背景检查结果

| 图片键 | 内容匹配 | 缩放变形 | 裁切正常 | 遮罩适度 | 清晰度 | 结论 |
|--------|---------|---------|---------|---------|--------|------|
| mainMenuBg | ✅ | ✅ | ✅ | N/A | ✅ | PASS |
| ch4_police_01 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| ... | | | | | | |
```

如果有 FAIL，在下方写问题描述和修复建议。

### 8.2 定位元素检查表

```markdown
## 定位元素检查结果

| 图片键 | 内容匹配 | 缩放过导致细节丢失 | 位置对齐 | 结论 |
|--------|---------|------------------|---------|------|
| ch7_door_lock | ✅ | 🔴 6%缩放，关键内容模糊 | ✅ | **FAIL** 需修复 |
| ch5_sunflower_sticker | ✅ | 🔴 5%缩放，几乎不可见 | ✅ | **FAIL** 需修复 |
| ... | | | | |
```

### 8.3 叠层顺序检查表

```markdown
## 叠层顺序检查结果

| 场景 | 预期叠层 | 实际叠层 | 结论 |
|------|---------|---------|------|
| ch08 镜子 | 走廊→镜框→陌生人/微笑→裂纹 | | |
| ch10 客厅 | 客厅背景→粥碗→蒸汽 | | |
| ... | | | |
```

---

## 九、修复优先级

| 优先级 | 问题 | 影响 | 建议修复方式 |
|--------|------|------|-------------|
| P0 | 如果有图放错了（完全不是该场景的内容） | 剧情体验断裂 | 替换文件名或修改渲染代码 |
| P1 | ch07 门锁看不清（缩放6%+88%暗色遮罩） | 玩家卡关 | 增大渲染尺寸/减少遮罩不透明度 |
| P1 | ch05 向日葵贴纸看不到（缩放5%） | 玩家找不到正确楼层 | 增大贴纸+呼吸动画 |
| P2 | ch04 自然交互路径不通 | 玩家看不到手环揭示 | 优化"向阳"签名识别逻辑或增加容错 |
| P3 | 风格一致性、变形、裁切等视觉问题 | 沉浸感下降 | 修改缩放算法或替换素材 |

---

## 十、验收标准

完成排查后，以下条件应全部满足：

- [ ] 36 张 A 类图片全部检查完毕，`visual_check_report/` 下有逐项记录
- [ ] 所有 FAIL 项已修复或记录原因
- [ ] ch07 门锁在 flashlightSearch 阶段肉眼可辨认
- [ ] ch05 向日葵贴纸在 gating2 阶段肉眼可辨认
- [ ] 叠层顺序无错乱（ch08 镜框内是 stranger/smile，crack 在最上层）
- [ ] 缩放变形比率在可接受范围内（偏离 Canvas 比例 < 10%）
- [ ] 6 张 B 类交互触发图片全部成功截到渲染画面
- [ ] 修复后再次 Playwright 截图确认无回归
