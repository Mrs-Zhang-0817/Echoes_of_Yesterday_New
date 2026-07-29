import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('release build inlines the data modules required by boot', () => {
  const build = spawnSync('node', ['build.cjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const output = readFileSync(join(root, 'build_out', 'index.html'), 'utf8');
  assert.match(output, /const GAME_CHAPTERS = \[/);
  assert.match(output, /const assetManifest = \{/);
  assert.match(output, /\[\.\.\.GAME_CHAPTERS\]\.sort/);
});
