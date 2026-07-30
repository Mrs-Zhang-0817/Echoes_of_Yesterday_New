import test from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_PROGRESS, getReportAssetPath } from '../src/ui/ArtworkMemoryReport.js';

test('report mapping uses each chapter’s dedicated memory-report artwork', () => {
  assert.equal(getReportAssetPath(7), './assets/images/report/ch07.jpg');
  assert.equal(getReportAssetPath(8), './assets/images/report/ch08.jpg');
  assert.deepEqual(REPORT_PROGRESS, [0, 5, 15, 22, 30, 40, 52, 60, 72, 85, 100]);
});

test('main menu exposes the report and medical archives in one reachable UI', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/ui/MainMenu.js', import.meta.url), 'utf8');
  assert.match(source, /记忆档案/);
  assert.match(source, /医学档案/);
  assert.match(source, /assets\/images\/report\/ch/);
  assert.match(source, /assets\/pictures\/medical\/medical_ch/);
});
