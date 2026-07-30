// 主菜单控制器
// 管理 DOM 主菜单与 Canvas 游戏之间的切换
// 构建时与 main_new.js 拼接，通过 window.bootGame 启动游戏

(function () {
  'use strict';

  // ---- 章节数据（硬编码以保持构建兼容性）----
  var CHAPTERS = [
    { order: 1, title: '序曲·镜前' },
    { order: 2, title: '接女儿放学' },
    { order: 3, title: '迷途' },
    { order: 4, title: '警局' },
    { order: 5, title: '归家迷途' },
    { order: 6, title: '餐桌上的博弈' },
    { order: 7, title: '惊悚夜醒' },
    { order: 8, title: '走廊的镜子' },
    { order: 9, title: '风铃' },
    { order: 10, title: '认出' },
  ];

  var STORAGE_KEY = 'ye_v1_progress';

  var el = {};

  function init() {
    cacheElements();
    bindEvents();
    updateContinueButton();
  }

  function cacheElements() {
    el.menu = document.getElementById('mainMenu');
    el.canvas = document.getElementById('gameCanvas');
    el.loading = document.getElementById('loading');

    el.btnStart = document.getElementById('BTN_START_MEMORY');
    el.btnContinue = document.getElementById('BTN_CONTINUE');
    el.btnChapters = document.getElementById('BTN_CHAPTERS');
    el.btnCapsule = document.getElementById('BTN_CAPSULE');
    el.btnSettings = document.getElementById('BTN_SETTINGS');
  }

  function getProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function updateContinueButton() {
    var progress = getProgress();
    var hasProgress = progress && progress.chapter && progress.chapter > 0;
    el.btnContinue.disabled = !hasProgress;
    el.btnContinue.style.opacity = hasProgress ? '1' : '0.3';
    el.btnContinue.style.cursor = hasProgress ? 'pointer' : 'not-allowed';
  }

  function bindEvents() {
    el.btnStart.addEventListener('click', function () {
      startGame('ch01');
    });

    el.btnContinue.addEventListener('click', function () {
      var progress = getProgress();
      if (!progress || !progress.chapter) return;
      var resumeNum = Math.min(progress.chapter + 1, 10);
      var ch = 'ch' + String(resumeNum).padStart(2, '0');
      startGame(ch);
    });

    el.btnChapters.addEventListener('click', showChapterSelect);
    el.btnCapsule.addEventListener('click', showTimeCapsule);
    el.btnSettings.addEventListener('click', showSettings);
  }

  function startGame(chapterKey) {
    // 隐藏主菜单
    el.menu.style.display = 'none';
    // 显示 loading
    el.loading.style.display = 'flex';

    // 确保 canvas 可见
    el.canvas.style.display = 'block';

    // 调用游戏启动函数
    if (typeof window.bootGame === 'function') {
      window.bootGame(chapterKey);
    } else {
      // bootGame 尚未就绪时等待
      var timer = setInterval(function () {
        if (typeof window.bootGame === 'function') {
          clearInterval(timer);
          window.bootGame(chapterKey);
        }
      }, 50);
    }
  }

  // ============================================================
  //  章节选择弹层
  // ============================================================
  function showChapterSelect() {
    var overlay = createOverlay('章节选择');
    var progress = getProgress();
    var list = document.createElement('div');
    list.style.cssText =
      'display:grid;gap:8px;padding:4px 0;max-height:50vh;overflow-y:auto;';

    CHAPTERS.forEach(function (ch) {
      var isUnlocked = ch.order === 1 ||
        (progress && progress.completed && progress.completed.indexOf(ch.order) !== -1);
      var item = document.createElement('div');
      item.style.cssText =
        'display:flex;align-items:center;padding:10px 14px;border-radius:6px;' +
        'transition:background 0.15s;' +
        (isUnlocked
          ? 'background:rgba(212,184,150,0.06);color:#f4ddb0;cursor:pointer;'
          : 'background:transparent;color:#5a4a38;');

      var num = document.createElement('span');
      num.textContent = '第' + ch.order + '章';
      num.style.cssText = 'font-size:12px;opacity:0.6;margin-right:14px;min-width:44px;';

      var title = document.createElement('span');
      title.textContent = ch.title;
      title.style.cssText = 'flex:1;font-size:16px;letter-spacing:0.04em;';

      item.appendChild(num);
      item.appendChild(title);

      if (isUnlocked) {
        item.addEventListener('mouseenter', function () {
          this.style.background = 'rgba(212,184,150,0.12)';
        });
        item.addEventListener('mouseleave', function () {
          this.style.background = 'rgba(212,184,150,0.06)';
        });
        item.addEventListener('click', function () {
          closeOverlay(overlay);
          var chKey = 'ch' + String(ch.order).padStart(2, '0');
          startGame(chKey);
        });
      } else {
        var lock = document.createElement('span');
        lock.textContent = '\u{1F512}';
        lock.style.fontSize = '14px';
        item.appendChild(lock);
      }

      list.appendChild(item);
    });

    overlay.content.appendChild(list);
  }

  // ============================================================
  //  设置弹层
  // ============================================================
  function showSettings() {
    var overlay = createOverlay('设置');

    var fields = [
      { label: '环境音效', on: true },
      { label: '触感反馈', on: true },
    ];

    fields.forEach(function (f) {
      var line = document.createElement('div');
      line.style.cssText =
        'display:flex;justify-content:space-between;align-items:center;' +
        'padding:12px 0;border-bottom:1px solid rgba(212,184,150,0.12);';

      var label = document.createElement('span');
      label.textContent = f.label;

      var toggle = document.createElement('span');
      toggle.textContent = f.on ? '开启' : '关闭';
      toggle.style.cssText = 'cursor:pointer;font-weight:bold;padding:2px 8px;';
      toggle.addEventListener('click', function () {
        this.textContent = this.textContent === '开启' ? '关闭' : '开启';
      });

      line.appendChild(label);
      line.appendChild(toggle);
      overlay.content.appendChild(line);
    });

    addCloseButton(overlay);
  }

  // ============================================================
  //  记忆档案（章节报告 + 医学知识页）
  // ============================================================
  var currentMedicalPage = 1;

  function showTimeCapsule() {
    var progress = getProgress();
    var completed = progress && progress.completed ? progress.completed : [];
    var view = 'memory';

    var overlay = createOverlay('记忆档案', true);

    // 档案和医学说明使用同一套纸页、解锁与翻页交互，避免把素材藏在不可达的独立页面。
    var tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:8px;margin:0 0 14px;';
    var memoryTab = document.createElement('button');
    var medicalTab = document.createElement('button');
    memoryTab.textContent = '记忆档案';
    medicalTab.textContent = '医学档案';
    memoryTab.style.cssText = BTN_NAV_STYLE;
    medicalTab.style.cssText = BTN_NAV_STYLE;
    tabBar.appendChild(memoryTab);
    tabBar.appendChild(medicalTab);

    // 导航栏
    var navBar = document.createElement('div');
    navBar.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;';

    var prevBtn = document.createElement('button');
    prevBtn.textContent = '〈 上一章';
    prevBtn.style.cssText = BTN_NAV_STYLE;

    var pageTitle = document.createElement('span');
    pageTitle.style.cssText = 'font-size:15px;color:#f4ddb0;letter-spacing:0.05em;';

    var nextBtn = document.createElement('button');
    nextBtn.textContent = '下一章 〉';
    nextBtn.style.cssText = BTN_NAV_STYLE;

    navBar.appendChild(prevBtn);
    navBar.appendChild(pageTitle);
    navBar.appendChild(nextBtn);

    // 图片容器
    var imgWrap = document.createElement('div');
    imgWrap.style.cssText =
      'position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;' +
      'border-radius:6px;background:#1d1009;display:flex;align-items:center;justify-content:center;';

    var img = document.createElement('img');
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
    img.alt = '医学知识';

    var lockOverlay = document.createElement('div');
    lockOverlay.style.cssText =
      'position:absolute;inset:0;display:none;flex-direction:column;align-items:center;' +
      'justify-content:center;background:rgba(13,8,5,0.88);color:#6a5a48;' +
      'font-size:16px;letter-spacing:0.08em;gap:10px;';

    var lockIcon = document.createElement('span');
    lockIcon.textContent = '🔒';
    lockIcon.style.fontSize = '32px';
    var lockText = document.createElement('span');
    lockText.textContent = '通关后解锁';

    lockOverlay.appendChild(lockIcon);
    lockOverlay.appendChild(lockText);
    imgWrap.appendChild(img);
    imgWrap.appendChild(lockOverlay);

    // 底部指示点
    var dotsBar = document.createElement('div');
    dotsBar.style.cssText =
      'display:flex;justify-content:center;gap:8px;margin:14px 0 10px;';

    var dots = [];
    CHAPTERS.forEach(function (ch) {
      var unlocked = ch.order === 1 || completed.indexOf(ch.order) !== -1;
      var dot = document.createElement('span');
      dot.style.cssText =
        'width:10px;height:10px;border-radius:50%;cursor:' + (unlocked ? 'pointer' : 'default') + ';' +
        'transition:transform 0.2s,background 0.2s;' +
        (unlocked ? 'background:#d4b896;' : 'background:#3a2a1c;');
      dots.push({ el: dot, order: ch.order, unlocked: unlocked });
      dotsBar.appendChild(dot);
    });

    // 描述文字
    var descEl = document.createElement('p');
    descEl.style.cssText = 'text-align:center;font-size:13px;color:#8a7a68;margin:0 0 6px;';

    overlay.content.appendChild(tabBar);
    overlay.content.appendChild(navBar);
    overlay.content.appendChild(imgWrap);
    overlay.content.appendChild(descEl);
    overlay.content.appendChild(dotsBar);
    addCloseButton(overlay, '返回主菜单');

    // ---- 渲染函数 ----
    function renderPage(idx) {
      currentMedicalPage = Math.max(1, Math.min(idx, CHAPTERS.length));
      var ch = CHAPTERS[currentMedicalPage - 1];
      var unlocked = ch.order === 1 || completed.indexOf(ch.order) !== -1;

      pageTitle.textContent = '第' + ch.order + '章 · ' + ch.title;

      if (unlocked) {
        var chStr = String(ch.order).padStart(2, '0');
        img.src = view === 'memory'
          ? 'assets/images/report/ch' + chStr + '.jpg'
          : 'assets/pictures/medical/medical_ch' + chStr + '.jpg';
        img.style.display = 'block';
        lockOverlay.style.display = 'none';
        descEl.textContent = view === 'memory'
          ? '第 ' + ch.order + ' 章 · 记忆恢复档案'
          : '第 ' + ch.order + ' 章 · 阿尔茨海默症关怀档案';
      } else {
        img.style.display = 'none';
        lockOverlay.style.display = 'flex';
        descEl.textContent = '通关第 ' + ch.order + ' 章后解锁';
      }

      prevBtn.style.display = currentMedicalPage <= 1 ? 'none' : '';
      nextBtn.style.display = currentMedicalPage >= CHAPTERS.length ? 'none' : '';

      dots.forEach(function (d) {
        var active = d.order === currentMedicalPage;
        d.el.style.background = active
          ? '#f4ddb0'
          : d.unlocked
            ? '#d4b896'
            : '#3a2a1c';
        d.el.style.transform = active ? 'scale(1.4)' : 'scale(1)';
      });
      memoryTab.style.background = view === 'memory' ? 'rgba(212,184,150,0.16)' : 'transparent';
      medicalTab.style.background = view === 'medical' ? 'rgba(212,184,150,0.16)' : 'transparent';
    }

    prevBtn.addEventListener('click', function () { renderPage(currentMedicalPage - 1); });
    nextBtn.addEventListener('click', function () { renderPage(currentMedicalPage + 1); });
    dots.forEach(function (d) {
      d.el.addEventListener('click', function () {
        if (d.unlocked || d.order === 1) renderPage(d.order);
      });
    });
    memoryTab.addEventListener('click', function () { view = 'memory'; renderPage(currentMedicalPage); });
    medicalTab.addEventListener('click', function () { view = 'medical'; renderPage(currentMedicalPage); });

    renderPage(currentMedicalPage);
  }

  // ============================================================
  //  通用弹层工具
  // ============================================================
  var BTN_NAV_STYLE =
    'padding:6px 14px;border:1px solid rgba(212,184,150,0.25);border-radius:4px;' +
    'color:#d4b896;background:transparent;cursor:pointer;font:inherit;font-size:13px;';

  function createOverlay(title, wide) {
    var old = document.getElementById('menuOverlay');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var overlay = document.createElement('div');
    overlay.id = 'menuOverlay';
    overlay.style.cssText =
      'position:fixed;z-index:300;inset:0;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(13,8,5,0.75);' +
      'animation:menuFadeIn 0.2s ease;';

    var sheet = document.createElement('div');
    var sheetW = wide ? 'min(560px,88vw)' : 'min(420px,85vw)';
    sheet.style.cssText =
      'width:' + sheetW + ';max-height:85vh;overflow-y:auto;padding:28px 30px;' +
      'background:#2a180e;border:1px solid rgba(212,184,150,0.12);border-radius:12px;' +
      'color:#d4b896;font-family:inherit;box-shadow:0 20px 60px rgba(0,0,0,0.5);';

    var header = document.createElement('div');
    header.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;' +
      'padding-bottom:10px;border-bottom:1px solid rgba(212,184,150,0.12);';

    var h2 = document.createElement('h2');
    h2.textContent = title;
    h2.style.cssText = 'margin:0;font-size:20px;letter-spacing:0.08em;color:#f4ddb0;';

    var closeX = document.createElement('span');
    closeX.textContent = '✕';
    closeX.style.cssText = 'cursor:pointer;font-size:18px;opacity:0.5;padding:4px 8px;';
    closeX.addEventListener('click', function () { closeOverlay(overlay); });

    header.appendChild(h2);
    header.appendChild(closeX);
    sheet.appendChild(header);

    var content = document.createElement('div');
    content.style.cssText = 'padding:2px 0;';
    sheet.appendChild(content);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    // 点击外部关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay(overlay);
    });

    overlay.content = content;
    return overlay;
  }

  function addCloseButton(overlay, label) {
    label = label || '收回';
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'display:block;margin:16px auto 0;padding:8px 24px;' +
      'border:1px solid rgba(212,184,150,0.25);border-radius:4px;' +
      'color:#d4b896;background:transparent;cursor:pointer;font:inherit;font-size:13px;';
    btn.addEventListener('click', function () { closeOverlay(overlay); });
    overlay.content.appendChild(btn);
  }

  function closeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  // ---- 启动 ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
