# 《昨日重现》游戏 UI 接入指南

## 基本原则

剧情和关卡代码不得修改正式 UI 的 HTML、CSS、图片或 DOM。所有页面切换均
通过 `src/ui/UIManager.js`；章节美术、清晰度与按钮坐标由
`src/ui/memory-report-config.json` 管理。

## 调用主界面

```js
import { openMainMenu } from "./src/ui/UIManager.js";

openMainMenu();
```

## 调用章节报告

推荐只传章节 ID，让策划配置成为唯一数据源：

```js
import { openMemoryReport } from "./src/ui/UIManager.js";

await openMemoryReport("chapter_02");
```

接口也兼容显式数据，用于受控测试或存档恢复：

```js
await openMemoryReport({
  chapter: "chapter_02",
  memoryFrom: 5,
  memoryTo: 15,
});
```

## 事件接入

```js
window.addEventListener("CHAPTER_COMPLETED", async (event) => {
  await openMemoryReport(event.detail.chapterId);
});
```

接口导航前会派发：

- `yesterday-ui:main-menu-opening`
- `yesterday-ui:memory-report-opening`
- `yesterday-ui:navigation-error`

## 新增章节

1. 将最终底图放入 `记忆恢复报告新底图/`。
2. 在 `src/ui/memory-report-config.json` 的 `chapters` 中新增记录。
3. 将章节 ID 加入 `chapterOrder`。
4. 不修改页面结构、按钮系统或 CSS。
5. 测试直接链接、清晰度变化、三个按钮以及主界面返回路径。

## 禁止事项

- 直接调用 `document.querySelector` 修改正式 UI
- 从关卡代码替换背景、按钮图片或样式
- 恢复旧版动态 HTML 文字报告
- 绕过配置文件硬编码章节百分比
- 为单一章节复制一套 UI
