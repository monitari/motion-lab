/* =========================================================
   SHADER — WebGL 프래그먼트 셰이더 (마우스 = 유니폼)
   공통 유니폼: iTime, iRes, iMouse(px), iDown(0..1), iClick(s)
   ========================================================= */
(() => {
  const NOISE = `
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
  `;

  const reg = (o) => Lab.register({ cat: 'shader', ...o, source: o.frag, mount(el, s) { s.shader(o.frag, o.opts); } });

  /* 1. Nebula — 도메인 워핑 */
  reg({
    id: 'nebula', title: 'Nebula Warp', feature: true, tags: ['fbm', 'domain warping', 'GLSL'],
    frag: NOISE + `
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y;
      vec2 m=(iMouse-.5*iRes)/iRes.y;
      vec2 d=uv-m; float infl=exp(-dot(d,d)*7.)*(.5+iDown*1.2);
      uv-=d*infl*.6;
      float t=iTime*.06;
      vec2 q=vec2(fbm(uv*1.8+t),fbm(uv*1.8+vec2(5.2,1.3)-t));
      vec2 r=vec2(fbm(uv*1.8+3.6*q+vec2(1.7,9.2)+t*1.5+m*.4),fbm(uv*1.8+3.6*q+vec2(8.3,2.8)-t));
      float f=fbm(uv*1.8+3.6*r);
      vec3 col=mix(vec3(.03,.01,.1),vec3(.55,.08,.45),clamp(f*f*2.2,0.,1.));
      col=mix(col,vec3(.08,.45,.95),clamp(length(q)*.9,0.,1.)*.55);
      col=mix(col,vec3(1.,.72,.38),clamp(r.x*r.x*1.1,0.,1.)*f);
      col*=f*1.7+.15;
      vec2 sp=floor(gl_FragCoord.xy/2.);
      float h=hash(sp);
      col+=step(.996,h)*(.6+.4*sin(iTime*3.+h*60.));
      col+=infl*.25*vec3(1.,.6,.9);
      gl_FragColor=vec4(pow(col,vec3(.9)),1.);
    }`,
  });

  /* 2. Iridescent Metaballs — 레이마칭 */
  reg({
    id: 'metaballs', title: 'Iridescent Blobs', tags: ['raymarching', 'smooth min', 'GLSL'],
    frag: `
    vec3 mp;
    float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
    float map(vec3 p){
      float t=iTime*.6;
      float d=length(p-mp)-.5-iDown*.15;
      for(int i=0;i<6;i++){float fi=float(i);
        vec3 c=vec3(sin(t*(.6+fi*.13)+fi*1.7)*1.5,cos(t*(.5+fi*.11)+fi*2.3)*.95,sin(t*(.4+fi*.07)+fi)*.7);
        d=smin(d,length(p-c)-(.32+.07*fi),.5+iDown*.4);}
      return d;
    }
    vec3 nrm(vec3 p){vec2 e=vec2(.002,0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y;
      vec2 m=(iMouse-.5*iRes)/iRes.y;
      mp=vec3(m*(4./1.5),0.);
      vec3 ro=vec3(0,0,4.),rd=normalize(vec3(uv,-1.5));
      vec3 bg=mix(vec3(.02,.02,.06),vec3(.12,.05,.2),uv.y+.5);
      float t=0.;bool hit=false;
      for(int i=0;i<80;i++){vec3 p=ro+rd*t;float d=map(p);if(d<.001){hit=true;break;}t+=d;if(t>9.)break;}
      vec3 col=bg;
      if(hit){
        vec3 p=ro+rd*t,n=nrm(p);
        float fr=pow(1.-max(dot(n,-rd),0.),2.5);
        vec3 ir=.5+.5*cos(6.2831*(vec3(0.,.33,.67)+dot(n,vec3(.4,.6,.2))*1.3+fr*1.2+iTime*.08));
        vec3 l=normalize(vec3(.6,.8,.5));
        float dif=max(dot(n,l),0.);
        float spec=pow(max(dot(reflect(-l,n),-rd),0.),60.);
        vec3 rf=reflect(rd,n);
        vec3 env=mix(vec3(.1,.05,.2),vec3(1.,.9,.95),smoothstep(-.2,.9,rf.y));
        col=ir*(.25+.6*dif)+env*fr*.9+spec*1.2;
        col=mix(col,ir*.8+.2,fr*.3);
      }
      gl_FragColor=vec4(pow(col,vec3(.85)),1.);
    }`,
  });

  /* 3. Liquid Chrome */
  reg({
    id: 'liquid-chrome', title: 'Liquid Chrome', tags: ['normal map', 'reflection', 'GLSL'],
    frag: `
    vec2 m;
    float h(vec2 p){
      float t=iTime*.45;
      float v=sin(p.x*2.6+t)+sin(p.y*2.3-t*1.3)+sin((p.x+p.y)*1.9+t*.7)+sin(length(p-vec2(sin(t*.3),cos(t*.2)))*4.-t*2.);
      vec2 d=p-m;float r=length(d);
      v+=sin(r*13.-iTime*7.)*exp(-r*2.2)*(.5+iDown*1.6);
      return v*.22;
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y*2.;
      m=(iMouse-.5*iRes)/iRes.y*2.;
      float e=.01;
      vec3 n=normalize(vec3(-(h(uv+vec2(e,0))-h(uv-vec2(e,0)))/(2.*e),-(h(uv+vec2(0,e))-h(uv-vec2(0,e)))/(2.*e),1.6));
      vec3 r=reflect(vec3(0,0,-1),n);
      float band=smoothstep(.0,.05,sin(r.y*7.+r.x*2.+iTime*.3))*.8;
      vec3 sky=mix(vec3(.05,.06,.1),vec3(.85,.9,1.),smoothstep(-.3,.8,r.y));
      vec3 col=sky*(.4+band*.7);
      col+=pow(max(r.y,0.),12.)*1.5;
      col+=vec3(1.,.5,.8)*pow(max(-r.x,0.),6.)*.6+vec3(.3,.8,1.)*pow(max(r.x,0.),6.)*.6;
      col=mix(col,col*vec3(1.,.95,1.05),.5);
      gl_FragColor=vec4(pow(col,vec3(1.1)),1.);
    }`,
  });

  /* 4. Julia Explorer */
  reg({
    id: 'julia', title: 'Julia Explorer', tags: ['fractal', 'complex plane', 'GLSL'],
    frag: `
    void main(){
      vec2 m=iMouse/iRes*2.-1.;
      float a=m.x*3.14159, rad=.62+m.y*.18;
      vec2 c=rad*vec2(cos(a),sin(a));
      vec2 z=(gl_FragCoord.xy-.5*iRes)/iRes.y*mix(2.8,1.1,iDown);
      float it=0.;
      for(int i=0;i<180;i++){z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;if(dot(z,z)>256.)break;it+=1.;}
      vec3 col=vec3(0.);
      if(it<179.){
        float sm=it-log2(log2(dot(z,z)))+4.;
        col=.5+.5*cos(3.+sm*.15+vec3(0.,.6,1.)+iTime*.25);
        col*=smoothstep(0.,6.,sm);
      }
      gl_FragColor=vec4(col,1.);
    }`,
  });

  /* 5. Kaleidoscope — Kali fractal fold */
  reg({
    id: 'kaleidoscope', title: 'Kaleidoscope', tags: ['polar fold', 'kali set', 'GLSL'],
    frag: `
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y;
      vec2 m=iMouse/iRes;
      float seg=floor(4.+m.x*12.);
      float a=atan(uv.y,uv.x)+iTime*(.05+iDown*.6),r=length(uv);
      float sa=6.28318/seg;
      a=mod(a,sa);a=abs(a-sa*.5);
      vec2 p=vec2(cos(a),sin(a))*r*(.6+m.y*1.6);
      p+=vec2(sin(iTime*.11),cos(iTime*.13))*.3;
      vec3 col=vec3(0.);
      for(int i=0;i<9;i++){
        p=abs(p)/dot(p,p)-vec2(.82+.05*sin(iTime*.2),.6);
        float fi=float(i);
        col+=(.5+.5*cos(vec3(0.,2.,4.)+fi*.45+iTime*.4))*exp(-length(p)*1.8)*.55;
      }
      col*=smoothstep(1.2,.2,r);
      gl_FragColor=vec4(pow(col,vec3(.8)),1.);
    }`,
  });

  /* 6. Neon Tunnel */
  reg({
    id: 'neon-tunnel', title: 'Neon Tunnel', tags: ['polar mapping', 'infinite', 'GLSL'],
    frag: `
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*iRes)/iRes.y;
      vec2 m=(iMouse-.5*iRes)/iRes.y;
      vec2 c=uv-m*.7;
      float r=length(c),a=atan(c.y,c.x)/6.28318;
      float z=.35/max(r,.001)+iTime*(.7+iDown*2.5);
      float an=a+iTime*.03+.03/max(r,.01)*m.x;
      float ring=abs(fract(z*1.5)-.5);
      float spoke=abs(fract(an*16.)-.5);
      float line=smoothstep(.06,.0,ring-.0)+smoothstep(.04,.0,spoke*r*2.)*.7;
      vec3 base=.5+.5*cos(6.28318*(z*.08+vec3(0.,.33,.67)));
      vec3 col=base*line*1.4+base*.06;
      col*=smoothstep(0.,.35,r);
      col+=vec3(.8,.5,1.)*.04/max(r,.02);
      gl_FragColor=vec4(col,1.);
    }`,
  });

  /* 7. Voronoi Cells */
  reg({
    id: 'voronoi', title: 'Living Cells', tags: ['voronoi', 'cellular', 'GLSL'],
    frag: NOISE + `
    void main(){
      float sc=6.;
      vec2 uv=gl_FragCoord.xy/iRes.y*sc;
      vec2 m=iMouse/iRes.y*sc;
      vec2 g=floor(uv),f=fract(uv);
      float md=8.,md2=8.;vec2 mid=vec2(0.);vec2 mc=vec2(0.);
      for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){
        vec2 b=vec2(float(i),float(j));
        vec2 o=hash2(g+b);o=.5+.4*sin(iTime*.7+6.2831*o);
        vec2 wp=g+b+o;vec2 dm=wp-m;float dl=length(dm)+.001;
        wp+=dm/dl*.9*exp(-dl*1.2)*(1.+iDown*.8);
        vec2 rr=wp-uv;float d=dot(rr,rr);
        if(d<md){md2=md;md=d;mid=g+b;mc=wp;}else if(d<md2){md2=d;}
      }
      float edge=sqrt(md2)-sqrt(md);
      vec3 col=.5+.5*cos(6.2831*(hash2(mid).x*.35+vec3(.55,.65,.8))+iTime*.2);
      col*=.35+.65*smoothstep(0.,.9,sqrt(md));
      float gl=exp(-length(mc-m)*1.4);
      col+=gl*vec3(1.,.5,.8)*.9*(1.-smoothstep(0.,1.,sqrt(md)));
      col=mix(vec3(.02,.02,.05),col,smoothstep(.02,.09,edge));
      col+=vec3(.6,.9,1.)*smoothstep(.05,.0,edge)*.25;
      gl_FragColor=vec4(col,1.);
    }`,
  });
})();
