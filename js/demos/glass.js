/* =========================================================
   GLASS — 리퀴드 글래스 / 프로스트 / 굴절 효과
   ========================================================= */
(() => {
  const { U } = Lab;
  let fid = 0;

  /* =======================================================
     1. Liquid Glass Lens — SVG 변위맵 굴절 + 색수차
     ======================================================= */
  function lensMap(size, edge) {
    const c = Lab.offscreen(size, size), x = c.getContext('2d');
    const img = x.createImageData(size, size);
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const u = ((i + 0.5) / size) * 2 - 1, v = ((j + 0.5) / size) * 2 - 1;
        const d = Math.hypot(u, v);
        let dx = 0, dy = 0;
        if (d < 1) {
          const t = U.smooth(edge, 1, d);
          const f = t * t;
          dx = (-u / (d || 1)) * f; dy = (-v / (d || 1)) * f;
        }
        const k = (j * size + i) * 4;
        img.data[k] = 128 + dx * 127; img.data[k + 1] = 128 + dy * 127; img.data[k + 2] = 128; img.data[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  Lab.register({
    id: 'liquid-lens', cat: 'glass', title: 'Liquid Glass Lens', feature: true,
    tags: ['SVG filter', 'refraction', 'mouse'],
    css: `
    .lg-root{position:absolute;inset:0;overflow:hidden;cursor:none}
    .lg-scene{position:absolute;inset:0;container-type:size;overflow:hidden;
      background:radial-gradient(ellipse at 20% 10%,#2b1460,transparent 60%),radial-gradient(ellipse at 90% 90%,#003a5c,transparent 55%),#0b0a1a}
    .lg-scene::before{content:'';position:absolute;inset:0;opacity:.25;
      background:linear-gradient(#fff2 1px,transparent 1px) 0 0/6cqmin 6cqmin,linear-gradient(90deg,#fff2 1px,transparent 1px) 0 0/6cqmin 6cqmin}
    .lg-blob{position:absolute;border-radius:50%;filter:blur(1px)}
    .lg-blob.b1{width:42cqmin;height:42cqmin;left:8%;top:12%;background:radial-gradient(circle at 35% 30%,#ffd36b,#ff5f8f 55%,#7a1f5c);animation:lg-f1 9s ease-in-out infinite alternate}
    .lg-blob.b2{width:30cqmin;height:30cqmin;right:10%;top:8%;background:radial-gradient(circle at 35% 30%,#a7fff0,#2fb8ff 55%,#1b3a8a);animation:lg-f2 11s ease-in-out infinite alternate}
    .lg-blob.b3{width:24cqmin;height:24cqmin;right:24%;bottom:6%;background:radial-gradient(circle at 35% 30%,#e3c4ff,#9b5cff 55%,#3b1a7a);animation:lg-f1 13s ease-in-out infinite alternate-reverse}
    @keyframes lg-f1{to{transform:translate(12cqmin,8cqmin) scale(1.1)}}
    @keyframes lg-f2{to{transform:translate(-10cqmin,14cqmin) scale(.9)}}
    .lg-text{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;
      font:800 17cqmin/.86 'Space Grotesk',sans-serif;letter-spacing:-.04em;color:#fff;text-shadow:0 1cqmin 4cqmin #0006}
    .lg-text2{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;
      font:800 17cqmin/.86 'Space Grotesk',sans-serif;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:.25cqmin #fffc}
    .lg-small{position:absolute;left:0;right:0;bottom:7%;text-align:center;font:600 2.6cqmin 'JetBrains Mono',monospace;letter-spacing:.4em;color:#fff9}
    .lg-lens{position:absolute;left:0;top:0;border-radius:50%;will-change:transform;pointer-events:none}
    .lg-clip{position:absolute;inset:0;border-radius:50%;overflow:hidden}
    .lg-f{position:absolute;inset:0;overflow:hidden}
    .lg-clone{inset:auto;transform-origin:0 0}
    .lg-rim{position:absolute;inset:0;border-radius:50%;
      box-shadow:inset 0 0 0 1px #ffffff70,inset 0 .6cqmin 1.2cqmin #ffffff80,inset 0 -1.6cqmin 3cqmin #ffffff20,inset 0 0 4cqmin #ffffff14,0 3cqmin 6cqmin -1cqmin #0009;
      background:radial-gradient(ellipse 50% 32% at 34% 22%,#ffffff55,#fff0 70%),radial-gradient(ellipse 40% 20% at 66% 86%,#ffffff22,#fff0 70%)}
    .lg-svg{position:absolute;width:0;height:0}
    `,
    mount(el, s) {
      const id = 'lgf' + ++fid;
      const sceneInner = `<div class="lg-blob b1"></div><div class="lg-blob b2"></div><div class="lg-blob b3"></div>
        <div class="lg-text">LIQUID<br>GLASS</div><div class="lg-small">refraction · dispersion · specular</div>`;
      const root = s.html(`<div class="lg-root">
        <div class="lg-scene">${sceneInner}</div>
        <div class="lg-lens"><div class="lg-clip"><div class="lg-f" style="filter:url(#${id})"><div class="lg-scene lg-clone">${sceneInner}</div></div></div><div class="lg-rim"></div></div>
        <svg class="lg-svg" aria-hidden="true"><filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" color-interpolation-filters="sRGB">
          <feImage result="map" x="0" y="0" width="100" height="100" preserveAspectRatio="none"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="40" xChannelSelector="R" yChannelSelector="G" result="dr"/>
          <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="44" xChannelSelector="R" yChannelSelector="G" result="dg"/>
          <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G" result="db"/>
          <feColorMatrix in="db" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/>
          <feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/>
        </filter></svg>
      </div>`);
      const lens = root.querySelector('.lg-lens'), clone = root.querySelector('.lg-clone');
      const filter = root.querySelector('filter'), feImg = root.querySelector('feImage');
      const disp = [...root.querySelectorAll('feDisplacementMap')];
      feImg.setAttribute('href', lensMap(192, 0.45));
      let W = 0, H = 0, L = 100;
      s.resize(root, (w, h) => {
        W = w; H = h; L = Math.round(Math.min(w, h) * 0.42);
        lens.style.width = lens.style.height = L + 'px';
        [filter, feImg].forEach((n) => { n.setAttribute('width', L); n.setAttribute('height', L); });
        clone.style.width = w + 'px'; clone.style.height = h + 'px';
      });
      const p = s.pointer(root);
      const T = s.params({ refract: [0.22, 0, 0.6, 0.01, '굴절 세기'], mag: [1.12, 0.8, 1.6, 0.01, '배율'] });
      const X = { x: W / 2, v: 0 }, Y = { x: H / 2, v: 0 }, S = { x: 1, v: 0 };
      s.raf((dt, t) => {
        const tgt = p.idle ? Lab.ghost(t, W, H) : p;
        U.spring(X, tgt.x, dt, 90, 13); U.spring(Y, tgt.y, dt, 90, 13);
        U.spring(S, p.down ? 1.3 : 1, dt, 200, 12);
        const sp = Math.hypot(X.v, Y.v);
        const st = Math.min(0.28, sp / 4000);
        const ang = Math.atan2(Y.v, X.v);
        const lx = X.x - L / 2, ly = Y.x - L / 2;
        lens.style.transform = `translate(${lx}px,${ly}px) rotate(${ang}rad) scale(${S.x * (1 + st)},${S.x * (1 - st * 0.6)}) rotate(${-ang}rad)`;
        const mag = T.mag;
        clone.style.transform = `translate(${-lx * mag - (mag - 1) * L / 2}px,${-ly * mag - (mag - 1) * L / 2}px) scale(${mag})`;
        const k = L * (T.refract + (S.x - 1) * 0.3);
        disp[0].setAttribute('scale', k.toFixed(1));
        disp[1].setAttribute('scale', (k * 1.07).toFixed(1));
        disp[2].setAttribute('scale', (k * 1.14).toFixed(1));
      });
    },
  });

  /* =======================================================
     2. Frosted Glass Cards — backdrop-filter + 스페큘러 하이라이트
     ======================================================= */
  Lab.register({
    id: 'frosted-cards', cat: 'glass', title: 'Frosted Glass UI',
    tags: ['backdrop-filter', '3D tilt', 'mouse'],
    css: `
    .fg{position:absolute;inset:0;overflow:hidden;background:#0c0a1c;perspective:900px}
    .fg-orb{position:absolute;border-radius:50%;filter:blur(2cqmin)}
    .fg-orb.o1{width:40cqmin;height:40cqmin;left:-6%;top:-10%;background:#ff4f9a;animation:fg-a 12s ease-in-out infinite alternate}
    .fg-orb.o2{width:46cqmin;height:46cqmin;right:-8%;bottom:-16%;background:#3a7bff;animation:fg-a 15s ease-in-out infinite alternate-reverse}
    .fg-orb.o3{width:26cqmin;height:26cqmin;left:40%;bottom:4%;background:#ffb547;animation:fg-a 10s ease-in-out infinite alternate}
    .fg-orb.fol{width:34cqmin;height:34cqmin;left:0;top:0;background:radial-gradient(circle,#6bffcf,#00c2ff 60%);will-change:transform}
    @keyframes fg-a{to{transform:translate(10cqmin,12cqmin) scale(1.15)}}
    .fg-comp{position:absolute;left:50%;top:50%;width:min(100cqw,133cqh);aspect-ratio:4/3;transform:translate(-50%,-50%);container-type:size;transform-style:preserve-3d}
    .fg-card{--mx:50%;--my:50%;--rx:0deg;--ry:0deg;position:absolute;border-radius:3.2cqw;color:#fff;font-family:'Space Grotesk',sans-serif;
      background:linear-gradient(135deg,#ffffff2a,#ffffff0a);backdrop-filter:blur(16px) saturate(170%);-webkit-backdrop-filter:blur(16px) saturate(170%);
      box-shadow:inset 0 1px 0 #ffffff50,0 2cqw 5cqw -1cqw #0008;transform:rotateX(var(--rx)) rotateY(var(--ry));will-change:transform}
    .fg-card::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
      background:radial-gradient(circle at var(--mx) var(--my),#ffffff40,#fff0 45%)}
    .fg-card::after{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
      background:radial-gradient(circle at var(--mx) var(--my),#fff,#ffffff30 35%,#ffffff18);
      -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
    .fg-cc{left:5%;top:30%;width:50%;aspect-ratio:1.586;padding:3.4cqw}
    .fg-bp-top{display:flex;justify-content:space-between;font:600 1.6cqw 'JetBrains Mono',monospace;letter-spacing:.14em;opacity:.8}
    .fg-bp-route{display:flex;align-items:center;gap:2cqw;margin-top:3cqw}
    .fg-bp-route b{display:block;font:700 6.4cqw/1 'Space Grotesk',sans-serif;letter-spacing:-.02em}.fg-bp-route small{font-size:1.7cqw;opacity:.75}
    .fg-bp-line{flex:1;height:1px;border-top:.3cqw dashed #ffffff90;position:relative}.fg-bp-line svg{position:absolute;left:50%;top:50%;width:3.4cqw;transform:translate(-50%,-55%) rotate(90deg);color:#fff;filter:drop-shadow(0 0 .6cqw #0004)}
    .fg-chip{width:7cqw;height:5.4cqw;border-radius:1cqw;background:linear-gradient(135deg,#ffe9a8,#c9a24a);box-shadow:inset 0 0 0 .3cqw #0002}
    .fg-num{font:600 3.3cqw 'JetBrains Mono',monospace;letter-spacing:.12em;margin-top:4.2cqw}
    .fg-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:2.6cqw;font-size:1.9cqw;opacity:.85}
    .fg-row b{display:block;font-size:2.4cqw;opacity:1}
    .fg-logo{position:absolute;right:3.4cqw;top:3.4cqw;display:flex}
    .fg-logo i{width:5cqw;height:5cqw;border-radius:50%;background:#ff5f6d;opacity:.9}.fg-logo i+i{background:#ffc371;margin-left:-2cqw}
    .fg-w{left:60%;top:8%;width:33%;padding:2.8cqw}
    .fg-w small{font-size:1.8cqw;opacity:.8;letter-spacing:.06em}
    .fg-temp{font-size:9cqw;font-weight:300;line-height:1;margin:1cqw 0}
    .fg-sun{position:absolute;right:2.6cqw;top:2.6cqw;width:7cqw;height:7cqw;border-radius:50%;background:radial-gradient(circle,#fff6c4,#ffcf3f 60%);box-shadow:0 0 4cqw #ffcf3f}
    .fg-days{display:flex;justify-content:space-between;font-size:1.6cqw;opacity:.75;margin-top:1.5cqw}
    .fg-m{left:58%;top:57%;width:37%;padding:2.4cqw;display:grid;grid-template-columns:auto 1fr;gap:2cqw;align-items:center}
    .fg-cover{width:9cqw;height:9cqw;border-radius:1.8cqw;background:conic-gradient(from 200deg,#ff5f8f,#ffcf5c,#6bffb8,#6bc6ff,#b36bff,#ff5f8f)}
    .fg-m b{font-size:2.4cqw;display:block}.fg-m small{font-size:1.7cqw;opacity:.7}
    .fg-bar{grid-column:1/-1;height:.7cqw;border-radius:1cqw;background:#ffffff30;overflow:hidden}
    .fg-bar i{display:block;height:100%;width:40%;background:#fff;border-radius:inherit;animation:fg-p 8s linear infinite}
    @keyframes fg-p{from{width:0}to{width:100%}}
    `,
    mount(el, s) {
      const root = s.html(`<div class="fg">
        <div class="fg-orb o1"></div><div class="fg-orb o2"></div><div class="fg-orb o3"></div><div class="fg-orb fol"></div>
        <div class="fg-comp">
          <div class="fg-card fg-cc"><div class="fg-bp-top"><span>BOARDING PASS</span><span>ML 027 · 20 OCT</span></div>
            <div class="fg-bp-route"><div><b>ICN</b><small>서울/인천</small></div><div class="fg-bp-line"><svg viewBox="0 0 24 24"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" fill="currentColor"/></svg></div><div style="text-align:right"><b>CDG</b><small>PARIS</small></div></div>
            <div class="fg-row"><div>Gate<b>27</b></div><div>Seat<b>14A</b></div><div>Boards<b>09:40</b></div></div></div>
          <div class="fg-card fg-w"><div class="fg-sun"></div><small>SEOUL</small><div class="fg-temp">24°</div><small>Mostly sunny</small>
            <div class="fg-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span></div></div>
          <div class="fg-card fg-m"><div class="fg-cover"></div><div><b>Glass Hours</b><small>The Refractors</small></div><div class="fg-bar"><i></i></div></div>
        </div></div>`);
      const cards = [...root.querySelectorAll('.fg-card')];
      const fol = root.querySelector('.fol');
      const p = s.pointer(root);
      const st = cards.map(() => ({ rx: { x: 0, v: 0 }, ry: { x: 0, v: 0 }, mx: 50, my: 50 }));
      const F = { x: 0, y: 0 };
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t, W, H) : p;
        F.x += (g.x - F.x) * U.damp(3, dt); F.y += (g.y - F.y) * U.damp(3, dt);
        const fs = fol.offsetWidth;
        fol.style.transform = `translate(${F.x - fs / 2}px,${F.y - fs / 2}px)`;
        const rr = root.getBoundingClientRect();
        cards.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const lx = (g.x + rr.left - r.left) / r.width, ly = (g.y + rr.top - r.top) / r.height;
          const inside = lx > -0.1 && lx < 1.1 && ly > -0.1 && ly < 1.1;
          const q = st[i];
          q.mx += (lx * 100 - q.mx) * U.damp(10, dt); q.my += (ly * 100 - q.my) * U.damp(10, dt);
          U.spring(q.rx, inside ? (0.5 - ly) * 16 : 0, dt, 120, 14);
          U.spring(q.ry, inside ? (lx - 0.5) * 16 : 0, dt, 120, 14);
          c.style.setProperty('--mx', q.mx.toFixed(1) + '%');
          c.style.setProperty('--my', q.my.toFixed(1) + '%');
          c.style.setProperty('--rx', q.rx.x.toFixed(2) + 'deg');
          c.style.setProperty('--ry', q.ry.x.toFixed(2) + 'deg');
        });
      });
    },
  });

  /* =======================================================
     3. Glass Dock — macOS 스타일 확대 독
     ======================================================= */
  Lab.register({
    id: 'glass-dock', cat: 'glass', title: 'Magnifying Dock',
    tags: ['gaussian', 'spring', 'mouse'],
    css: `
    .gd{position:absolute;inset:0;overflow:hidden;font-family:'Space Grotesk',sans-serif;
      background:radial-gradient(ellipse 70% 60% at 25% 30%,#ff7a59,transparent 60%),radial-gradient(ellipse 60% 70% at 80% 20%,#7a5cff,transparent 60%),radial-gradient(ellipse 80% 60% at 60% 90%,#00b3ff,transparent 60%),#1a1033}
    .gd::before{content:'';position:absolute;inset:-20%;background:repeating-radial-gradient(circle at 30% 120%,#ffffff10 0 2cqmin,transparent 2cqmin 4cqmin);animation:gd-r 30s linear infinite}
    @keyframes gd-r{to{transform:rotate(8deg) scale(1.05)}}
    .gd-bar{position:absolute;left:0;right:0;top:0;height:5cqmin;display:flex;align-items:center;gap:3cqmin;padding:0 2.4cqmin;font-size:2.2cqmin;color:#fff;
      background:#ffffff1a;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
    .gd-bar b{font-weight:700}.gd-bar span:last-child{margin-left:auto;font-family:'JetBrains Mono',monospace}
    .gd-dock{position:absolute;left:50%;bottom:2.6cqmin;transform:translateX(-50%);display:flex;align-items:flex-end;gap:1.1cqmin;padding:1.2cqmin 1.4cqmin}
    .gd-dock::before{content:'';position:absolute;left:0;right:0;bottom:0;height:calc(var(--b) + 2.4cqmin);border-radius:3.2cqmin;
      background:linear-gradient(#ffffff30,#ffffff14);backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);
      box-shadow:inset 0 1px 0 #ffffff70,inset 0 0 0 1px #ffffff2a,0 2cqmin 5cqmin -1cqmin #0007}
    .gd-sep{width:1px;align-self:stretch;margin:0 .4cqmin;background:#ffffff40;position:relative;height:var(--b)}
    .gd-ic{position:relative;flex:none;width:var(--b);height:var(--b);cursor:pointer}
    .gd-face{position:absolute;inset:0;border-radius:23%;display:grid;place-items:center;font-size:55%;line-height:1;
      box-shadow:inset 0 1px 0 #fff6,0 .4cqmin 1cqmin #0005;transform-origin:50% 100%}
    .gd-face svg{width:58%;height:58%}
    .gd-ic.bounce .gd-face{animation:gd-b .55s cubic-bezier(.3,.7,.4,1) 2}
    @keyframes gd-b{40%{transform:translateY(-45%)}}
    .gd-tip{position:absolute;left:50%;bottom:calc(100% + 1.4cqmin);transform:translate(-50%,4px);padding:.6cqmin 1.4cqmin;border-radius:1.2cqmin;white-space:nowrap;
      font-size:2cqmin;color:#fff;background:#1d1d29cc;backdrop-filter:blur(10px);opacity:0;transition:.15s;pointer-events:none}
    .gd-ic.on .gd-tip{opacity:1;transform:translate(-50%,0)}
    .gd-run{position:absolute;left:50%;bottom:-1cqmin;width:.7cqmin;height:.7cqmin;border-radius:50%;background:#fff;transform:translateX(-50%);opacity:0;transition:.3s}
    .gd-ic.running .gd-run{opacity:.9}
    `,
    mount(el, s) {
      const petals = ['#ff5f5f', '#ffb13d', '#ffe14a', '#5fd38d', '#3fa9ff', '#a66bff']
        .map((c, i) => `<ellipse cx="12" cy="7" rx="2.6" ry="4.4" fill="${c}" opacity=".85" stroke="none" transform="rotate(${i * 60} 12 12)"/>`).join('');
      // [이름, 아이콘 색, 배경, 24×24 라인 아이콘]
      const apps = [
        ['Finder', '#fff', 'linear-gradient(135deg,#6ad1ff,#1f6bff)', '<path d="M12 3v18"/><circle cx="7.5" cy="10" r="1" fill="currentColor"/><circle cx="16.5" cy="10" r="1" fill="currentColor"/><path d="M7 15.5c3 2 7 2 10 0"/>'],
        ['Safari', '#1f6bff', 'linear-gradient(135deg,#fff,#cfe6ff)', '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>'],
        ['Messages', '#fff', 'linear-gradient(#7dff8a,#1fcf3a)', '<path d="M12 4c4.97 0 9 3.13 9 7s-4.03 7-9 7c-1 0-2-.1-2.9-.4L5 19l1.2-3.3C4.2 14.4 3 12.8 3 11c0-3.87 4.03-7 9-7z" fill="currentColor" stroke="none"/>'],
        ['Music', '#fff', 'linear-gradient(135deg,#ff6b8b,#ff2d55)', '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/>'],
        ['Photos', '#fff', 'linear-gradient(135deg,#fff,#f1f1f1)', petals],
        ['Maps', '#1f7a4a', 'linear-gradient(135deg,#d6fbc4,#7fdba0)', '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'],
        ['Notes', '#7a5a00', 'linear-gradient(#fff3b8,#ffd23f)', '<path d="M7 8h10M7 12h10M7 16h6"/>'],
        ['Paint', '#fff', 'linear-gradient(135deg,#ffcf5c,#ff7a59)', '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1.1-1.9-.6-1 .1-2.1 1.2-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>'],
        ['Settings', '#3a3a44', 'linear-gradient(135deg,#e2e2e8,#9b9ba8)', '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'],
        '|',
        ['Trash', '#5a6270', 'linear-gradient(135deg,#eef2f7,#bcc5d1)', '<path d="M5 7h14M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'],
      ];
      const root = s.html(`<div class="gd">
        <div class="gd-bar"><b>●</b><b>Motion</b><span>File</span><span>Edit</span><span>View</span><span>Window</span><span>9:41</span></div>
        <div class="gd-dock">${apps.map((a) => (a === '|' ? '<div class="gd-sep"></div>' :
          `<div class="gd-ic"><div class="gd-face" style="background:${a[2]};color:${a[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${a[3]}</svg></div><span class="gd-tip">${a[0]}</span><i class="gd-run"></i></div>`)).join('')}</div>
      </div>`);
      const dock = root.querySelector('.gd-dock');
      const icons = [...root.querySelectorAll('.gd-ic')];
      icons[0].classList.add('running'); icons[1].classList.add('running');
      const sc = icons.map(() => ({ x: 1, v: 0 }));
      icons.forEach((ic) => s.on(ic, 'click', () => {
        ic.classList.remove('bounce'); void ic.offsetWidth; ic.classList.add('bounce');
        s.timeout(() => { ic.classList.remove('bounce'); ic.classList.add('running'); }, 1100);
      }));
      const p = s.pointer(root);
      let B = 40;
      s.resize(root, (w, h) => { B = Math.min(w, h) * 0.095; root.style.setProperty('--b', B + 'px'); });
      s.raf((dt, t) => {
        const H = root.clientHeight, W = root.clientWidth;
        let mx, near;
        if (p.idle) { mx = W / 2 + Math.sin(t * 0.8) * W * 0.3; near = Math.sin(t * 0.4) > -0.6; }
        else { mx = p.x; near = p.y > H - B * 3.6; }
        const rr = root.getBoundingClientRect();
        let best = -1, bd = 1e9;
        icons.forEach((ic, i) => {
          const r = ic.getBoundingClientRect();
          const cx = r.left - rr.left + r.width / 2;
          const d = (mx - cx) / B;
          const target = near ? 1 + 0.95 * Math.exp(-(d * d) / 4.5) : 1;
          U.spring(sc[i], target, dt, 260, 24);
          const size = B * sc[i].x;
          ic.style.width = ic.style.height = size + 'px';
          ic.firstElementChild.style.fontSize = size * 0.55 + 'px';
          if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
        });
        icons.forEach((ic, i) => ic.classList.toggle('on', near && i === best && bd < 0.8));
      });
    },
  });

  /* =======================================================
     4. Liquid Glass Controls — iOS 26 풍 글래스 컨트롤
     ======================================================= */
  Lab.register({
    id: 'glass-controls', cat: 'glass', title: 'Liquid Glass Controls',
    tags: ['backdrop-filter', 'spring', 'drag'],
    css: `
    .lc{position:absolute;inset:0;overflow:hidden;font-family:'Space Grotesk',sans-serif;color:#fff;
      background:conic-gradient(from 210deg at 70% 30%,#ff8a5b,#ffcf5c,#6bffb8,#3ab0ff,#9b6bff,#ff5f9a,#ff8a5b)}
    .lc::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,#0000 0 3cqmin,#0000001a 3cqmin 3.4cqmin),radial-gradient(circle at 30% 70%,#fff8,transparent 30%)}
    .lc-word{position:absolute;inset:0;display:grid;place-items:center;font:900 30cqmin/1 'Space Grotesk';letter-spacing:-.06em;color:#ffffff38}
    .lc-comp{position:absolute;left:50%;top:50%;width:min(100cqw,133cqh);aspect-ratio:4/3;transform:translate(-50%,-50%);container-type:size}
    .lc-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58cqw;padding:3.4cqw;border-radius:5.4cqw;display:grid;gap:2.6cqw;
      background:#ffffff1c;backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);
      box-shadow:inset 0 1px 1px #ffffffaa,inset 0 -1px 1px #ffffff40,inset 0 0 3cqw #ffffff22,0 3cqw 6cqw -2cqw #0006}
    .lc-row{display:flex;align-items:center;justify-content:space-between;font-size:3cqw;font-weight:600;text-shadow:0 1px 4px #0004}
    .lc-glass{background:#ffffff26;backdrop-filter:blur(3px) saturate(180%) brightness(1.08);-webkit-backdrop-filter:blur(3px) saturate(180%) brightness(1.08);
      box-shadow:inset 1px 1px 1px #ffffffcc,inset -1px -1px 1px #ffffff55,inset 0 0 1.4cqw #ffffff40,0 .8cqw 2cqw #0003}
    .lc-toggle{position:relative;width:11cqw;height:6.4cqw;border-radius:4cqw;background:#00000030;cursor:pointer;transition:background .35s;box-shadow:inset 0 .3cqw .8cqw #0003}
    .lc-toggle.on{background:#34d17a}
    .lc-knob{position:absolute;left:0;top:.6cqw;width:7.2cqw;height:5.2cqw;border-radius:4cqw;will-change:transform}
    .lc-slider{position:relative;height:6cqw;cursor:pointer;touch-action:none}
    .lc-track{position:absolute;left:0;right:0;top:50%;height:1.4cqw;margin-top:-.7cqw;border-radius:1cqw;background:#00000030;overflow:hidden}
    .lc-fill{height:100%;width:50%;background:linear-gradient(90deg,#fff,#fffc);border-radius:inherit}
    .lc-thumb{position:absolute;top:50%;left:0;width:8cqw;height:5.2cqw;margin:-2.6cqw 0 0 -4cqw;border-radius:4cqw;will-change:transform}
    .lc-seg{position:relative;display:grid;grid-template-columns:repeat(3,1fr);padding:.7cqw;border-radius:5cqw;background:#0000002a}
    .lc-seg button{position:relative;z-index:1;border:0;background:none;color:#fff;font:600 2.5cqw 'Space Grotesk';padding:1.5cqw 0;cursor:pointer}
    .lc-pill{position:absolute;top:.7cqw;bottom:.7cqw;left:0;border-radius:4cqw;will-change:transform}
    .lc-btns{display:grid;grid-template-columns:1fr 1fr;gap:2cqw}
    .lc-btn{--mx:50%;--my:50%;border:0;color:#fff;font:600 2.7cqw 'Space Grotesk';padding:2cqw;border-radius:5cqw;cursor:pointer;
      transition:transform .4s cubic-bezier(.3,1.6,.5,1);background-image:radial-gradient(circle at var(--mx) var(--my),#ffffff55,#fff0 60%)}
    .lc-btn.primary{background-color:#3a8bff66}
    .lc-btn:active{transform:scale(.92,.86)}
    `,
    mount(el, s) {
      const root = s.html(`<div class="lc"><div class="lc-word">Aa</div><div class="lc-comp"><div class="lc-panel">
        <div class="lc-row"><span>Wi-Fi</span><div class="lc-toggle on"><div class="lc-knob lc-glass"></div></div></div>
        <div class="lc-row"><span>Bluetooth</span><div class="lc-toggle"><div class="lc-knob lc-glass"></div></div></div>
        <div class="lc-slider"><div class="lc-track"><div class="lc-fill"></div></div><div class="lc-thumb lc-glass"></div></div>
        <div class="lc-seg"><div class="lc-pill lc-glass"></div><button>Day</button><button>Week</button><button>Month</button></div>
        <div class="lc-btns"><button class="lc-btn lc-glass">Cancel</button><button class="lc-btn lc-glass primary">Done</button></div>
      </div></div></div>`);
      let lastUser = -1e9;
      const touch = () => (lastUser = performance.now());

      // toggles
      const toggles = [...root.querySelectorAll('.lc-toggle')].map((tg) => {
        const o = { el: tg, knob: tg.firstElementChild, on: tg.classList.contains('on'), press: false, X: { x: 0, v: 0 }, SX: { x: 1, v: 0 }, SY: { x: 1, v: 0 }, init: false };
        s.on(tg, 'pointerdown', (e) => { touch(); o.press = true; e.preventDefault(); });
        s.on(window, 'pointerup', () => { if (!o.press) return; o.press = false; o.on = !o.on; tg.classList.toggle('on', o.on); });
        return o;
      });
      // slider
      const sl = root.querySelector('.lc-slider'), thumb = root.querySelector('.lc-thumb'), fill = root.querySelector('.lc-fill');
      let val = 0.55, drag = false;
      const V = { x: val, v: 0 }, TS = { x: 1, v: 0 };
      const setVal = (e) => { const r = sl.getBoundingClientRect(); val = U.clamp((e.clientX - r.left) / r.width, 0, 1); };
      s.on(sl, 'pointerdown', (e) => { touch(); drag = true; setVal(e); try { sl.setPointerCapture(e.pointerId); } catch (_) {} });
      s.on(sl, 'pointermove', (e) => drag && (touch(), setVal(e)));
      s.on(sl, 'pointerup', () => (drag = false));
      // segmented
      const seg = root.querySelector('.lc-seg'), pill = root.querySelector('.lc-pill');
      const btns = [...seg.querySelectorAll('button')];
      let idx = 0;
      const PX = { x: 0, v: 0 };
      btns.forEach((b, i) => s.on(b, 'click', () => { touch(); idx = i; }));
      // buttons highlight
      root.querySelectorAll('.lc-btn').forEach((b) => s.on(b, 'pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      }));

      let autoT = 0;
      s.raf((dt, t) => {
        const auto = performance.now() - lastUser > 4000;
        if (auto) {
          autoT += dt;
          if (autoT > 1.6) { autoT = 0; const o = U.pick(toggles); o.on = !o.on; o.el.classList.toggle('on', o.on); idx = (idx + 1) % 3; }
          val = 0.5 + 0.38 * Math.sin(t * 0.9);
        }
        toggles.forEach((o) => {
          const tw = o.el.clientWidth, kw = o.knob.offsetWidth;
          const pad = tw * 0.06;
          const target = o.on ? tw - kw - pad + (o.press ? -tw * 0.06 : 0) : pad + (o.press ? tw * 0.0 : 0);
          if (!o.init) { o.X.x = target; o.init = true; }
          U.spring(o.X, target, dt, 260, 18);
          const stretch = Math.min(0.35, Math.abs(o.X.v) / 900);
          U.spring(o.SX, (o.press ? 1.32 : 1) + stretch, dt, 300, 14);
          U.spring(o.SY, (o.press ? 1.22 : 1) - stretch * 0.5, dt, 300, 14);
          o.knob.style.transform = `translateX(${o.X.x}px) scale(${o.SX.x},${o.SY.x})`;
          o.knob.style.background = o.press ? '#ffffff14' : '#ffffffd0';
        });
        U.spring(V, val, dt, 300, 26);
        U.spring(TS, drag ? 1.55 : 1, dt, 280, 14);
        const w = sl.clientWidth;
        thumb.style.transform = `translateX(${V.x * w}px) scale(${TS.x * (1 + Math.min(.3, Math.abs(V.v) / 8))},${TS.x})`;
        thumb.style.background = drag ? '#ffffff12' : '#ffffffe0';
        fill.style.width = V.x * 100 + '%';
        const bw = btns[0].offsetWidth;
        U.spring(PX, btns[idx].offsetLeft, dt, 200, 17);
        const st = Math.min(0.5, Math.abs(PX.v) / 700);
        pill.style.width = bw + 'px';
        pill.style.transform = `translateX(${PX.x}px) scale(${1 + st},${1 - st * 0.35})`;
      });
    },
  });

  /* =======================================================
     5. Glass Shatter — 클릭하면 유리가 깨져 쏟아진다
     ======================================================= */
  function sunsetScene(W, H) {
    const c = Lab.offscreen(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b0f3a'); g.addColorStop(0.45, '#c2407a'); g.addColorStop(0.7, '#ff9a5a'); g.addColorStop(1, '#ffd27a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`; x.fillRect(Math.random() * W, Math.random() * H * 0.4, 1.5, 1.5); }
    const sg = x.createRadialGradient(W * 0.5, H * 0.66, 0, W * 0.5, H * 0.66, H * 0.2);
    sg.addColorStop(0, '#fff6d8'); sg.addColorStop(0.5, '#ffd27a'); sg.addColorStop(1, '#ffd27a00');
    x.fillStyle = sg; x.beginPath(); x.arc(W * 0.5, H * 0.66, H * 0.2, 0, U.TAU); x.fill();
    const layers = [['#7a2a6a', 0.62, 0.06], ['#4a1850', 0.72, 0.08], ['#24092e', 0.84, 0.1]];
    layers.forEach(([col, base, amp], li) => {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= 60; i++) { const px = (i / 60) * W; x.lineTo(px, H * (base - amp * (Lab.noise(i * 0.15, li * 3) + 0.5))); }
      x.lineTo(W, H); x.fill();
    });
    return c;
  }

  Lab.register({
    id: 'glass-shatter', cat: 'glass', title: 'Glass Shatter', sound: true,
    tags: ['canvas', 'clip', 'physics'],
    mount(el, s) {
      const c = s.canvas();
      const { ctx } = c;
      let scene, pane, shards = [], state = 'intact', T = 0, imp = { x: 0, y: 0 }, alpha = 1, nextAuto = 1.2;
      const build = () => {
        const W = c.cv.width, H = c.cv.height;
        scene = sunsetScene(W, H);
        pane = Lab.blurCanvas(scene, 16);
        const x = pane.getContext('2d');
        x.fillStyle = 'rgba(210,235,255,.22)'; x.fillRect(0, 0, W, H);
        const lg = x.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, 'rgba(255,255,255,.25)'); lg.addColorStop(0.3, 'rgba(255,255,255,0)'); lg.addColorStop(0.55, 'rgba(255,255,255,.12)'); lg.addColorStop(0.6, 'rgba(255,255,255,0)');
        x.fillStyle = lg; x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(255,255,255,.85)'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = `700 ${Math.min(W, H) * 0.11}px "Space Grotesk",sans-serif`;
        x.fillText('BREAK ME', W / 2, H * 0.46);
        x.font = `600 ${Math.min(W, H) * 0.03}px "JetBrains Mono",monospace`;
        x.fillStyle = 'rgba(255,255,255,.6)';
        x.fillText('C L I C K   A N Y W H E R E', W / 2, H * 0.58);
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = Math.max(2, W * 0.004);
        x.strokeRect(W * 0.02, H * 0.03, W * 0.96, H * 0.94);
      };
      build();
      c.onresize = build;

      const shatter = (px, py) => {
        const W = c.w, H = c.h, R = Math.hypot(W, H) * 1.05;
        imp = { x: px, y: py };
        const nr = s.large ? 16 : 11, nk = s.large ? 7 : 5;
        const angs = [];
        for (let i = 0; i < nr; i++) angs.push(((i + U.rand(-0.35, 0.35)) / nr) * U.TAU);
        const rings = [];
        for (let k = 0; k <= nk; k++) rings.push(angs.map(() => (k === 0 ? 0 : k === nk ? R : R * Math.pow(k / nk, 1.7) * U.rand(0.8, 1.2))));
        const P = (k, i) => { const a = angs[i % nr]; const r = rings[k][i % nr]; return [px + Math.cos(a) * r, py + Math.sin(a) * r]; };
        shards = [];
        for (let k = 0; k < nk; k++) for (let i = 0; i < nr; i++) {
          const pts = [P(k, i), P(k, i + 1), P(k + 1, i + 1), P(k + 1, i)];
          const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
          const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1;
          const sp = U.rand(40, 160) * (1.6 - k / nk);
          shards.push({ pts, cx, cy, ox: 0, oy: 0, vx: (dx / d) * sp, vy: (dy / d) * sp - U.rand(0, 80), a: 0, va: U.rand(-3, 3), sc: 1,
            delay: 0.18 + (d / R) * 0.9 + U.rand(0, 0.15), k });
        }
        state = 'broken'; T = 0;
      };
      const p = s.pointer(c.cv);
      p.ondown = () => {
        if (state !== 'intact' || alpha <= 0.95) return;
        shatter(p.x, p.y);
        if (s.large) {
          Lab.burst({ dur: 0.35, freq: 2600, q: 0.6, gain: 0.7, curve: 3 });
          for (let i = 0; i < 9; i++) Lab.burst({ dur: 0.05, freq: U.rand(3000, 7000), q: 6, gain: 0.25, at: 0.25 + i * U.rand(0.04, 0.12) });
        }
      };

      s.raf((dt, t) => {
        const W = c.w, H = c.h;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(scene, 0, 0, W, H);
        if (state === 'intact') {
          alpha = Math.min(1, alpha + dt * 1.6);
          ctx.globalAlpha = alpha;
          ctx.drawImage(pane, 0, 0, W, H);
          // 커서를 따라 움직이는 반사광
          const mx = p.idle ? W * (0.5 + 0.5 * Math.sin(t * 0.6)) : p.x;
          const g = ctx.createLinearGradient(mx - W * 0.3, 0, mx + W * 0.1, H);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
          if (p.idle) { nextAuto -= dt; if (nextAuto < 0 && alpha >= 1) { nextAuto = 4; shatter(U.rand(W * 0.25, W * 0.75), U.rand(H * 0.3, H * 0.7)); } }
          return;
        }
        T += dt;
        let alive = 0;
        for (const sh of shards) {
          const moving = T > sh.delay;
          if (moving) {
            sh.vy += 900 * dt; sh.ox += sh.vx * dt; sh.oy += sh.vy * dt; sh.a += sh.va * dt; sh.sc = Math.max(0.6, sh.sc - dt * 0.12);
          }
          if (sh.cy + sh.oy > H + 300) continue;
          alive++;
          ctx.save();
          ctx.translate(sh.cx + sh.ox, sh.cy + sh.oy); ctx.rotate(sh.a); ctx.scale(sh.sc, sh.sc); ctx.translate(-sh.cx, -sh.cy);
          ctx.beginPath(); sh.pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
          ctx.save(); ctx.clip(); ctx.drawImage(pane, 0, 0, W, H);
          if (moving) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill(); }
          ctx.restore();
          ctx.strokeStyle = moving ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.8)'; ctx.lineWidth = moving ? 1.2 : 1;
          ctx.stroke();
          ctx.restore();
        }
        // 충격 플래시
        if (T < 0.25) {
          const r = 40 + T * 600;
          const g = ctx.createRadialGradient(imp.x, imp.y, 0, imp.x, imp.y, r);
          g.addColorStop(0, `rgba(255,255,255,${0.7 * (1 - T / 0.25)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        if (!alive && T > 1) { state = 'intact'; alpha = 0; nextAuto = 3.5; }
      });
    },
  });

  /* =======================================================
     6. Fluted (Reeded) Glass — 골유리 굴절
     ======================================================= */
  Lab.register({
    id: 'fluted-glass', cat: 'glass', title: 'Reeded Glass',
    tags: ['CSS transform', 'clone', 'mouse'],
    css: `
    .fl{position:absolute;inset:0;overflow:hidden;--bx:50%;--by:50%}
    .fl-scene{position:absolute;inset:0;container-type:size;overflow:hidden;background:linear-gradient(160deg,#0d1b2a,#1b0d2a)}
    .fl-b{position:absolute;border-radius:50%}
    .fl-b1{width:38cqmin;height:38cqmin;left:var(--bx);top:var(--by);transform:translate(-50%,-50%);background:radial-gradient(circle,#fff7c2,#ff9d3a 40%,#ff3d7f 70%,#ff3d7f00 72%)}
    .fl-b2{width:30cqmin;height:30cqmin;left:12%;top:58%;background:radial-gradient(circle,#b8fff3,#2ad1ff 50%,#2ad1ff00 72%);animation:fl-a 7s ease-in-out infinite alternate}
    .fl-b3{width:26cqmin;height:26cqmin;right:10%;top:10%;background:radial-gradient(circle,#e6d1ff,#8a5cff 50%,#8a5cff00 72%);animation:fl-a 9s ease-in-out infinite alternate-reverse}
    @keyframes fl-a{to{transform:translate(18cqmin,-14cqmin)}}
    .fl-t{position:absolute;inset:0;display:grid;place-items:center;font:800 15cqmin/.9 'Space Grotesk';color:#fff;letter-spacing:-.04em;text-align:center}
    .fl-lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#fff1 0 1px,#0000 1px 5cqmin)}
    .fl-panel{position:absolute;overflow:hidden;border-radius:2.4cqmin;box-shadow:0 3cqmin 7cqmin -2cqmin #000c,inset 0 0 0 1px #ffffff40}
    .fl-rib{position:absolute;top:0;bottom:0;overflow:hidden}
    .fl-rib .fl-scene{inset:auto;filter:blur(.6px) saturate(1.2)}
    .fl-rib::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#ffffff30,#ffffff00 25%,#ffffff08 60%,#00000040)}
    .fl-panel::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,#ffffff30,#ffffff00 40%);pointer-events:none}
    `,
    mount(el, s) {
      const inner = `<div class="fl-b fl-b2"></div><div class="fl-b fl-b3"></div><div class="fl-b fl-b1"></div><div class="fl-lines"></div><div class="fl-t">REEDED<br>GLASS</div>`;
      const N = s.large ? 22 : 13;
      const root = s.html(`<div class="fl"><div class="fl-scene">${inner}</div>
        <div class="fl-panel">${Array.from({ length: N }, () => `<div class="fl-rib"><div class="fl-scene">${inner}</div></div>`).join('')}</div></div>`);
      const panel = root.querySelector('.fl-panel');
      const ribs = [...panel.children];
      s.resize(root, (W, H) => {
        const pw = Math.round(W * 0.56), ph = Math.round(H * 0.72);
        const px = Math.round(W * 0.42 - pw / 2 + W * 0.08), py = Math.round((H - ph) / 2);
        Object.assign(panel.style, { left: px + 'px', top: py + 'px', width: pw + 'px', height: ph + 'px' });
        const rw = pw / N;
        ribs.forEach((r, i) => {
          r.style.left = i * rw + 'px'; r.style.width = rw + 1 + 'px';
          const sc = r.firstElementChild;
          Object.assign(sc.style, {
            left: -(px + i * rw) + 'px', top: -py + 'px', width: W + 'px', height: H + 'px',
            transformOrigin: `${px + i * rw + rw / 2}px 50%`, transform: 'scaleX(2.6)',
          });
        });
      });
      const p = s.pointer(root);
      const B = { x: 0, y: 0 };
      s.raf((dt, t) => {
        const W = root.clientWidth, H = root.clientHeight;
        const g = p.idle ? Lab.ghost(t * 1.2, W, H) : p;
        B.x += (g.x - B.x) * U.damp(5, dt); B.y += (g.y - B.y) * U.damp(5, dt);
        root.style.setProperty('--bx', B.x + 'px');
        root.style.setProperty('--by', B.y + 'px');
      });
    },
  });

  /* =======================================================
     7. Foggy Window — 김 서린 유리 닦기 + 빗방울 굴절
     ======================================================= */
  function cityScene(W, H) {
    const c = Lab.offscreen(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070a24'); g.addColorStop(0.55, '#2a1440'); g.addColorStop(1, '#3a1a2a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const m = Math.min(W, H);
    for (let i = 0; i < 70; i++) {
      const r = U.rand(m * 0.015, m * 0.07), px = U.rand(W), py = U.rand(H * 0.25, H);
      const hue = U.pick([330, 20, 45, 190, 280, 200]);
      const rg = x.createRadialGradient(px, py, 0, px, py, r);
      rg.addColorStop(0, `hsla(${hue},100%,70%,.55)`); rg.addColorStop(1, `hsla(${hue},100%,60%,0)`);
      x.fillStyle = rg; x.beginPath(); x.arc(px, py, r, 0, U.TAU); x.fill();
    }
    let bx = 0;
    while (bx < W) {
      const bw = U.rand(m * 0.06, m * 0.16), bh = U.rand(H * 0.22, H * 0.62);
      x.fillStyle = '#0b0716'; x.fillRect(bx, H - bh, bw, bh);
      for (let wy = H - bh + m * 0.02; wy < H - m * 0.02; wy += m * 0.03) for (let wx = bx + m * 0.012; wx < bx + bw - m * 0.015; wx += m * 0.025) {
        if (Math.random() < 0.4) { x.fillStyle = `hsla(${U.pick([40, 45, 200, 30])},90%,${U.rand(55, 75)}%,.9)`; x.fillRect(wx, wy, m * 0.01, m * 0.014); }
      }
      bx += bw + U.rand(0, m * 0.02);
    }
    return c;
  }

  Lab.register({
    id: 'foggy-window', cat: 'glass', title: 'Foggy Window',
    tags: ['canvas', 'composite', 'mouse'],
    mount(el, s) {
      const base = s.canvas(), fog = s.canvas(), dropC = s.canvas();
      let scene, fogImg;
      const build = () => {
        scene = cityScene(base.cv.width, base.cv.height);
        fogImg = Lab.blurCanvas(scene, 22);
        const x = fogImg.getContext('2d');
        x.fillStyle = 'rgba(190,200,225,.30)'; x.fillRect(0, 0, fogImg.width, fogImg.height);
        base.ctx.drawImage(scene, 0, 0, base.w, base.h);
        fog.ctx.globalCompositeOperation = 'source-over';
        fog.ctx.clearRect(0, 0, fog.w, fog.h);
        fog.ctx.drawImage(fogImg, 0, 0, fog.w, fog.h);
      };
      build();
      dropC.onresize = build; // 마지막 캔버스가 리사이즈된 뒤에 다시 그리기
      const T = s.params({ rain: [s.large ? 6 : 3, 0, 30, 1, '빗방울/초'], refog: [0.5, 0, 3, 0.05, '다시 서리는 속도'] });
      const p = s.pointer();
      let lx = null, ly = null;
      const drops = [];
      const wipe = (x0, y0, x1, y1, r, a) => {
        const f = fog.ctx;
        f.globalCompositeOperation = 'destination-out';
        const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (r * 0.25)));
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
          const g = f.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
          f.fillStyle = g; f.fillRect(x - r, y - r, r * 2, r * 2);
        }
        f.globalCompositeOperation = 'source-over';
      };
      s.raf((dt, t) => {
        const W = fog.w, H = fog.h, m = Math.min(W, H);
        // 다시 서리기
        fog.ctx.globalAlpha = T.refog * dt;
        fog.ctx.drawImage(fogImg, 0, 0, W, H);
        fog.ctx.globalAlpha = 1;
        const g = p.idle ? Lab.ghost(t * 1.6, W, H) : p;
        if (lx !== null) wipe(lx, ly, g.x, g.y, m * 0.075, 0.5);
        lx = g.x; ly = g.y;
        // 빗방울
        if (Math.random() < dt * T.rain) drops.push({ x: U.rand(W), y: U.rand(-20, H * 0.6), r: U.rand(m * 0.008, m * 0.022), v: 0, stick: U.rand(0.3, 2) });
        const d = dropC.ctx;
        d.clearRect(0, 0, W, H);
        const dpr = dropC.dpr;
        for (let i = drops.length - 1; i >= 0; i--) {
          const q = drops[i];
          q.stick -= dt;
          if (q.stick < 0) { q.v = Math.min(q.v + dt * 260 * (q.r / (m * 0.02)), 220); q.y += q.v * dt; q.x += Math.sin(t * 3 + i) * 0.2; wipe(q.x, q.y - q.r, q.x, q.y, q.r * 0.6, 0.12); }
          if (q.y - q.r > H) { drops.splice(i, 1); continue; }
          d.save();
          d.beginPath(); d.arc(q.x, q.y, q.r, 0, U.TAU); d.clip();
          d.translate(q.x, q.y); d.scale(1, -1);
          const R = q.r * 6;
          d.drawImage(scene, (q.x - R) * dpr, (q.y - R) * dpr, R * 2 * dpr, R * 2 * dpr, -q.r, -q.r, q.r * 2, q.r * 2);
          d.restore();
          d.beginPath(); d.arc(q.x, q.y, q.r, 0, U.TAU);
          // 아래쪽은 어둡게, 위쪽 테두리는 밝게: 볼록한 물방울
          const rim = d.createLinearGradient(q.x, q.y - q.r, q.x, q.y + q.r);
          rim.addColorStop(0, 'rgba(255,255,255,.35)'); rim.addColorStop(0.5, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(0,0,0,.35)');
          d.strokeStyle = rim; d.lineWidth = Math.max(1, q.r * 0.16); d.stroke();
          d.beginPath(); d.arc(q.x - q.r * 0.3, q.y - q.r * 0.35, q.r * 0.22, 0, U.TAU); d.fillStyle = 'rgba(255,255,255,.75)'; d.fill();
        }
        if (drops.length > 120) drops.splice(0, drops.length - 120);
      });
    },
  });
})();
