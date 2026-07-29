export class ProgressStore {
  constructor(key = 'ye_v1_progress') {
    this.key = key;
  }

  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // 隐私模式或无存储空间，静默失败
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  markChapterComplete(chapterNum, memoryValue) {
    const data = this.load() || { chapter: 1, memory: 0, completed: [], ts: Date.now() };
    if (!data.completed.includes(chapterNum)) {
      data.completed.push(chapterNum);
    }
    data.chapter = Math.max(data.chapter, chapterNum);
    data.memory = Math.max(data.memory, memoryValue);
    data.ts = Date.now();
    this.save(data);
    return data;
  }

  reset() {
    try {
      localStorage.removeItem(this.key);
    } catch {}
  }
}
