const SHARED_PROGRESS_AREA = Object.freeze({
  x: 14.8,
  y: 59.1,
  width: 26.4,
  height: 20.2,
});

const SHARED_PERCENTAGE_POSITION = Object.freeze({
  leftX: 8,
  leftY: 25,
  rightX: 73,
  rightY: 25,
});

const SHARED_BUTTON_AREAS = Object.freeze([
  Object.freeze({
    id: "home",
    label: "返回主界面",
    action: "home",
    image: "./记忆恢复报告新底图/memorybutton1-transparent.jpg",
    crop: Object.freeze({ x: 2.34, y: 9.57, width: 94.92, height: 84.99 }),
    x: 23.2,
    y: 88.1,
    width: 17.6,
    height: 8.9,
  }),
  Object.freeze({
    id: "archive",
    label: "查看记忆档案",
    action: "archive",
    image: "./记忆恢复报告新底图/memorybutton2-transparent.jpg",
    crop: Object.freeze({ x: 4.87, y: 18, width: 86.49, height: 63.2 }),
    x: 44.1,
    y: 88.1,
    width: 17.8,
    height: 8.9,
  }),
  Object.freeze({
    id: "continue",
    label: "继续昨日",
    action: "continue",
    image: "./记忆恢复报告新底图/memorybutton3-transparent.jpg",
    crop: Object.freeze({ x: 2.25, y: 17.44, width: 94.05, height: 63.7 }),
    x: 65.0,
    y: 88.1,
    width: 17.8,
    height: 8.9,
  }),
]);

export const ARTWORK_MEMORY_REPORT_CONFIG = Object.freeze({
  chapter_01: Object.freeze({
    chapterId: "chapter_01",
    backgroundImage: "./记忆恢复报告新底图/第一章.jpg",
    memoryFrom: 0,
    memoryTo: 5,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
  chapter_02: Object.freeze({
    chapterId: "chapter_02",
    backgroundImage: "./记忆恢复报告新底图/第二章.jpg",
    memoryFrom: 5,
    memoryTo: 15,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
  chapter_03: Object.freeze({
    chapterId: "chapter_03",
    backgroundImage: "./记忆恢复报告新底图/第三章.jpg",
    memoryFrom: 15,
    memoryTo: 22,
    progressArea: SHARED_PROGRESS_AREA,
    percentagePosition: SHARED_PERCENTAGE_POSITION,
    buttonAreas: SHARED_BUTTON_AREAS,
    coverImageOverlay: null,
  }),
});

export const ARTWORK_CHAPTER_ORDER = Object.freeze([
  "chapter_01",
  "chapter_02",
  "chapter_03",
]);

export function getArtworkMemoryReportConfig(chapterId) {
  return ARTWORK_MEMORY_REPORT_CONFIG[chapterId] ??
    ARTWORK_MEMORY_REPORT_CONFIG.chapter_01;
}

export function getNextArtworkChapter(chapterId) {
  const index = ARTWORK_CHAPTER_ORDER.indexOf(chapterId);
  return ARTWORK_CHAPTER_ORDER[
    index < 0 ? 0 : (index + 1) % ARTWORK_CHAPTER_ORDER.length
  ];
}

// 离线模式：不发起任何网络请求，直接使用内嵌配置
export async function loadArtworkMemoryReportConfig(chapterId, overrides = {}) {
  const fallback = getArtworkMemoryReportConfig(chapterId);
  return Object.freeze({
    ...fallback,
    memoryFrom: overrides.memoryFrom ?? fallback.memoryFrom,
    memoryTo: overrides.memoryTo ?? fallback.memoryTo,
    nextChapter: getNextArtworkChapter(fallback.chapterId),
  });
}
