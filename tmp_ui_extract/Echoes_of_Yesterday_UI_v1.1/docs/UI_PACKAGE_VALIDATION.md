# UI Runtime Package 验证记录

**版本：UI v1.1**  
**状态：预打包副本验证通过，等待 ZIP 确认**

## 验证环境

- 来源：`dist-ui-preview/Echoes_of_Yesterday_UI_v1.1/`
- 启动方式：独立静态 HTTP 服务
- 测试地址：`http://localhost:8091/`
- 验证方式：真实浏览器导航与 DOM 状态检查

## 功能链路

| 测试 | 结果 |
|---|---|
| 主界面加载 | 通过 |
| 主界面“开始回忆”进入 Artwork Chapter 02 | 通过 |
| Chapter 02 底图加载 | 通过 |
| Chapter 02 清晰度 5% → 15% | 通过 |
| 进度条同步完成至 15% | 通过 |
| 三个图片按钮恢复为 default | 通过 |
| “继续昨日”进入 Chapter 03 | 通过 |
| Chapter 03 的 15% → 15% 不增长 | 通过，状态为 stable |
| “返回主界面”返回 `main-menu.html` | 通过 |
| Chapter 10 底图加载 | 通过 |
| Chapter 10 清晰度 75% → 100% | 通过 |
| 浏览器 Console | 0 个项目错误 |

## 运行依赖确认

预打包副本保留了页面、`src/`、`assets/`、`pictures/`、
`记忆恢复报告新底图/`、按钮素材、样式、配置和导航脚本的原相对路径。

Memory Report 通过相对路径读取：

```text
./src/ui/memory-report-config.json
```

因此本包不依赖 Node 运行时或服务器 API；只需要由普通静态 HTTP 容器提供文件。
抖音互动空间发布环境可直接以 HTML5 静态资源方式加载。

## 本地测试注意

禁止使用 `file://` 双击打开。浏览器会阻止 JSON `fetch`。
本地需要使用静态服务器，例如：

```powershell
python -m http.server 8080
```

