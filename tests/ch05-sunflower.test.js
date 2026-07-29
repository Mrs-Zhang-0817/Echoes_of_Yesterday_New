import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/chapters/ch05_door.js', import.meta.url), 'utf8');

test('Ch5 references the sunflower elevator panel asset and sunflower theme', () => {
  assert.match(src, /ch5_elevator_sunflower_panel\.png/);
  assert.match(src, /sunflower/);
});
