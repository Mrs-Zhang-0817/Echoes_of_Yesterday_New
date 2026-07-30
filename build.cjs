const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUT_DIR = path.join(__dirname, 'build_out');
const IMAGE_SRC_DIR = path.join(__dirname, 'assets', 'images');
const IMAGE_OUT_DIR = path.join(OUT_DIR, 'assets', 'images');
const VENDOR_SRC_DIR = path.join(__dirname, 'assets', 'vendor');
const VENDOR_OUT_DIR = path.join(OUT_DIR, 'assets', 'vendor');
const CHAPTERS_PATH = path.join(SRC_DIR, 'data', 'chapters.json');
const ASSET_MANIFEST_PATH = path.join(SRC_DIR, 'data', 'assetManifest.js');

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
  'src/ui/ArchiveUI.js',
  'src/ui/ArtworkMemoryReport.js',
  // comic config (新增)
  'src/data/comicConfig.js',
  'src/narrative/ComicActivity.js',
  'src/narrative/FlashbackActivity.js',
  'src/narrative/MontageActivity.js',
  'src/interactions/SignaturePuzzle.js',
  'src/interactions/DanmakuBubbleField.js',
  'src/interactions/SmileDetector.js',
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
  // main menu
  'src/ui/MainMenu.js',
  // dev
  'src/dev/DebugAPI.js',
  // main entry
  'src/main_new.js',
];

const gameChapters = `const GAME_CHAPTERS = ${fs.readFileSync(CHAPTERS_PATH, 'utf8')};\n`;
const assetManifest = fs.readFileSync(ASSET_MANIFEST_PATH, 'utf8')
  .replace(/^export\s+default\s+assetManifest;?\s*$/m, '');

let combined = `${gameChapters}\n${assetManifest}\n`;
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
  if (file === 'src/ui/ArtworkMemoryReport.js' || file === 'src/main_new.js') {
    content = content.replace(/\bCHAPTERS\b/g, 'GAME_CHAPTERS');
  }
  combined += `\n// ---- ${file} ----\n` + content + '\n';
}
// ComicActivity uses import from comicConfig, replace references
combined = combined.replace(/import\s*{\s*([^}]+)}\s*from\s*['\"]\.\.\/data\/comicConfig\.js['\"];?\s*/g, '');
combined = combined.replace(/import\s*{\s*([^}]+)}\s*from\s*['\"]\.\.\/\.\.\/data\/comicConfig\.js['\"];?\s*/g, '');

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
    button { font: inherit; }
    canvas {
      display: none;
      position: absolute;
      touch-action: none;
    }
    #loading {
      display: none;
      position: fixed; inset: 0; z-index: 100;
      flex-direction: column;
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

    /* ===== 主菜单 ===== */
    #mainMenu {
      position: fixed;
      z-index: 200;
      inset: 0;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 50% 45%, #50311c, #170c07 75%);
      font-family: "STKaiti", "KaiTi", "PingFang SC", serif;
    }
    .menu-stage {
      position: relative;
      width: min(100vw, calc(100svh * 16 / 9));
      aspect-ratio: 16 / 9;
      overflow: hidden;
      isolation: isolate;
      background: #2a180e;
      box-shadow: 0 18px 50px rgba(18, 8, 3, .58);
    }
    .scene-art {
      position: absolute;
      z-index: 0;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      user-select: none;
      pointer-events: none;
    }
    .menu {
      position: absolute;
      z-index: 10;
      left: 50%;
      top: 34.03%;
      width: 33.594%;
      display: grid;
      gap: 2px;
      transform: translateX(-50%);
    }
    .asset-button {
      --sprite-y: 0;
      position: relative;
      width: 100%;
      height: 65px;
      padding: 0;
      border: 0;
      appearance: none;
      background: transparent;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    .asset-button[data-sprite="start"] {
      height: 76px;
      --sprite-y: 0px;
    }
    .asset-button[data-sprite="continue"] { --sprite-y: -79px; }
    .asset-button[data-sprite="chapters"] { --sprite-y: -146px; }
    .asset-button[data-sprite="capsule"]   { --sprite-y: -213px; }
    .asset-button[data-sprite="settings"] { --sprite-y: -280px; }
    .asset-button[disabled] .button-sprite { opacity: 0.35; }
    .button-sprite {
      position: absolute;
      z-index: 2;
      inset: 0;
      background: url("./assets/pictures/按钮图.png") center var(--sprite-y) / 430px auto no-repeat;
      pointer-events: none;
    }
    @media (orientation: portrait) {
      #mainMenu::after {
        content: "请横握手机";
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        color: #f4ddb0;
        background: #25140b;
        font-size: 22px;
        letter-spacing: .12em;
      }
    }
    @media (max-height: 560px) {
      .asset-button { height: 9.03vh; }
      .asset-button[data-sprite="start"] { height: 10.55vh; }
      .button-sprite { background-size: 59.72vh auto; }
      .asset-button[data-sprite="continue"] { --sprite-y: -10.97vh; }
      .asset-button[data-sprite="chapters"] { --sprite-y: -20.28vh; }
      .asset-button[data-sprite="capsule"]   { --sprite-y: -29.58vh; }
      .asset-button[data-sprite="settings"] { --sprite-y: -38.89vh; }
    }
    @keyframes menuFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="mainMenu">
    <div class="menu-stage">
      <img class="scene-art" src="./assets/pictures/主界面底图.jpg" alt="" draggable="false">
      <nav class="menu" aria-label="主菜单">
        <button class="asset-button" id="BTN_START_MEMORY" data-sprite="start" aria-label="开始回忆"><span class="button-sprite" aria-hidden="true"></span></button>
        <button class="asset-button" id="BTN_CONTINUE" data-sprite="continue" aria-label="继续昨日" disabled><span class="button-sprite" aria-hidden="true"></span></button>
        <button class="asset-button" id="BTN_CHAPTERS" data-sprite="chapters" aria-label="章节选择"><span class="button-sprite" aria-hidden="true"></span></button>
        <button class="asset-button" id="BTN_CAPSULE" data-sprite="capsule" aria-label="时间胶囊"><span class="button-sprite" aria-hidden="true"></span></button>
        <button class="asset-button" id="BTN_SETTINGS" data-sprite="settings" aria-label="设置"><span class="button-sprite" aria-hidden="true"></span></button>
      </nav>
    </div>
  </div>
  <div id="loading">
    <div class="title">昨日重现</div>
    <div class="bar-wrap"><div class="bar-fill" id="loadBar"></div></div>
    <div class="hint" id="loadHint">正在准备记忆碎片...</div>
  </div>
  <canvas id="gameCanvas" aria-label="昨日重现"></canvas>
  <script src="./assets/vendor/face-api/face-api.min.js"></script>
  <script>
${combined}
  </script>
</body>
</html>`;

// 发布目录只能包含当前运行链路需要的文件，避免把中文路径的旧漫画原图重复打包。
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
fs.cpSync(IMAGE_SRC_DIR, IMAGE_OUT_DIR, {
  recursive: true,
  force: true,
  filter: source => {
    const relative = path.relative(IMAGE_SRC_DIR, source);
    return relative !== 'comic'
      && !relative.startsWith(`comic${path.sep}`)
      && relative !== path.join('comic_flat', 'ch06_04b.jpg');
  },
});
if (fs.existsSync(VENDOR_SRC_DIR)) fs.cpSync(VENDOR_SRC_DIR, VENDOR_OUT_DIR, { recursive: true, force: true });
// 复制 UI 素材
const PIC_SRC = path.join(__dirname, 'assets', 'pictures');
const PIC_OUT = path.join(OUT_DIR, 'assets', 'pictures');
if (fs.existsSync(PIC_SRC)) fs.cpSync(PIC_SRC, PIC_OUT, { recursive: true, force: true });
console.log(`Built: ${path.join(OUT_DIR, 'index.html')} (${Buffer.byteLength(html, 'utf8')} bytes)`);
