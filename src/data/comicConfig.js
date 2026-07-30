// 漫画场景配置 — 每章对应的漫画场景，图片通过 preload 加载后从 game.images 引用。
// 所有漫画图片 key 以 comic_ 开头，见 assetManifest.js。
// 每个场景包含：imageKey（manifest 中的键）+ panels（分格裁剪百分比坐标）。

const COMIC_SCENES = {
  ch01_scene01: { imageKey: 'comic_ch01_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,59],[50,53],[0,50]]},{id:'b',order:2,shape:'polygon',points:[[0,50],[50,53],[40,100],[0,100]]},{id:'c',order:3,shape:'polygon',points:[[50,53],[100,59],[100,100],[40,100]]}] },
  ch01_scene02: { imageKey: 'comic_ch01_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,60],[0,60]]},{id:'b',order:2,shape:'polygon',points:[[0,60],[100,60],[100,100],[0,100]]}] },
  ch01_scene03: { imageKey: 'comic_ch01_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,60],[0,60]]},{id:'b',order:2,shape:'polygon',points:[[0,60],[100,60],[100,100],[0,100]]}] },
  ch01_scene04: { imageKey: 'comic_ch01_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,60],[0,60]]},{id:'b',order:2,shape:'polygon',points:[[0,60],[100,60],[100,100],[0,100]]}] },
  ch01_scene05: { imageKey: 'comic_ch01_05', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,60],[50,53],[0,50]]},{id:'b',order:2,shape:'polygon',points:[[0,50],[50,53],[40,100],[0,100]]},{id:'c',order:3,shape:'polygon',points:[[50,53],[100,60],[100,100],[40,100]]}] },
  ch02_scene01: { imageKey: 'comic_ch02_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[64,0],[66,54],[62,100],[0,100]]},{id:'b',order:2,shape:'polygon',points:[[64,0],[100,0],[100,42],[66,54]]},{id:'c',order:3,shape:'polygon',points:[[66,54],[100,42],[100,100],[62,100]]}] },
  ch02_scene02: { imageKey: 'comic_ch02_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch02_scene03: { imageKey: 'comic_ch02_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch02_scene04: { imageKey: 'comic_ch02_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch03_scene01: { imageKey: 'comic_ch03_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,54.5],[50,60.5],[0,56]]},{id:'b',order:2,shape:'polygon',points:[[0,56],[50,60.5],[40,100],[0,100]]},{id:'c',order:3,shape:'polygon',points:[[50,60.5],[100,54.5],[100,100],[40,100]]}] },
  ch03_scene02: { imageKey: 'comic_ch03_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch03_scene03: { imageKey: 'comic_ch03_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch03_scene04: { imageKey: 'comic_ch03_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch03_scene05: { imageKey: 'comic_ch03_05', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch03_scene06: { imageKey: 'comic_ch03_06', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch03_scene07: { imageKey: 'comic_ch03_07', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch03_scene08: { imageKey: 'comic_ch03_08', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch04_scene01: { imageKey: 'comic_ch04_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,54.5],[50,60.5],[0,56]]},{id:'b',order:2,shape:'polygon',points:[[0,56],[50,60.5],[40,100],[0,100]]},{id:'c',order:3,shape:'polygon',points:[[50,60.5],[100,54.5],[100,100],[40,100]]}] },
  ch04_scene02: { imageKey: 'comic_ch04_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch04_scene03: { imageKey: 'comic_ch04_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch04_scene04: { imageKey: 'comic_ch04_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch04_scene05: { imageKey: 'comic_ch04_05', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch04_scene06: { imageKey: 'comic_ch04_06', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch05_scene01: { imageKey: 'comic_ch05_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch05_scene02: { imageKey: 'comic_ch05_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch05_scene03: { imageKey: 'comic_ch05_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch05_scene04: { imageKey: 'comic_ch05_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch05_scene05: { imageKey: 'comic_ch05_05', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch05_scene06: { imageKey: 'comic_ch05_06', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch05_scene07: { imageKey: 'comic_ch05_07', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch06_scene01: { imageKey: 'comic_ch06_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch06_scene02: { imageKey: 'comic_ch06_02', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch06_scene03: { imageKey: 'comic_ch06_03', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch06_scene04: { imageKey: 'comic_ch06_04', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
  ch08_scene01: { imageKey: 'comic_ch08_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,100],[0,100]]}] },
  ch09_scene01: { imageKey: 'comic_ch09_01', panels: [{id:'a',order:1,shape:'polygon',points:[[0,0],[100,0],[100,55],[0,55]]},{id:'b',order:2,shape:'polygon',points:[[0,55],[100,55],[100,100],[0,100]]}] },
};

export const COMIC_SCENE_ORDER = {
  ch01: ['ch01_scene01', 'ch01_scene02', 'ch01_scene03', 'ch01_scene04', 'ch01_scene05'],
  ch02: ['ch02_scene01', 'ch02_scene02', 'ch02_scene03', 'ch02_scene04'],
  ch03: ['ch03_scene01', 'ch03_scene02', 'ch03_scene03', 'ch03_scene04', 'ch03_scene05', 'ch03_scene06', 'ch03_scene07', 'ch03_scene08'],
  ch04: ['ch04_scene01', 'ch04_scene02', 'ch04_scene03', 'ch04_scene04', 'ch04_scene05', 'ch04_scene06'],
  ch05: ['ch05_scene01', 'ch05_scene02', 'ch05_scene03', 'ch05_scene04', 'ch05_scene05', 'ch05_scene06', 'ch05_scene07'],
  ch06: ['ch06_scene01', 'ch06_scene02', 'ch06_scene03', 'ch06_scene04'],
  ch08: ['ch08_scene01'],
  ch09: ['ch09_scene01'],
};

export function getComicScene(sceneKey) {
  return COMIC_SCENES[sceneKey] || null;
}

export function getChapterComics(chapterKey) {
  return COMIC_SCENE_ORDER[chapterKey] || [];
}
