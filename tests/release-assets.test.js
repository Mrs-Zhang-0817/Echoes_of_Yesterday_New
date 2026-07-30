import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFinalAssets = [
  'ch2_tinbox_open.jpg', 'ch2_key_inside.jpg', 'ch2_candy_inside.jpg',
  'ch2_flashback_01.jpg', 'ch2_flashback_02.jpg', 'ch2_flashback_03.jpg', 'ch2_flashback_04.jpg', 'ch2_flashback_05.jpg',
  'ch3_bg_old_community.jpg', 'ch3_cityup_01.jpg', 'ch3_cityup_02.jpg', 'ch3_cityup_03.jpg', 'ch3_cityup_04.jpg',
  'ch3_bg_city_street.jpg', 'ch3_bg_school_gate.jpg', 'ch3_npc_passerby.png', 'ch3_red_scarf_girl.png',
  'ch5_sunflower_sticker.jpg',
  'ch7_bg_bedroom_night.jpg', 'ch7_flashlight_beam.jpg', 'ch7_hallucination_shadow.jpg', 'ch7_door_lock.jpg',
  'ch8_mirror_smile.png', 'ch8_radio_knob.png', 'ch9_notebook_glyphs.png',
];
const requiredComicAssets = [
  ...Array.from({ length: 5 }, (_, index) => `ch01_${String(index + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 4 }, (_, index) => `ch02_${String(index + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 8 }, (_, index) => `ch03_${String(index + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 6 }, (_, index) => `ch04_${String(index + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 7 }, (_, index) => `ch05_${String(index + 1).padStart(2, '0')}.jpg`),
  ...Array.from({ length: 4 }, (_, index) => `ch06_${String(index + 1).padStart(2, '0')}.jpg`),
  'ch08_01.jpg',
  'ch09_01.jpg',
];

test('release build contains every approved final art asset', () => {
  const build = spawnSync('node', ['build.cjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const filename of requiredFinalAssets) {
    const output = join(root, 'build_out', 'assets', 'images', filename);
    assert.ok(existsSync(output), `missing release asset: ${filename}`);
    assert.ok(statSync(output).size > 1024, `invalid release asset: ${filename}`);
  }
});

test('release build contains every comic scene used by the story flow', () => {
  const build = spawnSync('node', ['build.cjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const filename of requiredComicAssets) {
    const output = join(root, 'build_out', 'assets', 'images', 'comic_flat', filename);
    assert.ok(existsSync(output), `missing release comic scene: ${filename}`);
    assert.ok(statSync(output).size > 1024, `invalid release comic scene: ${filename}`);
  }
});
