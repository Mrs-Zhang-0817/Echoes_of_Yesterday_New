import test from 'node:test';
import assert from 'node:assert/strict';
import { ChapterManager } from '../src/core/ChapterManager.js';

function makeGame() {
  const captured = [];
  const game = {
    input: { setHandlers() {} },
    overlay: { show: cfg => captured.push(cfg), hide() {} },
    progress: { markChapterComplete() { return {}; }, load() { return null; } },
    width: 1280,
    height: 720,
  };
  game.chapterManager = new ChapterManager(game);
  return { game, captured };
}

class FakeCh2 {
  constructor(game) { this.game = game; this._completed = false; }
  get isComplete() { return this._completed; }
  get completeTitle() { return 't'; }
  get completeMessage() { return 'm'; }
  onEnter() {}
  onExit() {}
  update() {}
  render() {}
}

test('Ch2 completion shows report config with canonical progress', () => {
  const { game, captured } = makeGame();
  game.chapterManager.register('ch02', FakeCh2);
  game.chapterManager.activate('ch02');
  game.chapterManager.currentChapter._completed = true;

  game.chapterManager.update(0.016);

  assert.equal(captured.length, 1);
  const cfg = captured[0];
  assert.equal(cfg.type, 'complete');
  assert.equal(cfg.chapterNumber, 2);
  assert.equal(cfg.memoryFrom, 5);
  assert.equal(cfg.memoryTo, 15);
  assert.equal(typeof cfg.onContinue, 'function');
});

test('report config is only shown once per completion', () => {
  const { game, captured } = makeGame();
  game.chapterManager.register('ch02', FakeCh2);
  game.chapterManager.activate('ch02');
  game.chapterManager.currentChapter._completed = true;

  game.chapterManager.update(0.016);
  game.chapterManager.update(0.016);
  game.chapterManager.update(0.016);

  assert.equal(captured.length, 1);
});
