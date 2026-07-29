/**
 * DebugAPI —— 开发态调试接口
 * 将场景、对象、坐标、交互热区和游戏状态转为可读取的 JSON
 *
 * 用法（在浏览器控制台）：
 *   window.__debug__.inspect()    // 完整快照
 *   window.__debug__.state()      // 全局状态摘要
 *   window.__debug__.screenshotMeta()  // Playwright 截图元数据
 */

// ========== 四舍五入（控制小数位数，避免 JSON 浮点过长）==========
function round(v, d = 1) {
  if (v === undefined || v === null || typeof v !== 'number') return v;
  if (!Number.isFinite(v)) return v;
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

// ========== 安全访问已知布局常量（import 会被 build.cjs 剥离）==========
import { MAZE_CONFIG } from '../chapters/ch03_mazeLayout.js';
import { SOUND_SOURCES, ELEVATOR_BUTTONS, getButtonRect, ELEVATOR_CONFIG } from '../utils/returnNightLayout.js';
import { BOWL, SCENT_PARTICLES, GATING_CONFIG } from '../utils/tableLayout.js';

// ========== 逐章节提取器 ==========

const chapterExtractors = {
  Chapter01(ch) {
    return {
      clickCount: ch.clickCount,
      shatterParticles: ch.shatterParticles.map(p => ({
        x: round(p.x), y: round(p.y),
        vx: round(p.vx), vy: round(p.vy),
        size: round(p.size), life: round(p.life), color: p.color,
      })),
      cracksCount: ch.cracks.length,
      cracksVisible: ch.cracksVisible,
      interactiveZones: [
        { type: 'ellipse', name: '镜子', cx: 640, cy: 340, rx: 250, ry: 325 },
      ],
    };
  },

  Chapter02(ch) {
    return {
      pieces: ch.pieces.map(p => ({
        x: round(p.x), y: round(p.y),
        w: round(p.width), h: round(p.height),
        placed: p.placed, dragging: p.dragging,
        highlight: round(p.highlight),
        ejecting: !!p.ejection,
      })),
      hoveredPiece: ch.hoveredPiece ? true : false,
      dragging: !!ch.draggedPiece,
      particleCount: ch.particles.length,
      interactiveZones: ch.pieces
        .filter(p => !p.placed)
        .map(p => ({
          type: 'rect', name: '拼图块',
          x: round(p.x), y: round(p.y),
          w: round(p.width), h: round(p.height),
        })),
    };
  },

  Chapter03(ch) {
    const nodes = (MAZE_CONFIG && MAZE_CONFIG.nodes) || [];
    const decoys = (MAZE_CONFIG && MAZE_CONFIG.decoys) || [];
    return {
      points: ch.points.map(p => ({ x: round(p.x), y: round(p.y) })),
      hoveredNode: ch.hoveredNode,
      debug: !!ch.debug,
      nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, type: n.type })),
      decoys: decoys.map(d => ({ id: d.id, x: d.x, y: d.y })),
      interactiveZones: [
        { type: 'rect', name: '重置按钮', x: ch.resetBtn.x, y: ch.resetBtn.y, w: ch.resetBtn.w, h: ch.resetBtn.h },
        ...nodes.map(n => ({
          type: 'circle', name: `节点-${n.id}`, cx: n.x, cy: n.y, r: MAZE_CONFIG.nodeRadius,
        })),
      ],
    };
  },

  Chapter04(ch) {
    const zones = [];
    if (ch.phase === 'phone' || ch.phase === 'ringing') {
      zones.push(
        { type: 'rect', name: '电话底座', x: 200, y: 310, w: 100, h: 70 },
        { type: 'rect', name: '听筒', x: 190, y: 278, w: 120, h: 28 },
      );
    } else if (ch.phase === 'form') {
      zones.push({ type: 'circle', name: '手环', cx: 120, cy: 560, r: 40 });
    }
    return { interactiveZones: zones };
  },

  Chapter05(ch) {
    const zones = [];
    if (ch.phase === 'gating2') {
      for (let i = 0; i < (ELEVATOR_BUTTONS || []).length; i++) {
        const rect = getButtonRect ? getButtonRect(i) : { x: 0, y: 0, w: 0, h: 0 };
        const btn = ELEVATOR_BUTTONS[i];
        zones.push({
          type: 'rect', name: `电梯按钮-${btn ? btn.label : i}`,
          x: rect.x, y: rect.y, w: rect.w, h: rect.h,
          isCorrect: i === (ELEVATOR_CONFIG && ELEVATOR_CONFIG.correctIndex),
        });
      }
    }
    return {
      scanPos: round(ch.scanPos),
      sourcesFound: ch.sourcesFound,
      sources: (ch.sources || []).map(s => ({
        x: round(s.screenBaseX), y: round(s.y),
        found: s.found, lockProgress: round(s.lockProgress),
      })),
      dragging: !!ch.dragging,
      isLocking: !!ch.isLocking,
      errorTimer: round(ch.errorTimer),
      lastPressed: ch.lastPressed,
      interactiveZones: zones,
    };
  },

  Chapter06(ch) {
    const scents = SCENT_PARTICLES || [];
    const targets = scents.map(s => ({
      type: 'circle', name: `气味目标-${s.id}`,
      cx: s.targetX, cy: s.targetY, r: GATING_CONFIG ? GATING_CONFIG.targetRadius : 30,
    }));
    return {
      comfortProgress: round(ch.comfortProgress),
      fingerInBowl: !!ch.fingerInBowl,
      collectedCount: ch.collectedCount,
      steamCount: (ch.steam || []).length,
      particleCount: (ch.particles || []).length,
      scentsCollected: scents.map(s => ({ id: s.id, label: s.label, collected: !!s.collected })),
      interactiveZones: [
        { type: 'ellipse', name: '碗', cx: BOWL && BOWL.cx, cy: BOWL && BOWL.cy, rx: BOWL && BOWL.rx, ry: BOWL && BOWL.ry },
        ...targets,
      ],
    };
  },

  Chapter07(ch) {
    return {
      lockPos: { x: round(ch.lockX), y: round(ch.lockY) },
      fingerActive: !!ch.fingerActive,
      fingerPos: ch.fingerX >= 0 ? { x: round(ch.fingerX), y: round(ch.fingerY) } : null,
      warmLightProgress: round(ch.warmLightProgress),
      timeoutRevealed: !!ch.timeoutRevealed,
      moonHintShown: !!ch.moonHintShown,
      openProgress: round(ch.openProgress),
      interactiveZones: [
        { type: 'circle', name: '门锁', cx: ch.lockX, cy: ch.lockY, r: 35 },
      ],
    };
  },

  Chapter08(ch) {
    return {
      strokesCount: ch.strokes.length,
      attempts: ch.attempts,
      passed: !!ch.passed,
      timeoutActive: !!ch.timeoutActive,
      timeoutFired: !!ch.timeoutFired,
      showHint: !!ch.showHint,
      zoomT: round(ch.zoomT),
      phaseTime: round(ch.phaseTime),
      interactiveZones: [
        { type: 'rect', name: '清除按钮', x: ch.DW - 234, y: ch.DH - 52, w: 90, h: 36 },
        { type: 'rect', name: '提交按钮', x: ch.DW - 130, y: ch.DH - 56, w: 110, h: 40 },
      ],
    };
  },

  Chapter09(ch) {
    return {
      notes: ch.notes.map(n => ({
        id: n.id, label: n.label,
        currentX: round(n.currentX), currentY: round(n.currentY),
        targetX: n.targetX, targetY: n.targetY,
        placed: n.placed, distance: round(Math.hypot(n.currentX - n.targetX, n.currentY - n.targetY)),
      })),
      dragging: !!ch.dragging,
      dragIndex: ch.dragIndex,
      interactiveZones: ch.notes.map(n => ({
        type: 'rect', name: `音符-${n.label}`,
        x: round(n.currentX), y: round(n.currentY), w: 60, h: 80,
        placed: n.placed,
        targetX: n.targetX, targetY: n.targetY,
      })),
    };
  },

  Chapter10(ch) {
    return {
      bowlPos: { cx: ch.bowlCx, cy: ch.bowlCy, rx: round(ch.bowlRx), ry: round(ch.bowlRy), hitRadius: ch.bowlHitRadius },
      steamCount: ch.steam.length,
      phaseTime: round(ch.phaseTime),
      interactiveZones: [
        { type: 'circle', name: '粥碗', cx: ch.bowlCx, cy: ch.bowlCy, r: ch.bowlHitRadius },
        { type: 'rect', name: '重新开始', x: ch.restartBtn.x, y: ch.restartBtn.y, w: ch.restartBtn.w, h: ch.restartBtn.h },
      ],
    };
  },
};

// ========== 提取当前章节详情 ==========

function extractChapterState(chapter) {
  if (!chapter) return null;

  const base = {
    chapterClass: chapter.constructor ? chapter.constructor.name : '?',
    phase: chapter.phase || '?',
    phaseTime: round(chapter.phaseTime),
    totalTime: round(chapter.totalTime !== undefined ? chapter.totalTime : chapter.time),
    isComplete: !!chapter.isComplete,
  };

  const extractor = chapterExtractors[base.chapterClass];
  if (extractor) {
    try {
      Object.assign(base, extractor(chapter));
    } catch (e) {
      base._extractError = e.message;
    }
  } else {
    base.interactiveZones = [];
  }

  return base;
}

// ========== 工厂函数 ==========

export function createDebugAPI(game) {
  const api = {
    // ---- 全局状态摘要 ----
    state() {
      const cm = game.chapterManager;
      const ch = cm && cm.currentChapter;
      const ov = game.overlay;
      return {
        timestamp: Date.now(),
        chapter: cm ? cm.currentName : null,
        chapterClass: ch ? ch.constructor.name : null,
        isComplete: ch ? !!ch.isComplete : false,
        cmPhase: cm ? cm.transition.phase : '?',
        cmAlpha: round(cm ? cm.transition.alpha : 0),
        cmPending: cm ? cm.pendingChapter : null,
        completeFired: cm ? !!cm._completeFired : false,
        overlay: ov ? {
          active: !!ov.active,
          title: ov.active ? ov.active.title : '',
          message: ov.active ? ov.active.message : '',
          buttons: ov.active ? (ov.active.buttons || []).map(b => ({
            text: b.text, bbox: b.bbox,
          })) : [],
          time: round(ov.active ? ov.active.time : 0),
        } : null,
        inputHandlers: game.input ? Object.keys(game.input.handlers) : [],
        canvas: { w: game.width, h: game.height },
        progress: game.progress ? game.progress.load() : null,
        images: Object.keys(game.images || {}),
        registeredChapters: cm ? cm.chapterOrder : [],
      };
    },

    // ---- 全量详情（含当前章节内部状态 + 交互热区）----
    inspect() {
      const st = api.state();
      const ch = game.chapterManager && game.chapterManager.currentChapter;
      return Object.assign(st, {
        chapterDetail: extractChapterState(ch),
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      });
    },

    // ---- 章节清单 ----
    chapters() {
      const cm = game.chapterManager;
      if (!cm) return [];
      return (cm.chapterOrder || []).map(id => ({
        id,
        isCurrent: cm.currentName === id,
        class: cm.registry.has(id) ? cm.registry.get(id).name : '?',
      }));
    },

    // ---- 用于 Playwright 截图验证的元数据 ----
    screenshotMeta() {
      const st = api.inspect();
      return {
        chapter: st.chapter,
        chapterClass: st.chapterClass,
        phase: st.chapterDetail ? st.chapterDetail.phase : '?',
        overlayActive: st.overlay ? st.overlay.active : false,
        interactiveZones: st.chapterDetail ? st.chapterDetail.interactiveZones || [] : [],
        progress: st.progress,
      };
    },

    // ---- 控制 ----
    switchTo(n) { if (game.chapterManager) game.chapterManager.switchTo(n); },
    next() { if (game.chapterManager) game.chapterManager.next(); },
    forceComplete() {
      const ch = game.chapterManager && game.chapterManager.currentChapter;
      if (ch) { ch._completed = true; ch._complete = true; }
    },
  };

  return api;
}
