# 叙事关键帧生成记录（2026-07-30）

由内置图像生成工具产出，共 3 张，用于 Ch9 / Ch10 叙事活动（可抽离，队友可替换为其他表现形式）。

## 统一规格
- 比例：约 16:9（实际 1216×832，渲染器 cover 适配 1280×720）
- 视觉语言：暖色、低饱和、水彩 / 老照片风
- 约束：无文字、无水印、无霓虹、无现代 UI / 现代物件

## 1. Ch9 父亲做风铃 — `assets/images/ch9_father_building_chime.png`
- 提示词：A young Chinese father in a modest, warmly-lit old home, carefully hand-crafting a small metal wind chime, intimate close scene, warm low-saturation watercolor painting, nostalgic old-photo mood, soft morning light through a window, 16:9 widescreen composition, no text, no watermark, no modern objects, no neon
- 用途：Ch9 crafting 闪回（FlashbackActivity 帧）。
- 验收：单父亲、暖屋、手持金属风铃半成品；未见文字/现代物。

## 2. Ch10 女儿端粥 — `assets/images/ch10_daughter_porridge_closeup.png`
- 提示词：A middle-aged Chinese daughter holding a bowl of porridge with both hands, a quiet moment of recognition as she looks at it and remembers her father, warm low-saturation watercolor, nostalgic old-photo mood, soft light, 16:9 widescreen composition, no text, no watermark, no modern objects, no neon
- 用途：Ch10 蒙太奇中段（MontageActivity 帧）。
- 验收：中年女儿双手捧碗、神情认出记忆；未见文字/现代物。

## 3. Ch10 父女拥抱 — `assets/images/ch10_father_daughter_embrace.png`
- 提示词：A restrained, tender embrace between an elderly Chinese father and his middle-aged daughter in gentle morning sunlight, warm low-saturation watercolor painting, nostalgic old-photo mood, soft warmth, 16:9 widescreen composition, no text, no watermark, no modern objects, no neon
- 用途：Ch10 蒙太奇结尾定格（MontageActivity 帧）。
- 验收：老年父亲与中年女儿克制拥抱、晨光；未见文字/现代物。

## 后续
- 这 3 张为「叙事活动」的资产，与章节互动解耦；若队友产出更佳表现形式，仅需替换 `src/narrative/` 下活动或替换本目录图片，章节代码不变。
- 图像预算：本计划上限 6 张，本次用 3 张，未超限。
