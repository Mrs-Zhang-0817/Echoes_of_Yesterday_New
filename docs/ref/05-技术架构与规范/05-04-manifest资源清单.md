---
source: docs/manifest整理.md（从 src/main_new.js 提取）
date: 未标注（从 main_new.js 中读取）
status: 当前有效 — 与 main_new.js 中运行时 manifest 对象一致
related: 05-05-章节数据配置.md
---

# 05-04 manifest 资源清单

## 概述

`main_new.js` 中的 `manifest` 对象定义了所有需要预加载的图片资源路径，共计 **16 项**。Loader 在启动时根据此对象发起 Promise.all 预加载，加载完成后注入 `game.images` 供各章节使用。

所有路径为**相对路径**，基准为 `index.html` 所在目录。

---

## 完整 manifest 键路径映射

### Ch2 拼图

| manifest 键 | 文件路径 | 用途 |
|-------------|----------|------|
| `puzzle` | `./assets/images/scene_puzzle.jpg` | 拼图原图底图 |

### Ch8 签字关卡

| manifest 键 | 文件路径 | 用途 |
|-------------|----------|------|
| `sign` | `./assets/images/sign_scene.png` | 签字纸面背景 |
| `ch8_corridor` | `./assets/images/ch8_corridor.jpg` | Ch8 走廊场景 |
| `ch8_mirror_wall` | `./assets/images/ch8_mirror_wall.png` | 镜子墙面 |
| `ch8_mirror_stranger` | `./assets/images/ch8_mirror_stranger.png` | 镜中陌生人 |
| `ch8_crack` | `./assets/images/ch8_crack.png` | 镜面裂纹特效 |
| `ch8_hourglass` | `./assets/images/ch8_hourglass.png` | 沙漏（限时提示） |
| `ch8_radio` | `./assets/images/ch8_radio.png` | 收音机道具 |

### Ch9 风铃

| manifest 键 | 文件路径 | 用途 |
|-------------|----------|------|
| `ch9_balcony` | `./assets/images/ch9_balcony.jpg` | 阳台场景背景 |
| `ch9_pipes` | `./assets/images/ch9_pipes.png` | 风铃管件 |
| `ch9_notebook` | `./assets/images/ch9_notebook.png` | 提示笔记本 |

### Ch10 记忆报告 / 终章

| manifest 键 | 文件路径 | 用途 |
|-------------|----------|------|
| `reportBase` | `./assets/images/report_base.png` | 记忆报告背景 |
| `ch10_livingroom` | `./assets/images/ch10_livingroom.jpg` | 客厅场景 |
| `ch10_porridge` | `./assets/images/ch10_porridge.png` | 粥碗道具 |

### 全局 UI & 场景

| manifest 键 | 文件路径 | 用途 |
|-------------|----------|------|
| `mainMenuBg` | `./assets/images/main_menu_bg.jpg` | 主菜单背景 |
| `deskBg` | `./assets/images/desk_bg.jpg` | 桌面场景 |
| `paperBase` | `./assets/images/paper_base.png` | 纸张底纹 |
| `paperNoise` | `./assets/images/paper_noise.png` | 纸张噪点纹理 |
| `buttonFrame` | `./assets/images/button_frame.png` | 按钮边框 |

---

## 汇总统计

| 分类 | 图片数 | 占比 |
|------|--------|------|
| Ch2 拼图 | 1 | 6.3% |
| Ch8 签字关卡 | 7 | 43.8% |
| Ch9 风铃 | 3 | 18.8% |
| Ch10 终章 | 3 | 18.8% |
| 全局 UI & 场景 | 5 | 31.3% |
| **总计** | **19** | — |

注：`ch8_*` 系列共 7 张图片，是资源最密集的章节，其关卡实现需要所有图片协同展示走廊→镜子→裂纹→沙漏→收音机的叙事序列。

## 使用方式

```javascript
// Loader 加载后通过 game.images 访问
this.game.images.puzzle      // HTMLImageElement
this.game.images.sign        // HTMLImageElement
this.game.images.mainMenuBg  // HTMLImageElement
// ...
```

各章节在 `onEnter()` 中通过 `this.game.images[key]` 获取对应图片，配合 `drawImageCover` 等工具函数绘制到 Canvas 上。
