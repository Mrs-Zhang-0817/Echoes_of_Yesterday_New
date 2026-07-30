import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

test('Ch9 exports the canonical state order', async () => {
  const mod = await import(path.join(root, 'src/chapters/ch09_chime.js'));
  assert.deepEqual(
    mod.CH9_STATES,
    ['intro', 'colorRebuild', 'flashback', 'rhythmGame', 'resolve', 'complete']
  );
});

test('Ch10 exports the canonical state order', async () => {
  const mod = await import(path.join(root, 'src/chapters/ch10_report.js'));
  assert.deepEqual(
    mod.CH10_STATES,
    ['porridge', 'montage', 'reunion', 'finalReport']
  );
});

test('Ch10 marks chapter 10 complete with 100% memory', () => {
  const src = readFileSync(path.join(root, 'src/chapters/ch10_report.js'), 'utf8');
  assert.match(src, /markChapterComplete\(10,\s*100\)/);
});

test('Ch10 final archive uses the story photos and medical archive artwork', () => {
  const src = readFileSync(path.join(root, 'src/chapters/ch10_report.js'), 'utf8');
  assert.match(src, /ch10_father_daughter_embrace/);
  assert.match(src, /ch10_daughter_porridge_closeup/);
  assert.match(src, /medical_ch10/);
  assert.match(src, /阿尔茨海默症关怀档案/);
});

test('Ch9 marks chapter 9 complete with 85% memory', () => {
  const src = readFileSync(path.join(root, 'src/chapters/ch09_chime.js'), 'utf8');
  assert.match(src, /markChapterComplete\(9,\s*85\)/);
});

test('narrative activities are decoupled modules', async () => {
  const flash = await import(path.join(root, 'src/narrative/FlashbackActivity.js'));
  const montage = await import(path.join(root, 'src/narrative/MontageActivity.js'));
  assert.equal(typeof flash.FlashbackActivity, 'function');
  assert.equal(typeof montage.MontageActivity, 'function');
});

test('comic activity presents a whole page without clipping panels', () => {
  const src = readFileSync(path.join(root, 'src/narrative/ComicActivity.js'), 'utf8');
  assert.match(src, /Math\.min\(width \/ imgW, height \/ imgH\)/);
  assert.doesNotMatch(src, /ctx\.clip\(\)/);
  assert.doesNotMatch(src, /config\.panels/);
});
