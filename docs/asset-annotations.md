# 《昨日重现》美术素材标注清单（新拉取部分）

> 生成时间：2026-07-29 18:46
> 来源：旧仓库 `Echoes_of_Yesterday` 远程 `origin/main` 提交 `64ab89b`（"警局图片"）
> 处理方式：**本轮仅拉取 + 标注，未安装进游戏 `assets/images/`，未修改任何代码。**
> 暂存位置：`assets-source/ch4_police/`（非游戏加载路径，确认无用后可整体删除）

---

## 一、本轮新拉取的素材（旧仓库 `第四章·警局/` 目录，共 8 张）

这 8 张图在旧仓库本地工作树里**未 checkout**（工作树只展开了 46 个文件，但 git 对象里共有 220 个），仅存在于 git 提交 `64ab89b` 中。本次按 blob 无损提取到暂存目录。

| 暂存文件名 | 原始文件名 | 尺寸 | 体积 | Git 来源 |
|---|---|---|---|---|
| ch4_police_01.png | ChatGPT Image 2026年7月29日 10_35_12.png | 1672×941 | 2.7MB | origin/main @ 64ab89b |
| ch4_police_02.png | ChatGPT Image 2026年7月29日 11_23_56.png | 1672×941 | 2.5MB | 同上 |
| ch4_police_03.png | ChatGPT Image 2026年7月29日 11_50_54.png | 1448×1086 | 2.6MB | 同上 |
| ch4_police_04.png | ChatGPT Image 2026年7月29日 11_56_25.png | 1672×941 | 2.4MB | 同上 |
| ch4_police_05.png | ChatGPT Image 2026年7月29日 11_59_52.png | 1672×941 | 2.8MB | 同上 |
| ch4_police_06.png | ChatGPT Image 2026年7月29日 12_04_27.png | 1672×941 | 2.4MB | 同上 |
| ch4_police_07.png | ChatGPT Image 2026年7月29日 13_23_21.png | 1672×941 | 2.7MB | 同上 |
| ch4_police_08.png | ChatGPT Image 2026年7月29日 14_11_40.png | 1672×941 | 2.5MB | 同上 |

> ⚠️ **画面内容需你打开确认**：当前模型无法查看图片像素内容，下方「作用标注」是依据
> 「目录名 = 第四章·警局」+ Ch4 设计需求（警局场景底图 / 电话·防走失手环特写 / 登记单特写）
> 做的**推测**，不是已验证事实。请打开 `assets-source/ch4_police/` 核对后回填真实内容。

---

## 二、作用标注（推测 + 待确认）

| 文件 | 推测用途（待你确认） | 对应 Ch4 环节 | 建议接入点（Ch4 模块实现后） |
|---|---|---|---|
| ch4_police_01.png | 宽幅，疑似**街道 / 旧城环境背景** | Ch4 开场 / 走失发生地 | `ch04_police.js` 的 `drawBackground()` |
| ch4_police_02.png | 同上街道变体（备选镜头） | 同上 | 同上 |
| ch4_police_03.png | 4:3 比例，疑似**特写镜头**（手环 / 登记单等道具） | Ch4 关键道具展示 | 弹层 / 特写 `drawImage` |
| ch4_police_04.png | 待确认（打开后回填） | — | — |
| ch4_police_05.png | 含警车元素的街道变体，强化"已报警"叙事 | Ch4 报警 / 出警段落 | `drawBackground()` 或转场 |
| ch4_police_06.png | 宽幅，疑似**车内 / 车窗转场** | Ch4→Ch5 过场 | 章节转场层 |
| ch4_police_07.png | 待确认（打开后回填） | — | — |
| ch4_police_08.png | 宽幅，疑似**警局室内（接待室）**，适合作主场景底图 | Ch4 登记 / 询问主场景 | `ch04_police.js` 主背景 |

### 标注依据（供你判断）
- 尺寸规律：7 张为 `1672×941`（≈16:9 宽幅，符合场景底图 / 转场）；仅 `ch4_police_03` 为 `1448×1086`（4:3，更可能是特写 / 道具近景）。
- 全部为 `ChatGPT Image` 前缀，是 AI 生成图，非实拍，画风统一。
- 目录 `第四章·警局` + 提交信息 `警局图片` 双重确认：这批图专供 **Ch4 警局** 使用。

---

## 三、为什么现在"装不进代码"

- 当前 `src/chapters/` 仅有 `ch02_puzzle` / `ch03_maze` / `ch05_door` / `ch06_table` / `ch08_sign` **五个模块，没有 `ch04_police`**。
- 因此这 8 张图目前没有可引用的代码位置——"填充进代码"需要先有 Ch4 章节模块。
- 另外注意：本轮开始时发现**工作区被回滚**——`assets/` 目录、`docs/asset-inventory.md`、`main_new.js` 里的素材 manifest 改动都不在了，git 状态干净。所以不只是这 8 张，连 Ch2/Ch3/Ch8 的基础素材在源码层也需重新就位（构建产物 dist/build_out/.publish 里仍有副本）。

---

## 四、待你确认后，安装时会做什么（预案，非本次执行）

1. 把需要用的图从 `assets-source/ch4_police/` 复制到 `assets/images/`。
2. **压缩**：单张 2.4–2.8MB 太大，建议转 JPEG Q80，目标 <300KB/张（抖音互动空间 zip 限 8MB）。
3. 在 `src/main_new.js` 的 `manifest` 注册（如 `policeBg`、`policeInterior`、`bracelet` 等）。
4. 实现 / 补全 `src/chapters/ch04_police.js`，在对应 phase 用 `drawImage` 引用。

> 你可以直接在上面表格的「推测用途」列改成真实内容，或告诉我哪些图要保留、哪些弃用，我再执行安装。
