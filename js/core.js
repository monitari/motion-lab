/* =========================================================
   MOTION LAB — core
   데모 등록 / 생명주기(Scope) / 공용 헬퍼
   ========================================================= */
(() => {
  'use strict';

  const Lab = (window.Lab = {
    demos: [],
    categories: [
      { id: 'cards',   label: 'Holo Cards',  color: '#ffcf5c' },
      { id: 'glass',   label: 'Glass',       color: '#9fe8ff' },
      { id: 'material', label: 'Material Studies', color: '#d8b17a' },
      { id: 'text',    label: 'Typography',  color: '#ff8ad8' },
      { id: 'canvas',  label: 'Generative',  color: '#8affc1' },
      { id: 'physics', label: 'Physics',     color: '#ffa36b' },
      { id: 'shader',  label: 'Shader',      color: '#b69cff' },
      { id: 'sound',   label: 'Sound',       color: '#f78fb3' },
      { id: 'ui',      label: 'Interaction', color: '#6bc6ff' },
      { id: 'modern',  label: 'Web Platform', color: '#7cffd4' },
    ],
  });

  /** 데모 등록. { id, title, cat, tags[], desc, hint, css, mount(el, s) } */
  Lab.register = (d) => Lab.demos.push(d);

  /* ---------- math utils ---------- */
  const U = (Lab.U = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    smooth: (e0, e1, x) => { const t = U.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); },
    /** 프레임레이트 독립 감쇠 계수 */
    damp: (k, dt) => 1 - Math.exp(-k * dt),
    /** 감쇠 스프링. st = {x, v} */
    spring: (st, target, dt, k = 170, c = 18) => {
      st.v += ((target - st.x) * k - st.v * c) * dt;
      st.x += st.v * dt;
      return st.x;
    },
    hsl: (h, s = 100, l = 60, a = 1) => `hsla(${h},${s}%,${l}%,${a})`,
    TAU: Math.PI * 2,
  });

  /* ---------- 폰 기울기 ----------
     터치 기기에서 화면을 만지지 않을 때는 기울기가 가상 커서가 된다.
     안드로이드는 바로 동작하고, iOS는 버튼을 눌러 권한을 받아야 한다. */
  Lab.tilt = { x: 0, y: 0, active: false, last: 0, needsPermission: false };
  const onOrient = (e) => {
    if (e.gamma == null || e.beta == null) return;
    const ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let gx = e.gamma, gy = e.beta - 40;
    if (ang === 90) { gx = e.beta; gy = -e.gamma - 40; } else if (ang === -90 || ang === 270) { gx = -e.beta; gy = e.gamma - 40; }
    const tx = U.clamp(gx / 28, -1, 1), ty = U.clamp(gy / 28, -1, 1);
    Lab.tilt.x += (tx - Lab.tilt.x) * 0.25; Lab.tilt.y += (ty - Lab.tilt.y) * 0.25;
    Lab.tilt.active = true; Lab.tilt.last = performance.now();
  };
  let tiltOn = false;
  Lab.tilt.enable = async () => {
    if (tiltOn) return true;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false;
      }
    } catch (_) { return false; }
    window.addEventListener('deviceorientation', onOrient);
    tiltOn = true;
    return true;
  };
  if (typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches) {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') Lab.tilt.needsPermission = true;
    else Lab.tilt.enable();
  }

  /** 사용자가 가만히 있을 때 미리보기용 가상 커서 경로 (폰을 기울이면 기울기를 따른다) */
  Lab.ghost = (t, w, h, seed = 0) => (Lab.tilt.active && performance.now() - Lab.tilt.last < 1500
    ? { x: w * (0.5 + Lab.tilt.x * 0.44), y: h * (0.5 + Lab.tilt.y * 0.44) }
    : {
    x: w * (0.5 + 0.3 * Math.sin(t * 0.63 + seed) + 0.06 * Math.sin(t * 1.9 + seed * 2)),
    y: h * (0.5 + 0.26 * Math.sin(t * 0.91 + 1.3 + seed) + 0.05 * Math.cos(t * 2.3)),
  });

  /** 오프스크린 캔버스 생성 */
  Lab.offscreen = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  };
  /** 다운스케일→업스케일 방식의 저렴한 블러 (모든 브라우저 지원) */
  Lab.blurCanvas = (src, factor = 10) => {
    const w = src.width, h = src.height;
    const a = Lab.offscreen(w / (factor / 2), h / (factor / 2));
    const b = Lab.offscreen(w / factor, h / factor);
    const out = Lab.offscreen(w, h);
    const ax = a.getContext('2d'), bx = b.getContext('2d'), ox = out.getContext('2d');
    ax.imageSmoothingQuality = bx.imageSmoothingQuality = ox.imageSmoothingQuality = 'high';
    ax.drawImage(src, 0, 0, a.width, a.height);
    bx.drawImage(a, 0, 0, b.width, b.height);
    ax.clearRect(0, 0, a.width, a.height);
    ax.drawImage(b, 0, 0, a.width, a.height);
    ox.drawImage(a, 0, 0, w, h);
    return out;
  };

  /* ---------- Improved Perlin noise (3D) ---------- */
  const perm = new Uint8Array(512);
  {
    const p = Array.from({ length: 256 }, (_, i) => i);
    let seed = 1337;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y, z) => {
    h &= 15;
    const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  };
  Lab.noise = (x, y = 0, z = 0) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    const L = U.lerp;
    return L(
      L(L(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
        L(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      L(L(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
        L(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w);
  };

  /* =========================================================
     Scope — 데모 하나의 생명주기. dispose() 한 번이면 전부 정리.
     ========================================================= */
  class Scope {
    constructor(el, large) {
      this.el = el;
      this.large = !!large;      // 전체화면 뷰어 여부
      this.dprCap = large ? 2 : 1.5;
      this._f = [];
      this.alive = true;
    }
    add(fn) { this._f.push(fn); return fn; }
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      this.add(() => target.removeEventListener(type, fn, opts));
      return fn;
    }
    /** fn(dt, t) 매 프레임. 루프 안에서 에러가 나면 멈추고 화면에 알린다 */
    raf(fn) {
      let id, last = performance.now(), alive = true;
      const tick = (now) => {
        if (!alive) return;
        // rAF 타임스탬프가 등록 시점보다 앞설 수 있어 음수 dt를 막는다
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
        last = now;
        try { fn(dt, now / 1000); }
        catch (err) { alive = false; this.fail(err); return; }
        id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      this.add(() => { alive = false; cancelAnimationFrame(id); });
    }
    /**
     * 고정 시간 간격 스텝. 화면 주사율과 상관없이 같은 속도로 시뮬레이션이 돈다.
     * const step = s.fixed(1 / 60, (h, t) => {...}); 그리고 raf 안에서 step(dt, t)
     */
    fixed(h, fn, maxSteps = 5) {
      let acc = 0;
      return (dt, t) => {
        acc += dt;
        let n = 0;
        while (acc >= h && n < maxSteps) { fn(h, t); acc -= h; n++; }
        if (n === maxSteps) acc = 0;
        return n;
      };
    }
    /**
     * 화면 아래쪽 모드 버튼 (터치에서도 오른쪽 클릭 같은 동작을 고를 수 있게).
     * 크게 열었을 때만 보이고, 썸네일에서는 값만 가진다.
     */
    modes(list, init = 0, onChange, pos = 'bottom') {
      const st = { i: init, set: (i) => { st.i = i; box && [...box.children].forEach((b, k) => b.classList.toggle('on', k === i)); onChange && onChange(i); } };
      let box = null;
      if (this.large) {
        box = this.html(`<div class="lab-modes ${pos}" role="toolbar">${list.map((m, i) => `<button type="button" class="${i === init ? 'on' : ''}">${m}</button>`).join('')}</div>`);
        this.on(box, 'pointerdown', (e) => e.stopPropagation());
        [...box.children].forEach((b, i) => this.on(b, 'click', () => st.set(i)));
      }
      return st;
    }

    /** 실행 중 에러를 데모 위에 표시 */
    fail(err) {
      console.error('[' + (this.demo ? this.demo.id : '?') + ']', err);
      Lab.errors.push((this.demo ? this.demo.id : '?') + ': ' + (err && err.message));
      if (!this.alive || this.el.querySelector('.lab-fallback')) return;
      this.el.insertAdjacentHTML('beforeend', `<div class="lab-fallback lab-error"><b>멈췄어요</b><small>${String((err && err.message) || err).replace(/</g, '&lt;').slice(0, 140)}</small></div>`);
    }
    timeout(fn, ms) { const id = setTimeout(fn, ms); this.add(() => clearTimeout(id)); return id; }
    interval(fn, ms) { const id = setInterval(fn, ms); this.add(() => clearInterval(id)); return id; }
    /** 크기 변화 감시. 즉시 1회 호출 */
    resize(target, cb) {
      let lw = -1, lh = -1;
      const run = () => {
        const w = target.clientWidth, h = target.clientHeight;
        if (w === lw && h === lh) return;
        lw = w; lh = h; cb(w, h);
      };
      const ro = new ResizeObserver(run);
      ro.observe(target);
      this.add(() => ro.disconnect());
      run();
    }
    html(str) { this.el.insertAdjacentHTML('beforeend', str); return this.el.lastElementChild; }
    $(sel) { return this.el.querySelector(sel); }
    $$(sel) { return [...this.el.querySelectorAll(sel)]; }

    /** DPR 대응 2D 캔버스. o.onresize(w,h)를 지정하면 크기 변화 때 호출 */
    canvas(opts = {}) {
      const parent = opts.parent || this.el;
      const cv = document.createElement('canvas');
      cv.className = 'lab-canvas';
      parent.appendChild(cv);
      const ctx = cv.getContext('2d', opts.ctx);
      const o = { cv, ctx, w: 0, h: 0, dpr: 1, onresize: null };
      const scale = opts.scale || 1;
      let first = true;
      this.resize(parent, (w, h) => {
        const dpr = Math.min(window.devicePixelRatio || 1, opts.dpr || this.dprCap) * scale;
        o.dpr = dpr; o.w = w; o.h = h;
        cv.width = Math.max(1, Math.round(w * dpr));
        cv.height = Math.max(1, Math.round(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!first && o.onresize) o.onresize(w, h);
        first = false;
      });
      return o;
    }

    /** 포인터 상태 (마우스/터치 공용) */
    pointer(target = this.el, opts = {}) {
      const p = {
        x: target.clientWidth / 2, y: target.clientHeight / 2, nx: 0.5, ny: 0.5,
        down: false, inside: false, last: -1e9, button: 0,
        ondown: null, onup: null, onmove: null,
        get idle() { return !this.down && (!this.inside || performance.now() - this.last > 2500); },
      };
      const upd = (e) => {
        const r = target.getBoundingClientRect();
        p.x = e.clientX - r.left; p.y = e.clientY - r.top;
        p.nx = p.x / r.width; p.ny = p.y / r.height;
        p.inside = true; p.last = performance.now();
      };
      this.on(target, 'pointermove', (e) => { upd(e); p.onmove && p.onmove(e); });
      this.on(target, 'pointerdown', (e) => {
        upd(e); p.down = true; p.button = e.button;
        if (opts.capture !== false && e.pointerType === 'mouse') { try { target.setPointerCapture(e.pointerId); } catch (_) {} }
        p.ondown && p.ondown(e);
      });
      const up = (e) => { if (!p.down) return; p.down = false; p.onup && p.onup(e); };
      this.on(target, 'pointerup', up);
      this.on(target, 'pointercancel', up);
      this.on(target, 'pointerleave', () => { p.inside = false; });
      this.on(target, 'contextmenu', (e) => opts.noMenu && e.preventDefault());
      return p;
    }

    /**
     * 풀스크린 프래그먼트 셰이더.
     * 유니폼: iTime, iRes(px), iMouse(px, 부드럽게), iDown(0..1), iClick(마지막 클릭 이후 초)
     */
    shader(frag, opts = {}) {
      const cv = document.createElement('canvas');
      cv.className = 'lab-canvas';
      this.el.appendChild(cv);
      const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
      if (!gl) { this.html('<div class="lab-fallback">WebGL을 사용할 수 없어요</div>'); return null; }
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
        'precision highp float;\nuniform float iTime;uniform vec2 iRes;uniform vec2 iMouse;uniform float iDown;uniform float iClick;\n' + frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = {};
      ['iTime', 'iRes', 'iMouse', 'iDown', 'iClick'].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));

      const res = (this.large ? 1 : 0.6) * (opts.scale || 1);
      let W = 1, H = 1, sc = 1;
      this.resize(this.el, (w, h) => {
        sc = Math.min(window.devicePixelRatio || 1, 1.5) * res;
        W = cv.width = Math.max(1, Math.round(w * sc));
        H = cv.height = Math.max(1, Math.round(h * sc));
        gl.viewport(0, 0, W, H);
      });
      const p = this.pointer();
      let mx = W / 2, my = H / 2, down = 0, click = 100;
      p.ondown = () => (click = 0);
      const t0 = performance.now() / 1000 - (opts.t0 || 0);
      this.raf((dt, t) => {
        let tx, ty;
        if (p.idle) { const g = Lab.ghost(t, this.el.clientWidth, this.el.clientHeight); tx = g.x; ty = g.y; }
        else { tx = p.x; ty = p.y; }
        const k = U.damp(6, dt);
        mx += (tx * sc - mx) * k; my += ((this.el.clientHeight - ty) * sc - my) * k;
        down += ((p.down ? 1 : 0) - down) * U.damp(8, dt);
        click += dt;
        gl.uniform1f(u.iTime, t - t0);
        gl.uniform2f(u.iRes, W, H);
        gl.uniform2f(u.iMouse, mx, my);
        gl.uniform1f(u.iDown, down);
        gl.uniform1f(u.iClick, click);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      this.add(() => { const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); });
      return gl;
    }

    /**
     * 뷰어의 Tweak 패널에 노출되는 실시간 파라미터.
     * spec = { key: [기본값, min, max, step, '라벨', restart?] }
     * 값은 데모별로 기억되고, restart가 true인 항목은 바꾸면 데모가 다시 마운트된다.
     */
    params(spec) {
      const id = this.demo ? this.demo.id : '_';
      const store = (Lab.paramStore[id] = Lab.paramStore[id] || {});
      const values = {};
      for (const k in spec) values[k] = k in store ? store[k] : spec[k][0];
      this._params = { spec, values, store };
      return values;
    }

    dispose() {
      this.alive = false;
      const f = this._f.reverse();
      this._f = [];
      for (const fn of f) { try { fn(); } catch (e) { console.warn(e); } }
    }
  }
  Lab.Scope = Scope;

  /** 데모를 el에 마운트하고 Scope 반환 */
  Lab.mount = (demo, el, large) => {
    const s = new Scope(el, large);
    s.demo = demo;
    el.classList.add('stage-' + demo.id);
    try { demo.mount(el, s); }
    catch (err) {
      console.error('[' + demo.id + ']', err);
      el.insertAdjacentHTML('beforeend', '<div class="lab-fallback">이 브라우저에서 실행할 수 없어요<br><small>' + String(err.message || err).slice(0, 120) + '</small></div>');
      Lab.errors.push(demo.id + ': ' + (err.message || err));
    }
    return s;
  };
  Lab.errors = [];
  Lab.paramStore = {};

  /** 전역 소리 스위치. 소리 내는 데모는 Lab.sound.on을 확인한다 */
  Lab.sound = { on: true };
  try { Lab.sound.on = localStorage.getItem('ml-sound') !== 'off'; } catch (_) {}
  /** 짧은 효과음. fn(audioContext, now) */
  Lab.sfx = (fn) => {
    if (!Lab.sound.on) return;
    try {
      const a = (Lab._ac = Lab._ac || new (window.AudioContext || window.webkitAudioContext)());
      if (a.state === 'suspended') a.resume();
      fn(a, a.currentTime);
    } catch (_) {}
  };
  /** 짧은 음 하나. type: sine | triangle | square | sawtooth */
  Lab.tone = (freq, { type = 'sine', dur = 0.4, gain = 0.2, at = 0 } = {}) => Lab.sfx((a, t0) => {
    const t = t0 + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  });
  /** 노이즈를 대역 필터에 통과시킨 타격음 (유리, 폭죽, 뽁뽁이 등) */
  Lab.burst = ({ dur = 0.2, freq = 1500, q = 1, gain = 0.5, at = 0, curve = 4 } = {}) => Lab.sfx((a, t) => {
    const buf = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * dur)), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, curve);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(a.destination); src.start(t + at);
  });

  /** 모든 데모 CSS를 한 번에 주입 */
  Lab.injectStyles = () => {
    const css = Lab.demos.filter((d) => d.css).map((d) => '/* ' + d.id + ' */\n' + d.css).join('\n');
    const st = document.createElement('style');
    st.id = 'demo-styles';
    st.textContent = css;
    document.head.appendChild(st);
  };
})();
