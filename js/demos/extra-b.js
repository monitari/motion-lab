/* =========================================================
   추가분 B — 물리 / 셰이더 / 인터랙션
   ========================================================= */
(() => {
  const { U } = Lab;
  const hsv = (h, s, v) => { const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5), f(3), f(1)]; };

  /* 모든 데모가 함께 쓰는 짧은 효과음 (크게 연 상태에서만) */
  let actx = null;
  const sfx = (fn) => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      fn(actx, actx.currentTime);
    } catch (_) {}
  };

  /* =======================================================
     Stable Fluids — Jos Stam 방식 유체
     ======================================================= */
  Lab.register({
    id: 'fluid', cat: 'physics', title: 'Ink in Water', feature: true,
    tags: ['stable fluids', 'advection', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ force: [1, 0.2, 3, 0.05, '힘'], fade: [0.992, 0.95, 1, 0.001, '잉크 유지'], swirl: [0.25, 0, 1, 0.05, '소용돌이 보존'] });
      let N, M, S, u, v, u0, v0, r, g, b, tmp, img, off, offx;
      const IX = (i, j) => i + (N + 2) * j;
      const init = () => {
        N = s.large ? 150 : 80; M = Math.max(8, Math.round((N * c.h) / c.w)); S = (N + 2) * (M + 2);
        [u, v, u0, v0, r, g, b, tmp] = Array.from({ length: 8 }, () => new Float32Array(S));
        off = Lab.offscreen(N, M); offx = off.getContext('2d'); img = offx.createImageData(N, M);
      };
      init(); c.onresize = init;
      const bnd = (bb, x) => {
        for (let i = 1; i <= N; i++) { x[IX(i, 0)] = bb === 2 ? -x[IX(i, 1)] : x[IX(i, 1)]; x[IX(i, M + 1)] = bb === 2 ? -x[IX(i, M)] : x[IX(i, M)]; }
        for (let j = 1; j <= M; j++) { x[IX(0, j)] = bb === 1 ? -x[IX(1, j)] : x[IX(1, j)]; x[IX(N + 1, j)] = bb === 1 ? -x[IX(N, j)] : x[IX(N, j)]; }
      };
      const advect = (bb, d, d0, uu, vv, dt) => {
        const dt0 = dt * N;
        for (let j = 1; j <= M; j++) for (let i = 1; i <= N; i++) {
          let x = i - dt0 * uu[IX(i, j)], y = j - dt0 * vv[IX(i, j)];
          x = U.clamp(x, 0.5, N + 0.5); y = U.clamp(y, 0.5, M + 0.5);
          const i0 = x | 0, j0 = y | 0, s1 = x - i0, t1 = y - j0, s0 = 1 - s1, t0 = 1 - t1;
          d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j0 + 1)]) + s1 * (t0 * d0[IX(i0 + 1, j0)] + t1 * d0[IX(i0 + 1, j0 + 1)]);
        }
        bnd(bb, d);
      };
      const project = (uu, vv, p, div) => {
        const h = 1 / N;
        for (let j = 1; j <= M; j++) for (let i = 1; i <= N; i++) {
          div[IX(i, j)] = -0.5 * h * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] + vv[IX(i, j + 1)] - vv[IX(i, j - 1)]);
          p[IX(i, j)] = 0;
        }
        bnd(0, div); bnd(0, p);
        for (let k = 0; k < 18; k++) {
          for (let j = 1; j <= M; j++) for (let i = 1; i <= N; i++) p[IX(i, j)] = (div[IX(i, j)] + p[IX(i - 1, j)] + p[IX(i + 1, j)] + p[IX(i, j - 1)] + p[IX(i, j + 1)]) / 4;
          bnd(0, p);
        }
        for (let j = 1; j <= M; j++) for (let i = 1; i <= N; i++) {
          uu[IX(i, j)] -= (0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)])) / h;
          vv[IX(i, j)] -= (0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)])) / h;
        }
        bnd(1, uu); bnd(2, vv);
      };
      const p = s.pointer(c.cv);
      let lx = null, ly = null, hue = 0;
      const last2 = { x: null, y: null };
      // 점 (x,y)에 속도와 잉크를 넣는다
      const emit = (x, y, dx, dy, hh, ink, h) => {
        const W = c.w, H = c.h;
        const ci = Math.round((x / W) * N), cj = Math.round((y / H) * M);
        const [cr, cg, cb] = hsv(hh, 0.85, 1);
        const rad = s.large ? 4 : 3;
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
          const ii = ci + i, jj = cj + j;
          if (ii < 1 || jj < 1 || ii > N || jj > M) continue;
          const f = Math.exp(-(i * i + j * j) / (rad * 0.8));
          const k = IX(ii, jj);
          u[k] += ((dx / W) / h) * 0.9 * P.force * f;
          v[k] += ((dy / W) / h) * 0.9 * P.force * f;
          const amt = ink * f;
          r[k] += cr * amt; g[k] += cg * amt; b[k] += cb * amt;
        }
      };
      s.raf((dt, t) => {
        if (dt <= 0) return;
        const h = Math.min(dt, 1 / 30);
        const W = c.w, H = c.h;
        const q = p.idle ? Lab.ghost(t * 1.2, W, H) : p;
        hue = (hue + h * 0.08) % 1;
        if (lx !== null) {
          const dx = q.x - lx, dy = q.y - ly;
          // 가만히 있을 땐 잉크를 넉넉히, 직접 휘저을 땐 속도만큼
          const ink = p.idle ? 0.35 : Math.min(1, Math.hypot(dx, dy) / 8) * 0.6 + (p.down ? 0.3 : 0);
          emit(q.x, q.y, dx, dy, hue, ink, h);
        }
        lx = q.x; ly = q.y;
        if (p.idle) {
          // 두 번째 붓: 반대 위상, 보색
          const q2 = Lab.ghost(t * 1.2 + 3.1, W, H, 2);
          if (last2.x !== null) emit(q2.x, q2.y, q2.x - last2.x, q2.y - last2.y, (hue + 0.5) % 1, 0.35, h);
          last2.x = q2.x; last2.y = q2.y;
        } else last2.x = null;
        // 속도
        u0.set(u); v0.set(v);
        advect(1, u, u0, u0, v0, h); advect(2, v, v0, u0, v0, h);
        project(u, v, u0, v0);
        const keep = 0.98 + P.swirl * 0.019;
        for (let i = 0; i < S; i++) { u[i] *= keep; v[i] *= keep; }
        // 잉크
        for (const d of [r, g, b]) { tmp.set(d); advect(0, d, tmp, u, v, h); for (let i = 0; i < S; i++) d[i] *= P.fade; }
        const D = img.data;
        for (let j = 1; j <= M; j++) for (let i = 1; i <= N; i++) {
          const k = IX(i, j), o = ((j - 1) * N + (i - 1)) * 4;
          D[o] = 255 * (1 - Math.exp(-r[k] * 1.6)) + 8;
          D[o + 1] = 255 * (1 - Math.exp(-g[k] * 1.6)) + 8;
          D[o + 2] = 255 * (1 - Math.exp(-b[k] * 1.6)) + 14;
          D[o + 3] = 255;
        }
        offx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, W, H);
      });
    },
  });

  /* =======================================================
     Magnetic Field — 자석과 자기력선
     ======================================================= */
  Lab.register({
    id: 'magnets', cat: 'physics', title: 'Magnetic Field',
    tags: ['field lines', 'dipole', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ lines: [16, 4, 40, 1, '극당 자기력선'], filings: [1, 0, 1, 1, '철가루 (0/1)'] });
      let mags = [];
      const init = () => {
        const m = Math.min(c.w, c.h);
        mags = [{ x: c.w * 0.35, y: c.h * 0.5, a: 0 }, { x: c.w * 0.65, y: c.h * 0.45, a: Math.PI * 0.75 }, ...(s.large ? [{ x: c.w * 0.5, y: c.h * 0.78, a: Math.PI / 2 }] : [])].map((q) => ({ ...q, ta: q.a, len: m * 0.16 }));
      };
      init(); c.onresize = init;
      const poles = () => {
        const out = [];
        for (const q of mags) { const dx = Math.cos(q.a) * q.len / 2, dy = Math.sin(q.a) * q.len / 2; out.push([q.x + dx, q.y + dy, 1], [q.x - dx, q.y - dy, -1]); }
        return out;
      };
      const field = (x, y, ps) => {
        let bx = 0, by = 0;
        for (const [px, py, qq] of ps) { const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy + 30, d = Math.sqrt(d2); bx += (qq * dx) / (d2 * d); by += (qq * dy) / (d2 * d); }
        return [bx, by];
      };
      const p = s.pointer(c.cv);
      let grab = null, gox = 0, goy = 0, moved = 0;
      p.ondown = () => {
        grab = mags.find((q) => Math.hypot(p.x - q.x, p.y - q.y) < q.len * 0.6) || null;
        if (grab) { gox = grab.x - p.x; goy = grab.y - p.y; moved = 0; }
      };
      p.onup = () => { if (grab && moved < 4) grab.ta += Math.PI / 4; grab = null; };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        if (grab) { moved += Math.hypot(p.x + gox - grab.x, p.y + goy - grab.y); grab.x = p.x + gox; grab.y = p.y + goy; }
        if (p.idle && !grab) mags.forEach((q, i) => { q.ta += dt * (i % 2 ? -0.25 : 0.2); });
        mags.forEach((q) => (q.a += (q.ta - q.a) * U.damp(8, dt)));
        const ps = poles();
        ctx.fillStyle = '#efeae0'; ctx.fillRect(0, 0, W, H);
        if (P.filings >= 0.5) {
          const sp = s.large ? 15 : 13;
          ctx.strokeStyle = '#2a2622'; ctx.lineCap = 'round';
          for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) {
            const jx = x + Math.sin(x * 12.9 + y * 7.1) * 3, jy = y + Math.cos(x * 3.7 + y * 9.3) * 3;
            const [bx, by] = field(jx, jy, ps); const bm = Math.hypot(bx, by) || 1e-9;
            const a = U.clamp(Math.log10(bm * m * m * 0.6) * 0.45 + 0.3, 0.06, 0.9);
            const l = sp * 0.42;
            ctx.globalAlpha = a; ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(jx - (bx / bm) * l, jy - (by / bm) * l); ctx.lineTo(jx + (bx / bm) * l, jy + (by / bm) * l); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        const nl = Math.round(P.lines);
        ctx.lineWidth = s.large ? 1.6 : 1.2;
        ps.forEach(([px, py, qq], pi) => {
          if (qq < 0) return;
          for (let k = 0; k < nl; k++) {
            const a = (k / nl) * U.TAU;
            let x = px + Math.cos(a) * 5, y = py + Math.sin(a) * 5;
            ctx.beginPath(); ctx.moveTo(x, y);
            for (let st = 0; st < 420; st++) {
              const [bx, by] = field(x, y, ps); const bm = Math.hypot(bx, by) || 1e-9;
              x += (bx / bm) * 4; y += (by / bm) * 4;
              ctx.lineTo(x, y);
              if (x < -20 || y < -20 || x > W + 20 || y > H + 20) break;
              if (ps.some(([sx, sy, sq]) => sq < 0 && Math.hypot(x - sx, y - sy) < 6)) break;
            }
            ctx.strokeStyle = `hsla(${(pi * 70 + 200) % 360},70%,45%,.55)`; ctx.stroke();
          }
        });
        mags.forEach((q) => {
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
          const L = q.len, Hh = L * 0.28;
          ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#e8463b'; ctx.fillRect(0, -Hh / 2, L / 2, Hh);
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = '#2f6fd6'; ctx.fillRect(-L / 2, -Hh / 2, L / 2, Hh);
          ctx.fillStyle = '#fff'; ctx.font = `700 ${Hh * 0.6}px "Space Grotesk",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('N', L / 4, 1); ctx.fillText('S', -L / 4, 1);
          ctx.restore();
        });
      });
    },
  });

  /* =======================================================
     Planet Sling — 당겨서 쏘는 궤도
     ======================================================= */
  Lab.register({
    id: 'planets', cat: 'physics', title: 'Orbit Sling',
    tags: ['n-body', 'prediction', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ G: [1, 0.3, 3, 0.05, '중력 세기'] });
      const B = [];
      const stars = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random()]);
      let aim = null, auto = 0.5, flashes = [];
      const GM = () => Math.min(c.w, c.h) ** 3 * 0.9 * P.G;
      const accel = (x, y, self) => {
        const cx = c.w / 2, cy = c.h / 2;
        let dx = cx - x, dy = cy - y, d2 = dx * dx + dy * dy + 50, d = Math.sqrt(d2);
        let ax = (GM() * dx) / (d2 * d), ay = (GM() * dy) / (d2 * d);
        for (const o of B) {
          if (o === self) continue;
          dx = o.x - x; dy = o.y - y; d2 = dx * dx + dy * dy + 40; d = Math.sqrt(d2);
          const k = (GM() * 0.0004 * o.m) / (d2 * d); ax += dx * k; ay += dy * k;
        }
        return [ax, ay];
      };
      const launch = (x, y, vx, vy) => {
        const m = U.rand(0.6, 2);
        B.push({ x, y, vx, vy, m, r: Math.min(c.w, c.h) * 0.008 * Math.cbrt(m), hue: U.rand(0, 360), tr: [] });
        if (B.length > 24) B.shift();
      };
      const p = s.pointer(c.cv);
      p.ondown = () => (aim = { x: p.x, y: p.y });
      p.onup = () => { if (aim) { launch(aim.x, aim.y, (aim.x - p.x) * 2.2, (aim.y - p.y) * 2.2); aim = null; } };
      s.raf((dt) => {
        const W = c.w, H = c.h, cx = W / 2, cy = H / 2, m = Math.min(W, H);
        if (p.idle && !aim) {
          auto -= dt;
          if (auto < 0) {
            auto = 1.6;
            const a = U.rand(U.TAU), r = U.rand(m * 0.18, m * 0.42);
            const v = Math.sqrt(GM() / r) * U.rand(0.8, 1.15);
            launch(cx + Math.cos(a) * r, cy + Math.sin(a) * r, -Math.sin(a) * v, Math.cos(a) * v);
          }
        }
        const sub = 4, h = Math.min(dt, 1 / 30) / sub;
        for (let k = 0; k < sub; k++) {
          for (const q of B) { const [ax, ay] = accel(q.x, q.y, q); q.vx += ax * h; q.vy += ay * h; }
          for (const q of B) { q.x += q.vx * h; q.y += q.vy * h; }
        }
        for (let i = B.length - 1; i >= 0; i--) {
          const q = B[i];
          q.tr.push(q.x, q.y); if (q.tr.length > 240) q.tr.splice(0, 2);
          const dc = Math.hypot(q.x - cx, q.y - cy);
          if (dc < m * 0.045 || dc > m * 3) { if (dc < m * 0.05) flashes.push({ x: q.x, y: q.y, t: 0, hue: q.hue }); B.splice(i, 1); continue; }
          for (let j = i - 1; j >= 0; j--) {
            const o = B[j];
            if (Math.hypot(o.x - q.x, o.y - q.y) < o.r + q.r) {
              const mm = o.m + q.m;
              o.vx = (o.vx * o.m + q.vx * q.m) / mm; o.vy = (o.vy * o.m + q.vy * q.m) / mm; o.m = mm; o.r = m * 0.008 * Math.cbrt(mm);
              flashes.push({ x: q.x, y: q.y, t: 0, hue: q.hue }); B.splice(i, 1); break;
            }
          }
        }
        ctx.fillStyle = '#04040a'; ctx.fillRect(0, 0, W, H);
        stars.forEach(([x, y, b]) => { ctx.fillStyle = `rgba(255,255,255,${b * 0.6})`; ctx.fillRect(x * W, y * H, 1.2, 1.2); });
        const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * 0.16);
        sg.addColorStop(0, '#fff8e0'); sg.addColorStop(0.18, '#ffd36b'); sg.addColorStop(0.4, 'rgba(255,140,40,.35)'); sg.addColorStop(1, 'rgba(255,100,20,0)');
        ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, m * 0.16, 0, U.TAU); ctx.fill();
        ctx.lineCap = 'round';
        for (const q of B) {
          const n = q.tr.length / 2;
          for (let i = 1; i < n; i++) {
            ctx.strokeStyle = `hsla(${q.hue},90%,65%,${(i / n) * 0.7})`; ctx.lineWidth = q.r * 0.8 * (i / n);
            ctx.beginPath(); ctx.moveTo(q.tr[(i - 1) * 2], q.tr[(i - 1) * 2 + 1]); ctx.lineTo(q.tr[i * 2], q.tr[i * 2 + 1]); ctx.stroke();
          }
          const pg = ctx.createRadialGradient(q.x - q.r * 0.3, q.y - q.r * 0.3, 0, q.x, q.y, q.r);
          pg.addColorStop(0, `hsl(${q.hue},90%,85%)`); pg.addColorStop(1, `hsl(${q.hue},70%,45%)`);
          ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, U.TAU); ctx.fill();
        }
        flashes = flashes.filter((f) => (f.t += dt) < 0.6);
        flashes.forEach((f) => { ctx.strokeStyle = `hsla(${f.hue},100%,70%,${1 - f.t / 0.6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 4 + f.t * 60, 0, U.TAU); ctx.stroke(); });
        if (aim) {
          // 예측 궤도
          let x = aim.x, y = aim.y, vx = (aim.x - p.x) * 2.2, vy = (aim.y - p.y) * 2.2;
          ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let k = 0; k < 500; k++) {
            const [ax, ay] = accel(x, y, null); vx += ax / 240; vy += ay / 240; x += vx / 240; y += vy / 240;
            ctx.lineTo(x, y);
            if (Math.hypot(x - cx, y - cy) < m * 0.045) break;
          }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(255,120,80,.9)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(aim.x, aim.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(aim.x, aim.y, 4, 0, U.TAU); ctx.fill();
        }
      });
    },
  });

  /* =======================================================
     String Lights — 커서로 흔드는 전구 줄
     ======================================================= */
  Lab.register({
    id: 'string-lights', cat: 'physics', title: 'String Lights',
    tags: ['verlet rope', 'glow', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      let ropes = [];
      const init = () => {
        const W = c.w, H = c.h, n = s.large ? 34 : 24;
        ropes = [[0.08, 0.92, 0.12, 0.2], [0.05, 0.95, 0.32, 0.28], [0.1, 0.9, 0.5, 0.55]].map(([ax, bx, ay, by], ri) => {
          const A = { x: W * ax, y: H * ay }, Bp = { x: W * bx, y: H * by };
          const len = (Math.hypot(Bp.x - A.x, Bp.y - A.y) * 1.12) / (n - 1);
          const pts = Array.from({ length: n }, (_, i) => { const t = i / (n - 1); const x = U.lerp(A.x, Bp.x, t), y = U.lerp(A.y, Bp.y, t); return { x, y, ox: x, oy: y, pin: i === 0 || i === n - 1 }; });
          return { pts, len, ri };
        });
      };
      init(); c.onresize = init;
      let mode = 0, lx = 0, ly = 0;
      const p = s.pointer(c.cv);
      p.ondown = () => (mode = (mode + 1) % 3);
      const warm = ['#ffcf7a', '#ffd89a', '#ffc46b'], rgb = ['#ff4d5e', '#ffd23f', '#4dff9b', '#4db8ff', '#c46bff'];
      let g = { x: -1e4, y: -1e4 }, mvx = 0, mvy = 0;
      // 밧줄은 60Hz 고정 스텝. 커서가 준 운동량은 한 번만 전달한다
      const step = s.fixed(1 / 60, (h, t) => {
        const R = Math.min(c.w, c.h) * 0.06;
        for (const rp of ropes) {
          for (const q of rp.pts) {
            if (q.pin) continue;
            const vx = (q.x - q.ox) * 0.985, vy = (q.y - q.oy) * 0.985;
            q.ox = q.x; q.oy = q.y;
            q.x += vx + Math.sin(t * 0.8 + q.y * 0.01) * 0.02; q.y += vy + 0.35;
            const dx = q.x - g.x, dy = q.y - g.y, d = Math.hypot(dx, dy);
            if (d < R && d > 0) { q.x = g.x + (dx / d) * R; q.y = g.y + (dy / d) * R; q.ox -= mvx * 0.15; q.oy -= mvy * 0.15; }
          }
          for (let it = 0; it < 6; it++) for (let i = 0; i < rp.pts.length - 1; i++) {
            const a = rp.pts[i], b = rp.pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-3, df = (d - rp.len) / d / 2;
            if (!a.pin) { a.x += dx * df; a.y += dy * df; }
            if (!b.pin) { b.x -= dx * df; b.y -= dy * df; }
          }
        }
        mvx = mvy = 0;
      });
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        g = p.idle ? Lab.ghost(t * 1.1, W, H) : { x: p.x, y: p.y };
        mvx += g.x - lx; mvy += g.y - ly; lx = g.x; ly = g.y;
        step(dt, t);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0b0d1f'); bg.addColorStop(1, '#1f1430');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#070712';
        for (let x = 0, i = 0; x < W; i++) { const bw = m * (0.08 + ((i * 37) % 7) * 0.012), bh = H * (0.12 + ((i * 53) % 9) * 0.025); ctx.fillRect(x, H - bh, bw, bh); x += bw + 2; }
        for (const rp of ropes) {
          ctx.strokeStyle = '#1b1a14'; ctx.lineWidth = 1.6;
          ctx.beginPath(); rp.pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const rp of ropes) rp.pts.forEach((q, i) => {
          if (q.pin || i % 2) return;
          const nb = rp.pts[i + 1] || q;
          const ang = Math.atan2(nb.y - q.y, nb.x - q.x) + Math.PI / 2;
          const bx = q.x + Math.cos(ang) * m * 0.018, by = q.y + Math.sin(ang) * m * 0.018;
          let col = mode === 0 ? warm[i % 3] : rgb[(i / 2 + rp.ri) % 5 | 0];
          let on = 1;
          if (mode === 2) { on = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 + i * 1.7 + rp.ri)); col = rgb[(i + Math.floor(t)) % 5]; }
          const r = m * 0.07 * on;
          const gl = ctx.createRadialGradient(bx, by, 0, bx, by, r);
          gl.addColorStop(0, col + 'cc'); gl.addColorStop(1, col + '00');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(bx, by, r, 0, U.TAU); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, m * 0.009, m * 0.014, ang - Math.PI / 2, 0, U.TAU); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
      });
    },
  });

  /* =======================================================
     셰이더 2종
     ======================================================= */
  const NOISE = `
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.;a*=.5;}return v;}
  `;
  const shader = (o) => Lab.register({ cat: 'shader', ...o, source: o.frag, mount(el, s) { s.shader(o.frag); } });

  shader({
    id: 'lava-lamp', title: 'Lava Lamp', tags: ['2D metaballs', 'field', 'GLSL'],
    frag: `
    void main(){
      vec2 p=gl_FragCoord.xy/iRes.y;
      float asp=iRes.x/iRes.y;
      vec2 m=iMouse/iRes.y;
      float f=0.;
      for(int i=0;i<10;i++){
        float fi=float(i);
        vec2 c=vec2(asp*(.5+.36*sin(fi*2.1+iTime*(.11+fi*.013))),.5+.46*sin(iTime*(.07+fi*.019)+fi*1.3));
        float r=.07+.035*fract(fi*.37);
        f+=r*r/dot(p-c,p-c);
      }
      f+=(.006+iDown*.02)/dot(p-m,p-m);
      vec3 bg=mix(vec3(.18,.02,.22),vec3(.55,.06,.25),p.y);
      vec3 hot=mix(vec3(1.,.35,.1),vec3(1.,.85,.35),smoothstep(1.,3.,f));
      float edge=smoothstep(.9,1.08,f);
      vec3 col=mix(bg,hot,edge);
      col+=vec3(1.,.4,.2)*smoothstep(.45,1.,f)*(1.-edge)*.35;
      col*=1.-.35*pow(abs(p.x/asp-.5)*2.,3.);
      gl_FragColor=vec4(col,1.);
    }`,
  });

  shader({
    id: 'grav-lens', title: 'Gravitational Lens', tags: ['lens equation', 'Einstein ring', 'GLSL'],
    frag: NOISE + `
    vec3 sky(vec2 p){
      vec3 c=vec3(.01,.012,.03);
      c+=vec3(.45,.18,.6)*pow(fbm(p*1.4),3.)*1.6;
      c+=vec3(.1,.35,.7)*pow(fbm(p*2.2+7.),4.)*1.8;
      vec2 g=floor(p*55.),f=fract(p*55.)-.5;
      float h=hash(g);
      c+=step(.975,h)*smoothstep(.16,0.,length(f-(hash2(g)-.5)*.6))*(.5+.5*sin(iTime*2.+h*40.));
      vec2 q=p-vec2(.35,.1);
      float a=atan(q.y,q.x),r=length(q);
      c+=vec3(1.,.8,.6)*exp(-r*9.)*(.6+.4*sin(a*2.+log(r+.01)*6.))*.9;
      return c;
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y;
      vec2 m=(iMouse-.5*iRes)/iRes.y;
      vec2 d=uv-m;float r=max(length(d),1e-4);
      float te=.11+iDown*.06;
      vec2 src=m+d-te*te*d/(r*r);
      vec3 col=sky(src+vec2(iTime*.004,0.));
      float rs=te*.55;
      col*=smoothstep(rs,rs*1.12,r);
      col+=vec3(1.,.75,.5)*exp(-pow((r-te)/(te*.06),2.))*.25;
      gl_FragColor=vec4(col,1.);
    }`,
  });

  /* =======================================================
     Bubble Wrap — 뽁뽁이
     ======================================================= */
  Lab.register({
    id: 'bubble-wrap', cat: 'sound', title: 'Bubble Wrap', sound: true,
    tags: ['canvas', 'WebAudio', 'click/drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      let B = [], R = 20, popped = 0, resetT = 0;
      const init = () => {
        R = Math.min(c.w, c.h) / (s.large ? 16 : 10);
        B = []; popped = 0;
        const dx = R * 2.25, dy = R * 1.95;
        for (let row = 0, y = R * 1.3; y < c.h - R * 0.6; y += dy, row++) for (let x = R * 1.3 + (row % 2) * dx / 2; x < c.w - R * 0.6; x += dx) {
          B.push({ x, y, pop: 0, press: 0, seed: Math.random() * 100 });
        }
      };
      init(); c.onresize = init;
      const popSound = () => s.large && Lab.sound.on && sfx((a, t) => {
        const len = 0.06, buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
        const src = a.createBufferSource(); src.buffer = buf;
        const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = U.rand(900, 2200); f.Q.value = 1.4;
        const g = a.createGain(); g.gain.value = 0.9;
        src.connect(f).connect(g).connect(a.destination); src.start(t);
      });
      const tryPop = (x, y) => {
        for (const b of B) if (!b.pop && Math.hypot(b.x - x, b.y - y) < R * 0.95) { b.pop = 0.001; popped++; popSound(); }
      };
      const p = s.pointer(c.cv);
      p.ondown = () => tryPop(p.x, p.y);
      p.onmove = () => p.down && tryPop(p.x, p.y);
      let gt = 0;
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        if (p.idle) { gt += dt; const g = Lab.ghost(t * 0.8, W, H); if (Math.sin(gt * 5) > 0.7) tryPop(g.x, g.y); }
        if (popped >= B.length && B.length) { resetT += dt; if (resetT > 1.2) { resetT = 0; init(); } }
        ctx.fillStyle = '#bcd6e4'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff22';
        for (let i = 0; i < 6; i++) ctx.fillRect(0, (H / 6) * i + Math.sin(t + i) * 4, W, 2);
        for (const b of B) {
          const hov = !p.idle && Math.hypot(p.x - b.x, p.y - b.y) < R;
          b.press += ((hov ? 1 : 0) - b.press) * U.damp(14, dt);
          if (b.pop) b.pop = Math.min(1, b.pop + dt * 8);
          if (b.pop) {
            ctx.save(); ctx.translate(b.x, b.y);
            ctx.fillStyle = 'rgba(160,190,205,.65)';
            ctx.beginPath();
            for (let k = 0; k < 12; k++) { const a = (k / 12) * U.TAU, rr = R * (0.72 + 0.14 * Math.sin(b.seed + k * 2.3)); k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
            for (let k = 0; k < 3; k++) { const a = b.seed + k * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1); ctx.lineTo(Math.cos(a + 0.4) * R * 0.6, Math.sin(a + 0.4) * R * 0.6); ctx.stroke(); }
            if (b.pop < 1) { ctx.strokeStyle = `rgba(255,255,255,${1 - b.pop})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R * (0.9 + b.pop * 0.6), 0, U.TAU); ctx.stroke(); }
            ctx.restore();
            continue;
          }
          const sc = 1 - b.press * 0.08;
          const r = R * 0.9 * sc;
          ctx.fillStyle = 'rgba(0,30,50,.12)'; ctx.beginPath(); ctx.arc(b.x + R * 0.08, b.y + R * 0.12, r, 0, U.TAU); ctx.fill();
          const g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.05, b.x, b.y, r);
          g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.35, 'rgba(235,248,255,.55)'); g.addColorStop(0.85, 'rgba(190,220,235,.35)'); g.addColorStop(1, 'rgba(120,160,180,.6)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, U.TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(b.x - r * 0.38, b.y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, U.TAU); ctx.fill();
        }
        ctx.fillStyle = 'rgba(20,40,55,.75)'; ctx.font = `600 ${Math.max(11, H * 0.03)}px "IBM Plex Mono",monospace`; ctx.textAlign = 'right';
        ctx.fillText(`${popped} / ${B.length}`, W - 14, H - 12);
      });
    },
  });

  /* =======================================================
     Sortable List — 스프링으로 자리를 찾는 목록
     ======================================================= */
  Lab.register({
    id: 'sortable', cat: 'ui', title: 'Sortable List',
    tags: ['drag & drop', 'spring', 'reorder'],
    css: `
    .so{position:absolute;inset:0;display:grid;place-items:center;background:#e9e6df;font-family:'Pretendard Variable',Pretendard,sans-serif;color:#171614}
    .so-box{position:relative;width:min(80cqw,96cqh);}
    .so-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2.4cqmin;font-size:3.6cqmin;font-weight:700;letter-spacing:-.02em}
    .so-h small{font:500 2.2cqmin 'IBM Plex Mono',monospace;color:#8a867d}
    .so-list{position:relative}
    .so-it{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:2.4cqmin;padding:0 2.4cqmin;border-radius:1.6cqmin;background:#fff;
      box-shadow:0 1px 0 #0000000d,0 .4cqmin 1cqmin #0000000a;cursor:grab;touch-action:none;will-change:transform;font-size:2.8cqmin}
    .so-it.drag{cursor:grabbing;z-index:5;box-shadow:0 2.4cqmin 5cqmin -1cqmin #00000040}
    .so-grip{width:1.4cqmin;height:3cqmin;background:radial-gradient(circle,#b9b5ab 30%,#0000 32%) 0 0/.7cqmin .75cqmin;opacity:.9}
    .so-ck{width:3.2cqmin;height:3.2cqmin;border-radius:50%;border:.3cqmin solid #c9c5bb;display:grid;place-items:center;cursor:pointer;transition:.25s;flex:none}
    .so-it.done .so-ck{background:#ff4a1c;border-color:#ff4a1c}
    .so-ck::after{content:'';width:1.2cqmin;height:.7cqmin;border-left:.35cqmin solid #fff;border-bottom:.35cqmin solid #fff;transform:rotate(-45deg) scale(0);transition:.25s cubic-bezier(.3,1.8,.5,1)}
    .so-it.done .so-ck::after{transform:translateY(-.15cqmin) rotate(-45deg) scale(1)}
    .so-t{flex:1;position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .so-t::after{content:'';position:absolute;left:0;top:52%;height:.25cqmin;width:0;background:#8a867d;transition:width .35s}
    .so-it.done .so-t{color:#8a867d}.so-it.done .so-t::after{width:100%}
    .so-tag{font:500 2cqmin 'IBM Plex Mono',monospace;padding:.5cqmin 1.2cqmin;border-radius:1cqmin}
    `,
    mount(el, s) {
      const items = [['디자인 리뷰', 'design', '#ffe1d6', '#c2410c'], ['홀로 카드 셰이더 정리', 'dev', '#dbeafe', '#1d4ed8'], ['README 스크린샷', 'docs', '#e7f5d9', '#3f6212'],
        ['모바일 터치 확인', 'qa', '#f3e8ff', '#7e22ce'], ['배포', 'ops', '#fef3c7', '#a16207'], ['회고 쓰기', 'misc', '#f1f0ec', '#57534e']];
      const root = s.html(`<div class="so"><div class="so-box"><div class="so-h">This week<small>drag to reorder</small></div><div class="so-list">${items.map(([t, tag, bg, fg]) =>
        `<div class="so-it"><span class="so-grip"></span><span class="so-ck"></span><span class="so-t">${t}</span><span class="so-tag" style="background:${bg};color:${fg}">${tag}</span></div>`).join('')}</div></div></div>`);
      const list = root.querySelector('.so-list');
      const els = [...list.children];
      let order = els.map((_, i) => i);
      const st = els.map(() => ({ y: { x: 0, v: 0 }, s: { x: 1, v: 0 }, r: { x: 0, v: 0 } }));
      let rowH = 40, drag = -1, offY = 0, py = 0, lastUser = -1e9, autoT = 0;
      s.resize(root, (w, h) => {
        rowH = Math.min(h, w * 0.75) * 0.105;
        els.forEach((e) => (e.style.height = rowH * 0.86 + 'px'));
        list.style.height = rowH * els.length + 'px';
      });
      els.forEach((e, i) => {
        e.querySelector('.so-ck').addEventListener('pointerdown', (ev) => ev.stopPropagation());
        s.on(e.querySelector('.so-ck'), 'click', () => { e.classList.toggle('done'); lastUser = performance.now(); });
        s.on(e, 'pointerdown', (ev) => {
          drag = i; lastUser = performance.now();
          const r = list.getBoundingClientRect();
          py = ev.clientY - r.top; offY = py - st[i].y.x;
          e.classList.add('drag');
          try { e.setPointerCapture(ev.pointerId); } catch (_) {}
        });
        s.on(e, 'pointermove', (ev) => {
          if (drag !== i) return;
          const r = list.getBoundingClientRect();
          py = ev.clientY - r.top; lastUser = performance.now();
          const y = py - offY;
          const slot = U.clamp(Math.round(y / rowH), 0, els.length - 1);
          const cur = order.indexOf(i);
          if (slot !== cur) { order.splice(cur, 1); order.splice(slot, 0, i); }
        });
        const up = () => { if (drag === i) { drag = -1; e.classList.remove('drag'); } };
        s.on(e, 'pointerup', up); s.on(e, 'pointercancel', up);
      });
      s.raf((dt) => {
        if (drag < 0 && performance.now() - lastUser > 3500) {
          autoT += dt;
          if (autoT > 1.6) { autoT = 0; const a = U.pick(order), to = (Math.random() * els.length) | 0; order.splice(order.indexOf(a), 1); order.splice(to, 0, a); if (Math.random() < 0.3) els[a].classList.toggle('done'); }
        }
        els.forEach((e, i) => {
          const q = st[i];
          const target = order.indexOf(i) * rowH;
          if (drag === i) {
            const ny = py - offY;
            q.r.x += (U.clamp((ny - q.y.x) * 0.6, -6, 6) - q.r.x) * 0.2;
            q.y.x = ny; q.y.v = 0;
          } else { U.spring(q.y, target, dt, 260, 22); U.spring(q.r, 0, dt, 200, 16); }
          U.spring(q.s, drag === i ? 1.04 : 1, dt, 300, 20);
          e.style.transform = `translateY(${q.y.x}px) scale(${q.s.x}) rotate(${q.r.x}deg)`;
        });
      });
    },
  });

  /* =======================================================
     Like Burst — 누를수록 쌓이는 하트
     ======================================================= */
  Lab.register({
    id: 'like-burst', cat: 'ui', title: 'Like Burst',
    tags: ['particles', 'odometer', 'hold'],
    css: `
    .lk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3cqmin;background:#fff4f0;user-select:none}
    .lk-b{position:relative;width:24cqmin;height:24cqmin;border:0;border-radius:50%;background:#fff;cursor:pointer;display:grid;place-items:center;
      box-shadow:0 1.6cqmin 4cqmin -1cqmin #ff4d6d55,inset 0 0 0 .3cqmin #ffd3dc;touch-action:none;will-change:transform}
    .lk-b svg{width:52%;height:52%;overflow:visible}
    .lk-b path{fill:#fff;stroke:#ff4d6d;stroke-width:1.8;transition:fill .2s}
    .lk-b.on path{fill:#ff4d6d}
    .lk-ring{position:absolute;inset:0;border-radius:50%;border:1.4cqmin solid #ff8fa3;opacity:0;pointer-events:none}
    .lk-n{display:flex;align-items:flex-start;font:700 7cqmin/1 'Space Grotesk',sans-serif;color:#2a1418;height:7cqmin;overflow:hidden}
    .lk-d{display:flex;flex-direction:column;transition:transform .5s cubic-bezier(.3,1.4,.5,1)}
    .lk-d span{height:7cqmin;display:block;text-align:center;width:.62em}
    .lk-cap{font:500 2.2cqmin 'IBM Plex Mono',monospace;color:#b07a84;letter-spacing:.1em}
    .lk canvas{pointer-events:none}
    .lk-plus{position:absolute;font:800 4cqmin 'Space Grotesk',sans-serif;color:#ff4d6d;pointer-events:none;opacity:0}
    `,
    mount(el, s) {
      const root = s.html(`<div class="lk"><button class="lk-b" aria-label="좋아요"><span class="lk-ring"></span><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.9 1.3 5.3 3.2 1.4-1.9 3.2-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg></button>
        <div class="lk-n">${Array.from({ length: 5 }, () => `<div class="lk-d">${Array.from({ length: 10 }, (_, i) => `<span>${i}</span>`).join('')}</div>`).join('')}</div>
        <div class="lk-cap">CLICK · HOLD</div><div class="lk-plus"></div></div>`);
      const btn = root.querySelector('.lk-b'), ring = root.querySelector('.lk-ring'), plus = root.querySelector('.lk-plus');
      const digits = [...root.querySelectorAll('.lk-d')];
      const c = s.canvas({ parent: root }); const { ctx } = c;
      let count = 1284, held = false, holdT = 0, streak = 0, streakT = 0;
      const S = { x: 1, v: 0 };
      const P = [];
      const setCount = () => {
        const str = String(count).padStart(5, '0');
        digits.forEach((d, i) => { d.style.transform = `translateY(${-+str[i] * 10}%)`; d.style.opacity = i < 5 - String(count).length ? 0.25 : 1; });
      };
      setCount();
      const burst = (big) => {
        count++; streak++; streakT = 0; setCount();
        btn.classList.add('on');
        S.v -= big ? 9 : 5;
        ring.animate([{ transform: 'scale(.6)', opacity: 1, borderWidth: '3cqmin' }, { transform: 'scale(1.6)', opacity: 0, borderWidth: '0' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
        const rr = root.getBoundingClientRect(), b = btn.getBoundingClientRect();
        const cx = b.left - rr.left + b.width / 2, cy = b.top - rr.top + b.height / 2, m = Math.min(c.w, c.h);
        const cols = ['#ff4d6d', '#ffb13d', '#ffd23f', '#7ad7ff', '#b98aff'];
        for (let i = 0; i < (big ? 20 : 12); i++) {
          const a = (i / (big ? 20 : 12)) * U.TAU + U.rand(-0.15, 0.15), v = m * U.rand(0.6, 1.1);
          P.push({ x: cx + Math.cos(a) * b.width * 0.4, y: cy + Math.sin(a) * b.width * 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: m * U.rand(0.008, 0.016), c: U.pick(cols), life: 0, heart: Math.random() < 0.3 });
        }
        plus.textContent = '+' + streak;
        plus.style.left = cx + b.width * 0.35 + 'px'; plus.style.top = cy - b.height * 0.6 + 'px';
        plus.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-60%)', opacity: 0 }], { duration: 700, easing: 'ease-out' });
      };
      s.on(btn, 'pointerdown', (e) => { held = true; holdT = 0; burst(false); lastUser = performance.now(); try { btn.setPointerCapture(e.pointerId); } catch (_) {} });
      const up = () => (held = false);
      s.on(btn, 'pointerup', up); s.on(btn, 'pointercancel', up);
      let lastUser = -1e9, auto = 0.8;
      const heart = (x, y, r) => { ctx.beginPath(); ctx.moveTo(x, y + r * 0.6); ctx.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r * 0.6); ctx.fill(); };
      s.raf((dt) => {
        if (held) { holdT += dt; if (holdT > 0.16) { holdT = 0; burst(true); } }
        streakT += dt; if (streakT > 1.2) streak = 0;
        if (performance.now() - lastUser > 3000) { auto -= dt; if (auto < 0) { auto = U.rand(0.7, 1.5); burst(Math.random() < 0.3); } }
        U.spring(S, 1, dt, 300, 12);
        btn.style.transform = `scale(${S.x})`;
        ctx.clearRect(0, 0, c.w, c.h);
        for (let i = P.length - 1; i >= 0; i--) {
          const q = P[i];
          q.life += dt; if (q.life > 0.8) { P.splice(i, 1); continue; }
          q.vx *= Math.exp(-5 * dt); q.vy = q.vy * Math.exp(-5 * dt) + 200 * dt;
          q.x += q.vx * dt; q.y += q.vy * dt;
          ctx.globalAlpha = 1 - q.life / 0.8; ctx.fillStyle = q.c;
          if (q.heart) heart(q.x, q.y, q.r * 1.3); else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 - q.life), 0, U.TAU); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      });
    },
  });
})();
