import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_PROGRESS, getReportAssetPath } from '../src/ui/ArtworkMemoryReport.js';

test('report mapping uses each chapter’s dedicated memory-report artwork', () => {
  assert.equal(getReportAssetPath(7), './assets/images/report/ch07.jpg');
  assert.equal(getReportAssetPath(8), './assets/images/report/ch08.jpg');
  assert.deepEqual(REPORT_PROGRESS, [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100]);
});
