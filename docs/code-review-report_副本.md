# Echoes_of_Yesterday — 代码审查报告

**审查日期**：2026-07-28  
**审查范围**：main 分支全量代码  
**审查方式**：GitHub API 逐文件读取（因网络原因无法 clone，无法做运行时测试）  
**审查人**：Robin-fang611（协作者）

---

## 一、项目总览

### 1.1 仓库信息

| 项目 | 值 |
|------|-----|
| 仓库名 | `Mrs-Zhang-0817/Echoes_of_Yesterday` |
| 分支 | main, codex/static-html-submission, xyqbranch, 郭乐琪 |
| 技术栈 | React 19 + Next.js 16 + TypeScript 5.9 + Vite 8 + Tailwind 4 + Drizzle ORM |
| 运行环境 | Node.js >= 22.13, pnpm |
| 目标 | 纯 HTML5 提交（非 Next.js 运行时） |

### 1.2 项目结构（main 分支）

```
Echoes_of_Yesterday/
├── index.html                        # 主菜单 Showcase 入口
├── memory-report.html                # 记忆报告页面（Chapter 回顾）
├── showcase-demo/                    # Next.js React 开发环境（UI 验证实验室）
│   ├── app/
│   │   ├── page.tsx                  # → SceneOne（主菜单）
│   │   ├── scene-one.tsx             # 主菜单 UI + 按钮组件 + Debug Panel
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json                  # Next.js 16 + React 19 + Vite 8
│   └── vite.config.ts
├── src/
│   ├── phase4.js                     # 主菜单交互（MemoryButton + PaperLayer + 场景切换）
│   ├── phase5.js                     # UI 初始化（资源加载 + 字体 + 材质 + PostProcess）
│   ├── memory-report-phase4.js       # 记忆报告交互层
│   ├── components/                   # 基础 DOM 组件
│   │   ├── Button.js                 # MemoryButton — 7 状态触摸按钮
│   │   ├── PaperLayer.js             # 纸张视觉层
│   │   └── MemoryStamp.js            # 印记动画组件
│   ├── animations/
│   │   ├── HoverEffects.js           # Hover 效果（仅桌面）
│   │   ├── PageTransition.js         # 页面过渡动画
│   │   └── (in ui/) MemoryRestorationSequence.js
│   ├── data/
│   │   ├── chapter_01.json           # Ch1 数据："第一次送你上学" (5→15%)
│   │   └── chapter_test.json         # Ch2 测试数据："风铃响起的时候" (15→32%)
│   └── ui/                           # 完整 UI 引擎
│       ├── core/                     # UIComponent, UILayer, UIManager, AssetRegistry, FontManager, TextStyleManager, UIAssetManager
│       ├── components/               # DateStamp, EmotionText, MemoryButton, MemoryClarity, MemoryItem, MemoryPanel, MemorySummary, MemoryThumbnail, PhotoFrame, RestoredMemoryList, ForgottenMemoryList, Stamp, TextBlock
│       ├── screens/
│       │   └── MemoryReportScreen.js # 三层纸片 + 照片框 + 记忆列表 完整布局
│       ├── animations/
│       │   └── MemoryRestorationSequence.js  # 记忆恢复时序动画
│       ├── materials/                # PaperMaterial, PhotoMaterial, TextMaterialLayer
│       ├── effects/UIPostProcess.js  # 后处理效果
│       ├── phase5/
│       │   ├── MemoryVisualSystem.js         # 记忆进度状态管理（发布-订阅）
│       │   └── MemoryReportVisualSystem.js   # 进度→CSS 变量→UI 渲染管线
│       ├── state/MemoryRestoreStateManager.js # localStorage 持久化
│       ├── data/MemoryItemDataSource.js
│       ├── typography/
│       │   ├── TypographyConfig.js    # 5 套字体配置
│       │   └── typography.css
│       └── styles/
│           ├── ui_constants.js        # UICanvas(1280×720), UIColor, Layout, Typography
│           ├── memory_report.css      # 记忆报告完整样式
│           ├── memory_restoration.css
│           ├── ui_materials.css
│           └── ui_motion.css
├── Design_Document/                   # UI 设计文档
│   ├── 昨日重现_UI_Visual_Bible_v1.0.docx
│   ├── 昨日重现_UI_Visual_Bible_v1.1_Mobile_Landscape_Adaptation.docx
│   ├── 昨日重现_UI_Motion_Bible_v1.0.md
│   └── Yesterday_Reappearance_Typography_Bible_v1.0.md
├── MemoryReport/                      # 记忆报告美术资源
├── assets/                            # UI 素材（字体、纸张纹理、按钮框、图标）
├── 美术素材/第二关拼图/               # ★ Ch2 拼图美术资源
│   ├── 客厅场景底图.png               # → 家场景
│   ├── 桌面.png                       # → 桌面特写
│   └── 拼图.png                       # → 拼图原图
└── pictures/                          # 额外图片资源
```

---

## 二、已实现功能审查

### 2.1 ✅ 主菜单 Showcase（Scene 01）

**状态**：完全实现，品质优秀

**涉及文件**：
- `index.html` + `src/phase4.js` + `src/phase5.js`（静态 HTML 版）
- `showcase-demo/app/scene-one.tsx`（React 开发版）

**功能清单**：
- [x] 5 个主菜单按钮（开始回忆/继续昨日/章节选择/时间胶囊/设置）
- [x] 统一纸张按钮组件（sprite sheet + CSS background-position 切换）
- [x] 6 种按钮状态：Idle → Touch Down → Touch Hold → Touch Release → Selected → Disabled
- [x] "开始回忆"特殊视觉：HDR 发光（`box-shadow` 暖色 + `brightness(1.13)`）
- [x] Pointer Events 实现：pointerdown/up/cancel + setPointerCapture
- [x] Hold 检测：360ms 长按进入 Hold 状态
- [x] 章节选择面板：纸片弹出 + 3 个章节卡片（已完成/当前/未解锁）
- [x] 设置面板：纸片弹出
- [x] Debug 面板：实时显示 Element ID / State / Motion ID / Target
- [x] 场景交接动画：旧相册翻开 → 记忆照片浮现 → "合上相册"返回
- [x] 竖屏阻断提示："请横握手机"
- [x] 逻辑画布 1280×720，16:9 自适应缩放

**未实现（根据 Showcase Spec）**：
- [ ] Scene 02 Memory Archive Showcase
- [ ] Scene 03 Photo Reconstruction Showcase（= 拼图玩法！）
- [ ] Scene 04 Chapter Recovery Report Showcase
- [ ] Component Gallery
- [ ] Motion Validation Lab
- [ ] 全量 QA Checklist

### 2.2 ✅ 记忆报告页面（Memory Report）

**状态**：架构完备，功能实现，但仅用于展示章节回顾数据

**涉及文件**：
- `memory-report.html` + `src/memory-report-phase4.js`
- `src/ui/MemoryReportApp.js` → 应用工厂函数
- `src/ui/screens/MemoryReportScreen.js` → 复杂三层纸片布局
- `src/ui/phase5/MemoryReportVisualSystem.js` → 进度→CSS 渲染管线
- `src/ui/state/MemoryRestoreStateManager.js` → localStorage 持久化

**功能清单**：
- [x] 纸片三层布局（左：情感文字+清晰度 / 中：已恢复记忆 / 右：尚未想起）
- [x] 照片框（带旧照片 + 笔记标注）
- [x] 记忆恢复序列动画：纸片唤醒 → 记忆条逐项浮现 → 清晰度滑动 → 文字揭示 → 照片恢复 → 印记
- [x] 记忆清晰度 CSS 驱动：`--memory-clarity`, `--ink-opacity`, `--memory-glow-alpha` 等
- [x] 3 个底部按钮（继续昨日/查看记忆档案/返回主界面）
- [x] 章节数据 JSON 驱动（chapter_01.json / chapter_test.json）
- [x] 恢复进度 localStorage 持久化（`MemoryRestoreStateManager`）
- [x] 恢复中锁定按钮交互（`MEMORY_RESTORE_LOCK/UNLOCK` 事件）
- [x] 页面过渡动画（`MemoryPageTransition`）
- [x] 5 套字体系统（Title/Chapter/Body/Handwriting/System）
- [x] 纸张材质系统（`PaperMaterial` — 纹理叠加 + 阴影 + 旋转微偏移）
- [x] 照片材质系统（`PhotoMaterial` — 清晰度驱动的饱和度/模糊/发光）
- [x] UI Post Process（全局滤镜）

**技术点评**：

UI 引擎代码质量很高：
- `UIComponent` → `UILayer` → `UIManager` 清晰的层级架构
- 发布-订阅模式的状态管理（`MemoryVisualSystem.subscribe`）
- CSS 变量驱动渲染，避免 JS 直接操作 DOM 样式
- 完整的数据验证（`validateChapterData`）
- 错误边界处理（`MemoryRestorationSequence` try-catch + 状态 lock）

### 2.3 ❌ Ch2 拼图玩法（关卡核心互动）

**状态**：❌ 完全未实现

**证据**：
- Showcase Spec 明确写了 "Scene 03 Photo Reconstruction Showcase" 未实现
- 内存中没有拼图拖拽、切片、吸附的任何代码
- `src/data/chapter_test.json` 只有记忆报告展示数据，没有拼图交互逻辑
- 所有现有代码都是 UI 层（菜单、按钮、面板、动画），没有任何 Canvas 互动玩法

**已有资源**：
- ✅ 拼图美术（`美术素材/第二关拼图/` 三张图）
- ✅ 记忆报告页可以展示 Ch2 的回顾数据
- ❌ 不做任何关卡互动

**这意味着**：当前仓库是一个 **UI 验证 Demo**，实现了主菜单和章节回顾报告两个页面的 UI。关卡本身的互动玩法完全没有写。

### 2.4 ⚠️ 架构问题

| 问题 | 严重度 | 说明 |
|------|--------|------|
| index.html 与 memory-report.html 是两套独立代码 | 中 | `index.html` 加载 `phase4.js`+`phase5.js`，`memory-report.html` 加载 `memory-report-phase4.js`+`ui/`。代码不共享，部分功能重复实现 |
| 静态 HTML 版 vs React 版双线开发 | 中 | `showcase-demo/` 用 Next.js+React，根目录用 vanilla JS，同功能两套代码 |
| `.pnpm-store` 被提交到 Git | 低 | 12MB+ 的 pnpm store 被误提交，增加仓库体积 |
| TypeScript 严格模式未开启 | 低 | `tsconfig.json` 未检查，可能隐藏类型错误 |
| 无 Canvas 互动代码 | 🔴 高 | 关卡玩法完全不涉及 Canvas 2D API，策划案的拼图/迷宫/手写/音游全未实现 |
| UI 架构与游戏逻辑未对接 | 🔴 高 | `MemoryReportScreen` 只展示静态数据，没有与实时游戏进度对接的接口 |

---

## 三、代码质量评估

### 3.1 亮点

1. **按钮组件设计**：`MemoryButton` 的 7 状态状态机设计干净，`PointerCapture` 处理规范，防止了 touch 事件穿透和误触
2. **CSS 变量渲染管线**：`--memory-clarity` 等 CSS 变量驱动全局 UI 变化，性能好且易于调试
3. **材质系统**：`PaperMaterial` / `PhotoMaterial` 对 DOM 元素施加纹理、阴影、旋转偏移，统一了"旧纸张/旧照片"的视觉语言
4. **事件总线**：`MemoryVisualSystem` 的 subscribe/emit 模式 + EventTarget 实现了解耦的状态通知
5. **状态持久化**：`MemoryRestoreStateManager` 同时支持 localStorage 和内存 fallback，处理了隐私模式下的异常
6. **移动端适配**：Pointer Events（非 Mouse Events）、`viewport-fit=cover`、16:9 比例缩放、user-scalable=no 都正确
7. **数据验证**：`validateChapterData` 对 JSON 输入做结构校验，防御了缺失字段导致的运行时崩溃

### 3.2 可改进点

| 问题 | 文件 | 建议 |
|------|------|------|
| `phase4.js` 和 `phase5.js` 命名无意义 | src/phase4.js, src/phase5.js | 重命名为 `main-menu-interactions.js` 和 `main-menu-init.js` |
| `chapter_test.json` 数据与实际 Ch2 不符 | src/data/chapter_test.json | 更新为正确的 Ch2 数据（照片、记忆条目、进度 5→15%） |
| `MemoryButton` 同一文件 export 了两个东西 | src/components/Button.js | `MemoryButton` 和 `ButtonState` 应该分开 |
| `window.YesterdayPhase5` 全局变量 | src/phase5.js | 应整合到统一的 `window.YesterdayApp` 或模块化导出 |
| 缺少 ARIA label 的中文翻译 | 多处 | 部分 aria-label 仍为英文 |
| 无单元测试 | - | 仅 `rendered-html.test.mjs` 一个测试文件 |
| 无错误边界 UI | - | API 失败或 JSON 解析失败时无用户可见的降级 UI |

---

## 四、拼图玩法缺失分析

### 4.1 策划案 vs 现状

| 策划案需求 | 当前状态 | 差距 |
|------------|----------|------|
| 家场景 → 点击桌子 → 桌面特写 → 点击拼图 | ❌ | 三张美术图在 `美术素材/第二关拼图/` 但无加载/渲染代码 |
| 3×3 拼图切片 | ❌ | 无 Canvas 图片切割逻辑 |
| 碎片打乱散落 | ❌ | 无 |
| 拖拽移动交互 | ❌ | 无 Canvas 拖拽；现有 Pointer Events 仅用于按钮 |
| 40px 吸附判断 | ❌ | 无 |
| 灰度→彩色恢复 | ❌ | 现有 `saturate()` 通过 CSS filter 实现，未用于 Canvas |
| 3 秒彩色展示 → 褪色 | ❌ | 无 |
| 记忆进度 5→15% 更新 | ❌ | `MemoryVisualSystem.setMemoryProgress` 存在但未与玩法对接 |
| 关卡完成 → 跳转记忆报告 | ⚠️ | `memory-report.html?chapter=chapter_01` 支持跳转，但无触发源 |

### 4.2 需要新建的文件（拼图玩法）

```
src/
├── main.js                       # Canvas 入口 + 场景管理（全新）
├── core/
│   ├── Game.js                   # rAF 主循环（全新）
│   ├── Loader.js                 # 图片预加载（全新）
│   ├── InputManager.js           # Canvas touch/mouse 统一（全新）
│   └── SceneManager.js           # 场景切换 + 过渡（全新）
└── scenes/
    ├── Scene_Room.js             # 家场景（全新）
    ├── Scene_Desk.js             # 桌面特写（全新）
    └── Scene_Puzzle.js           # 3×3 拼图交互（全新）
```

### 4.3 可复用的现有代码

| 现有模块 | 复用方式 |
|----------|----------|
| `UICanvas` (1280×720) | 直接复用逻辑分辨率常量 |
| `MemoryVisualSystem.setMemoryProgress()` | 拼图完成时调用，更新进度 |
| `MemoryRestoreStateManager` | 持久化 Ch2 拼图完成状态 |
| `src/ui/styles/ui_constants.js` | 复用颜色/字体/布局常量 |
| `MemoryPageTransition` | 关卡完成后过渡到记忆报告 |
| `美术素材/第二关拼图/` 三张图 | 直接用于 Canvas 背景 + 拼图原图 |

---

## 五、其他分支状况

### 5.1 `codex/static-html-submission` 分支

与 main 几乎完全相同，仅包含 `showcase-demo/` 和 `.pnpm-store/`。可能是某次提交前的备份。

### 5.2 `xyqbranch` 分支

包含 `README.md` 和 `showcase-demo/`，但缺少大部分 `src/` 下的代码文件。可能是辛亦琦的独立开发分支，内容不完整或合并过。

### 5.3 `郭乐琪` 分支

与 xyqbranch 几乎完全相同。同上。

---

## 六、建议行动

### 🔴 高优先级

1. **实现 Ch2 拼图玩法**（`Scene_Puzzle.js`）— 这是当前最大的缺失
2. **搭建 Canvas 渲染管线**（`Game.js` + `SceneManager.js` + `InputManager.js`）
3. **将 Canvas 关卡与现有 MemoryReport UI 打通**

### 🟡 中优先级

4. 统一静态 HTML 版和 React 版的代码库（删掉一个）
5. 清理 `.pnpm-store` 误提交（加到 `.gitignore`）
6. 重命名 `phase4.js`/`phase5.js`
7. 更新 `chapter_test.json` 数据匹配实际 Ch2 内容

### 🟢 低优先级

8. 补单元测试
9. 补充错误边界 UI
10. 补充中文 ARIA label

---

## 七、总结

**当前仓库是一个前端 UI 验证 Demo，品质不错，但没有任何关卡玩法代码。**

- **已做好**：主菜单 UI（含 6 状态按钮 + 纸片面板 + Debug 工具 + 场景交接动画）+ 记忆报告页 UI（三层纸片布局 + 恢复动画 + 进度持久化）
- **没做**：全部 10 章的 Canvas 互动玩法，包括 Ch2 拼图
- **可复用**：UI 引擎代码质量高，1280×720 逻辑分辨率、CSS 变量渲染管线、状态持久化都可以直接对接后续的 Canvas 关卡

**如果目标是完成 Ch2 拼图关卡**，需要新建 ~8 个 JS 文件（约 800-1200 行代码），基于现有美术资源（三张图已在 `美术素材/第二关拼图/`）和 UI 规范（`ui_constants.js`、颜色/字体 Token）从零搭建 Canvas 游戏层。
