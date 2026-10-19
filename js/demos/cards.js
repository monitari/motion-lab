/* =========================================================
   HOLO CARDS — 포켓몬 카드풍 홀로그램 포일 효과
   (simeydotme/pokemon-cards-css 의 레이어/블렌드 기법을 참고해 직접 구현)
   ========================================================= */
(() => {
  const { U } = Lab;
  let uid = 0;

  /* ---------- 카드 일러스트 (오리지널 SVG 크리처) ---------- */
  const VARIANTS = {
    rainbow: {
      name: 'Voltail', hp: 120, type: '⚡', tc: 'linear-gradient(#ffe86b,#f5a800)', stage: 'BASIC',
      atk: [['⚡', 'Static Nuzzle', '20'], ['⚡⚡', 'Thunder Tail', '90']],
      flavor: '꼬리 끝에 모인 정전기로 밤하늘을 밝힌다.', no: '025/151',
      frame: 'linear-gradient(135deg,#fff6b8,#e2b53a 30%,#fff9d6 50%,#c99a22 75%,#fff1a0)',
      bg: ['#fff27a', '#ff8a2a', '#5a1a8c'], body: '#56c8ff', belly: '#e8f8ff', tip: '#ffd23f', cheek: '#ff7ab8',
      ears: 'fox', tail: 'bolt',
    },
    cosmos: {
      name: 'Nebulyx', hp: 150, type: '✦', tc: 'linear-gradient(#e6a6ff,#8b3dff)', stage: 'STAGE 1',
      atk: [['✦', 'Moon Gaze', '30'], ['✦✦✦', 'Galaxy Veil', '140']],
      flavor: '이마의 초승달이 차오를 때 별이 하나 태어난다.', no: '151/151',
      frame: 'linear-gradient(135deg,#d8e2ff,#8d9bd6 30%,#f2f5ff 50%,#7b88c9 75%,#e1e8ff)',
      bg: ['#5b2bbf', '#1b0b4a', '#04020f'], body: '#c7b8ff', belly: '#efe9ff', tip: '#6b3fd6', cheek: '#ff8ad8',
      ears: 'cat', tail: 'swirl', moon: true,
    },
    gold: {
      name: 'Aurumane', hp: 220, type: '♛', tc: 'linear-gradient(#fff1a8,#c8901a)', stage: 'SECRET RARE',
      atk: [['♛♛', 'Royal Roar', '100'], ['♛♛♛', 'Golden Age', '250']],
      flavor: '황금빛 갈기는 천 년에 한 번만 빛난다고 전해진다.', no: '172/151',
      frame: 'linear-gradient(135deg,#fff3b0,#b8860b 25%,#fff8d8 45%,#a0700a 70%,#ffe48a)',
      bg: ['#6b4a10', '#2a1a04', '#0d0802'], body: 'url(#gold-UID)', belly: '#fff2c0', tip: '#7a4e00', cheek: '#ffb347',
      ears: 'lion', tail: 'tuft', mane: true, gold: true,
    },
    prism: {
      name: 'Crystallis', hp: 180, type: '❄', tc: 'linear-gradient(#cff6ff,#38b6ff)', stage: 'PRISM ★',
      atk: [['❄', 'Diamond Dust', '40'], ['❄❄❄', 'Prism Lance', '180']],
      flavor: '몸을 통과한 햇빛은 일곱 갈래로 흩어진다.', no: '099/151',
      frame: 'linear-gradient(135deg,#e8fbff,#7fc8e8 30%,#ffffff 50%,#8ab4e8 75%,#e3f2ff)',
      bg: ['#7ee8ff', '#2a6fd6', '#120a3a'], body: '#bff3ff', belly: '#ffffff', tip: '#3a7bd5', cheek: '#ff9ad5',
      ears: 'crystal', tail: 'crystal', crystals: true,
    },
  };

  function art(v, id) {
    const c = VARIANTS[v];
    const g = (s) => s.replace(/UID/g, id);
    // deterministic stars
    let seed = v.length * 97;
    const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    let stars = '';
    const nStars = v === 'cosmos' ? 70 : v === 'prism' ? 26 : 18;
    for (let i = 0; i < nStars; i++) {
      stars += `<circle cx="${(r() * 300).toFixed(1)}" cy="${(r() * 420).toFixed(1)}" r="${(r() * 1.6 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.7 + 0.3).toFixed(2)}"/>`;
    }
    const ears = {
      fox: `<path d="M-50 -62 L-74 -150 L-10 -88Z" fill="${c.body}"/><path d="M-64 -118 L-74 -150 L-52 -126Z" fill="${c.tip}"/>
            <path d="M50 -62 L74 -150 L10 -88Z" fill="${c.body}"/><path d="M64 -118 L74 -150 L52 -126Z" fill="${c.tip}"/>`,
      cat: `<path d="M-56 -50 Q-70 -130 -60 -128 Q-30 -112 -14 -92Z" fill="${c.body}"/><path d="M-54 -78 Q-60 -116 -56 -114 Q-38 -104 -30 -90Z" fill="${c.tip}" opacity=".7"/>
            <path d="M56 -50 Q70 -130 60 -128 Q30 -112 14 -92Z" fill="${c.body}"/><path d="M54 -78 Q60 -116 56 -114 Q38 -104 30 -90Z" fill="${c.tip}" opacity=".7"/>`,
      lion: `<circle cx="-44" cy="-86" r="18" fill="${c.body}"/><circle cx="-44" cy="-86" r="9" fill="${c.tip}"/>
             <circle cx="44" cy="-86" r="18" fill="${c.body}"/><circle cx="44" cy="-86" r="9" fill="${c.tip}"/>`,
      crystal: `<path d="M-40 -80 L-62 -168 L-24 -96Z" fill="#e8fdff" stroke="#7fd7ff" stroke-width="2"/><path d="M-46 -90 L-60 -150 L-36 -100Z" fill="#9be7ff"/>
                <path d="M40 -80 L62 -168 L24 -96Z" fill="#e8fdff" stroke="#7fd7ff" stroke-width="2"/><path d="M46 -90 L60 -150 L36 -100Z" fill="#9be7ff"/>
                <path d="M0 -96 L-10 -150 L0 -170 L10 -150Z" fill="#ffffff" stroke="#7fd7ff" stroke-width="2"/>`,
    }[c.ears];
    const tail = {
      bolt: `<path d="M40 70 L118 30 L100 4 L150 -44 L128 -52 L162 -112 L84 -42 L106 -32 L46 32Z" fill="${c.body}" stroke="${c.tip}" stroke-width="4" stroke-linejoin="round"/>`,
      swirl: `<path d="M44 70 C120 80 150 10 120 -30 C100 -60 60 -40 80 -16 C96 4 120 -14 108 -30" fill="none" stroke="${c.body}" stroke-width="18" stroke-linecap="round"/>
              <circle cx="108" cy="-30" r="9" fill="#fff6a8"/>`,
      tuft: `<path d="M40 80 C110 90 130 30 120 -10" fill="none" stroke="${c.body}" stroke-width="12" stroke-linecap="round"/>
             <path d="M120 -10 l-18 -22 l14 4 l2 -24 l10 18 l12 -16 l-2 26 l14 -6Z" fill="#ffcc4d" stroke="#8a5a00" stroke-width="2"/>`,
      crystal: `<path d="M40 70 L120 40 L150 -40 L110 -10 L140 -90 L90 0 L60 30Z" fill="#dffaff" stroke="#6fc8ff" stroke-width="3" stroke-linejoin="round"/>`,
    }[c.tail];

    const bgExtra = {
      rainbow: `<g opacity=".35" fill="#fff">${Array.from({ length: 16 }, (_, i) => `<path d="M150 230 L${150 + Math.cos(i / 16 * U.TAU) * 400} ${230 + Math.sin(i / 16 * U.TAU) * 400} L${150 + Math.cos((i + .45) / 16 * U.TAU) * 400} ${230 + Math.sin((i + .45) / 16 * U.TAU) * 400}Z"/>`).join('')}</g>
        <path d="M30 60 l20 30 -12 2 18 36 -32 -40 12 -2 -16 -26Z" fill="#fff8b0"/><path d="M262 300 l18 26 -10 2 14 30 -28 -34 10 -2 -14 -22Z" fill="#fff8b0"/>`,
      cosmos: `<ellipse cx="80" cy="120" rx="120" ry="60" fill="#ff5fd2" opacity=".35" filter="url(#blur-${id})"/>
        <ellipse cx="230" cy="300" rx="130" ry="70" fill="#3ad4ff" opacity=".3" filter="url(#blur-${id})"/>
        <circle cx="240" cy="90" r="34" fill="#fff4c4"/><circle cx="254" cy="80" r="30" fill="${c.bg[1]}"/>`,
      gold: `<g opacity=".5">${Array.from({ length: 24 }, (_, i) => `<path d="M150 230 L${150 + Math.cos(i / 24 * U.TAU) * 420} ${230 + Math.sin(i / 24 * U.TAU) * 420} L${150 + Math.cos((i + .5) / 24 * U.TAU) * 420} ${230 + Math.sin((i + .5) / 24 * U.TAU) * 420}Z" fill="url(#gold-${id})"/>`).join('')}</g>`,
      prism: `<g opacity=".75">
        <path d="M20 380 L60 250 L90 390Z" fill="#c9f6ff"/><path d="M60 250 L90 390 L110 300Z" fill="#7fd3ff"/>
        <path d="M230 400 L260 270 L300 400Z" fill="#d8f8ff"/><path d="M260 270 L300 400 L300 320Z" fill="#8cc7ff"/>
        <path d="M200 60 L230 10 L250 80Z" fill="#ffffff" opacity=".6"/><path d="M40 90 L60 40 L80 100Z" fill="#ffffff" opacity=".5"/></g>`,
    }[v];

    return g(`<svg class="hc-art" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="bg-UID" cx="50%" cy="55%" r="75%"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset=".5" stop-color="${c.bg[1]}"/><stop offset="1" stop-color="${c.bg[2]}"/></radialGradient>
        <linearGradient id="gold-UID" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4b8"/><stop offset=".35" stop-color="#e3a91f"/><stop offset=".6" stop-color="#fff0a6"/><stop offset="1" stop-color="#a86d00"/></linearGradient>
        <filter id="blur-UID"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      <rect width="300" height="420" fill="url(#bg-UID)"/>
      ${stars}${bgExtra}
      <g transform="translate(150 262)">
        <ellipse cx="0" cy="118" rx="80" ry="12" fill="#000" opacity=".25"/>
        ${tail}
        ${c.mane ? `<g fill="#ffcc4d" stroke="#8a5a00" stroke-width="2">${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * U.TAU; return `<path d="M${Math.cos(a) * 50} ${-40 + Math.sin(a) * 50} L${Math.cos(a + .22) * 92} ${-40 + Math.sin(a + .22) * 92} L${Math.cos(a + .45) * 50} ${-40 + Math.sin(a + .45) * 50}Z"/>`; }).join('')}</g>` : ''}
        <ellipse cx="0" cy="44" rx="58" ry="64" fill="${c.body}"/>
        <ellipse cx="0" cy="58" rx="34" ry="40" fill="${c.belly}" opacity=".9"/>
        ${ears}
        <circle cx="0" cy="-40" r="60" fill="${c.body}"/>
        ${c.moon ? '<path d="M-10 -92 A18 18 0 1 0 12 -66 A14 14 0 1 1 -10 -92Z" fill="#fff6a8"/>' : ''}
        ${c.crystals ? '<path d="M-60 10 L-86 -10 L-64 30Z M60 10 L86 -10 L64 30Z" fill="#e8fdff" stroke="#7fd7ff" stroke-width="2"/>' : ''}
        <ellipse cx="-23" cy="-44" rx="10" ry="13" fill="#1b1230"/><circle cx="-19" cy="-50" r="4" fill="#fff"/><circle cx="-26" cy="-38" r="2" fill="#fff" opacity=".7"/>
        <ellipse cx="23" cy="-44" rx="10" ry="13" fill="#1b1230"/><circle cx="27" cy="-50" r="4" fill="#fff"/><circle cx="20" cy="-38" r="2" fill="#fff" opacity=".7"/>
        <circle cx="-42" cy="-20" r="10" fill="${c.cheek}" opacity=".85"/><circle cx="42" cy="-20" r="10" fill="${c.cheek}" opacity=".85"/>
        <path d="M-9 -22 Q0 -13 9 -22" stroke="#1b1230" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="-30" cy="104" rx="20" ry="11" fill="${c.body}" stroke="#0002" stroke-width="2"/><ellipse cx="30" cy="104" rx="20" ry="11" fill="${c.body}" stroke="#0002" stroke-width="2"/>
      </g>
    </svg>`);
  }

  function face(v) {
    const c = VARIANTS[v], id = 'hc' + uid++;
    return `<div class="hc-face" style="--frame:${c.frame};--tc:${c.tc}">
      <div class="hc-in">
        ${art(v, id)}
        <div class="hc-top"><span class="hc-stage">${c.stage}</span><b class="hc-name">${c.name}</b><span class="hc-hp">HP<b>${c.hp}</b></span><i class="hc-type">${c.type}</i></div>
        <div class="hc-bot">
          ${c.atk.map(([cost, n, d]) => `<div class="hc-atk"><span class="hc-cost">${[...cost].map((x) => `<i>${x}</i>`).join('')}</span><b>${n}</b><span class="hc-dmg">${d}</span></div>`).join('')}
          <div class="hc-wrr"><span>weakness <i>◆</i>×2</span><span>resistance <i>●</i>-30</span><span>retreat <i>○</i><i>○</i></span></div>
          <p class="hc-flv">${c.flavor}</p>
          <div class="hc-foot"><span>Illus. Motion Lab</span><span>${c.no} ✦</span></div>
        </div>
      </div>
    </div>`;
  }

  const back = () => `<div class="hc-backface">
      <div class="hc-orb"><span></span></div>
      <div class="hc-backtitle">MOTION<br>LAB</div>
    </div>`;

  const cardHTML = (v, extra = '') => `<div class="hc hc--${v}" ${extra}>
      <div class="hc-side hc-front">${face(v)}<div class="hc-shine"></div><div class="hc-glare"></div></div>
      <div class="hc-side hc-back">${back()}<div class="hc-glare"></div></div>
    </div>`;

  /** 카드 셰이더 변수 갱신 (tx,ty: 0..1, o: 효과 강도) */
  function setVars(card, tx, ty, o, rx, ry) {
    const st = card.style;
    st.setProperty('--px', (tx * 100).toFixed(2) + '%');
    st.setProperty('--py', (ty * 100).toFixed(2) + '%');
    st.setProperty('--bx', (37 + tx * 26).toFixed(2) + '%');
    st.setProperty('--by', (33 + ty * 34).toFixed(2) + '%');
    st.setProperty('--gx', ((tx - 0.5) * 1.2).toFixed(3) + 'em');
    st.setProperty('--gy', ((ty - 0.5) * 1.2).toFixed(3) + 'em');
    st.setProperty('--hyp', U.clamp(Math.hypot(tx - 0.5, ty - 0.5) * 2, 0, 1).toFixed(3));
    st.setProperty('--o', o.toFixed(3));
    if (rx !== undefined) {
      st.setProperty('--rx', rx.toFixed(2) + 'deg');
      st.setProperty('--ry', ry.toFixed(2) + 'deg');
    }
  }

  /* ---------- 단일 카드 데모 마운트 ---------- */
  function mountSingle(v) {
    return (el, s) => {
      const scene = s.html(`<div class="hc-scene hc-scene--${v}">
        <div class="hc-halo"></div>
        <div class="hc-shadow"></div>
        ${cardHTML(v)}
        <div class="hc-tip">CLICK TO FLIP</div>
      </div>`);
      const card = scene.querySelector('.hc');
      const shadow = scene.querySelector('.hc-shadow');
      const p = s.pointer(scene);
      const RX = { x: 0, v: 0 }, RY = { x: 0, v: 0 }, PX = { x: 0.5, v: 0 }, PY = { x: 0.5, v: 0 }, FL = { x: 0, v: 0 }, SC = { x: 1, v: 0 };
      let o = 0, flip = 0;
      p.ondown = () => { flip = flip ? 0 : 180; };
      s.raf((dt, t) => {
        let tx, ty, to;
        const cw = card.offsetWidth, ch = card.offsetHeight;
        const sw = scene.clientWidth, sh = scene.clientHeight;
        if (!p.idle) {
          tx = U.clamp((p.x - (sw - cw) / 2) / cw, 0, 1);
          ty = U.clamp((p.y - (sh - ch) / 2) / ch, 0, 1);
          to = 1;
        } else {
          tx = 0.5 + 0.38 * Math.sin(t * 0.9);
          ty = 0.5 + 0.32 * Math.sin(t * 1.27 + 1);
          to = 0.7;
        }
        U.spring(PX, tx, dt, 120, 16); U.spring(PY, ty, dt, 120, 16);
        U.spring(RX, (0.5 - ty) * 32, dt, 140, 14);
        U.spring(RY, (tx - 0.5) * 34, dt, 140, 14);
        U.spring(FL, flip, dt, 90, 12);
        // 누르는 순간 살짝 눌렸다가 뒤집힌다
        U.spring(SC, p.down ? 0.97 : p.idle ? 1 : 1.04, dt, p.down ? 400 : 160, 14);
        o += (to - o) * U.damp(5, dt);
        setVars(card, PX.x, PY.x, o, RX.x, RY.x + FL.x);
        card.style.setProperty('--s', SC.x.toFixed(4));
        // 바닥 그림자는 기울기 반대로 밀리고, 카드가 들리면 퍼진다
        const lift = (SC.x - 1) * 25;
        shadow.style.transform = `translate(${-RY.x * 0.9}px,${RX.x * 0.5 + lift * 6}px) scale(${1 + lift * 0.25},${1 + lift * 0.1})`;
        shadow.style.opacity = (0.75 - lift * 0.25).toFixed(3);
      });
    };
  }

  /* ---------- 공용 CSS ---------- */
  const CSS = `
  .hc-scene{position:absolute;inset:0;display:grid;place-items:center;perspective:1100px;overflow:hidden;
    background:radial-gradient(ellipse 80% 70% at 50% 45%,var(--sc1),var(--sc2) 55%,#07070d)}
  .hc-scene--rainbow{--sc1:#4a2a7a;--sc2:#1a0f33}
  .hc-scene--cosmos{--sc1:#2a2f7a;--sc2:#0d0f2e}
  .hc-scene--gold{--sc1:#5a3d0f;--sc2:#1c1306}
  .hc-scene--prism{--sc1:#145a7a;--sc2:#071e33}
  .hc-halo{position:absolute;width:90cqmin;height:90cqmin;border-radius:50%;filter:blur(8cqmin);opacity:.55;
    background:conic-gradient(from 0deg,#ff5f8f,#ffd36b,#6bffb8,#6bc6ff,#b36bff,#ff5f8f);animation:hc-spin 12s linear infinite}
  @keyframes hc-spin{to{transform:rotate(1turn)}}
  .hc-tip{position:absolute;bottom:2.6cqmin;left:0;right:0;text-align:center;font:600 2.6cqmin/1 'JetBrains Mono',monospace;color:#fff8;letter-spacing:.1em;pointer-events:none}
  .hc{--ch:80cqmin;--px:50%;--py:50%;--bx:50%;--by:50%;--gx:0em;--gy:0em;--hyp:0;--o:0;--rx:0deg;--ry:0deg;--s:1;
    position:relative;height:var(--ch);width:calc(var(--ch)*.716);border-radius:calc(var(--ch)*.045);
    transform-style:preserve-3d;transform:scale(var(--s)) rotateX(var(--rx)) rotateY(var(--ry));
    font-size:calc(var(--ch)*.036);will-change:transform;cursor:pointer}
  .hc-side{position:absolute;inset:0;border-radius:inherit;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;
    box-shadow:0 0 0 1px #fff3, 0 calc(var(--ch)*.04) calc(var(--ch)*.08) -.2em #000c}
  .hc-back{transform:rotateY(180deg)}
  .hc-face{position:absolute;inset:0;padding:calc(var(--ch)*.024);background:var(--frame);border-radius:inherit}
  .hc-in{position:relative;height:100%;border-radius:calc(var(--ch)*.03);overflow:hidden;color:#fff;font-family:'Space Grotesk',system-ui,sans-serif;background:#111}
  .hc-art{position:absolute;inset:0;width:100%;height:100%;display:block}
  .hc-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:.4em;padding:.6em .7em 1.2em;background:linear-gradient(#000a,#0000)}
  .hc-stage{font-size:.5em;font-weight:700;padding:.2em .6em;border-radius:1em;background:linear-gradient(#fafafa,#a8a8a8);color:#222;letter-spacing:.06em;white-space:nowrap}
  .hc-name{font-size:1.15em;font-weight:700;flex:1;text-shadow:0 .08em .15em #000c;letter-spacing:-.01em}
  .hc-hp{font-size:.55em;font-weight:700;display:flex;align-items:baseline;gap:.15em}
  .hc-hp b{font-size:2em;text-shadow:0 .05em .1em #000a}
  .hc-type,.hc-cost i{width:1.4em;height:1.4em;border-radius:50%;display:inline-grid;place-items:center;font-style:normal;font-size:.75em;
    background:var(--tc);color:#2a1a00;box-shadow:inset 0 -.12em .2em #0005,0 .05em .15em #0008}
  .hc-bot{position:absolute;left:.5em;right:.5em;bottom:.5em;padding:.55em .65em .4em;border-radius:.55em;
    background:linear-gradient(#0009,#000c);border:1px solid #fff2}
  .hc-atk{display:flex;align-items:center;gap:.5em;padding:.18em 0;border-bottom:1px solid #fff1}
  .hc-cost{display:flex;gap:.1em;min-width:3.1em}
  .hc-atk b{flex:1;font-size:.82em}
  .hc-dmg{font-size:1.05em;font-weight:700}
  .hc-wrr{display:flex;justify-content:space-between;margin-top:.45em;font-size:.42em;text-transform:uppercase;letter-spacing:.04em;opacity:.8}
  .hc-wrr i{font-style:normal;margin:0 .15em;color:#ffd84d}
  .hc-shadow{position:absolute;left:50%;top:50%;width:52cqmin;height:9cqmin;margin:37cqmin 0 0 -26cqmin;border-radius:50%;background:radial-gradient(closest-side,#000d,#0000);filter:blur(1.4cqmin);pointer-events:none}
  .hc-flv{margin:.4em 0 .3em;font-size:.48em;line-height:1.35;opacity:.75;font-style:italic}
  .hc-foot{display:flex;justify-content:space-between;font-size:.4em;opacity:.6;font-family:'JetBrains Mono',monospace}
  .hc-shine,.hc-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
  .hc-glare{background-image:radial-gradient(farthest-corner circle at var(--px) var(--py),hsla(0,0%,100%,.8) 10%,hsla(0,0%,100%,.55) 20%,hsla(0,0%,0%,.5) 90%);
    mix-blend-mode:overlay;opacity:calc(var(--o)*.75)}
  .hc-shine{mix-blend-mode:color-dodge;opacity:calc(.35 + var(--o)*.65)}

  /* Rainbow holo — 회절 무지개 줄무늬 */
  .hc--rainbow .hc-shine{--sp:5%;
    background-image:
      repeating-linear-gradient(0deg,hsl(2,100%,73%) calc(var(--sp)*1),hsl(53,100%,69%) calc(var(--sp)*2),hsl(93,100%,69%) calc(var(--sp)*3),hsl(176,100%,76%) calc(var(--sp)*4),hsl(228,100%,74%) calc(var(--sp)*5),hsl(283,100%,73%) calc(var(--sp)*6),hsl(2,100%,73%) calc(var(--sp)*7)),
      repeating-linear-gradient(133deg,#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,29%,66%) 4.5%,hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12%),
      radial-gradient(farthest-corner circle at var(--px) var(--py),hsla(0,0%,0%,.1) 12%,hsla(0,0%,0%,.15) 20%,hsla(0,0%,0%,.25) 120%);
    background-blend-mode:exclusion,hue,hard-light;
    background-size:200% 700%,300% 300%,200% 200%;
    background-position:0% var(--by),var(--bx) var(--by),var(--bx) var(--by);
    filter:brightness(.85) contrast(2.6) saturate(.7)}

  /* Cosmos holo — 은하 + 글리터 */
  .hc--cosmos .hc-shine{
    background-image:
      radial-gradient(circle at 30% 40%,#fff 0 .06em,#0000 .12em),
      radial-gradient(circle at 70% 70%,#fff 0 .05em,#0000 .1em),
      radial-gradient(circle at 50% 50%,hsl(290 100% 62%),#0000 38%),
      radial-gradient(circle at 25% 75%,hsl(190 100% 58%),#0000 34%),
      radial-gradient(circle at 78% 22%,hsl(335 100% 62%),#0000 34%),
      linear-gradient(125deg,hsl(0 90% 55%),hsl(50 90% 55%),hsl(120 90% 50%),hsl(190 90% 55%),hsl(250 90% 60%),hsl(310 90% 58%),hsl(360 90% 55%));
    background-size:1.7em 1.9em,2.3em 2.1em,170% 170%,150% 150%,160% 160%,300% 300%;
    background-position:var(--gx) var(--gy),calc(var(--gx)*-1.6) calc(var(--gy)*-1.6),var(--bx) var(--by),calc(100% - var(--bx)) var(--by),var(--by) var(--bx),var(--bx) var(--by);
    background-blend-mode:screen,screen,screen,screen,screen,normal;
    filter:brightness(.62) contrast(1.6) saturate(1.3)}

  /* Gold secret rare — 금박 글리터 + 쉰 */
  .hc--gold .hc-shine{
    background-image:
      radial-gradient(circle,#fff 0 .04em,#0000 .09em),
      radial-gradient(circle,#ffe7a0 0 .05em,#0000 .11em),
      linear-gradient(115deg,#0000 20%,hsl(45 100% 70% / 0) calc(var(--px) - 22%),hsl(48 100% 82%) var(--px),hsl(45 100% 70% / 0) calc(var(--px) + 22%),#0000 80%),
      repeating-linear-gradient(55deg,hsl(38 70% 30%) 0 3%,hsl(50 95% 62%) 5%,hsl(38 70% 30%) 8%);
    background-size:.42em .42em,.66em .78em,100% 100%,400% 400%;
    background-position:var(--gx) var(--gy),calc(var(--gx)*-1) var(--gy),center,var(--bx) var(--by);
    background-blend-mode:screen,screen,screen,normal;
    filter:brightness(.7) contrast(1.6) saturate(1.2)}

  /* Prism — 다이아몬드 격자 + 원뿔 무지개 */
  .hc--prism .hc-shine{
    background-image:
      repeating-linear-gradient(60deg,#0000 0 1.15em,#fff6 1.2em,#0000 1.3em),
      repeating-linear-gradient(-60deg,#0000 0 1.15em,#fff6 1.2em,#0000 1.3em),
      repeating-linear-gradient(0deg,#0000 0 1.15em,#fff4 1.2em,#0000 1.3em),
      repeating-conic-gradient(from calc(var(--hyp)*240deg) at var(--px) var(--py),hsl(0 100% 62%) 0deg,hsl(60 100% 62%) 9deg,hsl(120 100% 58%) 18deg,hsl(180 100% 62%) 27deg,hsl(240 100% 66%) 36deg,hsl(300 100% 64%) 45deg,hsl(360 100% 62%) 54deg);
    background-position:var(--gx) var(--gy),var(--gx) var(--gy),0 var(--gy),center;
    background-blend-mode:overlay,overlay,overlay,normal;
    filter:brightness(.62) contrast(1.5) saturate(1.1)}

  .hc-backface{position:absolute;inset:0;display:grid;place-items:center;
    background:radial-gradient(circle at 50% 50%,#3d6bff,#1a2a8a 45%,#0b1240 80%);
    border:calc(var(--ch)*.03) solid #1d2f7c;border-radius:inherit}
  .hc-backface::before{content:'';position:absolute;inset:0;opacity:.35;
    background:repeating-conic-gradient(from 0deg at 50% 50%,#fff2 0 6deg,#0000 6deg 12deg)}
  .hc-orb{position:relative;width:46%;aspect-ratio:1;border-radius:50%;background:linear-gradient(#ff5161 0 47%,#1b1b2a 47% 53%,#f4f4f4 53%);
    box-shadow:0 0 0 .3em #1b1b2a,0 0 2em #6bc6ff88}
  .hc-orb span{position:absolute;inset:36%;border-radius:50%;background:#f4f4f4;box-shadow:0 0 0 .35em #1b1b2a}
  .hc-backtitle{position:absolute;bottom:11%;font:700 1.25em/1 'Space Grotesk';letter-spacing:.3em;text-align:center;color:#ffd84d;text-shadow:0 .1em 0 #a04a00}
  `;

  Lab.holo = { cardHTML, setVars };

  const TITLES = { rainbow: 'Rainbow Holo', cosmos: 'Cosmos Holo', gold: 'Gold Secret Rare', prism: 'Prism Crystal' };
  Object.keys(TITLES).forEach((v, i) => {
    Lab.register({
      id: 'holo-' + v, cat: 'cards', title: TITLES[v],
      tags: ['3D tilt', 'blend-mode', 'mouse'],
      css: i === 0 ? CSS : '',
      mount: mountSingle(v),
    });
  });

  /* ---------- 카드 팬 / 덱 ---------- */
  Lab.register({
    id: 'card-fan', cat: 'cards', title: 'Card Fan', tags: ['3D', 'spring', 'mouse'],
    css: `
    .cf-scene{position:absolute;inset:0;overflow:hidden;perspective:1200px;background:radial-gradient(ellipse at 50% 120%,#3a2160,#120a22 60%,#07060d)}
    .cf-scene::before{content:'';position:absolute;inset:auto 0 0;height:40%;background:linear-gradient(transparent,#0006)}
    .cf-card{position:absolute;left:50%;top:56%;transform-style:preserve-3d}
    .cf-card .hc{--ch:56cqmin;cursor:pointer}
    `,
    mount(el, s) {
      const vs = ['cosmos', 'rainbow', 'gold', 'prism', 'rainbow'];
      const scene = s.html(`<div class="cf-scene">${vs.map((v) => `<div class="cf-card">${cardHTML(v)}</div>`).join('')}</div>`);
      const wraps = [...scene.querySelectorAll('.cf-card')];
      const n = wraps.length;
      const st = wraps.map(() => ({ lift: { x: 0, v: 0 }, ang: { x: 0, v: 0 }, flip: { x: 180, v: 0 }, flipT: 0, spread: { x: 0, v: 0 } }));
      const p = s.pointer(scene);
      let hover = -1;
      wraps.forEach((w, i) => {
        s.on(w, 'pointerenter', () => (hover = i));
        s.on(w, 'pointerleave', () => { if (hover === i) hover = -1; });
        s.on(w, 'click', () => (st[i].flipT = st[i].flipT ? 0 : 180));
      });
      // 처음엔 뒷면 → 순서대로 앞면 공개
      st.forEach((c, i) => s.timeout(() => (c.flipT = 0), 500 + i * 180));
      s.raf((dt, t) => {
        const idle = p.idle;
        const h = idle ? Math.round((Math.sin(t * 0.7) * 0.5 + 0.5) * (n - 1)) : hover;
        const spreadT = idle ? 0.75 : 1;
        const W = scene.clientWidth, H = scene.clientHeight;
        const cw = wraps[0].firstElementChild.offsetWidth, ch = wraps[0].firstElementChild.offsetHeight;
        wraps.forEach((w, i) => {
          const c = st[i];
          const k = i - (n - 1) / 2;
          U.spring(c.spread, spreadT, dt, 80, 12);
          U.spring(c.lift, i === h ? 1 : 0, dt, 200, 16);
          U.spring(c.flip, c.flipT, dt, 110, 13);
          const ang = k * 11 * c.spread.x;
          const x = k * cw * 0.42 * c.spread.x;
          const y = Math.abs(k) * k * 0 + Math.abs(k) * ch * 0.06 - c.lift.x * ch * 0.16;
          w.style.transform = `translate(${x - cw / 2}px, ${y - ch / 2}px) rotate(${ang * (1 - c.lift.x * 0.6)}deg) translateZ(${c.lift.x * 60}px)`;
          w.style.zIndex = i === h ? 50 : 10 + i;
          const card = w.firstElementChild;
          // 커서 위치를 카드 로컬 좌표로 근사
          const r = w.getBoundingClientRect(), sr = scene.getBoundingClientRect();
          let tx, ty;
          if (idle) { tx = 0.5 + 0.4 * Math.sin(t * 1.1 + i); ty = 0.5 + 0.3 * Math.cos(t * 0.8 + i); }
          else { tx = U.clamp((p.x - (r.left - sr.left)) / r.width, 0, 1); ty = U.clamp((p.y - (r.top - sr.top)) / r.height, 0, 1); }
          const tilt = c.lift.x;
          setVars(card, tx, ty, 0.35 + tilt * 0.65, (0.5 - ty) * 22 * tilt, (tx - 0.5) * 24 * tilt + c.flip.x);
        });
      });
    },
  });
})();
