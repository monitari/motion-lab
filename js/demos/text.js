/* =========================================================
   TYPOGRAPHY — 반응하는 글자들
   ========================================================= */
(() => {
  const { U } = Lab;

  /* =======================================================
     1. Particle Text — 입자로 만든 글자, 커서가 밀어낸다
     ======================================================= */
  Lab.register({
    id: 'particle-text', cat: 'text', title: 'Particle Text', feature: true,
    tags: ['canvas', 'getImageData', 'mouse'],
    mount(el, s) {
      const c = s.canvas();
      const { ctx } = c;
      const words = ['MOTION', 'TOUCH', 'PLAY', 'LAB', 'HELLO'];
      let wi = 0, parts = [];
      const sample = (word) => {
        const W = c.w, H = c.h;
        const off = Lab.offscreen(W, H), x = off.getContext('2d');
        const fs = Math.min(H * 0.46, (W * 1.3) / word.length);
        x.font = `800 ${fs}px "Space Grotesk",sans-serif`;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillStyle = '#fff'; x.fillText(word, W / 2, H / 2 + fs * 0.04);
        const data = x.getImageData(0, 0, off.width, off.height).data;
        const step = Math.max(3, Math.round(Math.min(W, H) / (s.large ? 150 : 95)));
        const pts = [];
        for (let y = 0; y < off.height; y += step) for (let xx = 0; xx < off.width; xx += step) if (data[(y * off.width + xx) * 4 + 3] > 128) pts.push([xx, y]);
        for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
        return { pts, step };
      };
      const setWord = (explode) => {
        const { pts, step } = sample(words[wi]);
        const W = c.w, H = c.h;
        while (parts.length < pts.length) parts.push({ x: U.rand(W), y: U.rand(H), vx: 0, vy: 0, tx: 0, ty: 0, s: step });
        parts.length = pts.length;
        parts.forEach((q, i) => {
          q.tx = pts[i][0]; q.ty = pts[i][1]; q.s = step;
          if (explode) { const a = U.rand(U.TAU), v = U.rand(4, 22); q.vx += Math.cos(a) * v; q.vy += Math.sin(a) * v; }
        });
      };
      setWord(false);
      c.onresize = () => setWord(false);
      const p = s.pointer();
      p.ondown = () => { wi = (wi + 1) % words.length; setWord(true); };
      let autoT = 0;
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        ctx.fillStyle = 'rgba(8,8,16,.35)';
        ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 1.3, W, H) : p;
        if (p.idle) { autoT += dt; if (autoT > 5) { autoT = 0; wi = (wi + 1) % words.length; setWord(true); } } else autoT = 0;
        const R = Math.min(W, H) * (p.down ? 0.28 : 0.16), R2 = R * R;
        ctx.globalCompositeOperation = 'lighter';
        const f = Math.min(dt * 60, 2);
        for (const q of parts) {
          const dx = q.x - g.x, dy = q.y - g.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { const d = Math.sqrt(d2) || 1, k = (1 - d / R) * 6; q.vx += (dx / d) * k * f; q.vy += (dy / d) * k * f; }
          q.vx += (q.tx - q.x) * 0.02 * f; q.vy += (q.ty - q.y) * 0.02 * f;
          q.vx *= Math.pow(0.86, f); q.vy *= Math.pow(0.86, f);
          q.x += q.vx * f; q.y += q.vy * f;
          const sp = Math.min(1, Math.hypot(q.vx, q.vy) / 8);
          ctx.fillStyle = `hsl(${(q.tx / W) * 140 + 180 + t * 30 + sp * 120},90%,${55 + sp * 25}%)`;
          const sz = q.s * 0.62;
          ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        }
        ctx.globalCompositeOperation = 'source-over';
        // 커서가 밀어내는 범위를 옅게 보여준다
        if (!p.idle) {
          ctx.strokeStyle = p.down ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, U.TAU); ctx.stroke();
        }
      });
    },
  });

  /* =======================================================
     2. Scramble Field — 커서 주변 글자가 암호처럼 뒤섞인다
     ======================================================= */
  Lab.register({
    id: 'scramble-field', cat: 'text', title: 'Scramble Field',
    tags: ['DOM', 'proximity', 'mouse'],
    css: `
    .sc{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:6cqmin;background:#0b0d0c;color:#9fb3a8;
      font:500 3.6cqmin/1.55 'JetBrains Mono',monospace;cursor:crosshair;overflow:hidden}
    .sc-in{max-width:150cqmin}
    .sc h4{margin:0 0 2.4cqmin;font:700 7.4cqmin/1 'JetBrains Mono',monospace;color:#e9fff2;letter-spacing:-.02em}
    .sc span.h{color:#6bffb8;text-shadow:0 0 1.5cqmin #6bffb8aa}
    .sc span.w{color:#fff}
    `,
    mount(el, s) {
      const head = 'DECRYPT://MOTION';
      const body = 'Every interface is a conversation between intention and response. Motion is the grammar. Move your cursor across these words and watch meaning dissolve into noise, then quietly reassemble itself, letter by letter, as if nothing happened.';
      const wrap = (str) => [...str].map((ch) => `<span>${ch === ' ' ? ' ' : ch}</span>`).join('');
      const root = s.html(`<div class="sc"><div class="sc-in"><h4>${wrap(head)}</h4><p style="margin:0">${wrap(body)}</p></div></div>`);
      const spans = [...root.querySelectorAll('span')].map((n) => ({ n, o: n.textContent, x: 0, y: 0, heat: 0, last: 0 }));
      const G = '!<>-_\\/[]{}=+*^?#%$&@ABCDEFXYZ0123456789';
      const measure = () => {
        const r = root.getBoundingClientRect();
        spans.forEach((q) => { const b = q.n.getBoundingClientRect(); q.x = b.left - r.left + b.width / 2; q.y = b.top - r.top + b.height / 2; });
      };
      s.resize(root, measure);
      s.timeout(measure, 300);
      const p = s.pointer(root);
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t * 1.4, W, H) : p;
        const R = Math.min(W, H) * (p.down ? 0.3 : 0.17);
        for (const q of spans) {
          if (q.o === ' ') continue;
          const d = Math.hypot(q.x - g.x, q.y - g.y);
          const inR = d < R;
          if (inR) q.heat = Math.min(1, q.heat + dt * 8);
          else q.heat = Math.max(0, q.heat - dt * U.rand(0.8, 2.5));
          if (q.heat > 0.02) {
            if (t - q.last > 0.05 + (1 - q.heat) * 0.12) {
              q.last = t;
              q.n.textContent = G[(Math.random() * G.length) | 0];
              q.n.className = d < R * 0.5 ? 'w' : 'h';
            }
          } else if (q.n.textContent !== q.o) { q.n.textContent = q.o; q.n.className = ''; }
        }
      });
    },
  });

  /* =======================================================
     3. Glitch — 마우스 속도가 곧 글리치 강도
     ======================================================= */
  Lab.register({
    id: 'glitch-text', cat: 'text', title: 'Velocity Glitch',
    tags: ['clip-path', 'RGB split', 'mouse'],
    css: `
    .gl{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;background:#07070a;cursor:crosshair}
    .gl::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(#0000 0 2px,#ffffff08 2px 3px);mix-blend-mode:screen}
    .gl-w{position:relative;font:800 20cqmin/1 'Space Grotesk',sans-serif;letter-spacing:-.04em;color:#fff}
    .gl-l{position:absolute;inset:0;will-change:transform,clip-path}
    .gl-r{color:#ff2a6d;mix-blend-mode:screen}.gl-c{color:#05d9e8;mix-blend-mode:screen}
    .gl-s{color:#fff;background:#07070a}
    .gl-sub{position:absolute;bottom:12%;font:600 2.8cqmin 'JetBrains Mono',monospace;letter-spacing:.5em;color:#ffffff70}
    .gl-meter{position:absolute;top:6cqmin;left:6cqmin;right:6cqmin;height:.6cqmin;background:#ffffff14}
    .gl-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#05d9e8,#ff2a6d)}
    .gl-bar{position:absolute;left:0;right:0;height:2cqmin;background:#fff;mix-blend-mode:difference;opacity:0}
    `,
    mount(el, s) {
      const T = 'GLITCH';
      const root = s.html(`<div class="gl"><div class="gl-meter"><i></i></div>
        <div class="gl-w"><span style="visibility:hidden">${T}</span>
          <span class="gl-l gl-r">${T}</span><span class="gl-l gl-c">${T}</span>
          ${Array.from({ length: 5 }, () => `<span class="gl-l gl-s">${T}</span>`).join('')}
        </div><div class="gl-bar"></div><div class="gl-bar"></div><div class="gl-sub">SIGNAL · LOST</div></div>`);
      const r = root.querySelector('.gl-r'), cy = root.querySelector('.gl-c');
      const slices = [...root.querySelectorAll('.gl-s')];
      const bars = [...root.querySelectorAll('.gl-bar')];
      const meter = root.querySelector('.gl-meter i');
      const word = root.querySelector('.gl-w');
      const p = s.pointer(root);
      let lx = 0, ly = 0, I = 0, frame = 0;
      s.raf((dt, t) => {
        const sp = Math.hypot(p.x - lx, p.y - ly) / Math.max(dt, 0.001);
        lx = p.x; ly = p.y;
        let target = p.idle ? (Math.sin(t * 1.7) > 0.75 ? 0.8 : 0.05) : Math.min(1, sp / 3500);
        if (p.down) target = 1;
        I += (target - I) * (target > I ? 0.35 : 0.06);
        meter.style.width = I * 100 + '%';
        if (frame++ % 2) return;
        const fs = word.offsetHeight;
        const k = I * fs * 0.12;
        r.style.transform = `translate(${-k * U.rand(0.5, 1.2)}px,${U.rand(-1, 1) * k * 0.2}px)`;
        cy.style.transform = `translate(${k * U.rand(0.5, 1.2)}px,${U.rand(-1, 1) * k * 0.2}px)`;
        slices.forEach((sl) => {
          if (Math.random() < I * 0.9) {
            const top = U.rand(0, 95), h = U.rand(2, 4 + I * 18);
            sl.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`;
            sl.style.transform = `translateX(${U.rand(-1, 1) * k * 3}px)`;
            sl.style.opacity = 1;
          } else sl.style.opacity = 0;
        });
        word.style.transform = Math.random() < I * 0.3 ? `skewX(${U.rand(-1, 1) * I * 20}deg)` : 'none';
        bars.forEach((b) => {
          if (Math.random() < I * 0.5) { b.style.top = U.rand(0, 100) + '%'; b.style.opacity = U.rand(0.3, 1); b.style.height = U.rand(0.3, 3 * I) + 'cqmin'; }
          else b.style.opacity = 0;
        });
      });
    },
  });

  /* =======================================================
     4. Gravity Type — 가변 폰트 축 + 끌어당김
     ======================================================= */
  Lab.register({
    id: 'gravity-type', cat: 'text', title: 'Gravity Type',
    tags: ['variable font', 'wght/wdth', 'mouse'],
    css: `
    .gt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f2efe6;color:#141414;overflow:hidden;cursor:none}
    .gt-line{display:flex;font-family:'Roboto Flex',sans-serif;font-size:21cqmin;line-height:.9;letter-spacing:-.01em;white-space:nowrap}
    .gt-line span{display:inline-block;font-variation-settings:'wght' 260,'wdth' 70,'opsz' 144;will-change:transform}
    .gt-dot{position:absolute;left:0;top:0;width:3cqmin;height:3cqmin;margin:-1.5cqmin;border-radius:50%;background:#ff4d2e;pointer-events:none;mix-blend-mode:multiply}
    .gt-cap{position:absolute;bottom:5cqmin;font:600 2.4cqmin 'JetBrains Mono',monospace;letter-spacing:.3em;color:#0007}
    `,
    mount(el, s) {
      const lines = ['GRAVITY', 'TYPE'];
      const root = s.html(`<div class="gt">${lines.map((l) => `<div class="gt-line">${[...l].map((c) => `<span>${c}</span>`).join('')}</div>`).join('')}<div class="gt-dot"></div><div class="gt-cap">wght 100—1000 · wdth 25—151</div></div>`);
      const chs = [...root.querySelectorAll('.gt-line span')].map((n) => ({ n, w: 200, wd: 60, x: 0, y: 0, ox: { x: 0, v: 0 }, oy: { x: 0, v: 0 } }));
      const dot = root.querySelector('.gt-dot');
      const p = s.pointer(root);
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t, W, H) : p;
        dot.style.transform = `translate(${g.x}px,${g.y}px) scale(${p.down ? 2 : 1})`;
        const fs = H * 0.21;
        const rr = root.getBoundingClientRect();
        chs.forEach((q) => {
          const b = q.n.getBoundingClientRect();
          const cx = b.left - rr.left + b.width / 2 - q.ox.x, cy = b.top - rr.top + b.height / 2 - q.oy.x;
          const dx = g.x - cx, dy = g.y - cy, d = Math.hypot(dx, dy) / fs;
          const k = Math.max(0, 1 - d / (p.down ? 2.4 : 1.5));
          const e = k * k * (3 - 2 * k);
          q.w += (260 + e * 740 - q.w) * U.damp(10, dt);
          q.wd += (70 + e * 81 - q.wd) * U.damp(10, dt);
          q.n.style.fontVariationSettings = `'wght' ${q.w.toFixed(0)},'wdth' ${q.wd.toFixed(1)},'opsz' 144`;
          const pull = e * 0.18;
          U.spring(q.ox, dx * pull, dt, 140, 14); U.spring(q.oy, dy * pull, dt, 140, 14);
          q.n.style.transform = `translate(${q.ox.x}px,${q.oy.x}px)`;
          q.n.style.color = e > 0.05 ? `hsl(${12 + (1 - e) * 20},90%,${50 - e * 6}%)` : '#141414';
        });
      });
    },
  });

  /* =======================================================
     5. Split-Flap Board — 공항 출발 안내판
     ======================================================= */
  Lab.register({
    id: 'split-flap', cat: 'text', title: 'Split-Flap Board',
    tags: ['3D', 'Web Animations', 'click'],
    css: `
    .sf{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2cqmin;background:radial-gradient(ellipse at 50% 30%,#2a2a33,#0c0c10 70%);cursor:pointer}
    .sf-board{display:grid;gap:calc(var(--cw)*.08);padding:calc(var(--cw)*.3);border-radius:calc(var(--cw)*.2);background:#141418;box-shadow:inset 0 0 0 1px #ffffff10,0 3cqmin 8cqmin #000a}
    .sf-row{display:flex;gap:calc(var(--cw)*.08)}
    .sf-c{position:relative;width:var(--cw);height:calc(var(--cw)*1.42);perspective:calc(var(--cw)*6);font:700 calc(var(--cw)*1.06)/calc(var(--cw)*1.42) 'JetBrains Mono',monospace;color:#f4f1e6;text-align:center}
    .sf-h{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:#232329;backface-visibility:hidden}
    .sf-h span{display:block;height:200%}
    .sf-t{top:0;border-radius:calc(var(--cw)*.1) calc(var(--cw)*.1) 0 0;transform-origin:50% 100%;background:linear-gradient(#26262c,#202026)}
    .sf-b{bottom:0;border-radius:0 0 calc(var(--cw)*.1) calc(var(--cw)*.1);transform-origin:50% 0}
    .sf-b span{transform:translateY(-50%)}
    .sf-ft{z-index:2}.sf-fb{z-index:2;transform:rotateX(90deg)}
    .sf-c::after{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:#000;z-index:3}
    .sf-y{color:#ffcf3f}
    .sf-cap{font:600 2.2cqmin 'JetBrains Mono',monospace;letter-spacing:.4em;color:#ffffff50}
    `,
    mount(el, s) {
      const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-!?/';
      const COLS = 13, ROWS = 4;
      const msgs = [
        ['DEPARTURES', 'SEOUL   09:40', 'TOKYO   10:15', 'PARIS   11:05'],
        ['MOTION LAB', '', 'TOUCH THE', '    MOTION!'],
        ['GATE  A12', 'NOW BOARDING', '', 'HAVE FUN :-)'],
        ['HTML CSS JS', 'NO LIBRARIES', '60 FPS', 'CLICK AGAIN?'],
      ];
      const root = s.html(`<div class="sf"><div class="sf-board">${Array.from({ length: ROWS }, (_, r) => `<div class="sf-row">${Array.from({ length: COLS }, () =>
        `<div class="sf-c${r === 0 ? ' sf-y' : ''}"><div class="sf-h sf-t"><span> </span></div><div class="sf-h sf-b"><span> </span></div><div class="sf-h sf-t sf-ft"><span> </span></div><div class="sf-h sf-b sf-fb"><span> </span></div></div>`).join('')}</div>`).join('')}</div><div class="sf-cap">CLICK · HOVER</div></div>`);
      const cells = [...root.querySelectorAll('.sf-c')].map((n) => {
        const [t, b, ft, fb] = [...n.children].map((x) => x.firstElementChild);
        return { n, t, b, ft, fb, ftEl: n.children[2], fbEl: n.children[3], cur: 0, tgt: 0, next: 0 };
      });
      s.resize(root, (W, H) => {
        const cw = Math.min((W * 0.88) / (COLS * 1.08 + 0.6), (H * 0.78) / (ROWS * 1.55 + 0.6));
        root.style.setProperty('--cw', cw + 'px');
      });
      let mi = -1;
      const show = () => {
        mi = (mi + 1) % msgs.length;
        const m = msgs[mi];
        cells.forEach((c, i) => {
          const r = (i / COLS) | 0, col = i % COLS;
          const ch = (m[r] || '').padEnd(COLS, ' ')[col];
          c.tgt = Math.max(0, CH.indexOf(ch));
          c.next = performance.now() + col * 40 + r * 70 + U.rand(0, 60);
        });
      };
      show();
      const DUR = 70;
      const flip = (c) => {
        const a = CH[c.cur], b = CH[(c.cur + 1) % CH.length];
        c.t.textContent = b; c.b.textContent = a; c.ft.textContent = a; c.fb.textContent = b;
        c.ftEl.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: DUR / 2, easing: 'ease-in', fill: 'forwards' });
        c.fbEl.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: DUR / 2, delay: DUR / 2, easing: 'ease-out', fill: 'both' });
        c.cur = (c.cur + 1) % CH.length;
      };
      const p = s.pointer(root);
      p.ondown = () => { show(); last = performance.now(); };
      cells.forEach((c) => s.on(c.n, 'pointerenter', () => {
        if (c.cur === c.tgt) { c.cur = (c.tgt + CH.length - 6) % CH.length; c.next = performance.now(); }
      }));
      let last = performance.now();
      s.raf(() => {
        const now = performance.now();
        for (const c of cells) {
          if (c.cur !== c.tgt && now >= c.next) { flip(c); c.next = now + DUR + 5; }
        }
        if (p.idle && now - last > 5200) { last = now; show(); }
      });
    },
  });

  /* =======================================================
     6. Elastic Letters — 잡아당기는 글자
     ======================================================= */
  Lab.register({
    id: 'elastic-letters', cat: 'text', title: 'Elastic Letters',
    tags: ['spring', 'drag', 'chain'],
    css: `
    .el{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(circle at 50% 50%,#ffe0ef,#ffc2dc 60%,#ff9ec7)}
    .el-w{display:flex;font:900 18cqmin/1 'Space Grotesk',sans-serif;letter-spacing:-.02em}
    .el-w span{display:inline-block;cursor:grab;will-change:transform;color:#ff2d7a;text-shadow:0 .03em 0 #c4005a,0 .06em 0 #a1004a,0 .12em .15em #0003;touch-action:none}
    .el-w span:nth-child(3n+2){color:#ffcf3f;text-shadow:0 .03em 0 #e0a100,0 .06em 0 #b98400,0 .12em .15em #0003}
    .el-w span:nth-child(3n){color:#3fb8ff;text-shadow:0 .03em 0 #0a88d1,0 .06em 0 #0066a3,0 .12em .15em #0003}
    .el-w span.grab{cursor:grabbing}
    .el svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    `,
    mount(el, s) {
      const word = 'STRETCH';
      const root = s.html(`<div class="el"><svg><path fill="none" stroke="#ff2d7a55" stroke-width="3" stroke-linecap="round"/></svg><div class="el-w">${[...word].map((c) => `<span>${c}</span>`).join('')}</div></div>`);
      const path = root.querySelector('path');
      const L = [...root.querySelectorAll('.el-w span')].map((n) => ({ n, x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, hx: 0, hy: 0 }));
      let grab = -1, gx = 0, gy = 0, ox = 0, oy = 0, lastUser = -1e9;
      const measure = () => {
        const rr = root.getBoundingClientRect();
        L.forEach((q) => { const b = q.n.getBoundingClientRect(); q.hx = b.left - rr.left + b.width / 2 - q.x.x; q.hy = b.top - rr.top + b.height / 2 - q.y.x; });
      };
      s.resize(root, measure);
      s.timeout(measure, 200);
      L.forEach((q, i) => {
        s.on(q.n, 'pointerdown', (e) => {
          grab = i; lastUser = performance.now();
          const rr = root.getBoundingClientRect();
          gx = e.clientX - rr.left; gy = e.clientY - rr.top; ox = q.x.x - gx; oy = q.y.x - gy;
          q.n.classList.add('grab');
          try { root.setPointerCapture(e.pointerId); } catch (_) {}
        });
        s.on(q.n, 'pointerenter', () => { if (grab < 0) { q.y.v -= 600; lastUser = performance.now(); } });
      });
      s.on(root, 'pointermove', (e) => { if (grab < 0) return; const rr = root.getBoundingClientRect(); gx = e.clientX - rr.left; gy = e.clientY - rr.top; lastUser = performance.now(); });
      const rel = () => { if (grab >= 0) L[grab].n.classList.remove('grab'); grab = -1; };
      s.on(root, 'pointerup', rel); s.on(root, 'pointercancel', rel);
      let autoT = 0;
      s.raf((dt, t) => {
        if (performance.now() - lastUser > 3500 && grab < 0) {
          autoT += dt;
          if (autoT > 2.2) { autoT = 0; const q = U.pick(L); q.x.v += U.rand(-1, 1) * 900; q.y.v += U.rand(-1400, -500); }
        }
        const steps = 3, h = dt / steps;
        for (let k = 0; k < steps; k++) {
          L.forEach((q, i) => {
            if (i === grab) { q.x.x = gx + ox; q.y.x = gy + oy; q.x.v = q.y.v = 0; return; }
            let tx = 0, ty = 0;
            if (grab >= 0) { const f = Math.pow(0.55, Math.abs(i - grab)); tx = L[grab].x.x * f; ty = L[grab].y.x * f; }
            // 이웃과의 결합
            const nb = [L[i - 1], L[i + 1]].filter(Boolean);
            const cx = nb.reduce((a, b) => a + b.x.x, 0) / nb.length, cy = nb.reduce((a, b) => a + b.y.x, 0) / nb.length;
            U.spring(q.x, tx * 0.6 + cx * 0.4, h, 160, 7);
            U.spring(q.y, ty * 0.6 + cy * 0.4, h, 160, 7);
          });
        }
        let d = '';
        L.forEach((q, i) => {
          const rot = U.clamp(q.x.v * 0.02, -35, 35);
          const sv = Math.min(0.4, Math.hypot(q.x.v, q.y.v) / 4000);
          q.n.style.transform = `translate(${q.x.x}px,${q.y.x}px) rotate(${rot}deg) scale(${1 + sv},${1 - sv * 0.5})`;
          d += (i ? 'L' : 'M') + (q.hx + q.x.x).toFixed(1) + ' ' + (q.hy + q.y.x).toFixed(1);
        });
        path.setAttribute('d', d);
      });
    },
  });

  /* =======================================================
     7. Neon Sign — 지직거리는 네온사인
     ======================================================= */
  Lab.register({
    id: 'neon-sign', cat: 'text', title: 'Neon Sign',
    tags: ['text-shadow', 'flicker', 'hover'],
    css: `
    .ne{--lx:50%;--ly:50%;position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1cqmin;overflow:hidden;
      background-color:#1a1214;
      background-image:linear-gradient(#0000 92%,#00000080 92%),linear-gradient(90deg,#0000 96%,#00000080 96%),linear-gradient(90deg,#0000 96%,#00000080 96%);
      background-size:12cqmin 6cqmin,12cqmin 12cqmin,12cqmin 12cqmin;background-position:0 0,0 0,6cqmin 6cqmin}
    .ne::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,#ff2d9540,#0000 70%);transition:opacity .2s}
    .ne::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 22cqmin at var(--lx) var(--ly),#0000,#000d 70%);opacity:0;transition:opacity .5s}
    .ne.off::before{opacity:0}.ne.off::after{opacity:1}
    .ne-a,.ne-b{position:relative;z-index:1;display:flex}
    .ne-a{font:400 19cqmin/1.1 'Pacifico',cursive;--n:#ff2d95}
    .ne-b{font:400 8cqmin/1 'Monoton',cursive;--n:#2de2ff;letter-spacing:.06em}
    .ne span{color:#fff;text-shadow:0 0 .03em #fff,0 0 .1em var(--n),0 0 .25em var(--n),0 0 .5em var(--n),0 0 1em var(--n);transition:color .05s;cursor:default}
    .ne span.x,.ne.off span{color:#4a2f38;text-shadow:none}
    .ne.off .ne-b span{color:#24343a}
    .ne-sw{position:absolute;right:5cqmin;bottom:5cqmin;z-index:2;width:7cqmin;height:11cqmin;border-radius:1.2cqmin;background:#e9e3d8;box-shadow:0 .5cqmin 1cqmin #0008;cursor:pointer;display:grid;place-items:center}
    .ne-sw i{width:2.6cqmin;height:5cqmin;border-radius:.8cqmin;background:#cfc7b8;box-shadow:inset 0 -2cqmin 0 #b5ad9e;transition:.2s}
    .ne.off .ne-sw i{box-shadow:inset 0 2cqmin 0 #b5ad9e}
    `,
    mount(el, s) {
      const root = s.html(`<div class="ne"><div class="ne-a">${[...'Open late'].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</div>
        <div class="ne-b">${[...'NOODLE BAR'].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</div><button class="ne-sw" aria-label="스위치"><i></i></button></div>`);
      const spans = [...root.querySelectorAll('.ne span')];
      const buzz = new Map();
      let on = true;
      spans.forEach((sp) => s.on(sp, 'pointerenter', () => buzz.set(sp, 0.5)));
      const sw = root.querySelector('.ne-sw');
      const flickerOn = () => {
        root.classList.remove('off');
        spans.forEach((sp) => buzz.set(sp, U.rand(0.2, 0.9)));
      };
      s.on(sw, 'click', () => { on = !on; on ? flickerOn() : root.classList.add('off'); });
      const p = s.pointer(root);
      let dead = spans[3];
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t, W, H) : p;
        root.style.setProperty('--lx', g.x + 'px'); root.style.setProperty('--ly', g.y + 'px');
        if (!on) return;
        spans.forEach((sp) => {
          let b = buzz.get(sp) || 0;
          if (b > 0) { b -= dt; buzz.set(sp, b); sp.classList.toggle('x', b > 0 && Math.random() < 0.5); }
          else if (sp === dead) sp.classList.toggle('x', Math.sin(t * 13) * Math.sin(t * 3.1) > 0.6);
          else sp.classList.remove('x');
        });
        if (Math.random() < dt * 0.15) dead = U.pick(spans);
      });
    },
  });

  /* =======================================================
     8. Velocity Marquee — 던지는 무한 마키
     ======================================================= */
  Lab.register({
    id: 'velocity-marquee', cat: 'text', title: 'Velocity Marquee',
    tags: ['inertia', 'skew', 'drag'],
    css: `
    .mq{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:1cqmin;overflow:hidden;background:#0d0d0d;cursor:grab;touch-action:pan-y}
    .mq:active{cursor:grabbing}
    .mq-row{white-space:nowrap;font:800 15cqmin/1 'Space Grotesk',sans-serif;letter-spacing:-.03em;will-change:transform}
    .mq-row span{display:inline-block;padding-right:.4em}
    .mq-row:nth-child(odd){color:#d8ff3f}
    .mq-row:nth-child(even){color:transparent;-webkit-text-stroke:.3cqmin #fff}
    .mq-row em{font-style:normal;color:#ff4d8d;-webkit-text-stroke:0}
    `,
    mount(el, s) {
      const rows = ['MOTION ✦ PLAY ✦ TOUCH ✦ ', 'DRAG IT ✺ THROW IT ✺ ', 'KINETIC ✦ TYPE ✦ ', 'SPEED = SKEW ✺ '];
      const root = s.html(`<div class="mq">${rows.map((r) => `<div class="mq-row">${Array.from({ length: 6 }, () => `<span>${r.replace(/([✦✺])/g, '<em>$1</em>')}</span>`).join('')}</div>`).join('')}</div>`);
      const els = [...root.querySelectorAll('.mq-row')];
      const off = els.map(() => 0);
      let vel = 0, drag = false, lx = 0, lastMove = 0, skew = 0;
      s.on(root, 'pointerdown', (e) => { drag = true; lx = e.clientX; lastMove = 0; try { root.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(root, 'pointermove', (e) => { if (!drag) return; const d = e.clientX - lx; lx = e.clientX; lastMove = d; vel = d * 60; });
      s.on(root, 'pointerup', () => (drag = false));
      s.on(root, 'pointercancel', () => (drag = false));
      s.on(root, 'wheel', (e) => { if (!s.large) return; vel += (e.deltaY + e.deltaX) * 4; e.preventDefault(); }, { passive: false });
      s.raf((dt) => {
        if (!drag) vel *= Math.pow(0.04, dt); else vel *= Math.pow(0.0001, dt);
        const base = 70;
        els.forEach((r, i) => {
          const seg = r.firstElementChild.offsetWidth || 1;
          const dir = i % 2 ? -1 : 1;
          const v = (base * (1 + i * 0.2) + Math.abs(vel)) * dir * (vel < 0 ? -1 : 1);
          off[i] = (off[i] + v * dt) % seg;
          if (off[i] > 0) off[i] -= seg;
          skew += (U.clamp(-vel / 120, -22, 22) - skew) * 0.08;
          r.style.transform = `translateX(${off[i]}px) skewX(${skew * dir}deg)`;
        });
      });
    },
  });
})();
