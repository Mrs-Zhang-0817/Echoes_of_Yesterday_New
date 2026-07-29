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

// 从源文本提取 PASS_SCORE 常量数值
function extractPassScore(src) {
  const m = src.match(/PASS_SCORE\s*=\s*(\d+)/);
  if (!m) throw new Error('源中未找到 PASS_SCORE 常量');
  return Number(m[1]);
}

test('Ch7 状态机包含 socialLights 阶段（社交气泡叙事）', () => {
  assert.match(ch7Source, /socialLights/);
});

test('Ch8 场景包含「带标签但非激活」的摄像头占位', () => {
  assert.match(ch8Source, /cameraPlaceholder/);
});

test('Ch8 签名通关阈值已下调到 <= 60（解决软卡关）', () => {
  const score = extractPassScore(ch8Source);
  assert.ok(score <= 60, `PASS_SCORE 应为 <= 60，实际为 ${score}`);
});
