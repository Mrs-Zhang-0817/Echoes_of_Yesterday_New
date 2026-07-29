const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUT_DIR = path.join(__dirname, 'build_out');

// 拼接顺序：确保依赖在前
const files = [
  // core
  'src/core/Game.js',
  'src/core/InputManager.js',
  'src/core/Loader.js',
  'src/core/ChapterManager.js',
  'src/core/ProgressStore.js',
  'src/core/Overlay.js',
  // utils
  'src/utils/sceneUtils.js',
  'src/utils/puzzleLayout.js',
  'src/utils/returnNightLayout.js',
  'src/utils/tableLayout.js',
  // chapter layouts
  'src/chapters/ch03_mazeLayout.js',
  // chapters (按章节顺序 01→10)
  'src/chapters/ch01_intro.js',
  'src/chapters/ch02_puzzle.js',
  'src/chapters/ch03_maze.js',
  'src/chapters/ch04_police.js',
  'src/chapters/ch05_door.js',
  'src/chapters/ch06_table.js',
  'src/chapters/ch07_night.js',
  'src/chapters/ch08_sign.js',
  'src/chapters/ch09_chime.js',
  'src/chapters/ch10_report.js',
  // main entry
  'src/main_new.js',
];

let combined = '';
for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`WARN: missing ${file}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  // 移除 import 和 export 语句
  content = content.replace(/^import\s+.*$/gm, '');
  content = content.replace(/^export\s+/gm, '');
  combined += `\n// ---- ${file} ----\n` + content + '\n';
}

// 生成 HTML
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>昨日重现</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%; height: 100dvh;
      overflow: hidden;
      position: fixed; top: 0; left: 0;
      background: #0d0805;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior: none;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    canvas {
      display: block;
      position: absolute;
      touch-action: none;
    }
    #loading {
      position: fixed; inset: 0; z-index: 100;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0d0805;
      color: #d4b896;
      transition: opacity 0.5s;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    #loading .title { font-size: clamp(18px, 4vw, 28px); margin-bottom: 16px; letter-spacing: 0.1em; }
    #loading .bar-wrap {
      width: min(200px, 40vw); height: 3px;
      background: rgba(212,184,150,0.2);
      border-radius: 2px; overflow: hidden;
    }
    #loading .bar-fill {
      height: 100%; width: 0%;
      background: #d4b896;
      border-radius: 2px;
      transition: width 0.3s;
    }
    #loading .hint { font-size: clamp(11px, 2vw, 14px); margin-top: 12px; opacity: 0.6; }
  </style>
</head>
<body>
  <div id="loading">
    <div class="title">昨日重现</div>
    <div class="bar-wrap"><div class="bar-fill" id="loadBar"></div></div>
    <div class="hint" id="loadHint">正在准备记忆碎片...</div>
  </div>
  <canvas id="gameCanvas" aria-label="昨日重现"></canvas>
  <script>
${combined}
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
console.log(`Built: ${path.join(OUT_DIR, 'index.html')} (${Buffer.byteLength(html, 'utf8')} bytes)`);
