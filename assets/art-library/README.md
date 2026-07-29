# 《昨日重现》美术资源库

本目录只用于集中管理美术资源；**没有改动** `assets/images/`、`src/`、manifest 或构建产物。

## 目录

- `existing-runtime/images/`：当前项目 `assets/images/` 的 79 张运行素材副本。
- `feishu-raw/`：从飞书《demo描述》第十一章下载的 43 张原始素材副本。
- `legacy-source/`：旧仓库暂存的 8 张警局素材副本。
- `generated/ch02`、`ch03`、`ch05`、`ch07`、`ch08`、`ch09`：本轮根据 `docs/asset-complete-matrix.md` 生成的缺失素材。

根目录调试截图不属于美术资源，未归档到这里。

## 本轮生成交付（G01–G26）

| 章节 | 文件 | 数量 |
|---|---|---:|
| Ch2 | `CH2_Door_Frame.png`、`CH2_Tinbox_Open.png`、`CH2_Key_Inside.png`、`CH2_Candy_Inside.png`、`CH2_Flashback_01.jpg`–`05.jpg` | 9 |
| Ch3 | `CH3_BG_OldCommunity.jpg`、`CH3_CityUp_01.jpg`–`04.jpg`、`CH3_BG_CityStreet.jpg`、`CH3_BG_SchoolGate.jpg`、`CH3_NPC_Passerby.png`、`CH3_RedScarf_Girl.png` | 9 |
| Ch5 | `CH5_Sunflower_Sticker.png` | 1 |
| Ch7 | `CH7_BG_BedroomNight.jpg`、`CH7_Flashlight_Beam.png`、`CH7_Hallucination_Shadow.png`、`CH7_Door_Lock.png` | 4 |
| Ch8 | `CH8_Mirror_Smile.png`、`CH8_Radio_Knob.png` | 2 |
| Ch9 | `CH9_Notebook_Glyphs.png` | 1 |
| 合计 | G01–G26 | **26** |

`*_source.png` 是少数透明件的绿幕生成原图，仅用于追溯；同名、无 `_source` 后缀的 PNG 才是已去背交付文件。

## 生成与验收规则

- 视觉基准：低饱和水彩/水粉、细纸纹、90 年代中国家庭记忆；暖景为褐金日照，冷景为蓝灰夜色。
- 背景保留高分辨率 JPG，交互件为 RGBA PNG；代码接入时按游戏画布尺寸缩放。
- 所有透明交互件均使用纯绿幕生成后本地去背，并已检查 alpha。
- Ch2 闪回与 Ch3 城市上推的角色、场景和叙事顺序保持一致；生成式图像仍可能存在轻微机位差异，接入动画前应逐帧视觉复核。
