# 美术素材实装状态矩阵（2026-07-29 20:40）

> 对照来源：
> - 飞书《demo描述》第十一章「图片资产核对与生成台账」（80 个剧情素材 + 3 个主菜单素材，勾选 = 已生成）
> - 飞书《比赛备忘录》（第二章拼图 3 张、签字场景 2 张的来源记录）
> - 本地项目 `assets/images/`（27 个文件）+ `src/main_new.js` manifest（27 个注册键）+ `src/chapters/` 十个章节模块的实际代码引用
> - `docs/asset-inventory.md` / `docs/asset-annotations.md`
>
> 「实装」定义：素材文件在 `assets/images/` + manifest 注册 + 章节代码里有 drawImage 级引用。
> 「bug」口径：以现有测试记录（test-results 最近一次 passed）与文档已知问题为准，未逐张做运行时视觉回归。

## 〇、总需求：一共需要多少个美术资源？

**按飞书台账口径：共 83 个独立输出文件**（3 个主菜单 + 80 个剧情章节素材）。其中已生成 53 个、未生成 30 个。

分章统计：

| 模块 | 需求数 | 已生成 | 未生成 |
|------|-------|-------|-------|
| 主菜单 | 3 | 3 | 0 |
| Ch1 儿时的回忆 | 10 | 10 | 0 |
| Ch2 接女儿放学 | 13 | 1 | 12 |
| Ch3 迷途 | 10 | 1 | 9 |
| Ch4 警局 | 7 | 7 | 0 |
| Ch5 归家迷途 | 5 | 4 | 1 |
| Ch6 餐桌上的博弈 | 7 | 7 | 0 |
| Ch7 暗夜的微光 | 5 | 0 | 5 |
| Ch8 走廊的镜子 | 8 | 6 | 2 |
| Ch9 旧时光的风铃 | 12 | 11 | 1 |
| Ch10 爱，从不迷路 | 3 | 3 | 0 |
| **合计** | **83** | **53** | **30** |

> 补充口径：本地 Canvas 版项目还有 4 个台账之外的自有素材在用（paper_base、paper_noise、report_base、button_frame），若按"项目实际会用到的全部图"计，工作总量约 **87 个**。台账原文的「素材优先级汇总」曾写 12 张背景，但逐章明细实为 18 张背景，以本表 83 为准。

## 一、总览

| 状态 | 数量 | 说明 |
|------|------|------|
| A. 已实装、无已知 bug | 13 键（12 文件） | 代码实际引用，测试通过，无记录在案的 bug |
| B. 已实装、有 bug / 风险 | 0（硬 bug）+ 2 项风险 | 无记录在案的运行 bug；有 2 项隐患见下文 |
| C. 有素材、未实装（本地闲置） | 14 文件 | 在 assets/images 或 assets-source，代码零引用 |
| D. 台账已生成、但素材未进项目 | ~29 项 | 飞书勾选"已生成"，本地新项目找不到对应文件 |
| E. 完全缺失（未生成） | 30 项 | 飞书台账未勾选，本地也没有 |

## 二、A：已实装且无已知 bug（13）

| 素材 | manifest 键 | 使用位置 | 对应台账条目 |
|------|------------|---------|-------------|
| main_menu_bg.jpg | mainMenuBg | ch01_intro.js（Ch1 镜前背景） | 主界面底图.jpg（等价复用） |
| scene_puzzle.jpg | puzzle | ch02_puzzle.js + Scene_Puzzle/Scene_Desk | CH2_Photo_Puzzle_Full（台账未勾，但项目已有替代图并实装） |
| ch4_police_01.png | ch4_police_01 | ch04_police.js drawBackground | CH4_BG_StreetNight（推测对应） |
| desk_bg.jpg | deskBg | ch06_table.js（Ch6 餐桌背景） | CH6_BG_DiningRoom（等价复用） |
| ch8_corridor.jpg | ch8_corridor | ch08_sign.js（走廊氛围） | CH8_BG_Corridor |
| sign_scene.png | sign | ch08_sign.js（签字表单） | CH4_Signature_Paper（近似） |
| paper_base.png | paperBase | ch08_sign.js（纸张纹理） | — |
| paper_noise.png | paperNoise | ch08_sign.js（纸张噪点） | — |
| ch9_balcony.jpg | ch9_balcony | ch09_chime.js（阳台背景） | CH9_BG_Balcony |
| ch9_pipes.png | ch9_pipes | ch09_chime.js（风铃管组） | CH9_WindChime_Pipes |
| ch10_livingroom.jpg | ch10_livingroom | ch10_report.js（客厅背景） | CH10_BG_LivingRoomMorning |
| ch10_porridge.png | ch10_porridge | ch10_report.js（热粥碗） | CH10_Daughter_Porridge |
| report_base.png | reportBase | ch10_report.js（报告底板） | — |

程序化渲染（无需素材、按设计保留）：Ch3 迷宫、Ch5 归家、Ch7 夜醒。

## 三、B：有 bug / 风险项

**记录在案的运行 bug：无。** 最近一次测试 run 状态 passed，failedTests 为空；文档中无未关闭的素材相关 bug。

但有 2 项实际风险（不算硬 bug，建议处理）：

| 风险 | 详情 | 影响 |
|------|------|------|
| manifest 全量预加载 8 张警局图 | ch4_police_01–08 全部注册进 manifest（每张 2.4–2.8MB），但代码只用 01；02–08 白白加载约 18MB | 首屏加载时间显著变长（39MB 素材总量里近半是闲置项） |
| ch4_police_01 内容未人工核验 | annotations 文档明确"画面内容是推测、未验证"，01 被直接当 Ch4 背景接入 | 可能图不对题（如接的是街景而非警局大厅），需打开游戏肉眼确认一次 |

## 四、C：有素材、未实装（本地文件闲置，14）

| 素材 | 位置 | manifest | 代码引用 | 建议 |
|------|------|----------|---------|------|
| ch4_police_02–08.png（7 张） | assets/images | ✅ 已注册 | ❌ 无 | 选 1–2 张接入 Ch4（警局大厅/车窗转场），其余移出 manifest |
| ch8_mirror_wall.png | assets/images | ✅ | ❌ | Ch8 镜子互动（台账里是核心互动层） |
| ch8_mirror_stranger.png | assets/images | ✅ | ❌ | 同上 |
| ch8_crack.png | assets/images | ✅ | ❌ | 同上 |
| ch8_hourglass.png | assets/images | ✅ | ❌ | Ch8 沙漏互动 |
| ch8_radio.png | assets/images | ✅ | ❌ | Ch8 收音机互动 |
| ch9_notebook.png | assets/images | ✅ | ❌ | Ch9 笔记本环节 |
| button_frame.png | assets/images | ✅ | ❌ | 全局按钮框，1.8MB，不用就删 |

另：`assets-source/ch4_police/` 里的 8 张是 assets/images 同批图的暂存副本，确认接入方案后可整目录删除。

## 五、D：台账勾选"已生成"、但素材未进本项目（~29）

这些在飞书台账里打了勾（图应存在于飞书文档/旧仓库/生成记录中），但本地新项目没有对应文件：

| 章节 | 条目 |
|------|------|
| Ch1（10 张全缺） | CH1_BG_Bedroom、Radio_Player、Radio_Button、Vinyl_Disc、Clothes_Shirt、Clothes_Pants、Mirror_Frame、Mirror_Reflection_Young、Mirror_Reflection_Old、Mirror_Crack_Mask |
| Ch2 | CH2_Tinbox_Closed |
| Ch3 | CH3_Map_Phone |
| Ch5（4 张） | CH5_BG_CommunityNight、BG_UnitDoor、BG_Elevator、Elevator_Buttons |
| Ch6（7 张） | CH6_BG_DiningRoom、Bowl_Noodles、Bowl_Abstract、Particle_SoySauce、Particle_GreenOnion、Particle_Egg、Daughter_Apron |
| Ch9（5 张） | CH9_WindChime_Pipe_Red/Yellow/Blue/Green、CH9_Note_Red/Yellow/Blue/Green（8 项中 4 管 4 音符均勾选）、CH9_Notebook_Open |
| Ch10 | CH10_Ending_White |
| Ch4 | CH4_NPC_YoungMan、CH4_Daughter_Enter、CH4_Wristband_Silver（如果 8 张警局图里没有对应，则需从飞书取回） |

> 注意：当前 Ch1/Ch5/Ch6 用程序化渲染或替代图跑通了流程，所以这批不阻塞运行，但要达到台账设计的互动效果（留声机、电梯按钮、面碗切换等）就必须把图取回并接入。
> 取回路径：飞书《demo描述》文档内嵌图片、或旧仓库 Echoes_of_Yesterday 的 git 对象（Ch4 那批就是这么提取的）。

## 六、E：完全缺失——台账未勾选、本地也没有（30）

| 章节 | 缺失条目 | 数量 |
|------|---------|------|
| Ch2 | BG_LivingRoom、Photo_Puzzle_Full、Door_Frame、Desk_Scene、Tinbox_Open、Key_Inside、Candy_Inside、Flashback_01–05 | 12 |
| Ch3 | BG_OldCommunity、CityUp_01–04、BG_CityStreet、BG_SchoolGate、NPC_Passerby、RedScarf_Girl | 9 |
| Ch5 | Sunflower_Sticker | 1 |
| Ch7 | BG_BedroomNight、BG_Bedroom360、Flashlight_Beam、Hallucination_Shadow、Door_Lock | 5 |
| Ch8 | Mirror_Smile、Radio_Knob | 2 |
| Ch9 | Notebook_Glyphs | 1 |

> 其中 Ch2 的 5 帧闪回要求同角色同服装连续性，是生成难度最高的一组；Ch7 当前"纯黑极简"是设计定稿，5 张是否还要生成建议先做决策。

## 七、口径差异备忘

1. 台账基于旧仓库 xyqbranch + showcase-demo（React 版），本项目是 Canvas 重写版，命名体系不同，上表已做映射。
2. `scene_puzzle.jpg` 在台账中对应条目未勾选，但项目实际已有可用图并实装——台账该行应更新。
3. 台账写"仓库仅 3 个可运行素材"，是指旧仓库；本项目实际已有 27 个文件、13 键在用。
