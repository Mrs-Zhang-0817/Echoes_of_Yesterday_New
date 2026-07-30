# 《昨日重现》项目现状文档

> 生成时间：2026-07-30 13:30
> 目标平台：抖音互动空间（赛道一）
> 包体限制：50MB（已申请突破官方 8MB 上限）

---

## 一、项目结构

```
抖音大区赛/
├── index.html                    # 入口：DOM 主菜单 + Canvas 游戏
├── build.cjs                     # 构建脚本（拼接 + 复制资源）
├── package.json                  # Playwright 测试依赖
├── playwright.config.js          # 测试配置
│
├── src/
│   ├── main_new.js               # 游戏入口（bootGame 函数，由主菜单调用）
│   ├── core/
│   │   ├── Game.js               # rAF 主循环
│   │   ├── InputManager.js       # Pointer Events 统一输入
│   │   ├── Loader.js             # 图片预加载 + 占位图降级
│   │   ├── ChapterManager.js     # 章节注册/切换/过渡/完成检测
│   │   ├── ProgressStore.js      # localStorage 存档
│   │   └── Overlay.js            # 完成报告弹层
│   ├── chapters/
│   │   ├── ch01_intro.js         # 镜前（破碎粒子 + 漫画收尾）
│   │   ├── ch02_puzzle.js        # 3×3 拼图 + 闪回 + 漫画收尾
│   │   ├── ch03_maze.js          # 迷宫连线 + 闪回 + 漫画收尾
│   │   ├── ch04_police.js        # 电话→签字→手环 + 漫画收尾
│   │   ├── ch05_door.js          # 电梯按钮 + 上升动画 + 漫画收尾
│   │   ├── ch06_table.js         # 搅拌面条 + 气味收集 + 漫画收尾
│   │   ├── ch07_night.js         # 弹幕气泡 + 找门锁
│   │   ├── ch08_sign.js          # 微笑检测/挥手 + 漫画收尾
│   │   ├── ch09_chime.js         # 色块重构 + 下落音游 + 漫画收尾
│   │   └── ch10_report.js        # 粥→蒙太奇→最终报告
│   ├── data/
│   │   ├── chapters.json         # 10 章元数据
│   │   ├── assetManifest.js      # 所有预加载图片清单
│   │   └── comicConfig.js        # 漫画场景配置（36 个场景）
│   ├── narrative/
│   │   ├── ComicActivity.js      # Canvas 漫画播放器
│   │   ├── FlashbackActivity.js  # 闪回帧动画
│   │   └── MontageActivity.js    # 终章蒙太奇
│   ├── interactions/
│   │   ├── SignaturePuzzle.js    # 签字模块
│   │   ├── DanmakuBubbleField.js # 弹幕气泡
│   │   └── SmileDetector.js      # 微笑检测
│   ├── ui/
│   │   ├── ArtworkMemoryReport.js # 记忆报告渲染器
│   │   └── MainMenu.js           # 主菜单控制器（IIFE，构建内联）
│   ├── utils/                    # 工具函数
│   └── dev/DebugAPI.js           # 调试接口
│
├── assets/
│   ├── images/                   # 游戏运行时图片（~19MB）
│   │   ├── report/               # 10 章报告底图 + 继续按钮
│   │   ├── comic_flat/           # 36 张漫画场景（扁平路径，~9MB）
│   │   └── ...                   # 各章节素材
│   ├── pictures/                 # UI 主菜单素材
│   │   ├── 主界面底图.jpg
│   │   ├── 按钮图.png            # 5 按钮精灵图
│   │   ├── 书本翻页底图.png
│   │   └── medical/              # 10 章医学知识图
│   ├── ui/                       # UI 设计系统素材
│   └── vendor/face-api/          # face-api 模型
│
├── build_out/                    # 构建产物
│   ├── index.html                # 内联单文件（~265KB JS+CSS）
│   └── assets/                   # 复制后的资源
│
├── Echoes_of_Yesterday/          # 旧仓库（禁止修改）
│   ├── main-menu.html            # 原 DOM 主菜单设计参考
│   ├── memory-report-artwork.html # 记忆报告设计参考
│   ├── MemoryReport/             # 报告底图/档案相片
│   └── src/                      # 旧 UI 框架源码
│
├── Echoes_Of_Yesterday_Rebuilt/  # 重构版（参考用）
│   ├── chapter-select.html       # 章节选择页
│   ├── medical-notes.html        # 医学知识翻页页
│   └── medical/                  # 医学 JPEG 小图
│
├── Echoes_Ch1-3_Extracted/       # Ch1-3 提取版
│
├── docs/                         # 策划文档
│   ├── 10-chapter-plan.md        # 10 关任务编排
│   ├── 策划案与现状差异清单.md    # 设计与实现差异
│   └── superpowers/specs/        # 交互设计规格
│
├── tests/                        # 测试
│   ├── release-build-runtime.test.js  # 构建完整性测试
│   ├── release-assets.test.js         # 资产完整性测试
│   └── ...                             # 其他模块测试
│
├── 抖音互动空间创作与上传规则.md  # 平台规则
├── CLAUDE.md                     # 项目规则
└── ye_v2_douyin.zip              # 最终构建 zip
```

---

## 二、当前建设进度

| 模块 | 状态 | 备注 |
|------|------|------|
| 主菜单 DOM | ✅ 完成 | UI v1.1 按钮精灵图 + 背景底图 |
| Canvas 游戏 | ✅ 完成 | 10 章完整链路 |
| 漫画整合 | ✅ 完成 | 36 场景，互动完成后播放作为收尾 |
| 记忆报告 | ✅ 完成 | UI v1.1 每章独立底图 + 按钮兜底 |
| 章节选择 | ✅ 完成 | 书本翻页风格弹层 |
| 医学知识 | ✅ 完成 | 10 章翻页浏览 + 解锁逻辑 |
| 设置弹层 | ✅ 完成 | 音效/震动开关 |
| 音频系统 | ❌ 未接入 | 13 SFX + 《让我们荡起双桨》 待接入 |
| 图片压缩 | ✅ 完成 | 从 137MB → 19MB（游戏图）+ 9MB（漫画） |
| 构建管线 | ✅ 完成 | build.cjs 内联 + zip 打包 |
| 抖音合规 | ✅ 完成 | 无网络请求/无外部依赖/无 alert |
| 包体控制 | ✅ 52MB | 接近 50MB 上限，需进一步压缩 |

---

## 三、已知 Bug / 待修复问题

### 🔴 P0 - 卡关问题

**1. Ch1 镜子碎裂后黑屏卡死**
- 现象：碎片粒子播放完后，黑屏，点任何地方无反应
- 原因：漫画图片通过中文路径加载失败（Loader 对中文 URL 在某些场景下返回空），ComicActivity 秒跳过 `_finish()`，但 _completed 设置后 overlay 的继续按钮因图片加载失败而不可见
- 临时修复：做了 Canvas 文字按钮兜底，comic 加延迟重试，但根因（中文路径）尚未在所有环境下验证
- 建议修复：**已移入扁平路径 `comic_flat/`**，需验证是否根治

**2. Ch2 拼图完成后卡死（"那抹色彩"淡出后）**
- 现象：和 Ch1 同样的问题
- 原因：同上，flashback → comic → overlay 链路中的图片加载问题
- 当前状态：依赖 ComicActivity 的重试逻辑

**3. Ch3~Ch9 潜在的同样问题**
- 依赖漫画加载的章节都存在相同风险
- 如果 `comic_flat` 路径解决了 Loader 问题，这些应该同时修复

### 🟡 P1 - 交互体验

**4. 漫画点击过于灵敏**
- 现象：点击一下漫画会跳多格
- 状态：✅ 已添加 350ms 冷却防抖

**5. 报告继续按钮**
- 现象：按钮图片 `button_continue.jpg` 是 PNG→JPEG 压缩，透明背景变黑块
- 状态：✅ Canvas 文字按钮兜底已实现，但黑块仍可能干扰视觉

### 🟢 P2 - 内容缺失

**6. Ch3 玩法偏离设计**
- 策划案要求"选左/中/右分支"，现状是"迷宫连线自动导航"
- 当前保留现状，未按策划重写

**7. Ch5 玩法偏离设计**
- 策划案要求"数字键盘输入503"，现状是"电梯按钮找向日葵"
- 当前保留现状

**8. 音频系统未接入**
- 13 种 SFX 在 `assets/sfx/` 但代码未调用
- 《让我们荡起双桨》在根目录但未接入

---

## 四、引用资料索引

| 来源 | 位置 | 内容 |
|------|------|------|
| 飞书《完整游戏设计文档》 | token: ZmCId20P0oAAusx2SaAc597cnAh | 10 章完整设计、人物设定、情感弧线 |
| 飞书《设计综合》 | token: U353w80ooiqhuhk5etNcCBDAnYb | 设计理念、章节表、互动系统架构 |
| 飞书《比赛备忘录》 | token: TWQjwGO2AiZ2urkxL0ucZF7Hn3f | 实测问题、美术资源总览 |
| 飞书《美术资源盘点》 | token: FgemdXAUDo33Wcx5wbbc4lycnrf | 83 个素材台账 |
| GitHub `漫画` 分支 | Robin-fang611/echoes-of-yesterday | 36 张漫画分镜场景图 |
| GitHub 原仓库 | Mrs-Zhang-0817/Echoes_of_Yesterday.git | 旧版代码 + UI 设计系统 |
| GitHub 新仓库 | Mrs-Zhang-0817/Echoes_of_Yesterday_New.git | 当前项目 origin |
| UI v1.1 设计系统 | Echoes_of_Yesterday 旧仓库 | 主菜单、报告、字体、动画圣经 |
| 抖音互动空间规则 | `./抖音互动空间创作与上传规则.md` | 平台合规要求 |
| AI 生成美术 | `Echoes_Of_Yesterday_Rebuilt/` | 重构版参考 |
| 医学知识图 | `Echoes_Of_Yesterday_Rebuilt/medical/` 或 `assets/pictures/medical/` | 10 章医学知识卡片 |

---

## 五、当前构建产物

| 项 | 值 |
|----|-----|
| 构建命令 | `node build.cjs` |
| 构建输出 | `build_out/` |
| 输出文件 | `build_out/index.html`（265KB 内联）+ `assets/` |
| 总包体 | `build_out/` 约 53MB，zip 约 52MB |
| 测试 | `npm test` 29/29 通过 |
| 本地预览 | `cd build_out && python3 -m http.server 3000` |
| 最终 zip | `ye_v2_douyin.zip` |

---

## 六、最短路径修复建议

1. **卡关修复** → 确认 `comic_flat` 路径解决了 Loader 中文路径问题后，全流程跑通
2. **图片压缩** → 报告底图从 JPEG Q55 降到 Q45，漫画再降到 Q55，目标 zip < 50MB
3. **音频接入** → 在 `src/core/` 加 AudioManager，手势解锁后播放
4. **测试** → Playwright 全流程截图验证每关操作前后状态
