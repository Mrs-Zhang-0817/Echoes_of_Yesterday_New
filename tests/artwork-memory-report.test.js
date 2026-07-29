import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_PROGRESS, getReportScenePath } from '../src/ui/ArtworkMemoryReport.js';

test('report mapping pastes each chapter source scene into the shared report layout', () => {
  assert.equal(getReportScenePath(7), './assets/images/ch7_bg_bedroom_night.jpg');
  assert.equal(getReportScenePath(8), './assets/images/ch8_corridor.jpg');
  assert.deepEqual(REPORT_PROGRESS, [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100]);
});
