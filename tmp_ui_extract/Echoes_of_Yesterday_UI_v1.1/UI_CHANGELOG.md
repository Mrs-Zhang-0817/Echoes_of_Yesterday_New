# UI Changelog

## UI v1.1 — Chapter 10 and progress alignment

- 记忆清晰度覆盖区域整体下移，避免与章节底图中的说明文字重叠。
- 接入第十章 Artwork 底图。
- 第十章记忆清晰度配置为 75% → 100%。
- 保持图片按钮、页面比例、字体和既有交互效果不变。

## UI v1.0 — Production Baseline

- 冻结 `main-menu.html` 主界面。
- 冻结 `memory-report-artwork.html` Artwork Memory Report。
- 冻结整张章节底图 + 动态记忆清晰度覆盖层方案。
- 冻结三张 PNG 图片按钮、统一 Button 状态机和既有 hover 效果。
- 建立 `src/ui/UIManager.js` 游戏接入层。
- 建立独立的 `src/ui/memory-report-config.json`。

### 版本规则

后续任何视觉变化必须新增版本条目（v1.1、v1.2…），不得覆盖本条记录。
纯剧情数据扩展可以保持 UI v1.0，但仍需记录关联配置和回归结果。

### Chapter 01–09 data integration

- 接入第一章至第九章 Artwork 底图。
- 依据《昨日重现完整关卡设计(1).docx》的累计记忆解锁节点配置清晰度。
- 未改变 UI v1.0 的布局、图片按钮、字体或动画视觉。
