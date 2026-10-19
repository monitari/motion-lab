/* =========================================================
   GENERATIVE — 캔버스 생성 예술
   ========================================================= */
(() => {
  const { U } = Lab;

  /** 색조별 부드러운 원형 스프라이트 */
  const spriteCache = {};
  function glowSprite(hue, sat = 100, light = 60) {
    const k = hue + '_' + sat + '_' + light;
    if (spriteCache[k]) return spriteCache[k];
    const c = Lab.offscreen(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `hsla(${hue},${sat}%,${light + 25}%,1)`);
    g.addColorStop(0.25, `hsla(${hue},${sat}%,${light}%,.6)`);
    g.addColorStop(1, `hsla(${hue},${sat}%,${light}%,0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (spriteCache[k] = c);
  }

  /* =======================================================
     1. Flow Field
     ======================================================= */
  Lab.register({
    id: 'flow-field', cat: 'canvas', title: 'Flow Field', feature: true,
    tags: ['perlin noise', 'particles', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const T = s.params({ count: [s.large ? 4200 : 1800, 500, 9000, 100, '입자 수', true], speed: [1.6, 0.3, 5, 0.1, '속도'], zoom: [1, 0.3, 3, 0.05, '노이즈 크기'], swirl: [2.5, 0, 8, 0.1, '소용돌이'] });
      const N = Math.round(T.count);
      const palettes = [[190, 220, 260, 300, 330, 20], [20, 35, 45, 340, 0, 50], [120, 150, 170, 190, 80, 60], [260, 280, 300, 200, 220, 320]];
      let pal = 0;
      const P = Array.from({ length: N }, () => ({ x: U.rand(c.w), y: U.rand(c.h), a: U.rand(100) }));
      ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, c.w, c.h);
      c.onresize = () => { ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, c.w, c.h); };
      const p = s.pointer();
      p.ondown = () => { pal = (pal + 1) % palettes.length; };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, sc = (0.0028 / T.zoom) * (900 / Math.max(W, 300)) ** 0.3;
        ctx.fillStyle = 'rgba(5,5,10,.06)'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 0.8, W, H) : p;
        const R = Math.min(W, H) * 0.25;
        ctx.lineWidth = s.large ? 1.2 : 1;
        const hues = palettes[pal];
        for (let b = 0; b < 6; b++) {
          ctx.strokeStyle = `hsla(${hues[b]},90%,62%,.55)`;
          ctx.beginPath();
          for (let i = b; i < N; i += 6) {
            const q = P[i];
            let ang = Lab.noise(q.x * sc, q.y * sc, t * 0.08) * U.TAU * 2;
            let vx = Math.cos(ang), vy = Math.sin(ang);
            const dx = q.x - g.x, dy = q.y - g.y, d = Math.hypot(dx, dy);
            if (d < R) { const k = (1 - d / R) * T.swirl * (p.down ? 2 : 1); vx += (-dy / d) * k; vy += (dx / d) * k; }
            const sp = T.speed * (dt * 60);
            const nx = q.x + vx * sp, ny = q.y + vy * sp;
            ctx.moveTo(q.x, q.y); ctx.lineTo(nx, ny);
            q.x = nx; q.y = ny; q.a -= dt;
            if (q.x < 0 || q.x > W || q.y < 0 || q.y > H || q.a < 0) { q.x = U.rand(W); q.y = U.rand(H); q.a = U.rand(3, 12); }
          }
          ctx.stroke();
        }
      });
    },
  });

  /* =======================================================
     2. Warp Starfield
     ======================================================= */
  Lab.register({
    id: 'warp-stars', cat: 'canvas', title: 'Hyperspace',
    tags: ['3D projection', 'streaks', 'hold'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const T = s.params({ cruise: [0.35, 0, 1.5, 0.05, '순항 속도'], warp: [3.2, 1, 8, 0.1, '워프 속도'] });
      const N = s.large ? 1500 : 800;
      const S = Array.from({ length: N }, () => ({ x: U.rand(-1, 1), y: U.rand(-1, 1), z: U.rand(0.02, 1), pz: 0, h: U.rand(180, 300) }));
      S.forEach((q) => (q.pz = q.z));
      const p = s.pointer();
      let speed = 0.35, cx = c.w / 2, cy = c.h / 2;
      s.raf((dt, t) => {
        const W = c.w, H = c.h, F = Math.max(W, H) * 0.5;
        const g = p.idle ? Lab.ghost(t * 0.5, W, H) : p;
        cx += (g.x - cx) * U.damp(3, dt); cy += (g.y - cy) * U.damp(3, dt);
        const target = p.down ? T.warp : p.idle && Math.sin(t * 0.5) > 0.85 ? T.warp * 0.8 : T.cruise;
        speed += (target - speed) * U.damp(2.2, dt);
        ctx.fillStyle = `rgba(3,3,10,${U.clamp(0.9 - speed * 0.25, 0.15, 0.9)})`; ctx.fillRect(0, 0, W, H);
        ctx.lineCap = 'round';
        for (const q of S) {
          q.pz = q.z;
          q.z -= speed * dt * 0.5;
          if (q.z <= 0.01) { q.x = U.rand(-1, 1); q.y = U.rand(-1, 1); q.z = 1; q.pz = 1; continue; }
          const sx = cx + (q.x / q.z) * F, sy = cy + (q.y / q.z) * F;
          const px = cx + (q.x / q.pz) * F, py = cy + (q.y / q.pz) * F;
          if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) { q.z = 1; q.pz = 1; q.x = U.rand(-1, 1); q.y = U.rand(-1, 1); continue; }
          const warp = U.clamp((speed - 0.6) / 1.5, 0, 1);
          const b = 1 - q.z, bb = U.lerp(Math.min(1, 0.28 + Math.sqrt(b) * 0.9), b, warp); // 순항 중엔 먼 별도 희미하게 보이고, 워프 중엔 가까운 별만 밝게
          ctx.strokeStyle = speed > 1 ? `hsla(${q.h},100%,${60 + b * 30}%,${bb})` : `rgba(220,230,255,${bb})`;
          ctx.lineWidth = Math.max(U.lerp(1.3, 0.8, warp), b * (s.large ? U.lerp(3.6, 2.4, warp) : U.lerp(2.8, 1.8, warp)));
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx + 0.1, sy); ctx.stroke();
        }
      });
    },
  });

  /* =======================================================
     3. Fireworks
     ======================================================= */
  Lab.register({
    id: 'fireworks', cat: 'canvas', title: 'Fireworks', sound: true,
    tags: ['particles', 'gravity', 'click'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const rockets = [], sparks = [];
      const launch = (tx, ty) => {
        const W = c.w, H = c.h;
        const x0 = U.lerp(W * 0.3, W * 0.7, Math.random());
        const T = U.rand(0.8, 1.1);
        rockets.push({ x: x0, y: H, vx: (tx - x0) / T, vy: (ty - H) / T - 0.5 * 250 * T, t: 0, T, tx, ty, h: U.rand(360) });
      };
      const burst = (r) => {
        const type = U.pick(['peony', 'ring', 'willow', 'crackle', 'double']);
        const n = s.large ? 140 : 80;
        const sp = Math.min(c.w, c.h) * 0.42;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * U.TAU + U.rand(-0.05, 0.05);
          let v = type === 'ring' ? sp : sp * Math.sqrt(Math.random());
          const hue = type === 'double' && i % 2 ? r.h + 140 : r.h + U.rand(-15, 15);
          sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: type === 'willow' ? U.rand(2, 3) : U.rand(1, 1.6), age: 0, h: hue,
            drag: type === 'willow' ? 2.6 : 1.6, crackle: type === 'crackle', willow: type === 'willow' });
        }
        flash = 1;
      };
      let flash = 0, auto = 0;
      const p = s.pointer();
      p.ondown = () => { launch(p.x, p.y); rockets[rockets.length - 1].user = true; if (s.large) Lab.burst({ dur: 0.25, freq: 900, q: 0.8, gain: 0.25, curve: 1.5 }); };
      s.raf((dt) => {
        const W = c.w, H = c.h;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(6,4,18,${0.22})`; ctx.fillRect(0, 0, W, H);
        if (flash > 0) { ctx.fillStyle = `rgba(255,220,200,${flash * 0.06})`; ctx.fillRect(0, 0, W, H); flash -= dt * 3; }
        if (p.idle) { auto -= dt; if (auto < 0) { auto = U.rand(0.5, 1.2); launch(U.rand(W * 0.15, W * 0.85), U.rand(H * 0.15, H * 0.45)); } }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.t += dt; r.vy += 250 * dt; r.x += r.vx * dt; r.y += r.vy * dt;
          ctx.drawImage(glowSprite(40, 100, 70), r.x - 6, r.y - 6, 12, 12);
          if (Math.random() < 0.8) sparks.push({ x: r.x, y: r.y, vx: U.rand(-20, 20), vy: U.rand(20, 60), life: 0.4, age: 0, h: 35, drag: 3 });
          if (r.t >= r.T) { burst(r); if (s.large && r.user) Lab.burst({ dur: 0.9, freq: 260, q: 0.4, gain: 0.8, curve: 2.5 }); rockets.splice(i, 1); }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const q = sparks[i];
          q.age += dt;
          if (q.age > q.life) { sparks.splice(i, 1); continue; }
          const d = Math.exp(-q.drag * dt);
          q.vx *= d; q.vy = q.vy * d + (q.willow ? 60 : 120) * dt;
          q.x += q.vx * dt; q.y += q.vy * dt;
          const k = 1 - q.age / q.life;
          let size = (s.large ? 9 : 6) * (0.4 + k);
          if (q.crackle && q.age > q.life * 0.5 && Math.random() < 0.5) size *= 2.2;
          ctx.globalAlpha = k;
          ctx.drawImage(glowSprite(Math.round(q.h / 10) * 10 % 360, 100, 60), q.x - size / 2, q.y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        if (sparks.length > 6000) sparks.splice(0, sparks.length - 6000);
      });
    },
  });

  /* =======================================================
     4. Sakura Fractal Tree
     ======================================================= */
  Lab.register({
    id: 'fractal-tree', cat: 'canvas', title: 'Sakura Fractal',
    tags: ['recursion', 'wind', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const petals = [];
      let shake = 0;
      const p = s.pointer();
      p.ondown = () => { shake = 1; for (let i = 0; i < 60; i++) petals.push(newPetal(true)); };
      const newPetal = (burst) => ({
        x: burst ? c.w / 2 + U.rand(-c.w * 0.3, c.w * 0.3) : U.rand(c.w), y: burst ? U.rand(c.h * 0.1, c.h * 0.5) : -10,
        vx: U.rand(-20, 40), vy: U.rand(20, 50), r: U.rand(3, 6) * (c.h / 500), a: U.rand(U.TAU), va: U.rand(-3, 3), ph: U.rand(10),
      });
      const T = s.params({ depth: [s.large ? 11 : 9, 4, 13, 1, '재귀 깊이'], ratio: [0.74, 0.55, 0.85, 0.01, '가지 비율'] });
      const AX = { x: 0.45, v: 0 }, WX = { x: 0.3, v: 0 };
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        const g = p.idle ? { x: W * (0.5 + 0.3 * Math.sin(t * 0.4)), y: H * (0.5 + 0.3 * Math.sin(t * 0.27)) } : p;
        U.spring(AX, U.clamp(g.x / W, 0, 1), dt, 30, 9); U.spring(WX, U.clamp(g.y / H, 0, 1), dt, 30, 9);
        shake = Math.max(0, shake - dt * 0.8);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a1030'); bg.addColorStop(1, '#3a1c3c');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffe6f0'; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, Math.min(W, H) * 0.07, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#120a1c'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.98, W * 0.6, H * 0.08, 0, 0, U.TAU); ctx.fill();
        const spread = 0.18 + AX.x * 0.75;
        const wind = WX.x * 0.12 + shake * 0.25;
        const depth = Math.round(T.depth);
        const blossoms = [];
        const branch = (x, y, len, ang, d) => {
          const sway = Math.sin(t * 1.6 + d * 0.7) * wind * (1 - d / depth + 0.3) + Math.sin(t * 9) * shake * 0.05;
          const a = ang + sway;
          const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
          ctx.strokeStyle = `hsl(${20 + d * 4},${30 + d * 3}%,${14 + d * 3}%)`;
          ctx.lineWidth = Math.max(0.6, (depth - d) * 1.5 * (H / 600));
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
          if (d >= depth) { blossoms.push(x2, y2); return; }
          branch(x2, y2, len * T.ratio, a - spread * (0.8 + 0.2 * Math.sin(d)), d + 1);
          branch(x2, y2, len * (T.ratio - 0.02), a + spread * (0.9 + 0.1 * Math.cos(d)), d + 1);
        };
        ctx.lineCap = 'round';
        branch(W / 2, H * 0.95, H * 0.2, -Math.PI / 2, 0);
        for (let i = 0; i < blossoms.length; i += 2) {
          ctx.fillStyle = `hsla(${335 + (i % 7) * 3},90%,${78 + (i % 5) * 3}%,.85)`;
          ctx.beginPath(); ctx.arc(blossoms[i], blossoms[i + 1], (H / 500) * (2.2 + (i % 3)), 0, U.TAU); ctx.fill();
        }
        if (Math.random() < dt * (3 + wind * 30)) petals.push(newPetal(false));
        for (let i = petals.length - 1; i >= 0; i--) {
          const q = petals[i];
          q.vx += (wind * 200 - q.vx * 0.5) * dt; q.x += (q.vx + Math.sin(t * 2 + q.ph) * 20) * dt; q.y += q.vy * dt; q.a += q.va * dt;
          if (q.y > H + 10 || q.x > W + 20) { petals.splice(i, 1); continue; }
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.scale(1, Math.abs(Math.sin(q.a * 0.7)) * 0.6 + 0.4);
          ctx.fillStyle = '#ffc4dc'; ctx.beginPath(); ctx.ellipse(0, 0, q.r, q.r * 0.6, 0, 0, U.TAU); ctx.fill(); ctx.restore();
        }
      });
    },
  });

  /* =======================================================
     5. Dot Globe
     ======================================================= */
  Lab.register({
    id: 'dot-globe', cat: 'canvas', title: 'Dot Globe',
    tags: ['3D', 'fibonacci sphere', 'drag'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const N = s.large ? 2600 : 1400;
      const pts = [];
      const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        const n = Lab.noise(x * 1.6 + 10, y * 1.6, z * 1.6) + 0.5 * Lab.noise(x * 4, y * 4 + 5, z * 4);
        pts.push([x, y, z, n > 0.02]);
      }
      const land = pts.filter((q) => q[3]);
      const arcs = [];
      const newArc = () => {
        const a = U.pick(land);
        let b = U.pick(land);
        // 너무 가깝거나 지구 반대편이면 다시 고른다 (반대편이면 slerp가 불안정)
        for (let k = 0; k < 20; k++) { const d = Math.acos(U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)); if (d > 0.5 && d < 1.9) break; b = U.pick(land); }
        arcs.push({ a, b, t: 0, h: U.pick([190, 320, 45]) });
      };
      for (let i = 0; i < 5; i++) newArc();
      let yaw = 0, pitch = -0.35, vy = 0.25, vp = 0, drag = false, lx = 0, ly = 0;
      const p = s.pointer();
      p.ondown = () => { drag = true; lx = p.x; ly = p.y; };
      p.onup = () => (drag = false);
      const rot = (q, cy, sy, cp, sp) => {
        const x = q[0] * cy - q[2] * sy, z = q[0] * sy + q[2] * cy;
        const y = q[1] * cp - z * sp, z2 = q[1] * sp + z * cp;
        return [x, y, z2];
      };
      const slerp = (a, b, t) => {
        const d = U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d);
        if (om < 1e-3) return a;
        const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
        const h = 1 + Math.sin(t * Math.PI) * Math.min(om, 1.6) * 0.14;
        return [(a[0] * s1 + b[0] * s2) * h, (a[1] * s1 + b[1] * s2) * h, (a[2] * s1 + b[2] * s2) * h];
      };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, R = Math.min(W, H) * 0.38, cx = W / 2, cy0 = H / 2;
        if (drag) { const dx = p.x - lx, dy = p.y - ly; lx = p.x; ly = p.y; vy = (dx / R) / Math.max(dt, 1e-3); vp = (dy / R) / Math.max(dt, 1e-3); }
        else { vy += (0.25 - vy) * U.damp(0.8, dt); vp += (0 - vp) * U.damp(2, dt); }
        yaw += vy * dt; pitch = U.clamp(pitch + vp * dt, -1.2, 1.2);
        const cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
        ctx.fillStyle = '#04060f'; ctx.fillRect(0, 0, W, H);
        const gl = ctx.createRadialGradient(cx, cy0, R * 0.8, cx, cy0, R * 1.5);
        gl.addColorStop(0, 'rgba(60,140,255,.25)'); gl.addColorStop(1, 'rgba(60,140,255,0)');
        ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
        const body = ctx.createRadialGradient(cx - R * 0.35, cy0 - R * 0.4, R * 0.1, cx, cy0, R);
        body.addColorStop(0, '#16264a'); body.addColorStop(0.7, '#0a1226'); body.addColorStop(1, '#060a18');
        ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy0, R, 0, U.TAU); ctx.fill();
        const hx = p.idle ? -1e4 : p.x, hy = p.idle ? -1e4 : p.y;
        c.cv.style.cursor = drag ? 'grabbing' : 'grab';
        for (const q of pts) {
          const [x, y, z] = rot(q, cY, sY, cP, sP);
          const sx = cx + x * R, sy = cy0 + y * R;
          if (z > 0.02) continue; // 뒷면은 불투명한 몸통에 가려진다
          const front = 0;
          const depth = (1 - z) / 2;
          // 왼쪽 위에서 오는 빛
          const lit = U.clamp(0.35 + (-x * 0.45 - y * 0.55 - z * 0.7) * 0.8, 0.15, 1);
          let sz = (q[3] ? 2.6 : 1.1) * (0.5 + depth * 0.8) * Math.max(1, R / 200);
          let a = q[3] ? (0.45 + depth * 0.55) * lit : 0.1 + depth * 0.18;
          const dh = Math.hypot(sx - hx, sy - hy);
          let col = q[3] ? '140,215,255' : '70,100,170';
          if (dh < R * 0.25 && !front) { const k = 1 - dh / (R * 0.25); sz *= 1 + k * 1.5; a = Math.min(1, a + k); col = '255,140,220'; }
          ctx.fillStyle = `rgba(${col},${a})`;
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
        const atm = ctx.createRadialGradient(cx, cy0, R * 0.96, cx, cy0, R * 1.14);
        atm.addColorStop(0, 'rgba(120,190,255,.45)'); atm.addColorStop(0.35, 'rgba(80,150,255,.18)'); atm.addColorStop(1, 'rgba(60,120,255,0)');
        ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(cx, cy0, R * 1.14, 0, U.TAU); ctx.arc(cx, cy0, R * 0.96, 0, U.TAU, true); ctx.fill();
        ctx.lineWidth = Math.max(1, R / 180);
        for (let i = arcs.length - 1; i >= 0; i--) {
          const ar = arcs[i];
          ar.t += dt * 0.35;
          if (ar.t > 2) { arcs.splice(i, 1); newArc(); continue; }
          const t0 = Math.max(0, ar.t - 1), t1 = Math.min(1, ar.t);
          ctx.beginPath();
          let first = true;
          for (let k = 0; k <= 30; k++) {
            const tt = t0 + ((t1 - t0) * k) / 30;
            const [x, y, z] = rot(slerp(ar.a, ar.b, tt), cY, sY, cP, sP);
            if (z > 0 && x * x + y * y < 1) { first = true; continue; } // 지구 뒤에 가려진 구간
            const sx = cx + x * R, sy = cy0 + y * R;
            first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); first = false;
          }
          ctx.strokeStyle = `hsla(${ar.h},100%,70%,.85)`; ctx.stroke();
          // 날아가는 머리
          const [hx2, hy2, hz2] = rot(slerp(ar.a, ar.b, t1), cY, sY, cP, sP);
          if (ar.t < 1 && !(hz2 > 0 && hx2 * hx2 + hy2 * hy2 < 1)) { ctx.fillStyle = `hsl(${ar.h},100%,82%)`; ctx.beginPath(); ctx.arc(cx + hx2 * R, cy0 + hy2 * R, Math.max(2, R / 110), 0, U.TAU); ctx.fill(); }
        }
      });
    },
  });

  /* =======================================================
     6. Black Hole
     ======================================================= */
  Lab.register({
    id: 'black-hole', cat: 'canvas', title: 'Black Hole',
    tags: ['gravity', 'orbits', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const N = s.large ? 3000 : 1300;
      const T = s.params({ mass: [1, 0.3, 3, 0.05, '질량'] });
      let bx = c.w / 2, by = c.h / 2;
      const spawn = (q, near) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        const r = near ? U.rand(m * 0.12, m * 0.48) : U.rand(m * 0.3, m * 0.55);
        const a = U.rand(U.TAU);
        q.x = bx + Math.cos(a) * r; q.y = by + Math.sin(a) * r * 0.9;
        const GM = m * m * 30;
        const v = Math.sqrt(GM / r) * U.rand(0.85, 1.05);
        q.vx = -Math.sin(a) * v; q.vy = Math.cos(a) * v;
        q.h = U.rand(15, 45);
      };
      const P = Array.from({ length: N }, () => { const q = {}; spawn(q, true); return q; });
      const p = s.pointer();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.w, c.h);
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        const g = p.idle ? { x: W / 2 + Math.sin(t * 0.5) * W * 0.12, y: H / 2 + Math.cos(t * 0.37) * H * 0.1 } : p;
        bx += (g.x - bx) * U.damp(2.5, dt); by += (g.y - by) * U.damp(2.5, dt);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 0, W, H);
        const GM = m * m * 30 * T.mass * (p.down ? 3 : 1);
        const eh = m * 0.05, soft = m * 0.02;
        ctx.globalCompositeOperation = 'lighter';
        const sub = 2, h = dt / sub;
        for (const q of P) {
          for (let k = 0; k < sub; k++) {
            const dx = bx - q.x, dy = by - q.y, d2 = dx * dx + dy * dy + soft * soft, d = Math.sqrt(d2);
            const a = GM / d2;
            q.vx += (dx / d) * a * h; q.vy += (dy / d) * a * h;
            q.x += q.vx * h; q.y += q.vy * h;
          }
          const d = Math.hypot(q.x - bx, q.y - by);
          if (d < eh || d > m * 1.2) { spawn(q, false); continue; }
          const sp = Math.hypot(q.vx, q.vy);
          const heat = U.clamp(1 - d / (m * 0.5), 0, 1);
          ctx.fillStyle = `hsla(${q.h + heat * 20},100%,${50 + heat * 40}%,${0.35 + heat * 0.5})`;
          const sz = 1 + heat * 1.6;
          ctx.fillRect(q.x, q.y, sz, sz);
          q.vx *= 1 - 0.002 * (sp / 1000);
        }
        ctx.globalCompositeOperation = 'source-over';
        const rg = ctx.createRadialGradient(bx, by, eh * 0.8, bx, by, eh * 2.2);
        rg.addColorStop(0, '#000'); rg.addColorStop(0.45, 'rgba(255,170,80,.55)'); rg.addColorStop(0.6, 'rgba(255,120,40,.15)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(bx, by, eh * 2.2, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(bx, by, eh, 0, U.TAU); ctx.fill();
      });
    },
  });

  /* =======================================================
     7. Ridge Lines (Unknown Pleasures)
     ======================================================= */
  Lab.register({
    id: 'ridge-lines', cat: 'canvas', title: 'Pulsar Ridges',
    tags: ['noise', 'occlusion', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const p = s.pointer();
      let quake = 0;
      p.ondown = () => (quake = 1);
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        quake = Math.max(0, quake - dt * 0.7);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 0.7, W, H) : p;
        const L = s.large ? 64 : 40, S = s.large ? 120 : 80;
        const x0 = W * 0.18, x1 = W * 0.82, y0 = H * 0.16, y1 = H * 0.92;
        const amp = (y1 - y0) / L * 7;
        ctx.lineWidth = s.large ? 1.6 : 1.2; ctx.lineJoin = 'round';
        for (let i = 0; i < L; i++) {
          const yb = y0 + ((y1 - y0) * i) / (L - 1);
          ctx.beginPath();
          for (let k = 0; k <= S; k++) {
            const x = x0 + ((x1 - x0) * k) / S;
            const u = k / S;
            const env = Math.pow(Math.sin(u * Math.PI), 4) * 0.8 + 0.05;
            let h = (Lab.noise(u * 7, i * 0.35, t * 0.35) * 0.5 + 0.5) * env;
            h += Math.pow(Math.max(0, Lab.noise(u * 18, i * 0.9, t * 0.6)), 2) * env * 2;
            const dx = (x - g.x) / (W * 0.08), dy = (yb - g.y) / (H * 0.1);
            h += Math.exp(-(dx * dx + dy * dy)) * 2.2;
            h += quake * Math.sin(u * 40 + t * 30 + i) * 0.4 * env;
            const y = yb - h * amp;
            k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.lineTo(x1, yb + 2); ctx.lineTo(x0, yb + 2); ctx.closePath();
          ctx.fillStyle = '#000'; ctx.fill();
          ctx.strokeStyle = '#f2f2f2'; ctx.stroke();
        }
      });
    },
  });

  /* =======================================================
     8. Plasma Globe
     ======================================================= */
  Lab.register({
    id: 'plasma-globe', cat: 'canvas', title: 'Plasma Globe',
    tags: ['midpoint displacement', 'glow', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const N = 9;
      const T = Array.from({ length: N }, () => ({ a: U.rand(U.TAU), va: U.rand(-0.6, 0.6), h: U.rand(270, 320) }));
      const p = s.pointer();
      let zap = 0;
      p.ondown = () => (zap = 1);
      const bolt = (x0, y0, x1, y1, disp, depth, out) => {
        if (depth === 0) { out.push(x1, y1); return; }
        const mx = (x0 + x1) / 2 + U.rand(-disp, disp), my = (y0 + y1) / 2 + U.rand(-disp, disp);
        bolt(x0, y0, mx, my, disp / 2, depth - 1, out);
        bolt(mx, my, x1, y1, disp / 2, depth - 1, out);
      };
      const draw = (pts, x0, y0, w, hue, a) => {
        ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.strokeStyle = `hsla(${hue},100%,60%,${0.25 * a})`; ctx.lineWidth = w * 4; ctx.stroke();
        ctx.strokeStyle = `hsla(${hue},100%,75%,${0.6 * a})`; ctx.lineWidth = w * 1.6; ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = w * 0.5; ctx.stroke();
      };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, R = Math.min(W, H) * 0.4, cx = W / 2, cy = H / 2;
        zap = Math.max(0, zap - dt * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#05030c'; ctx.fillRect(0, 0, W, H);
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        bg.addColorStop(0, 'rgba(120,40,200,.35)'); bg.addColorStop(1, 'rgba(40,10,80,.15)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, U.TAU); ctx.fill();
        const g = p.idle ? { x: cx + Math.cos(t * 0.7) * R * 1.15, y: cy + Math.sin(t * 0.9) * R * 0.9 } : p;
        const dm = Math.hypot(g.x - cx, g.y - cy);
        const near = U.clamp(1 - (dm - R) / (R * 0.6), 0, 1);
        const ma = Math.atan2(g.y - cy, g.x - cx);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const core = R * 0.12;
        T.forEach((q, i) => {
          q.a += q.va * dt + Math.sin(t + i) * 0.01;
          let a = q.a;
          const pull = i < 4 ? near : near * 0.3;
          if (pull > 0) { let d = ma - a; d = Math.atan2(Math.sin(d), Math.cos(d)); a += d * pull * 0.95; }
          if (zap > 0) { let d = ma - a; d = Math.atan2(Math.sin(d), Math.cos(d)); a += d * zap; }
          const ex = cx + Math.cos(a) * R * 0.98, ey = cy + Math.sin(a) * R * 0.98;
          const pts = [];
          bolt(cx, cy, ex, ey, R * 0.18, s.large ? 6 : 5, pts);
          draw(pts, cx, cy, Math.max(1, R / 160) * (1 + zap), q.h, 0.7 + pull * 0.3);
          if (pull > 0.6 && i < 4 && dm < R * 1.4 && !p.idle) {
            const pts2 = []; bolt(ex, ey, g.x, g.y, R * 0.08, 4, pts2);
            draw(pts2, ex, ey, Math.max(1, R / 220), q.h, (pull - 0.6) * 2.5);
          }
        });
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, core * 2);
        cg.addColorStop(0, 'rgba(255,230,255,1)'); cg.addColorStop(0.3, 'rgba(220,140,255,.8)'); cg.addColorStop(1, 'rgba(160,60,255,0)');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, core * 2, 0, U.TAU); ctx.fill();
        if (zap > 0) { ctx.fillStyle = `rgba(200,150,255,${zap * 0.2})`; ctx.fillRect(0, 0, W, H); }
        ctx.globalCompositeOperation = 'source-over';
        // glass
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = Math.max(1, R / 100);
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, U.TAU); ctx.stroke();
        const hl = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, 0, cx - R * 0.4, cy - R * 0.45, R * 0.5);
        hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(cx, cy, R, 0, U.TAU); ctx.fill();
        // base
        ctx.fillStyle = '#15121c'; ctx.beginPath();
        ctx.moveTo(cx - R * 0.45, cy + R * 0.9); ctx.lineTo(cx + R * 0.45, cy + R * 0.9); ctx.lineTo(cx + R * 0.6, H); ctx.lineTo(cx - R * 0.6, H); ctx.fill();
      });
    },
  });

  /* =======================================================
     9. Matrix Rain (lens)
     ======================================================= */
  Lab.register({
    id: 'matrix-rain', cat: 'canvas', title: 'Digital Rain',
    tags: ['glyphs', 'lens', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const G = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>*+';
      let cols = [], fs = 16;
      const init = () => {
        fs = Math.max(11, Math.round(Math.min(c.w, c.h) / (s.large ? 42 : 26)));
        const n = Math.ceil(c.w / fs);
        cols = Array.from({ length: n }, () => ({ y: U.rand(-c.h, 0), v: U.rand(0.6, 1.4) }));
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.w, c.h);
      };
      init(); c.onresize = init;
      const p = s.pointer();
      const waves = [];
      p.ondown = () => waves.push({ x: p.x, y: p.y, r: 0 });
      let acc = 0;
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        acc += dt;
        if (acc < 1 / 30) return;
        const step = acc; acc = 0;
        ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 0.6, W, H) : p;
        const R = Math.min(W, H) * 0.18;
        waves.forEach((w) => (w.r += step * Math.max(W, H) * 0.6));
        while (waves.length && waves[0].r > Math.max(W, H) * 1.5) waves.shift();
        ctx.textAlign = 'center';
        let curFont = '';
        cols.forEach((col, i) => {
          const x = i * fs + fs / 2;
          col.y += fs * col.v * step * 30 * 0.5;
          if (col.y > H + fs * 10 && Math.random() < 0.05) col.y = U.rand(-H * 0.5, 0);
          // 파동 고리가 이 열을 지나는 두 지점에 밝은 글자를 찍는다
          for (const w of waves) {
            const dx = x - w.x, rem = w.r * w.r - dx * dx;
            if (rem <= 0) continue;
            const off = Math.sqrt(rem), fade = Math.max(0, 1 - w.r / (Math.max(W, H) * 1.2));
            ctx.font = curFont = `${fs}px "JetBrains Mono",monospace`;
            ctx.fillStyle = `rgba(220,255,235,${fade})`;
            for (const yy of [w.y - off, w.y + off]) if (yy > -fs && yy < H + fs) ctx.fillText(G[(Math.random() * G.length) | 0], x, yy);
          }
          const y = col.y;
          const d = Math.hypot(x - g.x, y - g.y);
          const k = d < R ? 1 - d / R : 0;
          const size = Math.round(fs * (1 + k * 1.2));
          const f = `${size}px "JetBrains Mono",monospace`;
          if (f !== curFont) { ctx.font = f; curFont = f; }
          ctx.fillStyle = k > 0 ? `rgb(${200 + k * 55},255,${220 + k * 35})` : '#b8ffcf';
          ctx.fillText(G[(Math.random() * G.length) | 0], x, y);
          ctx.fillStyle = k > 0 ? `rgba(120,255,200,${0.4 + k * 0.6})` : 'rgba(30,220,90,.7)';
          ctx.fillText(G[(Math.random() * G.length) | 0], x, y - fs);
        });
      });
    },
  });

  /* =======================================================
     10. Dot Grid Shockwave
     ======================================================= */
  Lab.register({
    id: 'dot-grid', cat: 'canvas', title: 'Shockwave Grid',
    tags: ['spring', 'ripple', 'click'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      let D = [], gap = 20;
      const init = () => {
        gap = Math.max(14, Math.min(c.w, c.h) / (s.large ? 34 : 18));
        D = [];
        for (let y = gap / 2; y < c.h; y += gap) for (let x = gap / 2; x < c.w; x += gap) D.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, e: 0 });
      };
      init(); c.onresize = init;
      const T = s.params({ k: [120, 20, 400, 5, '스프링 강성'] });
      const waves = [];
      const p = s.pointer();
      p.ondown = () => waves.push({ x: p.x, y: p.y, r: 0, a: 1 });
      let auto = 1;
      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t, W, H) : p;
        if (p.idle) { auto -= dt; if (auto < 0) { auto = 2.2; waves.push({ x: U.rand(W), y: U.rand(H), r: 0, a: 1 }); } }
        waves.forEach((w) => { w.r += dt * Math.max(W, H) * 0.55; w.a -= dt * 0.55; });
        while (waves.length && waves[0].a <= 0) waves.shift();
        const R = gap * 5;
        for (const q of D) {
          let fx = (q.hx - q.x) * T.k, fy = (q.hy - q.y) * T.k;
          const dx = q.x - g.x, dy = q.y - g.y, d = Math.hypot(dx, dy);
          if (d < R && d > 0.1) { const k = (1 - d / R) ** 2 * 9000; fx += (dx / d) * k; fy += (dy / d) * k; }
          for (const w of waves) {
            const wx = q.hx - w.x, wy = q.hy - w.y, wd = Math.hypot(wx, wy) || 1;
            const band = Math.abs(wd - w.r);
            if (band < gap * 2.5) { const k = (1 - band / (gap * 2.5)) * w.a * 26000; fx += (wx / wd) * k; fy += (wy / wd) * k; q.e = Math.max(q.e, w.a); }
          }
          q.vx = (q.vx + fx * dt) * Math.exp(-8 * dt); q.vy = (q.vy + fy * dt) * Math.exp(-8 * dt);
          q.x += q.vx * dt; q.y += q.vy * dt;
          q.e = Math.max(0, q.e - dt * 1.5);
          const disp = Math.min(1, Math.hypot(q.x - q.hx, q.y - q.hy) / gap);
          const r = gap * (0.09 + disp * 0.16 + q.e * 0.1);
          ctx.fillStyle = `hsl(${200 + disp * 120 + q.e * 60},${60 + disp * 40}%,${45 + disp * 30 + q.e * 20}%)`;
          ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, U.TAU); ctx.fill();
        }
      });
    },
  });

  /* =======================================================
     11. Smoke Trail
     ======================================================= */
  Lab.register({
    id: 'smoke-trail', cat: 'canvas', title: 'Ink Smoke',
    tags: ['curl noise', 'additive', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = [];
      const p = s.pointer();
      let lx = null, ly = null, hue = 0;
      ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, c.w, c.h);
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(5,5,8,.12)'; ctx.fillRect(0, 0, W, H);
        const g = p.idle ? Lab.ghost(t * 1.2, W, H) : p;
        hue = (hue + dt * 40) % 360;
        if (lx !== null) {
          const dx = g.x - lx, dy = g.y - ly, d = Math.hypot(dx, dy);
          const n = Math.min(30, 2 + Math.floor(d / 4) + (p.down ? 6 : 0));
          for (let i = 0; i < n; i++) {
            const k = i / n;
            P.push({ x: lx + dx * k + U.rand(-2, 2), y: ly + dy * k + U.rand(-2, 2), vx: dx * 2 + U.rand(-20, 20), vy: dy * 2 + U.rand(-20, 20), r: m * U.rand(0.015, 0.03), age: 0, life: U.rand(1.2, 2.4), h: Math.round((hue + U.rand(-20, 20)) / 15) * 15 });
          }
        }
        lx = g.x; ly = g.y;
        ctx.globalCompositeOperation = 'lighter';
        const sc = 3 / m;
        for (let i = P.length - 1; i >= 0; i--) {
          const q = P[i];
          q.age += dt;
          if (q.age > q.life) { P.splice(i, 1); continue; }
          const e = 0.01;
          const n1 = Lab.noise(q.x * sc, (q.y + e) * sc, t * 0.3), n2 = Lab.noise(q.x * sc, (q.y - e) * sc, t * 0.3);
          const n3 = Lab.noise((q.x + e) * sc, q.y * sc, t * 0.3), n4 = Lab.noise((q.x - e) * sc, q.y * sc, t * 0.3);
          const cx = (n1 - n2) / (2 * e), cy = -(n3 - n4) / (2 * e);
          q.vx += cx * 60 * dt; q.vy += cy * 60 * dt - 30 * dt;
          q.vx *= Math.exp(-2 * dt); q.vy *= Math.exp(-2 * dt);
          q.x += q.vx * dt; q.y += q.vy * dt;
          q.r += dt * m * 0.03;
          const k = 1 - q.age / q.life;
          ctx.globalAlpha = k * 0.35;
          ctx.drawImage(glowSprite((q.h + 360) % 360, 100, 55), q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        }
        ctx.globalAlpha = 1;
        if (P.length > 2500) P.splice(0, P.length - 2500);
      });
    },
  });
})();
