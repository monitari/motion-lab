/* Material studies — original Canvas 2D interpretations.
 * Visual references (not copied implementations/assets):
 * https://paytonturnage.com/writing/water-color/
 * https://tympanus.net/Development/Unwoven/
 * https://www.cimatica.org/en
 */
(() => {
  const { U } = Lab;
  const studioCSS = `
    .material-label { position:absolute; top:6%; left:7%; right:7%; display:flex; justify-content:space-between; gap:12px; pointer-events:none; color:#50473e; font:500 clamp(9px,1.7cqmin,12px)/1.4 var(--mono); letter-spacing:.14em; }
    .material-label b { font-weight:500; opacity:.55; }
    .material-foot { position:absolute; bottom:7%; left:7%; right:7%; pointer-events:none; color:#6a5e50; font:italic clamp(12px,2.6cqmin,19px)/1.3 var(--serif); }
    .stage-watercolor-bloom .lab-modes { background:#eee7d9e8; border-color:#b8ab94; }
    .stage-watercolor-bloom .lab-modes button { color:#594e43; padding:9px 12px; }
    .stage-watercolor-bloom .lab-modes button.on { background:#463e36; color:#fff5e5; }
    .stage-unwoven-poster .material-label, .stage-chladni-plate .material-label { color:#e6d8b9; }
    .stage-unwoven-poster .material-foot, .stage-chladni-plate .material-foot { color:#ac9d83; }
    .stage-unwoven-poster .lab-modes button, .stage-chladni-plate .lab-modes button { padding:9px 13px; }
    .stage-watercolor-bloom .lab-modes, .stage-unwoven-poster .lab-modes, .stage-chladni-plate .lab-modes { width:max-content; max-width:calc(100% - 24px); }
    .stage-watercolor-bloom .lab-modes button, .stage-unwoven-poster .lab-modes button, .stage-chladni-plate .lab-modes button { min-height:44px; white-space:nowrap; flex-shrink:0; }
  `;

  Lab.register({
    id: 'watercolor-bloom', cat: 'material', title: 'Watercolor Bloom', feature: true,
    tags: ['watercolor', '수채화', '종이', 'pigment', 'canvas'], css: studioCSS,
    mount(el, s) {
      const c = s.canvas(), x = c.ctx, p = s.pointer(c.cv);
      const P = s.params({ water: [1, 0.3, 2, 0.1, '물의 양'], brush: [0.1, 0.035, 0.22, 0.005, '붓 크기'] });
      s.html('<div class="material-label"><span>PIGMENT / 01</span><b>WET ON PAPER</b></div>');
      if (!s.large) s.html('<div class="material-foot">A little water. A little time.</div>');
      const colors = ['#bc4c4b', '#345f88', '#ce9b32', '#557c65'];
      const stamps = colors.map((color, k) => Array.from({ length: 3 }, (_, variant) => {
        const cv = Lab.offscreen(224, 224), g = cv.getContext('2d');
        const seed = k * 19 + variant * 7 + 1;
        const outline = (layer, scale) => {
          g.beginPath();
          for (let i = 0; i < 100; i++) {
            const a = i / 100 * U.TAU;
            const edge = 1 + .14 * Lab.noise(Math.cos(a) * 2 + seed, Math.sin(a) * 2)
              + .045 * Lab.noise(Math.cos(a) * 11 + seed, Math.sin(a) * 11, layer * .13);
            const r = (81 + layer * .55) * edge * scale;
            const px = 112 + Math.cos(a) * r, py = 112 + Math.sin(a) * r;
            i ? g.lineTo(px, py) : g.moveTo(px, py);
          }
          g.closePath();
        };
        g.fillStyle = color;
        for (let layer = 0; layer < 22; layer++) {
          g.globalAlpha = .025 + layer / 1800;
          outline(layer, 1); g.fill();
        }
        g.globalAlpha = .13; g.strokeStyle = color; g.lineWidth = .8;
        outline(21, 1); g.stroke();
        g.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 2600; i++) {
          g.fillStyle = i % 3 ? '#fff8e5' : color;
          g.globalAlpha = .06 + Math.random() * .12;
          g.fillRect(Math.random() * 224, Math.random() * 224, .5 + Math.random(), .5 + Math.random());
        }
        return cv;
      }));
      const paper = Lab.offscreen(256, 256), pg = paper.getContext('2d');
      pg.fillStyle = '#f1e9d9'; pg.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 9500; i++) {
        pg.fillStyle = i % 2 ? 'rgba(101,77,40,.045)' : 'rgba(255,255,255,.22)';
        pg.fillRect(Math.random() * 256, Math.random() * 256, 1, Math.random() * 2 + .3);
      }
      const pattern = x.createPattern(paper, 'repeat');
      let blooms = [], clock = 0, lastDrop = -1, lastPoint = null, touched = false, dirty = true;
      const deposit = (nx, ny, ink, radius = P.brush) => {
        blooms.push({ nx, ny, ink, r: radius, wet: P.water, born: clock, turn: Math.random() * 6.28, stamp: Math.floor(Math.random() * 3) });
        if (blooms.length > 100) blooms.shift();
        dirty = true;
      };
      const compose = () => {
        blooms = [];
        [[.37,.39,0,.16],[.54,.4,2,.18],[.6,.58,1,.18],[.4,.63,3,.14],[.29,.56,0,.09],[.65,.34,2,.065]].forEach(a => deposit(...a));
      };
      compose();
      const palette = s.modes(['붉음', '파랑', '노랑', '초록', '비우기'], 0, (i) => {
        touched = true;
        if (i === 4) { blooms = []; dirty = true; palette.set(0); }
      });
      // Give the pigment choices explicit names for keyboard/screen-reader users.
      s.$$('.lab-modes button').forEach((b, i) => { b.setAttribute('aria-label', ['붉은 물감', '푸른 물감', '황금 물감', '초록 물감', '종이 비우기'][i]); b.title = b.getAttribute('aria-label'); });
      const paint = () => {
        const point = { x: U.clamp(p.nx, 0, 1), y: U.clamp(p.ny, 0, 1) };
        const dist = lastPoint ? Math.hypot((point.x - lastPoint.x) * c.w, (point.y - lastPoint.y) * c.h) : 0;
        const steps = Math.min(12, Math.max(1, Math.ceil(dist / (Math.min(c.w, c.h) * P.brush * .45))));
        for (let i = 1; i <= steps; i++) deposit(lastPoint ? U.lerp(lastPoint.x, point.x, i / steps) : point.x, lastPoint ? U.lerp(lastPoint.y, point.y, i / steps) : point.y, palette.i);
        lastPoint = point; lastDrop = clock;
      };
      p.ondown = () => { touched = true; lastPoint = null; paint(); };
      p.onup = () => { lastPoint = null; };
      c.onresize = () => { dirty = true; };
      s.raf((dt) => {
        clock += dt;
        if (p.down && clock - lastDrop > .1) paint();
        if (!touched && clock - lastDrop > 2.8 && clock > 2) {
          const a = clock * .61;
          deposit(.5 + Math.cos(a) * .18, .5 + Math.sin(a) * .17, Math.floor(clock / 3) % 4, .07);
          lastDrop = clock;
        }
        const growing = blooms.some(b => clock - b.born < 6);
        if (!dirty && !growing) return;
        dirty = false;
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
        x.fillStyle = pattern; x.fillRect(0, 0, c.w, c.h);
        x.globalCompositeOperation = 'multiply';
        for (const b of blooms) {
          const age = Math.max(0, clock - b.born);
          const spread = 1 - Math.exp(-age * .8 / b.wet);
          const size = Math.min(c.w, c.h) * b.r * 2.5 * (.5 + spread * (.5 + b.wet * .16));
          x.save(); x.translate(b.nx * c.w, b.ny * c.h); x.rotate(b.turn);
          x.globalAlpha = .78 + .22 * Math.exp(-age * .25);
          x.drawImage(stamps[b.ink][b.stamp], -size / 2, -size / 2, size, size);
          x.restore();
        }
        x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        if (p.inside && !p.down) {
          x.strokeStyle = '#78634e66'; x.lineWidth = 1;
          x.beginPath(); x.arc(p.x, p.y, Math.min(c.w, c.h) * P.brush, 0, U.TAU); x.stroke();
        }
      });
      s.on(c.cv, 'pointermove', () => { dirty = true; });
      s.on(c.cv, 'pointerleave', () => { dirty = true; });
    },
  });

  Lab.register({
    id: 'unwoven-poster', cat: 'material', title: 'Unwoven Poster',
    tags: ['threads', '직조', '실', 'poster', 'spring', 'canvas'],
    mount(el, s) {
      const c = s.canvas(), x = c.ctx, p = s.pointer(c.cv);
      const P = s.params({ pull: [1, .3, 2, .1, '당기는 힘'], tension: [70, 20, 150, 5, '실의 탄성'] });
      s.html('<div class="material-label"><span>WOVEN / 02</span><b>PULL THE PICTURE</b></div>');
      if (!s.large) s.html('<div class="material-foot">Every image is a loose thread.</div>');
      const art = Lab.offscreen(600, 720), a = art.getContext('2d');
      const themes = [['#eccc94','#df633f','#373c50'],['#d7e1cb','#688a76','#254944'],['#d4c6e3','#8a6099','#37304f']];
      let design = 0;
      function poster() {
        const [paper, sun, ink] = themes[design];
        a.fillStyle = paper; a.fillRect(0, 0, 600, 720);
        a.fillStyle = sun; a.beginPath(); a.arc(355, 250, 164, 0, U.TAU); a.fill();
        a.save(); a.beginPath(); a.rect(0, 350, 600, 370); a.clip();
        for (let i = 0; i < 26; i++) {
          a.beginPath(); a.moveTo(-20, 440 + i * 13);
          a.bezierCurveTo(175, 190 + i * 19, 290, 720 - i * 8, 640, 390 + i * 14);
          a.strokeStyle = ink; a.lineWidth = 5; a.stroke();
        }
        a.restore();
        a.fillStyle = ink; a.font = '900 105px sans-serif'; a.fillText('UN', 42, 150); a.fillText('WOVEN', 36, 250);
        a.font = '16px monospace'; a.fillText('MOTION LAB / MATERIAL STUDIES', 42, 663);
        for (let i = 0; i < 9000; i++) {
          a.fillStyle = i % 2 ? '#ffffff16' : '#1515150b'; a.fillRect(Math.random() * 600, Math.random() * 720, 1, 1);
        }
      }
      poster();
      s.modes(['노을', '숲', '황혼'], 0, (i) => { design = i; poster(); });
      s.$$('.lab-modes button').forEach((b, i) => { b.setAttribute('aria-label', ['노을 포스터', '숲 포스터', '황혼 포스터'][i]); });
      const count = s.large ? 120 : 72, segments = s.large ? 18 : 12;
      const threads = Array.from({ length: count }, () => ({ x: 0, v: 0 }));
      let grab = null, touched = false, time = 0;
      const bounds = () => {
        const h = Math.min(c.h * .69, c.w * 1.06), w = h * 5 / 6;
        return { w, h, left: (c.w - w) / 2, top: (c.h - h) / 2 };
      };
      p.ondown = () => { touched = true; grab = { x: p.x, y: p.y }; };
      p.onup = () => { grab = null; };
      s.raf((dt) => {
        time += dt;
        const b = bounds();
        const target = grab ? p : (!touched && p.idle ? { x: c.w * .5, y: c.h * (.5 + .15 * Math.sin(time * .65)) } : p);
        const centerY = grab ? grab.y : target.y;
        const force = grab ? U.clamp((p.x - grab.x) * P.pull, -b.w * .55, b.w * .55) : (!touched && p.idle ? Math.sin(time * .9) * b.w * .22 : p.inside ? (p.x - c.w / 2) * .23 : 0);
        x.fillStyle = '#171b1c'; x.fillRect(0, 0, c.w, c.h);
        x.fillStyle = '#0005'; x.fillRect(b.left + 12, b.top + 16, b.w, b.h);
        const band = b.h / count;
        for (let i = 0; i < count; i++) {
          const y = b.top + (i + .5) * band;
          const distance = (y - centerY) / (b.h * .17);
          const falloff = Math.exp(-distance * distance * 2);
          // Substeps keep the springs stable when a frame stalls.
          const n = Math.max(1, Math.ceil(dt / .012));
          for (let j = 0; j < n; j++) U.spring(threads[i], force * falloff, dt / n, P.tension, 11);
          const offset = threads[i].x;
          for (let j = 0; j < segments; j++) {
            const u = j / segments, envelope = Math.sin((u + .5 / segments) * Math.PI);
            const dx = offset * envelope;
            const dy = Math.sin(u * U.TAU + i * .12) * Math.abs(offset) * .13 * envelope;
            x.drawImage(art, j * 600 / segments, i * 720 / count, 600 / segments, 720 / count,
              b.left + u * b.w + dx, y - band / 2 + dy, b.w / segments + .65, Math.max(.65, band * .84));
          }
        }
        x.strokeStyle = '#ebdfc133'; x.lineWidth = 1;
        for (const px of [b.left - 9, b.left + b.w + 9]) {
          x.beginPath(); x.moveTo(px, b.top); x.lineTo(px, b.top + b.h); x.stroke();
        }
      });
    },
  });

  Lab.register({
    id: 'chladni-plate', cat: 'sound', title: 'Chladni Plate', sound: true,
    tags: ['cymatics', '공명', '모래', '소리', 'nodal patterns', 'canvas'],
    mount(el, s) {
      const c = s.canvas(), x = c.ctx, p = s.pointer(c.cv);
      const P = s.params({ energy: [1, .2, 2.5, .1, '진동 세기'], size: [1.2, .6, 2.2, .1, '모래 크기'] });
      const label = s.html('<div class="material-label"><span>RESONANCE / 03</span><b>MODE 2 : 3</b></div>').querySelector('b');
      if (!s.large) s.html('<div class="material-foot">Sound finds its own geometry.</div>');
      const modes = [[2,3],[3,5],[4,7]], grid = 112;
      const field = new Float32Array(grid * grid), gx = new Float32Array(grid * grid), gy = new Float32Array(grid * grid);
      let mode = 0, audio = null, time = 0, lastAuto = 0, touched = false;
      const grains = Array.from({ length: s.large ? 5200 : 2600 }, () => ({ x: Math.random(), y: Math.random(), shade: Math.random() }));
      function buildField() {
        const [m,n] = modes[mode], pi = Math.PI;
        for (let y = 0; y < grid; y++) for (let xx = 0; xx < grid; xx++) {
          const u = 2 * xx / (grid - 1) - 1, v = 2 * y / (grid - 1) - 1, k = y * grid + xx;
          field[k] = Math.cos(m*pi*u)*Math.cos(n*pi*v) - Math.cos(n*pi*u)*Math.cos(m*pi*v);
          gx[k] = 2 * (-m*pi*Math.sin(m*pi*u)*Math.cos(n*pi*v) + n*pi*Math.sin(n*pi*u)*Math.cos(m*pi*v));
          gy[k] = 2 * (-n*pi*Math.cos(m*pi*u)*Math.sin(n*pi*v) + m*pi*Math.cos(n*pi*u)*Math.sin(m*pi*v));
        }
        label.textContent = `MODE ${m} : ${n}`;
      }
      function scatter() { grains.forEach(g => { g.x = Math.random(); g.y = Math.random(); }); }
      function tone() {
        if (!s.large || !Lab.sound.on) return;
        try {
          audio = audio || new (window.AudioContext || window.webkitAudioContext)();
          if (audio.state === 'suspended') audio.resume().catch(() => {});
          const now = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
          osc.frequency.value = 60 * (modes[mode][0] + modes[mode][1]);
          gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.055, now + .03);
          gain.gain.exponentialRampToValueAtTime(.0001, now + .6);
          osc.connect(gain).connect(audio.destination); osc.start(now); osc.stop(now + .65);
          osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        } catch (_) {}
      }
      s.add(() => { if (audio) audio.close().catch(() => {}); });
      buildField();
      s.modes(['2 : 3', '3 : 5', '4 : 7'], 0, (i) => { touched = true; mode = i; buildField(); scatter(); tone(); });
      p.ondown = () => { touched = true; scatter(); tone(); };
      const plate = () => { const side = Math.min(c.w * .78, c.h * .68); return { side, left: (c.w-side)/2, top: (c.h-side)/2 }; };
      function moveGrains(dt, interact) {
        const b = plate(), px = (p.x-b.left)/b.side, py = (p.y-b.top)/b.side;
        for (const g of grains) {
          const k = Math.min(grid-1, Math.floor(g.y*grid))*grid + Math.min(grid-1, Math.floor(g.x*grid));
          const f = field[k], dx = gx[k], dy = gy[k], norm = dx*dx + dy*dy + 1;
          const rate = Math.min(1, dt * 22 * P.energy);
          g.x -= f * dx / norm * rate; g.y -= f * dy / norm * rate;
          const jitter = Math.abs(f) * .025 * Math.sqrt(dt) * P.energy;
          g.x += (Math.random()-.5)*jitter; g.y += (Math.random()-.5)*jitter;
          if (interact && p.inside) {
            const ax=g.x-px, ay=g.y-py, d=Math.hypot(ax,ay);
            if (d < .1 && d > .0001) { g.x += ax/d * (.1-d)*dt*8; g.y += ay/d * (.1-d)*dt*8; }
          }
          g.x = U.clamp(g.x,.002,.998); g.y = U.clamp(g.y,.002,.998);
        }
      }
      // A settled opening frame also makes a useful static poster.
      for (let i=0;i<65;i++) moveGrains(1/60,false);
      const fixed = s.fixed(1/60, dt => moveGrains(dt,true));
      s.raf((dt) => {
        time += dt;
        if (!s.large && !touched && time-lastAuto>8) { mode=(mode+1)%modes.length; buildField(); scatter(); lastAuto=time; }
        fixed(dt,time);
        const b = plate();
        x.fillStyle='#10191b'; x.fillRect(0,0,c.w,c.h);
        const light=x.createRadialGradient(c.w*.48,c.h*.43,0,c.w/2,c.h/2,b.side*.85);
        light.addColorStop(0,'#283b3c'); light.addColorStop(1,'#101b1e');
        x.fillStyle=light; x.fillRect(b.left,b.top,b.side,b.side);
        x.strokeStyle='#a28d6055'; x.lineWidth=1; x.strokeRect(b.left,b.top,b.side,b.side);
        const size=Math.max(.65,b.side/410)*P.size;
        // Group colors rather than changing fillStyle for every grain.
        for (let layer=0;layer<3;layer++) {
          x.fillStyle=['#a08a57','#d2b97b','#f5e6b8'][layer];
          for (const g of grains) if (Math.min(2,Math.floor(g.shade*3))===layer) x.fillRect(b.left+g.x*b.side,b.top+g.y*b.side,size,size);
        }
        x.fillStyle='#bba66b'; x.beginPath(); x.arc(c.w/2,c.h/2,2,0,U.TAU); x.fill();
      });
    },
  });
})();
