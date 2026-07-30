// 漫画配置加载器 — 将漫画分支的 JSON 配置转换为游戏内可用的对象
// 图片路径从相对路径解析为基于 assets/images/comic/ 的绝对路径

export function resolveComicUrl(scenePath) {
  // scene 示例: "comic/chapter01_scene01.json"
  return `./assets/images/${scenePath}`;
}

export function buildComicSceneImagePath(jsonImagePath) {
  // 漫画 JSON 中的 image 路径格式: "../../../漫画/第一章/1-wake up-radio.png"
  // 转换为: "./assets/images/comic/第一章/1-wake up-radio.png"
  const parts = jsonImagePath.split('/');
  const chapterDir = parts[parts.length - 2];
  const filename = parts[parts.length - 1];
  return `./assets/images/comic/${encodeURIComponent(chapterDir)}/${encodeURIComponent(filename)}`;
}
