import assert from 'node:assert/strict';
import test from 'node:test';
import { Chapter02 } from '../src/chapters/ch02_puzzle.js';

function createChapter() {
  return new Chapter02({
    width: 1280,
    height: 720,
    images: { puzzle: { width: 1448, height: 1086 } },
    progress: { markChapterComplete() {} },
  });
}

test('触屏快速划过正确格时会自动归位', () => {
  const chapter = createChapter();
  const piece = chapter.pieces.find(candidate => candidate.id === 4);
  piece.x = piece.targetX - 210;
  piece.y = piece.targetY;

  chapter.handleDown({ x: piece.x + 63, y: piece.y + 47, pointerId: 1, pointerType: 'touch' });
  chapter.handleMove({ x: piece.targetX + 273, y: piece.targetY + 47, pointerId: 1, pointerType: 'touch' });

  assert.equal(piece.placed, true);
  assert.equal(piece.x, piece.targetX);
  assert.equal(piece.y, piece.targetY);
});

test('鼠标划过正确格仍需手动放到格内', () => {
  const chapter = createChapter();
  const piece = chapter.pieces.find(candidate => candidate.id === 4);
  piece.x = piece.targetX - 210;
  piece.y = piece.targetY;

  chapter.handleDown({ x: piece.x + 63, y: piece.y + 47, pointerId: 1, pointerType: 'mouse' });
  chapter.handleMove({ x: piece.targetX + 273, y: piece.targetY + 47, pointerId: 1, pointerType: 'mouse' });

  assert.equal(piece.placed, false);
});
