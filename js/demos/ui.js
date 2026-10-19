/* =========================================================
   INTERACTION — 바로 써먹는 마이크로 인터랙션
   ========================================================= */
(() => {
  const { U } = Lab;
  let uid = 0;

  /* =======================================================
     1. Magnetic Buttons
     ======================================================= */
  Lab.register({
    id: 'magnetic', cat: 'ui', title: 'Elevator Panel', sound: true,
    tags: ['magnetic', 'spring', 'click'],
    css: `
    .ev{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
      background:linear-gradient(90deg,#1b1916 0 8%,#2a2622 8% 9%,#1b1916 9%),radial-gradient(ellipse at 50% 30%,#3a342d,#191714 70%);background-blend-mode:multiply}
    .ev::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,#ffffff05 0 1px,#0000 1px 9cqmin)}
    .ev-panel{position:relative;width:min(44cqmin,60cqw);height:88cqmin;border-radius:2cqmin;padding:4cqmin 4.4cqmin;display:flex;flex-direction:column;align-items:center;gap:3cqmin;
      background:repeating-linear-gradient(90deg,#9a9ca1 0 .25cqmin,#b9bbc0 .25cqmin .5cqmin,#a6a8ad .5cqmin .8cqmin),linear-gradient(#c8cacf,#8d9096);background-blend-mode:overlay;
      box-shadow:inset 0 0 0 .3cqmin #ffffff55,inset 0 -1cqmin 2cqmin #0004,0 3cqmin 6cqmin -1cqmin #000c}
    .ev-screw{position:absolute;width:1.6cqmin;height:1.6cqmin;border-radius:50%;background:radial-gradient(circle at 35% 35%,#eee,#777);box-shadow:inset 0 0 0 .2cqmin #0003}
    .ev-screw::after{content:'';position:absolute;left:20%;right:20%;top:45%;height:10%;background:#555;transform:rotate(35deg)}
    .ev-disp{width:100%;height:13cqmin;border-radius:1.2cqmin;background:#120705;display:flex;align-items:center;justify-content:center;gap:2.2cqmin;
      box-shadow:inset 0 .6cqmin 1.4cqmin #000,0 0 0 .3cqmin #6c6e73;font:700 9cqmin/1 'JetBrains Mono',monospace;color:#ff5a2a;text-shadow:0 0 1.6cqmin #ff3a1aaa}
    .ev-arrow{font-size:5cqmin;opacity:.15;transition:opacity .3s}.ev-arrow.on{opacity:1}
    .ev-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2.6cqmin 4.4cqmin;flex:1;align-content:center}
    .ev-b{position:relative;width:11cqmin;height:11cqmin;border-radius:50%;border:0;cursor:pointer;padding:0;will-change:transform;
      background:radial-gradient(circle at 40% 32%,#f4f4f2,#b8b9bc 55%,#7d7f84);box-shadow:0 .5cqmin 0 #5c5e63,0 .9cqmin 1.4cqmin #0006,inset 0 0 0 .5cqmin #d9dade}
    .ev-b span{position:absolute;inset:0;display:grid;place-items:center;font:700 4cqmin 'Space Grotesk',sans-serif;color:#2b2d31;will-change:transform;pointer-events:none}
    .ev-b::after{content:'';position:absolute;inset:-.6cqmin;border-radius:50%;box-shadow:0 0 0 .4cqmin #ffb02e00;transition:box-shadow .2s}
    .ev-b.lit::after{box-shadow:0 0 0 .4cqmin #ffb02e,0 0 2.4cqmin .6cqmin #ffb02e99}
    .ev-b.lit span{color:#b06a00;text-shadow:0 0 1cqmin #ffc75a}
    .ev-b:active{box-shadow:0 .1cqmin 0 #5c5e63,0 .3cqmin .6cqmin #0006,inset 0 0 0 .5cqmin #d9dade}
    .ev-row{display:flex;gap:3cqmin}
    .ev-row .ev-b{width:9cqmin;height:9cqmin}.ev-row .ev-b span{font-size:3cqmin}
    .ev-alarm{background:radial-gradient(circle at 40% 32%,#ffe066,#e6a400 60%,#9a6b00)!important}
    .ev-plate{font:600 1.7cqmin 'JetBrains Mono',monospace;letter-spacing:.2em;color:#4a4c51;text-shadow:0 1px 0 #ffffff70}
    `,
    mount(el, s) {
      const floors = ['9', '10', '7', '8', '5', '6', '3', '4', '1', '2', 'B1', 'B2'];
      const root = s.html(`<div class="ev"><div class="ev-panel">
        <i class="ev-screw" style="left:2cqmin;top:2cqmin"></i><i class="ev-screw" style="right:2cqmin;top:2cqmin"></i><i class="ev-screw" style="left:2cqmin;bottom:2cqmin"></i><i class="ev-screw" style="right:2cqmin;bottom:2cqmin"></i>
        <div class="ev-disp"><span class="ev-arrow up">▲</span><span class="ev-num">1</span><span class="ev-arrow dn">▼</span></div>
        <div class="ev-grid">${floors.map((f) => `<button class="ev-b" data-f="${f}"><span>${f}</span></button>`).join('')}</div>
        <div class="ev-row"><button class="ev-b" data-c="open"><span>◀▶</span></button><button class="ev-b" data-c="close"><span>▶◀</span></button><button class="ev-b ev-alarm" data-c="bell"><span><svg viewBox="0 0 24 24" style="width:45%" fill="#5a3b00"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2.2 15a2.2 2.2 0 0 0 4.4 0z"/></svg></span></button></div>
        <div class="ev-plate">MAX 15 PERSONS · 1000 KG</div></div></div>`);
      const num = root.querySelector('.ev-num'), up = root.querySelector('.up'), dn = root.querySelector('.dn');
      const B = [...root.querySelectorAll('.ev-b')].map((n) => ({ n, l: n.querySelector('span'), x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, lx: { x: 0, v: 0 }, ly: { x: 0, v: 0 } }));
      const order = ['B2', 'B1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
      let cur = 2, dir = 0, moveT = 0, doorT = 0, lastUser = -1e9, autoT = 2;
      const queue = new Set();
      const btnOf = (f) => B.find((b) => b.n.dataset.f === f);
      const ding = () => s.large && (Lab.tone(1318.5, { dur: 1.2, gain: 0.14 }), Lab.tone(1046.5, { dur: 1.5, gain: 0.14, at: 0.32 }));
      const press = (b) => {
        if (s.large) Lab.burst({ dur: 0.03, freq: 2600, q: 4, gain: 0.25, curve: 5 });
        const f = b.n.dataset.f, cmd = b.n.dataset.c;
        b.x.v += U.rand(-40, 40); b.y.v += 160;
        if (f) { if (order[cur] === f) { b.n.classList.add('lit'); s.timeout(() => b.n.classList.remove('lit'), 400); ding(); } else { queue.add(f); b.n.classList.add('lit'); } }
        else if (cmd === 'bell' && s.large) [0, 0.12, 0.24, 0.36].forEach((a) => Lab.tone(1900, { type: 'square', dur: 0.08, gain: 0.05, at: a }));
        else { b.n.classList.add('lit'); s.timeout(() => b.n.classList.remove('lit'), 300); }
      };
      B.forEach((b) => s.on(b.n, 'click', () => { lastUser = performance.now(); press(b); }));
      const p = s.pointer(root);
      s.raf((dt, t) => {
        // 엘리베이터: 큐에 가장 가까운 층으로 한 층씩
        if (performance.now() - lastUser > 4000) { autoT -= dt; if (autoT < 0) { autoT = U.rand(2, 4); const b = btnOf(U.pick(order)); if (b) press(b); } }
        if (doorT > 0) doorT -= dt;
        else if (queue.size) {
          const targets = [...queue].map((f) => order.indexOf(f));
          if (!dir) dir = Math.sign(targets.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a)) - cur) || 1;
          if (!targets.some((i) => Math.sign(i - cur) === dir)) dir = -dir;
          moveT += dt;
          if (moveT > 0.85) {
            moveT = 0; cur += dir;
            if (queue.has(order[cur])) { queue.delete(order[cur]); btnOf(order[cur]).n.classList.remove('lit'); ding(); doorT = 1.6; if (!queue.size) dir = 0; }
          }
        }
        num.textContent = order[cur];
        up.classList.toggle('on', dir > 0 && (Math.sin(t * 8) > -0.3 || doorT > 0)); dn.classList.toggle('on', dir < 0 && (Math.sin(t * 8) > -0.3 || doorT > 0));
        // 자석: 버튼은 거리의 0.35배, 숫자는 그보다 더 끌려온다
        const rr = root.getBoundingClientRect();
        const g = p.idle ? Lab.ghost(t * 0.9, rr.width, rr.height) : p;
        B.forEach((b) => {
          const r = b.n.getBoundingClientRect();
          const cx = r.left - rr.left + r.width / 2 - b.x.x, cy = r.top - rr.top + r.height / 2 - b.y.x;
          const dx = g.x - cx, dy = g.y - cy, d = Math.hypot(dx, dy), R = r.width * 1.1, on = d < R;
          const mx = r.width * 0.22;
          U.spring(b.x, on ? U.clamp(dx * 0.35, -mx, mx) : 0, dt, 200, 13); U.spring(b.y, on ? U.clamp(dy * 0.35, -mx, mx) : 0, dt, 200, 13);
          U.spring(b.lx, on ? U.clamp(dx * 0.2, -mx * 0.6, mx * 0.6) : 0, dt, 140, 10); U.spring(b.ly, on ? U.clamp(dy * 0.2, -mx * 0.6, mx * 0.6) : 0, dt, 140, 10);
          b.n.style.transform = `translate(${b.x.x}px,${b.y.x}px)`;
          b.l.style.transform = `translate(${b.lx.x}px,${b.ly.x}px)`;
        });
      });
    },
  });

  /* =======================================================
     2. Spotlight Reveal
     ======================================================= */
  Lab.register({
    id: 'spotlight', cat: 'ui', title: 'X-Ray Spotlight',
    tags: ['mask-image', 'layers', 'mouse'],
    css: `
    .sp{--x:50%;--y:50%;--r:16cqmin;position:absolute;inset:0;overflow:hidden;cursor:none}
    .sp-l{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 7cqw;font:800 min(16cqmin,12cqw)/.92 'Space Grotesk',sans-serif;letter-spacing:-.045em}
    .sp-a{background:#e9e6df;color:#cfcac0}
    .sp-a small,.sp-b small{font:600 2.4cqmin 'JetBrains Mono',monospace;letter-spacing:.3em;margin-top:4cqmin}
    .sp-a small{color:#9a958c}
    .sp-b{background:radial-gradient(circle at 30% 30%,#3a1cff,#0a0420 70%);color:#fff;
      -webkit-mask:radial-gradient(circle var(--r) at var(--x) var(--y),#000 55%,#0000 100%);mask:radial-gradient(circle var(--r) at var(--x) var(--y),#000 55%,#0000 100%)}
    .sp-b span{background:linear-gradient(90deg,#ff5f8f,#ffcf3f,#6bffb8,#3fb8ff);-webkit-background-clip:text;background-clip:text;color:transparent}
    .sp-b small{color:#6bffb8}
    .sp-b::before{content:'';position:absolute;inset:0;background:linear-gradient(#ffffff10 1px,#0000 1px) 0 0/4cqmin 4cqmin,linear-gradient(90deg,#ffffff10 1px,#0000 1px) 0 0/4cqmin 4cqmin}
    .sp-ring{position:absolute;left:0;top:0;width:calc(var(--r)*2);height:calc(var(--r)*2);margin:calc(var(--r)*-1);border-radius:50%;border:1px solid #ffffff50;pointer-events:none;transform:translate(var(--x),var(--y))}
    `,
    mount(el, s) {
      const root = s.html(`<div class="sp">
        <div class="sp-l sp-a"><div>NOTHING</div><div>TO SEE</div><div>HERE.</div><small>MOVE ALONG, PLEASE</small></div>
        <div class="sp-l sp-b"><div><span>EVERY</span></div><div><span>PIXEL HAS</span></div><div><span>A SECRET.</span></div><small>YOU FOUND IT ✦</small></div>
        <div class="sp-ring"></div></div>`);
      const p = s.pointer(root);
      const X = { x: 0, v: 0 }, Y = { x: 0, v: 0 }, R = { x: 1, v: 0 };
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t * 0.8, W, H) : p;
        U.spring(X, g.x, dt, 150, 18); U.spring(Y, g.y, dt, 150, 18); U.spring(R, p.down ? 2.4 : 1, dt, 120, 12);
        root.style.setProperty('--x', X.x + 'px'); root.style.setProperty('--y', Y.x + 'px');
        root.style.setProperty('--r', Math.min(W, H) * 0.17 * R.x + 'px');
      });
    },
  });

  /* =======================================================
     3. Ribbon Trail
     ======================================================= */
  Lab.register({
    id: 'ribbon-trail', cat: 'ui', title: 'Silk Ribbons',
    tags: ['spring chain', 'canvas', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const N = 44;
      const R = [{ k: 0.35, h: 330 }, { k: 0.25, h: 200 }, { k: 0.18, h: 50 }].map((r) => ({ ...r, P: Array.from({ length: N }, () => ({ x: c.w / 2, y: c.h / 2 })) }));
      const p = s.pointer();
      let hueShift = 0, lx = 0, ly = 0, sp = 0;
      p.ondown = () => (hueShift += 90);
      let g = { x: c.w / 2, y: c.h / 2 };
      // 체인은 60Hz 고정 스텝 (주사율이 높아도 같은 탄성)
      const step = s.fixed(1 / 60, () => R.forEach((r) => {
        const P = r.P;
        P[0].x += (g.x - P[0].x) * r.k; P[0].y += (g.y - P[0].y) * r.k;
        for (let i = 1; i < N; i++) { P[i].x += (P[i - 1].x - P[i].x) * r.k * 1.6; P[i].y += (P[i - 1].y - P[i].y) * r.k * 1.6; }
      }));
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        ctx.fillStyle = 'rgba(10,8,18,.35)'; ctx.fillRect(0, 0, W, H);
        g = p.idle ? { x: W / 2 + Math.cos(t * 2.2) * W * 0.28 + Math.sin(t * 0.7) * W * 0.1, y: H / 2 + Math.sin(t * 3.1) * H * 0.25 } : { x: p.x, y: p.y };
        sp += (Math.min(1, Math.hypot(g.x - lx, g.y - ly) / Math.max(dt, 1e-3) / 2500) - sp) * 0.1;
        lx = g.x; ly = g.y;
        step(dt, t);
        R.forEach((r, ri) => {
          const P = r.P, L = [], Rr = [];
          for (let i = 0; i < N; i++) {
            const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
            let nx = -(b.y - a.y), ny = b.x - a.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
            const k = 1 - i / N;
            // 꼬이는 리본처럼 폭이 사인으로 출렁인다
            const w = (m / 500) * (3 + k * (10 + sp * 30)) * (0.55 + 0.45 * Math.sin(i * 0.35 - t * 6 + ri * 2));
            L.push([P[i].x + nx * w, P[i].y + ny * w]); Rr.push([P[i].x - nx * w, P[i].y - ny * w]);
          }
          for (let i = 0; i < N - 1; i++) {
            const k = 1 - i / N;
            ctx.fillStyle = `hsla(${r.h + hueShift + i * 3},90%,${42 + k * 18 + Math.sin(i * 0.35 - t * 6 + ri * 2) * 8}%,${0.25 + k * 0.6})`;
            ctx.beginPath(); ctx.moveTo(L[i][0], L[i][1]); ctx.lineTo(L[i + 1][0], L[i + 1][1]); ctx.lineTo(Rr[i + 1][0], Rr[i + 1][1]); ctx.lineTo(Rr[i][0], Rr[i][1]); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = `hsla(${r.h + hueShift},100%,85%,.5)`; ctx.lineWidth = 1;
          ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
        });
        ctx.globalCompositeOperation = 'source-over';
      });
    },
  });

  /* =======================================================
     4. Confetti Button
     ======================================================= */
  Lab.register({
    id: 'confetti', cat: 'ui', title: 'Do Not Press', sound: true,
    tags: ['particles', 'streamers', 'click'],
    css: `
    .np{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqmin;overflow:hidden;
      background:radial-gradient(ellipse at 50% 40%,#2d2a33,#141218 70%);font-family:'Pretendard Variable',Pretendard,sans-serif}
    .np-plate{position:relative;width:44cqmin;height:44cqmin;border-radius:4cqmin;display:grid;place-items:center;
      background:repeating-linear-gradient(-45deg,#f2c200 0 4cqmin,#16140f 4cqmin 8cqmin);box-shadow:inset 0 0 0 1.4cqmin #2a2722,0 3cqmin 6cqmin -1cqmin #000c}
    .np-ring{position:absolute;width:30cqmin;height:30cqmin;border-radius:50%;background:radial-gradient(circle at 50% 35%,#5a5a60,#2a2a2e 70%);box-shadow:inset 0 .6cqmin 1cqmin #0009,0 .3cqmin 0 #77777d}
    .np-btn{position:relative;width:23cqmin;height:23cqmin;border-radius:50%;border:0;cursor:pointer;padding:0;transform:translateY(-1.8cqmin);transition:transform .08s;
      background:radial-gradient(circle at 42% 30%,#ff8a7a,#e01e23 45%,#8f0c12);box-shadow:0 1.8cqmin 0 #6e070c,0 2.4cqmin 2cqmin #0007,inset 0 -1cqmin 2cqmin #0004,inset 0 .8cqmin 1cqmin #fff5}
    .np-btn.down{transform:translateY(-.2cqmin);box-shadow:0 .2cqmin 0 #6e070c,0 .6cqmin 1cqmin #0007,inset 0 -1cqmin 2cqmin #0004,inset 0 .8cqmin 1cqmin #fff5}
    .np-btn::after{content:'';position:absolute;left:24%;top:14%;width:30%;height:18%;border-radius:50%;background:#ffffff70;filter:blur(.4cqmin);transform:rotate(-20deg)}
    .np-label{min-height:6cqmin;text-align:center;color:#f2efe6;font-weight:700;font-size:max(14px,4cqmin);letter-spacing:-.02em}
    .np-label small{display:block;margin-top:1cqmin;font:500 max(10px,1.8cqmin) 'IBM Plex Mono',monospace;color:#8d8a83;letter-spacing:.12em}
    .np-label.shake{animation:np-sh .35s}
    @keyframes np-sh{25%{transform:translateX(-1.4cqmin) rotate(-2deg)}50%{transform:translateX(1.2cqmin) rotate(1.5deg)}75%{transform:translateX(-.6cqmin)}}
    .np canvas{z-index:3;pointer-events:none}`,
    mount(el, s) {
      const LINES = ['누르지 마세요', '누르지 말라니까요', '…또요?', '진짜 마지막이에요', '알겠어요. 마음껏 누르세요', '파티다'];
      const root = s.html(`<div class="np"><div class="np-plate"><div class="np-ring"></div><button class="np-btn" aria-label="누르지 마세요"></button></div>
        <div class="np-label">${LINES[0]}<small>DO NOT PRESS</small></div></div>`);
      const btn = root.querySelector('.np-btn'), label = root.querySelector('.np-label');
      const c = s.canvas({ parent: root }); const { ctx } = c;
      const cols = ['#ff5a5f', '#ffd23f', '#4ad9a4', '#4fb3ff', '#b47cff', '#ffffff', '#ff9a3d'];
      const P = [], S = [];
      let presses = 0;
      const burst = (x, y, power) => {
        const m = Math.min(c.w, c.h), n = Math.round((s.large ? 90 : 50) * power);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + U.rand(-1, 1) * (0.5 + power * 0.25), v = U.rand(0.6, 1.4) * m * (0.9 + power * 0.5);
          P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: U.rand(U.TAU), vr: U.rand(-10, 10), tl: U.rand(U.TAU), vt: U.rand(5, 15),
            w: m * U.rand(0.012, 0.022), h: m * U.rand(0.006, 0.012), c: U.pick(cols), life: U.rand(2.5, 4), age: 0 });
        }
        // 꼬불꼬불한 테이프: 머리를 따라오는 점 열 개
        for (let i = 0; i < Math.round(6 * power); i++) {
          const a = -Math.PI / 2 + U.rand(-0.7, 0.7), v = U.rand(0.9, 1.5) * m * (0.8 + power * 0.4);
          S.push({ pts: Array.from({ length: 14 }, () => ({ x, y })), vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: U.pick(cols), ph: U.rand(10), age: 0, life: U.rand(3, 4.5), w: m * 0.008 });
        }
      };
      const fire = () => {
        presses++;
        const lvl = Math.min(presses, LINES.length - 1);
        label.innerHTML = `${LINES[lvl]}<small>${presses >= LINES.length - 1 ? 'PRESSED ' + presses + ' TIMES' : 'DO NOT PRESS'}</small>`;
        label.classList.remove('shake'); void label.offsetWidth; if (lvl < 4) label.classList.add('shake');
        const rr = root.getBoundingClientRect(), b = btn.getBoundingClientRect();
        const power = lvl < 1 ? 0.25 : lvl < 4 ? 0.5 + lvl * 0.15 : 1.4;
        burst(b.left - rr.left + b.width / 2, b.top - rr.top + b.height * 0.3, power);
        if (s.large) { Lab.burst({ dur: 0.25, freq: 700, q: 0.7, gain: 0.5 * power, curve: 2 }); if (lvl >= 4) [523, 659, 784, 1047].forEach((f, k) => Lab.tone(f, { type: 'triangle', dur: 0.4, gain: 0.08, at: 0.05 + k * 0.07 })); }
      };
      const down = () => { btn.classList.add('down'); if (s.large) Lab.burst({ dur: 0.03, freq: 1800, q: 5, gain: 0.3, curve: 6 }); };
      const up = () => { if (!btn.classList.contains('down')) return; btn.classList.remove('down'); fire(); lastUser = performance.now(); };
      s.on(btn, 'pointerdown', (e) => { e.stopPropagation(); down(); });
      s.on(window, 'pointerup', up);
      let lastUser = -1e9, auto = 1.2;
      s.raf((dt) => {
        const W = c.w, H = c.h;
        if (performance.now() - lastUser > 3500) { auto -= dt; if (auto < 0.12 && !btn.classList.contains('down')) btn.classList.add('down'); if (auto < 0) { auto = 2.4; btn.classList.remove('down'); fire(); if (presses > 7) presses = 0; } }
        ctx.clearRect(0, 0, W, H);
        const g = Math.min(H, 700) * 1.1;
        for (let i = S.length - 1; i >= 0; i--) {
          const q = S[i]; q.age += dt;
          if (q.age > q.life) { S.splice(i, 1); continue; }
          q.vx *= Math.exp(-1.6 * dt); q.vy = q.vy * Math.exp(-1.6 * dt) + g * 0.5 * dt;
          const h = q.pts[0]; h.x += (q.vx + Math.sin(q.age * 9 + q.ph) * 60) * dt; h.y += q.vy * dt;
          for (let k = 1; k < q.pts.length; k++) { const a = q.pts[k - 1], b = q.pts[k], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, L = c.h * 0.012; if (d > L) { b.x = a.x + (dx / d) * L; b.y = a.y + (dy / d) * L; } }
          ctx.globalAlpha = Math.min(1, (q.life - q.age) * 2);
          ctx.strokeStyle = q.c; ctx.lineWidth = q.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); q.pts.forEach((pt, k) => (k ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y))); ctx.stroke();
        }
        for (let i = P.length - 1; i >= 0; i--) {
          const q = P[i];
          q.age += dt;
          if (q.age > q.life || q.y > H + 40) { P.splice(i, 1); continue; }
          q.vy += g * dt;
          const drag = Math.exp(-2.4 * dt);
          q.vx *= drag; q.vy *= drag;
          q.vx += Math.sin(q.tl) * 30 * dt;
          q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; q.tl += q.vt * dt;
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.scale(1, Math.cos(q.tl));
          ctx.globalAlpha = Math.min(1, (q.life - q.age) * 2);
          ctx.fillStyle = q.c; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      });
    },
  });

  /* =======================================================
     5. 3D Carousel
     ======================================================= */
  Lab.register({
    id: 'carousel-3d', cat: 'ui', title: 'Record Shelf',
    tags: ['preserve-3d', 'inertia', 'drag'],
    css: `
    .rs{position:absolute;inset:0;overflow:hidden;perspective:120cqmin;cursor:grab;touch-action:pan-y;
      background:linear-gradient(#1c1714 0 62%,#2b211a 62%),radial-gradient(ellipse at 50% 30%,#3a2f27,#0000 70%);background-blend-mode:screen}
    .rs:active{cursor:grabbing}
    .rs::after{content:'';position:absolute;left:0;right:0;top:62%;height:2px;background:#4a3a2c}
    .rs-ring{position:absolute;left:50%;top:46%;transform-style:preserve-3d;will-change:transform}
    .rs-item{position:absolute;width:28cqmin;height:28cqmin;left:-14cqmin;top:-14cqmin;transform-style:preserve-3d}
    .rs-disc{position:absolute;inset:3%;border-radius:50%;will-change:transform;
      background:radial-gradient(circle,var(--lab) 0 15%,#111 15.5% 17%,#000 17.5%),repeating-radial-gradient(circle,#181818 0 .35cqmin,#0c0c0c .35cqmin .7cqmin);
      background-blend-mode:normal;box-shadow:0 0 0 .2cqmin #000}
    .rs-disc::after{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 30deg,#0000 0 10%,#ffffff22 14%,#0000 20% 55%,#ffffff18 60%,#0000 66%)}
    .rs-cov{position:absolute;inset:0;overflow:hidden;border-radius:.4cqmin;box-shadow:0 1cqmin 2cqmin -1cqmin #000c,inset 0 0 0 1px #ffffff18;color:#fff;font-family:'Pretendard Variable',Pretendard,sans-serif}
    .rs-cov::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,#ffffff1a,#0000 40%),repeating-linear-gradient(0deg,#0000 0 2px,#00000008 2px 3px)}
    .rs-t{position:absolute;left:1.6cqmin;bottom:1.4cqmin;right:1.6cqmin;font:700 2.4cqmin/1.15 'Pretendard Variable',sans-serif;letter-spacing:-.02em}
    .rs-a{display:block;font:500 1.4cqmin 'IBM Plex Mono',monospace;letter-spacing:.08em;opacity:.75;margin-top:.5cqmin}
    .rs-now{position:absolute;left:0;right:0;bottom:5%;text-align:center;color:#d8cbb8;font:500 max(11px,2.1cqmin) 'IBM Plex Mono',monospace;letter-spacing:.1em}
    .rs-now b{color:#fff;font-family:'Pretendard Variable',sans-serif;letter-spacing:-.01em;font-size:1.25em}
    `,
    mount(el, s) {
      const A = [
        ['굴절률', 'THE REFRACTORS', '#e9e2d0', 'background:radial-gradient(circle at 50% 58%,#d8432b 0 22%,#0000 22.5%),linear-gradient(#e9e2d0 0 58%,#1d3b6b 58%)'],
        ['Slow Orbit', 'NIGHT SHADER', '#7cffd4', 'background:repeating-radial-gradient(circle at 30% 70%,#0b1a33 0 2cqmin,#163d6b 2cqmin 2.6cqmin)'],
        ['Soft Physics', 'VERLET & CO.', '#ffd23f', 'background:repeating-linear-gradient(90deg,#f2c200 0 3.5cqmin,#e8552a 3.5cqmin 7cqmin,#1d3b6b 7cqmin 10.5cqmin,#f4efe6 10.5cqmin 14cqmin)'],
        ['92 BPM', 'KEY SHAPES', '#ff5a5f', 'background:#141414;--x:1'],
        ['Halftone', 'CMY', '#ffd23f', 'background:radial-gradient(circle,#ff3d7f 38%,#0000 40%) 0 0/2.4cqmin 2.4cqmin,radial-gradient(circle,#00abc9 30%,#0000 32%) 1.2cqmin 1.2cqmin/2.4cqmin 2.4cqmin,#f7dc37'],
        ['물 아래', 'KOI', '#f2a9bd', 'background:radial-gradient(ellipse at 30% 30%,#2f6b63,#0d2a2c 70%)'],
        ['Afterglow', 'DISSOLVE', '#ffb547', 'background:linear-gradient(#2b1650,#e85a7a 55%,#ffcf6b 56%,#ff8a3d)'],
        ['Grid Systems', 'SWISS', '#ff4a1c', 'background:linear-gradient(90deg,#0000 0 33%,#111 33% 34%,#0000 34% 66%,#111 66% 67%,#0000 67%),linear-gradient(#0000 0 49%,#111 49% 50%,#0000 50%),#f1ece0;color:#111'],
        ['Nocturne', 'PLASMA', '#b47cff', 'background:conic-gradient(from 210deg at 70% 30%,#1a0b3d,#7a3cff,#ff7ab8,#1a0b3d)'],
        ['Static', 'GLITCH', '#ffffff', 'background:repeating-linear-gradient(0deg,#f2efe6 0 .5cqmin,#111 .5cqmin 1.6cqmin);color:#ff3d3d'],
      ];
      const N = A.length;
      const big = (i) => (A[i][3].includes('--x') ? '<b style="position:absolute;left:1.6cqmin;top:1cqmin;font:900 13cqmin/0.85 Pretendard Variable,sans-serif;color:#ff5a5f;letter-spacing:-.06em">92</b>' : '');
      const root = s.html(`<div class="rs"><div class="rs-ring">${A.map(([t, a, lab, bg], i) => `<div class="rs-item"><div class="rs-disc" style="--lab:${lab}"></div><div class="rs-cov" style="${bg}">${big(i)}<div class="rs-t">${t}<span class="rs-a">${a}</span></div></div></div>`).join('')}</div><div class="rs-now"></div></div>`);
      const ring = root.querySelector('.rs-ring'), now = root.querySelector('.rs-now');
      const items = [...ring.children].map((n) => ({ n, disc: n.querySelector('.rs-disc'), out: { x: 0, v: 0 }, spin: Math.random() * 360 }));
      const step = 360 / N;
      let ang = 0, vel = 0, drag = false, lx = 0, last = -1e9, shown = -1;
      s.on(root, 'pointerdown', (e) => { drag = true; lx = e.clientX; vel = 0; last = performance.now(); try { root.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(root, 'pointermove', (e) => { if (!drag) return; const d = e.clientX - lx; lx = e.clientX; ang += d * 0.25; vel = d * 0.25 * 60; last = performance.now(); });
      const up = () => (drag = false);
      s.on(root, 'pointerup', up); s.on(root, 'pointercancel', up);
      const TX = { x: 0, v: 0 };
      const p = s.pointer(root);
      let idleStep = 0;
      s.raf((dt, t) => {
        const H = root.clientHeight, Rz = H * 0.5;
        const idle = performance.now() - last > 3000;
        if (!drag) {
          if (idle) { idleStep += dt; if (idleStep > 2.6) { idleStep = 0; vel = -step * 4.5; } }
          vel *= Math.exp(-2.5 * dt);
          if (Math.abs(vel) < 25) { const snap = Math.round(ang / step) * step; vel += (snap - ang) * 30 * dt; vel *= Math.exp(-6 * dt); }
          ang += vel * dt;
        }
        U.spring(TX, p.idle ? -8 : (p.ny - 0.5) * -20 - 6, dt, 60, 12);
        ring.style.transform = `translateZ(${-Rz}px) rotateX(${TX.x}deg) rotateY(${ang}deg)`;
        let frontI = 0, fm = -2;
        items.forEach((it, i) => {
          const a = ((i * step + ang) % 360 + 360) % 360, front = Math.cos((a * Math.PI) / 180);
          if (front > fm) { fm = front; frontI = i; }
          const settled = Math.abs(vel) < 20 && !drag;
          U.spring(it.out, front > 0.97 && settled ? 1 : 0, dt, 90, 14);
          it.spin += dt * 200 * it.out.x;
          it.n.style.transform = `rotateY(${i * step}deg) translateZ(${Rz}px) translateY(${-it.out.x * 6}%)`;
          it.disc.style.transform = `translateX(${it.out.x * 46}%) translateZ(-1px) rotate(${it.spin}deg)`;
          it.n.style.filter = `brightness(${0.35 + 0.65 * Math.max(0, front)})`;
        });
        if (frontI !== shown) { shown = frontI; now.innerHTML = `NOW PLAYING · <b>${A[frontI][0]}</b> — ${A[frontI][1]}`; }
      });
    },
  });

  /* =======================================================
     6. Rubik Cube (drag rotate)
     ======================================================= */
  Lab.register({
    id: 'cube-3d', cat: 'ui', title: 'Spin Cube',
    tags: ['CSS 3D', 'inertia', 'drag'],
    css: `
    .cb{position:absolute;inset:0;display:grid;place-items:center;perspective:130cqmin;background:radial-gradient(circle at 50% 40%,#1f2a44,#090c14 70%);cursor:grab;touch-action:none}
    .cb:active{cursor:grabbing}
    .cb-cube{position:relative;width:34cqmin;height:34cqmin;transform-style:preserve-3d;will-change:transform}
    .cb-f{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);gap:.8cqmin;padding:.8cqmin;background:#111;border-radius:1.6cqmin}
    .cb-f i{border-radius:1cqmin;box-shadow:inset 0 -.6cqmin 0 #0003,inset 0 .4cqmin 0 #fff5;transition:background .4s}
    .cb-shadow{position:absolute;bottom:14%;width:36cqmin;height:6cqmin;border-radius:50%;background:radial-gradient(#0009,#0000 70%)}
    `,
    mount(el, s) {
      const colors = ['#ff3b3b', '#ff9a1f', '#ffe14a', '#3ddc6a', '#2f8cff', '#ffffff'];
      const faces = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
      const root = s.html(`<div class="cb"><div class="cb-shadow"></div><div class="cb-cube">${faces.map((f, i) => `<div class="cb-f" data-t="${f}">${Array.from({ length: 9 }, () => `<i style="background:${colors[i]}"></i>`).join('')}</div>`).join('')}</div></div>`);
      const cube = root.querySelector('.cb-cube');
      const fs = [...cube.children];
      const stickers = [...cube.querySelectorAll('i')];
      s.resize(cube, (w) => fs.forEach((f) => (f.style.transform = `${f.dataset.t} translateZ(${w / 2}px)`)));
      let rx = -25, ry = 35, vx = 0, vy = 40, drag = false, lx = 0, ly = 0, moved = 0;
      s.on(root, 'pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; moved = 0; try { root.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(root, 'pointermove', (e) => {
        if (!drag) return;
        const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        ry += dx * 0.5; rx -= dy * 0.5; vy = dx * 30; vx = -dy * 30;
      });
      const up = () => {
        if (drag && moved < 4) stickers.forEach((st, i) => s.timeout(() => (st.style.background = U.pick(colors)), (i % 9) * 30));
        drag = false;
      };
      s.on(root, 'pointerup', up); s.on(root, 'pointercancel', up);
      s.raf((dt) => {
        if (!drag) { vx *= Math.exp(-1.2 * dt); vy *= Math.exp(-1.2 * dt); if (Math.abs(vy) < 18 && Math.abs(vx) < 5) vy += (18 - vy) * U.damp(0.5, dt); rx += vx * dt; ry += vy * dt; }
        cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    },
  });

  /* =======================================================
     7. Parallax Landscape (day ↔ night)
     ======================================================= */
  Lab.register({
    id: 'parallax-scene', cat: 'ui', title: 'Parallax Valley', feature: true,
    tags: ['depth layers', 'SVG', 'mouse'],
    css: `
    .px{--day:1;position:absolute;inset:0;overflow:hidden;background:#0b0c1d;cursor:crosshair}
    .px-stars{position:absolute;inset:0;opacity:calc(1 - var(--day)*1.6);background-image:radial-gradient(1.5px 1.5px at 20% 30%,#fff,#0000),radial-gradient(1px 1px at 70% 20%,#fff,#0000),radial-gradient(1.5px 1.5px at 40% 10%,#fff,#0000),radial-gradient(1px 1px at 85% 40%,#fff,#0000),radial-gradient(1px 1px at 10% 15%,#fff,#0000),radial-gradient(1.5px 1.5px at 55% 35%,#fff,#0000);background-size:40cqmin 30cqmin}
    .px-sun{position:absolute;left:62%;width:16cqmin;height:16cqmin;margin:-8cqmin;border-radius:50%;
      background:radial-gradient(circle,hsl(calc(30 + var(--day)*20),100%,calc(70% + var(--day)*20%)) 40%,hsl(calc(20 + var(--day)*30),100%,65%) 70%);box-shadow:0 0 12cqmin 4cqmin hsl(calc(25 + var(--day)*25),100%,60%,.6)}
    .px-l{position:absolute;left:-10%;width:120%;bottom:-6%;will-change:transform}
    .px-l svg{display:block;width:100%;height:auto}
    .px-fog{position:absolute;inset:auto 0 0;height:40%;background:linear-gradient(#0000,hsla(calc(220 + var(--day)*20),40%,calc(10% + var(--day)*50%),.4))}
    `,
    mount(el, s) {
      const layers = [
        { d: 0.06, y: 0, c: 'hsl(240,25%,calc(30% + var(--day)*35%))', amp: 0.35, seed: 1 },
        { d: 0.12, y: 4, c: 'hsl(250,25%,calc(22% + var(--day)*28%))', amp: 0.3, seed: 2 },
        { d: 0.22, y: 8, c: 'hsl(260,25%,calc(16% + var(--day)*20%))', amp: 0.26, seed: 3 },
        { d: 0.36, y: 12, c: 'hsl(270,25%,calc(10% + var(--day)*14%))', amp: 0.22, seed: 4 },
        { d: 0.55, y: 16, c: 'hsl(275,30%,calc(5% + var(--day)*8%))', amp: 0.18, seed: 5 },
      ];
      const ridge = (seed, amp) => {
        let d = 'M0 100 ';
        for (let i = 0; i <= 60; i++) { const x = (i / 60) * 400; const y = 100 - (Lab.noise(i * 0.12, seed * 7.3) * 0.5 + 0.5) * amp * 200 - amp * 40 - Math.abs(Lab.noise(i * 0.4, seed)) * 14; d += `L${x.toFixed(1)} ${y.toFixed(1)} `; }
        return d + 'L400 100Z';
      };
      const root = s.html(`<div class="px"><div class="px-stars"></div><div class="px-sun"></div>
        ${layers.map((l) => `<div class="px-l" style="margin-bottom:${-l.y}cqmin"><svg viewBox="0 0 400 100" preserveAspectRatio="none" style="height:${30 + l.y * 2}cqh;width:100%"><path d="${ridge(l.seed, l.amp)}" style="fill:${l.c}"/></svg></div>`).join('')}
        <div class="px-fog"></div></div>`);
      const els = [...root.querySelectorAll('.px-l')];
      const sun = root.querySelector('.px-sun');
      const p = s.pointer(root);
      const X = { x: 0.5, v: 0 }, Y = { x: 0.3, v: 0 };
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? { x: W * (0.5 + 0.4 * Math.sin(t * 0.3)), y: H * (0.45 + 0.4 * Math.sin(t * 0.21)) } : p;
        U.spring(X, g.x / W, dt, 40, 10); U.spring(Y, g.y / H, dt, 40, 10);
        const day = U.clamp(1 - (Y.x - 0.1) / 0.75, 0, 1);
        root.style.setProperty('--day', day.toFixed(3));
        // 밤 → 노을 → 낮. 위/아래 두 색을 구간마다 보간한다
        const KEY = [[0, [7, 9, 28], [28, 22, 60]], [0.35, [44, 32, 96], [255, 128, 92]], [0.6, [72, 122, 204], [255, 206, 156]], [1, [92, 170, 236], [214, 236, 250]]];
        let ki = 0; while (ki < KEY.length - 2 && day > KEY[ki + 1][0]) ki++;
        const [d0, t0c, b0c] = KEY[ki], [d1, t1c, b1c] = KEY[ki + 1], f = U.clamp((day - d0) / (d1 - d0), 0, 1);
        const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',');
        root.style.background = `linear-gradient(rgb(${mix(t0c, t1c)}),rgb(${mix(b0c, b1c)}) 78%)`;
        sun.style.top = 12 + Y.x * 70 + '%';
        sun.style.transform = `translateX(${(0.5 - X.x) * W * 0.04}px)`;
        els.forEach((e, i) => { e.style.transform = `translate(${(0.5 - X.x) * W * layers[i].d}px,${(0.5 - Y.x) * H * layers[i].d * 0.25}px)`; });
      });
    },
  });

  /* =======================================================
     8. Gooey Cursor (SVG goo filter)
     ======================================================= */
  Lab.register({
    id: 'gooey', cat: 'ui', title: 'Gooey Blobs',
    tags: ['SVG filter', 'metaball', 'mouse'],
    css: `
    .go{position:absolute;inset:0;overflow:hidden;background:#fdf3e7}
    .go-f{position:absolute;inset:0}
    .go-b{position:absolute;left:0;top:0;border-radius:50%;will-change:transform}
    .go-t{position:absolute;left:0;right:0;bottom:6%;text-align:center;font:700 2.6cqmin 'JetBrains Mono',monospace;letter-spacing:.3em;color:#0005}
    `,
    mount(el, s) {
      const id = 'goo' + ++uid;
      const T = 14, F = 7;
      const root = s.html(`<div class="go"><svg width="0" height="0" style="position:absolute"><filter id="${id}"><feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10"/></filter></svg>
        <div class="go-f" style="filter:url(#${id})">${Array.from({ length: T + F }, () => '<div class="go-b"></div>').join('')}</div><div class="go-t">GOOEY · SVG FILTER</div></div>`);
      const bs = [...root.querySelectorAll('.go-b')];
      const fe = root.querySelector('feGaussianBlur');
      const tail = bs.slice(0, T).map((n, i) => ({ n, x: 0, y: 0, r: 0, i }));
      const free = bs.slice(T).map((n, i) => ({ n, x: U.rand(), y: U.rand(), vx: U.rand(-0.06, 0.06), vy: U.rand(-0.06, 0.06), r: U.rand(0.07, 0.13), h: [12, 330, 45, 200, 280, 160, 25][i] }));
      const p = s.pointer(root);
      s.resize(root, (w, h) => { fe.setAttribute('stdDeviation', Math.max(6, Math.min(w, h) * 0.03)); });
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight, m = Math.min(W, H);
        const g = p.idle ? Lab.ghost(t * 0.9, W, H) : p;
        tail.forEach((q, i) => {
          const tx = i ? tail[i - 1].x : g.x, ty = i ? tail[i - 1].y : g.y;
          const f = U.damp(i ? 22 : 30, dt);
          q.x += (tx - q.x) * f; q.y += (ty - q.y) * f;
          const r = m * (0.075 - i * 0.004) * (p.down ? 1.3 : 1);
          q.n.style.width = q.n.style.height = r * 2 + 'px';
          q.n.style.transform = `translate(${q.x - r}px,${q.y - r}px)`;
          q.n.style.background = `hsl(${(t * 40 + i * 6) % 360},90%,60%)`;
        });
        free.forEach((q) => {
          const ax = g.x / W - q.x, ay = g.y / H - q.y, ad = Math.hypot(ax, ay);
          if (ad < 0.3) { q.vx += (ax / ad) * 0.25 * dt * (1 - ad / 0.3); q.vy += (ay / ad) * 0.25 * dt * (1 - ad / 0.3); }
          q.vx = U.clamp(q.vx, -0.12, 0.12); q.vy = U.clamp(q.vy, -0.12, 0.12);
          q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.x < 0.1) q.vx = Math.abs(q.vx); if (q.x > 0.9) q.vx = -Math.abs(q.vx);
          if (q.y < 0.1) q.vy = Math.abs(q.vy); if (q.y > 0.9) q.vy = -Math.abs(q.vy);
          const r = m * q.r;
          q.n.style.width = q.n.style.height = r * 2 + 'px';
          q.n.style.transform = `translate(${q.x * W - r}px,${q.y * H - r}px)`;
          q.n.style.background = `hsl(${q.h},90%,62%)`;
        });
      });
    },
  });

  /* =======================================================
     9. Glow Border Cards
     ======================================================= */
  Lab.register({
    id: 'glow-cards', cat: 'ui', title: 'Periodic Table of Motion',
    tags: ['radial-gradient', 'mask', 'hover'],
    css: `
    .pt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.4cqmin;background:#0c0c0f;color:#ece9e2;font-family:'Pretendard Variable',Pretendard,sans-serif}
    .pt-head{width:min(94cqw,150cqh);display:flex;justify-content:space-between;align-items:baseline;font:600 max(9px,1.9cqmin) 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#8d8a83}
    .pt-head b{font:800 max(12px,3.4cqmin) 'Pretendard Variable',sans-serif;letter-spacing:-.02em;color:#ece9e2}
    .pt-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1.1cqmin;width:min(94cqw,150cqh)}
    .pt-c{--x:-999px;--y:-999px;--k:#fff;position:relative;aspect-ratio:1;border-radius:1.2cqmin;padding:1.2cqmin 1.4cqmin;background:#ffffff07;overflow:hidden;cursor:default;transition:background .3s,transform .4s cubic-bezier(.3,1.5,.5,1)}
    .pt-c::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
      background:radial-gradient(22cqmin circle at var(--x) var(--y),var(--k),#ffffff12 60%);
      -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
    .pt-c::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(26cqmin circle at var(--x) var(--y),color-mix(in srgb,var(--k) 18%,transparent),#0000 60%)}
    .pt-c.on{background:#ffffff10;transform:translateY(-.5cqmin)}
    .pt-n{font:500 max(8px,1.5cqmin) 'IBM Plex Mono',monospace;color:#8d8a83}
    .pt-s{position:absolute;left:1.4cqmin;bottom:3.6cqmin;font:800 max(14px,4.4cqmin)/1 'Pretendard Variable',sans-serif;letter-spacing:-.03em;color:var(--k);transition:opacity .25s}
    .pt-name{position:absolute;left:1.4cqmin;bottom:1.3cqmin;font:500 max(8px,1.45cqmin) 'IBM Plex Mono',monospace;color:#b9b5ac;white-space:nowrap}
    .pt-c.on .pt-s{opacity:.15}
    .pt-v{position:absolute;inset:18% 12% 30%;display:grid;place-items:center;opacity:0;transition:opacity .25s}
    .pt-c.on .pt-v{opacity:1}
    .pt-v i{display:block;width:2.2cqmin;height:2.2cqmin;border-radius:50%;background:var(--k)}
    .pt-c.on .pt-v i{animation:var(--anim) infinite}
    .pt-legend{display:flex;gap:2.6cqmin;font:500 max(8px,1.6cqmin) 'IBM Plex Mono',monospace;color:#8d8a83}
    .pt-legend span::before{content:'';display:inline-block;width:1cqmin;height:1cqmin;border-radius:50%;margin-right:.8cqmin;background:var(--k)}
    @keyframes pt-ease{0%,10%{transform:translateX(-4cqmin)}50%,60%{transform:translateX(4cqmin)}100%{transform:translateX(-4cqmin)}}
    @keyframes pt-spring{0%{transform:translateX(-4cqmin)}20%{transform:translateX(5cqmin)}30%{transform:translateX(3cqmin)}38%{transform:translateX(4.4cqmin)}45%,70%{transform:translateX(4cqmin)}100%{transform:translateX(-4cqmin)}}
    @keyframes pt-bounce{0%,100%{transform:translateY(-4cqmin);animation-timing-function:ease-in}40%{transform:translateY(3cqmin);animation-timing-function:ease-out}55%{transform:translateY(0)}70%{transform:translateY(3cqmin)}80%{transform:translateY(2cqmin)}88%{transform:translateY(3cqmin)}}
    @keyframes pt-stagger{0%,100%{transform:translateY(0)}30%{transform:translateY(-2.5cqmin)}60%{transform:translateY(0)}}
    @keyframes pt-fade{0%,100%{opacity:1}50%{opacity:.08}}
    @keyframes pt-scale{0%,100%{transform:scale(.5)}50%{transform:scale(2.4)}}
    @keyframes pt-rotate{to{transform:rotate(1turn)}}
    @keyframes pt-skew{0%,100%{transform:skewX(0) scaleX(2.4)}50%{transform:skewX(-35deg) scaleX(2.4)}}
    @keyframes pt-flip{to{transform:rotateY(1turn)}}
    @keyframes pt-shake{0%,100%{transform:translateX(0)}10%,30%,50%{transform:translateX(-1.4cqmin)}20%,40%,60%{transform:translateX(1.4cqmin)}70%{transform:translateX(0)}}
    @keyframes pt-blur{0%,100%{filter:blur(0)}50%{filter:blur(.9cqmin)}}
    @keyframes pt-pulse{0%{box-shadow:0 0 0 0 var(--k)}100%{box-shadow:0 0 0 3cqmin #0000}}
    @keyframes pt-orbit{from{transform:rotate(0) translateX(3cqmin) rotate(0)}to{transform:rotate(1turn) translateX(3cqmin) rotate(-1turn)}}
    @keyframes pt-morph{0%,100%{border-radius:50%;transform:scale(1.6)}50%{border-radius:15%;transform:scale(1.6) rotate(45deg)}}
    @keyframes pt-draw{0%{width:0}60%,100%{width:8cqmin}}
    @keyframes pt-wave{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1.8)}}
    @keyframes pt-para{0%,100%{transform:translateX(-3cqmin)}50%{transform:translateX(3cqmin)}}
    @keyframes pt-linear{from{transform:translateX(-4cqmin)}to{transform:translateX(4cqmin)}}
    `,
    mount(el, s) {
      const K = { t: '#ffb547', f: '#6bc6ff', p: '#ff7ab8', m: '#7cffd4' };
      // [번호, 기호, 이름, 분류, 애니메이션, 특수]
      const EL = [
        [1, 'Ea', 'ease-in-out', 't', 'pt-ease 1.6s cubic-bezier(.65,0,.35,1)'], [2, 'Li', 'linear', 't', 'pt-linear 1.2s linear alternate'],
        [3, 'Sp', 'spring', 't', 'pt-spring 1.8s linear'], [4, 'Bo', 'bounce', 't', 'pt-bounce 1.4s'], [5, 'St', 'stagger', 't', 'pt-stagger .9s ease-in-out', 'trio'],
        [6, 'De', 'delay', 't', 'pt-ease 1.6s cubic-bezier(.65,0,.35,1) .6s'],
        [7, 'Sc', 'scale', 'f', 'pt-scale 1.4s ease-in-out'], [8, 'Ro', 'rotate', 'f', 'pt-rotate 1.4s linear', 'bar'], [9, 'Sk', 'skew', 'f', 'pt-skew 1.4s ease-in-out', 'sq'],
        [10, 'Fl', 'flip', 'f', 'pt-flip 1.5s ease-in-out', 'sq'], [11, 'Sh', 'shake', 'f', 'pt-shake .9s'], [12, 'Pa', 'parallax', 'f', 'pt-para 2s ease-in-out', 'layers'],
        [13, 'Fa', 'fade', 'p', 'pt-fade 1.4s ease-in-out'], [14, 'Bl', 'blur', 'p', 'pt-blur 1.4s ease-in-out', 'sq'], [15, 'Pu', 'pulse', 'p', 'pt-pulse 1.1s ease-out'],
        [16, 'Dr', 'draw', 'p', 'pt-draw 1.6s cubic-bezier(.65,0,.35,1)', 'line'], [17, 'Or', 'orbit', 'm', 'pt-orbit 1.6s linear'], [18, 'Mo', 'morph', 'm', 'pt-morph 1.8s ease-in-out', 'sq'],
      ];
      const vis = (sp) => {
        if (sp === 'trio') return '<div style="display:flex;gap:1cqmin">' + [0, 1, 2].map((k) => `<i style="animation-delay:${k * 0.12}s"></i>`).join('') + '</div>';
        if (sp === 'bar') return '<i style="width:6cqmin;height:1cqmin;border-radius:.5cqmin"></i>';
        if (sp === 'sq') return '<i style="border-radius:.4cqmin;width:3cqmin;height:3cqmin"></i>';
        if (sp === 'line') return '<i style="height:.5cqmin;width:0;border-radius:.3cqmin;justify-self:start"></i>';
        if (sp === 'layers') return '<div style="position:relative;width:100%;height:100%"><i style="position:absolute;left:30%;top:25%;opacity:.35;animation-duration:3s"></i><i style="position:absolute;left:50%;top:45%"></i></div>';
        return '<i></i>';
      };
      const root = s.html(`<div class="pt"><div class="pt-head"><b>Periodic Table of Motion</b><span>18 ELEMENTS · HOVER TO REACT</span></div>
        <div class="pt-grid">${EL.map(([n, sym, name, cat, anim, sp]) => `<div class="pt-c" style="--k:${K[cat]};--anim:${anim}"><span class="pt-n">${String(n).padStart(2, '0')}</span><b class="pt-s">${sym}</b><span class="pt-name">${name}</span><div class="pt-v">${vis(sp)}</div></div>`).join('')}</div>
        <div class="pt-legend"><span style="--k:${K.t}">timing</span><span style="--k:${K.f}">transform</span><span style="--k:${K.p}">paint</span><span style="--k:${K.m}">path</span></div></div>`);
      const cards = [...root.querySelectorAll('.pt-c')];
      const p = s.pointer(root);
      const X = { x: 0 }, Y = { x: 0 };
      let onIdx = -1;
      s.raf((dt, t) => {
        const rr = root.getBoundingClientRect();
        const g = p.idle ? Lab.ghost(t * 0.7, rr.width, rr.height) : p;
        X.x += (g.x - X.x) * U.damp(12, dt); Y.x += (g.y - Y.x) * U.damp(12, dt);
        let best = -1, bd = 1e9;
        cards.forEach((c2, i) => {
          const r = c2.getBoundingClientRect();
          const lx = X.x - (r.left - rr.left), ly = Y.x - (r.top - rr.top);
          c2.style.setProperty('--x', lx + 'px'); c2.style.setProperty('--y', ly + 'px');
          if (lx >= 0 && ly >= 0 && lx <= r.width && ly <= r.height) { best = i; bd = 0; }
        });
        if (best !== onIdx) { if (onIdx >= 0) cards[onIdx].classList.remove('on'); if (best >= 0) cards[best].classList.add('on'); onIdx = best; }
      });
    },
  });

  /* =======================================================
     10. Flip Tiles Wave
     ======================================================= */
  const svgURL = (txt, bg1, bg2, fg) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='none'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${bg1}'/><stop offset='1' stop-color='${bg2}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><circle cx='320' cy='60' r='90' fill='${fg}' opacity='.18'/><circle cx='60' cy='260' r='120' fill='${fg}' opacity='.12'/><text x='200' y='190' font-family='Arial Black,Arial' font-weight='900' font-size='118' text-anchor='middle' fill='${fg}'>${txt}</text></svg>`)}")`;
  Lab.register({
    id: 'flip-tiles', cat: 'ui', title: 'Flip Tile Wave',
    tags: ['3D flip', 'stagger', 'hover/click'],
    css: `
    .ft{position:absolute;inset:0;display:grid;place-items:center;background:#0b0b12;perspective:200cqmin}
    .ft-g{display:grid;width:min(94cqw,125cqh);aspect-ratio:4/3}
    .ft-t{position:relative;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.4,1.5,.5,1)}
    .ft-t.f{transform:rotateY(180deg)}
    .ft-t b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-image:var(--A);background-size:var(--gw) var(--gh);border-radius:.4cqmin}
    .ft-t b+b{transform:rotateY(180deg);background-image:var(--B)}
    `,
    mount(el, s) {
      const C = s.large ? 16 : 10;
      const rows = s.large ? 12 : 7;
      const A = svgURL('FLIP', '#ff5f8f', '#ffb347', '#fff'), B = svgURL('WAVE', '#2b5cff', '#00d4c8', '#fff');
      const root = s.html(`<div class="ft"><div class="ft-g" style="grid-template-columns:repeat(${C},1fr);grid-template-rows:repeat(${rows},1fr)">${Array.from({ length: C * rows }, (_, i) => {
        const x = i % C, y = (i / C) | 0;
        const pos = `${(x / (C - 1)) * 100}% ${(y / (rows - 1)) * 100}%`;
        return `<div class="ft-t" data-x="${x}" data-y="${y}"><b style="background-position:${pos}"></b><b style="background-position:${pos}"></b></div>`;
      }).join('')}</div></div>`);
      const grid = root.querySelector('.ft-g');
      grid.style.setProperty('--A', A); grid.style.setProperty('--B', B);
      s.resize(grid, (w, h) => { grid.style.setProperty('--gw', w + 'px'); grid.style.setProperty('--gh', h + 'px'); });
      const tiles = [...grid.children].map((n) => ({ n, x: +n.dataset.x, y: +n.dataset.y, f: false, lock: 0 }));
      const set = (q, v) => { q.f = v; q.n.classList.toggle('f', v); };
      const wave = (q0) => {
        const v = !q0.f;
        tiles.forEach((q) => { const d = Math.hypot(q.x - q0.x, q.y - q0.y); q.lock = performance.now() + d * 45 + 700; s.timeout(() => set(q, v), d * 45); });
      };
      tiles.forEach((q) => {
        s.on(q.n, 'pointerenter', () => { if (performance.now() > q.lock) { set(q, !q.f); q.lock = performance.now() + 400; } });
        s.on(q.n, 'click', () => wave(q));
      });
      let lastUser = -1e9;
      s.on(root, 'pointermove', () => (lastUser = performance.now()));
      s.interval(() => { if (performance.now() - lastUser > 3000) wave(U.pick(tiles)); }, 3200);
    },
  });

  /* =======================================================
     11. Googly Eyes
     ======================================================= */
  Lab.register({
    id: 'googly-eyes', cat: 'ui', title: 'Googly Eyes',
    tags: ['physics', 'crowd', 'mouse'],
    css: `
    .ge{position:absolute;inset:0;overflow:hidden;background:#ffd84d;cursor:crosshair}
    .ge-e{position:absolute;border-radius:50%;background:#fff;box-shadow:inset 0 -.15em .3em #0002,0 .1em .3em #0003;overflow:hidden}
    .ge-p{position:absolute;left:50%;top:50%;width:46%;height:46%;margin:-23%;border-radius:50%;background:#151515;will-change:transform}
    .ge-p::after{content:'';position:absolute;left:22%;top:18%;width:28%;height:28%;border-radius:50%;background:#fff}
    .ge-lid{position:absolute;inset:0;background:#ffb100;transform:translateY(-101%);transition:transform .08s}
    .ge-e.blink .ge-lid{transform:none}
    `,
    mount(el, s) {
      const root = s.html('<div class="ge"></div>');
      let eyes = [];
      const build = (W, H) => {
        root.innerHTML = '';
        eyes = [];
        const m = Math.min(W, H);
        const placed = [];
        for (let k = 0; k < 400 && placed.length < (s.large ? 34 : 18); k++) {
          const r = m * U.rand(0.04, 0.1), x = U.rand(r * 2.2, W - r * 2.2), y = U.rand(r, H - r);
          if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < (q.r + r) * 2.4)) continue;
          placed.push({ x, y, r });
        }
        placed.forEach((q) => {
          [-1, 1].forEach((sd) => {
            const n = document.createElement('div');
            n.className = 'ge-e';
            const cx = q.x + sd * q.r * 1.05;
            Object.assign(n.style, { left: cx - q.r + 'px', top: q.y - q.r + 'px', width: q.r * 2 + 'px', height: q.r * 2 + 'px', fontSize: q.r + 'px' });
            n.innerHTML = '<div class="ge-p"></div><div class="ge-lid"></div>';
            root.appendChild(n);
            eyes.push({ n, pu: n.firstElementChild, cx, cy: q.y, r: q.r, x: 0, y: 0, vx: 0, vy: 0, blinkT: U.rand(2, 8) });
          });
        });
      };
      s.resize(root, build);
      const p = s.pointer(root);
      let lx = 0, ly = 0;
      const blink = (e) => { e.n.classList.add('blink'); s.timeout(() => e.n.classList.remove('blink'), 140); };
      p.ondown = () => eyes.forEach((e) => s.timeout(() => blink(e), U.rand(0, 120)));
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t * 1.4, W, H) : p;
        const mvx = (g.x - lx) / Math.max(dt, 1e-3), mvy = (g.y - ly) / Math.max(dt, 1e-3);
        lx = g.x; ly = g.y;
        for (const e of eyes) {
          const max = e.r * 0.54;
          const dx = g.x - e.cx, dy = g.y - e.cy, d = Math.hypot(dx, dy) || 1;
          const tx = (dx / d) * max * Math.min(1, d / (e.r * 3)), ty = (dy / d) * max * Math.min(1, d / (e.r * 3));
          e.vx += ((tx - e.x) * 60 - mvx * 0.02) * dt;
          e.vy += ((ty - e.y) * 60 + 200 - mvy * 0.02) * dt;
          e.vx *= Math.exp(-3 * dt); e.vy *= Math.exp(-3 * dt);
          e.x += e.vx * dt * 1.0; e.y += e.vy * dt * 1.0;
          const l = Math.hypot(e.x, e.y);
          if (l > max) { e.x *= max / l; e.y *= max / l; const nx = e.x / max, ny = e.y / max, vn = e.vx * nx + e.vy * ny; if (vn > 0) { e.vx -= 1.6 * vn * nx; e.vy -= 1.6 * vn * ny; } }
          e.pu.style.transform = `translate(${e.x}px,${e.y}px)`;
          e.blinkT -= dt;
          if (e.blinkT < 0) { e.blinkT = U.rand(3, 9); blink(e); }
        }
      });
    },
  });

  /* =======================================================
     12. Turbulence Distortion
     ======================================================= */
  Lab.register({
    id: 'turbulence', cat: 'ui', title: 'Heat Haze',
    tags: ['feTurbulence', 'displacement', 'mouse'],
    css: `
    .tb{position:absolute;inset:0;overflow:hidden;background:#111}
    .tb-in{position:absolute;inset:-4%;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:radial-gradient(circle at 30% 30%,#ff7a3d,#0000 45%),radial-gradient(circle at 75% 70%,#ff3d7f,#0000 45%),radial-gradient(circle at 70% 20%,#ffd23d,#0000 35%),linear-gradient(160deg,#2a0f3a,#5a1030)}
    .tb-in h3{margin:0;font:900 17cqmin/.9 'Space Grotesk',sans-serif;letter-spacing:-.04em;color:#fff3d6;text-align:center}
    .tb-in p{margin:3cqmin 0 0;font:600 2.6cqmin 'JetBrains Mono',monospace;letter-spacing:.4em;color:#fff9}
    .tb-sun{position:absolute;width:30cqmin;height:30cqmin;border-radius:50%;left:60%;top:8%;background:radial-gradient(circle,#fff6c4,#ffb03d 60%,#ffb03d00 70%)}
    `,
    mount(el, s) {
      const id = 'tb' + ++uid;
      const root = s.html(`<div class="tb"><svg width="0" height="0" style="position:absolute"><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.04" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
        <div class="tb-in" style="filter:url(#${id})"><div class="tb-sun"></div><h3>HEAT<br>HAZE</h3><p>SUMMER · 38°C</p></div></div>`);
      const turb = root.querySelector('feTurbulence'), disp = root.querySelector('feDisplacementMap');
      const p = s.pointer(root);
      let lx = 0, ly = 0, I = 0;
      s.raf((dt, t) => {
        const sp = Math.hypot(p.x - lx, p.y - ly) / Math.max(dt, 1e-3);
        lx = p.x; ly = p.y;
        const target = p.down ? 1 : p.idle ? 0.25 + 0.2 * Math.sin(t) : Math.min(1, sp / 2500) * 0.8 + 0.08;
        I += (target - I) * (target > I ? 0.2 : 0.03);
        const bf = 0.008 + I * 0.01;
        turb.setAttribute('baseFrequency', `${bf.toFixed(4)} ${(0.03 + Math.sin(t * 0.7) * 0.006 + I * 0.03).toFixed(4)}`);
        disp.setAttribute('scale', (I * Math.min(root.clientWidth, root.clientHeight) * 0.14).toFixed(1));
      });
    },
  });
})();
