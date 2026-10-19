/* =========================================================
   PHYSICS — 직접 잡아당겨 보는 시뮬레이션
   ========================================================= */
(() => {
  const { U } = Lab;

  /* =======================================================
     1. Boids
     ======================================================= */
  Lab.register({
    id: 'boids', cat: 'physics', title: 'Boids Flock',
    tags: ['flocking', 'emergence', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const T = s.params({ count: [s.large ? 420 : 200, 30, 900, 10, '개체 수', true], speed: [s.large ? 170 : 130, 40, 400, 5, '최고 속도'], align: [1.2, 0, 4, 0.05, '정렬'], cohesion: [0.9, 0, 4, 0.05, '응집'], separation: [2600, 0, 8000, 100, '분리'] });
      const N = Math.round(T.count);
      const B = Array.from({ length: N }, () => { const a = U.rand(U.TAU); return { x: U.rand(c.w), y: U.rand(c.h), vx: Math.cos(a) * 80, vy: Math.sin(a) * 80 }; });
      const p = s.pointer();
      const cell = 50;
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        ctx.fillStyle = 'rgba(8,10,20,.35)'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 0.8, W, H) : p;
        const grid = new Map();
        B.forEach((b, i) => { const k = ((b.x / cell) | 0) + ',' + ((b.y / cell) | 0); (grid.get(k) || grid.set(k, []).get(k)).push(i); });
        const view = 46, sep = 18, maxV = T.speed;
        for (const b of B) {
          let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
          const gx = (b.x / cell) | 0, gy = (b.y / cell) | 0;
          for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
            const list = grid.get(gx + ox + ',' + (gy + oy));
            if (!list) continue;
            for (const j of list) {
              const o = B[j]; if (o === b) continue;
              const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
              if (d < view) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; n++; if (d < sep && d > 0) { sx -= dx / d / d; sy -= dy / d / d; } }
            }
          }
          let fx = 0, fy = 0;
          if (n) { fx += (ax / n - b.vx) * T.align + (cx / n - b.x) * T.cohesion; fy += (ay / n - b.vy) * T.align + (cy / n - b.y) * T.cohesion; }
          fx += sx * T.separation; fy += sy * T.separation;
          const dx = b.x - g.x, dy = b.y - g.y, d = Math.hypot(dx, dy) || 1;
          const R = Math.min(W, H) * 0.22;
          if (p.down) { fx -= (dx / d) * 260; fy -= (dy / d) * 260; }
          else if (d < R) { const k = (1 - d / R) * 1800; fx += (dx / d) * k; fy += (dy / d) * k; }
          const m = 40;
          if (b.x < m) fx += (m - b.x) * 12; if (b.x > W - m) fx -= (b.x - W + m) * 12;
          if (b.y < m) fy += (m - b.y) * 12; if (b.y > H - m) fy -= (b.y - H + m) * 12;
          b.vx += fx * dt; b.vy += fy * dt;
          const v = Math.hypot(b.vx, b.vy) || 1;
          const vv = U.clamp(v, maxV * 0.5, maxV);
          b.vx = (b.vx / v) * vv; b.vy = (b.vy / v) * vv;
          b.x += b.vx * dt; b.y += b.vy * dt;
        }
        const sz = s.large ? 7 : 5;
        for (const b of B) {
          const a = Math.atan2(b.vy, b.vx);
          ctx.fillStyle = `hsl(${(a * 180) / Math.PI + 200},85%,65%)`;
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(sz * 1.6, 0); ctx.lineTo(-sz, sz * 0.7); ctx.lineTo(-sz * 0.5, 0); ctx.lineTo(-sz, -sz * 0.7); ctx.fill();
          ctx.restore();
        }
      });
    },
  });

  /* =======================================================
     2. Tearable Cloth (Verlet)
     ======================================================= */
  Lab.register({
    id: 'cloth', cat: 'physics', title: 'Tearable Cloth', feature: true,
    tags: ['verlet', 'constraints', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      let P = [], C = [], cols, rows, sp;
      const init = () => {
        const W = c.w, H = c.h;
        cols = s.large ? 56 : 32; rows = s.large ? 32 : 18;
        sp = Math.min((W * 0.84) / (cols - 1), (H * 0.7) / (rows - 1));
        const x0 = (W - sp * (cols - 1)) / 2, y0 = H * 0.08;
        P = []; C = [];
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const px = x0 + x * sp, py = y0 + y * sp;
          P.push({ x: px, y: py, ox: px, oy: py, pin: y === 0 && (x % 4 === 0 || x === cols - 1), u: x / (cols - 1), v: y / (rows - 1) });
          const i = P.length - 1;
          if (x > 0) C.push({ a: i - 1, b: i, r: sp, on: true });
          if (y > 0) C.push({ a: i - cols, b: i, r: sp, on: true });
        }
      };
      init(); c.onresize = init;
      const T = s.params({ gravity: [900, 0, 3000, 50, '중력'], tear: [5.5, 1.5, 12, 0.1, '찢어지는 길이 ×'], wire: [0, 0, 1, 1, '그물 보기 (0/1)'] });
      const p = s.pointer(c.cv, { noMenu: true });
      const mode = s.modes(['Pull', 'Cut', 'Reset'], 0, (i) => { if (i === 2) { init(); mode.set(0); } });
      let grab = null, cut = false;
      const sparks = [];
      const breakAt = (k) => {
        k.on = false;
        const a = P[k.a], b = P[k.b];
        for (let i = 0; i < 3; i++) sparks.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: U.rand(-80, 80), vy: U.rand(-120, 20), t: 0 });
      };
      p.ondown = (e) => {
        cut = e.button === 2 || e.shiftKey || mode.i === 1;
        if (cut) return;
        let best = null, bd = Math.max(30, sp * 2.5);
        for (const q of P) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
        grab = best;
      };
      p.onup = () => { grab = null; cut = false; };
      s.on(c.cv, 'dblclick', init);
      let wind = 0, autoReset = 0, ghost = null;
      // 물리는 60Hz 고정. 화면 주사율이 달라도 같은 속도로 움직인다
      const step = s.fixed(1 / 60, (h) => {
        const W = c.w, H = c.h;
        for (const q of P) {
          if (q.pin) continue;
          const vx = (q.x - q.ox) * 0.99, vy = (q.y - q.oy) * 0.99;
          q.ox = q.x; q.oy = q.y;
          q.x += vx + wind * 0.15 * (1 + q.v); q.y += vy + T.gravity * h * h;
          if (ghost) { const dx = q.x - ghost.x, dy = q.y - ghost.y, d = Math.hypot(dx, dy); if (d < sp * 4 && d > 0) { q.x += (dx / d) * 1.5; q.y += (dy / d) * 1.5; } }
        }
        if (grab) { grab.x = p.x; grab.y = p.y; }
        if (cut && p.down) {
          for (const k of C) { if (!k.on) continue; const a = P[k.a], b = P[k.b]; if (Math.hypot((a.x + b.x) / 2 - p.x, (a.y + b.y) / 2 - p.y) < sp * 1.2) breakAt(k); }
        }
        for (let it = 0; it < 4; it++) {
          for (const k of C) {
            if (!k.on) continue;
            const a = P[k.a], b = P[k.b];
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
            if (d > k.r * T.tear) { breakAt(k); continue; }
            const diff = ((d - k.r) / d) * 0.5;
            const ox = dx * diff, oy = dy * diff;
            if (!a.pin && a !== grab) { a.x += ox; a.y += oy; }
            if (!b.pin && b !== grab) { b.x -= ox; b.y -= oy; }
          }
          for (const q of P) { if (q.y > H - 2) q.y = H - 2; if (q.x < 2) q.x = 2; if (q.x > W - 2) q.x = W - 2; }
        }
      });
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        wind = (Math.sin(t * 0.7) * 0.5 + Math.sin(t * 1.9) * 0.3) * (p.idle ? 1 : 0.3);
        ghost = p.idle ? Lab.ghost(t * 0.7, W, H) : null;
        step(dt, t);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#15121f'); bg.addColorStop(1, '#0a090f');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // 천 면: 네 변이 모두 살아 있는 칸만 채우고, 늘어남과 기울기로 명암을 준다
        const on = new Uint8Array(P.length * 2);
        let broken = 0;
        C.forEach((k) => { if (!k.on) { broken++; return; } on[k.a * 2 + (k.b - k.a === 1 ? 0 : 1)] = 1; });
        for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
          const i = y * cols + x;
          if (!on[i * 2] || !on[i * 2 + 1] || !on[(i + 1) * 2 + 1] || !on[(i + cols) * 2]) continue;
          const a = P[i], b = P[i + 1], d = P[i + cols + 1], e = P[i + cols];
          const area = Math.abs((d.x - a.x) * (e.y - b.y) - (d.y - a.y) * (e.x - b.x)) / 2 / (sp * sp);
          const tilt = ((b.y - a.y) + (d.y - e.y)) / (2 * sp);
          const light = U.clamp(46 + (1 - area) * -18 + tilt * 30 + (x % 2 === y % 2 ? 2 : 0), 18, 78);
          ctx.fillStyle = `hsl(${250 + a.u * 90},${55 + (1 - Math.min(1, area)) * 30}%,${light}%)`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fill();
        }
        // 실밥(남은 선)과 늘어난 곳
        ctx.lineWidth = 1;
        for (const k of C) {
          if (!k.on) continue;
          const a = P[k.a], b = P[k.b];
          const st = U.clamp((Math.hypot(b.x - a.x, b.y - a.y) / k.r - 1) * 1.2, 0, 1);
          if (st < 0.15 && T.wire < 0.5) continue;
          ctx.strokeStyle = `hsla(${U.lerp(260, 350, st)},100%,${70 + st * 15}%,${T.wire >= 0.5 ? 0.6 : st})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.fillStyle = '#f2efe6';
        for (const q of P) if (q.pin) { ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, U.TAU); ctx.fill(); }
        // 찢어질 때 튀는 실밥
        for (let i = sparks.length - 1; i >= 0; i--) {
          const q = sparks[i]; q.t += dt; if (q.t > 0.5) { sparks.splice(i, 1); continue; }
          q.vy += 400 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          ctx.fillStyle = `rgba(255,200,230,${1 - q.t / 0.5})`; ctx.fillRect(q.x, q.y, 2, 2);
        }
        if (sparks.length > 300) sparks.splice(0, sparks.length - 300);
        // 커서 피드백: 잡을 점 / 가위 반경
        if (!p.idle) {
          const isCut = mode.i === 1 || cut;
          ctx.lineWidth = 1.5;
          if (isCut) {
            ctx.strokeStyle = p.down ? '#ff5d7a' : '#ff5d7a88';
            ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(p.x, p.y, sp * 1.2, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
          } else if (grab) {
            ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(grab.x, grab.y, 7, 0, U.TAU); ctx.stroke();
          } else {
            let best = null, bd = Math.max(30, sp * 2.5);
            for (const q of P) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
            if (best) { ctx.strokeStyle = '#ffffff99'; ctx.beginPath(); ctx.arc(best.x, best.y, 5, 0, U.TAU); ctx.stroke(); }
          }
        }
        if (broken > C.length * 0.35) { autoReset += dt; if (autoReset > 3) { autoReset = 0; init(); } } else autoReset = 0;
      });
    },
  });

  /* =======================================================
     3. Falling Sand
     ======================================================= */
  Lab.register({
    id: 'falling-sand', cat: 'physics', title: 'Falling Sand',
    tags: ['cellular automata', 'pixels', 'draw'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const cs = s.large ? 4 : 4;
      let gw, gh, T, Hh, V, img, off, offx;
      const init = () => {
        gw = Math.max(10, Math.floor(c.w / cs)); gh = Math.max(10, Math.floor(c.h / cs));
        T = new Uint8Array(gw * gh); Hh = new Uint16Array(gw * gh); V = new Uint8Array(gw * gh);
        off = Lab.offscreen(gw, gh); offx = off.getContext('2d'); img = offx.createImageData(gw, gh);
        // 돌 장애물
        for (let k = 0; k < 3; k++) {
          const y = Math.floor(gh * (0.45 + k * 0.15)), x0 = Math.floor(gw * U.rand(0.1, 0.6)), len = Math.floor(gw * U.rand(0.15, 0.3));
          for (let x = x0; x < x0 + len; x++) { const yy = y + Math.round((x - x0) * (k % 2 ? 0.3 : -0.3)); if (yy > 0 && yy < gh) T[yy * gw + x] = 3; }
        }
      };
      init(); c.onresize = init;
      const pal = Array.from({ length: 360 }, (_, h) => {
        const f = (n) => { const k = (n + h / 30) % 12; return 0.75 - 0.35 * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
        return [f(0) * 255, f(8) * 255, f(4) * 255];
      });
      const p = s.pointer(c.cv, { noMenu: true });
      const mode = s.modes(['Sand', 'Water', 'Wall', 'Erase'], 0, null, 'top');
      let hue = 0, water = false, frame = 0;
      p.ondown = (e) => (water = e.button === 2 || e.shiftKey);
      s.on(c.cv, 'dblclick', init);
      const brush = () => (s.large ? 5 : 3);
      const pour = (x, y, r, type) => {
        const gx = Math.floor(x / cs), gy = Math.floor(y / cs);
        if (type === 0 || type === 3) {
          // 벽과 지우개는 브러시 원을 꽉 채운다
          for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
            const xx = gx + i, yy = gy + j;
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh || i * i + j * j > r * r) continue;
            const k = yy * gw + xx; T[k] = type; V[k] = (Math.random() * 255) | 0;
          }
          return;
        }
        for (let i = 0; i < r * r * 0.6; i++) {
          const a = U.rand(U.TAU), d = Math.sqrt(Math.random()) * r;
          const xx = Math.round(gx + Math.cos(a) * d), yy = Math.round(gy + Math.sin(a) * d);
          if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue;
          const k = yy * gw + xx;
          if (!T[k]) { T[k] = type; Hh[k] = type === 1 ? Math.floor(hue) % 360 : U.rand(0, 40) | 0; V[k] = (Math.random() * 255) | 0; }
        }
      };
      const TYPES = [1, 2, 3, 0];
      // 시뮬레이션은 60Hz 고정
      const step = s.fixed(1 / 60, (h, t) => {
        hue = (hue + h * 25) % 360;
        if (p.down) pour(p.x, p.y, brush(), water ? 2 : TYPES[mode.i]);
        else if (p.idle) pour(c.w * (0.5 + 0.35 * Math.sin(t * 0.6)), c.h * 0.06, 2, 1);
        frame++;
        for (let y = gh - 2; y >= 0; y--) {
          const ltr = (frame + y) & 1;
          for (let i = 0; i < gw; i++) {
            const x = ltr ? i : gw - 1 - i;
            const k = y * gw + x, ty = T[k];
            if (ty !== 1 && ty !== 2) continue;
            const b = k + gw;
            const move = (to) => { T[to] = ty; Hh[to] = Hh[k]; V[to] = V[k]; T[k] = 0; };
            const swapWater = (to) => { const th = Hh[to], tv = V[to]; T[to] = ty; Hh[to] = Hh[k]; V[to] = V[k]; T[k] = 2; Hh[k] = th; V[k] = tv; };
            if (!T[b]) { move(b); continue; }
            if (ty === 1 && T[b] === 2 && Math.random() < 0.6) { swapWater(b); continue; }
            const dir = Math.random() < 0.5 ? -1 : 1;
            const x1 = x + dir, x2 = x - dir;
            if (x1 >= 0 && x1 < gw && !T[b + dir]) { move(b + dir); continue; }
            if (x2 >= 0 && x2 < gw && !T[b - dir]) { move(b - dir); continue; }
            if (ty === 2) {
              if (x1 >= 0 && x1 < gw && !T[k + dir]) { move(k + dir); continue; }
              if (x2 >= 0 && x2 < gw && !T[k - dir]) { move(k - dir); continue; }
            }
          }
        }
      });
      s.raf((dt, t) => {
        step(dt, t);
        const d = img.data;
        const shimmer = t * 3;
        for (let k = 0, j = 0; k < T.length; k++, j += 4) {
          const ty = T[k];
          if (ty === 1) {
            // 알갱이마다 밝기를 조금씩 달리해서 모래 질감을 낸다
            const col = pal[Hh[k]], f = 0.82 + (V[k] / 255) * 0.3;
            d[j] = col[0] * f; d[j + 1] = col[1] * f; d[j + 2] = col[2] * f;
          } else if (ty === 2) {
            const above = k >= gw && T[k - gw] !== 2;
            const w = Math.sin(shimmer + (k % gw) * 0.3 + V[k] * 0.05) * 12;
            d[j] = above ? 150 : 34 + w * 0.3; d[j + 1] = above ? 210 : 110 + Hh[k] + w; d[j + 2] = above ? 255 : 220 + w;
          } else if (ty === 3) { const f = 80 + (V[k] & 15); d[j] = f; d[j + 1] = f - 4; d[j + 2] = f + 10; }
          else { d[j] = 12; d[j + 1] = 11; d[j + 2] = 20; }
          d[j + 3] = 255;
        }
        offx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, gw * cs, gh * cs);
        // 브러시 미리보기
        if (!p.idle) {
          const r = brush() * cs;
          const col = water ? '#5ab4ff' : ['hsl(' + hue + ',80%,65%)', '#5ab4ff', '#a8a3b5', '#ff5d7a'][mode.i];
          ctx.strokeStyle = col; ctx.lineWidth = 1.5;
          if (mode.i === 3) ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
        }
      });
    },
  });

  /* =======================================================
     4. Water Ripple
     ======================================================= */
  Lab.register({
    id: 'water-ripple', cat: 'physics', title: 'Pool Ripples',
    tags: ['wave equation', 'refraction', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const ds = s.large ? 3 : 3;
      let gw, gh, A, B, tex, img, off, offx;
      const init = () => {
        gw = Math.max(8, Math.floor(c.w / ds)); gh = Math.max(8, Math.floor(c.h / ds));
        A = new Float32Array(gw * gh); B = new Float32Array(gw * gh);
        const tc = Lab.offscreen(gw, gh), tx = tc.getContext('2d');
        tx.fillStyle = '#1ba3c6'; tx.fillRect(0, 0, gw, gh);
        const ts = Math.max(6, Math.round(Math.min(gw, gh) / 9));
        for (let y = 0; y < gh; y += ts) for (let x = 0; x < gw; x += ts) {
          tx.fillStyle = `hsl(${190 + ((x / ts + y / ts) % 2) * 6},70%,${48 + Math.random() * 6}%)`;
          tx.fillRect(x + 1, y + 1, ts - 1, ts - 1);
        }
        tx.strokeStyle = '#0d5f8a'; tx.lineWidth = 2;
        tx.beginPath(); tx.moveTo(0, gh * 0.75); tx.lineTo(gw, gh * 0.75); tx.stroke();
        tx.fillStyle = '#ffffff20'; tx.font = `bold ${gh * 0.22}px "Space Grotesk"`; tx.textAlign = 'center'; tx.fillText('SPLASH', gw / 2, gh * 0.5);
        tex = tx.getImageData(0, 0, gw, gh).data;
        off = Lab.offscreen(gw, gh); offx = off.getContext('2d'); img = offx.createImageData(gw, gh);
      };
      init(); c.onresize = init;
      const drop = (x, y, r, str) => {
        const gx = Math.floor(x / ds), gy = Math.floor(y / ds);
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
          const xx = gx + i, yy = gy + j;
          if (xx < 1 || yy < 1 || xx >= gw - 1 || yy >= gh - 1) continue;
          const d = Math.hypot(i, j) / r;
          if (d < 1) A[yy * gw + xx] += str * (Math.cos(d * Math.PI) * 0.5 + 0.5);
        }
      };
      const p = s.pointer();
      p.ondown = () => drop(p.x, p.y, 8, 900);
      let lx = 0, ly = 0, rain = 0;
      // 파동 방정식은 120Hz 고정 스텝
      const step = s.fixed(1 / 120, () => {
        for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
          const k = y * gw + x;
          B[k] = ((A[k - 1] + A[k + 1] + A[k - gw] + A[k + gw]) * 0.5 - B[k]) * 0.985;
        }
        const tmp = A; A = B; B = tmp;
      }, 8);
      s.raf((dt, t) => {
        const g = p.idle ? Lab.ghost(t * 1.1, c.w, c.h) : p;
        if (Math.hypot(g.x - lx, g.y - ly) > 2) drop(g.x, g.y, 3, 140);
        lx = g.x; ly = g.y;
        rain -= dt; if (p.idle && rain < 0) { rain = 0.5; drop(U.rand(c.w), U.rand(c.h), 5, 500); }
        step(dt, t);
        const d = img.data;
        for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
          const k = y * gw + x;
          const dx = A[k - 1] - A[k + 1], dy = A[k - gw] - A[k + gw];
          const sx = U.clamp(x + (dx / 24) | 0, 0, gw - 1), sy = U.clamp(y + (dy / 24) | 0, 0, gh - 1);
          const si = (sy * gw + sx) * 4, j = k * 4;
          // 왼쪽 위 조명의 스페큘러 + 곡률로 모이는 빛(코스틱)
          const spec = Math.max(0, -dx - dy) * 0.35;
          const caus = Math.max(0, (A[k - 1] + A[k + 1] + A[k - gw] + A[k + gw] - 4 * A[k]) * 0.6);
          const sh = (dx + dy) * 0.08 + spec + caus;
          d[j] = tex[si] + sh; d[j + 1] = tex[si + 1] + sh; d[j + 2] = tex[si + 2] + sh * 0.9; d[j + 3] = 255;
        }
        offx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, 0, 0, c.w, c.h);
      });
    },
  });

  /* =======================================================
     5. Procedural Lizard — 절차적 애니메이션 + IK 다리
     ======================================================= */
  Lab.register({
    id: 'lizard', cat: 'physics', title: 'Procedural Lizard', feature: true,
    tags: ['IK', 'chain', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const n = 22;
      const sc = () => Math.min(c.w, c.h) / 420;
      let J = [];
      const radii = Array.from({ length: n }, (_, i) => {
        if (i === 0) return 15; if (i === 1) return 17; if (i === 2) return 13;
        if (i < 9) return 12 + Math.sin(((i - 3) / 6) * Math.PI) * 6;
        return Math.max(2, 12 - (i - 9) * 0.85);
      });
      const init = () => { J = Array.from({ length: n }, (_, i) => ({ x: c.w / 2 - i * 12 * sc(), y: c.h / 2, a: 0 })); };
      init(); c.onresize = init;
      const legs = [3, 3, 8, 8].map((j, i) => ({ j, side: i % 2 ? 1 : -1, fx: 0, fy: 0, tx: 0, ty: 0, prog: 1, sx: 0, sy: 0, len: j === 3 ? 26 : 22 }));
      let init2 = false;
      const p = s.pointer();
      let hx = c.w / 2, hy = c.h / 2, ha = 0;
      s.raf((dt, t) => {
        const W = c.w, H = c.h, k = sc();
        const seg = 12 * k;
        const g = p.idle ? Lab.ghost(t * 0.55, W, H, 2) : p;
        // 머리: 목표 방향으로 회전하며 전진
        const dx = g.x - hx, dy = g.y - hy, dist = Math.hypot(dx, dy);
        const want = Math.atan2(dy, dx);
        let da = Math.atan2(Math.sin(want - ha), Math.cos(want - ha));
        const speed = Math.min(dist * 2.2, 260 * k) * (dist > 20 * k ? 1 : 0);
        ha += U.clamp(da, -4 * dt, 4 * dt) * (speed > 0 ? 1 : 0);
        hx += Math.cos(ha) * speed * dt; hy += Math.sin(ha) * speed * dt;
        J[0].x = hx; J[0].y = hy; J[0].a = ha;
        for (let i = 1; i < n; i++) {
          const pr = J[i - 1], q = J[i];
          let a = Math.atan2(pr.y - q.y, pr.x - q.x);
          let rel = Math.atan2(Math.sin(a - pr.a), Math.cos(a - pr.a));
          rel = U.clamp(rel, -0.35, 0.35);
          a = pr.a + rel;
          q.a = a; q.x = pr.x - Math.cos(a) * seg; q.y = pr.y - Math.sin(a) * seg;
        }
        // 다리 IK
        legs.forEach((L, li) => {
          const b = J[L.j];
          const nx = Math.cos(b.a + L.side * Math.PI / 2), ny = Math.sin(b.a + L.side * Math.PI / 2);
          L.sx = b.x + nx * radii[L.j] * k * 0.8; L.sy = b.y + ny * radii[L.j] * k * 0.8;
          const ix = b.x + nx * L.len * k * 1.2 + Math.cos(b.a) * L.len * k * 0.9, iy = b.y + ny * L.len * k * 1.2 + Math.sin(b.a) * L.len * k * 0.9;
          if (!init2) { L.fx = L.tx = ix; L.fy = L.ty = iy; }
          const partner = legs[li ^ 1];
          if (Math.hypot(ix - L.tx, iy - L.ty) > L.len * k * 1.1 && L.prog >= 1 && partner.prog >= 1) {
            L.ox = L.fx; L.oy = L.fy; L.tx = ix + Math.cos(b.a) * L.len * k * 0.5; L.ty = iy + Math.sin(b.a) * L.len * k * 0.5; L.prog = 0;
          }
          if (L.prog < 1) { L.prog = Math.min(1, L.prog + dt * 7); const e = U.smooth(0, 1, L.prog); L.fx = U.lerp(L.ox, L.tx, e); L.fy = U.lerp(L.oy, L.ty, e); }
        });
        init2 = true;
        ctx.fillStyle = '#1b2a1f'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#22362a';
        const gs = 40 * k;
        for (let y = 0; y < H; y += gs) for (let x = (y / gs) % 2 ? gs / 2 : 0; x < W; x += gs) { ctx.beginPath(); ctx.arc(x, y, 2 * k, 0, U.TAU); ctx.fill(); }
        // legs
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        legs.forEach((L) => {
          const l1 = L.len * k, l2 = L.len * k;
          const dx2 = L.fx - L.sx, dy2 = L.fy - L.sy, d = Math.min(Math.hypot(dx2, dy2), l1 + l2 - 0.01);
          const a0 = Math.atan2(dy2, dx2);
          const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
          const a1 = a0 - Math.acos(U.clamp(cosA, -1, 1)) * L.side * (L.j === 3 ? 1 : -1);
          const ex = L.sx + Math.cos(a1) * l1, ey = L.sy + Math.sin(a1) * l1;
          ctx.strokeStyle = '#2f8f5b'; ctx.lineWidth = 7 * k;
          ctx.beginPath(); ctx.moveTo(L.sx, L.sy); ctx.lineTo(ex, ey); ctx.lineTo(L.fx, L.fy); ctx.stroke();
          ctx.fillStyle = '#2f8f5b';
          for (let f = -1; f <= 1; f++) { const fa = a0 + f * 0.5; ctx.beginPath(); ctx.arc(L.fx + Math.cos(fa) * 6 * k, L.fy + Math.sin(fa) * 6 * k, 2.6 * k, 0, U.TAU); ctx.fill(); }
        });
        // body outline
        const left = [], right = [];
        J.forEach((q, i) => {
          const r = radii[i] * k;
          left.push([q.x + Math.cos(q.a - Math.PI / 2) * r, q.y + Math.sin(q.a - Math.PI / 2) * r]);
          right.push([q.x + Math.cos(q.a + Math.PI / 2) * r, q.y + Math.sin(q.a + Math.PI / 2) * r]);
        });
        const head = J[0], hr = radii[0] * k;
        const outline = [...left, ...right.reverse()];
        const nose = [head.x + Math.cos(head.a) * hr * 1.3, head.y + Math.sin(head.a) * hr * 1.3];
        ctx.beginPath();
        ctx.moveTo((nose[0] + outline[0][0]) / 2, (nose[1] + outline[0][1]) / 2);
        const pts = [...outline, nose];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        }
        const bg = ctx.createLinearGradient(head.x - 100 * k, head.y - 100 * k, head.x + 100 * k, head.y + 100 * k);
        bg.addColorStop(0, '#5fe39a'); bg.addColorStop(1, '#2fae8f');
        ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = '#1d5c45'; ctx.lineWidth = 2 * k; ctx.stroke();
        // spots
        ctx.fillStyle = '#ffd36b';
        for (let i = 3; i < n - 3; i += 2) { const q = J[i]; ctx.beginPath(); ctx.arc(q.x, q.y, radii[i] * k * 0.28, 0, U.TAU); ctx.fill(); }
        // eyes
        [-1, 1].forEach((sd) => {
          const ex = head.x + Math.cos(head.a + sd * 0.9) * hr * 0.75, ey = head.y + Math.sin(head.a + sd * 0.9) * hr * 0.75;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, 4.5 * k, 0, U.TAU); ctx.fill();
          const la = Math.atan2(g.y - ey, g.x - ex);
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + Math.cos(la) * 1.8 * k, ey + Math.sin(la) * 1.8 * k, 2.4 * k, 0, U.TAU); ctx.fill();
        });
        // target
        if (!p.idle) { ctx.strokeStyle = '#ffffff40'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(g.x, g.y, 8 * k, 0, U.TAU); ctx.stroke(); }
      });
    },
  });

  /* =======================================================
     6. Harp Strings — 모달 합성 + 소리
     ======================================================= */
  Lab.register({
    id: 'harp', cat: 'physics', title: 'Laser Harp', sound: true,
    tags: ['modal synthesis', 'WebAudio', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const notes = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
      const N = s.large ? 12 : 9;
      const K = 7;
      const S = Array.from({ length: N }, (_, i) => ({ modes: new Float32Array(K), phase: 0, f: notes[i], glow: 0 }));
      let audio = null;
      const pluckSound = (f, v) => {
        if (!s.large || !Lab.sound.on) return;
        try {
          audio = audio || new (window.AudioContext || window.webkitAudioContext)();
          if (audio.state === 'suspended') audio.resume();
          const now = audio.currentTime;
          const g = audio.createGain();
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18 * v, now + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
          const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 8, now); lp.frequency.exponentialRampToValueAtTime(f * 1.5, now + 1.2);
          [1, 2, 3].forEach((h, i) => { const o = audio.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f * h; const og = audio.createGain(); og.gain.value = 1 / (h * h); o.connect(og).connect(lp); o.start(now); o.stop(now + 2.3); });
          lp.connect(g).connect(audio.destination);
        } catch (_) {}
      };
      s.add(() => audio && audio.close());
      const pluck = (i, pos, amp) => {
        const st = S[i];
        pos = U.clamp(pos, 0.05, 0.95);
        for (let k = 1; k <= K; k++) st.modes[k - 1] += (amp * 2 * Math.sin(k * Math.PI * pos)) / (k * k * Math.PI * Math.PI * pos * (1 - pos));
        st.glow = 1;
        pluckSound(st.f, U.clamp(Math.abs(amp) / 40, 0.2, 1));
      };
      const p = s.pointer();
      let lx = null, ly = 0, t0 = 0;
      const xs = () => { const m = c.w * 0.12; return S.map((_, i) => m + ((c.w - 2 * m) * i) / (N - 1)); };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, X = xs(), top = H * 0.1, bot = H * 0.9;
        const g = p.idle ? { x: W / 2 + Math.sin(t * 1.3) * W * 0.42, y: H / 2 + Math.sin(t * 0.7) * H * 0.3 } : p;
        if (lx !== null) {
          X.forEach((x, i) => {
            if ((lx - x) * (g.x - x) < 0 && g.y > top && g.y < bot) {
              const v = (g.x - lx) / Math.max(dt, 0.001);
              pluck(i, (g.y - top) / (bot - top), U.clamp(v / 60, -40, 40) * (H / 600));
            }
          });
        }
        lx = g.x; ly = g.y;
        t0 += dt;
        ctx.fillStyle = '#07060f'; ctx.fillRect(0, 0, W, H);
        ctx.lineCap = 'round';
        S.forEach((st, i) => {
          const x = X[i];
          const hue = 280 - i * (200 / N);
          let energy = 0;
          for (let k = 0; k < K; k++) { st.modes[k] *= Math.exp(-dt * (1.2 + k * 0.6)); energy += Math.abs(st.modes[k]); }
          st.glow = Math.max(0, st.glow - dt * 1.5);
          st.phase += dt * (8 + i * 0.6) * U.TAU * 0.25;
          ctx.beginPath();
          for (let j = 0; j <= 40; j++) {
            const u = j / 40;
            let off = 0;
            for (let k = 1; k <= K; k++) off += st.modes[k - 1] * Math.sin(k * Math.PI * u) * Math.cos(st.phase * k);
            const y = top + (bot - top) * u;
            j ? ctx.lineTo(x + off, y) : ctx.moveTo(x + off, y);
          }
          const e = U.clamp(energy / 20, 0, 1);
          ctx.strokeStyle = `hsla(${hue},100%,60%,${0.25 + e * 0.4})`; ctx.lineWidth = 8 + e * 10; ctx.stroke();
          ctx.strokeStyle = `hsla(${hue},100%,${70 + e * 20}%,1)`; ctx.lineWidth = 1.5 + e * 2; ctx.stroke();
          ctx.fillStyle = `hsla(${hue},100%,70%,1)`;
          ctx.beginPath(); ctx.arc(x, top, 4, 0, U.TAU); ctx.arc(x, bot, 4, 0, U.TAU); ctx.fill();
        });
        ctx.fillStyle = '#ffffff30'; ctx.font = `600 ${Math.max(10, H * 0.025)}px "JetBrains Mono"`; ctx.textAlign = 'center';
        ctx.fillText(s.large ? (Lab.sound.on ? 'SOUND ON' : 'SOUND OFF') : 'OPEN FOR SOUND', W / 2, H * 0.96);
      });
    },
  });

  /* =======================================================
     7. Jelly Blob — 압력 소프트바디
     ======================================================= */
  Lab.register({
    id: 'jelly', cat: 'physics', title: 'Jelly Buddy',
    tags: ['soft body', 'pressure', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const N = 28;
      let P = [], R, A0, seg;
      const init = () => {
        R = Math.min(c.w, c.h) * 0.17;
        P = Array.from({ length: N }, (_, i) => { const a = (i / N) * U.TAU; const x = c.w / 2 + Math.cos(a) * R, y = c.h * 0.4 + Math.sin(a) * R; return { x, y, ox: x, oy: y }; });
        A0 = Math.PI * R * R; seg = (U.TAU * R) / N;
      };
      init(); c.onresize = init;
      const area = () => { let a = 0; for (let i = 0; i < N; i++) { const p1 = P[i], p2 = P[(i + 1) % N]; a += p1.x * p2.y - p2.x * p1.y; } return a / 2; };
      const p = s.pointer();
      let grab = -1, auto = 0;
      p.ondown = () => {
        let best = -1, bd = 1e9;
        const cx = P.reduce((a, q) => a + q.x, 0) / N, cy = P.reduce((a, q) => a + q.y, 0) / N;
        if (Math.hypot(p.x - cx, p.y - cy) > R * 1.6) return;
        P.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = i; } });
        grab = best;
      };
      p.onup = () => (grab = -1);
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        const h = Math.min(dt, 1 / 30);
        if (p.idle) { auto -= dt; if (auto < 0) { auto = 2.5; const mx = P.reduce((a, q) => a + q.x, 0) / N; const k = Math.sign(W / 2 - mx + U.rand(-W * 0.2, W * 0.2)) * U.rand(5, 14); P.forEach((q) => { q.ox = q.x - k; q.oy = q.y + 18; }); } }
        for (let sub = 0; sub < 2; sub++) {
          for (const q of P) {
            const vx = (q.x - q.ox) * 0.995, vy = (q.y - q.oy) * 0.995;
            q.ox = q.x; q.oy = q.y; q.x += vx; q.y += vy + 1400 * (h / 2) * (h / 2);
          }
          if (grab >= 0) { const q = P[grab]; q.x += (p.x - q.x) * 0.5; q.y += (p.y - q.y) * 0.5; }
          for (let it = 0; it < 8; it++) {
            for (let i = 0; i < N; i++) {
              const a = P[i], b = P[(i + 1) % N];
              const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-3, df = ((d - seg) / d) * 0.5;
              a.x += dx * df; a.y += dy * df; b.x -= dx * df; b.y -= dy * df;
            }
            const A = area(), diff = (A0 - A) / (seg * N);
            for (let i = 0; i < N; i++) {
              const prev = P[(i - 1 + N) % N], next = P[(i + 1) % N];
              let nx = next.y - prev.y, ny = -(next.x - prev.x); const l = Math.hypot(nx, ny) || 1;
              P[i].x += (nx / l) * diff * 0.5; P[i].y += (ny / l) * diff * 0.5;
            }
            for (const q of P) {
              if (q.y > H - 4) { q.y = H - 4; q.ox = q.x - (q.x - q.ox) * 0.6; }
              if (q.y < 4) q.y = 4;
              if (q.x < 4) { q.x = 4; } if (q.x > W - 4) { q.x = W - 4; }
            }
          }
        }
        ctx.fillStyle = '#ffeef5'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffd6e6'; ctx.fillRect(0, H - 6, W, 6);
        const cx = P.reduce((a, q) => a + q.x, 0) / N, cy = P.reduce((a, q) => a + q.y, 0) / N;
        ctx.fillStyle = 'rgba(200,60,120,.12)';
        ctx.beginPath(); ctx.ellipse(cx, H - 6, R * 0.9, R * 0.12, 0, 0, U.TAU); ctx.fill();
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const a = P[i % N], b = P[(i + 1) % N];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          i ? ctx.quadraticCurveTo(a.x, a.y, mx, my) : ctx.moveTo(mx, my);
        }
        const gr = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R * 1.3);
        gr.addColorStop(0, '#ff9ec7'); gr.addColorStop(1, '#ff3d8b');
        ctx.fillStyle = gr; ctx.fill();
        ctx.strokeStyle = '#d61f6a'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.ellipse(cx - R * 0.35, cy - R * 0.45, R * 0.22, R * 0.12, -0.5, 0, U.TAU); ctx.fill();
        const g = p.idle ? Lab.ghost(t, W, H) : p;
        [-1, 1].forEach((sd) => {
          const ex = cx + sd * R * 0.32, ey = cy - R * 0.05;
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, R * 0.16, R * 0.2, 0, 0, U.TAU); ctx.fill();
          const la = Math.atan2(g.y - ey, g.x - ex), ld = Math.min(R * 0.08, Math.hypot(g.x - ex, g.y - ey) * 0.05);
          ctx.fillStyle = '#2a0a1a'; ctx.beginPath(); ctx.arc(ex + Math.cos(la) * ld, ey + Math.sin(la) * ld, R * 0.09, 0, U.TAU); ctx.fill();
        });
        ctx.strokeStyle = '#2a0a1a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        if (grab >= 0) ctx.ellipse(cx, cy + R * 0.32, R * 0.1, R * 0.12, 0, 0, U.TAU);
        else ctx.arc(cx, cy + R * 0.2, R * 0.15, 0.2, Math.PI - 0.2);
        ctx.stroke();
      });
    },
  });

  /* =======================================================
     8. Ball Pit
     ======================================================= */
  Lab.register({
    id: 'ball-pit', cat: 'physics', title: 'Ball Pit',
    tags: ['collision', 'throw', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const cols = ['#ff5f8f', '#ffcf3f', '#3fb8ff', '#6bffb8', '#b36bff', '#ff8a3d'];
      let Bs = [];
      const init = () => {
        const m = Math.min(c.w, c.h), n = s.large ? 110 : 55;
        Bs = Array.from({ length: n }, () => { const r = m * U.rand(0.035, 0.065); return { x: U.rand(r, c.w - r), y: U.rand(-c.h, c.h * 0.5), vx: 0, vy: 0, r, c: U.pick(cols) }; });
      };
      init(); c.onresize = init;
      const p = s.pointer();
      let grab = null, px = 0, py = 0, mvx = 0, mvy = 0;
      p.ondown = () => { grab = Bs.find((b) => Math.hypot(b.x - p.x, b.y - p.y) < b.r) || null; };
      p.onup = () => { if (grab) { grab.vx = mvx; grab.vy = mvy; } grab = null; };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, h = Math.min(dt, 1 / 30) / 2;
        const g = p.idle ? { x: W / 2 + Math.sin(t * 1.2) * W * 0.4, y: H * 0.75 + Math.sin(t * 2.4) * H * 0.15 } : p;
        mvx = (g.x - px) / Math.max(dt, 1e-3); mvy = (g.y - py) / Math.max(dt, 1e-3); px = g.x; py = g.y;
        const cr = Math.min(W, H) * 0.06;
        for (let sub = 0; sub < 2; sub++) {
          for (const b of Bs) {
            if (b === grab) { b.vx = (g.x - b.x) / h * 0.3; b.vy = (g.y - b.y) / h * 0.3; }
            else b.vy += 1500 * h;
            b.x += b.vx * h; b.y += b.vy * h;
            if (b.y > H - b.r) { b.y = H - b.r; b.vy *= -0.4; b.vx *= 0.98; }
            if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; } if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
            if (!grab) {
              const dx = b.x - g.x, dy = b.y - g.y, d = Math.hypot(dx, dy), md = b.r + cr;
              if (d < md && d > 0) { const o = (md - d) / d; b.x += dx * o; b.y += dy * o; b.vx += dx / d * 30 + mvx * 0.05; b.vy += dy / d * 30 + mvy * 0.05; }
            }
          }
          for (let i = 0; i < Bs.length; i++) for (let j = i + 1; j < Bs.length; j++) {
            const a = Bs[i], b = Bs[j];
            const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, md = a.r + b.r;
            if (d2 < md * md && d2 > 0) {
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (md - d) / 2;
              a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
              const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rv < 0) { const im = rv * 0.85; a.vx += nx * im; a.vy += ny * im; b.vx -= nx * im; b.vy -= ny * im; }
            }
          }
        }
        ctx.fillStyle = '#1a1530'; ctx.fillRect(0, 0, W, H);
        for (const b of Bs) {
          const gr = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
          gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, b.c); gr.addColorStop(1, b.c);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, U.TAU); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0.2, Math.PI - 0.2); ctx.arc(b.x, b.y - b.r * 0.15, b.r * 0.9, Math.PI - 0.25, 0.25, true); ctx.fill();
        }
        if (!grab) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.x, g.y, cr, 0, U.TAU); ctx.stroke(); }
      });
    },
  });

  /* =======================================================
     9. Double Pendulum — 카오스
     ======================================================= */
  Lab.register({
    id: 'double-pendulum', cat: 'physics', title: 'Chaos Pendulum',
    tags: ['RK4', 'chaos', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const trail = s.canvas();
      trail.cv.style.zIndex = -1;
      let st = [Math.PI * 0.75, 0, Math.PI * 0.9, 0];
      const m1 = 1, m2 = 1, gr = 9.81;
      const deriv = ([a1, w1, a2, w2]) => {
        const d = a1 - a2, den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
        const dw1 = (-gr * (2 * m1 + m2) * Math.sin(a1) - m2 * gr * Math.sin(a1 - 2 * a2) - 2 * Math.sin(d) * m2 * (w2 * w2 + w1 * w1 * Math.cos(d))) / den;
        const dw2 = (2 * Math.sin(d) * (w1 * w1 * (m1 + m2) + gr * (m1 + m2) * Math.cos(a1) + w2 * w2 * m2 * Math.cos(d))) / den;
        return [w1, dw1, w2, dw2];
      };
      const rk4 = (y, h) => {
        const add = (a, b, k) => a.map((v, i) => v + b[i] * k);
        const k1 = deriv(y), k2 = deriv(add(y, k1, h / 2)), k3 = deriv(add(y, k2, h / 2)), k4 = deriv(add(y, k3, h));
        return y.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      };
      const p = s.pointer();
      let drag = 0, lx = null, ly = null, hue = 0;
      const geo = () => { const L = Math.min(c.w, c.h) * 0.22; return { L, ox: c.w / 2, oy: c.h * 0.42 }; };
      const pos = () => { const { L, ox, oy } = geo(); const x1 = ox + Math.sin(st[0]) * L, y1 = oy + Math.cos(st[0]) * L; return { x1, y1, x2: x1 + Math.sin(st[2]) * L, y2: y1 + Math.cos(st[2]) * L }; };
      p.ondown = () => { const q = pos(); drag = Math.hypot(p.x - q.x2, p.y - q.y2) < 40 ? 2 : Math.hypot(p.x - q.x1, p.y - q.y1) < 40 ? 1 : 2; };
      p.onup = () => { drag = 0; lx = null; };
      let idleKick = 6;
      s.raf((dt) => {
        const W = c.w, H = c.h, { L, ox, oy } = geo();
        if (drag) {
          if (drag === 1) { st[0] = Math.atan2(p.x - ox, p.y - oy); }
          else { const q = pos(); st[2] = Math.atan2(p.x - q.x1, p.y - q.y1); }
          st[1] = st[3] = 0; lx = null;
        } else {
          const h = (dt * 2.2) / 8;
          for (let i = 0; i < 8; i++) st = rk4(st, h);
          st[1] *= 0.9999; st[3] *= 0.9999;
        }
        if (p.idle) { idleKick -= dt; if (idleKick < 0) { idleKick = 9; st = [U.rand(1.6, 3), 0, U.rand(1.6, 3.1), 0]; trail.ctx.clearRect(0, 0, W, H); lx = null; } }
        const q = pos();
        const t = trail.ctx;
        t.fillStyle = 'rgba(8,6,16,.012)'; t.fillRect(0, 0, W, H);
        hue = (hue + dt * 30) % 360;
        if (lx !== null) { t.strokeStyle = `hsl(${hue},90%,62%)`; t.lineWidth = s.large ? 2 : 1.5; t.lineCap = 'round'; t.beginPath(); t.moveTo(lx, ly); t.lineTo(q.x2, q.y2); t.stroke(); }
        lx = q.x2; ly = q.y2;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(q.x1, q.y1); ctx.lineTo(q.x2, q.y2); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#ffcf5c'; ctx.beginPath(); ctx.arc(q.x1, q.y1, L * 0.08, 0, U.TAU); ctx.fill();
        ctx.fillStyle = `hsl(${hue},90%,62%)`; ctx.beginPath(); ctx.arc(q.x2, q.y2, L * 0.09, 0, U.TAU); ctx.fill();
      });
      el.style.background = '#08060f';
    },
  });
})();
