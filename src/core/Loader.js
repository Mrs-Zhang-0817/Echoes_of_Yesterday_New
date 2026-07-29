export class Loader {
  static loadImages(manifest, onProgress = () => {}) {
    const entries = Object.entries(manifest);
    let loaded = 0;
    const total = entries.length;

    return Promise.all(entries.map(([key, source]) => new Promise((resolve) => {
      let retried = false;

      function tryLoad() {
        const image = new Image();
        image.onload = () => {
          loaded += 1;
          onProgress(loaded, total, key);
          resolve([key, image]);
        };
        image.onerror = () => {
          if (!retried) {
            retried = true;
            // 重试 1 次：加随机 query 绕过缓存
            const sep = source.includes('?') ? '&' : '?';
            image.src = source + sep + '_retry=' + Math.random().toString(36).slice(2);
            return;
          }
          // 失败后生成占位图，不阻塞整体加载
          loaded += 1;
          onProgress(loaded, total, key);
          // 生成占位图（1280×720 纯色）
          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#8B7355';
          ctx.fillRect(0, 0, 1280, 720);
          const placeholder = new Image();
          placeholder.src = canvas.toDataURL();
          // 标记占位图
          placeholder._placeholder = true;
          resolve([key, placeholder]);
        };
        image.src = source;
      }

      tryLoad();
    }))).then(images => Object.fromEntries(images));
  }
}
