import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as tableLayout from '../src/utils/tableLayout.js';

const ch4Source = readFileSync(new URL('../src/chapters/ch04_police.js', import.meta.url), 'utf8');

test('Ch4 源文本引用 ch4_police_03 与 ch4_police_08 关键焦点图', () => {
  assert.match(ch4Source, /ch4_police_03/);
  assert.match(ch4Source, /ch4_police_08/);
});

test('tableLayout 暴露 attractRadius(>=110) 与 targetLockRadius(>=55)', () => {
  assert.ok(typeof tableLayout.attractRadius === 'number' && tableLayout.attractRadius >= 110);
  assert.ok(typeof tableLayout.targetLockRadius === 'number' && tableLayout.targetLockRadius >= 55);
});
