import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_PROGRESS, getReportAssetPath } from '../src/ui/ArtworkMemoryReport.js';

test('report mapping uses a chapter-specific asset and canonical progress', () => {
  assert.equal(getReportAssetPath(9), './assets/images/report/ch09.png');
  assert.deepEqual(REPORT_PROGRESS, [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100]);
});
