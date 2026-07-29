# 代码健康修复计划（稳定性优先）

制定日期：2026-07-29
前置约束：不丢失未提交文件 / 不破坏代码结构 / 不影响美术素材占位与替换流程

## 现状基线

- git 未提交：101 个文件（10 个已修改源码 + 91 个新文件）
- 新文件构成：assets/images 新美术素材约 60 张、根目录调试截图 20 张、docs 2 份、build_out 产物、临时目录
- 审查报告（2026-07-29）：无 P0，1 个 P1（ch05/ch06 记忆百分比文案不一致），2 个 P2
- 实际体验存在大量 bug 与卡关 → 静态审查与真机体验有差距，需实测清查
- 分支：仅 main，本地领先 origin/main 3 个提交

## Phase 0 · 安全网（最优先）

1. 补 `.gitignore`：
   - 根目录调试截图 `ch*.png`
   - `.playwright-mcp/`、`.tmp_feishu_imgs/`、`build_out/screenshots/`
2. 在 main 落检查点提交（checkpoint）：全部素材、docs、10 个源码改动入库
3. 从检查点创建 `fix/stability` 分支，后续修复全部在该分支进行
4. main 冻结：只接受 fix/stability 验证后的合并

> 原理：分支本身不保护未提交改动（未提交改动切分支会跟着走）。
> 必须先提交再开分支，提交是唯一可靠的保险，且完全不动工作区文件。

## Phase 1 · 卡关清查（只诊断，不改代码）

- 逐章实测 ch01–ch10（浏览器 + DebugAPI/forceComplete 辅助）
- 产出 `docs/bug-inventory.md`，每条记录：
  - 章节 / 复现步骤 / 卡死表现 / 疑似原因 / 优先级（P0=卡关、P1=体验、P2=质量）
- 修复前先有完整清单，禁止边测边改

## Phase 2 · 按优先级修复

- P0 卡关：逐个修复，每修一个 → 全流程回归 → 单独 commit（保证可单步回退）
- P1：ch05 memory=40 显示 35%、ch06 memory=52 显示 45%（统一为实际值或纯叙事文案）
- P2：DebugAPI inspect 输出过滤大数组；3 个缺 Echoes dist 的测试标记 skip

## Phase 3 · 结构加固

- ChapterManager 章节完成契约：统一 overlay → markChapterComplete → switchTo，不许旁路
- Loader 素材加载失败回退：图片缺失/加载失败时渲染程序化占位，不白屏不卡关
- 每章生命周期检查：enter/exit 清理定时器、事件监听、粒子数组

## Phase 4 · 美术替换协议（与修复并行，互不干扰）

- 新素材一律同名覆盖 `assets/images/` 下现有文件；manifest 键与代码引用不变
- 替换素材永远不改代码 → 占位不受修复分支影响
- 未验收新图先放 `assets-source/`，人工确认后再复制进 `assets/images/`
- 尺寸约定：替换图保持与原图相同宽高比（代码按 manifest 键取图，不校验尺寸时需目测）

## Phase 5 · 验证与合并

- 全 10 章手动通关一遍
- `node build.cjs` 构建通过，build_out/index.html < 200KB
- 测试套件通过（跳过项除外）
- `fix/stability` 合并回 main，打 tag

## 提交纪律

- 一个 bug 一个 commit，消息格式：`fix(chXX): 描述`
- 素材替换单独 commit：`assets: 替换 chX_xxx`
- 禁止 `git reset --hard` / 强推 / 改写历史
