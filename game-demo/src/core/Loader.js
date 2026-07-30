export class Loader {
  static loadImages(manifest, onProgress = () => {}) {
    const entries = Object.entries(manifest);
    let loaded = 0;

    // 单张图失败不再让整游戏白屏：改为 resolve 占位图，loadImages 永不 reject
    const tasks = entries.map(([key, source]) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        loaded += 1;
        onProgress(loaded, entries.length, key);
        resolve([key, image]);
      };
      image.onerror = () => {
        loaded += 1;
        onProgress(loaded, entries.length, key);
        console.warn(`[Loader] 素材缺失/加载失败，已用占位图替代：${key} -> ${source}`);
        resolve([key, Loader.createPlaceholder(key, source)]);
      };
      image.src = source;
    }));

    return Promise.all(tasks).then(images => Object.fromEntries(images));
  }

  // 程序化占位图：底色 + 斜纹 + 文件名，保证 drawImage 可用、游戏不白屏不卡关
  static createPlaceholder(key, source = '') {
    const w = 256, h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#39404e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5a6478';
    ctx.lineWidth = 4;
    for (let i = -w; i < w; i += 22) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + w, h);
      ctx.stroke();
    }
    ctx.fillStyle = '#c9d2e3';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(key).slice(0, 20), w / 2, h / 2 - 8);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#8a93a8';
    ctx.fillText('missing asset', w / 2, h / 2 + 12);
    return canvas;
  }
}
