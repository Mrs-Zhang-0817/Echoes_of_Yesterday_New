import assert from 'node:assert/strict';
import test from 'node:test';
import { drawArchiveButton, drawArchivePanel, drawArchiveStamp } from '../src/ui/ArchiveUI.js';

function context() {
  return {
    calls: [], save() {}, restore() {}, beginPath() {}, arc() {}, roundRect(...args) { this.calls.push(['roundRect', ...args]); },
    fill() {}, stroke() {}, fillText(text, x, y) { this.calls.push(['text', text, x, y]); },
    fillRect(...args) { this.calls.push(['rect', ...args]); },
    set fillStyle(value) { this.calls.push(['fillStyle', value]); }, set strokeStyle(value) { this.calls.push(['strokeStyle', value]); },
    set lineWidth(value) {}, set font(value) {}, set textAlign(value) {}, set textBaseline(value) {},
  };
}

test('档案 UI 在设计坐标中绘制面板、印章和可点击按钮', () => {
  const ctx = context();
  drawArchivePanel(ctx, 120, 80, 400, 260, '记忆档案');
  drawArchiveStamp(ctx, 460, 120, '已归档');
  const hitbox = drawArchiveButton(ctx, 500, 600, 180, 44, '继续');

  assert.deepEqual(hitbox, { x: 500, y: 600, w: 180, h: 44 });
  assert.ok(ctx.calls.some(call => call[0] === 'text' && call[1] === '记忆档案'));
  assert.ok(ctx.calls.some(call => call[0] === 'text' && call[1] === '已归档'));
  assert.ok(ctx.calls.some(call => call[0] === 'text' && call[1] === '继续'));
});
