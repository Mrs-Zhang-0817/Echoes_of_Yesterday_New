# Ch4 签字迁移、Ch7 弹幕与 Ch8 微笑实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将签字还原放入 Ch4，并让 Ch7 的可点击弹幕与 Ch8 的摄像头微笑/挥手回退在现有 Canvas 游戏中完整可玩。

**Architecture:** 将签字、弹幕和微笑检测拆为三个无关卡存档职责的互动模块；章节只负责状态流转、文案和完成后的进度写入。摄像头模块以隐藏视频元素作为 face-api 输入并将预览绘制回 Canvas，所有权限失败都落到 Ch8 的挥手路径。

**Tech Stack:** 原生 ES modules、Canvas 2D、Node `node:test`、Playwright、用户提供的 face-api.js 及本地模型。

## Global Constraints

- 不修改 `src/narrative/`、`src/core/ChapterManager.js`、`src/core/Overlay.js`、报告资产或 WorkBuddy 已改文件。
- 不新增 npm 依赖；不导入 ZIP 内的 HTTPS 服务器与证书。
- 运行入口仍是 `index.html` 的单 Canvas；触摸和鼠标都通过现有 `InputManager`。
- 摄像头只能由用户手势触发；退出/完成时停止每条 `MediaStreamTrack`；不上传或存储画面。
- Ch4 签字仅要求“向阳”笔画特征，判定宽松；第三次提交必过。
- Ch8 无摄像头、拒绝权限、模型失败、8 秒未就绪都必须可以挥手通关。

---

## File Structure

- Create: `src/interactions/SignaturePuzzle.js` — 可嵌入章节的“向阳”笔画采集、宽松判定与第三次兜底。
- Create: `src/interactions/DanmakuBubbleField.js` — 可点击气泡、胸口微光飞行和阶段完成状态。
- Create: `src/interactions/SmileDetector.js` — face-api 模型、视频流、表情采样和资源释放。
- Modify: `src/chapters/ch04_police.js` — 在电话和手环之间挂接签字互动。
- Modify: `src/chapters/ch07_night.js` — 在门锁搜索前挂接弹幕安抚阶段。
- Modify: `src/chapters/ch08_sign.js` — 使用镜面、陌生人、裂纹资产实现微笑/挥手章节。
- Modify: `src/data/chapters.json`, `index.html` — 更新 Ch8 标题/进度与加载 face-api 资源。
- Create: `assets/vendor/face-api/` — 仅从用户提供 ZIP 导入 `face-api.min.js` 和 5 个模型文件。
- Create: `tests/ch04-ch07-ch08-interactions.test.js` — 覆盖三个模块的可观察行为。
- Modify: `tests/mobile-ui.spec.js` 或 Create: `tests/ch04-ch08-interactions.spec.js` — 浏览器中的章节流程回归。

### Task 1: Extract and loosen the reusable signature puzzle

**Files:**
- Create: `tests/ch04-ch07-ch08-interactions.test.js`
- Create: `src/interactions/SignaturePuzzle.js`
- Modify: `src/chapters/ch04_police.js`

**Interfaces:**
- Produces `new SignaturePuzzle({ onComplete })`, with `handleDown(point)`, `handleMove(point)`, `handleUp(point)`, `update(dt)`, `render(ctx)`, `get completed()` and `get attempts()`.
- `onComplete()` fires exactly once after a relaxed “向阳” stroke shape succeeds or submission attempt three.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SignaturePuzzle } from '../src/interactions/SignaturePuzzle.js';

test('SignaturePuzzle completes on its third submission even without matching strokes', () => {
  let completed = 0;
  const puzzle = new SignaturePuzzle({ onComplete: () => { completed += 1; } });
  puzzle.submit();
  puzzle.submit();
  assert.equal(puzzle.completed, false);
  puzzle.submit();
  assert.equal(puzzle.completed, true);
  assert.equal(completed, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: FAIL because `SignaturePuzzle.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
submit() {
  if (this.completed) return;
  this.attempts += 1;
  if (this.matchesXiangYang() || this.attempts >= 3) this.finish();
}
```

Keep all signature state inside the module. `matchesXiangYang()` must accept six or more strokes split across left/right halves with at least one horizontal and vertical stroke in each half; do not retain the old score-80 threshold.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 5: Embed in Ch4**

Insert `signature` between current `ringing` and `form` states. Create the puzzle with `onComplete: () => { this.phase = 'form'; this.phaseTime = 0; }`; route pointer events to it while active and render it instead of the form card. Keep the existing handoff from bracelet to `markChapterComplete(4, 30)`.

- [ ] **Step 6: Run focused regression tests**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js tests/ch04-ch06-art-and-particles.test.js`

Expected: PASS.

- [ ] **Step 7: Commit task changes**

```bash
git add src/interactions/SignaturePuzzle.js src/chapters/ch04_police.js tests/ch04-ch07-ch08-interactions.test.js
git commit -m "feat(ch04): move forgiving signature puzzle to police"
```

### Task 2: Add a clickable Ch7 support-bubble field

**Files:**
- Modify: `tests/ch04-ch07-ch08-interactions.test.js`
- Create: `src/interactions/DanmakuBubbleField.js`
- Modify: `src/chapters/ch07_night.js`

**Interfaces:**
- Produces `new DanmakuBubbleField({ messages, targetX, targetY })` with `update(dt)`, `hit(point)`, `render(ctx)`, `start()`, `get collected()` and `get isReady()`.
- `hit(point)` returns `true` only when an active bubble is hit; the hit bubble animates to `(targetX, targetY)` and increments `collected` only after its flight finishes.

- [ ] **Step 1: Write the failing test**

```js
import { DanmakuBubbleField } from '../src/interactions/DanmakuBubbleField.js';

test('DanmakuBubbleField opens the door-search transition after four collected bubbles', () => {
  const field = new DanmakuBubbleField({ messages: ['a', 'b', 'c', 'd'], targetX: 640, targetY: 500, random: () => 0 });
  field.start();
  for (let index = 0; index < 4; index += 1) {
    field.update(4);
    assert.equal(field.hit(field.activeBubbles[0]), true);
    field.update(1);
  }
  assert.equal(field.collected, 4);
  assert.equal(field.isReady, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: FAIL because `DanmakuBubbleField.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Use a bounded pool of five visible bubbles. Each bubble has `{ x, y, width, height, state }`; `state` is `floating` or `collecting`. Spawning uses a 1.2–2.2 second interval, and `update(dt)` ensures the fourth bubble can be collected within the 20-second fallback. `render(ctx)` draws rounded soft-gold bubbles and a small warm particle when collecting.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 5: Embed in Ch7**

Add a `comfort` phase after narrative. Start the field on entry, send `handleDown(point)` to `field.hit(point)`, then transition when `field.isReady` or comfort time reaches 20 seconds. Render the existing bedroom with low blood-red vignette beneath the bubbles; call `field.stop()` in `onExit()`.

- [ ] **Step 6: Run focused regression tests**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 7: Commit task changes**

```bash
git add src/interactions/DanmakuBubbleField.js src/chapters/ch07_night.js tests/ch04-ch07-ch08-interactions.test.js
git commit -m "feat(ch07): add clickable comfort bubbles"
```

### Task 3: Add local smile detector and assets

**Files:**
- Modify: `tests/ch04-ch07-ch08-interactions.test.js`
- Create: `src/interactions/SmileDetector.js`
- Create: `assets/vendor/face-api/face-api.min.js`
- Create: `assets/vendor/face-api/models/*`
- Modify: `index.html`

**Interfaces:**
- Produces `new SmileDetector({ faceapi, mediaDevices, now })`, with `start()`, `sample()`, `stop()`, `get status()` and `get happyHeldSeconds()`.
- `sample()` returns `{ state: 'ready'|'smiling'|'failed', happy: number }` and only returns `smiling` after happy ≥ 0.6 is continuous for 1.5 seconds.

- [ ] **Step 1: Write the failing test**

```js
import { SmileDetector } from '../src/interactions/SmileDetector.js';

test('SmileDetector requires 1.5 continuous seconds above the happy threshold', async () => {
  let now = 0;
  const detector = new SmileDetector({ now: () => now, detect: async () => 0.7 });
  await detector.start();
  await detector.sample();
  now = 1499;
  assert.equal((await detector.sample()).state, 'ready');
  now = 1500;
  assert.equal((await detector.sample()).state, 'smiling');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: FAIL because `SmileDetector.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Load both face-api nets from `./assets/vendor/face-api/models/`, request `{ facingMode: 'user' }` only in `start()`, and attach the stream to a detached `video` element. On any model/media failure set `status` to `failed`; `stop()` must stop every `stream.getTracks()` result, clear `video.srcObject`, and reset detector timers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 5: Import only necessary provided artifacts**

Copy `face-api.min.js`, `face_expression_model-shard1`, `face_expression_model-weights_manifest.json`, `tiny_face_detector_model-shard1`, `tiny_face_detector_model-shard2`, and `tiny_face_detector_model-weights_manifest.json` from the user ZIP. Add one non-module script tag before `src/main_new.js`; do not copy `server.cjs`, `cert.pem`, or `key.pem`.

- [ ] **Step 6: Run focused regression tests**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 7: Commit task changes**

```bash
git add index.html src/interactions/SmileDetector.js assets/vendor/face-api tests/ch04-ch07-ch08-interactions.test.js
git commit -m "feat(ch08): add local smile detector assets"
```

### Task 4: Replace Ch8 signature scene with mirror smile and fallback

**Files:**
- Modify: `tests/ch04-ch07-ch08-interactions.test.js`
- Modify: `src/chapters/ch08_sign.js`
- Modify: `src/data/chapters.json`
- Create: `tests/ch04-ch08-interactions.spec.js`

**Interfaces:**
- Ch8 phases are `mirror`, `camera`, `wave`, `reveal`, `complete`.
- `handleDown(point)` starts camera only from the visible action button; `handleMove(point)` and `handleUp(point)` evaluate an arc-like wave while in `wave`.

- [ ] **Step 1: Write the failing unit test**

```js
test('Chapter08 completes the fallback after a wide waving path', () => {
  const chapter = new Chapter08(fakeGameWithMirrorImages());
  chapter.phase = 'wave';
  chapter.handleDown({ x: 180, y: 500, pointerId: 1 });
  chapter.handleMove({ x: 720, y: 410, pointerId: 1 });
  chapter.handleMove({ x: 1080, y: 520, pointerId: 1 });
  chapter.handleUp({ pointerId: 1 });
  assert.equal(chapter.phase, 'reveal');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: FAIL because old Ch8 lacks the `wave` phase.

- [ ] **Step 3: Write minimal chapter implementation**

Render corridor/mirror assets with stranger and crack overlay. On camera success, draw mirrored video into the mirror region and call `detector.sample()` every 0.2 seconds; after a smiling result transition to `reveal`. If detector fails or the eight-second timer expires, show the same mirror and a wave instruction. `reveal` fades cracks and crossfades stranger to `ch8_mirror_smile`, then calls `markChapterComplete(8, 72)` once.

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `node --test tests/ch04-ch07-ch08-interactions.test.js`

Expected: PASS.

- [ ] **Step 5: Add browser regression flow**

Create a Playwright test that opens the static server, uses the debug chapter switch for Ch4/Ch7/Ch8, verifies Ch8 renders the camera choice, clicks the fallback, synthesizes the broad wave, and asserts the chapter completion overlay appears. Do not require a real webcam in CI.

- [ ] **Step 6: Run browser flow**

Run: `npx playwright test tests/ch04-ch08-interactions.spec.js`

Expected: PASS with no page errors.

- [ ] **Step 7: Commit task changes**

```bash
git add src/chapters/ch08_sign.js src/data/chapters.json tests/ch04-ch07-ch08-interactions.test.js tests/ch04-ch08-interactions.spec.js
git commit -m "feat(ch08): replace signing with mirror smile"
```

### Task 5: Full verification and isolated handoff

**Files:**
- Verify only: all changed files from Tasks 1–4

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run visual flows and build**

Run: `npx playwright test tests/ch04-ch08-interactions.spec.js tests/mobile-ui.spec.js && npm run build`

Expected: all requested browser tests pass and build exits 0.

- [ ] **Step 3: Inspect the exact handoff diff**

Run: `git diff --check && git status --short && git diff -- src/chapters/ch04_police.js src/chapters/ch07_night.js src/chapters/ch08_sign.js src/interactions index.html src/data/chapters.json tests`

Expected: no whitespace errors and no staged WorkBuddy file.

- [ ] **Step 4: Commit only the feature files**

```bash
git add src/chapters/ch04_police.js src/chapters/ch07_night.js src/chapters/ch08_sign.js src/interactions src/data/chapters.json index.html assets/vendor/face-api tests/ch04-ch07-ch08-interactions.test.js tests/ch04-ch08-interactions.spec.js
git commit -m "feat: integrate ch4 signing ch7 bubbles and ch8 smile"
```

- [ ] **Step 5: Report verified outcome and remaining release constraint**

State the actual unit, browser, and build command results. Explicitly note that live smile recognition needs HTTPS/localhost and a camera permission, while the verified gesture fallback remains available in every environment.
