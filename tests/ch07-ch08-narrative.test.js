// 测试 Ch7 / Ch8 叙事可读链路与宽松通关（计划 Task 7）
// 仅做源文本级断言：不依赖运行时 Canvas / 浏览器环境。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ch7Path = join(root, 'src/chapters/ch07_night.js');
const ch8Path = join(root, 'src/chapters/ch08_sign.js');

const ch7Source = readFileSync(ch7Path, 'utf8');
const ch8Source = readFileSync(ch8Path, 'utf8');

test('Ch7 状态机包含 socialLights 阶段（社交气泡叙事）', () => {
  assert.match(ch7Source, /socialLights/);
});

test('Ch8 显式接入前置摄像头微笑识别，并提供挥手回退', () => {
  assert.match(ch8Source, /SmileDetector/);
  assert.match(ch8Source, /开启前置摄像头/);
  assert.match(ch8Source, /不用摄像头，挥手/);
});

test('Ch8 以连续微笑或一次宽幅挥手完成镜面揭示', () => {
  assert.match(ch8Source, /保持微笑 1\.5 秒/);
  assert.match(ch8Source, /this\.DW \* 0\.35/);
});
