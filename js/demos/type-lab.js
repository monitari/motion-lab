/* =========================================================
   Type Lab — 글자를 재료로 쓴 두 번째 묶음
   Canvas 2D와 DOM만 사용. 외부 이미지나 폰트 파일 없음.
   ========================================================= */
(() => {
  const { U } = Lab;
  const SANS = '"Pretendard Variable", Pretendard, system-ui, sans-serif';
  const MONO = '"IBM Plex Mono", "Pretendard Variable", ui-monospace, monospace';
  const SERIF = '"Instrument Serif", "Pretendard Variable", serif';
  const graphemes = (v) => (typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(v)].map((g) => g.segment)
    : Array.from(v));
  const isWide = (ch) => /[ᄀ-ᇿ　-〿㄰-㆏가-힣一-鿿＀-￯]/.test(ch);

  /* =======================================================
     1. Text Reflow — 커서를 피해 다시 줄바꿈되는 문단
     ======================================================= */
  const PROSE = '움직임은 인터페이스의 문법입니다. 버튼이 눌리는 깊이, 카드가 넘어가는 속도, 글자가 자리를 찾아가는 시간까지 모두 말을 합니다. 이 문단은 커서를 피해 흐릅니다. 줄마다 비어 있는 구간을 다시 계산하고, 단어를 하나씩 채워 넣은 다음, 각 단어가 새 자리로 미끄러지게 했어요. Text becomes a fluid material once every word knows where it wants to go. 물이 돌을 만나면 갈라졌다가 다시 합쳐지듯, 문장도 장애물을 감싸고 이어집니다. 누르고 있으면 돌이 커지고, 놓으면 문단이 천천히 원래 모양으로 돌아옵니다.';
  Lab.register({
    id: 'text-reflow', cat: 'text', title: 'Text Reflow', feature: true,
    tags: ['line breaking', '줄바꿈', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ radius: [0.16, 0.06, 0.32, 0.01, '돌 크기'], ease: [14, 3, 24, 1, '단어가 따라오는 속도'] });
      const words = [PROSE, PROSE, PROSE, PROSE].join(' ').split(/\s+/);
      const st = words.map(() => ({ x: { x: 0, v: 0 }, y: 0, tx: 0, ty: 0, on: false, init: false, a: 1 }));
      let fs = 16, widths = [], space = 4;
      const measure = () => {
        fs = Math.max(11, Math.min(c.w, c.h) / (s.large ? 30 : 22));
        ctx.font = `500 ${fs}px ${SANS}`;
        widths = words.map((w) => ctx.measureText(w).width);
        space = ctx.measureText(' ').width;
      };
      measure();
      c.onresize = measure;
      const p = s.pointer(c.cv);
      const R = { x: 1, v: 0 }, O = { x: c.w / 2, y: c.h / 2 };
      // 두 번째 돌: 혼자 천천히 떠다닌다
      const orb2 = (t) => ({ x: c.w * (0.5 + 0.34 * Math.cos(t * 0.23)), y: c.h * (0.55 + 0.3 * Math.sin(t * 0.31)) });
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        const g = p.idle ? Lab.ghost(t * (s.large ? 0.35 : 0.18), W, H) : p;
        O.x += (g.x - O.x) * U.damp(9, dt); O.y += (g.y - O.y) * U.damp(9, dt);
        U.spring(R, p.down ? 1.6 : 1, dt, 160, 14);
        const r1 = m * P.radius * R.x * (s.large ? 1 : 0.8), o2 = orb2(t * (s.large ? 1 : 0.5)), r2 = m * P.radius * (s.large ? 0.55 : 0.4);
        const obs = [{ x: O.x, y: O.y, r: r1 }, { x: o2.x, y: o2.y, r: r2 }];
        // 줄마다 비어 있는 구간을 구해 단어를 채운다
        const lh = fs * 1.62, mx = W * 0.07, top = H * 0.08;
        let wi = 0;
        for (let y = top + lh / 2; y < H - lh * 0.4 && wi < words.length; y += lh) {
          let spans = [[mx, W - mx]];
          for (const o of obs) {
            const dy = Math.abs(y - o.y), pad = fs * 0.6;
            if (dy >= o.r + lh * 0.3) continue;
            const hw = Math.sqrt(Math.max(0, (o.r + lh * 0.3) ** 2 - dy * dy)) + pad;
            const next = [];
            for (const [a, b] of spans) {
              if (o.x - hw > a) next.push([a, Math.min(b, o.x - hw)]);
              if (o.x + hw < b) next.push([Math.max(a, o.x + hw), b]);
            }
            spans = next.filter(([a, b]) => b - a > fs * 1.5);
          }
          for (const [a, b] of spans) {
            let x = a;
            while (wi < words.length && x + widths[wi] <= b) {
              const q = st[wi];
              if (q.init && Math.abs(q.ty - y) > 1) { q.a = 0; q.x.x = x; q.x.v = 0; q.y = y; } // 줄이 바뀌면 새 자리에서 페이드인
              q.tx = x; q.ty = y; q.on = true;
              if (!q.init) { q.x.x = x; q.y = y; q.init = true; }
              x += widths[wi] + space; wi++;
            }
          }
        }
        for (let i = wi; i < words.length; i++) { st[i].on = false; st[i].ty = H + lh; }
        ctx.fillStyle = '#f2ede2'; ctx.fillRect(0, 0, W, H);
        // 돌
        obs.forEach((o, k) => {
          const gr = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.35, o.r * 0.1, o.x, o.y, o.r);
          gr.addColorStop(0, k ? '#c9d6ff' : '#ff8a5c'); gr.addColorStop(1, k ? '#7f91d9' : '#e2452b');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, U.TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(30,25,20,.12)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r + lh * 0.3 + fs * 0.6, 0, U.TAU); ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
        });
        ctx.font = `500 ${fs}px ${SANS}`; ctx.textBaseline = 'middle';
        const k = U.damp(P.ease, dt);
        st.forEach((q, i) => {
          if (!q.init) return;
          U.spring(q.x, q.tx, dt, P.ease * P.ease * 1.5, P.ease * 2.2);
          q.y += (q.ty - q.y) * k;
          q.a = Math.min(1, q.a + dt * 5);
          if (q.y > H + lh || !q.on) return;
          const d = Math.hypot(q.x.x + widths[i] / 2 - O.x, q.y - O.y) - r1;
          const near = U.clamp(1 - d / (fs * 4), 0, 1);
          ctx.fillStyle = near > 0 ? `rgb(${30 + near * 180},${28 + near * 40},${24 + near * 10})` : '#1e1c18';
          ctx.globalAlpha = q.a; ctx.fillText(words[i], q.x.x, q.y + (1 - q.a) * fs * 0.25); ctx.globalAlpha = 1;
        });
      });
    },
  });

  /* =======================================================
     2. Typewriter — 잉크가 고르지 않은 기계식 타자기
     ======================================================= */
  const POEM = '오늘의 문장은\n천천히 찍힌다.\nevery key leaves\na little dent.\n';
  Lab.register({
    id: 'typewriter', cat: 'text', title: 'Typewriter', captureKeys: true, sound: true,
    tags: ['keyboard', '타자기', 'WebAudio'],
    css: `
    .tw-in{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:3;width:min(70%,340px);min-height:44px;padding:8px 14px;border-radius:999px;
      border:1px solid #ffffff30;background:#00000055;color:#fff;font:500 15px ${SANS};text-align:center;outline:0}
    .tw-in:focus{border-color:#e9c46a}
    .tw-in::placeholder{color:#ffffff80}`,
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const COLS = 30;
      let fs = 18, cw = 11, lh = 26;
      const size = () => { fs = Math.max(11, Math.min(c.w / (COLS * 0.9), c.h / 15)); cw = fs * 0.6; lh = fs * 1.55; };
      size(); c.onresize = size;
      const glyphs = [];
      let col = 0, row = 0, lastUser = -1e9, bellRung = false;
      const CA = { x: 0, v: 0 }, RA = { x: 0, v: 0 }, HAM = { x: 0, v: 0 };
      const clack = () => s.large && Lab.burst({ dur: 0.045, freq: U.rand(1800, 2600), q: 2.5, gain: 0.35, curve: 6 });
      const bell = () => s.large && Lab.sfx((a, t) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = 2093;
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + 1.25);
      });
      const zip = () => s.large && Lab.burst({ dur: 0.35, freq: 900, q: 0.8, gain: 0.2, curve: 1.2 });
      const strike = (ch) => {
        const w = isWide(ch) ? 2 : 1;
        if (col + w > COLS) return;
        glyphs.push({ ch, c: col + (w - 1) / 2, r: row, rot: U.rand(-0.035, 0.035), dy: U.rand(-0.06, 0.06), ink: U.rand(0.7, 1), seed: Math.random() * 1000 });
        col += w; HAM.v += 26; clack();
        if (!bellRung && col >= COLS - 6) { bellRung = true; bell(); }
        if (glyphs.length > 900) glyphs.splice(0, 200);
      };
      const type = (str) => {
        for (const ch of graphemes(str)) {
          if (ch === '\n') { col = 0; row++; bellRung = false; zip(); }
          else if (ch === ' ') { if (col < COLS) col++; clack(); }
          else strike(ch);
        }
      };
      let inp = null;
      if (s.large) {
        inp = s.html('<input class="tw-in" type="text" placeholder="여기를 눌러 타이핑 (한글 가능)" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="enter" aria-label="타자기 입력">');
        let composing = false;
        s.on(inp, 'pointerdown', (e) => e.stopPropagation());
        s.on(inp, 'compositionstart', () => (composing = true));
        s.on(inp, 'compositionend', (e) => { composing = false; if (e.data) type(e.data); inp.value = ''; lastUser = performance.now(); });
        s.on(inp, 'input', (e) => {
          if (composing || e.isComposing) return;
          if (e.data) type(e.data);
          inp.value = ''; lastUser = performance.now();
        });
        s.on(window, 'keydown', (e) => {
          if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
          if (e.key === 'Enter') { type('\n'); lastUser = performance.now(); e.preventDefault(); return; }
          if (e.key === 'Backspace') { col = Math.max(0, col - 1); clack(); lastUser = performance.now(); return; }
          if (e.target === inp) return; // 입력창 글자는 input 이벤트가 처리
          if (e.key.length === 1) { type(e.key); lastUser = performance.now(); e.preventDefault(); }
        });
        if (matchMedia('(pointer: fine)').matches) s.timeout(() => inp.focus({ preventScroll: true }), 400);
      }
      // 종이 결
      const grain = Lab.offscreen(128, 128), gx = grain.getContext('2d');
      for (let i = 0; i < 2600; i++) { gx.fillStyle = i % 3 ? 'rgba(120,100,70,.08)' : 'rgba(255,255,255,.35)'; gx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
      const pat = ctx.createPattern(grain, 'repeat');
      let auto = 0, ai = 0;
      const p = s.pointer(c.cv);
      p.ondown = () => { if (inp) inp.focus({ preventScroll: true }); };
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        // 자동 타이핑 (아무도 안 칠 때)
        if (performance.now() - lastUser > 4000) {
          auto -= dt;
          if (auto < 0) {
            const ch = POEM[ai % POEM.length]; ai++;
            type(ch);
            auto = ch === '\n' ? 0.7 : U.rand(0.07, 0.16);
            if (row > 7 && ai % POEM.length === 0) { glyphs.length = 0; row = 0; col = 0; }
          }
        }
        U.spring(CA, col, dt, 220, 22); U.spring(RA, row, dt, 160, 20);
        U.spring(HAM, 0, dt, 900, 30);
        const sx = W / 2, sy = H * (s.large ? 0.55 : 0.6);
        ctx.fillStyle = '#2b2622'; ctx.fillRect(0, 0, W, H);
        // 종이
        const left = sx + (-CA.x - 1.5) * cw, right = sx + (COLS - CA.x + 1.5) * cw;
        const topY = sy + (-RA.x - 3) * lh;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24 * c.dpr; ctx.shadowOffsetY = 6 * c.dpr;
        ctx.fillStyle = '#f4ecda'; ctx.fillRect(left, topY, right - left, H - topY + 20);
        ctx.restore();
        ctx.fillStyle = pat; ctx.fillRect(left, topY, right - left, H - topY + 20);
        // 여백선
        ctx.strokeStyle = 'rgba(214,80,80,.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(left + cw, topY); ctx.lineTo(left + cw, H); ctx.stroke();
        // 글자
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.font = `500 ${fs}px ${MONO}`;
        for (const g of glyphs) {
          const x = sx + (g.c - CA.x + 0.5) * cw, y = sy + (g.r - RA.x) * lh;
          if (y < -lh || y > H + lh) continue;
          ctx.save(); ctx.translate(x, y + g.dy * fs); ctx.rotate(g.rot);
          ctx.globalAlpha = g.ink; ctx.fillStyle = '#1c1a26';
          ctx.fillText(g.ch, 0, 0);
          // 리본이 닳은 자국: 글자 위에 종이색 점 몇 개
          ctx.globalAlpha = 1; ctx.fillStyle = '#f4ecda';
          for (let k = 0; k < 3; k++) { const a = Math.sin(g.seed + k * 12.9) * 0.5, b = Math.cos(g.seed * 1.7 + k * 7.3) * 0.5; ctx.fillRect(a * fs * 0.6, -fs * 0.35 + b * fs * 0.6, fs * 0.07, fs * 0.07); }
          ctx.restore();
        }
        // 롤러와 본체
        ctx.fillStyle = '#16130f'; ctx.fillRect(0, sy + lh * 0.55, W, H);
        const rg = ctx.createLinearGradient(0, sy + lh * 0.4, 0, sy + lh * 1.4);
        rg.addColorStop(0, '#3a3530'); rg.addColorStop(0.5, '#0e0c0a'); rg.addColorStop(1, '#2a2622');
        ctx.fillStyle = rg; ctx.fillRect(0, sy + lh * 0.4, W, lh * 1.0);
        // 리본 가이드와 타자 막대
        const ham = U.clamp(HAM.x, 0, 1);
        ctx.fillStyle = '#c0392b'; ctx.fillRect(sx - cw * 0.9, sy - lh * 0.15 - ham * lh * 0.2, cw * 1.8, lh * 0.22);
        ctx.strokeStyle = '#9a948a'; ctx.lineWidth = Math.max(2, fs * 0.12);
        ctx.beginPath(); ctx.moveTo(sx, H); ctx.lineTo(sx, sy + lh * (1.4 - ham * 0.9)); ctx.stroke();
        // 남은 칸 표시
        ctx.fillStyle = col >= COLS - 6 ? '#e9c46a' : 'rgba(255,255,255,.35)';
        ctx.font = `500 ${Math.max(10, fs * 0.55)}px ${MONO}`; ctx.textAlign = 'left';
        ctx.fillText(`${String(col).padStart(2, '0')} / ${COLS}`, 14, H - (s.large ? 70 : 14));
      });
    },
  });

  /* =======================================================
     3. 한글 단어 시계 — 글자판에서 시간을 읽는다
     ======================================================= */
  const GRID = ['오전후열한다', '두세네여섯일', '곱여덟아홉시', '자정이삼사오', '십오분정각쯤'];
  const W_ = {
    오전: [[0, 0], [0, 1]], 오후: [[0, 0], [0, 2]], 시: [[2, 5]], 자정: [[3, 0], [3, 1]], 정오: [[3, 1], [3, 5]],
    십: [[4, 0]], 오분: [[4, 1]], 분: [[4, 2]], 정각: [[4, 3], [4, 4]], 쯤: [[4, 5]],
    t2: [[3, 2]], t3: [[3, 3]], t4: [[3, 4]], t5: [[3, 5]],
  };
  const HOUR = { 1: [[0, 4]], 2: [[1, 0]], 3: [[1, 1]], 4: [[1, 2]], 5: [[0, 5], [1, 4]], 6: [[1, 3], [1, 4]], 7: [[1, 5], [2, 0]], 8: [[2, 1], [2, 2]], 9: [[2, 3], [2, 4]], 10: [[0, 3]], 11: [[0, 3], [0, 4]], 12: [[0, 3], [1, 0]] };
  const HOUR_KO = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];
  const clockCells = (mins) => {
    mins = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h = Math.floor(mins / 60), m = mins % 60, m5 = Math.floor(m / 5) * 5, extra = m - m5;
    const cells = [];
    let phrase;
    if (m5 === 0 && h === 0) { cells.push(...W_.자정); phrase = '자정'; }
    else if (m5 === 0 && h === 12) { cells.push(...W_.정오); phrase = '정오'; }
    else {
      const h12 = h % 12 || 12;
      cells.push(...(h < 12 ? W_.오전 : W_.오후), ...HOUR[h12], ...W_.시);
      phrase = `${h < 12 ? '오전' : '오후'} ${HOUR_KO[h12]}시`;
      if (m5 === 0) { cells.push(...W_.정각); phrase += ' 정각'; }
      else {
        const tens = Math.floor(m5 / 10), ones = m5 % 10;
        if (tens >= 2) cells.push(...W_['t' + tens]);
        if (tens >= 1) cells.push(...W_.십);
        if (ones === 5) cells.push(...W_.오분);
        cells.push(...W_.분);
        phrase += ` ${['', '', '이', '삼', '사', '오'][tens]}${tens ? '십' : ''}${ones ? '오' : ''}분`;
      }
    }
    if (extra) { cells.push(...W_.쯤); phrase += '쯤'; }
    return { set: new Set(cells.map(([r, c]) => r * 6 + c)), extra, phrase, h, m };
  };
  Lab.register({
    id: 'word-clock', cat: 'text', title: '한글 단어 시계',
    tags: ['word clock', '한글', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const mode = s.modes(['지금', '빨리감기'], 0);
      const lit = new Float32Array(30);
      let offset = 0, vel = 0, drag = false, lx = 0, lastUser = -1e9;
      const now = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
      const p = s.pointer(c.cv);
      p.ondown = () => { drag = true; lx = p.x; vel = 0; lastUser = performance.now(); };
      p.onup = () => (drag = false);
      s.on(c.cv, 'dblclick', () => { offset = 0; vel = 0; mode.set(0); });
      let last = null, changeT = 0;
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        if (drag) { const d = p.x - lx; lx = p.x; offset += (d / W) * 240; vel = (d / W) * 240 / Math.max(dt, 1e-3); }
        else { offset += vel * dt; vel *= Math.exp(-3 * dt); }
        if (mode.i === 1 || (!s.large && performance.now() - lastUser > 3000)) offset += dt * (s.large ? 6 : 9);
        const info = clockCells(now() + offset);
        const key = [...info.set].join(',');
        if (key !== last) { last = key; changeT = 0; }
        changeT += dt;
        ctx.fillStyle = '#121014'; ctx.fillRect(0, 0, W, H);
        const cell = Math.min((W * 0.78) / 6, (H * (s.large ? 0.58 : 0.66)) / 5);
        const gw = cell * 6, gh = cell * 5, x0 = (W - gw) / 2, y0 = (H - gh) / 2 - cell * (s.large ? 0.7 : 0.25);
        // 패널
        ctx.fillStyle = '#1b181e'; ctx.fillRect(x0 - cell * 0.35, y0 - cell * 0.35, gw + cell * 0.7, gh + cell * 0.7);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `700 ${cell * 0.58}px ${SANS}`;
        for (let r = 0; r < 5; r++) for (let cc = 0; cc < 6; cc++) {
          const i = r * 6 + cc;
          // 바뀐 칸은 위에서 아래로 순서대로 켜지고 꺼진다
          const on = info.set.has(i) && changeT > (r * 6 + cc) * 0.018;
          lit[i] += ((on ? 1 : 0) - lit[i]) * U.damp(on ? 7 : 4, dt);
          const x = x0 + (cc + 0.5) * cell, y = y0 + (r + 0.5) * cell, v = lit[i];
          ctx.save(); ctx.translate(x, y); ctx.scale(1 + v * 0.04, 1 + v * 0.04);
          if (v > 0.02) { ctx.shadowColor = `rgba(255,214,140,${v * 0.9})`; ctx.shadowBlur = cell * 0.35 * v * c.dpr; }
          ctx.fillStyle = `rgba(${255},${235 - v * 20},${200 - v * 40},${0.09 + v * 0.91})`;
          ctx.fillText(GRID[r][cc], 0, 0);
          ctx.restore();
        }
        // 남은 분: 네 귀퉁이 점
        const corners = [[x0 - cell * 0.18, y0 - cell * 0.18], [x0 + gw + cell * 0.18, y0 - cell * 0.18], [x0 + gw + cell * 0.18, y0 + gh + cell * 0.18], [x0 - cell * 0.18, y0 + gh + cell * 0.18]];
        corners.forEach(([cx, cy], k) => { ctx.fillStyle = k < info.extra ? '#ffd68c' : 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, cell * 0.05), 0, U.TAU); ctx.fill(); });
        ctx.font = `500 ${Math.max(11, m * 0.03)}px ${SANS}`;
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fillText(info.phrase, W / 2, y0 + gh + cell * 0.85);
        ctx.font = `500 ${Math.max(10, m * 0.022)}px ${MONO}`; ctx.fillStyle = 'rgba(255,255,255,.3)';
        const hh = String(info.h).padStart(2, '0'), mm = String(info.m).padStart(2, '0');
        ctx.fillText(`${hh}:${mm}${Math.abs(offset) > 1 ? '  ·  드래그로 이동 중, 더블클릭하면 지금' : ''}`, W / 2, y0 + gh + cell * 1.3);
      });
    },
  });

  /* =======================================================
     4. Text Trail — 커서가 지나간 길 위에 문장이 눕는다
     ======================================================= */
  const LINES = ['follow the line, every letter remembers where you have been', '글자가 손끝을 따라 길을 만듭니다 · 멈추면 문장도 멈춰요', 'motion is a sentence written in time —'];
  Lab.register({
    id: 'text-trail', cat: 'text', title: 'Text Trail',
    tags: ['path', 'tangent', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      let li = 0, chars = [], widths = [], total = 0, fs = 30;
      const setup = () => {
        fs = Math.max(16, Math.min(c.w, c.h) * (s.large ? 0.06 : 0.075));
        ctx.font = `italic 400 ${fs}px ${SERIF}`;
        chars = graphemes(LINES[li]);
        widths = chars.map((ch) => ctx.measureText(ch).width);
        total = widths.reduce((a, b) => a + b, 0);
      };
      setup(); c.onresize = setup;
      const path = [];
      const p = s.pointer(c.cv);
      p.ondown = () => { li = (li + 1) % LINES.length; setup(); };
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        const g = p.idle ? { x: W / 2 + Math.cos(t * 1.1) * W * 0.32 * Math.cos(t * 0.37), y: H / 2 + Math.sin(t * 1.7) * H * 0.3 } : p;
        const last = path[path.length - 1];
        if (!last || Math.hypot(g.x - last.x, g.y - last.y) > 2) path.push({ x: g.x, y: g.y });
        // 문장 길이만큼만 길을 남긴다
        let len = 0;
        for (let i = path.length - 1; i > 0; i--) {
          len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
          if (len > total * 1.05) { path.splice(0, i - 1); break; }
        }
        ctx.fillStyle = 'rgba(14,12,22,.35)'; ctx.fillRect(0, 0, W, H);
        if (path.length < 2) return;
        ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
        ctx.beginPath(); path.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
        // 머리에서 거꾸로 걸으며 글자를 놓는다: 마지막 글자가 커서 바로 뒤
        ctx.font = `italic 400 ${fs}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let seg = path.length - 1, segPos = 0, walked = 0;
        const segLen = (k) => Math.hypot(path[k].x - path[k - 1].x, path[k].y - path[k - 1].y);
        for (let k = chars.length - 1; k >= 0; k--) {
          const want = walked + widths[k] / 2;
          // want만큼 뒤로 이동
          while (seg > 0 && segPos + segLen(seg) < want) { segPos += segLen(seg); seg--; }
          if (seg <= 0) break;
          const a = path[seg], b = path[seg - 1], sl = segLen(seg) || 1, f = (want - segPos) / sl;
          const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
          const ang = Math.atan2(a.y - b.y, a.x - b.x);
          const kk = k / Math.max(1, chars.length - 1);
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
          ctx.fillStyle = `hsl(${(kk * 120 + t * 20 + 20) % 360},85%,${62 + kk * 18}%)`;
          ctx.fillText(chars[k], 0, 0);
          ctx.restore();
          walked += widths[k];
        }
      });
    },
  });

  /* =======================================================
     5. Melting Type — 열을 받으면 아래로 녹아내린다
     ======================================================= */
  Lab.register({
    id: 'melting-type', cat: 'text', title: 'Melting Type',
    tags: ['drawImage slices', '녹는 글자', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ heat: [1, 0.2, 3, 0.05, '열'], cool: [0.35, 0.05, 1.5, 0.05, '굳는 속도'] });
      const words = ['MELT', '녹는다', 'WAX'];
      let wi = 0, off, top = 0, bot = 0, cols = 0, k = 2;
      let S, V, drops = [], pool;
      const build = () => {
        off = Lab.offscreen(c.cv.width, c.cv.height);
        const x = off.getContext('2d'); x.scale(c.dpr, c.dpr);
        const W = c.w, H = c.h;
        const fs = Math.min(H * 0.42, (W * 1.6) / Math.max(3, graphemes(words[wi]).length));
        x.font = `900 ${fs}px ${SANS}`; x.textAlign = 'center'; x.textBaseline = 'middle';
        const g = x.createLinearGradient(0, H * 0.3, 0, H * 0.6);
        g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#ff8a3d');
        x.fillStyle = g; x.fillText(words[wi], W / 2, H * 0.4);
        top = H * 0.4 - fs * 0.55; bot = H * 0.4 + fs * 0.5;
        k = s.large ? 2 : 3;
        cols = Math.ceil(W / k);
        S = new Float32Array(cols); V = new Float32Array(cols);
        pool = new Float32Array(cols);
      };
      build(); c.onresize = build;
      const p = s.pointer(c.cv);
      p.onup = () => {};
      s.on(c.cv, 'dblclick', () => { wi = (wi + 1) % words.length; build(); });
      const step = s.fixed(1 / 60, (h, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        const g = p.idle ? { x: W * (0.5 + 0.38 * Math.sin(t * 0.35)), y: H * 0.4 } : p;
        const R = m * (p.down ? 0.22 : p.idle ? 0.16 : 0.12);
        const maxS = H - bot - 4;
        for (let i = 0; i < cols; i++) {
          const x = i * k, d = Math.abs(x - g.x), vy = Math.abs(g.y - (top + bot) / 2);
          const heat = d < R && vy < (bot - top) ? (1 - d / R) * P.heat : 0;
          V[i] += heat * 900 * h;                       // 녹아서 흘러내리는 속도
          V[i] -= S[i] * P.cool * 0.5 * h * (heat ? 0 : 1); // 식으면 다시 오므라든다
          V[i] *= Math.exp(-1.6 * h);
          S[i] = U.clamp(S[i] + V[i] * h, 0, maxS);
          if (S[i] > maxS * 0.6 && heat && Math.random() < h * 3) drops.push({ x: x + U.rand(0, k), y: bot + S[i], vy: 0, r: U.rand(2, 4.5) });
        }
        // 옆 칸과 섞어 부드럽게
        for (let i = 1; i < cols - 1; i++) S[i] = S[i] * 0.8 + (S[i - 1] + S[i + 1]) * 0.1;
        for (let i = drops.length - 1; i >= 0; i--) {
          const q = drops[i]; q.vy += 900 * h; q.y += q.vy * h;
          if (q.y > H - pool[(q.x / k) | 0] - 2) { const ci = (q.x / k) | 0; for (let j = -3; j <= 3; j++) if (pool[ci + j] !== undefined) pool[ci + j] += q.r * 0.25 * (1 - Math.abs(j) / 4); drops.splice(i, 1); }
        }
        for (let i = 0; i < cols; i++) pool[i] = Math.max(0, pool[i] - h * 2);
      });
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        step(dt, t);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a1630'); bg.addColorStop(1, '#120a14');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // 위쪽 절반은 그대로, 아래쪽은 녹은 길이만큼 늘여 그린다
        const mid = top + (bot - top) * 0.45, d = c.dpr;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, off.width, Math.ceil((mid + 1) * d), 0, 0, W, Math.ceil(mid + 1));
        for (let i = 0; i < cols; i++) {
          const x = i * k, sh = bot - mid;
          ctx.drawImage(off, x * d, mid * d, k * d, (sh + 2) * d, x, mid, k, sh + S[i] + 2);
        }
        ctx.fillStyle = '#ff9a45';
        for (const q of drops) { ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * 0.8, q.r * (1 + Math.min(1, q.vy / 600)), 0, 0, U.TAU); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let i = 0; i < cols; i++) ctx.lineTo(i * k, H - pool[i]);
        ctx.lineTo(W, H); ctx.fill();
        // 열원
        if (!p.idle) {
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.min(W, H) * (p.down ? 0.2 : 0.11));
          gr.addColorStop(0, 'rgba(255,120,60,.35)'); gr.addColorStop(1, 'rgba(255,80,40,0)');
          ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        }
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = `500 ${Math.max(10, Math.min(W, H) * 0.024)}px ${MONO}`; ctx.textAlign = 'center';
        ctx.fillText('DOUBLE-CLICK: NEXT WORD', W / 2, H - 14);
      });
    },
  });

  /* =======================================================
     6. Ripple Paragraph — 실제 DOM 글자 위로 물결이 지나간다
     ======================================================= */
  const ESSAY = '좋은 움직임은 눈에 띄지 않습니다. 버튼을 누르면 눌린 만큼만 내려가고, 목록은 손가락을 따라오다 멈춰야 할 곳에서 멈춥니다. 이 문단의 글자들은 진짜 DOM 텍스트라서 그대로 선택하고 복사할 수 있어요. 아무 곳이나 누르면 그 지점에서 물결이 퍼지며 단어가 잠깐 굵어졌다가 돌아옵니다. Weight changes here never move the layout, because the bold is drawn with a text stroke instead of a heavier font. 그래서 물결이 지나가도 줄바꿈은 그대로입니다. 천천히 읽어도 되고, 계속 눌러도 됩니다.';
  Lab.register({
    id: 'ripple-paragraph', cat: 'text', title: 'Ripple Paragraph',
    tags: ['DOM text', 'text-stroke', 'click'],
    css: `
    .rp{position:absolute;inset:0;display:grid;place-items:center;background:#f3efe6;color:#24211d;overflow:hidden}
    .rp p{margin:0;width:min(84cqw,120cqh);font:400 max(13px,3.6cqmin)/1.75 'Roboto Flex','Pretendard Variable',Pretendard,sans-serif;word-break:keep-all;user-select:text;-webkit-user-select:text;cursor:text}
    .rp p span{display:inline-block;will-change:transform;-webkit-text-stroke:0 currentColor;paint-order:stroke fill}
    .rp-tag{position:absolute;left:4cqmin;bottom:3cqmin;font:500 max(10px,1.8cqmin) 'IBM Plex Mono',monospace;color:#8a857b}`,
    mount(el, s) {
      const root = s.html(`<div class="rp"><p>${ESSAY.split(/\s+/).map((w) => `<span>${w.replace(/</g, '&lt;')}</span>`).join(' ')}</p><div class="rp-tag">click anywhere · 텍스트는 선택 가능</div></div>`);
      const spans = [...root.querySelectorAll('p span')].map((n) => ({ n, x: 0, y: 0, a: 0 }));
      const measure = () => {
        const r = root.getBoundingClientRect();
        spans.forEach((q) => { const b = q.n.getBoundingClientRect(); q.x = b.left - r.left + b.width / 2; q.y = b.top - r.top + b.height / 2; });
      };
      s.resize(root, measure);
      document.fonts && document.fonts.ready.then(() => s.alive && measure());
      const waves = [];
      const p = s.pointer(root, { capture: false });
      p.ondown = () => waves.push({ x: p.x, y: p.y, t: 0 });
      let auto = 1;
      s.raf((dt) => {
        const W = root.clientWidth, H = root.clientHeight, m = Math.min(W, H);
        if (p.idle) { auto -= dt; if (auto < 0) { auto = 2.2; waves.push({ x: U.rand(W * 0.2, W * 0.8), y: U.rand(H * 0.25, H * 0.75), t: 0 }); } }
        waves.forEach((w) => (w.t += dt));
        while (waves.length && waves[0].t > 4) waves.shift();
        const speed = m * 0.9, width = m * 0.08;
        for (const q of spans) {
          let a = 0;
          for (const w of waves) {
            const d = Math.hypot(q.x - w.x, q.y - w.y), f = (d - speed * w.t) / width;
            a += Math.exp(-f * f) * Math.exp(-w.t * 0.9);
          }
          if (!p.idle) { const d = Math.hypot(q.x - p.x, q.y - p.y); a += Math.max(0, 1 - d / (m * 0.12)) * 0.5; }
          a = Math.min(1.2, a);
          if (Math.abs(a - q.a) < 0.004 && a < 0.01) { if (q.a !== 0) { q.a = 0; q.n.style.cssText = ''; } continue; }
          q.a = a;
          q.n.style.transform = `translateY(${(-a * 0.28).toFixed(3)}em)`;
          q.n.style.webkitTextStroke = `${(a * 0.045).toFixed(3)}em currentColor`;
          q.n.style.color = a > 0.12 ? `rgb(${36 + a * 190},${33 + a * 30},${29})` : '';
        }
      });
    },
  });
})();
