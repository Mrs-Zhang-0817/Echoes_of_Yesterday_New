---
source: /Users/onebilion/One Billion/当前项目/亡羊补牢/CLAUDE.md
date: 未标注（与仓库同期，持续更新）
status: 有效（项目通用 Memory，所有智能体必须遵守）
---

# 项目规则（CLAUDE.md）

> 本文档是本项目**唯一事实来源**。任何 AI 智能体开始工作前必须先读本文件。其他文档与本文件冲突时以本文件为准。
> 注意：本文件只留本地，不进 GitHub 仓库（已在 `.git/info/exclude` 忽略）。

## 仓库身份

- **唯一仓库**：`https://github.com/Mrs-Zhang-0817/Echoes_of_Yesterday_New.git`
  即当前目录的 git `origin`。所有提交、推送、拉取只针对这个仓库。
- **禁区**：根目录下的 `Echoes_of_Yesterday/` 是一个**独立的旧 git 仓库**（origin 指向无 "New" 的旧仓库），与本项目不是同一套。
  - **一点都不许动**：不修改、不提交、不合并、不纳入推送、不当作参考实现。
  - 根 `.gitignore` 已忽略它，保持现状即可。
- 任何涉及 git 的操作前，先确认当前 remote 是 `Echoes_of_Yesterday_New.git`，推错仓库属于严重事故。

## 项目运行方式

- 入口：`index.html` → `<script type="module" src="src/main_new.js">`
- **不需要 dist/**；运行本体 = `src/` + `assets/images/` + `index.html` + 配置文件
- 本地预览：任意静态服务器（如 `python3 -m http.server`）打开 `index.html`

## 提交/推送口径

- **纳入版本库**：`src/`、`assets/images/`、`index.html`、配置文件、`docs/`
- **排除**（已在 `.gitignore`）：`assets/art-library/`（未验收 AI 图 146M）、`assets-source/`、`build_out/`、`dist/`、`*.zip`、`.workbuddy/`、`Echoes_of_Yesterday/`、根目录截图 `ch*.png`
- 智能体只负责 commit 到本地，**push 由用户在自己终端执行**（沙箱环境无法直连 GitHub）

## 分支纪律

- `main` = 完整可运行版本，只合入验证过的改动
- `fix/stability` = bug 修复工作分支
- 每修一个 bug 一个独立 commit，先在分支验证，再合并 main

## 已知问题与约定

- 已修复：ch08 签字关按钮不可点、ch07 不写存档、刷新回退一章、图片加载失败降级占位（详见 `docs/bug-inventory.md`）
- 待办：ch08 签名完成阈值 80% 偏高，可能软卡关，需真机调参
- 美术替换：新图用 `CHx_` 命名，与游戏内 `chx_` 键不同，替换前需建"新名→游戏键"映射表

## 通用工作规则

- 修改前先读相关代码，最小改动、匹配现有风格
- 删除文件、改远程仓库配置、任何不可逆操作：先问用户
- 文档只维护这一份，不要另建平台专属的重复说明文件

> 交叉引用：详细项目状态见 `01-02-PROJECT_STATUS-项目状态.md`；智能体规则见 `01-04-AGENTS-智能体规则.md`。
