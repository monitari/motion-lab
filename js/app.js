/* =========================================================
   Motion Lab — index / viewer
   ========================================================= */
(() => {
  'use strict';
  const { demos, categories } = Lab;
  const $ = (s, r = document) => r.querySelector(s);
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  Lab.injectStyles();
  const order = categories.map((c) => c.id);
  demos.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));
  demos.forEach((d, i) => (d.no = pad(i + 1, 3)));
  const catOf = (id) => categories.find((c) => c.id === id);
  const byId = (id) => demos.find((d) => d.id === id);
  const STARTERS = new Set(['liquid-lens', 'holo-rainbow', 'cloth', 'particle-text', 'lizard', 'flow-field']);
  const coarsePointer = matchMedia('(pointer: coarse)');

  document.querySelectorAll('[data-count]').forEach((n) => (n.textContent = demos.length));
  document.querySelectorAll('[data-cats]').forEach((n) => (n.textContent = categories.length));

  /* ---------- view transition helper ----------
     지원하면 View Transitions API로 전환하고, html[data-vt]로 어떤 전환인지 CSS에 알린다 */
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  function transition(kind, update) {
    if (!document.startViewTransition || RM.matches) { update(); return null; }
    const html = document.documentElement;
    html.dataset.vt = kind;
    const vt = document.startViewTransition(update);
    // 연달아 누르면 이전 전환이 건너뛰어지며 reject 되므로 조용히 삼킨다
    vt.ready.catch(() => {}); vt.updateCallbackDone.catch(() => {});
    vt.finished.finally(() => { if (html.dataset.vt === kind) delete html.dataset.vt; });
    return vt;
  }

  /* ---------- theme: 버튼 위치에서 원이 퍼지며 바뀐다 ---------- */
  $('#themeBtn').addEventListener('click', (e) => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const r = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty('--vt-x', r.left + r.width / 2 + 'px');
    document.documentElement.style.setProperty('--vt-y', r.top + r.height / 2 + 'px');
    transition('theme', () => { document.documentElement.dataset.theme = t; });
    try { localStorage.setItem('ml-theme', t); } catch (_) {}
  });

  /* ---------- 폰 기울기 (iOS는 권한 요청이 필요) ---------- */
  const tiltBtn = $('#tiltBtn');
  if (tiltBtn && Lab.tilt.needsPermission) {
    tiltBtn.hidden = false;
    tiltBtn.addEventListener('click', async () => {
      const ok = await Lab.tilt.enable();
      tiltBtn.textContent = ok ? 'Tilt on' : 'Tilt 거부됨';
      tiltBtn.classList.toggle('on', ok);
    });
  }

  /* ---------- sections & tiles ---------- */
  const root = $('#sections');
  const chips = $('#chips');
  const tiles = [];
  chips.insertAdjacentHTML('beforeend', `<button class="chip active" type="button" data-cat="all" aria-pressed="true">전체<sup>${demos.length}</sup></button><button class="chip" type="button" data-cat="featured" aria-pressed="false">처음이라면<sup>${STARTERS.size}</sup></button>`);
  categories.forEach((c, ci) => {
    const list = demos.filter((d) => d.cat === c.id);
    if (!list.length) return;
    chips.insertAdjacentHTML('beforeend', `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="false">${c.label}<sup>${list.length}</sup></button>`);
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.id = 'sec-' + c.id;
    sec.innerHTML = `<header class="sec-head"><span class="sec-no">${pad(ci + 1)}</span><h2>${c.label}</h2><p>${esc(Lab.catIntro[c.id] || '')}</p><span class="sec-count">${pad(list.length)}</span></header><div class="grid"></div>`;
    const grid = sec.querySelector('.grid');
    list.forEach((d) => {
      const t = document.createElement('article');
      t.className = 'tile' + (d.feature ? ' feature' : '');
      t.innerHTML = `
        <div class="tile-stage">
          <div class="tile-placeholder">${d.no}</div>
          <img class="tile-poster" src="thumbs/${d.id}.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()">
          <span class="tile-act">${esc(d.act || '')}</span>
          <button class="tile-open" type="button" aria-label="${esc(d.title)} 크게 보기">↗</button>
        </div>
        <div class="tile-cap" role="button" tabindex="0">
          <span class="tile-no">${d.no}</span><h3><span>${esc(d.title)}</span>${d.isNew ? '<em class="tile-new">New</em>' : ''}</h3><span class="tile-cat">${esc((d.tags || [])[0] || '')}</span>
        </div>
        <p class="tile-desc">${esc(d.desc)}</p>`;
      t._demo = d;
      t._search = [d.title, d.desc, ...(d.tags || []), c.label, d.id].join(' ').toLowerCase();
      const stage = t.querySelector('.tile-stage');
      t.querySelector('.tile-open').addEventListener('click', () => open(d, stage));
      const cap = t.querySelector('.tile-cap');
      cap.addEventListener('click', () => open(d, stage));
      cap.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(d, stage)));
      t.addEventListener('pointerenter', (e) => hoverMode && e.pointerType === 'mouse' && mountTile(t));
      t.addEventListener('pointerleave', () => hoverMode && unmountTile(t));
      stage.addEventListener('click', (e) => {
        if (coarsePointer.matches && hoverMode && !e.target.closest('.tile-open')) open(d, stage);
      });
      grid.appendChild(t);
      tiles.push(t);
    });
    root.appendChild(sec);
  });
  root.insertAdjacentHTML('beforeend', '<div class="empty" hidden><p>조건에 맞는 작품이 없어요.</p><p>검색어를 줄이거나 다른 분류를 골라보세요.</p><button class="cap-btn" id="emptyReset" type="button">전체 작품 보기 ↗</button></div>');
  const tileOf = (d) => tiles.find((t) => t._demo === d);

  /* ---------- live previews ---------- */
  const live = new Map();
  let paused = false;
  let hoverMode = RM.matches || coarsePointer.matches;
  try { const m = localStorage.getItem('ml-mode'); if (m) hoverMode = m === 'hover'; } catch (_) {}

  function mountTile(t) {
    if (live.has(t) || paused || t.hidden || document.hidden) return;
    const host = t.querySelector('.tile-stage');
    const inner = document.createElement('div');
    inner.className = 'stage-inner';
    host.insertBefore(inner, host.firstChild);
    live.set(t, { s: Lab.mount(t._demo, inner, false), inner });
    t.classList.add('is-live');
  }
  function unmountTile(t) {
    const m = live.get(t);
    if (!m) return;
    m.s.dispose();
    m.inner.remove();
    live.delete(t);
    t.classList.remove('is-live');
  }
  const io = new IntersectionObserver((entries) => {
    if (paused || hoverMode) return;
    for (const e of entries) e.isIntersecting ? mountTile(e.target) : unmountTile(e.target);
  }, { rootMargin: '60px 0px' });
  const observeAll = () => { io.disconnect(); tiles.forEach((t) => !t.hidden && io.observe(t)); };
  const unmountAll = () => [...live.keys()].forEach(unmountTile);

  const modeBtn = $('#mode');
  const syncMode = () => {
    modeBtn.innerHTML = `자동 재생 <b>${hoverMode ? '끔' : '켬'}</b>`;
    modeBtn.setAttribute('aria-pressed', String(!hoverMode));
    modeBtn.title = hoverMode ? '마우스를 올리거나 작품을 눌러 체험' : '화면에 보이는 작품 자동 재생';
    root.classList.toggle('manual-preview', hoverMode);
  };
  modeBtn.addEventListener('click', () => {
    hoverMode = !hoverMode;
    try { localStorage.setItem('ml-mode', hoverMode ? 'hover' : 'live'); } catch (_) {}
    syncMode();
    unmountAll();
    if (!hoverMode) observeAll();
  });
  syncMode();
  observeAll();

  /* ---------- hero figure ---------- */
  const FEATURED = ['liquid-lens', 'watercolor-bloom', 'unwoven-poster', 'chladni-plate', 'holo-rainbow', 'cloth', 'particle-text', 'glass-shatter', 'lizard', 'metaballs', 'flow-field', 'fluted-glass', 'dot-globe'].map(byId).filter(Boolean);
  const heroStage = $('#heroStage');
  let heroI = 0, heroScope = null, heroInner = null, heroVisible = true;
  // 동작 줄이기 설정이면 히어로는 정지 이미지로 두고, 누를 때만 재생
  let heroAllowed = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroPoster = document.createElement('img');
  heroPoster.className = 'tile-poster hero-poster'; heroPoster.alt = ''; heroPoster.onerror = () => (heroPoster.style.display = 'none');
  heroStage.appendChild(heroPoster);
  if (!heroAllowed) {
    heroStage.insertAdjacentHTML('beforeend', '<button class="hero-play" type="button">재생</button>');
    heroStage.querySelector('.hero-play').addEventListener('click', (e) => { heroAllowed = true; e.currentTarget.remove(); heroMount(); });
  }
  const heroUnmount = () => { heroStage.classList.remove('is-live'); if (heroScope) { heroScope.dispose(); heroInner.remove(); heroScope = heroInner = null; } };
  const heroMount = () => {
    heroUnmount();
    if (paused || !heroVisible || !heroAllowed || document.hidden) return;
    const d = FEATURED[heroI];
    heroInner = document.createElement('div');
    heroInner.className = 'stage-inner';
    heroStage.appendChild(heroInner);
    heroScope = Lab.mount(d, heroInner, true);
    heroStage.classList.add('is-live');
  };
  const heroSync = () => {
    const d = FEATURED[heroI];
    $('#heroNo').textContent = d.no;
    $('#heroTitle').textContent = d.title;
    $('#heroCtl').textContent = d.act;
    heroPoster.style.display = '';
    heroPoster.src = 'thumbs/' + d.id + '.webp';
  };
  heroSync();
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    if (heroVisible && !heroScope) heroMount();
    else if (!heroVisible) heroUnmount();
  }, { threshold: 0.05 }).observe(heroStage);
  $('#heroNext').addEventListener('click', () => {
    heroStage.style.viewTransitionName = 'hero';
    const vt = transition('hero', () => { heroI = (heroI + 1) % FEATURED.length; heroSync(); heroMount(); });
    const clear = () => (heroStage.style.viewTransitionName = '');
    vt ? vt.finished.finally(clear) : clear();
  });
  $('#heroOpen').addEventListener('click', () => open(FEATURED[heroI], heroStage));

  /* ---------- category + search: one consistent result set ---------- */
  const q = $('#q');
  let selectedCat = 'all';
  const matchesCategory = (d, cat) => cat === 'all' || (cat === 'featured' ? STARTERS.has(d.id) : d.cat === cat);
  function applyFilters() {
    const v = q.value.trim().toLowerCase();
    let total = 0;
    document.querySelectorAll('.sec').forEach((sec) => {
      let n = 0;
      sec.querySelectorAll('.tile').forEach((t) => {
        const hit = (!v || t._search.includes(v)) && matchesCategory(t._demo, selectedCat);
        t.hidden = !hit;
        if (hit) n++; else unmountTile(t);
      });
      sec.hidden = n === 0;
      sec.querySelector('.sec-count').textContent = pad(n);
      total += n;
    });
    chipEls.forEach((c) => {
      const count = tiles.filter((t) => (!v || t._search.includes(v)) && matchesCategory(t._demo, c.dataset.cat)).length;
      c.querySelector('sup').textContent = count;
    });
    $('.empty').hidden = total > 0;
    const label = selectedCat === 'all' ? '전체 작품' : selectedCat === 'featured' ? '처음 보면 좋은 작품' : catOf(selectedCat).label;
    $('#resultCount').textContent = `${label} · ${total}개${v ? ` · “${q.value.trim()}” 검색 결과` : ''}`;
    $('#clearFilters').hidden = selectedCat === 'all' && !v;
    $('#random').disabled = total === 0;
    setChip(selectedCat);
    observeAll();
  }
  q.addEventListener('input', applyFilters);

  /* ---------- active chip ---------- */
  const chipEls = [...chips.querySelectorAll('.chip')];
  // 활성 탭 아래 밑줄이 미끄러져 따라간다
  const chipInd = document.createElement('span');
  chipInd.className = 'chip-ind';
  chips.appendChild(chipInd);
  const moveInd = () => {
    const a = chips.querySelector('.chip.active');
    if (!a) return;
    chipInd.style.width = a.offsetWidth + 'px';
    chipInd.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const setChip = (id) => {
    chipEls.forEach((c) => {
      c.classList.toggle('active', c.dataset.cat === id);
      c.setAttribute('aria-pressed', String(c.dataset.cat === id));
    });
    moveInd();
  };
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    selectedCat = chip.dataset.cat;
    applyFilters();
    $('#index').scrollIntoView({ behavior: RM.matches ? 'instant' : 'smooth', block: 'start' });
  });
  function resetFilters() {
    selectedCat = 'all'; q.value = ''; applyFilters(); q.focus({ preventScroll: true });
  }
  $('#clearFilters').addEventListener('click', resetFilters);
  $('#emptyReset').addEventListener('click', resetFilters);
  applyFilters();
  addEventListener('resize', moveInd);
  document.fonts && document.fonts.ready.then(moveInd);
  requestAnimationFrame(moveInd);

  /* ---------- 스크롤하면 타일이 차례로 떠오른다 ---------- */
  if (!RM.matches) {
    const rev = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const sibs = [...e.target.parentElement.children].filter((n) => n.classList.contains('reveal') && !n.classList.contains('in'));
        e.target.style.setProperty('--d', Math.max(0, sibs.indexOf(e.target)) * 70 + 'ms');
        e.target.classList.add('in');
        rev.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.tile, .sec-head').forEach((n) => { n.classList.add('reveal'); rev.observe(n); });
  }

  /* ---------- source highlighting ---------- */
  const KW = new Set('const let var function return if else for while do new of in true false null undefined this break continue switch case default try catch typeof class extends float int bool void vec2 vec3 vec4 mat2 mat3 uniform precision highp mediump'.split(' '));
  const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d+\.?\d*(?:e[-+]?\d+)?\b|\.\d+\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;
  function highlight(code) {
    let out = '', last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(code))) {
      out += esc(code.slice(last, m.index));
      const [tok, com, str, num, fn, word] = m;
      if (com) out += `<span class="c">${esc(com)}</span>`;
      else if (str) out += `<span class="s">${esc(str)}</span>`;
      else if (num) out += `<span class="n">${num}</span>`;
      else if (fn) out += KW.has(fn) ? `<span class="k">${fn}</span>` : `<span class="f">${fn}</span>`;
      else if (word) out += KW.has(word) ? `<span class="k">${word}</span>` : word;
      else out += esc(tok);
      last = TOKEN.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function dedent(src) {
    const lines = src.split('\n');
    const ind = Math.min(...lines.slice(1).filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
    return [lines[0], ...lines.slice(1).map((l) => l.slice(Number.isFinite(ind) ? ind : 0))].join('\n');
  }
  function sourceOf(d) {
    if (d.source) {
      const lines = d.source.replace(/^\n+|\s+$/g, '').split('\n');
      const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
      return { label: 'fragment shader · GLSL', code: lines.map((l) => l.slice(ind)).join('\n') };
    }
    let code = `// ${d.id}\n` + dedent(d.mount.toString());
    if (d.css) code += '\n\n/* ---------- CSS ---------- */\n' + dedent('\n' + d.css.replace(/^\n/, '')).trim();
    return { label: 'mount() · JavaScript', code };
  }

  /* ---------- viewer ---------- */
  const viewer = $('#viewer');
  const vstage = $('#vstage');
  const srcPanel = $('#vsrcPanel');
  let cur = null, curScope = null, curInner = null, lastFocus = null, srcOpen = false;
  const historyOwner = `motion-lab-${Date.now()}-${Math.random()}`;
  const background = [...document.querySelectorAll('.mast, .intro, .filters, #sections, .colophon')];
  let listScroll = 0, historyClosing = false;

  function mountCurrent() {
    clearTimeout(restartTimer);
    if (!cur) return;
    if (curScope) { curScope.dispose(); curInner.remove(); }
    curInner = document.createElement('div');
    curInner.className = 'stage-inner';
    vstage.appendChild(curInner);
    curScope = Lab.mount(cur, curInner, true);
    buildTweak();
    syncSound();
  }

  /* ---------- feedback: toast / gesture hint / sound ---------- */
  const toastEl = $('#vtoast');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1400);
  }
  const hintEl = $('#vhint');
  const seenHint = new Set();
  const GESTURE = { Move: 'move', Hover: 'move', Shake: 'move', Drag: 'drag', Right: 'drag', Click: 'click', Switch: 'click', Dbl: 'click', Hold: 'hold', Type: 'type', Enter: 'type', Wheel: 'wheel' };
  let hintTimer = 0, hintArmed = 0;
  function showHint() {
    clearTimeout(hintTimer);
    hintEl.classList.remove('show');
    if (!cur || !cur.ctl || !cur.ctl.length || seenHint.has(cur.id)) return;
    seenHint.add(cur.id);
    const [k, v] = cur.ctl[0];
    $('#vhintIco').dataset.g = GESTURE[k.split(' ')[0]] || 'move';
    $('#vhintIco').innerHTML = '<i></i>';
    $('#vhintTxt').innerHTML = `<b>${esc(k)}</b> ${esc(v)}`;
    void hintEl.offsetWidth;
    hintEl.classList.add('show');
    hintArmed = performance.now() + 500;
    hintTimer = setTimeout(() => hintEl.classList.remove('show'), 3600);
  }
  const dismissHint = () => { if (performance.now() > hintArmed) hintEl.classList.remove('show'); };
  vstage.addEventListener('pointerdown', dismissHint);
  vstage.addEventListener('pointermove', dismissHint);
  // 터치는 누른 요소에 포인터가 묶이므로, 손가락으로 쓸 때 hover 데모가 반응하도록 묶음을 푼다
  vstage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  }, true);

  const soundBtn = $('#vsound');
  function syncSound() {
    soundBtn.hidden = !(cur && cur.sound);
    soundBtn.textContent = Lab.sound.on ? 'Sound On' : 'Sound Off';
    soundBtn.classList.toggle('on', Lab.sound.on);
  }
  function toggleSound() {
    if (!cur || !cur.sound) return;
    Lab.sound.on = !Lab.sound.on;
    try { localStorage.setItem('ml-sound', Lab.sound.on ? 'on' : 'off'); } catch (_) {}
    syncSound();
    toast(Lab.sound.on ? '소리 켬' : '소리 끔');
  }
  soundBtn.addEventListener('click', toggleSound);

  /* ---------- tweak panel ---------- */
  const tweakPanel = $('#vtweakPanel'), tweakRows = $('#vtweakRows'), tweakBtn = $('#vtweak');
  let tweakOpen = false, restartTimer = 0;
  const fmt = (v, step) => (step >= 1 ? String(Math.round(v)) : v.toFixed(Math.min(4, Math.max(1, -Math.floor(Math.log10(step))))));
  function buildTweak() {
    const pr = curScope && curScope._params;
    tweakBtn.disabled = !pr;
    tweakPanel.hidden = !(pr && tweakOpen);
    tweakBtn.classList.toggle('on', !!(pr && tweakOpen));
    tweakBtn.setAttribute('aria-expanded', String(!!(pr && tweakOpen)));
    if (!pr) { tweakRows.innerHTML = ''; return; }
    tweakRows.innerHTML = Object.entries(pr.spec).map(([k, [def, min, max, step, label, restart]]) =>
      `<div class="v-tw${restart ? ' restart' : ''}"><label for="tw-${k}">${esc(label || k)}</label><output id="two-${k}">${fmt(pr.values[k], step)}</output>
        <input id="tw-${k}" data-k="${k}" type="range" min="${min}" max="${max}" step="${step}" value="${pr.values[k]}"></div>`).join('');
  }
  tweakRows.addEventListener('input', (e) => {
    const k = e.target.dataset.k, pr = curScope && curScope._params;
    if (!k || !pr) return;
    const [, , , step, , restart] = pr.spec[k];
    const v = +e.target.value;
    pr.values[k] = pr.store[k] = v;
    $('#two-' + k).textContent = fmt(v, step);
    if (restart) { clearTimeout(restartTimer); restartTimer = setTimeout(() => { mountCurrent(); toast('다시 시작해서 적용했어요'); }, 250); }
  });
  const setTweak = (on) => { if (tweakBtn.disabled) return; tweakOpen = on; buildTweak(); };
  tweakBtn.addEventListener('click', () => setTweak(!tweakOpen));
  $('#vreset').addEventListener('click', () => {
    if (!cur) return;
    delete Lab.paramStore[cur.id];
    mountCurrent();
    toast('기본값으로 돌렸어요');
  });

  function fillSource() {
    if (!srcOpen || !cur) return;
    const { label, code } = sourceOf(cur);
    $('#vsrcLabel').textContent = label;
    $('#vcode').innerHTML = highlight(code);
    srcPanel.querySelector('pre').scrollTop = 0;
  }
  function setSource(on) {
    srcOpen = on;
    srcPanel.hidden = !on;
    $('#vsrc').classList.toggle('on', on);
    $('#vsrc').setAttribute('aria-expanded', String(on));
    fillSource();
  }

  function flip(fromEl, reverse) {
    if (RM.matches || !fromEl || !vstage.animate) return null;
    const a = fromEl.getBoundingClientRect(), b = vstage.getBoundingClientRect();
    if (!a.width || !b.width || a.bottom < 0 || a.top > innerHeight) return null;
    const from = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    const frames = [{ transform: from }, { transform: 'none' }];
    return vstage.animate(reverse ? frames.reverse() : frames, { duration: reverse ? 380 : 520, easing: 'cubic-bezier(.2,.8,.15,1)', fill: reverse ? 'forwards' : 'none' });
  }

  function open(d, fromEl, fromHash) {
    if (!d) return;
    historyClosing = false;
    const first = viewer.hidden;
    if (first) { lastFocus = document.activeElement; listScroll = scrollY; }
    paused = true;
    unmountAll();
    heroUnmount();
    cur = d;
    const c = catOf(d.cat);
    $('#vno').textContent = d.no + ' / ' + pad(demos.length, 3);
    $('#vcat').textContent = c.label;
    $('#vtitle').textContent = d.title;
    $('#vdesc').textContent = d.desc;
    $('#vctl').innerHTML = (d.ctl || []).map(([k, v]) => `<li><kbd>${esc(k)}</kbd>${esc(v)}</li>`).join('');
    viewer.hidden = false;
    background.forEach((el) => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    if (first) {
      viewer.classList.remove('in'); void viewer.offsetWidth; viewer.classList.add('in');
      flip(fromEl, false);
    }
    mountCurrent();
    fillSource();
    showHint();
    if (!fromHash) {
      if (first) history.pushState({ ...history.state, mlViewer: historyOwner }, '', '#/' + d.id);
      else history.replaceState(history.state, '', '#/' + d.id);
    }
    frames = 0; fpsT = performance.now(); fpsEl.textContent = '-- fps';
    if (first) $('#vclose').focus({ preventScroll: true });
  }
  function close(fromHistory = false) {
    if (viewer.hidden) return;
    if (!fromHistory && history.state && history.state.mlViewer === historyOwner) {
      if (historyClosing) return;
      historyClosing = true;
      history.back();
      return;
    }
    historyClosing = false;
    clearTimeout(restartTimer); clearTimeout(hintTimer); clearTimeout(toastTimer);
    hintEl.classList.remove('show'); toastEl.classList.remove('show');
    if (curScope) { curScope.dispose(); curInner.remove(); }
    curScope = curInner = cur = null;
    viewer.hidden = true;
    vstage.getAnimations && vstage.getAnimations().forEach((a) => a.cancel());
    background.forEach((el) => { el.inert = false; });
    document.body.style.overflow = '';
    if (!fromHistory) history.replaceState(history.state, '', location.pathname + location.search);
    paused = false;
    if (!hoverMode) observeAll();
    if (heroVisible) heroMount();
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    scrollTo({ top: listScroll, behavior: 'instant' });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  const visibleDemos = () => demos.filter((d) => !tileOf(d).hidden);
  // 이전/다음: 무대가 옆으로 밀려나고 새 데모가 들어온다
  const step = (k) => {
    const results = visibleDemos();
    const l = results.includes(cur) ? results : demos;
    const next = l[(l.indexOf(cur) + k + l.length) % l.length];
    const vt = transition(k > 0 ? 'next' : 'prev', () => open(next));
    if (!vt && curInner && curInner.animate && !RM.matches) {
      curInner.animate([{ opacity: 0, transform: `translateX(${k > 0 ? 40 : -40}px)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };

  $('#vclose').addEventListener('click', () => close());
  $('#random').addEventListener('click', () => { const l = visibleDemos(); open(l[(Math.random() * l.length) | 0]); });
  $('#vprev').addEventListener('click', () => step(-1));
  $('#vnext').addEventListener('click', () => step(1));
  const restart = () => { if (!cur) return; mountCurrent(); toast('다시 시작'); };
  $('#vrestart').addEventListener('click', restart);
  $('#vsrc').addEventListener('click', () => setSource(!srcOpen));
  $('#vfull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else viewer.requestFullscreen && viewer.requestFullscreen().catch(() => {});
  });
  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch (_) {
      // 로컬 파일이나 클립보드 권한이 없는 환경에서도 직접 복사할 수 있게 한다.
      window.prompt('복사할 내용을 선택한 뒤 Ctrl/Cmd+C를 눌러주세요.', text);
    }
  }
  $('#vcopy').addEventListener('click', () => { if (cur) copyText(sourceOf(cur).code, '코드를 복사했어요'); });
  $('#vshare').addEventListener('click', () => {
    if (!cur) return;
    const url = new URL(location.href);
    url.hash = '/' + cur.id;
    copyText(url.href, location.protocol === 'file:' ? '로컬 파일 주소를 복사했어요' : '작품 링크를 복사했어요');
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (viewer.hidden) {
      if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
      return;
    }
    const k = e.key.toLowerCase();
    // 뷰어 안에서만 Tab 포커스가 돈다
    if (k === 'tab') {
      const f = [...viewer.querySelectorAll('button:not([disabled]):not([hidden]), input, [tabindex="0"]')].filter((n) => n.offsetParent);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      return;
    }
    // 키보드를 직접 쓰는 데모에서는 Esc와 화살표만 뷰어가 가져간다
    if (cur && cur.captureKeys && !['escape', 'arrowleft', 'arrowright'].includes(k)) return;
    if (e.target.matches && e.target.matches('input[type=range]') && (k === 'arrowleft' || k === 'arrowright')) return;
    if (k === 'escape') close();
    else if (k === 'arrowleft') step(-1);
    else if (k === 'arrowright') step(1);
    else if (k === 'r') restart();
    else if (k === 's') { setSource(!srcOpen); toast(srcOpen ? '소스 열림' : '소스 닫힘'); }
    else if (k === 't') { if (tweakBtn.disabled) toast('이 데모는 조절할 값이 없어요'); else setTweak(!tweakOpen); }
    else if (k === 'm') { if (cur && cur.sound) toggleSound(); }
    else if (k === 'f') $('#vfull').click();
  });

  // fps
  const fpsEl = $('#vfps');
  let frames = 0, fpsT = performance.now();
  const fpsLoop = (now) => {
    requestAnimationFrame(fpsLoop);
    if (viewer.hidden) return;
    frames++;
    if (now - fpsT > 500) { fpsEl.textContent = Math.round((frames * 1000) / (now - fpsT)) + ' fps'; frames = 0; fpsT = now; }
  };
  requestAnimationFrame(fpsLoop);

  const fromHash = () => {
    const m = location.hash.match(/^#\/(.+)$/);
    const d = m && byId(m[1]);
    if (d) { if (viewer.hidden || cur !== d) open(d, null, true); }
    else if (!viewer.hidden) close(true);
  };
  window.addEventListener('popstate', fromHash);
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { unmountAll(); heroUnmount(); }
    else if (!paused) { if (!hoverMode) observeAll(); if (heroVisible) heroMount(); }
  });
  fromHash();

  window.LabApp = { open, close, tiles, live };
})();
