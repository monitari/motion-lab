/* =========================================================
   추가분 A — 카드 / 유리 / 글자 / 생성
   ========================================================= */
(() => {
  const { U } = Lab;

  const rrect = (x, px, py, w, h, r) => {
    x.beginPath();
    x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
  };
  const starPath = (x, cx, cy, n, r1, r2) => {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * U.TAU - Math.PI / 2, r = i % 2 ? r2 : r1; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    x.closePath();
  };

  /* =======================================================
     Holo Sticker — 잡아서 떼어내는 스티커
     ======================================================= */
  Lab.register({
    id: 'sticker-peel', cat: 'cards', title: 'Holo Sticker',
    tags: ['canvas', 'reflection', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ holo: [0.6, 0, 1, 0.05, '홀로 세기'] });
      let tex, back, S, x0, y0, R;
      const build = () => {
        const m = Math.min(c.w, c.h); S = m * 0.56; R = S * 0.17;
        x0 = (c.w - S) / 2; y0 = (c.h - S) / 2;
        const px = Math.max(2, Math.round(S * c.dpr));
        tex = Lab.offscreen(px, px);
        const x = tex.getContext('2d'); x.scale(c.dpr, c.dpr);
        rrect(x, 0, 0, S, S, R); x.clip();
        const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#1d1b4a'); g.addColorStop(1, '#4a0f4f');
        x.fillStyle = g; x.fillRect(0, 0, S, S);
        x.save(); x.translate(S / 2, S * 0.45);
        for (let i = 0; i < 28; i++) { x.rotate(U.TAU / 28); x.fillStyle = i % 2 ? '#ffffff14' : '#ffffff06'; x.beginPath(); x.moveTo(0, 0); x.lineTo(S, -S * 0.12); x.lineTo(S, S * 0.12); x.fill(); }
        x.restore();
        const sg = x.createLinearGradient(S * 0.2, S * 0.1, S * 0.8, S * 0.8);
        sg.addColorStop(0, '#ffe36b'); sg.addColorStop(0.5, '#ff7ab8'); sg.addColorStop(1, '#7a8bff');
        starPath(x, S / 2, S * 0.43, 5, S * 0.29, S * 0.125); x.fillStyle = sg; x.fill();
        x.lineWidth = S * 0.012; x.strokeStyle = '#fff'; x.stroke();
        x.fillStyle = '#fff'; x.textAlign = 'center';
        x.font = `800 ${S * 0.12}px "Space Grotesk",sans-serif`; x.fillText('MOTION', S / 2, S * 0.84);
        x.font = `600 ${S * 0.045}px "JetBrains Mono",monospace`; x.fillStyle = '#ffffffaa'; x.fillText('L A B   ·   H O L O', S / 2, S * 0.92);
        x.lineWidth = S * 0.05; x.strokeStyle = '#fff'; rrect(x, 0, 0, S, S, R); x.stroke();
        back = Lab.offscreen(px, px);
        const b = back.getContext('2d'); b.scale(c.dpr, c.dpr);
        rrect(b, 0, 0, S, S, R); b.clip();
        b.fillStyle = '#ece8df'; b.fillRect(0, 0, S, S);
        b.strokeStyle = '#00000010'; b.lineWidth = 1;
        for (let i = -S; i < S * 2; i += S * 0.06) { b.beginPath(); b.moveTo(i, 0); b.lineTo(i + S, S); b.stroke(); }
      };
      build();
      c.onresize = build;

      const p = s.pointer(c.cv);
      let state = 'idle', G = null, Pp = null, fly = 0, enter = 1, t0 = 0;
      const nearestEdge = (qx, qy) => {
        const cx = U.clamp(qx, x0, x0 + S), cy = U.clamp(qy, y0, y0 + S);
        const d = [cx - x0, x0 + S - cx, cy - y0, y0 + S - cy];
        const k = d.indexOf(Math.min(...d));
        return k === 0 ? { x: x0, y: cy } : k === 1 ? { x: x0 + S, y: cy } : k === 2 ? { x: cx, y: y0 } : { x: cx, y: y0 + S };
      };
      p.ondown = () => {
        if (state !== 'idle' && state !== 'back') return;
        if (p.x < x0 - 20 || p.x > x0 + S + 20 || p.y < y0 - 20 || p.y > y0 + S + 20) return;
        G = nearestEdge(p.x, p.y); Pp = { x: p.x, y: p.y }; state = 'drag';
      };
      p.onup = () => {
        if (state !== 'drag') return;
        state = Math.hypot(Pp.x - G.x, Pp.y - G.y) > S * 0.85 ? 'fly' : 'back';
        fly = 0;
      };

      const halfPlane = (M, n, d, sgn) => {
        const L = 5000;
        ctx.beginPath();
        ctx.moveTo(M.x - d.x * L, M.y - d.y * L); ctx.lineTo(M.x + d.x * L, M.y + d.y * L);
        ctx.lineTo(M.x + d.x * L + n.x * L * sgn, M.y + d.y * L + n.y * L * sgn); ctx.lineTo(M.x - d.x * L + n.x * L * sgn, M.y - d.y * L + n.y * L * sgn);
        ctx.closePath(); ctx.clip();
      };
      const holo = (t, k) => {
        const sh = ((p.idle ? 0.5 + 0.5 * Math.sin(t * 0.8) : p.nx) + t * 0.05) * S * 2;
        const g = ctx.createLinearGradient(x0 - S + sh, y0, x0 + sh, y0 + S);
        ['#ff0040', '#ffcc00', '#33ff88', '#00ccff', '#aa44ff', '#ff0040'].forEach((col, i) => g.addColorStop(i / 5, col));
        ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = k * P.holo;
        ctx.fillStyle = g; ctx.fillRect(x0, y0, S, S);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      };

      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        ctx.fillStyle = '#26232e'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff08';
        for (let y = 12; y < H; y += 22) for (let x = (y / 22) % 2 ? 11 : 0; x < W; x += 22) ctx.fillRect(x, y, 2, 2);
        ctx.fillStyle = '#ffffff30'; ctx.font = '600 11px "IBM Plex Mono",monospace'; ctx.textAlign = 'center';
        ctx.fillText('DRAG ANY EDGE TO PEEL', W / 2, y0 + S + Math.min(40, (H - S) / 4));

        if (state === 'idle' && p.idle) {
          // 가만히 있으면 모서리가 살짝 들렸다 놓였다
          t0 += dt;
          const a = Math.max(0, Math.sin(t0 * 1.1)) * S * 0.42;
          G = { x: x0 + S, y: y0 + S }; Pp = { x: G.x - a * 0.8, y: G.y - a };
        } else if (state === 'idle') { G = null; }
        if (state === 'drag') { Pp.x = p.x; Pp.y = p.y; }
        if (state === 'back') {
          Pp.x += (G.x - Pp.x) * U.damp(10, dt); Pp.y += (G.y - Pp.y) * U.damp(10, dt);
          if (Math.hypot(Pp.x - G.x, Pp.y - G.y) < 1) { state = 'idle'; G = null; }
        }
        if (state === 'fly') {
          fly += dt;
          const dx = Pp.x - G.x, dy = Pp.y - G.y, l = Math.hypot(dx, dy) || 1;
          const v = 600 + fly * 2400;
          Pp.x += (dx / l) * v * dt; Pp.y += (dy / l) * v * dt - 200 * dt;
          if (l > S * 4) { state = 'enter'; enter = 0; G = null; }
        }
        if (state === 'enter') { enter = Math.min(1, enter + dt * 2.2); if (enter >= 1) state = 'idle'; }

        if (!G || Math.hypot(Pp.x - G.x, Pp.y - G.y) < 0.5) {
          const e = state === 'enter' ? 1 - Math.pow(1 - enter, 3) : 1;
          ctx.save();
          ctx.globalAlpha = e;
          ctx.translate(W / 2, H / 2); ctx.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e); ctx.translate(-W / 2, -H / 2);
          ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12 * c.dpr; ctx.shadowOffsetY = 3 * c.dpr;
          ctx.drawImage(tex, x0, y0, S, S);
          ctx.shadowColor = 'transparent';
          rrect(ctx, x0, y0, S, S, R); ctx.clip(); holo(t, 1);
          ctx.restore();
          return;
        }
        const M = { x: (G.x + Pp.x) / 2, y: (G.y + Pp.y) / 2 };
        const nl = Math.hypot(G.x - Pp.x, G.y - Pp.y);
        const n = { x: (G.x - Pp.x) / nl, y: (G.y - Pp.y) / nl };
        const d = { x: -n.y, y: n.x };
        // 바닥에 붙어 있는 부분
        ctx.save();
        halfPlane(M, n, d, -1);
        ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 10 * c.dpr; ctx.shadowOffsetY = 2 * c.dpr;
        ctx.drawImage(tex, x0, y0, S, S);
        ctx.shadowColor = 'transparent';
        rrect(ctx, x0, y0, S, S, R); ctx.clip(); holo(t, 1);
        ctx.restore();
        // 접힌 부분: 접는 선 기준으로 반사해서 뒷면을 그린다
        const a = d.x * d.x - d.y * d.y, b = 2 * d.x * d.y, dd = d.y * d.y - d.x * d.x;
        ctx.save();
        ctx.transform(a, b, b, dd, M.x - (a * M.x + b * M.y), M.y - (b * M.x + dd * M.y));
        halfPlane(M, n, d, 1);
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18 * c.dpr; ctx.shadowOffsetX = 4 * c.dpr; ctx.shadowOffsetY = 8 * c.dpr;
        ctx.drawImage(back, x0, y0, S, S);
        ctx.shadowColor = 'transparent';
        rrect(ctx, x0, y0, S, S, R); ctx.clip();
        const sh = ctx.createLinearGradient(M.x, M.y, M.x + n.x * S * 0.7, M.y + n.y * S * 0.7);
        sh.addColorStop(0, 'rgba(0,0,0,.28)'); sh.addColorStop(0.18, 'rgba(255,255,255,.35)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.12)');
        ctx.fillStyle = sh; ctx.fillRect(x0 - S, y0 - S, S * 3, S * 3);
        ctx.restore();
      });
    },
  });

  /* =======================================================
     Swipe Deck — 넘겨서 버리는 홀로 카드 더미
     ======================================================= */
  Lab.register({
    id: 'swipe-deck', cat: 'cards', title: 'Swipe Deck',
    tags: ['spring', 'fling', 'drag'],
    css: `
    .sw{position:absolute;inset:0;overflow:hidden;perspective:1100px;background:radial-gradient(ellipse at 50% 30%,#2b2140,#0f0c18 70%);cursor:grab;touch-action:none}
    .sw:active{cursor:grabbing}
    .sw-c{position:absolute;left:0;top:0;will-change:transform}
    .sw-c .hc{--ch:64cqmin;cursor:inherit}
    .sw-st{position:absolute;top:8%;padding:.5em .8em;border:.25em solid;border-radius:.4em;font:800 calc(64cqmin*.06)/1 'Space Grotesk',sans-serif;letter-spacing:.06em;opacity:0;z-index:5;pointer-events:none}
    .sw-st.keep{left:8%;color:#5dff9d;transform:rotate(-14deg)}
    .sw-st.skip{right:8%;color:#ff5d7a;transform:rotate(14deg)}
    .sw-foot{position:absolute;left:0;right:0;bottom:3cqmin;display:flex;justify-content:center;gap:5cqmin;font:500 2.2cqmin 'IBM Plex Mono',monospace;color:#ffffff55;letter-spacing:.12em}
    `,
    mount(el, s) {
      const vs = ['rainbow', 'cosmos', 'gold', 'prism', 'cosmos', 'rainbow'];
      const root = s.html(`<div class="sw">${vs.map((v) => `<div class="sw-c">${Lab.holo.cardHTML(v)}<b class="sw-st keep">KEEP</b><b class="sw-st skip">SKIP</b></div>`).join('')}
        <div class="sw-foot"><span>← SKIP</span><span id="swn">0 kept</span><span>KEEP →</span></div></div>`);
      const wraps = [...root.querySelectorAll('.sw-c')];
      const kept = root.querySelector('#swn');
      let keptN = 0;
      const st = wraps.map(() => ({ x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, r: { x: 0, v: 0 }, k: { x: 0, v: 0 }, out: 0 }));
      let order = wraps.map((_, i) => i);
      let drag = false, sx = 0, sy = 0, lx = 0, vx = 0, lastUser = -1e9, autoT = 0, auto = null;
      s.on(root, 'pointerdown', (e) => {
        drag = true; lastUser = performance.now();
        sx = e.clientX; sy = e.clientY; lx = e.clientX; vx = 0;
        try { root.setPointerCapture(e.pointerId); } catch (_) {}
      });
      s.on(root, 'pointermove', (e) => {
        if (!drag) return;
        const q = st[order[0]];
        q.x.x = e.clientX - sx; q.y.x = (e.clientY - sy) * 0.5;
        vx = (e.clientX - lx) * 60; lx = e.clientX; lastUser = performance.now();
      });
      const release = () => {
        if (!drag) return;
        drag = false;
        const q = st[order[0]], W = root.clientWidth;
        if (Math.abs(q.x.x) > W * 0.2 || Math.abs(vx) > 900) throwTop(Math.sign(q.x.x || vx));
      };
      const throwTop = (dir) => {
        const i = order.shift();
        st[i].out = dir; st[i].x.v = dir * 2400; st[i].y.v = -200;
        if (dir > 0) kept.textContent = ++keptN + ' kept';
        s.timeout(() => { st[i].out = 0; st[i].x.x = 0; st[i].y.x = -40; st[i].x.v = st[i].y.v = 0; order.push(i); }, 550);
      };
      s.on(root, 'pointerup', release); s.on(root, 'pointercancel', release);
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        if (!drag && performance.now() - lastUser > 3000) {
          autoT += dt;
          if (autoT > 1.1 && !auto) { auto = { dir: Math.sin(t * 7) > 0 ? 1 : -1, p: 0 }; autoT = 0; }
          if (auto) {
            auto.p += dt * 1.6;
            const q = st[order[0]];
            q.x.x = Math.sin(Math.min(auto.p, 1) * Math.PI * 0.5) * W * 0.24 * auto.dir;
            if (auto.p >= 1) { throwTop(auto.dir); auto = null; }
          }
        }
        wraps.forEach((w, i) => {
          const q = st[i];
          const k = order.indexOf(i);
          const top = k === 0;
          if (q.out) { q.x.v += q.out * 600 * dt; q.x.x += q.x.v * dt; q.y.v += 900 * dt; q.y.x += q.y.v * dt; }
          else if (!(top && (drag || auto))) { U.spring(q.x, 0, dt, 180, 18); U.spring(q.y, 0, dt, 180, 18); }
          U.spring(q.k, q.out ? 0 : k, dt, 160, 18);
          const rot = q.x.x * 0.05;
          const cw = w.offsetWidth, ch = w.offsetHeight;
          const depth = Math.min(q.k.x, 4);
          w.style.transform = `translate(${W / 2 - cw / 2 + q.x.x}px,${H / 2 - ch / 2 - 4 + q.y.x + depth * 12}px) rotate(${rot}deg) scale(${1 - depth * 0.05})`;
          w.style.zIndex = q.out ? 99 : 50 - k;
          w.style.opacity = k > 3 && !q.out ? 0 : 1;
          const card = w.firstElementChild;
          const nx = U.clamp(q.x.x / (W * 0.3), -1, 1);
          const tx = top ? 0.5 + nx * 0.45 : 0.5, ty = top ? 0.5 + Math.sin(t * 1.3) * 0.15 : 0.5;
          Lab.holo.setVars(card, tx, ty, top ? 0.4 + Math.abs(nx) * 0.6 : 0.25, top ? -q.y.x * 0.05 : 0, top ? nx * 18 : 0);
          w.querySelector('.keep').style.opacity = U.clamp(nx * 2, 0, 1);
          w.querySelector('.skip').style.opacity = U.clamp(-nx * 2, 0, 1);
        });
      });
    },
  });

  /* =======================================================
     Prism — 빛을 일곱 갈래로 나누는 삼각 프리즘
     ======================================================= */
  Lab.register({
    id: 'prism', cat: 'glass', title: 'Dispersion Prism',
    tags: ['ray tracing', 'Snell', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ spread: [0.022, 0.004, 0.05, 0.002, '분산 정도'], bands: [14, 6, 32, 1, '파장 개수'] });
      const ROT = { x: -Math.PI / 2, v: 0 };
      let rotT = -Math.PI / 2;
      const p = s.pointer(c.cv);
      p.ondown = () => (rotT += Math.PI / 9);
      s.on(c.cv, 'wheel', (e) => { if (!s.large) return; rotT += e.deltaY * 0.002; e.preventDefault(); }, { passive: false });
      const cross = (ax, ay, bx, by) => ax * by - ay * bx;
      const trace = (ox, oy, dx, dy, ng, tri, far) => {
        const pts = [[ox, oy]];
        let inside = false;
        for (let it = 0; it < 7; it++) {
          let best = Infinity, ei = -1;
          for (let e = 0; e < 3; e++) {
            const a = tri[e], b = tri[(e + 1) % 3];
            const ex = b[0] - a[0], ey = b[1] - a[1], den = cross(dx, dy, ex, ey);
            if (Math.abs(den) < 1e-9) continue;
            const t = cross(a[0] - ox, a[1] - oy, ex, ey) / den, u = cross(a[0] - ox, a[1] - oy, dx, dy) / den;
            if (t > 1e-3 && u >= 0 && u <= 1 && t < best) { best = t; ei = e; }
          }
          if (ei < 0) { pts.push([ox + dx * far, oy + dy * far]); break; }
          const hx = ox + dx * best, hy = oy + dy * best;
          pts.push([hx, hy]);
          const a = tri[ei], b = tri[(ei + 1) % 3];
          let nx = b[1] - a[1], ny = -(b[0] - a[0]); const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
          if (dx * nx + dy * ny > 0) { nx = -nx; ny = -ny; }
          const eta = inside ? ng : 1 / ng;
          const ci = -(dx * nx + dy * ny), k = 1 - eta * eta * (1 - ci * ci);
          if (k < 0) { const dn = dx * nx + dy * ny; dx -= 2 * dn * nx; dy -= 2 * dn * ny; }
          else { const f = eta * ci - Math.sqrt(k); dx = eta * dx + f * nx; dy = eta * dy + f * ny; inside = !inside; }
          ox = hx + dx * 0.01; oy = hy + dy * 0.01;
        }
        return pts;
      };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        U.spring(ROT, rotT, dt, 60, 12);
        ctx.fillStyle = '#07070b'; ctx.fillRect(0, 0, W, H);
        const cx = W * 0.5, cy = H * 0.52, Rr = m * 0.24;
        const tri = [0, 1, 2].map((i) => [cx + Math.cos(ROT.x + (i * U.TAU) / 3) * Rr, cy + Math.sin(ROT.x + (i * U.TAU) / 3) * Rr]);
        const g = p.idle ? { x: W * 0.12 + Math.sin(t * 0.4) * W * 0.06, y: H * (0.5 + 0.22 * Math.sin(t * 0.6)) } : p;
        let dx = cx - g.x, dy = cy - g.y; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const far = Math.hypot(W, H) * 2;
        const insideTri = (() => { let sg = 0; for (let e = 0; e < 3; e++) { const a = tri[e], b = tri[(e + 1) % 3]; sg += Math.sign(cross(b[0] - a[0], b[1] - a[1], g.x - a[0], g.y - a[1])); } return Math.abs(sg) === 3; })();
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (!insideTri) {
          const white = trace(g.x, g.y, dx, dy, 1.5, tri, far);
          ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = m * 0.03;
          ctx.beginPath(); ctx.moveTo(white[0][0], white[0][1]); ctx.lineTo(white[1][0], white[1][1]); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = m * 0.006; ctx.stroke();
          const nb = Math.round(P.bands);
          for (let i = 0; i < nb; i++) {
            const k = i / (nb - 1);
            const pts = trace(g.x, g.y, dx, dy, 1.46 + k * P.spread * 10, tri, far);
            if (pts.length < 3) continue;
            const hue = k * 275;
            ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]);
            for (let j = 2; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
            ctx.strokeStyle = `hsla(${hue},100%,55%,${0.9 / Math.sqrt(nb)})`; ctx.lineWidth = m * 0.03; ctx.stroke();
            ctx.strokeStyle = `hsla(${hue},100%,62%,${3.2 / nb})`; ctx.lineWidth = m * 0.008; ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        // 프리즘
        ctx.beginPath(); tri.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
        const pg = ctx.createLinearGradient(tri[0][0], tri[0][1], cx, cy + Rr);
        pg.addColorStop(0, 'rgba(255,255,255,.16)'); pg.addColorStop(1, 'rgba(160,200,255,.05)');
        ctx.fillStyle = pg; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.stroke();
        // 광원
        const sg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, m * 0.05);
        sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(g.x, g.y, m * 0.05, 0, U.TAU); ctx.fill();
      });
    },
  });

  /* =======================================================
     ASCII Donut — donut.c, 빛은 커서에서
     ======================================================= */
  Lab.register({
    id: 'ascii-donut', cat: 'text', title: 'ASCII Donut',
    tags: ['donut.c', 'z-buffer', 'drag'],
    css: `
    .ad{position:absolute;inset:0;display:grid;place-items:center;background:#0b0906;overflow:hidden;cursor:grab;touch-action:none}
    .ad:active{cursor:grabbing}
    .ad pre{margin:0;font-family:'IBM Plex Mono','JetBrains Mono',monospace;line-height:1;color:#ffb547;text-shadow:0 0 .4em #ff8a1c88;white-space:pre}
    .ad-l{position:absolute;width:3cqmin;height:3cqmin;margin:-1.5cqmin;border-radius:50%;background:#fff6d8;box-shadow:0 0 3cqmin 1cqmin #ffcf6b;pointer-events:none}
    `,
    mount(el, s) {
      const root = s.html('<div class="ad"><pre></pre><div class="ad-l"></div></div>');
      const pre = root.querySelector('pre'), lamp = root.querySelector('.ad-l');
      const RAMP = ' .,-~:;=!*#$@';
      let cols = 70, rows = 30;
      s.resize(root, (w, h) => {
        cols = s.large ? 110 : 64;
        const fs = w / cols / 0.6;
        rows = Math.max(10, Math.floor(h / fs) - 1);
        pre.style.fontSize = fs + 'px';
      });
      let A = 0.6, B = 0, vA = 0.9, vB = 0.5, drag = false, lx = 0, ly = 0;
      s.on(root, 'pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; try { root.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(root, 'pointermove', (e) => { if (!drag) return; vB = (e.clientX - lx) * 0.6; vA = (e.clientY - ly) * 0.6; lx = e.clientX; ly = e.clientY; });
      s.on(root, 'pointerup', () => (drag = false));
      const p = s.pointer(root, { capture: false });
      const out = [], zb = [];
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        if (!drag) { vA += (0.9 - vA) * U.damp(0.7, dt); vB += (0.5 - vB) * U.damp(0.7, dt); }
        A += vA * dt; B += vB * dt;
        const g = p.idle ? { x: W * (0.5 + 0.35 * Math.cos(t * 0.7)), y: H * (0.5 + 0.35 * Math.sin(t * 0.9)) } : p;
        lamp.style.transform = `translate(${g.x}px,${g.y}px)`;
        let lx2 = (g.x / W - 0.5) * 2, ly2 = -(g.y / H - 0.5) * 2, lz = -0.9;
        const ll = Math.hypot(lx2, ly2, lz); lx2 /= ll; ly2 /= ll; lz /= ll;
        const N = cols * rows;
        for (let i = 0; i < N; i++) { out[i] = ' '; zb[i] = 0; }
        const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
        const K2 = 5, K1 = Math.min(cols, rows / 0.55) * K2 * 0.3 / 3;
        const ts = s.large ? 0.05 : 0.08, ps = s.large ? 0.015 : 0.03;
        for (let th = 0; th < U.TAU; th += ts) {
          const ct = Math.cos(th), st = Math.sin(th);
          for (let ph = 0; ph < U.TAU; ph += ps) {
            const cp = Math.cos(ph), sp = Math.sin(ph);
            const cx = 2 + ct;
            // 원을 y축으로 돌리고, X축(A), Z축(B) 회전
            let x = cx * cp, y = st, z = -cx * sp;
            let nx = ct * cp, ny = st, nz = -ct * sp;
            let y1 = y * cA - z * sA, z1 = y * sA + z * cA;
            let ny1 = ny * cA - nz * sA, nz1 = ny * sA + nz * cA;
            const x2 = x * cB - y1 * sB, y2 = x * sB + y1 * cB;
            const nx2 = nx * cB - ny1 * sB, ny2 = nx * sB + ny1 * cB;
            const zz = z1 + K2, ooz = 1 / zz;
            const xp = Math.floor(cols / 2 + K1 * ooz * x2), yp = Math.floor(rows / 2 - K1 * ooz * y2 * 0.55);
            if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;
            const L = nx2 * lx2 + ny2 * ly2 + nz1 * lz;
            const idx = xp + yp * cols;
            if (ooz > zb[idx]) { zb[idx] = ooz; out[idx] = L > 0 ? RAMP[1 + Math.min(11, Math.floor(L * 12))] : '.'; }
          }
        }
        let str = '';
        for (let r = 0; r < rows; r++) str += out.slice(r * cols, r * cols + cols).join('') + '\n';
        pre.textContent = str;
      });
    },
  });

  /* =======================================================
     Type Drop — 친 글자가 떨어져 쌓인다
     ======================================================= */
  Lab.register({
    id: 'type-drop', cat: 'text', title: 'Type Drop', captureKeys: true,
    tags: ['keyboard', 'collision', 'canvas'],
    css: `
    .td-in{position:absolute;left:50%;top:4cqmin;transform:translateX(-50%);z-index:3;width:min(60cqw,360px);padding:1.4cqmin 2cqmin;border-radius:999px;
      border:1px solid #ffffff2a;background:#ffffff0d;color:#fff;font:600 max(14px,2.4cqmin) 'IBM Plex Mono',monospace;text-align:center;outline:0;letter-spacing:.1em}
    .td-in:focus{border-color:#ff8a3d;background:#ffffff14}
    .td-in::placeholder{color:#ffffff55}`,
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const L = [];
      const cols = ['#ff5f8f', '#ffcf3f', '#3fb8ff', '#6bffb8', '#b36bff', '#ff8a3d', '#f2efe6'];
      let ci = 0;
      const fs = () => Math.min(c.w, c.h) * (s.large ? 0.085 : 0.11);
      const spawn = (ch) => {
        if (ch === ' ') { ci = (ci + 1) % cols.length; return; }
        const f = fs();
        L.push({ ch, x: U.rand(c.w * 0.15, c.w * 0.85), y: -f, vx: U.rand(-40, 40), vy: 0, r: f * 0.4, a: U.rand(-0.4, 0.4), col: cols[ci], born: 0 });
        if (L.length > (s.large ? 160 : 70)) L.shift();
      };
      const jump = () => L.forEach((q) => { q.vy -= U.rand(400, 900); q.vx += U.rand(-300, 300); });
      if (s.large) {
        // 키보드가 없는 기기(폰)에서도 칠 수 있도록 화면 입력창을 둔다
        const inp = s.html('<input class="td-in" type="text" placeholder="탭해서 입력" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="글자 입력">');
        s.on(inp, 'pointerdown', (e) => e.stopPropagation());
        s.on(inp, 'input', () => { for (const ch of inp.value) spawn(ch.toUpperCase()); inp.value = ''; lastKey = performance.now(); });
        s.on(window, 'keydown', (e) => {
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key === 'Backspace') { L.pop(); return; }
          if (e.key === 'Enter') { jump(); return; }
          if (e.target === inp) return; // 입력창 글자는 input 이벤트에서 처리
          if (e.key.length === 1) { spawn(e.key.toUpperCase()); e.preventDefault(); }
        });
      }
      const p = s.pointer(c.cv);
      p.ondown = () => L.forEach((q) => {
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, k = Math.max(0, 1 - d / (c.w * 0.4)) * 1400;
        q.vx += (dx / d) * k; q.vy += (dy / d) * k - 200 * k / 1400;
      });
      const phrases = ['HELLO', 'TYPE SOMETHING', 'MOTION LAB', 'GRAVITY WORKS', 'ENTER = JUMP'];
      let auto = 0, pi = 0, qi = 0, lastKey = -1e9;
      if (s.large) s.on(window, 'keydown', () => (lastKey = performance.now()));
      s.raf((dt) => {
        const W = c.w, H = c.h;
        if (performance.now() - lastKey > 4000) {
          auto -= dt;
          if (auto < 0) {
            const ph = phrases[pi];
            spawn(ph[qi]); qi++;
            auto = 0.11;
            if (qi >= ph.length) { qi = 0; pi = (pi + 1) % phrases.length; auto = 1.4; ci = (ci + 1) % cols.length; }
          }
        }
        const h = Math.min(dt, 1 / 30) / 3;
        for (let sub = 0; sub < 3; sub++) {
          for (const q of L) {
            q.vy += 1600 * h; q.x += q.vx * h; q.y += q.vy * h; q.a += (q.vx / q.r) * h * 0.6;
            if (q.y > H - q.r) { q.y = H - q.r; q.vy *= -0.25; q.vx *= 0.9; }
            if (q.x < q.r) { q.x = q.r; q.vx *= -0.4; } if (q.x > W - q.r) { q.x = W - q.r; q.vx *= -0.4; }
          }
          for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
            const a = L[i], b = L[j], dx = b.x - a.x, dy = b.y - a.y, md = a.r + b.r, d2 = dx * dx + dy * dy;
            if (d2 < md * md && d2 > 0) {
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (md - d) / 2;
              a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
              const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rv < 0) { const im = rv * 0.6; a.vx += nx * im; a.vy += ny * im; b.vx -= nx * im; b.vy -= ny * im; }
            }
          }
        }
        ctx.fillStyle = '#151318'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff22'; ctx.font = `500 ${Math.max(10, H * 0.022)}px "IBM Plex Mono",monospace`; ctx.textAlign = 'center';
        ctx.fillText(s.large ? 'ENTER JUMP  ·  ⌫ DELETE' : 'OPEN AND TYPE', W / 2, s.large ? H * 0.17 : H * 0.08);
        ctx.textBaseline = 'middle';
        for (const q of L) {
          q.born = Math.min(1, q.born + dt * 6);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.scale(q.born, q.born);
          ctx.font = `800 ${q.r * 2.3}px "Space Grotesk",sans-serif`;
          ctx.fillStyle = q.col; ctx.fillText(q.ch, 0, q.r * 0.08);
          ctx.restore();
        }
      });
    },
  });

  /* =======================================================
     Mandala Paint — 대칭으로 그려지는 붓
     ======================================================= */
  Lab.register({
    id: 'mandala', cat: 'canvas', title: 'Mandala Paint',
    tags: ['symmetry', 'paint', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ sym: [12, 2, 32, 1, '대칭 수'], mirror: [1, 0, 1, 1, '거울 (0/1)'], width: [2.2, 0.5, 10, 0.1, '굵기'] });
      const clear = () => {
        ctx.fillStyle = '#0a0910'; ctx.fillRect(0, 0, c.w, c.h);
        ctx.strokeStyle = '#ffffff0b'; ctx.lineWidth = 1;
        const n = Math.round(P.sym);
        for (let i = 0; i < n; i++) { const a = (i / n) * U.TAU; ctx.beginPath(); ctx.moveTo(c.w / 2, c.h / 2); ctx.lineTo(c.w / 2 + Math.cos(a) * c.w, c.h / 2 + Math.sin(a) * c.w); ctx.stroke(); }
      };
      clear(); c.onresize = clear;
      s.on(c.cv, 'dblclick', clear);
      const p = s.pointer(c.cv);
      let last = null, hue = 0, ghostT = 0, ghostClear = 0;
      const seg = (x0, y0, x1, y1, w) => {
        const cx = c.w / 2, cy = c.h / 2, n = Math.round(P.sym);
        ctx.save(); ctx.translate(cx, cy);
        for (let i = 0; i < n; i++) {
          for (let mi = 0; mi <= (P.mirror >= 0.5 ? 1 : 0); mi++) {
            ctx.save(); ctx.rotate((i / n) * U.TAU); if (mi) ctx.scale(1, -1);
            ctx.beginPath(); ctx.moveTo(x0 - cx, y0 - cy); ctx.lineTo(x1 - cx, y1 - cy);
            ctx.strokeStyle = `hsla(${hue},95%,60%,.18)`; ctx.lineWidth = w * 4; ctx.stroke();
            ctx.strokeStyle = `hsla(${hue},95%,72%,.9)`; ctx.lineWidth = w; ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      };
      s.raf((dt, t) => {
        hue = (hue + dt * 40) % 360;
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        let q = null;
        if (p.down) q = { x: p.x, y: p.y };
        else if (p.idle) {
          ghostT += dt; ghostClear += dt;
          if (ghostClear > 14) { ghostClear = 0; ctx.globalCompositeOperation = 'source-over'; clear(); last = null; }
          const m = Math.min(c.w, c.h);
          const r = m * (0.12 + 0.3 * Math.abs(Math.sin(ghostT * 0.37)));
          q = { x: c.w / 2 + Math.cos(ghostT * 1.3) * r, y: c.h / 2 + Math.sin(ghostT * 0.9) * r * 0.8 };
        }
        if (q && last) {
          const sp = Math.hypot(q.x - last.x, q.y - last.y);
          seg(last.x, last.y, q.x, q.y, P.width * U.clamp(1.6 - sp / 40, 0.4, 1.6));
        }
        last = q;
        ctx.globalCompositeOperation = 'source-over';
      });
    },
  });

  /* =======================================================
     Reaction Diffusion — Gray-Scott
     ======================================================= */
  Lab.register({
    id: 'reaction-diffusion', cat: 'canvas', title: 'Reaction Diffusion', feature: true,
    tags: ['Gray-Scott', 'pattern', 'paint'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ feed: [0.037, 0.01, 0.09, 0.001, 'feed'], kill: [0.06, 0.045, 0.07, 0.0005, 'kill'], speed: [10, 2, 24, 1, '반복/프레임'] });
      let gw, gh, A, B, A2, B2, img, off, offx;
      const seed = (x, y, r) => {
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
          const xx = x + i, yy = y + j;
          if (xx < 1 || yy < 1 || xx >= gw - 1 || yy >= gh - 1 || i * i + j * j > r * r) continue;
          B[yy * gw + xx] = 1;
        }
      };
      const init = () => {
        gw = s.large ? 240 : 130; gh = Math.max(10, Math.round((gw * c.h) / c.w));
        A = new Float32Array(gw * gh).fill(1); B = new Float32Array(gw * gh); A2 = new Float32Array(gw * gh); B2 = new Float32Array(gw * gh);
        off = Lab.offscreen(gw, gh); offx = off.getContext('2d'); img = offx.createImageData(gw, gh);
        for (let k = 0; k < 14; k++) seed(Math.floor(U.rand(gw * 0.1, gw * 0.9)), Math.floor(U.rand(gh * 0.1, gh * 0.9)), 3);
      };
      init(); c.onresize = init;
      const pal = [[8, 10, 30], [20, 40, 90], [30, 130, 170], [190, 240, 230], [255, 200, 120]];
      const lut = new Uint8Array(256 * 3);
      for (let i = 0; i < 256; i++) {
        const t = (i / 255) * (pal.length - 1), k = Math.min(pal.length - 2, Math.floor(t)), f = t - k;
        for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = pal[k][ch] + (pal[k + 1][ch] - pal[k][ch]) * f;
      }
      const p = s.pointer(c.cv);
      p.ondown = () => seed(Math.floor((p.x / c.w) * gw), Math.floor((p.y / c.h) * gh), 6);
      // 1/60초마다 speed번 반복. 무거우니 한 프레임에 최대 두 스텝까지만 따라잡는다
      const step = s.fixed(1 / 60, (h, t) => {
        const g = p.idle ? Lab.ghost(t * 0.5, c.w, c.h) : p;
        if (p.down || p.idle) seed(Math.floor((g.x / c.w) * gw), Math.floor((g.y / c.h) * gh), 2);
        const f = P.feed, k = P.kill;
        for (let it = 0; it < P.speed; it++) {
          for (let y = 1; y < gh - 1; y++) {
            let i = y * gw + 1;
            for (let x = 1; x < gw - 1; x++, i++) {
              const a = A[i], b = B[i];
              const la = (A[i - 1] + A[i + 1] + A[i - gw] + A[i + gw]) * 0.2 + (A[i - gw - 1] + A[i - gw + 1] + A[i + gw - 1] + A[i + gw + 1]) * 0.05 - a;
              const lb = (B[i - 1] + B[i + 1] + B[i - gw] + B[i + gw]) * 0.2 + (B[i - gw - 1] + B[i - gw + 1] + B[i + gw - 1] + B[i + gw + 1]) * 0.05 - b;
              const abb = a * b * b;
              // 같은 자리에 씨앗이 계속 들어오면 명시적 적분이 발산하므로 0..1로 묶는다
              const na = a + la - abb + f * (1 - a), nb = b + 0.5 * lb + abb - (k + f) * b;
              A2[i] = na < 0 ? 0 : na > 1 ? 1 : na;
              B2[i] = nb < 0 ? 0 : nb > 1 ? 1 : nb;
            }
          }
          let tmp = A; A = A2; A2 = tmp; tmp = B; B = B2; B2 = tmp;
        }
      }, 2);
      s.raf((dt, t) => {
        step(dt, t);
        const d = img.data;
        for (let i = 0, j = 0; i < A.length; i++, j += 4) {
          const v = Math.max(0, Math.min(255, ((B[i] * 2.6 - A[i] * 0.2 + 0.2) * 255) | 0)) * 3;
          d[j] = lut[v]; d[j + 1] = lut[v + 1]; d[j + 2] = lut[v + 2]; d[j + 3] = 255;
        }
        offx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, c.w, c.h);
      });
    },
  });

  /* =======================================================
     Lorenz Attractor
     ======================================================= */
  Lab.register({
    id: 'lorenz', cat: 'canvas', title: 'Lorenz Attractor',
    tags: ['chaos', '3D', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ sigma: [10, 1, 20, 0.1, 'σ'], rho: [28, 5, 50, 0.1, 'ρ'], beta: [2.667, 0.5, 5, 0.01, 'β'], speed: [1, 0.2, 3, 0.05, '속도'] });
      const N = s.large ? 700 : 260, TL = 26;
      const pts = Array.from({ length: N }, (_, i) => ({ x: U.rand(-15, 15), y: U.rand(-20, 20), z: U.rand(5, 40), tr: new Float32Array(TL * 3), h: 0, n: 0, hue: 180 + (i / N) * 160 }));
      // 처음부터 나비 모양이 보이도록 미리 굴려둔다
      for (const q of pts) for (let k = 0; k < 300; k++) { const dx = 10 * (q.y - q.x), dy = q.x * (28 - q.z) - q.y, dz = q.x * q.y - 2.667 * q.z; q.x += dx * 0.005; q.y += dy * 0.005; q.z += dz * 0.005; }
      let yaw = 0.6, pitch = 0.25, vy = 0.15, vp = 0, drag = false, lx = 0, ly = 0;
      const p = s.pointer(c.cv);
      p.ondown = () => { drag = true; lx = p.x; ly = p.y; };
      p.onup = () => (drag = false);
      s.raf((dt) => {
        const W = c.w, H = c.h;
        if (drag) { vy = ((p.x - lx) / W) * 4 / Math.max(dt, 1e-3); vp = ((p.y - ly) / H) * 4 / Math.max(dt, 1e-3); lx = p.x; ly = p.y; }
        else { vy += (0.15 - vy) * U.damp(1, dt); vp *= Math.exp(-3 * dt); }
        yaw += vy * dt; pitch = U.clamp(pitch + vp * dt, -1.3, 1.3);
        const h = 0.005 * P.speed;
        for (const q of pts) {
          for (let k = 0; k < 2; k++) {
            const dx = P.sigma * (q.y - q.x), dy = q.x * (P.rho - q.z) - q.y, dz = q.x * q.y - P.beta * q.z;
            q.x += dx * h; q.y += dy * h; q.z += dz * h;
          }
          if (!Number.isFinite(q.x) || Math.abs(q.x) > 1e4) { q.x = U.rand(-1, 1); q.y = U.rand(-1, 1); q.z = 20; q.n = 0; }
          q.h = (q.h + 1) % TL; q.tr[q.h * 3] = q.x; q.tr[q.h * 3 + 1] = q.y; q.tr[q.h * 3 + 2] = q.z - 25; q.n = Math.min(TL, q.n + 1);
        }
        ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
        const cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
        const sc = Math.min(W, H) / 62;
        const proj = (x, y, z) => {
          const x1 = x * cY - y * sY, y1 = x * sY + y * cY;
          const y2 = y1 * cP - z * sP, z2 = y1 * sP + z * cP;
          const f = 90 / (90 + y2);
          return [W / 2 + x1 * sc * f, H / 2 - z2 * sc * f];
        };
        ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = s.large ? 1.4 : 1;
        for (const q of pts) {
          if (q.n < 2) continue;
          ctx.beginPath();
          for (let k = 0; k < q.n; k++) {
            const i = ((q.h - k + TL) % TL) * 3;
            const [sx, sy] = proj(q.tr[i], q.tr[i + 1], q.tr[i + 2]);
            k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
          }
          ctx.strokeStyle = `hsla(${q.hue},90%,62%,.55)`; ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff40'; ctx.font = `500 ${Math.max(10, H * 0.022)}px "IBM Plex Mono",monospace`; ctx.textAlign = 'left';
        ctx.fillText(`σ ${P.sigma.toFixed(1)}  ρ ${P.rho.toFixed(1)}  β ${P.beta.toFixed(2)}`, 14, H - 14);
      });
    },
  });
})();
