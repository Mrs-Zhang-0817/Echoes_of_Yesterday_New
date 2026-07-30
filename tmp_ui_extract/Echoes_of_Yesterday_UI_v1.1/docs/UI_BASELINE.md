# 《昨日重现》Production UI Baseline

**版本：UI v1.0**  
**状态：Frozen / Production Baseline**

## 1. 正式 UI 页面

### `main-menu.html`

主界面，负责游戏入口、“开始回忆”以及从其他界面返回后的统一落点。

### `memory-report-artwork.html`

章节完成后的记忆恢复报告。页面加载对应章节整张美术底图，仅由代码覆盖记忆清晰度和三个图片按钮交互层。

旧版 `memory-report.html` 仍保留用于兼容和回退，但不属于新的正式 Artwork 流程。

## 2. 冻结范围

以下内容属于 UI v1.0，不得被剧情或关卡代码直接修改：

- 主界面布局、背景、按钮位置及动效
- Artwork Memory Report 布局、尺寸比例和覆盖层坐标
- 三个按钮图片、裁切参数、hover/pressed/disabled 视觉
- 章节底图、字体、纸张材质及既有动画参数
- `src/styles/memory-report-artwork.css`
- `src/styles/ui_motion.css`
- `src/components/Button.js`

## 3. 资源与模块结构

```text
main-menu.html                         主界面入口
memory-report-artwork.html             Artwork Report 入口
pictures/
  主界面底图.jpg                       主界面背景
  按钮图.png                           主界面按钮资产
记忆恢复报告新底图/
  第一章.png … 第九章.png              章节整图
  memorybutton1-transparent.png        返回主界面
  memorybutton2-transparent.png        查看记忆档案
  memorybutton3-transparent.png        继续昨日
src/
  phase4.js                            主界面行为与导航
  memory-report-artwork.js             Report 动态覆盖及交互
  memory-report-artwork-config.js      JSON 加载与内置回退配置
  components/Button.js                 统一按钮状态机
  styles/memory-report-artwork.css     Artwork Report 冻结样式
  styles/ui_motion.css                 UI 动效规则
  ui/
    UIManager.js                       游戏侧统一入口
    MainMenuUI.js                      主界面接口
    MemoryReportUI.js                  Report 接口
    ui-config.js                       UI 路径、事件和版本
    memory-report-config.json          章节数据与坐标配置
```

## 4. 视觉基线校验

冻结时通过 SHA-256 记录核心资源。后续变更必须在 `UI_CHANGELOG.md`
中升级版本并说明原因。

| 资源 | SHA-256 |
|---|---|
| `pictures/主界面底图.jpg` | `80A812173AB3B21DB9D6FD8361928E30AC9650574CA7D02EFD01255631DF18B4` |
| `pictures/按钮图.png` | `FBC5012BE298B24B011BD7C85A00E1A3C5AF394E72A3DE0762F2B21FC2043916` |
| `memorybutton1-transparent.png` | `421DDB8BF782A1978B7F10C82D858743650313DA4D2C277E44F84650666BFEBC` |
| `memorybutton2-transparent.png` | `75FFE1F4B74AD614F1A9A9B0D0FF0B635ECC7CB5A7F86DA3ABCF0B5F60C4705A` |
| `memorybutton3-transparent.png` | `BAAD18BC978992E8E8B40FE68E5DB5916CD04FD62282E3FFF39055A681312D81` |
| `memory-report-artwork.css` | `C6719CE71BE1E1BF2BF5C03D7DA113F45EDB13C81950E11CA527C307FD73286C` |
| `ui_motion.css` | `CF4F6712FF3A5D7AF848F94F55C4179BC05836F4317B27223302EB0AA33A0E02` |

## 5. 变更规则

剧情、关卡和存档系统只允许调用 `src/ui/UIManager.js`。新增章节优先只改
`src/ui/memory-report-config.json`。任何视觉修改必须先升级 UI 版本、记录
变更原因，并重新执行九章、主界面和导航回归测试。
