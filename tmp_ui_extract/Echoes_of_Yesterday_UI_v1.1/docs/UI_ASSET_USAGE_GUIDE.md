# 《昨日重现》UI 与图片资源使用指南

**适用版本：UI v1.1**  
**打包状态：预览待确认**

## 1. 正式运行入口

| 顺序 | 页面 | 用途 |
|---:|---|---|
| 01 | `main-menu.html` | 正式主界面与游戏入口 |
| 02 | `chapter-select.html` | 当前工作区新增的十章章节档案选择页 |
| 03 | `memory-report-artwork.html` | Chapter 01–10 记忆恢复报告 |
| 04 | `memory-report.html` | 旧版报告兼容入口，不用于新章节 |

本地测试必须通过 HTTP 服务打开，不能直接双击 HTML：

```powershell
python -m http.server 8080
```

然后访问：

- `http://localhost:8080/main-menu.html`
- `http://localhost:8080/memory-report-artwork.html?chapter=chapter_01`
- 将 `chapter_01` 替换为 `chapter_02` 至 `chapter_10`

## 2. 正式 UI 调用

游戏代码只能通过统一接口打开 UI：

```js
import {
  openMainMenu,
  openMemoryReport,
} from "./src/ui/UIManager.js";

openMainMenu();
await openMemoryReport("chapter_07");
```

不要在剧情或关卡代码中直接修改正式 UI DOM、CSS、按钮坐标或图片地址。

## 3. Memory Report 章节顺序

| 顺序 | ID | 底图 | 清晰度 |
|---:|---|---|---:|
| 01 | `chapter_01` | `第一章.png` | 0% → 5% |
| 02 | `chapter_02` | `第二章.png` | 5% → 15% |
| 03 | `chapter_03` | `第三章.png` | 15% → 15% |
| 04 | `chapter_04` | `第四章 (2).png` | 15% → 25% |
| 05 | `chapter_05` | `第五章.png` | 25% → 35% |
| 06 | `chapter_06` | `第六章.png` | 35% → 45% |
| 07 | `chapter_07` | `第七章 (2).png` | 45% → 55% |
| 08 | `chapter_08` | `第八章.png` | 55% → 65% |
| 09 | `chapter_09` | `第九章.png` | 65% → 75% |
| 10 | `chapter_10` | `第十章.png` | 75% → 100% |

数据统一维护于 `src/ui/memory-report-config.json`。

## 4. 图片资源分类与使用顺序

### A. 正式主界面

目录：`pictures/`

- `主界面底图.jpg`：主界面完整背景
- `按钮图.png`：主界面按钮视觉
- `书本翻页底图.png`：旧翻页流程素材，当前正式直达流程不使用

### B. 正式 Artwork Memory Report

目录：`记忆恢复报告新底图/`

- `第一章.png` 至 `第十章.png`：完整章节报告底图
- `memorybutton1-transparent.png`：返回主界面
- `memorybutton2-transparent.png`：查看记忆档案
- `memorybutton3-transparent.png`：继续昨日
- 非透明按钮文件保留为原始素材，不作为正式页面按钮来源

### C. Memory Report 旧版与通用 UI

- `MemoryReport/BackgroundLayer/`：旧版报告背景
- `MemoryReport/PhotoLayer/`：旧版章节照片
- `assets/ui/`：纸张纹理、按钮框和 UI 材质
- `assets/memory_items/`：旧版动态记忆条目图片

### D. 关卡美术素材

- `第一章/`
- `第四章·警局/`
- `第四章第一视角情景演示/`
- `美术素材/`
- `assets/images/`

这些图片属于关卡内容，不应被 Memory Report 页面直接覆盖或重新排版。

### E. 设计参考与展示副本

- `Design_Document/Reference_Image/`：设计参考，不参与运行
- `showcase-demo/public/`：展示项目副本，不是正式页面的资产来源

## 5. 正式 UI 文件顺序

### 页面层

1. `main-menu.html`
2. `chapter-select.html`（当前未提交新增页面）
3. `memory-report-artwork.html`
4. `memory-report.html`（兼容）

### 接口与配置层

1. `src/ui/UIManager.js`
2. `src/ui/MainMenuUI.js`
3. `src/ui/MemoryReportUI.js`
4. `src/ui/ui-config.js`
5. `src/ui/memory-report-config.json`

### Artwork 逻辑层

1. `src/memory-report-artwork.js`
2. `src/memory-report-artwork-config.js`
3. `src/components/Button.js`

### 样式与字体层

1. `src/styles/memory-report-artwork.css`
2. `src/styles/ui_motion.css`
3. `src/ui/typography/typography.css`
4. `src/ui/typography/TypographyConfig.js`
5. `assets/fonts/`（当前仓库未包含字体文件，见下方说明）

字体 CSS 引用了 `Title.ttf`、`Chapter.ttf`、`Body.ttf` 和
`Handwriting.ttf`，但当前工作区没有这些文件。浏览器目前使用楷体、仿宋等
本机字体回退，因此现有页面仍可运行。最终跨设备发布前，建议补齐已授权字体，
否则不同电脑和抖音互动空间中的字形可能存在差异。

### 旧版兼容层

`src/ui/screens/`、`src/ui/components/`、`src/ui/materials/`、
`src/ui/animations/` 与 `src/memory-report-phase4.js` 保留，不用于创建新的
Artwork 页面。

## 6. 图片按钮规范

按钮功能映射固定：

| 位置 | 图片 | 功能 |
|---|---|---|
| 左 | `memorybutton1-transparent.png` | 返回主界面 |
| 中 | `memorybutton2-transparent.png` | 查看记忆档案 |
| 右 | `memorybutton3-transparent.png` | 继续昨日 |

按钮状态由 `Button.js` 管理。禁止在章节代码中重新创建 HTML 文字按钮。

## 7. 打包结构

确认后生成的 ZIP 将保持以下结构：

```text
Echoes_of_Yesterday_UI_v1.1/
  README_UI_PACKAGE.md
  UI_ASSET_MANIFEST.json
  UI_PACKAGE_FILELIST.txt
  project/
    main-menu.html
    memory-report-artwork.html
    memory-report.html
    chapter-select.html
    pictures/
    记忆恢复报告新底图/
    MemoryReport/
    assets/
    Design_Document/Reference_Image/
    第一章/
    第四章·警局/
    美术素材/
    src/ui/
    src/styles/
    src/components/
    src/animations/
    src/memory-report-artwork.js
    src/memory-report-artwork-config.js
    src/memory-report-phase4.js
    src/phase4.js
    scripts/chapter-select.js
    styles/chapter-select.css
```

原始相对路径会保留，确保 HTML5 静态服务器可以直接运行。

## 8. 打包前确认项

- 检查图片画廊中是否存在不应进入压缩包的草稿
- 确认旧版 Memory Report 是否需要保留
- 确认 Design Document 参考图是否进入包内
- 确认 showcase-demo 副本是否排除
- 确认最终压缩包名称

## 9. 完整运行验证

压缩前必须从独立预打包副本完成：

1. 主界面进入 Artwork Memory Report
2. 清晰度数字与进度条推进
3. `memoryFrom == memoryTo` 的静止章节
4. 继续下一章
5. 返回主界面
6. Chapter 10 达到 100%

本次验证结果见 `docs/UI_PACKAGE_VALIDATION.md`。
