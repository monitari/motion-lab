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
    id: 'magnetic', cat: 'ui', title: 'Magnetic Buttons',
    tags: ['spring', 'parallax', 'hover'],
    css: `
    .mg{position:absolute;inset:0;display:grid;place-items:center;background:#0e0e12;cursor:none}
    .mg-cur{position:absolute;left:0;top:0;z-index:0;border-radius:999px;background:#fff;pointer-events:none;will-change:transform,width,height}
    .mg-grid{position:relative;z-index:1}
    .mg-grid{display:grid;grid-template-columns:repeat(3,auto);gap:7cqmin 9cqmin;align-items:center;justify-items:center}
    .mg-b{position:relative;border:0;cursor:pointer;font:600 3.2cqmin 'Space Grotesk',sans-serif;color:#fff;overflow:hidden;will-change:transform;isolation:isolate}
    .mg-b span{position:relative;display:inline-block;z-index:2;will-change:transform;pointer-events:none}
    .mg-b i{position:absolute;z-index:1;width:0;height:0;border-radius:50%;transform:translate(-50%,-50%);transition:width .5s cubic-bezier(.2,.8,.2,1),height .5s cubic-bezier(.2,.8,.2,1);pointer-events:none}
    .mg-b:hover i{width:300%;height:300%}
    .mg-1{padding:3cqmin 6cqmin;border-radius:10cqmin;background:#fff;color:#111}.mg-1 i{background:#ff4d6d}.mg-1:hover{color:#fff}
    .mg-2{width:16cqmin;height:16cqmin;border-radius:50%;border:.3cqmin solid #ffffff60;background:none;font-size:5cqmin}.mg-2 i{background:#6bffb8}.mg-2:hover{color:#111}
    .mg-3{padding:3cqmin 5cqmin;border-radius:2cqmin;background:linear-gradient(135deg,#7a5cff,#ff5f9a)}.mg-3 i{background:#ffcf3f}.mg-3:hover{color:#111}
    .mg-4{padding:3cqmin 6cqmin;border-radius:10cqmin;background:none;border:.3cqmin solid #fff}.mg-4 i{background:#fff}.mg-4:hover{color:#111}
    .mg-5{width:13cqmin;height:13cqmin;border-radius:3cqmin;background:#1f1f2a;font-size:5cqmin}.mg-5 i{background:#3fb8ff}
    .mg-6{padding:3cqmin 5cqmin;border-radius:10cqmin;background:#ffcf3f;color:#111}.mg-6 i{background:#111}.mg-6:hover{color:#ffcf3f}
    `,
    mount(el, s) {
      const labels = [['mg-1', 'Get started'], ['mg-2', '↗'], ['mg-3', 'Magnetic'], ['mg-4', 'Outline'], ['mg-5', '♥'], ['mg-6', 'Subscribe']];
      const root = s.html(`<div class="mg"><div class="mg-cur"></div><div class="mg-grid">${labels.map(([c, l]) => `<button class="mg-b ${c}"><i></i><span>${l}</span></button>`).join('')}</div></div>`);
      const B = [...root.querySelectorAll('.mg-b')].map((n) => ({ n, l: n.querySelector('span'), i: n.querySelector('i'), x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, lx: { x: 0, v: 0 }, ly: { x: 0, v: 0 } }));
      B.forEach((b) => s.on(b.n, 'pointerenter', (e) => { const r = b.n.getBoundingClientRect(); b.i.style.left = e.clientX - r.left + 'px'; b.i.style.top = e.clientY - r.top + 'px'; }));
      B.forEach((b) => s.on(b.n, 'pointerleave', (e) => { const r = b.n.getBoundingClientRect(); b.i.style.left = e.clientX - r.left + 'px'; b.i.style.top = e.clientY - r.top + 'px'; }));
      const p = s.pointer(root);
      const cur = root.querySelector('.mg-cur');
      const CX = { x: 0, v: 0 }, CY = { x: 0, v: 0 }, CW = { x: 12, v: 0 }, CH = { x: 12, v: 0 }, CA = { x: 1, v: 0 };
      s.raf((dt, t) => {
        const rr = root.getBoundingClientRect();
        const g = p.idle ? Lab.ghost(t * 0.9, rr.width, rr.height) : p;
        // 가장 가까운 버튼에 커서가 달라붙어 하이라이트가 된다
        let snap = null, sd = 1e9;
        B.forEach((b) => {
          const r = b.n.getBoundingClientRect();
          const d = Math.hypot(g.x - (r.left - rr.left + r.width / 2), g.y - (r.top - rr.top + r.height / 2));
          if (d < Math.max(r.width, r.height) * 0.9 && d < sd) { sd = d; snap = r; }
        });
        const pad = Math.min(rr.width, rr.height) * 0.025;
        const tw = snap ? snap.width + pad * 2 : p.down ? 8 : 12, th = snap ? snap.height + pad * 2 : p.down ? 8 : 12;
        const tx = snap ? snap.left - rr.left + snap.width / 2 : g.x, ty = snap ? snap.top - rr.top + snap.height / 2 : g.y;
        U.spring(CX, tx, dt, snap ? 260 : 600, 26); U.spring(CY, ty, dt, snap ? 260 : 600, 26);
        U.spring(CW, tw, dt, 260, 22); U.spring(CH, th, dt, 260, 22);
        U.spring(CA, snap ? (p.down ? 0.28 : 0.14) : 1, dt, 200, 20);
        cur.style.width = CW.x + 'px'; cur.style.height = CH.x + 'px';
        cur.style.transform = `translate(${CX.x - CW.x / 2}px,${CY.x - CH.x / 2}px)`;
        cur.style.opacity = CA.x;
        B.forEach((b) => {
          const r = b.n.getBoundingClientRect();
          const cx = r.left - rr.left + r.width / 2 - b.x.x, cy = r.top - rr.top + r.height / 2 - b.y.x;
          const dx = g.x - cx, dy = g.y - cy, d = Math.hypot(dx, dy);
          const R = Math.max(r.width, r.height) * 1.1;
          const on = d < R;
          // 버튼은 크기의 35%, 라벨은 버튼 안쪽 20%까지만 따라간다
          const mx = r.width * 0.35, my = r.height * 0.35;
          U.spring(b.x, on ? U.clamp(dx * 0.4, -mx, mx) : 0, dt, 170, 11); U.spring(b.y, on ? U.clamp(dy * 0.4, -my, my) : 0, dt, 170, 11);
          U.spring(b.lx, on ? U.clamp(dx * 0.15, -r.width * 0.2, r.width * 0.2) : 0, dt, 120, 9); U.spring(b.ly, on ? U.clamp(dy * 0.15, -r.height * 0.2, r.height * 0.2) : 0, dt, 120, 9);
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
    id: 'confetti', cat: 'ui', title: 'Confetti Burst',
    tags: ['particles', 'flutter', 'click'],
    css: `
    .cf{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 60%,#2a1f4a,#120d22)}
    .cf-btn{position:relative;z-index:2;border:0;cursor:pointer;padding:3.4cqmin 7cqmin;border-radius:10cqmin;font:700 4cqmin 'Space Grotesk',sans-serif;color:#fff;
      background:linear-gradient(135deg,#ff5f8f,#ff9a3d);box-shadow:0 1.2cqmin 0 #b83a62,0 2cqmin 5cqmin #ff5f8f66;transition:transform .15s,box-shadow .15s}
    .cf-btn:active{transform:translateY(1cqmin) scale(.96);box-shadow:0 .2cqmin 0 #b83a62,0 1cqmin 3cqmin #ff5f8f66}
    .cf-btn.pop{animation:cf-pop .5s cubic-bezier(.3,1.8,.5,1)}
    @keyframes cf-pop{0%{transform:scale(.9)}100%{transform:scale(1)}}
    .cf canvas{z-index:3;pointer-events:none}
    `,
    mount(el, s) {
      const root = s.html('<div class="cf"><button class="cf-btn">Celebrate</button></div>');
      const btn = root.querySelector('.cf-btn');
      const c = s.canvas({ parent: root }); const { ctx } = c;
      const cols = ['#ff5f8f', '#ffcf3f', '#6bffb8', '#3fb8ff', '#b36bff', '#ffffff', '#ff9a3d'];
      const P = [];
      const burst = (x, y, n, up) => {
        const m = Math.min(c.w, c.h);
        for (let i = 0; i < n; i++) {
          const a = up ? -Math.PI / 2 + U.rand(-0.9, 0.9) : U.rand(U.TAU);
          const v = U.rand(0.6, 1.5) * m * 1.4;
          P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: U.rand(U.TAU), vr: U.rand(-10, 10), tl: U.rand(U.TAU), vt: U.rand(5, 15),
            w: m * U.rand(0.012, 0.022), h: m * U.rand(0.006, 0.012), c: U.pick(cols), life: U.rand(2.5, 4), age: 0, circ: Math.random() < 0.2 });
        }
      };
      const fromBtn = () => {
        const rr = root.getBoundingClientRect(), b = btn.getBoundingClientRect();
        burst(b.left - rr.left + b.width / 2, b.top - rr.top + b.height / 2, s.large ? 160 : 90, true);
        btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      };
      s.on(btn, 'click', (e) => { e.stopPropagation(); fromBtn(); });
      const p = s.pointer(root);
      p.ondown = (e) => { if (e.target !== btn) burst(p.x, p.y, s.large ? 80 : 50, false); };
      let auto = 1;
      s.raf((dt) => {
        const W = c.w, H = c.h;
        if (p.idle) { auto -= dt; if (auto < 0) { auto = 3; fromBtn(); } }
        ctx.clearRect(0, 0, W, H);
        for (let i = P.length - 1; i >= 0; i--) {
          const q = P[i];
          q.age += dt;
          if (q.age > q.life || q.y > H + 40) { P.splice(i, 1); continue; }
          q.vy += Math.min(H, 700) * dt * 1.1;
          const drag = Math.exp(-2.4 * dt);
          q.vx *= drag; q.vy *= drag;
          q.vx += Math.sin(q.tl) * 30 * dt;
          q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; q.tl += q.vt * dt;
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.scale(1, Math.cos(q.tl));
          ctx.globalAlpha = Math.min(1, (q.life - q.age) * 2);
          ctx.fillStyle = q.c;
          if (q.circ) { ctx.beginPath(); ctx.arc(0, 0, q.h, 0, U.TAU); ctx.fill(); } else ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
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
    id: 'carousel-3d', cat: 'ui', title: '3D Carousel',
    tags: ['preserve-3d', 'inertia', 'drag'],
    css: `
    .c3{position:absolute;inset:0;overflow:hidden;perspective:120cqmin;background:radial-gradient(ellipse at 50% 100%,#3b2a6b,#0d0a1a 65%);cursor:grab;touch-action:pan-y}
    .c3:active{cursor:grabbing}
    .c3-ring{position:absolute;left:50%;top:50%;transform-style:preserve-3d;will-change:transform}
    .c3-card{position:absolute;width:24cqmin;height:34cqmin;left:-12cqmin;top:-17cqmin;border-radius:2.4cqmin;padding:2.4cqmin;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;
      font-family:'Space Grotesk',sans-serif;box-shadow:inset 0 0 0 1px #ffffff30;backface-visibility:visible;transition:filter .3s}
    .c3-card b{font-size:3.4cqmin;line-height:1}
    .c3-card small{font:600 1.7cqmin 'JetBrains Mono',monospace;opacity:.75;margin-top:1cqmin;letter-spacing:.1em}
    .c3-card span{position:absolute;top:2cqmin;left:2.4cqmin;font:700 2cqmin 'JetBrains Mono',monospace;opacity:.8}
    .c3-floor{position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(#0000,#0008)}
    `,
    mount(el, s) {
      const N = 10;
      const names = ['Aurora', 'Ember', 'Lagoon', 'Orchid', 'Citrus', 'Glacier', 'Dusk', 'Mint', 'Coral', 'Nova'];
      const root = s.html(`<div class="c3"><div class="c3-ring">${names.map((n, i) => `<div class="c3-card" style="background:linear-gradient(160deg,hsl(${i * 36},90%,65%),hsl(${i * 36 + 40},80%,35%))"><span>0${i}</span><b>${n}</b><small>COLLECTION · ${2020 + i}</small></div>`).join('')}</div><div class="c3-floor"></div></div>`);
      const ring = root.querySelector('.c3-ring');
      const cards = [...ring.children];
      const step = 360 / N;
      let ang = 0, vel = 0, drag = false, lx = 0, last = performance.now();
      const TX = { x: 0, v: 0 };
      s.on(root, 'pointerdown', (e) => { drag = true; lx = e.clientX; vel = 0; last = performance.now(); try { root.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(root, 'pointermove', (e) => { if (!drag) return; const d = e.clientX - lx; lx = e.clientX; ang += d * 0.25; vel = d * 0.25 * 60; last = performance.now(); });
      const up = () => (drag = false);
      s.on(root, 'pointerup', up); s.on(root, 'pointercancel', up);
      const p = s.pointer(root);
      s.raf((dt, t) => {
        const H = root.clientHeight;
        const Rz = H * 0.42;
        if (!drag) {
          const idle = performance.now() - last > 3000;
          if (idle) vel += (-14 - vel) * U.damp(1, dt);
          else {
            vel *= Math.exp(-2.5 * dt);
            if (Math.abs(vel) < 25) { const snap = Math.round(ang / step) * step; vel += (snap - ang) * 30 * dt; vel *= Math.exp(-6 * dt); }
          }
          ang += vel * dt;
        }
        U.spring(TX, p.idle ? Math.sin(t * 0.5) * 6 : (p.ny - 0.5) * -24, dt, 60, 12);
        ring.style.transform = `translateZ(${-Rz}px) rotateX(${TX.x}deg) rotateY(${ang}deg)`;
        cards.forEach((cd, i) => {
          const a = ((i * step + ang) % 360 + 360) % 360;
          const front = Math.cos((a * Math.PI) / 180);
          cd.style.transform = `rotateY(${i * step}deg) translateZ(${Rz}px) scale(${1 + Math.max(0, front - 0.9) * 1.2})`;
          cd.style.filter = `brightness(${0.45 + 0.55 * Math.max(0, front)})`;
        });
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
    id: 'glow-cards', cat: 'ui', title: 'Spotlight Cards',
    tags: ['radial-gradient', 'mask', 'mouse'],
    css: `
    .gc{position:absolute;inset:0;display:grid;place-items:center;background:#08080c}
    .gc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2cqmin;width:min(92cqw,140cqh)}
    .gc-c{--x:-999px;--y:-999px;position:relative;border-radius:2.4cqmin;padding:3cqmin;background:#ffffff08;min-height:26cqmin;color:#fff;font-family:'Space Grotesk',sans-serif;overflow:hidden}
    .gc-c::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:radial-gradient(28cqmin circle at var(--x) var(--y),#ffffffcc,#ffffff14 60%);
      -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
    .gc-c::after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(34cqmin circle at var(--x) var(--y),#7a5cff40,#0000 60%);pointer-events:none}
    .gc-i{width:6cqmin;height:6cqmin;border-radius:1.6cqmin;display:grid;place-items:center;font-size:3.2cqmin;background:#ffffff10;margin-bottom:2.4cqmin}
    .gc-i svg{width:55%;height:55%;color:#d9d4ff}
    .gc-c b{display:block;font-size:2.9cqmin;margin-bottom:.8cqmin}
    .gc-c p{margin:0;font-size:2cqmin;line-height:1.45;color:#ffffff80}
    `,
    mount(el, s) {
      const items = [
        ['<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', 'Instant', 'Edge-rendered in milliseconds.'],
        ['<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 'Secure', 'Encrypted from end to end.'],
        ['<circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="12" cy="15" r="4"/>', 'Themeable', 'Tokens all the way down.'],
        ['<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', 'Analytics', 'See what users actually do.'],
        ['<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="4"/>', 'Composable', 'Small parts, big systems.'],
        ['<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>', 'Global', 'Deployed to 30+ regions.'],
      ];
      const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
      const root = s.html(`<div class="gc"><div class="gc-grid">${items.map(([i, b, t]) => `<div class="gc-c"><div class="gc-i">${icon(i)}</div><b>${b}</b><p>${t}</p></div>`).join('')}</div></div>`);
      const cards = [...root.querySelectorAll('.gc-c')];
      const p = s.pointer(root);
      const X = { x: 0, v: 0 }, Y = { x: 0, v: 0 };
      s.raf((dt, t) => {
        const rr = root.getBoundingClientRect();
        const g = p.idle ? Lab.ghost(t * 0.9, rr.width, rr.height) : p;
        X.x += (g.x - X.x) * U.damp(12, dt); Y.x += (g.y - Y.x) * U.damp(12, dt);
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--x', X.x - (r.left - rr.left) + 'px');
          c.style.setProperty('--y', Y.x - (r.top - rr.top) + 'px');
        });
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
