/* =========================================================
   추가분 D — 부스터 팩, 키 셰이프, 털, 풀밭, 빛과 그림자
   ========================================================= */
(() => {
  const { U } = Lab;
  const SANS = '"Pretendard Variable", Pretendard, system-ui, sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  /** 짧은 음 하나. type: sine | triangle | square | sawtooth */
  const tone = (freq, { type = 'sine', dur = 0.4, gain = 0.2, glide = 0, at = 0, cutoff = 0 } = {}) => Lab.sfx((a, t0) => {
    const t = t0 + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o.connect(g);
    if (cutoff) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; g.connect(f); node = f; }
    node.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  });

  /* =======================================================
     1. Booster Pack — 찢어서 여는 카드 팩
     ======================================================= */
  Lab.register({
    id: 'booster-pack', cat: 'cards', title: 'Booster Pack', feature: true, sound: true,
    tags: ['tear', 'reveal', 'drag'],
    css: `
    .bp{position:absolute;inset:0;overflow:hidden;perspective:1300px;user-select:none;touch-action:none;
      background:radial-gradient(ellipse 80% 70% at 50% 38%,#3d2a66,#191230 62%,#0c0916)}
    .bp-floor{position:absolute;left:0;right:0;bottom:0;height:22%;background:linear-gradient(#0000,#0008)}
    .bp-pack{--ph:76cqmin;--px:50%;--py:50%;--bx:50%;position:absolute;left:0;top:0;width:calc(var(--ph)*.62);height:var(--ph);transform-style:preserve-3d;z-index:30;cursor:pointer;will-change:transform}
    .bp-top,.bp-body{position:absolute;left:0;right:0;overflow:hidden;
      background:linear-gradient(145deg,#2a1f63,#5a3fd0 38%,#2c1f6e 62%,#16113a);box-shadow:inset 0 0 0 1px #ffffff30}
    .bp-top{top:0;height:15%;border-radius:calc(var(--ph)*.03) calc(var(--ph)*.03) 0 0;transform-origin:100% 100%;cursor:ew-resize;will-change:transform}
    .bp-body{top:15%;bottom:0;border-radius:0 0 calc(var(--ph)*.03) calc(var(--ph)*.03);box-shadow:inset 0 0 0 1px #ffffff30,0 calc(var(--ph)*.05) calc(var(--ph)*.08) -.02em #000c}
    .bp-crimp{position:absolute;left:0;right:0;height:calc(var(--ph)*.035);background:repeating-linear-gradient(90deg,#ffffff38 0 2px,#00000030 2px 5px);opacity:.8}
    .bp-top .bp-crimp{top:0}.bp-body .bp-crimp{bottom:0}
    .bp-tear{position:absolute;left:4%;right:4%;bottom:0;border-bottom:2px dashed #ffffffa0}
    .bp-tear i{position:absolute;left:0;bottom:-2px;height:4px;width:var(--tp,0%);background:#fff;box-shadow:0 0 8px #fff}
    .bp-hint{position:absolute;left:0;right:0;bottom:22%;text-align:center;font:600 calc(var(--ph)*.022) ${MONO};letter-spacing:.14em;color:#ffffffd0}
    .bp-art{position:absolute;inset:6% 6% 30%;border-radius:calc(var(--ph)*.02);overflow:hidden;background:radial-gradient(circle at 50% 55%,#ffe36b,#ff7a3d 35%,#7a1f5c 70%,#2a0f3a);box-shadow:inset 0 0 0 1px #ffffff40}
    .bp-art svg{position:absolute;inset:0;width:100%;height:100%}
    .bp-logo{position:absolute;left:0;right:0;bottom:15%;text-align:center;color:#fff;font:900 calc(var(--ph)*.075)/1 ${SANS};letter-spacing:-.03em;text-shadow:0 .04em 0 #1a0f3a,0 .08em .2em #0008}
    .bp-logo b{color:#ffe36b}
    .bp-sub{position:absolute;left:0;right:0;bottom:9%;text-align:center;color:#ffffffb0;font:600 calc(var(--ph)*.022) ${MONO};letter-spacing:.18em}
    .bp-shine{position:absolute;inset:0;pointer-events:none;mix-blend-mode:color-dodge;opacity:.55;
      background:repeating-linear-gradient(115deg,hsl(0 90% 60%) 0%,hsl(60 90% 60%) 4%,hsl(140 90% 55%) 8%,hsl(200 90% 60%) 12%,hsl(280 90% 62%) 16%,hsl(360 90% 60%) 20%),
        radial-gradient(farthest-corner circle at var(--px) var(--py),#fff8 0,#0000 45%);
      background-size:300% 300%,100% 100%;background-position:var(--bx) var(--bx),center;background-blend-mode:overlay}
    .bp-card{position:absolute;left:0;top:0;z-index:40;will-change:transform;opacity:0}
    .bp-card .hc{--ch:54cqmin;cursor:grab}
    .bp-card.rare .hc-side{box-shadow:0 0 0 2px #ffe36b,0 0 6cqmin 1cqmin #ffcf3faa}
    .bp-again{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);z-index:70;border:0;cursor:pointer;padding:1.6cqmin 3.4cqmin;border-radius:999px;
      font:700 max(13px,2.6cqmin) ${SANS};color:#1a0f3a;background:#ffe36b;box-shadow:0 1cqmin 3cqmin -1cqmin #000a;opacity:0;pointer-events:none;transition:opacity .4s}
    .bp-again.show{opacity:1;pointer-events:auto}
    .bp-count{position:absolute;right:4cqmin;top:4cqmin;z-index:70;font:600 max(11px,2.2cqmin) ${MONO};color:#ffffffa0;letter-spacing:.1em}
    .bp canvas{z-index:60;pointer-events:none}`,
    mount(el, s) {
      const art = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><g fill="#fff" opacity=".22">${Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * U.TAU, b = a + 0.17; return `<path d="M50 55 L${50 + Math.cos(a) * 90} ${55 + Math.sin(a) * 90} L${50 + Math.cos(b) * 90} ${55 + Math.sin(b) * 90}Z"/>`; }).join('')}</g>
        <path d="M50 22 L58 45 L82 45 L63 59 L70 82 L50 68 L30 82 L37 59 L18 45 L42 45Z" fill="#fff6c8" stroke="#3a1c71" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="50" cy="55" r="9" fill="#ff5f8f"/></svg>`;
      const root = s.html(`<div class="bp"><div class="bp-floor"></div>
        <div class="bp-pack">
          <div class="bp-top"><div class="bp-crimp"></div><div class="bp-tear"><i></i></div><div class="bp-shine"></div></div>
          <div class="bp-body"><div class="bp-art">${art}</div><div class="bp-logo">MOTION <b>LAB</b></div><div class="bp-sub">BOOSTER · 5 CARDS</div><div class="bp-hint">← 위 띠를 옆으로 찢기 →</div><div class="bp-crimp"></div><div class="bp-shine"></div></div>
        </div>
        <div class="bp-cards"></div><button class="bp-again" type="button">새 팩 열기</button><div class="bp-count"></div></div>`);
      const pack = root.querySelector('.bp-pack'), top = root.querySelector('.bp-top'), body = root.querySelector('.bp-body');
      const tearBar = root.querySelector('.bp-tear'), again = root.querySelector('.bp-again'), counter = root.querySelector('.bp-count');
      const fx = s.canvas({ parent: root }); const fctx = fx.ctx;
      const sparks = [];
      const burstAt = (x, y, n, hues, speed = 1) => {
        const m = Math.min(fx.w, fx.h);
        for (let i = 0; i < n; i++) { const a = U.rand(U.TAU), v = m * U.rand(0.3, 1.1) * speed; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: U.rand(0.6, 1.3), h: U.pick(hues), r: U.rand(1.5, 3.5) }); }
      };

      let st, cards, cur, tear, packY, topFly, lastUser = -1e9, autoT = 0, opened = 0, revealedRare = false;
      const P = { rx: { x: 0, v: 0 }, ry: { x: 0, v: 0 }, y: { x: 0, v: 0 }, s: { x: 1, v: 0 } };
      const deck = () => {
        const pool = ['rainbow', 'cosmos', 'rainbow', 'cosmos', 'prism'];
        const v = Array.from({ length: 4 }, () => U.pick(pool));
        v.push(Math.random() < 0.55 ? 'gold' : 'prism');
        return v;
      };
      const reset = () => {
        st = 'sealed'; cur = 0; tear = 0; packY = { x: 1, v: 0 }; topFly = null; revealedRare = false;
        const wrap = root.querySelector('.bp-cards');
        wrap.innerHTML = deck().map((v, i) => `<div class="bp-card${i === 4 ? ' rare' : ''}">${Lab.holo.cardHTML(v)}</div>`).join('');
        cards = [...wrap.children].map((n) => ({ n, card: n.firstElementChild, x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, r: { x: 0, v: 0 }, sc: { x: 0.85, v: 0 }, o: 0, place: 'pack', drag: null }));
        top.style.transform = ''; top.style.opacity = 1; pack.style.opacity = 1;
        again.classList.remove('show');
        counter.textContent = `PACK ${String(++opened).padStart(2, '0')}`;
      };
      reset();
      s.on(again, 'click', (e) => { e.stopPropagation(); lastUser = performance.now(); reset(); });
      s.on(again, 'pointerdown', (e) => e.stopPropagation());

      const sfxTear = (k) => s.large && Lab.burst({ dur: 0.035, freq: 1800 + k * 3200, q: 3, gain: 0.25, curve: 3 });
      const open = () => {
        st = 'opening'; topFly = { t: 0 };
        const r = top.getBoundingClientRect(), rr = root.getBoundingClientRect();
        burstAt(r.left - rr.left + r.width / 2, r.bottom - rr.top, 40, [45, 330, 200], 0.7);
        if (s.large) { Lab.burst({ dur: 0.5, freq: 900, q: 0.5, gain: 0.35, curve: 1.6 }); }
        cards.forEach((c, i) => s.timeout(() => (c.place = 'stack'), 350 + i * 110));
        s.timeout(() => (st = 'reveal'), 350 + 5 * 110);
      };
      const fling = (dir) => {
        const c = cards[cur]; if (!c) return;
        c.place = 'kept'; c.r.v += dir * 900; c.drag = null;
        if (s.large) Lab.burst({ dur: 0.16, freq: 1300, q: 1, gain: 0.22, curve: 2 });
        cur++;
        if (cur === 4 && !revealedRare) {
          revealedRare = true;
          s.timeout(() => {
            const W = root.clientWidth, H = root.clientHeight;
            burstAt(W / 2, H * 0.46, 120, [45, 50, 40, 330, 190], 1.2);
            if (s.large) [1047, 1319, 1568, 2093].forEach((f, k) => tone(f, { type: 'triangle', dur: 0.9, gain: 0.12, at: k * 0.09 }));
          }, 120);
        }
        if (cur >= cards.length) s.timeout(() => { st = 'done'; again.classList.add('show'); }, 500);
      };

      const p = s.pointer(root);
      let tearing = null, packPress = null;
      p.ondown = (e) => {
        lastUser = performance.now();
        if (st === 'sealed') {
          const tr = top.getBoundingClientRect(), br = body.getBoundingClientRect();
          if (e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top - 20 && e.clientY <= tr.bottom + 10) tearing = { x: e.clientX, base: tear };
          else if (e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom) packPress = { x: e.clientX, y: e.clientY };
        } else if (st === 'reveal' && cards[cur]) {
          cards[cur].drag = { sx: p.x, sy: p.y, ox: cards[cur].x.x - p.x, oy: cards[cur].y.x - p.y };
        }
      };
      p.onmove = (e) => {
        if (!p.down) return;
        lastUser = performance.now();
        if (tearing) {
          const w = top.getBoundingClientRect().width;
          const nt = U.clamp(tearing.base + Math.abs(e.clientX - tearing.x) / w, 0, 1);
          if (Math.floor(nt * 12) > Math.floor(tear * 12)) sfxTear(nt);
          tear = Math.max(tear, nt);
          if (tear >= 0.98) { tearing = null; open(); }
        }
      };
      p.onup = () => {
        if (packPress && st === 'sealed') { tear = Math.max(tear, 0.01); autoT = 0; st = 'autotear'; }
        packPress = null; tearing = null;
        const c = cards[cur];
        if (st === 'reveal' && c && c.drag) {
          const dx = p.x - c.drag.sx, dy = p.y - c.drag.sy;
          if (Math.hypot(dx, dy) < 8) fling(Math.random() < 0.5 ? -1 : 1); // 클릭
          else if (Math.hypot(dx, dy) > root.clientWidth * 0.08) fling(Math.sign(dx) || 1);
          c.drag = null;
        }
      };

      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const idle = performance.now() - lastUser > 3500;
        if (idle) {
          autoT += dt;
          if (st === 'sealed' && autoT > 1.2) st = 'autotear';
          if (st === 'reveal' && autoT > 1.3) { autoT = 0; fling(cur % 2 ? 1 : -1); }
          if (st === 'done' && autoT > 3.2) { autoT = 0; reset(); }
        } else autoT = 0;
        if (st === 'autotear') {
          const nt = Math.min(1, tear + dt * 1.6);
          if (Math.floor(nt * 12) > Math.floor(tear * 12)) sfxTear(nt);
          tear = nt;
          if (tear >= 1) open();
        }
        // 팩
        const pw = pack.offsetWidth, ph = pack.offsetHeight;
        const g = p.idle ? { x: W / 2 + Math.sin(t * 0.9) * W * 0.18, y: H / 2 + Math.cos(t * 0.7) * H * 0.15 } : p;
        const tx = U.clamp((g.x - (W - pw) / 2) / pw, 0, 1), ty = U.clamp((g.y - (H - ph) / 2) / ph, 0, 1);
        U.spring(P.rx, st === 'sealed' || st === 'autotear' ? (0.5 - ty) * 18 : 0, dt, 120, 14);
        U.spring(P.ry, st === 'sealed' || st === 'autotear' ? (tx - 0.5) * 22 : 0, dt, 120, 14);
        U.spring(packY, st === 'sealed' || st === 'autotear' ? 0 : 1, dt, 40, 10);
        U.spring(P.s, tearing ? 1.03 : 1, dt, 200, 16);
        pack.style.transform = `translate(${(W - pw) / 2}px,${(H - ph) / 2 + packY.x * H * 0.75 + Math.sin(t * 1.4) * H * 0.006}px) rotateX(${P.rx.x}deg) rotateY(${P.ry.x}deg) scale(${P.s.x})`;
        pack.style.opacity = U.clamp(1.3 - packY.x * 1.4, 0, 1);
        pack.style.setProperty('--px', tx * 100 + '%'); pack.style.setProperty('--py', ty * 100 + '%'); pack.style.setProperty('--bx', 30 + tx * 40 + '%');
        tearBar.style.setProperty('--tp', tear * 100 + '%');
        if (topFly) {
          topFly.t += dt;
          const k = Math.min(1, topFly.t / 0.7), e = 1 - Math.pow(1 - k, 3);
          top.style.transform = `translate(${-e * W * 0.3}px,${-e * H * 0.45 + k * k * H * 0.2}px) rotate(${-e * 50}deg)`;
          top.style.opacity = 1 - k;
        } else top.style.transform = `translateY(${-tear * 4}%) rotate(${-tear * 6}deg)`;
        // 카드
        const unit = Math.min(W * 0.15, H * 0.2);
        cards.forEach((c, i) => {
          let x, y, r, sc;
          if (c.place === 'pack') { x = W / 2; y = H / 2 + H * 0.05; r = 0; sc = 0.8; }
          else if (c.place === 'stack') { const k = i - cur; x = W / 2 + k * 3; y = H * 0.46 - k * 3; r = (k % 2 ? 1 : -1) * Math.min(k, 3) * 1.5; sc = 1; }
          else if (st === 'done') { const k = i - 2; x = W / 2 + k * unit; y = H * 0.47 + Math.abs(k) * H * 0.035; r = k * 7; sc = 0.62; }
          else { const k = i - 2; x = W / 2 + k * W * 0.11; y = H * 0.9; r = k * 6; sc = 0.34; }
          if (c.drag && i === cur) { x = p.x + c.drag.ox; y = p.y + c.drag.oy; r = (p.x - c.drag.sx) * 0.04; sc = 1.04; }
          U.spring(c.x, x, dt, 140, 16); U.spring(c.y, y, dt, 140, 16); U.spring(c.r, r, dt, 120, 14); U.spring(c.sc, sc, dt, 140, 16);
          c.o += ((c.place === 'pack' ? 0 : 1) - c.o) * U.damp(10, dt);
          const cw = c.n.offsetWidth || 1, ch = c.n.offsetHeight || 1;
          c.n.style.opacity = c.o;
          c.n.style.zIndex = c.place === 'kept' ? 41 + i : 50 + (cards.length - i);
          c.n.style.transform = `translate(${c.x.x - cw / 2}px,${c.y.x - ch / 2}px) rotate(${c.r.x}deg) scale(${c.sc.x})`;
          // 맨 위 카드만 커서에 반응해 기울어진다
          const isTop = i === cur && st === 'reveal';
          const lx = isTop ? U.clamp((g.x - (c.x.x - cw / 2)) / cw, 0, 1) : 0.5 + Math.sin(t + i) * 0.2;
          const ly = isTop ? U.clamp((g.y - (c.y.x - ch / 2)) / ch, 0, 1) : 0.5 + Math.cos(t * 0.8 + i) * 0.2;
          Lab.holo.setVars(c.card, lx, ly, isTop ? 0.9 : 0.4, isTop ? (0.5 - ly) * 20 : 0, isTop ? (lx - 0.5) * 22 : 0);
        });
        // 불꽃
        fctx.clearRect(0, 0, fx.w, fx.h);
        fctx.globalCompositeOperation = 'lighter';
        for (let i = sparks.length - 1; i >= 0; i--) {
          const q = sparks[i]; q.t += dt; if (q.t > q.life) { sparks.splice(i, 1); continue; }
          q.vx *= Math.exp(-3 * dt); q.vy = q.vy * Math.exp(-3 * dt) + 120 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          const k = 1 - q.t / q.life;
          fctx.fillStyle = `hsla(${q.h},100%,${65 + k * 20}%,${k})`;
          fctx.beginPath(); fctx.arc(q.x, q.y, q.r * (0.5 + k), 0, U.TAU); fctx.fill();
        }
        fctx.globalCompositeOperation = 'source-over';
      });
    },
  });

  /* =======================================================
     2. Key Shapes — 키마다 다른 모양과 소리
     ======================================================= */
  const ROWS = ['1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const PENTA = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
  const KPAL = [
    { bg: '#1d1b2e', ink: ['#ff5f8f', '#ffcf5c', '#6bffb8', '#6bc6ff', '#b36bff'] },
    { bg: '#f1ece0', ink: ['#ff4a1c', '#1d3fbf', '#161512', '#f2b600', '#1f9e6e'] },
    { bg: '#ff5f8f', ink: ['#ffffff', '#1d1b2e', '#ffe36b', '#6bffd8', '#3a1c71'] },
    { bg: '#0d2a26', ink: ['#7cffd4', '#ffd36b', '#ff7a5c', '#e9f5f1', '#4db8ff'] },
  ];
  Lab.register({
    id: 'key-shapes', cat: 'sound', title: 'Key Shapes', captureKeys: true, sound: true, feature: true,
    tags: ['keyboard', 'WebAudio', 'synth'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const keys = [];
      ROWS.forEach((row, r) => [...row].forEach((ch, col) => keys.push({ ch, r, col, type: (r * 3 + col) % 10, note: PENTA[(col + r * 2) % PENTA.length] * (r === 0 ? 2 : r === 3 ? 0.5 : 1), flash: 0 })));
      const keyPos = (k) => ({ x: c.w * ((k.col + 0.5 + k.r * 0.35) / 10.7), y: c.h * (0.2 + k.r * 0.2) });
      let pal = 0, bgOld = KPAL[0].bg, wipe = null, ci = 0;
      const anims = [];
      const sound = (k) => {
        if (!s.large) return;
        const f = k.note;
        switch (k.type) {
          case 0: tone(f, { type: 'sine', dur: 0.6, gain: 0.22 }); break;
          case 1: tone(f * 2, { type: 'triangle', dur: 0.18, gain: 0.18 }); tone(f * 3, { type: 'triangle', dur: 0.12, gain: 0.08, at: 0.06 }); break;
          case 2: tone(150, { type: 'sine', dur: 0.45, gain: 0.5, glide: 40 }); break; // 킥
          case 3: tone(f, { type: 'square', dur: 0.25, gain: 0.08, cutoff: 1800 }); break;
          case 4: tone(f / 2, { type: 'sawtooth', dur: 0.4, gain: 0.08, glide: f * 1.5, cutoff: 2200 }); break;
          case 5: tone(f, { type: 'sine', dur: 1.2, gain: 0.15 }); tone(f * 2.76, { type: 'sine', dur: 0.6, gain: 0.06 }); break; // 종
          case 6: Lab.burst({ dur: 0.06, freq: 8000, q: 1.2, gain: 0.35, curve: 6 }); break; // 하이햇
          case 7: tone(f / 2, { type: 'triangle', dur: 0.9, gain: 0.2 }); break;
          case 8: Lab.burst({ dur: 0.18, freq: 1800, q: 0.8, gain: 0.35, curve: 3 }); tone(220, { type: 'triangle', dur: 0.12, gain: 0.15 }); break; // 스네어
          default: [0, 0.07, 0.14].forEach((a, i) => tone(f * [2, 3, 4][i], { type: 'sine', dur: 0.25, gain: 0.07, at: a }));
        }
      };
      const fire = (k) => {
        const { x, y } = keyPos(k);
        const col = KPAL[pal].ink[ci++ % 5];
        anims.push({ type: k.type, x, y, t: 0, dur: [0.9, 0.9, 0.7, 1.0, 1.0, 1.1, 1.0, 1.4, 1.3, 1.1][k.type], col, seed: Math.random() * 1000, dir: Math.random() < 0.5 ? 1 : -1, n: 3 + ((Math.random() * 4) | 0) });
        k.flash = 1;
        sound(k);
        if (anims.length > 60) anims.shift();
      };
      const nextPalette = () => {
        bgOld = KPAL[pal].bg; pal = (pal + 1) % KPAL.length;
        wipe = { t: 0 };
        if (s.large) tone(110, { type: 'sine', dur: 0.8, gain: 0.3, glide: 55 });
      };
      let lastUser = -1e9;
      if (s.large) s.on(window, 'keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
        if (e.key === ' ') { nextPalette(); lastUser = performance.now(); e.preventDefault(); return; }
        const k = keys.find((q) => q.ch === e.key.toLowerCase());
        if (k) { fire(k); lastUser = performance.now(); e.preventDefault(); }
      });
      const p = s.pointer(c.cv);
      p.ondown = () => {
        lastUser = performance.now();
        let best = keys[0], bd = 1e9;
        for (const k of keys) { const q = keyPos(k), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = k; } }
        fire(best);
      };
      const beat = [0, 4, 2, 6, 1, 4, 7, 6, 0, 3, 2, 5, 8, 4, 9, 6];
      let autoT = 0, step = 0;
      const ease = (k) => 1 - Math.pow(1 - k, 3);
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        if (performance.now() - lastUser > 3000) {
          autoT += dt;
          if (autoT > 0.26) {
            autoT = 0; step++;
            const pool = keys.filter((k) => k.type === beat[step % 16]);
            fire(U.pick(pool));
            if (step % 48 === 0) nextPalette();
          }
        }
        ctx.fillStyle = bgOld; ctx.fillRect(0, 0, W, H);
        if (wipe) {
          wipe.t += dt;
          const k = ease(Math.min(1, wipe.t / 0.6));
          ctx.fillStyle = KPAL[pal].bg; ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.hypot(W, H) * 0.6 * k, 0, U.TAU); ctx.fill();
          if (k >= 1) { bgOld = KPAL[pal].bg; wipe = null; }
        }
        // 자판 안내 (흐리게)
        const dark = pal === 1;
        ctx.font = `600 ${Math.max(10, m * 0.03)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const k of keys) {
          const q = keyPos(k);
          k.flash = Math.max(0, k.flash - dt * 2.5);
          ctx.fillStyle = dark ? `rgba(22,21,18,${0.12 + k.flash * 0.6})` : `rgba(255,255,255,${0.1 + k.flash * 0.6})`;
          ctx.fillText(k.ch.toUpperCase(), q.x, q.y);
        }
        // 애니메이션
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i]; a.t += dt;
          const k = a.t / a.dur;
          if (k >= 1) { anims.splice(i, 1); continue; }
          ctx.save(); ctx.fillStyle = a.col; ctx.strokeStyle = a.col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const R = m * 0.28;
          switch (a.type) {
            case 0: { // 고리
              ctx.lineWidth = m * 0.05 * (1 - k); ctx.beginPath(); ctx.arc(a.x, a.y, R * ease(k), 0, U.TAU); ctx.stroke(); break; }
            case 1: { // 점 폭발
              for (let j = 0; j < 20; j++) { const an = (j / 20) * U.TAU + a.seed, d = R * 1.2 * ease(k); ctx.beginPath(); ctx.arc(a.x + Math.cos(an) * d, a.y + Math.sin(an) * d, m * 0.018 * (1 - k), 0, U.TAU); ctx.fill(); }
              break; }
            case 2: { // 화면 쓸기
              const k1 = ease(Math.min(1, k * 2)), k2 = ease(Math.max(0, k * 2 - 1));
              if (a.dir > 0) ctx.fillRect(W * k2, 0, W * (k1 - k2), H); else ctx.fillRect(0, H * k2, W, H * (k1 - k2));
              break; }
            case 3: { // 도는 다각형
              const sc = Math.sin(Math.PI * k) * R * 0.8;
              ctx.translate(a.x, a.y); ctx.rotate(k * Math.PI * 1.5 * a.dir);
              ctx.beginPath(); for (let j = 0; j < a.n; j++) { const an = (j / a.n) * U.TAU; ctx.lineTo(Math.cos(an) * sc, Math.sin(an) * sc); } ctx.closePath(); ctx.fill();
              break; }
            case 4: { // 지그재그
              const segs = 14, from = Math.max(0, k * 2 - 1) * segs, to = Math.min(1, k * 2) * segs;
              ctx.lineWidth = m * 0.02; ctx.beginPath();
              for (let j = Math.floor(from); j <= Math.ceil(to); j++) { const x = (j / segs) * W, y = a.y + (j % 2 ? -1 : 1) * m * 0.06; j === Math.floor(from) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
              ctx.stroke(); break; }
            case 5: { // 부채꼴
              const s0 = Math.max(0, k * 2 - 1) * U.TAU, s1 = Math.min(1, k * 2) * U.TAU;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.arc(a.x, a.y, R * 0.7, s0 - Math.PI / 2, s1 - Math.PI / 2); ctx.closePath(); ctx.fill(); break; }
            case 6: { // 격자 사각형
              const cols = 6, rows = 4, cw = W / cols, chh = H / rows;
              for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) {
                const d = (xx + yy) / (cols + rows), kk = U.clamp(k * 1.6 - d * 0.6, 0, 1), sz = Math.sin(Math.PI * kk) * Math.min(cw, chh) * 0.32;
                if (sz > 0.5) ctx.fillRect(xx * cw + cw / 2 - sz / 2, yy * chh + chh / 2 - sz / 2, sz, sz);
              }
              break; }
            case 7: { // 줄 튕기기
              ctx.lineWidth = m * 0.008;
              for (let j = 0; j < 5; j++) {
                const yy = H * (0.25 + j * 0.125); ctx.beginPath();
                for (let xx = 0; xx <= 40; xx++) { const u = xx / 40; ctx.lineTo(u * W, yy + Math.sin(u * Math.PI) * Math.sin(u * 12 + a.t * 30 + j) * m * 0.08 * (1 - k)); }
                ctx.stroke();
              }
              break; }
            case 8: { // 물결
              ctx.lineWidth = m * 0.008;
              for (let j = 0; j < 4; j++) { const kk = U.clamp(k * 1.4 - j * 0.12, 0, 1); if (kk <= 0 || kk >= 1) continue; ctx.globalAlpha = 1 - kk; ctx.beginPath(); ctx.arc(a.x, a.y, R * 1.6 * ease(kk), 0, U.TAU); ctx.stroke(); }
              break; }
            default: { // 반짝이
              for (let j = 0; j < 12; j++) {
                const sx = (Math.sin(a.seed + j * 12.9) * 0.5 + 0.5) * W, sy = (Math.cos(a.seed * 1.7 + j * 7.3) * 0.5 + 0.5) * H;
                const kk = U.clamp(k * 1.5 - (j / 12) * 0.5, 0, 1), sz = Math.sin(Math.PI * kk) * m * 0.04;
                ctx.beginPath(); ctx.moveTo(sx, sy - sz); ctx.quadraticCurveTo(sx, sy, sx + sz, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + sz); ctx.quadraticCurveTo(sx, sy, sx - sz, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - sz); ctx.fill();
              }
            }
          }
          ctx.restore();
        }
        ctx.fillStyle = dark ? 'rgba(22,21,18,.45)' : 'rgba(255,255,255,.4)';
        ctx.font = `600 ${Math.max(10, m * 0.022)}px ${MONO}`;
        ctx.fillText(s.large ? 'A–Z · 0–9  ·  SPACE: 색 바꾸기  ·  화면을 눌러도 됩니다' : 'OPEN AND PLAY', W / 2, H - Math.max(14, m * 0.04));
      });
    },
  });

  /* =======================================================
     3. Fur Brush — 쓰다듬으면 결이 바뀌는 털
     ======================================================= */
  const FURS = [
    { name: '갈색', bg: '#2a1a10', lo: [70, 42, 24], hi: [226, 178, 120] },
    { name: '회색', bg: '#1d1f24', lo: [60, 64, 74], hi: [222, 226, 236] },
    { name: '벨벳', bg: '#2a0f1f', lo: [92, 18, 52], hi: [255, 140, 190] },
  ];
  Lab.register({
    id: 'fur-brush', cat: 'material', title: 'Fur Brush', feature: true,
    tags: ['velvet', 'brush', 'drag'],
    mount(el, s) {
      // 털 수만 가닥은 그리기가 무거워서 1배율로 그린다 (털은 원래 부드러워 티가 안 난다)
      const c = s.canvas({ dpr: 1 }); const { ctx } = c;
      const P = s.params({ len: [3.4, 1.5, 5, 0.1, '털 길이'], radius: [0.09, 0.03, 0.2, 0.01, '붓 크기'] });
      let fur = 0;
      const mode = s.modes(['쓰다듬기', '헝클기', '갈색', '회색', '벨벳', '초기화'], 0, (i) => {
        if (i >= 2 && i <= 4) { fur = i - 2; mode.set(0); }
        else if (i === 5) { init(); mode.set(0); }
      });
      const NB = 14;
      let N = 0, sp = 5, bx, by, ux, uy, tx, ty, lj, jit, buck, order, counts, cols = 0, rows = 0;
      const init = () => {
        sp = s.large ? 6.8 : 4.4;
        cols = Math.ceil(c.w / sp) + 1; rows = Math.ceil(c.h / sp) + 1; N = cols * rows;
        bx = new Float32Array(N); by = new Float32Array(N); ux = new Float32Array(N); uy = new Float32Array(N);
        tx = new Float32Array(N); ty = new Float32Array(N); lj = new Float32Array(N); jit = new Float32Array(N);
        buck = new Uint8Array(N); order = new Int32Array(N); counts = new Int32Array(NB + 1);
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const i = r * cols + q;
          bx[i] = (q + Math.random() * 0.9 - 0.45) * sp; by[i] = (r + Math.random() * 0.9 - 0.45) * sp;
          // 털은 원래 아래쪽으로 완만하게 흐른다
          const a = Math.PI / 2 + 0.35 + Lab.noise(bx[i] * 0.003, by[i] * 0.003, 2) * 0.45 + U.rand(-0.14, 0.14);
          ux[i] = Math.cos(a); uy[i] = Math.sin(a); lj[i] = U.rand(0.7, 1.3); jit[i] = U.rand(-0.09, 0.09);
        }
      };
      init(); c.onresize = init;
      const p = s.pointer(c.cv);
      let lx = null, ly = null, ghostT = 0;
      const each = (x, y, R, fn) => {
        const q0 = Math.max(0, Math.floor((x - R) / sp)), q1 = Math.min(cols - 1, Math.ceil((x + R) / sp));
        const r0 = Math.max(0, Math.floor((y - R) / sp)), r1 = Math.min(rows - 1, Math.ceil((y + R) / sp));
        for (let r = r0; r <= r1; r++) for (let q = q0; q <= q1; q++) {
          const i = r * cols + q, d = Math.hypot(bx[i] - x, by[i] - y);
          if (d < R) fn(i, 1 - d / R, d);
        }
      };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H), R = m * P.radius;
        let g, pressing;
        if (p.idle) {
          ghostT += dt;
          if (ghostT > 18) { ghostT = 0; init(); }
          // 가만히 있으면 하트 모양을 쓰다듬는다
          const u = ghostT * 0.9, hx = 16 * Math.pow(Math.sin(u), 3), hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
          g = { x: W / 2 + hx * m * 0.018, y: H / 2 + hy * m * 0.018 }; pressing = true;
        } else { g = p; pressing = p.down; }
        if (lx !== null && pressing) {
          const dx = g.x - lx, dy = g.y - ly, dl = Math.hypot(dx, dy);
          if (dl > 0.5) {
            const nx = dx / dl, ny = dy / dl, rough = mode.i === 1;
            each(g.x, g.y, R, (i, f) => {
              const w = f * f * 0.55;
              let vx = nx, vy = ny;
              if (rough) { const a = Math.random() * U.TAU; vx = Math.cos(a); vy = Math.sin(a); }
              let ax = ux[i] + (vx - ux[i]) * w, ay = uy[i] + (vy - uy[i]) * w;
              const l = Math.hypot(ax, ay) || 1; ux[i] = ax / l; uy[i] = ay / l;
            });
          }
        }
        // 누르지 않고 지나가면 털이 잠깐 일어선다
        if (!p.idle && !p.down) each(g.x, g.y, R * 1.3, (i, f, d) => {
          const ax = (bx[i] - g.x) / (d || 1), ay = (by[i] - g.y) / (d || 1);
          tx[i] += (ax * f - tx[i]) * 0.3; ty[i] += (ay * f - ty[i]) * 0.3;
        });
        lx = g.x; ly = g.y;
        const decay = Math.exp(-6 * dt);
        const LX = -0.55, LY = -0.83, len = sp * P.len;
        counts.fill(0);
        for (let i = 0; i < N; i++) {
          tx[i] *= decay; ty[i] *= decay;
          let dx = ux[i] + tx[i] * 1.4, dy = uy[i] + ty[i] * 1.4;
          const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
          const lift = Math.min(1, Math.hypot(tx[i], ty[i]));
          const shade = (dx * LX + dy * LY) * 0.42 + 0.5 + lift * 0.25 + jit[i];
          const b = Math.max(0, Math.min(NB - 1, (shade * NB) | 0));
          buck[i] = b; counts[b + 1]++;
        }
        for (let b = 1; b <= NB; b++) counts[b] += counts[b - 1];
        const fillPos = counts.slice();
        for (let i = 0; i < N; i++) order[fillPos[buck[i]]++] = i;
        const F = FURS[fur];
        ctx.fillStyle = F.bg; ctx.fillRect(0, 0, W, H);
        ctx.lineCap = 'butt'; ctx.lineWidth = sp * 0.7;
        for (let b = 0; b < NB; b++) {
          const s0 = counts[b], s1 = counts[b + 1];
          if (s0 === s1) continue;
          const k = b / (NB - 1);
          ctx.strokeStyle = `rgb(${F.lo.map((v, j) => Math.round(v + (F.hi[j] - v) * k)).join(',')})`;
          ctx.beginPath();
          for (let o = s0; o < s1; o++) {
            const i = order[o];
            let dx = ux[i] + tx[i] * 1.4, dy = uy[i] + ty[i] * 1.4;
            const l = Math.hypot(dx, dy) || 1, lift = Math.min(1, Math.hypot(tx[i], ty[i]));
            const L = (len * lj[i] * (1 - lift * 0.45)) / l;
            ctx.moveTo(bx[i], by[i]); ctx.lineTo(bx[i] + dx * L, by[i] + dy * L);
          }
          ctx.stroke();
        }
        // 비네트
        const vg = ctx.createRadialGradient(W / 2, H / 2, m * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        if (!p.idle) {
          ctx.strokeStyle = p.down ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, U.TAU); ctx.stroke();
        }
      });
    },
  });

  /* =======================================================
     4. Grass Field — 커서를 피해 갈라지는 풀밭
     ======================================================= */
  Lab.register({
    id: 'grass-field', cat: 'canvas', title: 'Grass Field', feature: true,
    tags: ['blades', 'wind', 'mouse'],
    mount(el, s) {
      const c = s.canvas({ dpr: s.large ? 1.25 : 1 }); const { ctx } = c;
      // 반딧불 한 마리 모양을 미리 그려 두고 찍는다
      const fly = Lab.offscreen(32, 32), fx2 = fly.getContext('2d');
      const fg = fx2.createRadialGradient(16, 16, 0, 16, 16, 16);
      fg.addColorStop(0, 'rgba(255,252,200,1)'); fg.addColorStop(0.18, 'rgba(240,255,150,.8)'); fg.addColorStop(1, 'rgba(180,255,100,0)');
      fx2.fillStyle = fg; fx2.fillRect(0, 0, 32, 32);
      const P = s.params({ wind: [1, 0, 2.5, 0.05, '바람'], count: [s.large ? 7000 : 2800, 1000, 20000, 500, '풀잎 수', true] });
      const BANDS = 18;
      let B = [], horizon = 0, flies = [];
      const init = () => {
        const W = c.w, H = c.h; horizon = H * 0.46;
        const n = Math.round(P.count);
        B = [];
        for (let i = 0; i < n; i++) {
          const d = Math.pow(Math.random(), 0.75); // 0 먼 곳 ~ 1 가까운 곳
          const y = horizon + (H - horizon + H * 0.04) * Math.pow(d, 1.6) + 2;
          const sc = 0.12 + d * 0.95;
          B.push({ x: U.rand(-W * 0.05, W * 1.05), y, d, sc, h: H * 0.12 * sc * U.rand(0.6, 1.35), w: Math.max(1, 5.5 * sc * U.rand(0.7, 1.3)), shade: (Math.random() * 3) | 0, band: Math.min(BANDS - 1, (d * BANDS) | 0), p: 0, v: 0, ph: Math.random() * 10 });
        }
        B.sort((a, b) => a.y - b.y);
        flies = Array.from({ length: s.large ? 26 : 12 }, () => ({ x: U.rand(W), y: U.rand(horizon, H), vx: 0, vy: 0, ph: Math.random() * 10 }));
      };
      init(); c.onresize = init;
      const gusts = [];
      const p = s.pointer(c.cv);
      p.ondown = () => {
        gusts.push({ x: p.x, y: p.y, r: 0, a: 1 });
        for (let i = 0; i < 10; i++) flies.push({ x: p.x + U.rand(-20, 20), y: p.y, vx: U.rand(-60, 60), vy: U.rand(-140, -60), ph: Math.random() * 10 });
        if (flies.length > 120) flies.splice(0, flies.length - 120);
      };
      // 띠별 색 (먼 곳은 푸르고 밝게, 가까운 곳은 짙게)
      const colorOf = (band, shade) => {
        const d = band / (BANDS - 1);
        const hue = 95 - d * 10 + shade * 6, sat = 35 + d * 25, lit = 46 - d * 22 + shade * 5;
        return `hsl(${hue},${sat}%,${lit}%)`;
      };
      const COLORS = Array.from({ length: BANDS }, (_, b) => [0, 1, 2].map((sh) => colorOf(b, sh)));
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        const g = p.idle ? { x: W * (0.5 + 0.38 * Math.sin(t * 0.33)), y: H * (0.72 + 0.12 * Math.sin(t * 0.51)) } : p;
        const R = m * 0.16 * (p.down ? 1.5 : 1);
        gusts.forEach((q) => { q.r += dt * m * 0.9; q.a -= dt * 0.6; });
        while (gusts.length && gusts[0].a <= 0) gusts.shift();
        // 하늘
        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, '#2b3a6b'); sky.addColorStop(0.55, '#d98a7a'); sky.addColorStop(1, '#ffd29a');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 2);
        const sx = W * 0.72, sy = horizon * 0.78;
        const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, m * 0.22);
        sun.addColorStop(0, 'rgba(255,248,220,1)'); sun.addColorStop(0.18, 'rgba(255,224,160,.9)'); sun.addColorStop(1, 'rgba(255,190,120,0)');
        ctx.fillStyle = sun; ctx.fillRect(0, 0, W, horizon);
        ctx.fillStyle = '#6a5a7c';
        ctx.beginPath(); ctx.moveTo(0, horizon);
        for (let x = 0; x <= W; x += W / 40) ctx.lineTo(x, horizon - (Lab.noise(x * 0.004, 7) * 0.5 + 0.5) * m * 0.08 - m * 0.01);
        ctx.lineTo(W, horizon); ctx.fill();
        const ground = ctx.createLinearGradient(0, horizon, 0, H);
        ground.addColorStop(0, '#7f8f5a'); ground.addColorStop(1, '#1f3317');
        ctx.fillStyle = ground; ctx.fillRect(0, horizon, W, H - horizon);
        // 풀잎 물리
        const wk = P.wind;
        for (const b of B) {
          const dx = b.x - g.x, dd = Math.hypot(dx, (b.y - g.y) * 1.8), rr = R * (0.35 + b.sc * 0.65);
          let push = 0;
          if (dd < rr) push = Math.sign(dx || 1) * Math.pow(1 - dd / rr, 1.5) * (p.idle ? 0.8 : 1.2);
          for (const q of gusts) {
            const gd = Math.hypot(b.x - q.x, (b.y - q.y) * 1.8), f = (gd - q.r) / (m * 0.08);
            push += Math.sign(b.x - q.x || 1) * Math.exp(-f * f) * q.a * 0.9;
          }
          b.v += ((push - b.p) * 90 - b.v * 9) * dt; b.p += b.v * dt;
        }
        // 띠별로 묶어서 칠한다
        let i = 0;
        for (let band = 0; band < BANDS; band++) {
          const paths = [new Path2D(), new Path2D(), new Path2D()];
          while (i < B.length && B[i].band <= band) {
            const b = B[i++];
            const wind = (Math.sin(b.x * 0.008 + t * 1.25 + b.d * 3) * 0.32 + Math.sin(b.x * 0.021 - t * 0.7 + b.ph) * 0.12) * wk * (0.5 + b.d * 0.5);
            const a = wind + b.p;
            const tx = b.x + Math.sin(a) * b.h, ty = b.y - Math.cos(a) * b.h;
            const cx = b.x + Math.sin(a * 0.45) * b.h * 0.5, cy = b.y - b.h * 0.55;
            const pa = paths[b.shade];
            pa.moveTo(b.x - b.w / 2, b.y); pa.quadraticCurveTo(cx - b.w * 0.25, cy, tx, ty); pa.quadraticCurveTo(cx + b.w * 0.25, cy, b.x + b.w / 2, b.y);
          }
          for (let sh = 0; sh < 3; sh++) { ctx.fillStyle = COLORS[band][sh]; ctx.fill(paths[sh]); }
        }
        // 반딧불
        ctx.globalCompositeOperation = 'lighter';
        for (const f of flies) {
          const d = Math.hypot(f.x - g.x, f.y - g.y);
          if (d < R && !p.idle) { f.vx += ((f.x - g.x) / (d || 1)) * 200 * dt; f.vy += ((f.y - g.y) / (d || 1)) * 200 * dt - 60 * dt; }
          f.vx += Math.sin(t * 1.3 + f.ph) * 12 * dt; f.vy += Math.cos(t * 1.1 + f.ph * 2) * 12 * dt;
          f.vx *= Math.exp(-1.2 * dt); f.vy *= Math.exp(-1.2 * dt);
          f.x += f.vx * dt; f.y += f.vy * dt;
          if (f.x < 0) f.x += W; if (f.x > W) f.x -= W; if (f.y < horizon * 0.85) f.vy += 30 * dt; if (f.y > H) f.y = H;
          const glow = Math.max(0, Math.sin(t * 2.2 + f.ph * 5)), r = m * 0.022 * (0.5 + glow * 0.5);
          if (glow < 0.05) continue;
          ctx.globalAlpha = glow; ctx.drawImage(fly, f.x - r, f.y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      });
    },
  });

  /* =======================================================
     5. Light & Shadow — 가시 영역 다각형으로 그린 실시간 그림자
     ======================================================= */
  Lab.register({
    id: 'light-shadow', cat: 'canvas', title: 'Light & Shadow',
    tags: ['visibility polygon', 'soft shadow', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ soft: [s.large ? 6 : 3, 1, 12, 1, '부드러운 그림자 샘플'], reach: [0.9, 0.3, 1.6, 0.05, '빛이 닿는 거리'] });
      const mode = s.modes(['전구 하나', 'RGB 세 개'], 0);
      let walls = [], floor, lightBuf, lb;
      const LCOL = ['255,190,120', '255,70,90', '80,255,140', '90,140,255'];
      const placed = [];
      const box = (cx, cy, w, h, a) => { const co = Math.cos(a), si = Math.sin(a); return [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]); };
      const ngon = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * U.TAU) * r, cy + Math.sin((i / n) * U.TAU) * r]);
      const init = () => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        walls = [
          { pts: box(W * 0.25, H * 0.3, m * 0.09, m * 0.03, 0.4), kind: 'box' },
          { pts: box(W * 0.72, H * 0.24, m * 0.05, m * 0.05, 0.2), kind: 'box' },
          { pts: box(W * 0.2, H * 0.72, m * 0.04, m * 0.11, -0.3), kind: 'box' },
          { pts: box(W * 0.78, H * 0.74, m * 0.1, m * 0.025, -0.5), kind: 'box' },
          { pts: ngon(W * 0.5, H * 0.18, m * 0.035, 10), kind: 'pillar' },
          { pts: ngon(W * 0.4, H * 0.78, m * 0.045, 10), kind: 'pillar' },
          { pts: ngon(W * 0.88, H * 0.48, m * 0.03, 10), kind: 'pillar' },
          { pts: [], kind: 'blade', cx: W * 0.55, cy: H * 0.52, r: m * 0.14 },
        ];
        // 바닥 타일
        floor = Lab.offscreen(c.cv.width, c.cv.height);
        const f = floor.getContext('2d'); f.scale(c.dpr, c.dpr);
        const ts = m * 0.08;
        for (let y = 0; y < H; y += ts) for (let x = 0; x < W; x += ts) {
          const k = ((x / ts) + (y / ts)) % 2 ? 0 : 1;
          f.fillStyle = k ? '#d9d2c4' : '#cfc7b8'; f.fillRect(x, y, ts, ts);
          f.fillStyle = 'rgba(0,0,0,.05)'; f.fillRect(x, y, ts, 1); f.fillRect(x, y, 1, ts);
        }
        lightBuf = Lab.offscreen(c.cv.width, c.cv.height); lb = lightBuf.getContext('2d'); lb.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
      };
      init(); c.onresize = init;
      const segments = () => {
        const W = c.w, H = c.h, segs = [[0, 0, W, 0], [W, 0, W, H], [W, H, 0, H], [0, H, 0, 0]];
        for (const w of walls) for (let i = 0; i < w.pts.length; i++) { const a = w.pts[i], b = w.pts[(i + 1) % w.pts.length]; segs.push([a[0], a[1], b[0], b[1]]); }
        return segs;
      };
      const visibility = (lx, ly, segs, pts) => {
        const angles = [];
        for (const [x, y] of pts) { const a = Math.atan2(y - ly, x - lx); angles.push(a - 0.0001, a, a + 0.0001); }
        angles.sort((a, b) => a - b);
        const out = [];
        for (const a of angles) {
          const dx = Math.cos(a), dy = Math.sin(a);
          let best = Infinity;
          for (const [x1, y1, x2, y2] of segs) {
            const sx = x2 - x1, sy = y2 - y1, den = dx * sy - dy * sx;
            if (Math.abs(den) < 1e-9) continue;
            const t = ((x1 - lx) * sy - (y1 - ly) * sx) / den, u = ((x1 - lx) * dy - (y1 - ly) * dx) / den;
            if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
          }
          if (best < Infinity) out.push(lx + dx * best, ly + dy * best);
        }
        return out;
      };
      const inside = (x, y, pts) => { let k = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k; } return k; };
      const p = s.pointer(c.cv);
      let drag = null, moved = 0, lastUser = -1e9;
      p.ondown = () => {
        lastUser = performance.now(); moved = 0;
        const w = walls.find((q) => q.kind !== 'blade' && inside(p.x, p.y, q.pts));
        drag = w ? { w, x: p.x, y: p.y } : null;
      };
      p.onmove = () => {
        if (!drag || !p.down) return;
        const dx = p.x - drag.x, dy = p.y - drag.y; drag.x = p.x; drag.y = p.y; moved += Math.abs(dx) + Math.abs(dy);
        drag.w.pts.forEach((q) => { q[0] += dx; q[1] += dy; });
      };
      p.onup = () => {
        if (!drag && moved < 5 && mode.i === 0) { placed.push({ x: p.x, y: p.y, col: LCOL[1 + (placed.length % 3)] }); if (placed.length > 3) placed.shift(); }
        drag = null;
      };
      s.on(c.cv, 'dblclick', () => (placed.length = 0));
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        c.cv.style.cursor = drag ? 'grabbing' : walls.some((q) => q.kind !== 'blade' && inside(p.x, p.y, q.pts)) ? 'grab' : 'crosshair';
        // 도는 날개
        const bl = walls[walls.length - 1];
        const ang = t * 0.5;
        bl.pts = [];
        for (let k = 0; k < 3; k++) {
          const a = ang + (k / 3) * U.TAU, a2 = a + 0.13;
          if (k === 0) bl.pts.push([bl.cx + Math.cos(a - 0.13) * m * 0.02, bl.cy + Math.sin(a - 0.13) * m * 0.02]);
          bl.pts.push([bl.cx + Math.cos(a) * bl.r, bl.cy + Math.sin(a) * bl.r], [bl.cx + Math.cos(a2) * bl.r, bl.cy + Math.sin(a2) * bl.r], [bl.cx + Math.cos(a2 + 0.5) * m * 0.02, bl.cy + Math.sin(a2 + 0.5) * m * 0.02]);
        }
        const segs = segments();
        const pts = []; for (const sgm of segs) pts.push([sgm[0], sgm[1]]);
        const g = p.idle ? Lab.ghost(t * 0.45, W, H) : { x: p.x, y: p.y };
        const lights = [];
        if (mode.i === 1) for (let k = 0; k < 3; k++) { const a = t * 0.8 + (k / 3) * U.TAU; lights.push({ x: g.x + Math.cos(a) * m * 0.06, y: g.y + Math.sin(a) * m * 0.06, col: LCOL[1 + k] }); }
        else { lights.push({ x: g.x, y: g.y, col: LCOL[0] }); placed.forEach((q) => lights.push(q)); }
        // 빛 버퍼: 어두운 바탕 위에 빛 다각형을 더한다
        lb.globalCompositeOperation = 'source-over';
        lb.fillStyle = 'rgb(26,24,34)'; lb.fillRect(0, 0, W, H);
        lb.globalCompositeOperation = 'lighter';
        const n = Math.round(P.soft), reach = m * P.reach;
        for (const L of lights) {
          // 벽 안이면 벽 중심에서 바깥쪽으로 조금씩 밀어 빛이 꺼지지 않게
          for (const w of walls) {
            if (!inside(L.x, L.y, w.pts)) continue;
            const cx = w.pts.reduce((a, q) => a + q[0], 0) / w.pts.length, cy = w.pts.reduce((a, q) => a + q[1], 0) / w.pts.length;
            let dx = L.x - cx, dy = L.y - cy; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
            for (let k = 0; k < 60 && inside(L.x, L.y, w.pts); k++) { L.x += dx * 3; L.y += dy * 3; }
          }
          for (let k = 0; k < n; k++) {
            const a = (k / n) * U.TAU, rr = n > 1 ? m * 0.012 : 0;
            const lx = L.x + Math.cos(a) * rr, ly = L.y + Math.sin(a) * rr;
            const poly = visibility(lx, ly, segs, pts);
            if (poly.length < 6) continue;
            const gr = lb.createRadialGradient(lx, ly, 0, lx, ly, reach);
            gr.addColorStop(0, `rgba(${L.col},${1.1 / n})`); gr.addColorStop(0.35, `rgba(${L.col},${0.45 / n})`); gr.addColorStop(1, `rgba(${L.col},0)`);
            lb.fillStyle = gr; lb.beginPath(); lb.moveTo(poly[0], poly[1]);
            for (let j = 2; j < poly.length; j += 2) lb.lineTo(poly[j], poly[j + 1]);
            lb.closePath(); lb.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(floor, 0, 0, W, H);
        ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lightBuf, 0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; ctx.drawImage(lightBuf, 0, 0, W, H); ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        // 벽
        for (const w of walls) {
          ctx.beginPath(); w.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
          ctx.fillStyle = w.kind === 'blade' ? '#2b2735' : '#24212c'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,240,220,.18)'; ctx.lineWidth = 1.2; ctx.stroke();
        }
        // 전구
        for (const L of lights) {
          const gr = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, m * 0.04);
          gr.addColorStop(0, `rgba(${L.col},1)`); gr.addColorStop(0.3, `rgba(${L.col},.5)`); gr.addColorStop(1, `rgba(${L.col},0)`);
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(L.x, L.y, m * 0.04, 0, U.TAU); ctx.fill();
          ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L.x, L.y, m * 0.006, 0, U.TAU); ctx.fill();
        }
        if (s.large) {
          ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.font = `500 ${Math.max(11, m * 0.02)}px ${MONO}`; ctx.textAlign = 'left';
          ctx.fillText(mode.i === 0 ? '클릭: 색 전구 놓기 · 벽 끌기 · 더블클릭: 전구 지우기' : '빨강, 초록, 파랑 그림자가 겹치는 곳을 보세요', 14, 22);
        }
      });
    },
  });
})();
