/**
 * Playwright 截图 + 多模态模型视觉排查
 *
 * 用法：
 *   1. 先构建游戏：     node build.cjs
 *   2. 启动服务：        npx serve build_out -p 3000 -s
 *   3. 运行视觉测试：   npx playwright test tests/visual-test.spec.js
 *
 * 环境变量（可选）：
 *   VLM_API_KEY    — 多模态模型 API key（默认使用内置规则分析）
 *   VLM_API_URL    — 兼容 OpenAI / Anthropic 的 API 端点
 *   VLM_MODEL      — 模型名（默认 gpt-4o）
 *   SERVER_URL     — 游戏页面地址（默认 http://localhost:3000）
 */

import { test, expect } from 'playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = path.join(__dirname, '..', 'visual-reports');

// ============ 配置 ============
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const VLM_API_KEY = process.env.VLM_API_KEY || '';
const VLM_API_URL = process.env.VLM_API_URL || '';
const VLM_MODEL = process.env.VLM_MODEL || '';

// ============ 十章节跳转映射 ============
const CHAPTER_HOTKEYS = {
  'ch01': '1', 'ch02': '2', 'ch03': '3', 'ch04': '4', 'ch05': '5',
  'ch06': '6', 'ch07': '7', 'ch08': '8', 'ch09': '9', 'ch10': '0',
};

const CHAPTER_NAMES = {
  ch01: '序曲·镜前', ch02: '接女儿放学（拼图）', ch03: '迷途（迷宫）',
  ch04: '警局（电话+手环）', ch05: '归家迷途（声波+电梯）',
  ch06: '餐桌上的博弈（触觉+气味）', ch07: '惊悚夜醒（黑暗摸锁）',
  ch08: '自我和解（签字）', ch09: '风铃（音符排序）', ch10: '认出（终章报告）',
};

// ============ 截图 ============

/**
 * 跳转到指定章节，等待渲染稳定后截图
 */
async function screenshotChapter(page, chapterId, label) {
  // 键盘快捷键跳转
  const key = CHAPTER_HOTKEYS[chapterId];
  if (!key) throw new Error(`未知章节: ${chapterId}`);

  await page.keyboard.press(key);
  // 等待游戏引擎完成过渡渲染（~ 3帧 + 过渡动画 0.3s）
  await page.waitForTimeout(800);

  // 从 DebugAPI 读取元数据
  const meta = await page.evaluate(() => {
    if (window.__debug__ && typeof window.__debug__.screenshotMeta === 'function') {
      return window.__debug__.screenshotMeta();
    }
    return null;
  });

  const filename = `${chapterId}_${label || meta?.phase || 'state'}_${Date.now()}.png`;
  const filepath = path.join(REPORT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });

  return { chapterId, label, meta, filename: filepath, relativePath: filename };
}

// ============ 多模态分析 ============

/**
 * 调用多模态 API 分析截图。API key 为空时，使用内置规则做本地分析。
 */
async function analyzeScreenshot(imagePath, chapterId, meta) {
  if (VLM_API_KEY) {
    return analyzeViaVLM(imagePath, chapterId, meta);
  }
  return analyzeLocally(imagePath, chapterId, meta);
}

/**
 * 内置规则分析（检查画面是否有效、是否有明显渲染问题）
 */
function analyzeLocally(imagePath, chapterId, meta) {
  const stats = fs.statSync(imagePath);
  const issues = [];

  // 检查截图是否为空（文件过小意味着画面可能是全黑）
  if (stats.size < 2000) {
    issues.push({ severity: 'CRITICAL', category: 'blank_screenshot', detail: '截图文件异常小，可能为空白画面' });
  }

  // 从 DebugAPI meta 中分析
  if (meta) {
    if (!meta.chapter || meta.chapter === '?') {
      issues.push({ severity: 'CRITICAL', category: 'chapter_load', detail: '章节未正确加载' });
    }
    if (meta.overlayActive) {
      issues.push({ severity: 'INFO', category: 'overlay_showing', detail: `弹层已显示: ${meta.overlay?.title || ''}` });
    }
  }

  return {
    chapter: chapterId,
    image: path.basename(imagePath),
    imageSize: stats.size,
    analysis: {
      summary: issues.length === 0 ? '无明显问题' : `发现 ${issues.length} 个问题`,
      issues,
    },
  };
}

/**
 * 调用外部多模态 API 进行分析（兼容 OpenAI Chat Completions 格式）
 */
async function analyzeViaVLM(imagePath, chapterId, meta) {
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  const endpoint = VLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = VLM_MODEL || 'gpt-4o';
  const isAnthropic = endpoint.includes('anthropic.com');

  const prompt = `你是一个 HTML5 Canvas 游戏视觉质量检查员。检查这张游戏中 "${CHAPTER_NAMES[chapterId] || chapterId}" 章节的截图，按 JSON 格式输出检查结果：

{
  "summary": "一句整体判断",
  "issues": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "category": "blank_screen|crop_error|missing_element|color_distortion|text_issue|overlap|other",
      "detail": "清楚描述问题",
      "suggestion": "可能的根因和改进建议"
    }
  ],
  "positive": ["列举画面正确运行的方面"]
}

重点关注：
1. 画面是否是纯黑/纯白/色块——有可能是 Canvas 未渲染
2. 文字是否完整可读、有无截断或乱码
3. UI 元素是否有重叠或错误定位
4. 色彩、对比度是否正常
5. 游戏交互元素是否可见

只输出 JSON，不要包裹 markdown 代码块。`;

  let response;
  if (isAnthropic) {
    // Anthropic Messages API
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VLM_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
            ],
          },
        ],
      }),
    });
  } else {
    // OpenAI-compatible
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}`, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    return {
      chapter: chapterId,
      image: path.basename(imagePath),
      analysis: {
        summary: `API 调用失败 (${response.status})`,
        issues: [{ severity: 'WARNING', category: 'api_error', detail: errText.slice(0, 300) }],
        positive: [],
      },
    };
  }

  const data = await response.json();
  let analysis;
  try {
    const content = isAnthropic ? data.content[0].text : data.choices[0].message.content;
    // 尝试从返回中提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: '无法解析模型输出', issues: [], positive: [] };
  } catch {
    analysis = { summary: '无法解析模型输出', issues: [], positive: [] };
  }

  return { chapter: chapterId, image: path.basename(imagePath), analysis };
}

// ============ 生成报告 ============

function generateReport(results) {
  const totalIssues = results.reduce((sum, r) => sum + (r.analysis?.issues?.length || 0), 0);
  const criticalIssues = results.filter(r =>
    r.analysis?.issues?.some(i => i.severity === 'CRITICAL')
  );
  const warnings = results.filter(r =>
    r.analysis?.issues?.some(i => i.severity === 'WARNING')
  );

  const report = {
    timestamp: new Date().toISOString(),
    totalScreenshots: results.length,
    totalIssues,
    grade: criticalIssues.length > 0 ? 'FAIL' : warnings.length > 3 ? 'WARN' : 'PASS',
    summary: `共检查 ${results.length} 个画面，发现 ${totalIssues} 个问题（严重: ${criticalIssues.length}，警告: ${warnings.length}）`,
    chapters: results,
  };

  const filepath = path.join(REPORT_DIR, `visual-report_${Date.now()}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8');
  return filepath;
}

// ============ 测试 ============

const CHAPTERS = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10'];

test.describe('视觉排查：昨日重现', () => {

  test.beforeAll(async () => {
    // 清理历史截图（不删除目录）
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
  });

  test('遍历全 10 章并截图排查', async ({ page }) => {
    // 1. 加载游戏
    await page.goto(SERVER_URL, { waitUntil: 'networkidle' });
    await page.locator('#BTN_START_MEMORY').click();
    // 等待 loading 消失
    await page.waitForTimeout(1000);
    await page.waitForSelector('#loading.hidden', { timeout: 15000 }).catch(() => {
      console.warn('⚠️ loading 未在 15s 内隐藏，继续截图');
    });

    // 2. 确认游戏已初始化
    const hasGame = await page.evaluate(() => !!window.__debug__);
    if (!hasGame) {
      // fallback: 确认 canvas 存在且有内容
      const canvasExists = await page.evaluate(() => !!document.getElementById('gameCanvas'));
      expect(canvasExists).toBe(true);
      console.warn('⚠️ DebugAPI 未加载，使用 Canvas 基础检查');
    }

    // 3. 逐个章节截图
    const results = [];

    for (const ch of CHAPTERS) {
      const label = 'main';
      const shot = await screenshotChapter(page, ch, label);

      // 分析
      const analysis = await analyzeScreenshot(shot.filename, ch, shot.meta);
      results.push(analysis);

      console.log(
        `  ${analysis.analysis.summary}` +
        (analysis.analysis.issues?.length
          ? ` | issues: ${analysis.analysis.issues.map(i => `[${i.severity}] ${i.detail}`).join('; ')}`
          : '')
      );
    }

    // 4. 生成综合报告
    const reportPath = generateReport(results);
    console.log(`\n📋 视觉排查报告: ${reportPath}`);

    // 5. 断言：没有 CRITICAL 问题
    const criticals = results.filter(r =>
      r.analysis?.issues?.some(i => i.severity === 'CRITICAL')
    );
    expect(criticals.length).toBe(0);
  });
});
