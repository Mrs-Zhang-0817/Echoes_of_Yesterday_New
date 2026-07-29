# 《昨日重现》美术库整理与缺失素材生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动游戏代码或现有运行路径的前提下，建立可追溯美术库，并生成台账 G01–G26 的 26 张缺失素材。

**Architecture:** `assets/art-library/` 是唯一新增的美术管理根目录。现有运行素材与历史来源只做归档副本，保持 `assets/images/` 和章节代码不变；新素材按章节落在 `generated/chXX/`。连续帧由同一生成任务顺序产出，透明互动件以绿幕图生成、去背和 alpha 验证后才归档。

**Tech Stack:** 内置图像生成工具、macOS `sips`、本地图像 alpha 检查、Git 工作区文件系统。

## Global Constraints

- 只新增或归档美术文件；禁止改动 `src/`、`build_out/`、`index.html`、manifest 或现有素材文件。
- 现有 `assets/images/` 只保留运行副本，绝不移动或覆盖。
- 所有背景图为 16:9 JPG；所有互动件交付 PNG alpha；不在图中生成文字。
- 新图延续已验证的低饱和水彩/水粉纸纹、90 年代中国家庭记忆视觉；避免赛博、扁平 UI、强 3D 和荧光色。
- Ch2 闪回 5 帧与 Ch3 城市上推 4 帧必须各自由同一智能体串行完成。

---

### Task 1: 建立可追溯美术库

**Files:**
- Create: `assets/art-library/existing-runtime/`
- Create: `assets/art-library/feishu-raw/`
- Create: `assets/art-library/legacy-source/`
- Create: `assets/art-library/generated/ch02/` through `assets/art-library/generated/ch09/`
- Create: `assets/art-library/README.md`

**Interfaces:**
- Consumes: `assets/images/`, `.tmp_feishu_imgs/`, `assets-source/`
- Produces: 原始来源不被破坏的集中化美术库

- [ ] **Step 1: 创建分章生成目录与来源归档目录**

Run: `mkdir -p assets/art-library/{existing-runtime,feishu-raw,legacy-source,generated/ch02,generated/ch03,generated/ch05,generated/ch07,generated/ch08,generated/ch09}`

Expected: 所有新文件均可从 `assets/art-library/` 统一查找。

- [ ] **Step 2: 复制已有美术来源，不移动运行素材**

Run: `cp -pR assets/images assets/art-library/existing-runtime/`; `cp -pR .tmp_feishu_imgs/. assets/art-library/feishu-raw/`; `cp -pR assets-source/. assets/art-library/legacy-source/`

Expected: `assets/images/` 中文件数与内容不变；三份来源均在美术库可追溯。

- [ ] **Step 3: 核验归档完整性**

Run: `find assets/images -type f | wc -l`; `find assets/art-library/existing-runtime/images -type f | wc -l`

Expected: 两个文件数一致；不包含根目录的运行截图。

### Task 2: 生成 Ch2 叙事资产 G01–G09

**Files:**
- Create: `assets/art-library/generated/ch02/CH2_Door_Frame.png`
- Create: `assets/art-library/generated/ch02/CH2_Tinbox_Open.png`
- Create: `assets/art-library/generated/ch02/CH2_Key_Inside.png`
- Create: `assets/art-library/generated/ch02/CH2_Candy_Inside.png`
- Create: `assets/art-library/generated/ch02/CH2_Flashback_01.jpg` through `CH2_Flashback_05.jpg`

**Interfaces:**
- Consumes: `assets/images/ch2_bg_livingroom.png`, `assets/images/ch2_tinbox_closed.png`, G01–G09 descriptions in `docs/asset-complete-matrix.md`
- Produces: Ch2 的 4 个透明互动件和 5 帧人物连续闪回

- [ ] **Step 1: 锁定父女、校门、夕阳和服装基准，再串行生成五帧闪回**

Expected: 父亲始终为浅灰长袖衬衫与深蓝牛仔裤；女儿始终为白色校服裙、双马尾、红书包；机位不变。

- [ ] **Step 2: 生成门框、打开糖盒、钥匙和糖果**

Expected: 所有物件与已存在的糖盒外观相配；钥匙、糖果在组合态和单件态可辨认地一致。

- [ ] **Step 3: 对四个互动件去背并检查 alpha**

Expected: 图像为有效 RGBA PNG，四角透明，无绿色溢色或投影底板。

### Task 3: 生成 Ch3 城市资产 G10–G18

**Files:**
- Create: `assets/art-library/generated/ch03/CH3_BG_OldCommunity.jpg`
- Create: `assets/art-library/generated/ch03/CH3_CityUp_01.jpg` through `CH3_CityUp_04.jpg`
- Create: `assets/art-library/generated/ch03/CH3_BG_CityStreet.jpg`
- Create: `assets/art-library/generated/ch03/CH3_BG_SchoolGate.jpg`
- Create: `assets/art-library/generated/ch03/CH3_NPC_Passerby.png`
- Create: `assets/art-library/generated/ch03/CH3_RedScarf_Girl.png`

**Interfaces:**
- Consumes: `assets/images/ch5_bg_community_night.jpg`, G10–G18 descriptions in `docs/asset-complete-matrix.md`
- Produces: 冷蓝灰城市场景、四帧连续上摇画面和两个透明 NPC

- [ ] **Step 1: 顺序生成同一虚拟机位的四帧城市上推**

Expected: 从父亲旧球鞋与楼体底部，连续过渡到灯火城市和银河；不改变城市位置、月相或镜头方向。

- [ ] **Step 2: 生成三个静态背景和两个 NPC**

Expected: 老小区与废弃学校保留克制的冷色叙事感；红围巾女孩是环境中唯一高饱和暖色焦点。

- [ ] **Step 3: 对 NPC 去背并检查 alpha**

Expected: 角色完整、四周透明、没有背景块或绿色边缘。

### Task 4: 生成 Ch5、Ch7、Ch8、Ch9 资产 G19–G26

**Files:**
- Create: `assets/art-library/generated/ch05/CH5_Sunflower_Sticker.png`
- Create: `assets/art-library/generated/ch07/CH7_BG_BedroomNight.jpg`
- Create: `assets/art-library/generated/ch07/CH7_Flashlight_Beam.png`
- Create: `assets/art-library/generated/ch07/CH7_Hallucination_Shadow.png`
- Create: `assets/art-library/generated/ch07/CH7_Door_Lock.png`
- Create: `assets/art-library/generated/ch08/CH8_Mirror_Smile.png`
- Create: `assets/art-library/generated/ch08/CH8_Radio_Knob.png`
- Create: `assets/art-library/generated/ch09/CH9_Notebook_Glyphs.png`

**Interfaces:**
- Consumes: `assets/images/ch5_elevator_buttons.png`, `assets/images/ch7_mirror_stranger_old.png`, `assets/images/ch8_mirror_stranger.png`, `assets/images/ch8_radio_v2.png`, `assets/images/ch9_notebook_open.png`
- Produces: 8 个与现有互动基底匹配的透明叠加或背景素材

- [ ] **Step 1: 生成 Ch5/Ch7 资产**

Expected: 夜卧室保持极暗但仍可读；光圈中心至边缘的透明渐变平滑；幻觉不具象为怪物；门锁可作为清晰热区。

- [ ] **Step 2: 生成 Ch8/Ch9 资产**

Expected: 微笑老人延续现有老人面部与镜框构图；旋钮居中正圆；乱码层没有可识别文字且可叠加在笔记本上。

- [ ] **Step 3: 对七个透明交互件去背并检查 alpha**

Expected: 透明层可直接叠加，无纯色底、阴影底板或水印。

### Task 5: 完整性与风格验收

**Files:**
- Modify: `assets/art-library/README.md`

**Interfaces:**
- Consumes: G01–G26 所有交付文件
- Produces: 可核验的 26 项交付清单与已知限制记录

- [ ] **Step 1: 运行文件存在性、格式、尺寸与 alpha 核验**

Run: `sips -g format -g pixelWidth -g pixelHeight <asset>`；透明 PNG 额外检查 `sips -g hasAlpha <asset>`。

Expected: 26 个台账文件都存在、可打开；背景为 16:9，透明交互层有 alpha。

- [ ] **Step 2: 人工检查连续序列与参考一致性**

Expected: Ch2 人物与机位连续；Ch3 视角逐帧上移；Ch8 镜中老人情绪、Ch9 乱码层与基底资产匹配。

- [ ] **Step 3: 更新美术库 README 的来源与验收结果**

Expected: README 仅记录归档规则、26 项文件清单、生成方式及未接入代码的状态。
