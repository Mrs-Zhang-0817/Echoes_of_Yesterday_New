# Canvas Report and Narrative Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 UI v1.1 报告美术、飞书十章关键叙事和已完成的 Ch5 电梯改动整合进当前单 Canvas 游戏，并完成可验证的 100% 结局闭环。

**Architecture:** 只导入 ZIP 中十张 Artwork 报告底图和“继续昨日”透明按钮；新增一个 Canvas 原生报告渲染器，由现有 Overlay/ChapterManager 调用。章节补全继续使用既有 Canvas 状态机和资产，不引入 DOM 页面、外部服务或第二套输入系统；Ch9 和 Ch10 独立为连续的两章高潮流程。

**Tech Stack:** 原生 ES modules、Canvas 2D、现有 InputManager/ProgressStore、Node test、Playwright/浏览器实测、内建 image generation（最多 6 张，计划 3 张）。

## Global Constraints

- 唯一仓库为 `Echoes_of_Yesterday_New.git`；绝不触碰根目录 `Echoes_of_Yesterday/`。
- 当前工作区已有用户未提交改动；不得 reset、checkout、覆盖或格式化无关改动。
- 游戏保持单一 `#gameCanvas` 和 1280×720 横屏逻辑画布；不得接入 ZIP 的 DOM/CSS/跳页运行时。
- ZIP 的报告资产按需加载，不加入 `main_new.js` 的首屏全量预加载清单。
- 报告进度固定为 `0→5→15→22→30→40→52→60→72→85→100`。
- 新生成叙事帧计划 3 张、总量最多 6 张；每张必须对应设计规格中的剧情转折并有浏览器验收截图。
- 不新增第三方依赖、不接入真实摄像头/OCR/陀螺仪/网络 API；Ch8 只保留可替换的摄像头占位与手势回退。
- 每个任务只改计划列出的文件和直接相关测试；提交前运行任务指定测试与 `git diff --check`。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `assets/images/report/` | ZIP 导入的十张报告底图与三张透明按钮 |
| `src/ui/ArtworkMemoryReport.js` | 章节报告配置、惰性图片缓存、Canvas 绘制、进度动画与继续按钮命中 |
| `src/core/Overlay.js` | 普通完成覆盖层改为调用报告渲染器 |
| `src/core/ChapterManager.js` | 从当前完成章采集 chapter number 与前后记忆值，交给 Overlay |
| `src/main_new.js` | 注册既有闲置章节资产；不预载报告全图 |
| `src/chapters/ch02_puzzle.js`、`ch03_maze.js` | 修正成功后闪回的先后顺序和柔和时序 |
| `src/chapters/ch04_police.js`、`ch06_table.js` | 真实物件/背景与香气交互质量修正 |
| `src/chapters/ch07_night.js`、`ch08_sign.js` | 飞书叙事链路、占位接口和宽松“向阳”判定 |
| `src/chapters/ch09_chime.js` | 色块重构 + 下落式风铃音游 |
| `src/chapters/ch10_report.js` | 无操作蒙太奇、100% 完成与最终报告 |
| `tests/*.test.js` | 报告数据、顺序、进度与关键通关条件回归 |

## Task 1: 导入报告资产并建立 Canvas 报告渲染器

**Files:**
- Create: `assets/images/report/ch01.png` … `assets/images/report/ch10.png`
- Create: `assets/images/report/button_continue.png`
- Create: `src/ui/ArtworkMemoryReport.js`
- Create: `tests/artwork-memory-report.test.js`

**Interfaces:**
- Produces `ArtworkMemoryReport` with `open({ chapterNumber, memoryFrom, memoryTo, onContinue })`, `update(dt)`, `render(ctx, width, height)`, `handleDown(point)`, `isReady()`.
- Uses chapter filename mapping `1: 'ch01.png'` … `10: 'ch10.png'` and a cache keyed by URL.

- [ ] **Step 1: Extract only the approved UI asset files from the ZIP into staging and verify dimensions/alpha.**

Run `unzip -j <zip> '*/记忆恢复报告新底图/*.png' -d /private/tmp/echoes-report-assets` and retain exactly ten chapter images plus `memorybutton3-transparent.png`; rename them deterministically before copying into `assets/images/report/`.

- [ ] **Step 2: Write failing unit tests for mapping and progress.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_PROGRESS, getReportAssetPath } from '../src/ui/ArtworkMemoryReport.js';

test('report mapping uses a chapter-specific asset and canonical progress', () => {
  assert.equal(getReportAssetPath(9), './assets/images/report/ch09.png');
  assert.deepEqual(REPORT_PROGRESS, [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100]);
});
```

- [ ] **Step 3: Run the test and verify it fails before implementation.**

Run: `node --test tests/artwork-memory-report.test.js`
Expected: module-not-found or missing-export failure.

- [ ] **Step 4: Implement the renderer without DOM dependencies.**

`ArtworkMemoryReport` must lazily create `Image` instances in `open`, use `ctx.drawImage` only after each image is complete, interpolate the numeric progress over `1.8` seconds, map pointer hits to the continue button, and call only `onContinue` from its action. Under reduced motion, set the final value and ready state without waiting.

- [ ] **Step 5: Run focused and baseline tests.**

Run: `node --test tests/artwork-memory-report.test.js && npm test && git diff --check`
Expected: all focused and baseline tests pass; no whitespace errors.

## Task 2: 将普通章节结算接入报告渲染器

**Files:**
- Modify: `src/core/Overlay.js`
- Modify: `src/core/ChapterManager.js`
- Modify: `tests/archive-ui.test.js`
- Modify: `tests/artwork-memory-report.test.js`

**Interfaces:**
- Consumes `ArtworkMemoryReport` from Task 1.
- Produces Overlay config `{ type: 'complete', chapterNumber, memoryFrom, memoryTo, onContinue }`.

- [ ] **Step 1: Add a failing test for report configuration passed on Ch2 completion.**

```js
assert.deepEqual(completeConfig, {
  type: 'complete', chapterNumber: 2, memoryFrom: 5, memoryTo: 15,
});
```

- [ ] **Step 2: Run the focused test.**

Run: `node --test tests/archive-ui.test.js tests/artwork-memory-report.test.js`
Expected: failure because ChapterManager still sends title/message/buttons only.

- [ ] **Step 3: Implement canonical progress resolution.**

In `ChapterManager.update`, derive the completed chapter number from `currentName`, take `memoryTo` from the chapter's actual completed memory value, derive `memoryFrom` from `REPORT_PROGRESS[chapterNumber - 1]`, and call Overlay with `onContinue: () => this.next()`.

- [ ] **Step 4: Make Overlay delegate complete rendering and input.**

For `config.type === 'complete'`, instantiate/open the renderer once, forward `update`, `render`, and pointer-down calls, and call `hide()` only after its `onContinue` has initiated the ChapterManager transition. Preserve the legacy card path for any non-complete overlay.

- [ ] **Step 5: Run focused tests and browser chapter-flow smoke test.**

Run: `npm test && npm run visual-test && git diff --check`
Expected: no errors, Ch2 forced completion opens the chapter 2 report and continue enters Ch3.

## Task 3: 合并临时 Ch5 向日葵电梯成果

**Files:**
- Modify: `src/chapters/ch05_door.js`
- Create: `assets/images/ch5_elevator_sunflower_panel.png`
- Create/Modify: Ch5-specific regression test under `tests/`

**Interfaces:**
- Consumes temporary-task asset and its correct central sunflower hit zone.
- Produces Ch5 completion at 40% with the existing sequential floor-rise effect preserved.

- [ ] **Step 1: Compare the temporary worktree diff with the current dirty Ch5 file; isolate only the Ch5 panel changes.**

Run: `git -C /Users/onebilion/.codex/worktrees/35b9/抖音大区赛 diff -- src/chapters/ch05_door.js assets/images/ch5_elevator_sunflower_panel.png`.

- [ ] **Step 2: Add a regression test that asserts the panel asset is referenced and the completion target is the sunflower zone.**

```js
assert.match(source, /ch5_elevator_sunflower_panel\.png/);
assert.match(source, /sunflower/);
```

- [ ] **Step 3: Apply only that diff, preserving pre-existing user edits in Ch5.**

Use `apply_patch`; do not copy unrelated temporary-worktree files.

- [ ] **Step 4: Verify in browser.**

Run the Ch5 debug route, click the central sunflower, confirm no pink matte, and capture the 1–5 floor sequence. Then run `npm test`.

## Task 4: 修正 Ch2/Ch3 的闪回节奏与叙事衔接

**Files:**
- Modify: `src/chapters/ch02_puzzle.js`
- Modify: `src/chapters/ch03_maze.js`
- Modify: `tests/ch02-touch-snap.test.js`
- Create: `tests/flashback-sequencing.test.js`

**Interfaces:**
- Produces a Ch2 state order `completeHold → puzzleFadeOut → flashback → complete` and a Ch3 state order `successHold → routeFadeOut → cityFlashback → complete`.

- [ ] **Step 1: Write failing state-order tests.**

```js
assert.deepEqual(CH2_SUCCESS_STATES, ['completeHold', 'puzzleFadeOut', 'flashback', 'complete']);
assert.deepEqual(CH3_SUCCESS_STATES, ['successHold', 'routeFadeOut', 'cityFlashback', 'complete']);
```

- [ ] **Step 2: Run the test and observe failure.**

Run: `node --test tests/flashback-sequencing.test.js`.

- [ ] **Step 3: Implement soft sequencing.**

Ch2 must hold the completed puzzle, fade it to zero before frame 1 begins, then crossfade the five frames at 0.8–1.2 seconds per frame. Ch3 must fade the gold route to zero before its first city frame, then play the four frames with eased crossfades rather than hard 2fps switches.

- [ ] **Step 4: Verify timeline manually and with tests.**

Run: `node --test tests/flashback-sequencing.test.js tests/ch02-touch-snap.test.js && npm test`; capture one pre-flashback and one flashback browser screenshot per chapter.

## Task 5: 补齐 Ch4/Ch6 的关键物件和交互稳定性

**Files:**
- Modify: `src/main_new.js`
- Modify: `src/chapters/ch04_police.js`
- Modify: `src/chapters/ch06_table.js`
- Modify: `src/utils/tableLayout.js`
- Create: `tests/ch04-ch06-art-and-particles.test.js`

**Interfaces:**
- Ch4 must use `ch4_police_03` for handband focus and `ch4_police_08` for reunion focus where appropriate.
- Ch6 particle config exposes larger `attractRadius`, velocity damping, and stable target lock.

- [ ] **Step 1: Add failing source/config tests.**

```js
assert.match(ch4Source, /ch4_police_03/);
assert.match(ch4Source, /ch4_police_08/);
assert.ok(tableLayout.attractRadius >= 110);
assert.ok(tableLayout.targetLockRadius >= 55);
```

- [ ] **Step 2: Run focused tests and confirm failure.**

Run: `node --test tests/ch04-ch06-art-and-particles.test.js`.

- [ ] **Step 3: Implement existing-asset composition.**

Register any needed existing Ch4/Ch6 assets; use image crops/focus transitions for telephone, handband and reunion instead of program-drawn placeholders. Use the user-provided Ch6 kitchen image if it is present in project assets; otherwise use the existing dining-room image and place the real bowl layer once only. Raise attraction radius, add damping, and lock captured particles so they cannot wander out.

- [ ] **Step 4: Verify no exposed brown base and stable capture.**

Run Ch4 and Ch6 in browser, capture snapshots, then run `npm test && git diff --check`.

## Task 6: 生成并接入三张叙事关键帧

**Files:**
- Create: `assets/images/ch9_father_building_chime.png`
- Create: `assets/images/ch10_daughter_porridge_closeup.png`
- Create: `assets/images/ch10_father_daughter_embrace.png`
- Create: `docs/art-prompts/2026-07-30-narrative-frames.md`

**Interfaces:**
- Each image is a 16:9 scene frame, no text/watermark, warm low-saturation watercolor/old-photo visual language; Chapter 9 may use a full-frame scene, Chapter 10 frames are full-frame scenes not transparency cutouts.

- [ ] **Step 1: Use the built-in image generator for each distinct scene and inspect every output.**

Use three separate prompts. The Ch9 scene shows young father making a metal wind chime in a modest warm home; Ch10 closeup shows middle-aged daughter holding porridge, recognizing her father; Ch10 climax shows a restrained father-daughter embrace in morning sunlight. Use no visible Chinese text, logos, watermarks, neon, or modern UI.

- [ ] **Step 2: Save the selected assets into the workspace without overwriting existing images.**

Copy final images from the generator output into the three exact paths; preserve a written prompt and acceptance note in `docs/art-prompts/2026-07-30-narrative-frames.md`.

- [ ] **Step 3: Inspect visual consistency.**

Open each file and reject/re-generate any image with incorrect character count, unreadable hands, incompatible saturation, visible text, or modern/cyber visual language.

- [ ] **Step 4: Verify asset presence.**

Run: `file assets/images/ch9_father_building_chime.png assets/images/ch10_daughter_porridge_closeup.png assets/images/ch10_father_daughter_embrace.png`.

## Task 7: 补齐 Ch7/Ch8 的可读链路与宽松通关

**Files:**
- Modify: `src/main_new.js`
- Modify: `src/chapters/ch07_night.js`
- Modify: `src/chapters/ch08_sign.js`
- Create: `tests/ch07-ch08-narrative.test.js`

**Interfaces:**
- Ch7 state order: `nightNarrative → socialLights → flashlightSearch → hallucinationClear → doorOpen → complete`.
- Ch8 exposes `cameraPlaceholderRect` and accepts recognisable two-character “向阳” strokes or the explicit fallback gesture.

- [ ] **Step 1: Write failing state/threshold tests.**

```js
assert.match(ch7Source, /socialLights/);
assert.match(ch8Source, /cameraPlaceholder/);
assert.ok(extractPassScore(ch8Source) <= 60);
```

- [ ] **Step 2: Implement without device permissions.**

Use Canvas-drawn social bubbles and existing shadow/beam/lock assets in Ch7. In Ch8, draw a labeled but inactive camera placeholder, never call `getUserMedia`, and accept either a broad two-character writing heuristic for “向阳” or the already-defined swipe fallback; retain clear/reset controls.

- [ ] **Step 3: Run test and browser checks.**

Run: `node --test tests/ch07-ch08-narrative.test.js && npm test`; verify Ch8 can pass with a legible two-character writing attempt and does not request camera permission.

## Task 8: 重建 Ch9 为两段风铃互动，并实现 Ch10 终局

**Files:**
- Modify: `src/main_new.js`
- Modify: `src/chapters/ch09_chime.js`
- Modify: `src/chapters/ch10_report.js`
- Create: `tests/ch09-ch10-flow.test.js`

**Interfaces:**
- Ch9 state order: `intro → colorRebuild → flashback → rhythmGame → resolve → complete`.
- Ch10 state order: `porridge → montage → reunion → finalReport`; final report persists chapter 10 and 100.

- [ ] **Step 1: Write failing chapter flow tests.**

```js
assert.deepEqual(CH9_STATES, ['intro', 'colorRebuild', 'flashback', 'rhythmGame', 'resolve', 'complete']);
assert.match(ch10Source, /markChapterComplete\(10,\s*100\)/);
```

- [ ] **Step 2: Implement Ch9 color reconstruction.**

Create four color-coded distorted glyph groups. Dragging a glyph within the matching color rail must magnetically snap; all groups correct dissolve into colored staff lines and show the generated crafting flashback before rhythm play.

- [ ] **Step 3: Implement Ch9 rhythm play.**

Use the existing four color pipes and four note images. Notes fall vertically to a fixed judgement line; tap the matching pipe inside a forgiving timing window, increment Combo, and progressively transition the room from cool to warm. Provide an automatic slow fallback after repeated misses so Ch9 cannot block Ch10.

- [ ] **Step 4: Implement Ch10 final narrative and 100% persistence.**

After entry, play a non-interactive montage using existing chapter frames plus the two generated Ch10 images: slow focus, soft crossfades, white transition, embrace hold, then write completion and show chapter 10 artwork report. Remove any bottom table strip that exposes a brown board under the background.

- [ ] **Step 5: Run full flow verification.**

Run `npm test`, force complete Ch9 in browser, finish both Ch9 phases, verify Ch10 reaches 100% and restart returns to Ch1.

## Task 9: 全流程验收、文档和提交准备

**Files:**
- Modify: `docs/game-as-built-description.md`
- Modify: `docs/game-flow-and-ui-adaptation.md` only if it already describes the changed flow
- Modify/Create: tests needed for regressions discovered in final run

**Interfaces:**
- Documents the implemented state, not design intent; records three generated assets and all report/flow changes.

- [ ] **Step 1: Run all automated checks.**

Run: `npm test && npm run visual-test && git diff --check`.

- [ ] **Step 2: Run browser end-to-end checks.**

Verify Ch2, Ch3, Ch4, Ch5, Ch6, Ch8, Ch9 and Ch10 in the live Canvas. Capture screenshots for report layout, delayed flashbacks, Ch5 elevator, Ch6 particles, Ch9 two-phase flow and Ch10 100% report; check console has no errors.

- [ ] **Step 3: Update descriptive documentation from evidence.**

Replace any obsolete “planned/current” claims with actual final state, report asset paths, generated-frame purposes, runtime timings and known limitations (no real camera/audio/gyro).

- [ ] **Step 4: Confirm repository and create intentional commits.**

Run `git remote -v`, confirm it contains `Echoes_of_Yesterday_New.git`, inspect `git status --short`, stage only files belonging to this approved feature, and commit coherent verified units. Do not push: project rule says GitHub push is executed by the user locally.

## Plan self-review

- Spec coverage: Tasks 1–2 cover reports; 3 covers temporary Ch5; 4–5 cover timing and Ch4/Ch6; 6 covers the approved three generated story frames; 7 covers Ch7/Ch8; 8 covers Ch9/Ch10; 9 covers testing, docs and Git handoff.
- Image budget: Task 6 creates exactly three images; no other task may generate images without an explicit change to this plan and user approval once the sixth-image cap would be affected.
- Interface consistency: Task 1 owns report APIs; Task 2 consumes them; Task 8 is the sole owner of 100% persistence; Task 9 verifies both.
- 占位项检查：未发现未决占位项；每项任务均列出目标文件、输入、行为和测试命令。
