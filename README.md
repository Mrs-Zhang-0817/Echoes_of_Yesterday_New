# 《昨日重现》

> X7 团队 · 抖音AI创变者计划 2026大区赛 · 赛道一 互动空间

## 当前进度

| 章节 | 名称 | 状态 |
|------|------|------|
| Ch1 | 序曲·镜前 | 🔲 占位 |
| Ch2 | 接女儿放学 | ✅ 拼图完成 |
| Ch3 | 迷途 | ✅ 迷宫连线完成 |
| Ch4 | 警局 | 🔲 占位 |
| Ch5 | 归家迷途 | ✅ 声相定位+电梯按钮完成 |
| Ch6 | 餐桌上的博弈 | ✅ 触觉感知+气味拼图完成 |
| Ch7 | 惊悚夜醒 | 🔲 占位 |
| Ch8 | 自我和解 | ✅ 签字完成 |
| Ch9 | 风铃 | 🔲 占位 |
| Ch10 | 认出 | 🔲 占位 |

## 技术架构

- 纯 HTML5 Canvas 2D，零外部依赖
- 逻辑分辨率 1280×720，等比缩放
- Pointer Events 统一输入
- ChapterManager 章节驱动
- build.js 单文件拼接打包

详见 `docs/DEVELOPMENT_STANDARD.md` 和 `docs/unified-tech-spec-v1.0.md`。

## 开发

```bash
# 开发模式（ES Modules，需要本地服务器）
npx serve .

# 构建上线包
node build.cjs
# 输出：build_out/index.html（单文件）
```

## 文件结构

```
src/
├── main.js                       # 旧入口（Ch2 only）
├── main_new.js                   # 统一入口（全章节）
├── core/
│   ├── Game.js                   # rAF 主循环
│   ├── InputManager.js           # Pointer Events
│   ├── Loader.js                 # 图片预加载
│   ├── ChapterManager.js         # 章节注册/切换
│   ├── ProgressStore.js          # localStorage 进度
│   └── Overlay.js               # Canvas 自绘弹层
├── chapters/
│   ├── ch02_puzzle.js            # Ch2 拼图
│   ├── ch03_maze.js              # Ch3 迷宫
│   ├── ch03_mazeLayout.js        # Ch3 地图配置
│   ├── ch05_door.js              # Ch5 归家
│   ├── ch06_table.js             # Ch6 餐桌
│   └── ch08_sign.js              # Ch8 签字
├── utils/
│   ├── sceneUtils.js             # 通用绘制工具
│   ├── puzzleLayout.js           # Ch2 拼图布局
│   ├── returnNightLayout.js      # Ch5 布局参数
│   └── tableLayout.js            # Ch6 布局参数
├── scenes/                       # 旧场景文件（Ch2 用）
└── data/
    └── chapters.json             # 章节元数据
```
