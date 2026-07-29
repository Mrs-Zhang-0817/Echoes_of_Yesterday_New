import assert from 'node:assert/strict';
import test from 'node:test';
import { CH2_SUCCESS_STATES } from '../src/chapters/ch02_puzzle.js';
import { CH3_SUCCESS_STATES } from '../src/chapters/ch03_maze.js';

test('Ch2 成功状态顺序为 completeHold → puzzleFadeOut → flashback → complete', () => {
  assert.deepEqual(CH2_SUCCESS_STATES, ['completeHold', 'puzzleFadeOut', 'flashback', 'complete']);
});

test('Ch3 成功状态顺序为 successHold → routeFadeOut → cityFlashback → complete', () => {
  assert.deepEqual(CH3_SUCCESS_STATES, ['successHold', 'routeFadeOut', 'cityFlashback', 'complete']);
});
