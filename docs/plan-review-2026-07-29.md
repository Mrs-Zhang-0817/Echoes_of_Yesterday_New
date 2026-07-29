# 《昨日重现》10-chapter-plan 交叉审核报告

> 审核时间：2026-07-29 15:30 ｜ 审核方式：4 路独立审核（平台合规 / 技术可行性 / 资产事实核查 / 叙事与项目管理）+ 本地实证
> 审核对象：`docs/10-chapter-plan.md`（v1，2026-07-29 中午版）
> 结论：**v1 存在 1 个阻断性产物缺陷 + 8 个高风险疏漏，不可直接执行。修订版已写入 `docs/10-chapter-plan.md`（v2）。**

---

## 一、🔴 严重问题（阻断执行，必须修）

### R1. 产物结构自相矛盾，按 v1 打包图片必然 404
- v1 第七节决策 1："单文件，全内联……抖音平台要求"；第八节却写"关键大图放在 `assets/images/`，相对路径引用"。
- 若按"单文件"打包，图片不进 zip，上传后全部 404 白屏；若按第八节带图片目录，则违反自己的决策 1。
- **实证**：平台规则一明确允许多文件 zip（官方推荐结构含 `js/`、`images/`、`audio/`），"单文件"是对规则的误判。真正被实证不支持 ES Modules 的是**妙搭托管**（见 fix-log），不是抖音。
- **修法**：产物 = `index.html`（JS/CSS 全内联单 `<script>`）+ `assets/images/*.jpg` 相对路径，zip 根目录直接含 index.html。

### R2. Ch5 门牌号"503"零线索来源，玩家必然卡死
- v1 全文没有交代玩家从何处得知 503；Ch1–Ch4 均未埋门牌号信息。数字键盘输入属于"无线索猜谜"。
- 且 Ch5 无容错（对比 Ch3 有"选错 3 次自动指路"）。
- **修法**：Ch4 警局登记单特写埋"XX 小区 5 栋 503"；Ch5 输错 3 次自动浮现答案（防卡死兜底，所有知识型关卡统一此规则）。

### R3. 时间赤字且零缓冲
- v1 排期 6.5h vs 当时可用 5.5h；**到现在（15:30）只剩 4.5h**。
- 关键路径（A 线 Phase1→2→4）串行 4.5h 已顶满，任何延误直接爆仓。
- **修法**：v2 按 15:30 重排，压缩为 P0(0.5h)+P1(1h)+P2(1.25h)+P3(0.75h)+P4(0.75h)=4.25h，留 15min 机动；骨架+占位章节在 P1 结束即可交付，之后逐关点亮。

### R4. Phase 2.4 验收在逻辑上不可执行
- "Ch2→Ch8 串联，从 Ch1 一路点到 Ch8"要求 Ch3–Ch7 存在，但这 5 关在 Phase 3 才开发。验收必然虚假打勾。
- **修法**：v2 在 Phase 1 就注册 10 章骨架（占位章节 = 程序化背景 + 完整文案演出 + 长按继续），全线可导航从第一天就成立；Phase 2/3 只做"替换占位为真互动"。

### R5. 单文件 + 4 人并行 + 无版本控制 = 互相覆盖
- v1 让 B/C/D 在 Phase 1 后并行开发，但最终产物是单个 index.html；**实证工作区根目录不是 git 仓库**，没有任何合并机制。
- **修法**：开发态模块化 `chapters/ch01.js … ch10.js`（每人一个文件，零冲突），构建态 `build.js` 拼接内联进 `dist/index.html`（昨天妙搭发布已有"10 个 JS 合并单 script"实证链路）；每 Phase 结束 tar 快照。

### R6. "npm test 全量回归 10/10"是假验收
- 实证 `tests/` 只有 `puzzleLayout.test.js`（10 个拼图几何纯函数用例）；ChapterManager、签字匹配、转场、DPR 零覆盖。新写 8 关后 10/10 不代表任何东西。
- **修法**：验收改为"现有 10 用例回归通过 + 每关冒烟清单（tests/manual-smoke-checklist.md 扩充）+ 真机全流程"。

### R7. 抖音上传链路零演练，v1 只在 4.5 留一步
- 账号权限、zip 格式、审核耗时全部未知，却排在最后 1 小时。这是今晚最大的单点风险。
- **修法**：Phase 0 第一件事——用现有 `.publish/` 内容打 zip 试传一次（30 分钟，不依赖任何开发）。同时验证 zip 不含 `__MACOSX`/`.DS_Store`、根目录直接见 index.html。

### R8. 资产盘点与事实不符（实证核对）
| v1 声称 | 实证 | 结论 |
|---|---|---|
| 三个独立文件 index + sign + **memory-report.html** | 根目录第三个是 `whiteboard.html`；memory-report.html 在 `Echoes_of_Yesterday/` 子仓库 | ❌ |
| 记忆报告 UI "代码存在，未接入" | 存在于本地 `Echoes_of_Yesterday/`（HEAD 停在 rollback tag，清洗未影响本地），但是 **DOM+CSS 方案**（127 行 HTML + 223 行 JS + 5 个外部 CSS 依赖），不能直接塞进 Canvas 单文件 | ⚠️ 需重写为 Canvas 简版 |
| 新版底图 6 张 | `记忆恢复报告新底图/` 只有第二/三/五章 3 张章节底图 + 6 个按钮图 | ⚠️ 缺 3 张 |
| Ch1 记忆物品 6 张 | `assets/memory_items/chapter01/` 只有 memory_001–005 共 5 张 + json | ⚠️ |
| scene_desk.jpg = desk_bg.png | 字节数不同（2,600,731 vs 2,518,526），是两个版本 | ❌ |
| 图片 4 张 10.7MB | 根目录 assets/images/ 实有 **10 个文件 16.4MB**，三组完全同内容（room_bg=scene_room、desk_bg=桌面、puzzle_img=拼图） | ⚠️ 比声称更糟 |
| Ch3–Ch10 无美术图 | 本地已有：主界面底图.jpg、记忆物品 5 张、章节底图 3 张、MemoryReport 全套（BackgroundLayer/PhotoLayer/档案页相片）、tmp_客厅场景底图.png 840K | ❌ 部分关卡有图可用 |

### R9. puzzle_img.png 是已损坏文件，"只留一份"可能留错
- fix-log 实证：`puzzle_img.png`（3.1MB）缺 PNG IEND 结束块，曾导致拼图黑边；正品是重编码的 `scene_puzzle.jpg`（420KB）。
- v1 Phase 1.1"三份重复只留一份"若留错文件，直接复现黑边 bug。
- **修法**：拼图图只保留 `scene_puzzle.jpg`（420K 正品）；删除 puzzle_img.png / 拼图.png。

---

## 二、🟡 中等问题（影响质量或效率）

| # | 问题 | 依据 | 修法 |
|---|---|---|---|
| M1 | 包体口径三处打架：≤6MB / ~3.5MB / 图片张数 3 vs 4 | §3、§4.1、§8 | v2 给逐张预算表，总目标 ≤3MB、硬上限 8MB |
| M2 | 自检清单"12 项"实为 14 项，且漏文案红线 | 规则九；规则五/七要求避免"游戏"字样 | v2 清单 15 项 = 官方 14 + 文案红线 1 |
| M3 | 签字关移植工作量低估：sign_to_whiteboard.html 287 行，独立 rAF + setInterval + 独立 DPR + DOM overlay 深耦合 | 技术审核实证 | v2 单独列 45min 任务，重写生命周期而非"内联" |
| M4 | `ctx.filter = saturate()` iOS Safari <18 不支持，拼图"褪色"核心演出在旧 iPhone 静默失效 | Scene_Puzzle.js:187 | 兜底：离屏 Canvas 预生成灰度图，不依赖运行时 filter |
| M5 | "移植现有 RenderUtils"——不存在此模块，只有 sceneUtils.js（45 行）；ChapterManager/ProgressStore 需新造 | src/ 实证 | v2 明确新造清单，复用仅限 Game/Loader/InputManager/SceneManager |
| M6 | 记忆进度数值体系缺失（README 只有 Ch2 5%→15%）；Ch10 报告数据来源未定义 | README vs v1 | v2 给出 10 关记忆数值表（5→15→22→30→40→52→60→72→85→100） |
| M7 | D 前 2 小时空转；可前置任务未排（上传演练/素材下载/图片压缩/真机准备） | v1 §5 | v2 Phase 0 全部前置给 D |
| M8 | 降级方案"记忆碎片浮现中…"占位会被评委一眼看穿 | 叙事审核 | v2 改为"占位章节也有完整文案演出"，砍互动不砍叙事闭环 |
| M9 | 无 checkpoint/备份策略 | 工作区无 git 实证 | 每 Phase 结束 `tar` 快照到 `backups/` |
| M10 | Ch2 策划案"互动 B 找钥匙"被砍无交代 | README §1.4 | v2 在 Ch2 文案交代（钥匙并入 Ch5 开门叙事） |
| M11 | dist/ 含 debug.html/test-capture.html；.publish/ 才是最新发布态（勿误删） | 实证 | 打包只从 build 输出目录取；.publish/ 保留 |
| M12 | 结算类弹层需"结果+下一步按钮+排他激活"，v1 ChapterReport 未明确 | 规则五 | v2 弹层基座统一实现 |
| M13 | 图片加载失败无兜底（签字关 bgImg=null 直接黑屏） | sign_to_whiteboard.html:281 | AssetLoader 失败→重试→自绘错误弹层 |

## 三、🟢 轻微

- Ch7"惊悚夜醒"表述注意尺度（规则七内容红线自查，实际演出保持悬疑而非惊吓）。
- Ch6"旋转 3 圈"略机械；Ch9 音符重组与拼图同质，反馈需差异化。
- 规则八平台限制（100 作品 / 100 人同时在线）无需处理，知悉即可。

---

## 四、审核中发现的 v1 亮点（保留）

1. 互动复杂度分级（🔴2/🟡3/🟢5）准确，排期可依此分配人力。
2. "主线优先降级"思路正确，v2 升级为"骨架可交付 + 逐关点亮"更安全的形式。
3. 图片压缩方向（JPEG Q75 + 降 1280×720）经实证可行——正品 scene_puzzle.jpg 420K 就是证据。
4. 复用 Ch2 已验证的横屏/DPR/安全区/防误触方案，是今晚最大的技术资产。

---

> 以上问题已全部落实到 `docs/10-chapter-plan.md`（v2）的对应章节。v1 原文见 `docs/10-chapter-plan_副本.md`。
