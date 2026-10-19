// Dependency-free Chromium smoke checks. Run: node tests/browser-smoke.cjs
const { spawn } = require('node:child_process');
const { mkdtempSync, existsSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

const executable = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
assert(executable, 'Set CHROME_PATH to a Chromium executable.');
const output = mkdtempSync(join(tmpdir(), 'motion-lab-check-'));
const chrome = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${join(output, 'profile')}`, 'about:blank'], { windowsHide: true });
let socket;
let phase = 'launch';
const watchdog = setTimeout(() => {
  console.error('Browser checks timed out at: ' + phase);
  chrome.kill(); if (socket) socket.close(); process.exitCode = 1;
}, 60000);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error('Chromium startup timed out: ' + log)), 15000);
    chrome.on('error', reject);
    chrome.stderr.on('data', (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolveEndpoint(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  phase = 'connect';
  await new Promise((r, j) => { socket.onopen = r; socket.onerror = j; });
  let seq = 0;
  const pending = new Map(), exceptions = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const task = pending.get(message.id);
      if (!task) return;
      pending.delete(message.id);
      message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolveCommand, reject) => {
    phase = method;
    const id = ++seq;
    pending.set(id, { resolve: resolveCommand, reject });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => send(method, params, sessionId);
  await cdp('Page.enable'); await cdp('Runtime.enable');
  const evaluate = async (expression) => {
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(50);
    }
    throw new Error('Timed out: ' + expression);
  };
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const search = (value) => evaluate(`document.querySelector('#q').value=${JSON.stringify(value)}; document.querySelector('#q').dispatchEvent(new Event('input'))`);
  const check = async (name, expression) => { assert(await evaluate(expression), name); console.log('PASS ' + name); };
  const url = pathToFileURL(resolve(__dirname, '../index.html')).href;
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Page.navigate', { url });
  await waitFor('!!window.LabApp');
  await check('initial gallery and fixed hero', `LabApp.tiles.length === Lab.demos.length && Lab.demos.length > 70 && document.querySelector('#heroTitle').textContent === Lab.demos.find(d=>d.id==='liquid-lens').title`);
  await click('[data-cat="physics"]');
  await check('category filters visible tiles', `LabApp.tiles.filter(t=>!t.hidden).every(t=>t._demo.cat==='physics') && document.querySelector('[data-cat="physics"]').getAttribute('aria-pressed')==='true'`);
  await search('lizard');
  await check('category and search intersect', `LabApp.tiles.filter(t=>!t.hidden).length===1 && LabApp.tiles.find(t=>!t.hidden)._demo.id==='lizard'`);
  await search('no-such-motion-demo');
  await check('empty results disable random', `!document.querySelector('.empty').hidden && document.querySelector('#random').disabled`);
  await click('#emptyReset');
  await check('reset restores entire gallery', `LabApp.tiles.every(t=>!t.hidden) && document.activeElement.id==='q'`);
  await click('[data-cat="featured"]');
  await check('curated collection', `LabApp.tiles.filter(t=>!t.hidden).length===6`);
  await evaluate(`scrollTo(0,500); var opener=document.querySelector('.tile:not([hidden]) .tile-open'); opener.focus({preventScroll:true}); opener.click()`);
  await check('viewer semantics and background isolation', `!document.querySelector('#viewer').hidden && document.querySelector('#viewer').getAttribute('role')==='dialog' && document.querySelector('#sections').inert && location.hash.startsWith('#/')`);
  await click('#vnext');
  await check('next stays within filtered results', `LabApp.tiles.filter(t=>!t.hidden).some(t=>'#/'+t._demo.id===location.hash)`);
  await evaluate('history.back()');
  await waitFor(`document.querySelector('#viewer').hidden`);
  await check('back restores gallery and focus', `!document.querySelector('#sections').inert && !location.hash.startsWith('#/') && document.activeElement.classList.contains('tile-open') && Math.abs(scrollY-500)<2`);
  await evaluate('history.forward()');
  await waitFor(`!document.querySelector('#viewer').hidden`);
  await click('#vclose');
  await waitFor(`document.querySelector('#viewer').hidden`);
  console.log('PASS forward and close restore gallery');
  await click('#clearFilters');
  await evaluate('scrollTo(0,0)');
  const screenshot = async (name) => {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
    const path = join(output, name + '.png'); writeFileSync(path, Buffer.from(data, 'base64')); console.log('SCREENSHOT ' + path);
  };
  await delay(300); await screenshot('desktop');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await cdp('Page.navigate', { url }); await waitFor('!!window.LabApp');
  await check('mobile defaults to manual preview', `document.querySelector('#mode').getAttribute('aria-pressed')==='false'`);
  await check('mobile page does not overflow', `document.documentElement.scrollWidth<=innerWidth`);
  await click('[data-cat="featured"]');
  await evaluate(`document.querySelector('.tile:not([hidden]) .tile-stage').click()`);
  await check('tap opens viewer with large controls', `!document.querySelector('#viewer').hidden && ['vclose','vshare','vsrc','vtweak'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.height>=44 && r.width>=44})`);
  await delay(700); await screenshot('mobile-viewer');
  await click('#vsrc');
  await check('source toggle state', `document.querySelector('#vsrc').getAttribute('aria-expanded')==='true' && !document.querySelector('#vsrcPanel').hidden`);
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedText=text}}})`);
  await click('#vshare');
  await check('share copies current demo URL', 'window.copiedText===location.href');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
  await check('narrow mobile close remains reachable', `(()=>{const r=document.querySelector('#vclose').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight})()`);
  await cdp('Page.navigate', { url: 'about:blank' });
  await cdp('Page.navigate', { url: url + '#/cloth' }); await waitFor(`!!window.LabApp && !document.querySelector('#viewer').hidden`);
  await click('#vclose'); await waitFor(`document.querySelector('#viewer').hidden`);
  await check('direct link closes without leaving site', `location.href.startsWith(${JSON.stringify(url)}) && !location.hash`);
  if (process.argv.includes('--new-works')) {
    const works = ['watercolor-bloom', 'unwoven-poster', 'chladni-plate'];
    await check('95 unique works and complete descriptions', `Lab.demos.length===95 && new Set(Lab.demos.map(d=>d.id)).size===95 && Lab.demos.every(d=>d.desc && d.ctl.length)`);
    await evaluate(`Lab.sound.on=false; window.auditScopes=[]; var originalMount=Lab.mount; Lab.mount=(...args)=>{const scope=originalMount(...args); if(${JSON.stringify(works)}.includes(args[0].id)) auditScopes.push(scope); return scope;}`);
    for (const mobile of [false, true]) {
      await cdp('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1100, height: mobile ? 844 : 800, deviceScaleFactor: 1, mobile });
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: mobile });
      for (const id of works) {
        await evaluate(`LabApp.open(Lab.demos.find(d=>d.id===${JSON.stringify(id)}))`);
        await delay(700);
        await check(`${id} ${mobile ? 'mobile' : 'desktop'} mounts`, `!document.querySelector('.lab-fallback') && !!document.querySelector('#vstage canvas') && !document.querySelector('#vtweak').disabled`);
        const box = await evaluate(`(()=>{const r=document.querySelector('#vstage canvas').getBoundingClientRect();return {x:r.x+r.width*.45,y:r.y+r.height*.5,w:r.width}})()`);
        if (mobile) {
          await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] });
          for (let i=1;i<=8;i++) { await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x+i*box.w*.025, y: box.y+15 }] }); await delay(25); }
          await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await cdp('Input.dispatchMouseEvent', { type:'mousePressed',x:box.x,y:box.y,button:'left',buttons:1,clickCount:1 });
          for (let i=1;i<=8;i++) { await cdp('Input.dispatchMouseEvent', { type:'mouseMoved',x:box.x+i*box.w*.025,y:box.y+15,buttons:1 }); await delay(25); }
          await cdp('Input.dispatchMouseEvent', { type:'mouseReleased',x:box.x+box.w*.2,y:box.y+15,button:'left',buttons:0,clickCount:1 });
        }
        await click('#vstage .lab-modes button:nth-child(2)');
        await click('#vtweak');
        await evaluate(`var slider=document.querySelector('#vtweakRows input'); slider.value=slider.max; slider.dispatchEvent(new Event('input',{bubbles:true}));`);
        await check(`${id} responds to parameter control`, `(()=>{const input=document.querySelector('#vtweakRows input');return auditScopes.at(-1)._params.values[input.dataset.k]===Number(input.max)})()`);
        await click('#vtweak'); await delay(700);
        await screenshot(id + (mobile ? '-mobile' : '-desktop'));
        await check(`${id} ${mobile ? 'touch' : 'mouse'} interaction stays healthy`, `Lab.errors.length===0 && document.querySelector('#vstage canvas').toDataURL().length>5000`);
      }
    }
    await click('#vclose'); await waitFor(`document.querySelector('#viewer').hidden`);
    await check('new works release scopes on switching and closing', `auditScopes.every(s=>!s.alive && s._f.length===0)`);
    if (process.argv.includes('--write-thumbs')) {
      await cdp('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 1, mobile: false });
      for (const id of works) {
        await evaluate(`delete Lab.paramStore[${JSON.stringify(id)}]; window.thumbHost=document.createElement('div'); thumbHost.className='stage-inner'; thumbHost.style.cssText='position:fixed;left:0;top:0;width:640px;height:480px;z-index:1000'; document.body.appendChild(thumbHost); window.thumbScope=Lab.mount(Lab.demos.find(d=>d.id===${JSON.stringify(id)}),thumbHost,false);`);
        await delay(2400);
        const { data } = await cdp('Page.captureScreenshot', { format:'webp',quality:88,clip:{x:0,y:0,width:640,height:480,scale:1} });
        writeFileSync(resolve(__dirname, '../thumbs', id + '.webp'), Buffer.from(data,'base64'));
        console.log('THUMB ' + id);
        await evaluate('thumbScope.dispose();thumbHost.remove()');
      }
    }
  }
  await check('no demo runtime failures', 'Lab.errors.length===0');
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  console.log('PASS no uncaught browser exceptions');
  await send('Browser.close');
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  clearTimeout(watchdog);
  if (socket) socket.close();
  chrome.kill();
});
