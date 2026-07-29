export class Loader {
  static loadImages(manifest, onProgress = () => {}) {
    const entries = Object.entries(manifest);
    let loaded = 0;

    return Promise.all(entries.map(([key, source]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        loaded += 1;
        onProgress(loaded, entries.length, key);
        resolve([key, image]);
      };
      image.onerror = () => reject(new Error(`图片加载失败：${source}`));
      image.src = source;
    }))).then(images => Object.fromEntries(images));
  }
}
