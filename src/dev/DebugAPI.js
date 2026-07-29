/**
 * DebugAPI — 调试面板（开发态）
 * 暴露到 window.__debug__，用于 Playwright 截图验证和手动调试
 */
export function createDebugAPI(game) {
  return {
    /** 完整快照：章节内部状态 + 交互热区 */
    inspect() {
      const ch = game.chapterManager.currentChapter;
      const chDetail = {};
      if (ch) {
        for (const key of Object.keys(ch)) {
          if (key.startsWith('_')) continue; // 跳过私有字段
          const val = ch[key];
          if (typeof val === 'function') continue;
          chDetail[key] = val;
        }
      }

      return {
        chapter: game.chapterManager.currentName,
        chapterDetail: chDetail,
        overlay: {
          active: !!(game.overlay?.active),
          title: game.overlay?.active?.title || '',
        },
        progress: game.progress?.load(),
        transition: game.chapterManager.transition?.phase || '?',
      };
    },

    /** 全局状态摘要 */
    state() {
      return {
        chapter: game.chapterManager.currentName,
        overlayActive: !!(game.overlay?.active),
        transition: game.chapterManager.transition?.phase || '?',
      };
    },

    /** Playwright 截图验证元数据 */
    screenshotMeta() {
      const c = game.chapterManager.currentChapter;
      return {
        chapter: game.chapterManager.currentName,
        phase: c?.phase || '?',
        isComplete: c?.isComplete || false,
        overlayActive: !!(game.overlay?.active),
        overlayTitle: game.overlay?.active?.title || '',
        transition: game.chapterManager.transition?.phase || '?',
      };
    },

    /** 切换章节 */
    switchTo(chapterId) {
      game.chapterManager.switchTo(chapterId);
    },

    /** 强制完成当前章节 */
    forceComplete() {
      const ch = game.chapterManager.currentChapter;
      if (!ch) return;
      if (Object.prototype.hasOwnProperty.call(ch, '_completed')) ch._completed = true;
      if (Object.prototype.hasOwnProperty.call(ch, '_complete')) ch._complete = true;
      if (ch.phase) ch.phase = 'complete';
    },
  };
}
