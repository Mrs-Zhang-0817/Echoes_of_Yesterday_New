import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const requiredFinalAssets = [
  'ch2_tinbox_open.png', 'ch2_key_inside.png', 'ch2_candy_inside.png',
  'ch2_flashback_01.jpg', 'ch2_flashback_02.jpg', 'ch2_flashback_03.jpg', 'ch2_flashback_04.jpg', 'ch2_flashback_05.jpg',
  'ch3_bg_old_community.jpg', 'ch3_cityup_01.jpg', 'ch3_cityup_02.jpg', 'ch3_cityup_03.jpg', 'ch3_cityup_04.jpg',
  'ch3_bg_city_street.jpg', 'ch3_bg_school_gate.jpg', 'ch3_npc_passerby.png', 'ch3_red_scarf_girl.png',
  'ch5_sunflower_sticker.png',
  'ch7_bg_bedroom_night.jpg', 'ch7_flashlight_beam.png', 'ch7_hallucination_shadow.png', 'ch7_door_lock.png',
  'ch8_mirror_smile.png', 'ch8_radio_knob.png', 'ch9_notebook_glyphs.png',
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
