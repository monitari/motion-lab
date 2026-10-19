/* Type studies — original Canvas 2D studies, no external assets.
 * Spatial type reference: https://spacetypegenerator.com/ (Kiel Mutschelknaus)
 * Interactive type reference: https://tympanus.net/Tutorials/InteractiveTypographyEffects/
 * Hangul decomposition: Unicode Core Specification, section 3.12.
 */
(() => {
  const { U } = Lab;
  const font = (size) => `900 ${size}px "Pretendard Variable", system-ui, sans-serif`;
  const split = (value) => typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(value)].map(v => v.segment)
    : Array.from(value);
  const styles = `
    .type-study { --type-ink:#ede6d8; --type-line:#ffffff35; }
    .type-study .type-label { position:absolute; left:6%; right:6%; top:6%; display:flex; justify-content:space-between; gap:12px; color:var(--type-ink); pointer-events:none; font:500 clamp(9px,1.7cqmin,12px)/1.4 var(--mono); letter-spacing:.1em; }
    .type-study .type-label span:last-child { opacity:.6; }
    .type-study .type-entry { position:absolute; z-index:2; bottom:76px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:12px; width:min(320px,82%); color:var(--type-ink); border-bottom:1px solid var(--type-line); }
    .type-entry span { font:500 11px var(--sans); white-space:nowrap; opacity:.7; }
    .type-entry input { min-width:0; width:100%; min-height:44px; padding:4px; border:0; border-radius:0; background:transparent; color:inherit; font:600 16px var(--sans); }
    .type-entry input:focus-visible { outline:1px solid var(--type-ink); outline-offset:2px; }
    .type-caption { position:absolute; left:7%; right:7%; bottom:8%; text-align:center; color:var(--type-ink); opacity:.65; pointer-events:none; font:500 clamp(9px,1.8cqmin,13px)/1.6 var(--mono); }
    .type-study .lab-modes { width:max-content; max-width:calc(100% - 24px); }
    .type-study .lab-modes button { min-height:44px; white-space:nowrap; flex-shrink:0; padding:9px 13px; }
    .stage-chromatic-press, .stage-hangul-assembly { --type-ink:#26343a; --type-line:#26343a45; }
    .stage-chromatic-press .lab-modes, .stage-hangul-assembly .lab-modes { background:#f7f0e6e8; border-color:#26343a40; }
    .stage-chromatic-press .lab-modes button, .stage-hangul-assembly .lab-modes button { color:#26343a; }
    .stage-chromatic-press .lab-modes button.on, .stage-hangul-assembly .lab-modes button.on { background:#26343a; color:#fff7e8; }
    .stage-hangul-assembly .type-caption { bottom:136px; font-family:var(--sans); opacity:.8; }
    @media (max-height:480px) { .type-study .type-entry { bottom:66px; } }
  `;
  function wordControl(el, s, initial, max, heading, subtitle) {
    el.classList.add('type-study');
    const label = s.html('<div class="type-label"><span></span><span></span></div>');
    label.children[0].textContent = heading; label.children[1].textContent = subtitle;
    const state = { value: initial, onChange: null };
    if (s.large) {
      const wrap = s.html('<label class="type-entry"><span>문구 바꾸기</span><input type="text" autocomplete="off" spellcheck="false" aria-label="작품에 사용할 문구"></label>');
      const input = wrap.querySelector('input');
      input.value = initial; input.maxLength = 100; input.placeholder = initial;
      let composing = false;
      const commit = () => {
        if (composing) return;
        const value = split(input.value.normalize('NFC')).slice(0, max).join('');
        input.value = value;
        state.value = value.trim() || initial;
        state.onChange && state.onChange();
      };
      s.on(input, 'compositionstart', () => { composing = true; });
      s.on(input, 'compositionend', () => { composing = false; commit(); });
      s.on(input, 'input', commit);
    }
    const caption = s.html('<div class="type-caption"></div>');
    if (s.large) caption.hidden = true;
    state.caption = caption;
    return state;
  }
  const fit = (x, text, width, height) => {
    x.font = font(100);
    return Math.min(height, width / Math.max(1, x.measureText(text).width) * 100);
  };

  Lab.register({
    id: 'type-cylinder', cat: 'text', title: 'Type Cylinder', feature: true,
    tags: ['kinetic', '3D', '원통', '타이포그래피', '문구 입력'], css: styles,
    mount(el, s) {
      const c = s.canvas(), x = c.ctx, p = s.pointer(c.cv);
      const word = wordControl(el, s, 'MOTION', 12, 'TYPE / 01', 'WORDS IN ORBIT');
      word.caption.textContent = 'DRAG TO SPIN THE SENTENCE';
      const P = s.params({ speed: [.35, 0, 1.5, .05, '회전 속도'], twist: [.14, 0, .65, .01, '줄마다 비틀기'] });
      let phase = 0, tilt = .18, velocity = 0, prev = 0, lastMove = 0, direction = 1;
      const mode = s.modes(['회전', '멈춤', '반대로'], 0, (i) => { direction = i === 2 ? -1 : 1; });
      p.ondown = () => { prev = p.x; velocity = 0; lastMove = performance.now(); };
      p.onmove = () => {
        if (!p.down) return;
        const now = performance.now(), delta = (p.x - prev) / Math.max(1, c.w) * 6;
        phase += delta; velocity = U.clamp(delta / Math.max(.012, (now-lastMove)/1000), -4, 4);
        prev = p.x; lastMove = now;
      };
      p.onup = () => { if (performance.now()-lastMove > 120) velocity = 0; };
      s.raf((dt) => {
        if (!p.down) {
          phase += (mode.i === 1 ? 0 : P.speed * direction) * dt + velocity * dt;
          velocity *= Math.exp(-dt * 3);
        }
        tilt += ((p.inside ? (p.ny-.5)*.65 : .16) - tilt) * U.damp(5,dt);
        x.fillStyle='#173ebe'; x.fillRect(0,0,c.w,c.h);
        const available = Math.max(80,c.h-(s.large ? 180 : 90));
        const radius = Math.min(c.w*.32,available*.65), rows = 7;
        const fs = Math.min(c.w*.085,available*.1), gap = fs*1.06, cy = s.large ? c.h*.43 : c.h*.48;
        const text = split(word.value + ' · '), repeats = Math.max(2,Math.ceil(30/text.length)), count=text.length*repeats;
        const objects=[];
        for(let row=0;row<rows;row++) for(let i=0;i<count;i++) {
          const angle=i/count*U.TAU+phase+row*P.twist;
          objects.push({ angle, row, z:Math.cos(angle), char:text[i%text.length] });
        }
        objects.sort((a,b)=>a.z-b.z);
        x.textAlign='center'; x.textBaseline='middle';
        for(const obj of objects) {
          const perspective=3/(3-obj.z*.55);
          const px=c.w/2+Math.sin(obj.angle)*radius*perspective;
          const py=cy+(obj.row-(rows-1)/2)*gap*perspective+obj.z*radius*tilt;
          x.save(); x.translate(px,py); x.scale(Math.max(.08,Math.abs(obj.z))*perspective,perspective);
          x.font=font(fs); x.fillStyle=obj.z<0 ? '#778ad1' : obj.row===3 ? '#ffe48f' : '#fff4dc';
          x.globalAlpha=obj.z<0 ? .25 : .6+.4*obj.z;
          x.fillText(obj.char,0,0); x.restore();
        }
        x.globalAlpha=1;
      });
    },
  });

  Lab.register({
    id: 'contour-type', cat: 'text', title: 'Contour Type',
    tags: ['outline', 'extrusion', '등고선', '타이포그래피', '문구 입력'],
    mount(el,s) {
      const c=s.canvas(),x=c.ctx,p=s.pointer(c.cv);
      const word=wordControl(el,s,'ECHO',10,'TYPE / 02','DEPTH OF A WORD');
      word.caption.textContent='MOVE THROUGH THE LAYERS';
      const P=s.params({ depth:[.16,.03,.32,.01,'층의 깊이'], layers:[20,8,32,1,'겹 수'] });
      const mode=s.modes(['등고선','종이층','반전'],0);
      let dx=.5,dy=.4,time=0;
      s.raf((dt)=>{
        time+=dt;
        const target=p.idle ? {x:.55+Math.sin(time*.5)*.25,y:.48+Math.cos(time*.4)*.23} : {x:p.nx,y:p.ny};
        dx+=(target.x-.5-dx)*U.damp(5,dt); dy+=(target.y-.5-dy)*U.damp(5,dt);
        const inverse=mode.i===2, bg=inverse?'#e9e2cc':'#241c34';
        x.fillStyle=bg;x.fillRect(0,0,c.w,c.h);
        el.style.setProperty('--type-ink',inverse?'#302740':'#eee2c9');
        const size=Math.min(c.w,c.h), depth=size*P.depth*(p.down?1.45:1);
        const fs=fit(x,word.value,c.w*.68,Math.min(c.h*.3,c.w*.4));
        const cy=c.h*(s.large?.44:.48);
        x.textAlign='center';x.textBaseline='middle';x.font=font(fs);x.lineJoin='round';
        for(let i=P.layers;i>=0;i--) {
          const t=i/P.layers, ox=dx*depth*t*2.5, oy=dy*depth*t*2.5;
          x.save();x.translate(c.w/2+ox,cy+oy);x.scale(1+t*.12,1+t*.12);
          x.lineWidth=Math.max(.65,size/650);
          if(mode.i===1) { x.fillStyle=`hsl(${235+t*70},${25+t*25}%,${28+t*30}%)`;x.fillText(word.value,0,0); }
          x.strokeStyle=inverse?`hsla(${270-t*70},40%,35%,${.8-t*.5})`:`hsla(${25+t*130},65%,72%,${.95-t*.55})`;
          x.strokeText(word.value,0,0);
          x.restore();
        }
        x.fillStyle=inverse?'#302740':'#fff0cd';x.fillText(word.value,c.w/2,cy);
        x.strokeStyle=inverse?'#30274025':'#fff0cd20';x.lineWidth=1;
        for(const sy of [cy-fs*.65,cy+fs*.65]) { x.beginPath();x.moveTo(c.w*.07,sy);x.lineTo(c.w*.93,sy);x.stroke(); }
      });
    },
  });

  Lab.register({
    id:'chromatic-press',cat:'text',title:'Chromatic Press',
    tags:['CMY','letterpress','인쇄','색판','문구 입력'],
    mount(el,s) {
      const c=s.canvas(),x=c.ctx,p=s.pointer(c.cv);
      const word=wordControl(el,s,'PRINT',12,'TYPE / 03','THREE INKS. ONE WORD.');
      word.caption.textContent='CYAN + MAGENTA + YELLOW';
      const P=s.params({ offset:[1,.1,2.5,.1,'색판 어긋남'], grain:[.25,0,.8,.05,'종이 결'] });
      const inks=['#00abc9','#ed3986','#f7dc37'], plates=[{x:-.045,y:-.025},{x:.045,y:.015},{x:0,y:.055}];
      let drag=null,touched=false,time=0;
      const mode=s.modes(['C','M','Y','맞추기'],0,(i)=>{
        touched=true;
        if(i===3) { plates.forEach(q=>{q.x=q.y=0;});mode.set(0); }
      });
      s.$$('.lab-modes button').forEach((b,i)=>{b.setAttribute('aria-label',['시안 색판','마젠타 색판','노랑 색판','색판 모두 맞추기'][i]);});
      const paper=Lab.offscreen(256,256), g=paper.getContext('2d');
      for(let i=0;i<8000;i++) {g.fillStyle=i%2?'#42352432':'#ffffffa0';g.fillRect(Math.random()*256,Math.random()*256,1,1);}
      const texture=x.createPattern(paper,'repeat');
      p.ondown=()=>{touched=true;const q=plates[mode.i];drag={x:p.x,y:p.y,px:q.x,py:q.y};};
      p.onmove=()=>{
        if(!p.down||!drag)return;
        const size=Math.max(1,Math.min(c.w,c.h));
        plates[mode.i].x=U.clamp(drag.px+(p.x-drag.x)/size,-.2,.2);
        plates[mode.i].y=U.clamp(drag.py+(p.y-drag.y)/size,-.2,.2);
      };
      p.onup=()=>{drag=null;};
      s.raf((dt)=>{
        time+=dt;
        x.globalCompositeOperation='source-over';x.fillStyle='#f1eadb';x.fillRect(0,0,c.w,c.h);
        const size=Math.min(c.w,c.h),cy=c.h*(s.large?.44:.48);
        const fs=fit(x,word.value,c.w*.7,Math.min(c.h*.3,c.w*.4));
        x.font=font(fs);x.textAlign='center';x.textBaseline='middle';
        x.globalCompositeOperation='multiply';
        plates.forEach((q,i)=>{
          const auto=!s.large&&!touched ? Math.sin(time*.8+i*2)*.025:0;
          const dx=(q.x+auto)*size*P.offset,dy=(q.y+auto*.4)*size*P.offset;
          x.fillStyle=inks[i];x.fillText(word.value,c.w/2+dx,cy+dy);
          x.strokeStyle=inks[i];x.lineWidth=1;
          for(const side of [-1,1]) {
            const cx=c.w/2+side*c.w*.4+dx, yy=cy+dy;
            x.beginPath();x.arc(cx,yy,7,0,U.TAU);x.moveTo(cx-11,yy);x.lineTo(cx+11,yy);x.moveTo(cx,yy-11);x.lineTo(cx,yy+11);x.stroke();
          }
        });
        x.globalCompositeOperation='source-over';x.globalAlpha=P.grain;x.fillStyle=texture;x.fillRect(0,0,c.w,c.h);x.globalAlpha=1;
        // The tiny swatches identify which plate moves without obscuring the word.
        inks.forEach((color,i)=>{x.fillStyle=color;x.fillRect(c.w/2-33+i*24,cy+fs*.85,18,6);});
      });
    },
  });

  const INITIAL=Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
  const MEDIAL=Array.from('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ');
  const FINAL=['',...Array.from('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ')];
  function decompose(letter) {
    const n=letter.codePointAt(0)-0xAC00;
    if(n<0||n>=11172||Array.from(letter).length!==1)return [letter];
    return [INITIAL[Math.floor(n/588)],MEDIAL[Math.floor(n%588/28)],FINAL[n%28]].filter(Boolean);
  }
  Lab.register({
    id:'hangul-assembly',cat:'text',title:'Hangul Assembly',feature:true,
    tags:['한글','자모','조립','Unicode','문구 입력'],
    mount(el,s) {
      const c=s.canvas(),x=c.ctx,p=s.pointer(c.cv);
      const word=wordControl(el,s,'한글',4,'TYPE / 04','LETTERS, TAKEN APART');
      const P=s.params({ spread:[1,.4,1.4,.1,'분해 거리'], speed:[.6,.1,1.5,.1,'자동 조립 속도'] });
      const mode=s.modes(['자동','분해','조립'],0);
      let letters=[],amount=.75,time=0,held=null;
      function rebuild() {
        letters=split(word.value).map(char=>({char,parts:decompose(char)}));
        word.caption.textContent=letters.map(l=>l.parts.length>1?`${l.char} = ${l.parts.join(' + ')}`:l.char).join('   ·   ');
        word.caption.hidden=false;
        if(!s.large)word.caption.style.bottom='8%';
      }
      word.onChange=rebuild;rebuild();
      p.ondown=()=>{held=U.clamp(p.nx,0,1);};
      p.onmove=()=>{if(p.down)held=U.clamp(p.nx,0,1);};
      s.raf((dt)=>{
        time+=dt;
        const target=p.down?held:mode.i===1?1:mode.i===2?0:held!==null?held:(1-Math.cos(time*P.speed))* .5;
        amount+=(target-amount)*U.damp(6,dt);
        x.fillStyle='#eee9dc';x.fillRect(0,0,c.w,c.h);
        const colors=['#cf503d','#255a96','#44735e'];
        const cell=Math.min(c.w*.8/Math.max(2,letters.length),c.h*(s.large?.34:.38));
        const start=c.w/2-(letters.length-1)*cell/2,cy=c.h*(s.large?.42:.48);
        x.textAlign='center';x.textBaseline='middle';
        letters.forEach((letter,index)=>{
          const cx=start+index*cell;
          x.strokeStyle='#26343a22';x.lineWidth=1;
          x.strokeRect(cx-cell*.43,cy-cell*.43,cell*.86,cell*.86);
          x.setLineDash([3,5]);x.beginPath();x.moveTo(cx,cy-cell*.43);x.lineTo(cx,cy+cell*.43);x.moveTo(cx-cell*.43,cy);x.lineTo(cx+cell*.43,cy);x.stroke();x.setLineDash([]);
          if(letter.parts.length===1) {x.font=font(cell*.65);x.fillStyle='#26343a';x.fillText(letter.char,cx,cy);return;}
          const fade=U.smooth(.12,.45,amount);
          x.globalAlpha=1-fade;x.font=font(cell*.77);x.fillStyle='#26343a';x.fillText(letter.char,cx,cy);
          x.globalAlpha=fade;
          letter.parts.forEach((char,j)=>{
            const a=-Math.PI/2+j*U.TAU/letter.parts.length;
            const r=cell*(.13+amount*.36*P.spread);
            const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;
            x.strokeStyle=colors[j]+'66';x.beginPath();x.moveTo(cx,cy);x.lineTo(px,py);x.stroke();
            x.fillStyle='#eee9dc';x.beginPath();x.arc(px,py,cell*.2,0,U.TAU);x.fill();
            x.font=font(cell*.42);x.fillStyle=colors[j];x.fillText(char,px,py);
          });
          x.globalAlpha=1;
          x.font=`500 ${Math.max(10,cell*.08)}px monospace`;x.fillStyle='#26343a66';x.fillText(`0${index+1}`,cx,cy+cell*.85);
        });
      });
      s.$$('.lab-modes button').forEach(b=>s.on(b,'click',()=>{held=null;}));
    },
  });
})();
