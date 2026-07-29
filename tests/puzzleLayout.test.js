import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_PUZZLE_LAYOUT,
  createPuzzlePieces,
  ejectPiecesBlockingTarget,
  getSourceRects,
  getTopmostPieceAt,
  snapPieceToTarget,
} from '../src/scenes/puzzleLayout.js';
import { ScenePuzzle } from '../src/scenes/Scene_Puzzle.js';

test('creates nine distinct pieces without initial stacks', () => {
  const pieces = createPuzzlePieces(1448, 1086, () => 0.25);

  assert.equal(pieces.length, 9);
  assert.equal(new Set(pieces.map(piece => piece.id)).size, 9);
  assert.equal(pieces.filter(piece => piece.stackIndex !== null).length, 0);
  assert.ok(Math.abs(pieces[0].width - 126) < 0.001);
  assert.equal(pieces[0].height, 94.5);
  assert.equal(pieces[0].targetWidth, 180);
  assert.equal(pieces[0].targetHeight, 135);
});

test('starts every loose piece in a separate visible position', () => {
  const pieces = createPuzzlePieces(1448, 1086, () => 0.25);

  for (let index = 0; index < pieces.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < pieces.length; otherIndex += 1) {
      const first = pieces[index];
      const second = pieces[otherIndex];
      const overlaps = first.x < second.x + second.width
        && first.x + first.width > second.x
        && first.y < second.y + second.height
        && first.y + first.height > second.y;
      assert.equal(overlaps, false, `pieces ${first.id} and ${second.id} overlap initially`);
    }
  }
});

test('covers every source pixel when image dimensions are not divisible by three', () => {
  const rects = getSourceRects(1448, 1087);

  assert.deepEqual(rects[2], { sourceX: 964, sourceY: 0, sourceW: 484, sourceH: 362 });
  assert.deepEqual(rects[8], { sourceX: 964, sourceY: 724, sourceW: 484, sourceH: 363 });
  assert.equal(rects[2].sourceX + rects[2].sourceW, 1448);
  assert.equal(rects[8].sourceY + rects[8].sourceH, 1087);
});

test('uses the complete image area without the puzzle artwork black matte', () => {
  const pieces = createPuzzlePieces(1448, 1086, () => 0.25);
  const imageLeft = 26;
  const imageTop = 20;
  const imageRight = 1422;
  const imageBottom = 1067;

  for (const piece of pieces) {
    assert.ok(piece.sourceX >= imageLeft);
    assert.ok(piece.sourceY >= imageTop);
    assert.ok(piece.sourceX + piece.sourceW <= imageRight);
    assert.ok(piece.sourceY + piece.sourceH <= imageBottom);
  }

  const jpeg = readFileSync(new URL('../assets/images/scene_puzzle.jpg', import.meta.url));
  assert.deepEqual([...jpeg.subarray(-2)], [0xff, 0xd9]);
  assert.match(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), /puzzle: '\.\/assets\/images\/scene_puzzle\.jpg'/);
  assert.match(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'), /puzzle: '\.\/assets\/images\/scene_puzzle\.jpg'/);
});

test('does not snap a piece when the pointer only taps it', () => {
  const scene = new ScenePuzzle({
    width: 1280,
    height: 720,
    images: { puzzle: { width: 1448, height: 1086 } },
  });
  const piece = scene.pieces[0];
  piece.x = piece.targetX + 10;
  piece.y = piece.targetY + 10;

  scene.handleDown({ x: piece.x + 1, y: piece.y + 1, pointerId: 1 });
  scene.handleUp({ pointerId: 1 });

  assert.equal(piece.placed, false);
  assert.equal(piece.x, piece.targetX + 10);
  assert.equal(piece.y, piece.targetY + 10);
});

test('snaps a touch drag when its path crosses the target magnet zone', () => {
  const scene = new ScenePuzzle({
    width: 1280,
    height: 720,
    images: { puzzle: { width: 1448, height: 1086 } },
  });
  const piece = scene.pieces.find(candidate => candidate.id === 4);
  piece.x = piece.targetX - 210;
  piece.y = piece.targetY;

  scene.handleDown({ x: piece.x + 63, y: piece.y + 47, pointerId: 1, pointerType: 'touch' });
  scene.handleMove({ x: piece.targetX + 273, y: piece.targetY + 47, pointerId: 1, pointerType: 'touch' });

  assert.equal(piece.placed, true);
  assert.equal(piece.x, piece.targetX);
  assert.equal(piece.y, piece.targetY);
});

test('keeps desktop dragging manual when its path crosses a target zone', () => {
  const scene = new ScenePuzzle({
    width: 1280,
    height: 720,
    images: { puzzle: { width: 1448, height: 1086 } },
  });
  const piece = scene.pieces.find(candidate => candidate.id === 4);
  piece.x = piece.targetX - 210;
  piece.y = piece.targetY;

  scene.handleDown({ x: piece.x + 63, y: piece.y + 47, pointerId: 1, pointerType: 'mouse' });
  scene.handleMove({ x: piece.targetX + 273, y: piece.targetY + 47, pointerId: 1, pointerType: 'mouse' });

  assert.equal(piece.placed, false);
});

test('selects the visible topmost overlapping loose piece', () => {
  const pieces = [
    { id: 1, x: 100, y: 100, width: 60, height: 45, placed: false },
    { id: 2, x: 100, y: 100, width: 60, height: 45, placed: false },
  ];

  assert.equal(getTopmostPieceAt(pieces, 120, 120).id, 2);
});

test('snaps only when a piece is within the configured radius', () => {
  const nearPiece = { x: 149, y: 100, targetX: 100, targetY: 100, width: 144, height: 108, targetWidth: 180, targetHeight: 135, placed: false };
  const farPiece = { x: 151, y: 100, targetX: 100, targetY: 100, placed: false };

  assert.equal(DEFAULT_PUZZLE_LAYOUT.snapRadius, 50);
  assert.equal(snapPieceToTarget(nearPiece, DEFAULT_PUZZLE_LAYOUT.snapRadius), true);
  assert.deepEqual(nearPiece, { x: 100, y: 100, targetX: 100, targetY: 100, width: 180, height: 135, targetWidth: 180, targetHeight: 135, placed: true });
  assert.equal(snapPieceToTarget(farPiece, DEFAULT_PUZZLE_LAYOUT.snapRadius), false);
  assert.equal(farPiece.placed, false);
});

test('ejects loose pieces that cover a newly restored target cell', () => {
  const restoredPiece = { id: 4, x: 400, y: 200, width: 180, height: 135, placed: true };
  const blockingPiece = { id: 1, x: 430, y: 230, width: 144, height: 108, homeX: 40, homeY: 80, placed: false, ejecting: false };
  const unrelatedPiece = { id: 2, x: 900, y: 500, width: 144, height: 108, homeX: 1094, homeY: 80, placed: false, ejecting: false };

  const ejected = ejectPiecesBlockingTarget([restoredPiece, blockingPiece, unrelatedPiece], restoredPiece);

  assert.deepEqual(ejected, [blockingPiece]);
  assert.equal(blockingPiece.ejecting, true);
  assert.deepEqual(blockingPiece.ejection, { fromX: 430, fromY: 230, toX: 40, toY: 80, elapsed: 0, duration: 0.32 });
  assert.equal(unrelatedPiece.ejecting, false);
});
