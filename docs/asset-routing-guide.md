# 美术素材路由指南 — Asset Routing Guide

> 本文件说明 `assets/art/` 目录下所有素材的组织方式、命名规则和代码中的引用方法。
> 任何智能体在需要引用图片时，先看本文件确定路径。

---

## 一、目录结构总览

```
assets/art/
├── ui/                   # 全局 UI 素材（主菜单、按钮、纹理、场景背景）
├── ch01-mirror/          # 第一章：序曲·镜前
├── ch02-puzzle/          # 第二章：接女儿放学
├── ch03-maze/            # 第三章：迷途
├── ch04-police/          # 第四章：警局
├── ch05-elevator/        # 第五章：归家迷途
├── ch06-dinner/          # 第六章：餐桌上的博弈
├── ch07-night/           # 第七章：惊悚夜醒
├── ch08-mirror/          # 第八章：走廊的镜子
├── ch09-chime/           # 第九章：风铃
├── ch10-reunion/         # 第十章：认出
├── report/               # 各章记忆报告结算底图
├── chapter-select/       # 章节选择图标
├── medical-notes/        # 医学知识卡（病程说明）
├── medical-photos/       # 医学照片素材
└── memory-items/         # 旧版记忆项图标
```

---

## 二、命名规则

### 2.1 通用规则
- **文件名**：英文小写 + 连字符 `-`
- **扩展名**：有透明通道需求用 `.png`，否则 `.jpg`（体积更小）
- **场景背景**：`{场景描述}-bg.jpg`（如 `elevator-bg.jpg`）
- **交互物件**：`{物件描述}.png`（如 `map-phone.png`）
- **漫画帧**：`comic-{序号}.jpg`（如 `comic-01.jpg`）
- **闪回帧**：`flashback-{序号}.jpg`（如 `flashback-03.jpg`）

### 2.2 manifest 键名 → 实际路径 映射规则

代码中通过 `game.images['manifestKey']` 引用图片。manifest键名与文件的对应关系：

| manifest键模式 | 解析路径 | 示例 |
|---------------|----------|------|
| `ch{02}_tinbox_open` | `assets/art/ch02-puzzle/tinbox-open.jpg` | 章节 + 场景语义化文件名 |
| `ch{03}_map_phone` | `assets/art/ch03-maze/map-phone.png` | 同上 |
| `comic_ch{01}_01` | `assets/art/ch01-mirror/comic-01.jpg` | 漫画帧 |
| `mainMenuBg` | `assets/art/ui/main-menu-bg.jpg` | 全局UI |
| `reportBase` | `assets/art/ui/report-base.jpg` | 报告底图 |
| `medical_ch10` | `assets/art/medical-photos/photo-ch10.jpg` | 医学素材 |

**转换规则**：manifest键中的下划线 `_` 对应目录的连字符 `-`，数字对应章节编号。

---

## 三、逐章素材速查

### ui/ — 全局 UI 素材（13张）

| 文件名 | 代码引用键 | 用途 | 尺寸 |
|--------|-----------|------|------|
| `btn-frame.jpg` | `buttonFrame` | 按钮边框纹理 | 1672x941 |
| `paper-noise.jpg` | `paperNoise` | 纸张噪点纹理 | 1672x941 |
| `paper-base.jpg` | `paperBase` | 纸张基底纹理 | 1672x941 |
| `report-base.jpg` | `reportBase` | 记忆报告基础底图 | 1672x941 |
| `main-menu-bg.jpg` | `mainMenuBg` | 主菜单背景 | 1672x941 |
| `scene-puzzle.jpg` | `puzzle` | 拼图关卡背景（Ch2） | 1672x941 |
| `scene-desk.jpg` | `deskBg` | 桌面背景 | 1672x941 |
| `sign-scene.jpg` | `sign` | 签字场景背景（Ch4） | 1672x941 |
| `main-menu-bg-full.jpg` | — | 主菜单完整背景（中文名版副本） | 原图 |
| `btn-sprite.png` | — | 按钮图集 | 原图 |
| `page-turn-bg.png` | — | 旧版翻页背景（未使用） | 原图 |
| `scene-room.jpg` | — | 房间场景（旧版遗留） | 原图 |

### ch01-mirror/ — 第一章 序曲·镜前（6张）

| 文件名 | 代码引用键 | 用途 | 场景描述 |
|--------|-----------|------|---------|
| `bedroom-bg.jpg` | —（未注册manifest，代码直接引用） | 卧室背景 | 清晨卧室，暖色光线 |
| `comic-01.jpg` | `comic_ch01_01` | 漫画格1「清晨之歌」 | 中景，后背视角，老人坐在床边 |
| `comic-02.jpg` | `comic_ch01_02` | 漫画格2「镜中陌生人」 | 中近景，镜子前的老人 |
| `comic-03.jpg` | `comic_ch01_03` | 漫画格3 | 老人穿衣 |
| `comic-04.jpg` | `comic_ch01_04` | 漫画格4 | 宽大衣袖、苍老的手 |
| `comic-05.jpg` | `comic_ch01_05` | 漫画格5「坠入黑暗」 | 惊恐表情的特写 |

### ch02-puzzle/ — 第二章 接女儿放学（13张）

| 文件名 | 代码引用键 | 用途 |
|--------|-----------|------|
| `livingroom-bg.jpg` | —（未使用） | 客厅背景 |
| `tinbox-open.jpg` | `ch2_tinbox_open` | 打开的糖铁盒 |
| `key-inside.jpg` | `ch2_key_inside` | 钥匙在盒中 |
| `candy-inside.jpg` | `ch2_candy_inside` | 糖果在盒中 |
| `flashback-01.jpg` ~ `flashback-05.jpg` | `ch2_flashback_01~05` | 5帧闪回序列 |
| `comic-01.jpg` ~ `comic-04.jpg` | `comic_ch02_01~04` | 4格漫画 |

（以下各章格式相同，详见 `docs/ref/06-美术资源/06-09-素材逐章标注明细.md`）

---

## 四、漫画引擎路由（ComicSystem）

`ComicSystem/` 目录下有一套独立的配置驱动漫画播放器。

### 引擎文件

| 文件 | 职责 |
|------|------|
| `ComicSystem/ComicDataLoader.js` | 加载JSON漫画场景配置 |
| `ComicSystem/ComicPlayer.js` | 漫画播放器（DOM版） |
| `ComicSystem/ComicRenderer.js` | 漫画渲染器（clipPath裁剪） |

### 漫画配置（JSON）

`ComicSystem/comics/real/` 下按章节组织的场景配置JSON，引用 `comic_flat/` 路径的图片：

```json
// ComicSystem/comics/real/chapter01_scene01.json 示例
{
  "scene": "ch01-mirror",
  "imageSrc": "./assets/art/ch01-mirror/comic-01.jpg",
  "panels": [
    { "id": "a", "order": 1, "shape": "rect", "x": 0, "y": 0, "width": 100, "height": 100 }
  ]
}
```

图片源路径统一指向 `assets/art/` 下的文件。

---

## 五、UI 素材路由

UI 框架素材（按钮、纹理、噪声）通过 `assets/art/ui/` 加载。
记忆报告底图通过 `assets/art/report/` 加载（由 `ArtworkMemoryReport.js` 的 `ASSET_BASE` 常量控制）。

| UI素材路径 | 加载方式 |
|-----------|---------|
| `assets/art/report/ch01.jpg` ~ `ch10.jpg` | `src/ui/ArtworkMemoryReport.js` 自动拼接路径 |
| `assets/art/report/btn-continue.jpg` | ArtworkMemoryReport硬编码 |
| `assets/art/ui/btn-frame.jpg` | assetManifest → game.images.buttonFrame |

---

## 六、添加新素材的步骤

1. 将文件放入 `assets/art/{章节目录}/`，按命名规则命名
2. 在 `src/data/assetManifest.js` 中添加键 → 路径映射
3. 在章节代码中通过 `game.images['键名']` 引用
4. 如果需要在记忆报告中使用，配置 `src/ui/memory-report-config.json`
5. 如果是漫画帧，还需在 `ComicSystem/comics/real/` 中创建JSON配置

---

## 七、历史映射（旧路径 → 新路径）

旧的 `assets/images/` 路径已全部迁移到 `assets/art/`。旧文件保留在原位等待清理。

| 旧路径模式 | 新路径模式 |
|-----------|-----------|
| `assets/images/ch{02}_tinbox_open.jpg` | `assets/art/ch02-puzzle/tinbox-open.jpg` |
| `assets/images/comic_flat/ch{01}_01.jpg` | `assets/art/ch01-mirror/comic-01.jpg` |
| `assets/images/report/ch{01}.jpg` | `assets/art/report/ch01.jpg` |
| `assets/images/report_base.jpg` | `assets/art/ui/report-base.jpg` |
| `assets/pictures/medical/medical_ch{10}.jpg` | `assets/art/medical-photos/photo-ch10.jpg` |
