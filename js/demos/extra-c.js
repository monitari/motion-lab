/* =========================================================
   추가분 C — 조커 핸드, 점균, 실크 그라디언트, 웹 플랫폼
   ========================================================= */
(() => {
  const { U } = Lab;
  let uid = 0;
  const rrect = (x, px, py, w, h, r) => {
    x.beginPath();
    x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
  };

  /* =======================================================
     Joker Hand — 흔들리는 카드 손패, 드래그해서 태워 없애기
     ======================================================= */
  Lab.register({
    id: 'joker-hand', cat: 'cards', title: 'Joker Hand', feature: true,
    tags: ['canvas', 'dissolve', 'drag'], sound: true,
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const SUITS = [['♠', '#23233a'], ['♥', '#d6304a'], ['♦', '#e2652a'], ['♣', '#23233a']];
      const RANKS = [['A', 11], ['K', 10], ['Q', 10], ['J', 10], ['10', 10], ['9', 9], ['8', 8], ['7', 7], ['6', 6]];
      let CW = 80, CH = 112;
      const art = (card) => {
        const d = c.dpr, w = Math.round(CW * d), h = Math.round(CH * d);
        const cv = Lab.offscreen(w, h), x = cv.getContext('2d');
        x.scale(d, d);
        const r = CW * 0.08;
        if (card.wild) {
          const g = x.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, '#2b1650'); g.addColorStop(1, '#0f1a3f');
          rrect(x, 0, 0, CW, CH, r); x.fillStyle = g; x.fill();
          x.save(); rrect(x, 0, 0, CW, CH, r); x.clip();
          for (let i = 0; i < 12; i++) { x.fillStyle = `hsla(${i * 30},90%,60%,.22)`; x.beginPath(); x.moveTo(CW / 2, CH * 0.45); x.arc(CW / 2, CH * 0.45, CW, (i / 12) * U.TAU, ((i + 0.5) / 12) * U.TAU); x.fill(); }
          x.restore();
          x.fillStyle = '#ffe36b'; x.font = `800 ${CW * 0.42}px "Space Grotesk",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillText('★', CW / 2, CH * 0.44);
          x.font = `700 ${CW * 0.15}px "Space Grotesk",sans-serif`; x.fillStyle = '#fff'; x.fillText('WILD', CW / 2, CH * 0.78);
          x.strokeStyle = '#ffe36b'; x.lineWidth = CW * 0.03; rrect(x, CW * 0.05, CH * 0.04, CW * 0.9, CH * 0.92, r * 0.7); x.stroke();
          return cv;
        }
        const [sym, col] = SUITS[card.suit];
        rrect(x, 0, 0, CW, CH, r); x.fillStyle = '#f6efdc'; x.fill();
        x.strokeStyle = '#d9cdb0'; x.lineWidth = 1.5; x.stroke();
        rrect(x, CW * 0.06, CH * 0.045, CW * 0.88, CH * 0.91, r * 0.6); x.strokeStyle = '#e8dcc0'; x.lineWidth = 1; x.stroke();
        x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
        const rk = card.rank[0];
        x.font = `800 ${CW * 0.2}px "Space Grotesk",sans-serif`; x.fillText(rk, CW * 0.16, CH * 0.12);
        x.font = `${CW * 0.16}px serif`; x.fillText(sym, CW * 0.16, CH * 0.25);
        x.save(); x.translate(CW, CH); x.rotate(Math.PI);
        x.font = `800 ${CW * 0.2}px "Space Grotesk",sans-serif`; x.fillText(rk, CW * 0.16, CH * 0.12);
        x.font = `${CW * 0.16}px serif`; x.fillText(sym, CW * 0.16, CH * 0.25);
        x.restore();
        x.font = `${CW * (['K', 'Q', 'J', 'A'].includes(rk) ? 0.62 : 0.5)}px serif`; x.fillText(sym, CW / 2, CH / 2 + CW * 0.02);
        if (['K', 'Q', 'J'].includes(rk)) { x.font = `800 ${CW * 0.22}px "Space Grotesk",sans-serif`; x.fillStyle = '#fff'; x.fillText(rk, CW / 2, CH / 2 + CW * 0.04); }
        return cv;
      };
      const newCard = () => {
        const wild = Math.random() < 0.12;
        const card = { wild, suit: (Math.random() * 4) | 0, rank: RANKS[(Math.random() * RANKS.length) | 0],
          x: { x: c.w + CW, v: 0 }, y: { x: c.h * 0.8, v: 0 }, r: { x: 1.2, v: 0 }, s: { x: 1, v: 0 }, tx: { x: 0, v: 0 }, ty: { x: 0, v: 0 },
          sel: false, burn: -1, phase: Math.random() * 10 };
        card.img = art(card);
        return card;
      };
      let hand = [], burning = [], embers = [], floats = [], chips = 0, mult = 1, lastSuit = -1, shake = 0, deal = 0;
      const layout = () => {
        const m = Math.min(c.w, c.h);
        CW = m * 0.17; CH = CW * 1.4;
        hand.forEach((cd) => (cd.img = art(cd)));
      };
      layout();
      for (let i = 0; i < 5; i++) hand.push(newCard());
      c.onresize = layout;
      const zone = () => ({ x: c.w / 2, y: c.h * 0.36, w: CW * 3.4, h: CH * 1.3 });
      const inZone = (x, y) => { const z = zone(); return Math.abs(x - z.x) < z.w / 2 && Math.abs(y - z.y) < z.h / 2; };
      const slot = (i, n) => {
        const k = i - (n - 1) / 2;
        return { x: c.w / 2 + k * CW * 0.78, y: c.h * 0.8 + k * k * CH * 0.025, r: k * 0.07 };
      };
      const hit = (cd, px, py) => {
        const dx = px - cd.x.x, dy = py - cd.y.x, a = -cd.r.x;
        const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        return Math.abs(lx) < (CW / 2) * cd.s.x && Math.abs(ly) < (CH / 2) * cd.s.x;
      };
      const play = (cd) => {
        hand.splice(hand.indexOf(cd), 1);
        cd.burn = 0; burning.push(cd);
        const val = cd.wild ? 25 : cd.rank[1];
        if (!cd.wild && cd.suit === lastSuit) mult++; else if (!cd.wild) mult = 1;
        if (!cd.wild) lastSuit = cd.suit; else mult += 2;
        chips += val * mult;
        floats.push({ x: cd.x.x, y: cd.y.x - CH * 0.6, t: 0, text: `+${val}${mult > 1 ? ' ×' + mult : ''}` });
        shake = 1;
        if (s.large) { Lab.burst({ dur: 0.5, freq: 500, q: 0.6, gain: 0.35, curve: 2 }); Lab.burst({ dur: 0.08, freq: 2400, q: 3, gain: 0.25, at: 0.05 }); }
        deal = 0.45;
      };
      // 태울 때 쓸 원본 픽셀과 노이즈
      const prepBurn = (cd) => {
        const w = cd.img.width, h = cd.img.height;
        cd.src = cd.img.getContext('2d').getImageData(0, 0, w, h);
        cd.out = Lab.offscreen(w, h); cd.outx = cd.out.getContext('2d'); cd.outImg = cd.outx.createImageData(w, h);
        cd.noise = new Float32Array(w * h);
        const sc = 6 / w;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          cd.noise[j * w + i] = U.clamp(0.5 + Lab.noise(i * sc, j * sc, cd.phase) * 0.6 + Lab.noise(i * sc * 3, j * sc * 3, 9) * 0.25, 0, 1);
        }
      };
      const p = s.pointer(c.cv);
      let drag = null, moved = 0, hover = null, lastUser = -1e9, autoT = 1.5, auto = null;
      p.ondown = () => {
        lastUser = performance.now();
        for (let i = hand.length - 1; i >= 0; i--) if (hit(hand[i], p.x, p.y)) { drag = { cd: hand[i], ox: hand[i].x.x - p.x, oy: hand[i].y.x - p.y, lx: p.x, ly: p.y }; moved = 0; break; }
      };
      p.onup = () => {
        if (!drag) return;
        const cd = drag.cd;
        if (moved < 6) cd.sel = !cd.sel;
        else if (inZone(p.x, p.y)) play(cd);
        drag = null;
      };
      s.raf((dt, t) => {
        const W = c.w, H = c.h, m = Math.min(W, H);
        // 사용자가 없으면 스스로 한 장씩 낸다
        if (performance.now() - lastUser > 3500 && !drag) {
          autoT -= dt;
          if (autoT < 0 && !auto && hand.length) { auto = { cd: U.pick(hand), t: 0 }; autoT = 2.6; }
        }
        if (drag) {
          const nx = p.x + drag.ox, ny = p.y + drag.oy;
          moved += Math.hypot(p.x - drag.lx, p.y - drag.ly); drag.lx = p.x; drag.ly = p.y;
          drag.cd.x.x = nx; drag.cd.y.x = ny;
          U.spring(drag.cd.r, U.clamp(drag.cd.x.v * 0.0009, -0.5, 0.5), dt, 120, 12);
        }
        if (auto) {
          auto.t += dt;
          const z = zone();
          U.spring(auto.cd.x, z.x, dt, 60, 12); U.spring(auto.cd.y, z.y, dt, 60, 12);
          if (auto.t > 0.9) { if (hand.includes(auto.cd)) play(auto.cd); auto = null; }
        }
        deal -= dt;
        if (deal < 0 && hand.length < 5) { const nc = newCard(); nc.x.x = W + CW; nc.y.x = H * 0.5; nc.r.x = 2; hand.push(nc); deal = 0.18; }
        hover = null;
        if (!drag && !p.idle) for (let i = hand.length - 1; i >= 0; i--) if (hit(hand[i], p.x, p.y)) { hover = hand[i]; break; }
        hand.forEach((cd, i) => {
          const sl = slot(i, hand.length);
          const sway = Math.sin(t * 1.4 + cd.phase) * 0.025;
          if (drag && drag.cd === cd) {
            // 드래그 중: 속도를 따라 흔들린다 (스프링 속도를 수동 계산)
            cd.x.v = (cd.x.x - (cd._px || cd.x.x)) / Math.max(dt, 1e-3); cd._px = cd.x.x;
          } else if (!(auto && auto.cd === cd)) {
            U.spring(cd.x, sl.x, dt, 140, 16);
            U.spring(cd.y, sl.y - (cd.sel ? CH * 0.2 : 0) - (hover === cd ? CH * 0.06 : 0) + Math.sin(t * 1.7 + cd.phase) * m * 0.004, dt, 140, 16);
            U.spring(cd.r, sl.r + sway, dt, 120, 14);
            cd._px = cd.x.x;
          }
          U.spring(cd.s, drag && drag.cd === cd ? 1.12 : hover === cd ? 1.08 : 1, dt, 260, 18);
          const lx = hover === cd ? U.clamp((p.x - cd.x.x) / (CW / 2), -1, 1) : Math.sin(t * 0.9 + cd.phase) * 0.25;
          const ly = hover === cd ? U.clamp((p.y - cd.y.x) / (CH / 2), -1, 1) : Math.cos(t * 1.1 + cd.phase) * 0.25;
          U.spring(cd.tx, lx, dt, 120, 14); U.spring(cd.ty, ly, dt, 120, 14);
        });
        // 배경: 천천히 도는 소용돌이 + 비네트
        shake = Math.max(0, shake - dt * 3);
        ctx.save();
        if (shake > 0) ctx.translate(U.rand(-1, 1) * shake * m * 0.01, U.rand(-1, 1) * shake * m * 0.01);
        ctx.fillStyle = '#0d2a22'; ctx.fillRect(-20, -20, W + 40, H + 40);
        if (ctx.createConicGradient) {
          const cg = ctx.createConicGradient(t * 0.08, W / 2, H * 0.4);
          for (let i = 0; i <= 12; i++) cg.addColorStop(i / 12, i % 2 ? 'rgba(30,90,70,.55)' : 'rgba(12,50,40,.55)');
          ctx.fillStyle = cg; ctx.fillRect(-20, -20, W + 40, H + 40);
        }
        const vg = ctx.createRadialGradient(W / 2, H * 0.45, m * 0.2, W / 2, H * 0.45, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
        ctx.fillStyle = vg; ctx.fillRect(-20, -20, W + 40, H + 40);
        // 놓는 자리
        const z = zone();
        const over = drag && inZone(p.x, p.y);
        ctx.setLineDash([8, 8]); ctx.lineDashOffset = -t * 20;
        ctx.strokeStyle = over ? '#ffe36b' : 'rgba(255,255,255,.25)'; ctx.lineWidth = over ? 2.5 : 1.5;
        rrect(ctx, z.x - z.w / 2, z.y - z.h / 2, z.w, z.h, CW * 0.12); ctx.stroke(); ctx.setLineDash([]);
        if (over) { ctx.fillStyle = 'rgba(255,227,107,.08)'; ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `600 ${Math.max(10, m * 0.026)}px "IBM Plex Mono",monospace`;
        ctx.fillText(over ? 'RELEASE TO PLAY' : 'DRAG A CARD HERE', z.x, z.y);
        // 점수
        ctx.textAlign = 'left';
        ctx.font = `800 ${m * 0.06}px "Space Grotesk",sans-serif`;
        ctx.fillStyle = '#4db8ff'; ctx.fillText(String(chips), m * 0.05, m * 0.08);
        const cwid = ctx.measureText(String(chips)).width;
        ctx.fillStyle = '#fff'; ctx.fillText(' ×', m * 0.05 + cwid, m * 0.08);
        ctx.fillStyle = '#ff5d5d'; ctx.fillText(String(mult), m * 0.05 + cwid + ctx.measureText(' × ').width, m * 0.08);
        ctx.font = `500 ${Math.max(9, m * 0.022)}px "IBM Plex Mono",monospace`; ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillText('CHIPS × MULT · 같은 무늬를 이어 내면 배수가 오른다', m * 0.05, m * 0.13);
        // 덱
        for (let i = 0; i < 4; i++) { rrect(ctx, W - CW * 0.9 - i * 2, H * 0.5 - CH / 2 - i * 2, CW * 0.7, CH * 0.7, CW * 0.06); ctx.fillStyle = i === 3 ? '#b8323f' : '#7e1f2a'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke(); }
        // 카드 그리기
        const drawCard = (cd, img) => {
          const lift = (cd.s.x - 1) * 10;
          ctx.save();
          ctx.translate(cd.x.x, cd.y.x); ctx.rotate(cd.r.x);
          // 가짜 원근: 커서 쪽으로 눕는 기울기
          ctx.transform(1 - Math.abs(cd.tx.x) * 0.06, cd.tx.x * 0.07, -cd.ty.x * 0.05, 1 - Math.abs(cd.ty.x) * 0.05, 0, 0);
          ctx.scale(cd.s.x, cd.s.x);
          ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = (8 + lift * 14) * c.dpr;
          ctx.shadowOffsetX = (-cd.tx.x * 6 - cd.r.x * 20) * c.dpr; ctx.shadowOffsetY = (6 + lift * 16) * c.dpr;
          ctx.drawImage(img, -CW / 2, -CH / 2, CW, CH);
          ctx.shadowColor = 'transparent';
          // 광택
          const gx = cd.tx.x * CW * 0.5, gy = cd.ty.x * CH * 0.5;
          const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, CW * 0.9);
          gl.addColorStop(0, `rgba(255,255,255,${cd.wild ? 0.35 : 0.22})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = gl; ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
          ctx.globalCompositeOperation = 'source-over';
          ctx.restore();
        };
        hand.forEach((cd) => { if (cd !== hover && !(drag && drag.cd === cd)) drawCard(cd, cd.img); });
        if (hover && !(drag && drag.cd === hover)) drawCard(hover, hover.img);
        // 타는 카드: 노이즈 임계값을 올리며 가장자리를 불꽃색으로
        for (let i = burning.length - 1; i >= 0; i--) {
          const cd = burning[i];
          if (!cd.src) prepBurn(cd);
          cd.burn += dt * 0.85;
          U.spring(cd.x, z.x, dt, 60, 12); U.spring(cd.y, z.y, dt, 60, 12); U.spring(cd.r, 0, dt, 60, 12); U.spring(cd.s, 1.2, dt, 100, 14);
          const th = cd.burn, S = cd.src.data, D = cd.outImg.data, N = cd.noise;
          for (let k = 0, j = 0; k < N.length; k++, j += 4) {
            const n = N[k];
            if (n < th) { D[j + 3] = 0; continue; }
            if (n < th + 0.07 && S[j + 3] > 0) { const e = (n - th) / 0.07; D[j] = 255; D[j + 1] = 120 + e * 130; D[j + 2] = 30 + e * 60; D[j + 3] = 255; continue; }
            D[j] = S[j]; D[j + 1] = S[j + 1]; D[j + 2] = S[j + 2]; D[j + 3] = S[j + 3];
          }
          cd.outx.putImageData(cd.outImg, 0, 0);
          drawCard(cd, cd.out);
          for (let e = 0; e < 3; e++) embers.push({ x: cd.x.x + U.rand(-CW / 2, CW / 2), y: cd.y.x + U.rand(-CH / 2, CH / 2), vx: U.rand(-20, 20), vy: U.rand(-90, -30), t: 0 });
          if (cd.burn > 1.1) burning.splice(i, 1);
        }
        if (drag) drawCard(drag.cd, drag.cd.img);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i]; e.t += dt; if (e.t > 0.9) { embers.splice(i, 1); continue; }
          e.x += e.vx * dt; e.y += e.vy * dt;
          ctx.fillStyle = `rgba(255,${140 + 80 * (1 - e.t)},60,${1 - e.t / 0.9})`; ctx.fillRect(e.x, e.y, 2.5, 2.5);
        }
        ctx.globalCompositeOperation = 'source-over';
        for (let i = floats.length - 1; i >= 0; i--) {
          const f = floats[i]; f.t += dt; if (f.t > 1.2) { floats.splice(i, 1); continue; }
          const k = Math.min(1, f.t * 6);
          ctx.save(); ctx.translate(f.x, f.y - f.t * m * 0.08); ctx.scale(0.6 + k * 0.4 + Math.sin(k * Math.PI) * 0.3, 0.6 + k * 0.4 + Math.sin(k * Math.PI) * 0.3);
          ctx.globalAlpha = 1 - Math.max(0, f.t - 0.7) / 0.5;
          ctx.font = `800 ${m * 0.05}px "Space Grotesk",sans-serif`; ctx.textAlign = 'center';
          ctx.lineWidth = m * 0.01; ctx.strokeStyle = '#1a0b0b'; ctx.strokeText(f.text, 0, 0);
          ctx.fillStyle = '#ffe36b'; ctx.fillText(f.text, 0, 0);
          ctx.restore();
        }
        ctx.restore();
        if (embers.length > 600) embers.splice(0, embers.length - 600);
      });
    },
  });

  /* =======================================================
     Physarum — 점균류가 길을 만든다
     ======================================================= */
  Lab.register({
    id: 'physarum', cat: 'canvas', title: 'Slime Mold', feature: true,
    tags: ['agents', 'trail map', 'mouse'],
    mount(el, s) {
      const c = s.canvas(); const { ctx } = c;
      const P = s.params({ sa: [0.78, 0.1, 1.4, 0.05, '감지 각도'], sd: [s.large ? 5 : 3.5, 1.5, 20, 0.5, '감지 거리'], turn: [0.7, 0.05, 1.4, 0.05, '회전 속도'],
        decay: [0.9, 0.8, 0.99, 0.005, '흔적 유지'], count: [s.large ? 50000 : 20000, 2000, 200000, 1000, '개체 수', true] });
      let gw, gh, T, T2, img, off, offx, ax, ay, aa, N;
      const init = () => {
        gw = s.large ? 420 : 240; gh = Math.max(20, Math.round((gw * c.h) / c.w));
        T = new Float32Array(gw * gh); T2 = new Float32Array(gw * gh);
        off = Lab.offscreen(gw, gh); offx = off.getContext('2d'); img = offx.createImageData(gw, gh);
        N = Math.round(P.count);
        ax = new Float32Array(N); ay = new Float32Array(N); aa = new Float32Array(N);
        for (let i = 0; i < N; i++) { ax[i] = Math.random() * gw; ay[i] = Math.random() * gh; aa[i] = Math.random() * U.TAU; }
      };
      init(); c.onresize = init;
      const lut = new Uint8Array(256 * 3);
      const pal = [[4, 6, 14], [10, 40, 70], [20, 140, 150], [180, 240, 170], [255, 250, 220]];
      for (let i = 0; i < 256; i++) {
        const t = (i / 255) * (pal.length - 1), k = Math.min(pal.length - 2, Math.floor(t)), f = t - k;
        for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = pal[k][ch] + (pal[k + 1][ch] - pal[k][ch]) * f;
      }
      const p = s.pointer(c.cv);
      const step = s.fixed(1 / 60, (h, t) => {
        const sa = P.sa, sd = P.sd, ts = P.turn, cs = Math.cos, sn = Math.sin;
        // 한 스텝에 두 번 움직여 네트워크가 빨리 자란다
        for (let rep = 0; rep < 2; rep++) {
        for (let i = 0; i < N; i++) {
          const x = ax[i], y = ay[i], a = aa[i];
          let fx = (x + cs(a) * sd) | 0, fy = (y + sn(a) * sd) | 0;
          const f = fx >= 0 && fy >= 0 && fx < gw && fy < gh ? T[fy * gw + fx] : -1;
          fx = (x + cs(a + sa) * sd) | 0; fy = (y + sn(a + sa) * sd) | 0;
          const l = fx >= 0 && fy >= 0 && fx < gw && fy < gh ? T[fy * gw + fx] : -1;
          fx = (x + cs(a - sa) * sd) | 0; fy = (y + sn(a - sa) * sd) | 0;
          const r = fx >= 0 && fy >= 0 && fx < gw && fy < gh ? T[fy * gw + fx] : -1;
          let na = a;
          if (f >= l && f >= r) { /* 직진 */ } else if (f < l && f < r) na += (Math.random() < 0.5 ? 1 : -1) * ts;
          else if (l > r) na += ts; else na -= ts;
          let nx = x + cs(na), ny = y + sn(na);
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) { na = Math.random() * U.TAU; nx = U.clamp(nx, 0, gw - 1); ny = U.clamp(ny, 0, gh - 1); }
          ax[i] = nx; ay[i] = ny; aa[i] = na;
          T[(ny | 0) * gw + (nx | 0)] += 1;
        }
        }
        // 커서: 움직이면 먹이를 두고, 누르면 쫓아낸다. 아무도 없을 땐 스스로 길을 만들게 둔다
        const g = p;
        const cx = ((g.x / c.w) * gw) | 0, cy = ((g.y / c.h) * gh) | 0, rad = p.idle ? -1 : 5;
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
          const xx = cx + i, yy = cy + j;
          if (xx < 0 || yy < 0 || xx >= gw || yy >= gh || i * i + j * j > rad * rad) continue;
          T[yy * gw + xx] = p.down ? -20 : T[yy * gw + xx] + 1.5;
        }
        const dc = P.decay;
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
          let sum = 0, n = 0;
          for (let j = -1; j <= 1; j++) { const yy = y + j; if (yy < 0 || yy >= gh) continue; for (let i = -1; i <= 1; i++) { const xx = x + i; if (xx < 0 || xx >= gw) continue; sum += T[yy * gw + xx]; n++; } }
          T2[y * gw + x] = (sum / n) * dc;
        }
        const tmp = T; T = T2; T2 = tmp;
      }, 2);
      s.raf((dt, t) => {
        step(dt, t);
        const d = img.data;
        for (let i = 0, j = 0; i < T.length; i++, j += 4) {
          const v = T[i] <= 0 ? 0 : Math.min(255, (255 * (1 - Math.exp(-T[i] * 0.022))) | 0) * 3;
          d[j] = lut[v]; d[j + 1] = lut[v + 1]; d[j + 2] = lut[v + 2]; d[j + 3] = 255;
        }
        offx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(off, 0, 0, c.w, c.h);
      });
    },
  });

  /* =======================================================
     Silk Gradient — Stripe 홈페이지 같은 메시 그라디언트
     ======================================================= */
  const NOISE = `
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+11.;a*=.5;}return v;}
  `;
  const silk = NOISE + `
  void main(){
    vec2 uv=gl_FragCoord.xy/iRes;
    vec2 p=uv;p.x*=iRes.x/iRes.y;
    vec2 m=iMouse/iRes.y;
    float t=iTime*.11;
    vec2 d=p-m;float infl=exp(-dot(d,d)*5.)*(.35+iDown*.6);
    p+=normalize(d+1e-4)*infl*.12;
    float n1=fbm(p*1.1+vec2(t,-t*.6));
    float n2=fbm(p*1.5+vec2(-t*.7,t*.4)+n1*1.6);
    float w=p.y*.9+sin(p.x*2.1+t*3.)*.16+n2*.65;
    vec3 c1=vec3(.36,.33,.98),c2=vec3(1.,.40,.62),c3=vec3(1.,.77,.32),c4=vec3(.18,.85,.92);
    vec3 col=mix(c1,c2,smoothstep(.15,.75,w));
    col=mix(col,c3,smoothstep(.55,1.1,w+n1*.4-.15));
    col=mix(col,c4,smoothstep(.55,.9,n2)*.55);
    col+=pow(max(0.,1.-abs(w-.62)*5.),3.)*.12;
    col+=(hash(gl_FragCoord.xy+fract(iTime)*100.)-.5)*.035;
    gl_FragColor=vec4(col,1.);
  }`;
  Lab.register({
    id: 'silk-gradient', cat: 'shader', title: 'Silk Gradient', tags: ['mesh gradient', 'fbm', 'GLSL'],
    source: silk, mount(el, s) { s.shader(silk); },
  });

  /* =======================================================
     Web Platform 1 — View Transitions
     ======================================================= */
  const ALBUMS = [
    ['Glass Hours', 'The Refractors', 'linear-gradient(135deg,#ff9a5a,#ff3d7f 50%,#3a1c71)'],
    ['Soft Physics', 'Verlet & Co.', 'linear-gradient(160deg,#6bffb8,#2a8cff)'],
    ['Night Shader', 'fbm', 'radial-gradient(circle at 30% 30%,#ffd36b,#ff5f8f 40%,#24123f 75%)'],
    ['Holo Season', 'Foil', 'conic-gradient(from 200deg,#ff5f8f,#ffcf5c,#6bffb8,#6bc6ff,#b36bff,#ff5f8f)'],
    ['Low Tide', 'Ripple', 'linear-gradient(180deg,#9fe8ff,#1ba3c6 60%,#0d3b5a)'],
    ['Ember', 'Dissolve', 'radial-gradient(circle at 70% 70%,#ffe36b,#ff7a2f 35%,#3b0d0d 80%)'],
  ];
  Lab.register({
    id: 'view-transitions', cat: 'modern', title: 'View Transitions',
    tags: ['View Transitions API', 'morph', 'click'],
    css: `
    .vt{position:absolute;inset:0;background:#f1eee7;color:#171614;font-family:'Pretendard Variable',Pretendard,sans-serif;overflow:hidden}
    .vt-grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);gap:3cqmin;padding:6cqmin 7cqmin;align-content:center}
    .vt-it{cursor:pointer;border:0;background:none;padding:0;text-align:left;color:inherit;font:inherit}
    .vt-cov{aspect-ratio:1;border-radius:2cqmin;box-shadow:0 1.5cqmin 3cqmin -1.5cqmin #0006;transition:transform .3s}
    .vt-it:hover .vt-cov{transform:translateY(-.8cqmin)}
    .vt-t{display:block;margin-top:1.4cqmin;font-weight:700;font-size:2.6cqmin;letter-spacing:-.02em}
    .vt-a{display:block;font-size:2cqmin;color:#6e6a62}
    .vt-d{position:absolute;inset:0;display:grid;grid-template-columns:auto 1fr;gap:5cqmin;align-items:center;padding:7cqmin}
    .vt-d .vt-cov{width:62cqmin;cursor:pointer}
    .vt-d h3{margin:0;font-size:7cqmin;letter-spacing:-.04em;line-height:1}
    .vt-d p{margin:1.5cqmin 0 0;font-size:2.4cqmin;color:#6e6a62}
    .vt-d ol{margin:3cqmin 0 0;padding:0;list-style:none;font:500 2.2cqmin 'IBM Plex Mono',monospace;color:#3d3a35}
    .vt-d li{padding:1cqmin 0;border-top:1px solid #d3cfc5}
    .vt-d li:nth-child(n+2){opacity:0;animation:vt-li .4s forwards}
    .vt-d li:nth-child(2){animation-delay:.25s}.vt-d li:nth-child(3){animation-delay:.32s}.vt-d li:nth-child(4){animation-delay:.39s}
    @keyframes vt-li{from{opacity:0;transform:translateY(1cqmin)}to{opacity:1;transform:none}}
    .vt-back{position:absolute;right:4cqmin;top:4cqmin;border:1px solid #c9c5bb;background:#fff;border-radius:999px;padding:1cqmin 2.2cqmin;font:600 2cqmin 'IBM Plex Mono',monospace;cursor:pointer}
    .vt-note{position:absolute;left:0;right:0;bottom:2cqmin;text-align:center;font:500 1.8cqmin 'IBM Plex Mono',monospace;color:#9a958c}
    `,
    mount(el, s) {
      const id = 'vt' + ++uid;
      const supported = !!document.startViewTransition;
      const root = s.html(`<div class="vt"><div class="vt-grid">${ALBUMS.map(([t, a, bg], i) =>
        `<button class="vt-it" data-i="${i}"><span class="vt-cov" style="display:block;background:${bg}"></span><span class="vt-t">${t}</span><span class="vt-a">${a}</span></button>`).join('')}</div>
        <div class="vt-note">${supported ? 'View Transitions API' : '이 브라우저는 View Transitions를 지원하지 않아서 직접 만든 FLIP으로 대신해요'}</div></div>`);
      const grid = root.querySelector('.vt-grid');
      let detail = null, openI = -1, lastUser = -1e9;
      const name = (n, v) => { if (n) n.style.viewTransitionName = v || ''; };
      const render = (i) => {
        if (i < 0) { if (detail) detail.remove(); detail = null; grid.style.visibility = ''; return; }
        const [t, a, bg] = ALBUMS[i];
        grid.style.visibility = 'hidden';
        detail = document.createElement('div');
        detail.className = 'vt-d';
        detail.innerHTML = `<span class="vt-cov" style="display:block;background:${bg}"></span><div><h3>${t}</h3><p>${a} · 2026</p>
          <ol><li>01 Refraction</li><li>02 Spring</li><li>03 Dissolve</li><li>04 Afterglow</li></ol></div><button class="vt-back">닫기</button>`;
        root.appendChild(detail);
        s.on(detail.querySelector('.vt-back'), 'click', () => go(-1));
        s.on(detail.querySelector('.vt-cov'), 'click', () => go(-1));
      };
      const parts = (i) => {
        if (i < 0) return [null, null];
        if (detail) return [detail.querySelector('.vt-cov'), detail.querySelector('h3')];
        const it = grid.children[i]; return [it.querySelector('.vt-cov'), it.querySelector('.vt-t')];
      };
      const go = (i) => {
        if (i === openI) return;
        const tile = i >= 0 ? i : openI;
        const [gc, gt] = [grid.children[tile].querySelector('.vt-cov'), grid.children[tile].querySelector('.vt-t')];
        if (supported && s.large) {
          // 같은 이름을 가진 요소끼리 브라우저가 모핑해 준다
          const [oc, ot] = detail ? parts(openI) : [gc, gt];
          name(oc, id + 'c'); name(ot, id + 't');
          const vt = document.startViewTransition(() => {
            name(oc); name(ot);
            render(i); openI = i;
            const [nc, nt] = i >= 0 ? parts(i) : [gc, gt];
            name(nc, id + 'c'); name(nt, id + 't');
          });
          vt.ready.catch(() => {});
          vt.finished.finally(() => { const [a, b] = parts(openI); name(a); name(b); name(gc); name(gt); });
        } else {
          // 대체: 표지만 FLIP으로 키우거나 줄인다
          const from = gc.getBoundingClientRect();
          render(i); openI = i;
          const target = i >= 0 ? detail.querySelector('.vt-cov') : gc;
          const to = target.getBoundingClientRect();
          const a = i >= 0 ? from : root.querySelector('.vt-d') ? to : to;
          if (i >= 0) target.animate([{ transform: `translate(${a.left - to.left}px,${a.top - to.top}px) scale(${a.width / to.width})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
          else gc.animate([{ transform: 'scale(1.15)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 350, easing: 'ease-out' });
        }
      };
      [...grid.children].forEach((b, i) => s.on(b, 'click', () => { lastUser = performance.now(); go(i); }));
      s.on(root, 'pointerdown', () => (lastUser = performance.now()));
      // 아무도 안 만지면 열었다 닫았다
      s.interval(() => { if (performance.now() - lastUser < 5000) return; go(openI < 0 ? (Math.random() * ALBUMS.length) | 0 : -1); }, 2600);
    },
  });

  /* =======================================================
     Web Platform 2 — Scroll-driven Animations
     ======================================================= */
  Lab.register({
    id: 'scroll-driven', cat: 'modern', title: 'Scroll-driven Animations',
    tags: ['animation-timeline', 'view()', 'scroll'],
    css: `
    .sd{position:absolute;inset:0;background:#0f0f12;color:#ece9e2;font-family:'Pretendard Variable',Pretendard,sans-serif}
    .sd-scroll{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain}
    .sd-scroll::-webkit-scrollbar{display:none}
    .sd-bar{position:absolute;left:0;top:0;height:.8cqmin;width:100%;background:linear-gradient(90deg,#7cffd4,#4db8ff);transform-origin:0 50%;transform:scaleX(var(--sd-p,0));z-index:3}
    .sd-ring{position:absolute;right:4cqmin;top:4cqmin;width:10cqmin;height:10cqmin;border-radius:50%;z-index:3;
      background:conic-gradient(#7cffd4 calc(var(--sd-p,0) * 360deg),#ffffff18 0);-webkit-mask:radial-gradient(circle,#0000 58%,#000 60%);mask:radial-gradient(circle,#0000 58%,#000 60%)}
    .sd-sec{min-height:100cqh;display:grid;place-items:center;padding:6cqmin;position:relative}
    .sd-h{font-size:10cqmin;font-weight:800;letter-spacing:-.05em;line-height:.95;text-align:center}
    .sd-h small{display:block;margin-top:2cqmin;font:500 2.2cqmin 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#8f8c84}
    .sd-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:3cqmin;width:100%}
    .sd-card{aspect-ratio:3/4;border-radius:2cqmin;padding:2.4cqmin;display:flex;align-items:flex-end;font-weight:700;font-size:3cqmin}
    .sd-word{font-size:16cqmin;font-weight:800;letter-spacing:-.06em;white-space:nowrap}
    .sd-it{will-change:transform,opacity}
    @property --sd-p{syntax:'<number>';inherits:true;initial-value:0}
    @supports (animation-timeline: view()) {
      .sd{timeline-scope:--sd}
      .sd-scroll{scroll-timeline:--sd y}
      .sd-bar,.sd-ring{animation:sd-p linear both;animation-timeline:--sd}
      @keyframes sd-p{from{--sd-p:0}to{--sd-p:1}}
      .sd-it{animation:sd-in linear both;animation-timeline:view();animation-range:entry 0% cover 45%}
      .sd-card:nth-child(2){animation-range:entry 10% cover 50%}.sd-card:nth-child(3){animation-range:entry 20% cover 55%}
      .sd-word{animation:sd-x linear both;animation-timeline:view()}
    }
    @keyframes sd-in{from{opacity:0;transform:translateY(12cqmin) scale(.88) rotate(-4deg);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
    @keyframes sd-x{from{transform:translateX(30%)}to{transform:translateX(-60%)}}
    .sd-tag{position:absolute;left:4cqmin;bottom:3cqmin;z-index:3;font:500 1.8cqmin 'IBM Plex Mono',monospace;color:#8f8c84}
    `,
    mount(el, s) {
      const native = CSS.supports && CSS.supports('animation-timeline: view()');
      const root = s.html(`<div class="sd"><div class="sd-bar"></div><div class="sd-ring"></div><div class="sd-scroll">
        <section class="sd-sec"><div class="sd-h sd-it">Scroll me<small>${native ? 'CSS만으로 스크롤에 묶인 애니메이션' : 'JS 대체 모드 (이 브라우저는 animation-timeline 미지원)'}</small></div></section>
        <section class="sd-sec"><div class="sd-cards">
          <div class="sd-card sd-it" style="background:linear-gradient(160deg,#ff9a5a,#ff3d7f)">view()</div>
          <div class="sd-card sd-it" style="background:linear-gradient(160deg,#6bffb8,#2a8cff)">scroll()</div>
          <div class="sd-card sd-it" style="background:linear-gradient(160deg,#ffe36b,#ff7a2f)">range</div></div></section>
        <section class="sd-sec" style="overflow:hidden"><div class="sd-word">animation-timeline: view()</div></section>
        <section class="sd-sec"><div class="sd-h sd-it">No JS<small>진행 바와 링도 스크롤 타임라인</small></div></section>
      </div><div class="sd-tag">animation-timeline</div></div>`);
      const sc = root.querySelector('.sd-scroll');
      if (!s.large) sc.style.overflow = 'hidden';
      let lastUser = -1e9;
      ['wheel', 'pointerdown', 'touchstart'].forEach((ev) => s.on(sc, ev, () => (lastUser = performance.now()), { passive: true }));
      const items = [...root.querySelectorAll('.sd-it')], word = root.querySelector('.sd-word');
      s.raf((dt, t) => {
        const max = sc.scrollHeight - sc.clientHeight;
        if (performance.now() - lastUser > 2500 && max > 0) {
          // 자동 스크롤: 천천히 내려갔다 올라온다
          sc.scrollTop = (0.5 - 0.5 * Math.cos(t * 0.35)) * max;
        }
        if (!native) {
          const pr = max > 0 ? sc.scrollTop / max : 0;
          root.style.setProperty('--sd-p', pr.toFixed(3));
          const vh = sc.clientHeight;
          items.forEach((n) => {
            const r = n.getBoundingClientRect(), sr = sc.getBoundingClientRect();
            const k = U.clamp((sr.bottom - r.top) / (vh * 0.6), 0, 1);
            n.style.opacity = k; n.style.transform = `translateY(${(1 - k) * 12}cqmin) scale(${0.88 + k * 0.12}) rotate(${(1 - k) * -4}deg)`;
          });
          const wr = word.getBoundingClientRect(), sr = sc.getBoundingClientRect();
          const kw = U.clamp((sr.bottom - wr.top) / (vh + wr.height), 0, 1);
          word.style.transform = `translateX(${30 - kw * 90}%)`;
        }
      });
    },
  });

  /* =======================================================
     Web Platform 3 — @property
     ======================================================= */
  Lab.register({
    id: 'at-property', cat: 'modern', title: '@property Gradients',
    tags: ['@property', 'Houdini', 'hover/click'],
    css: `
    @property --ap-a{syntax:'<angle>';inherits:false;initial-value:0deg}
    @property --ap-c1{syntax:'<color>';inherits:true;initial-value:#ff5f8f}
    @property --ap-c2{syntax:'<color>';inherits:true;initial-value:#ffcf5c}
    @property --ap-c3{syntax:'<color>';inherits:true;initial-value:#6bc6ff}
    @property --ap-pos{syntax:'<percentage>';inherits:false;initial-value:0%}
    @property --ap-r1{syntax:'<percentage>';inherits:false;initial-value:50%}
    @property --ap-r2{syntax:'<percentage>';inherits:false;initial-value:50%}
    .ap{position:absolute;inset:0;display:grid;place-items:center;background:#0c0c10;color:#fff;font-family:'Pretendard Variable',Pretendard,sans-serif;
      transition:--ap-c1 .9s,--ap-c2 .9s,--ap-c3 .9s;cursor:pointer}
    .ap-row{display:grid;grid-template-columns:repeat(3,1fr);gap:4cqmin;width:min(90cqw,130cqh)}
    .ap-c{aspect-ratio:3/4;border-radius:3cqmin;position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:2.4cqmin;font-size:2.4cqmin}
    .ap-c b{font-size:3cqmin;font-weight:700;margin-bottom:.6cqmin}
    .ap-c code{font:500 1.7cqmin 'IBM Plex Mono',monospace;opacity:.7}
    .ap-1{background:#16161c;isolation:isolate}
    .ap-1::before{content:'';position:absolute;inset:-.5cqmin;border-radius:3.4cqmin;z-index:-1;
      background:conic-gradient(from var(--ap-a),var(--ap-c1),var(--ap-c2),var(--ap-c3),var(--ap-c1));animation:ap-spin 4s linear infinite}
    .ap-1::after{content:'';position:absolute;inset:0;border-radius:inherit;background:#16161c;z-index:-1}
    .ap-1:hover::before{animation-duration:1.2s;filter:blur(1px) brightness(1.3)}
    @keyframes ap-spin{to{--ap-a:360deg}}
    .ap-2{background:linear-gradient(115deg,var(--ap-c1) calc(var(--ap-pos) - 30%),var(--ap-c2) var(--ap-pos),var(--ap-c3) calc(var(--ap-pos) + 30%));
      transition:--ap-pos 1.2s cubic-bezier(.2,.8,.2,1)}
    .ap-2:hover{--ap-pos:100%}
    .ap-3{background:#16161c;display:flex;align-items:center;justify-content:center}
    .ap-blob{width:70%;aspect-ratio:1;background:linear-gradient(135deg,var(--ap-c1),var(--ap-c3));
      border-radius:var(--ap-r1) calc(100% - var(--ap-r1)) var(--ap-r2) calc(100% - var(--ap-r2)) / calc(100% - var(--ap-r2)) var(--ap-r2) calc(100% - var(--ap-r1)) var(--ap-r1);
      transition:--ap-r1 .9s cubic-bezier(.3,1.6,.5,1),--ap-r2 .9s cubic-bezier(.3,1.6,.5,1);animation:ap-blob 6s ease-in-out infinite alternate}
    .ap-3:hover .ap-blob{--ap-r1:20%;--ap-r2:80%;animation-play-state:paused}
    @keyframes ap-blob{50%{--ap-r1:30%;--ap-r2:70%}100%{--ap-r1:65%;--ap-r2:35%}}
    .ap-3 b,.ap-3 code{position:absolute}.ap-3 b{bottom:5cqmin}.ap-3 code{bottom:2.6cqmin}
    .ap-hint{position:absolute;bottom:3cqmin;font:500 1.8cqmin 'IBM Plex Mono',monospace;color:#8f8c84}
    `,
    mount(el, s) {
      const pals = [['#ff5f8f', '#ffcf5c', '#6bc6ff'], ['#7cffd4', '#4db8ff', '#b36bff'], ['#ffe36b', '#ff7a2f', '#ff3d7f'], ['#f2efe6', '#9fe8ff', '#6bffb8']];
      const root = s.html(`<div class="ap"><div class="ap-row">
        <div class="ap-c ap-1"><b>Angle</b><code>--a: &lt;angle&gt;</code></div>
        <div class="ap-c ap-2"><b>Stops</b><code>--pos: &lt;percentage&gt;</code></div>
        <div class="ap-c ap-3"><div class="ap-blob"></div><b>Radius</b><code>--r: &lt;percentage&gt;</code></div>
      </div><div class="ap-hint">click: 색 전환 (등록된 &lt;color&gt;라서 그라디언트도 부드럽게 바뀜)</div></div>`);
      let pi = 0, lastUser = -1e9;
      const setPal = () => { const [a, b, c2] = pals[pi]; root.style.setProperty('--ap-c1', a); root.style.setProperty('--ap-c2', b); root.style.setProperty('--ap-c3', c2); };
      s.on(root, 'click', () => { lastUser = performance.now(); pi = (pi + 1) % pals.length; setPal(); });
      s.interval(() => { if (performance.now() - lastUser > 5000) { pi = (pi + 1) % pals.length; setPal(); } }, 3000);
    },
  });
})();
