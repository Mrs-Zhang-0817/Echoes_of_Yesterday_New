import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { SignaturePuzzle } from '../src/interactions/SignaturePuzzle.js';
import { DanmakuBubbleField } from '../src/interactions/DanmakuBubbleField.js';
import { SmileDetector } from '../src/interactions/SmileDetector.js';
import { Chapter04 } from '../src/chapters/ch04_police.js';
import { Chapter07 } from '../src/chapters/ch07_night.js';
import { Chapter08 } from '../src/chapters/ch08_sign.js';

test('第三次提交会让向阳签字通过，且完成回调只执行一次', () => {
  let completionCount = 0;
  const puzzle = new SignaturePuzzle({
    onComplete: () => { completionCount += 1; },
  });

  puzzle.submit();
  puzzle.submit();
  assert.equal(puzzle.completed, false);

  puzzle.submit();
  puzzle.submit();

  assert.equal(puzzle.completed, true);
  assert.equal(completionCount, 1);
});

test('左右两侧各有横竖笔画时，宽松识别为向阳签字', () => {
  const puzzle = new SignaturePuzzle();
  const strokes = [
    [{ x: 130, y: 220 }, { x: 300, y: 220 }],
    [{ x: 210, y: 150 }, { x: 210, y: 340 }],
    [{ x: 110, y: 340 }, { x: 320, y: 160 }],
    [{ x: 760, y: 220 }, { x: 1040, y: 220 }],
    [{ x: 900, y: 130 }, { x: 900, y: 360 }],
    [{ x: 770, y: 340 }, { x: 1070, y: 160 }],
  ];

  for (const points of strokes) puzzle.addStroke(points);
  puzzle.submit();

  assert.equal(puzzle.completed, true);
  assert.equal(puzzle.attempts, 1);
});

test('警局来电后先进入向阳签字，再回到手环线索', () => {
  const chapter = new Chapter04({
    width: 1280,
    height: 720,
    images: {},
    input: { setHandlers() {} },
    progress: { markChapterComplete() {} },
  });
  chapter.phase = 'ringing';

  chapter.update(1.1);

  assert.equal(chapter.phase, 'signature');
  chapter.signature.submit();
  chapter.signature.submit();
  chapter.signature.submit();
  assert.equal(chapter.phase, 'form');
});

test('收集四个安抚气泡后，弹幕区域准备进入找门锁', () => {
  const field = new DanmakuBubbleField({
    messages: ['别怕', '有人在等你', '慢慢来', '微光在前方'],
    targetX: 640,
    targetY: 500,
    random: () => 0,
    spawnInterval: 0.1,
  });
  field.start();

  for (let index = 0; index < 4; index += 1) {
    field.update(0.2);
    const bubble = field.activeBubbles[0];
    assert.ok(bubble);
    assert.equal(field.hit({ x: bubble.x, y: bubble.y }), true);
    field.update(0.6);
  }

  assert.equal(field.collected, 4);
  assert.equal(field.isReady, true);
});

test('第7关不会因点到空白处跳过安抚气泡', () => {
  const chapter = new Chapter07({
    width: 1280,
    height: 720,
    images: {},
    input: { setHandlers() {} },
    progress: { markChapterComplete() {} },
  });
  chapter.phase = 'socialLights';

  chapter.handleDown({ x: 20, y: 20, pointerId: 1 });

  assert.equal(chapter.phase, 'socialLights');
});

test('微笑识别要求连续 1.5 秒达到阈值', async () => {
  let now = 0;
  const detector = new SmileDetector({
    now: () => now,
    detect: async () => 0.7,
  });

  await detector.start();
  await detector.sample();
  now = 1499;
  assert.equal((await detector.sample()).state, 'ready');
  now = 1500;
  assert.equal((await detector.sample()).state, 'smiling');
});

test('第8关在摄像头不可用时可以用一次宽幅挥手进入镜面揭示', () => {
  const chapter = new Chapter08({
    width: 1280,
    height: 720,
    images: {},
    input: { setHandlers() {} },
    progress: { markChapterComplete() {} },
  });
  chapter.phase = 'wave';

  chapter.handleDown({ x: 160, y: 520, pointerId: 1 });
  chapter.handleMove({ x: 670, y: 390, pointerId: 1 });
  chapter.handleMove({ x: 1100, y: 530, pointerId: 1 });
  chapter.handleUp({ pointerId: 1 });

  assert.equal(chapter.phase, 'reveal');
});

test('构建产物包含第8关检测模块与本地人脸模型', () => {
  const buildHtml = readFileSync(new URL('../build_out/index.html', import.meta.url), 'utf8');

  assert.match(buildHtml, /class SmileDetector/);
  assert.equal(existsSync(new URL('../build_out/assets/vendor/face-api/face-api.min.js', import.meta.url)), true);
});
