/* pleko.es hero animation: six apps go from copy-paste silos to connected tools
   that talk to each other and produce the result on their own.
   Drawn as SVG into #hero-anim. Loops every 18 s. Shared by / and /en/. */
(function(){


const NS="http://www.w3.org/2000/svg";
const BG="#0b3d3d", TOWER="#f3faf7", LINE="#006565", MINT="#00a37a", MID="#2f8f86", GREY="#bdc9c8", SLATE="#5c6767", PAPER="#ffffff", ORANGE="#ff7a1a", CHECK="#1fbf7a";
const L=18; // loop length, seconds
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const seg=(t,a,b)=>clamp((t-a)/(b-a));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const lerp=(a,b,e)=>a+(b-a)*e;
function el(p,tag,a={}){const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e}
function set(e,a){for(const k in a)e.setAttribute(k,a[k])}

function icon(p,kind){
  const g=el(p,"g",{fill:"none",stroke:LINE,"stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"});
  if(kind==="mail"){el(g,"rect",{x:-20,y:-14,width:40,height:28,rx:4});el(g,"path",{d:"M-20 -12 L0 3 L20 -12"})}
  if(kind==="sheet"){el(g,"rect",{x:-18,y:-18,width:36,height:36,rx:3});el(g,"path",{d:"M-18 -6 H18 M-18 6 H18 M-6 -18 V18"})}
  if(kind==="chat"){el(g,"path",{d:"M-18 -15 H18 Q22 -15 22 -11 V5 Q22 9 18 9 H-3 L-12 16 L-10 9 H-18 Q-22 9 -22 5 V-11 Q-22 -15 -18 -15 Z"});[-9,0,9].forEach(x=>el(g,"circle",{cx:x,cy:-3,r:2,fill:LINE,stroke:"none"}))}
  if(kind==="cal"){el(g,"rect",{x:-18,y:-15,width:36,height:33,rx:4});el(g,"path",{d:"M-18 -5 H18 M-9 -20 V-11 M9 -20 V-11"});el(g,"rect",{x:2,y:3,width:8,height:8,fill:MINT,stroke:"none"})}
  if(kind==="crm"){el(g,"rect",{x:-20,y:-16,width:40,height:32,rx:4});el(g,"circle",{cx:-7,cy:-3,r:5});el(g,"path",{d:"M-15 10 Q-7 1 1 10 M6 -5 H14 M6 3 H14"})}
  if(kind==="folder"){el(g,"path",{d:"M-20 -12 H-6 L-2 -7 H20 V15 H-20 Z"});el(g,"path",{d:"M-20 -2 H20"})}
  return g}
function doc(p,fill=PAPER){
  const g=el(p,"g",{});
  el(g,"rect",{x:-16,y:-20,width:32,height:40,rx:3,fill,stroke:SLATE,"stroke-width":1.5});
  el(g,"path",{d:"M-9 -10 H9 M-9 -2 H9 M-9 6 H4",stroke:SLATE,"stroke-width":2.5,"stroke-linecap":"round"});
  return g}
// gentle curve between two nodes: one soft bow, no wiggle
function bow(a,b,R,amt){
  const dx=b[0]-a[0], dy=b[1]-a[1], len=Math.hypot(dx,dy), ux=dx/len, uy=dy/len;
  const A=[a[0]+ux*(R+4),a[1]+uy*(R+4)], B=[b[0]-ux*(R+4),b[1]-uy*(R+4)];
  const C=[(A[0]+B[0])/2-uy*len*amt,(A[1]+B[1])/2+ux*len*amt];
  return `M${A[0].toFixed(1)} ${A[1].toFixed(1)} Q ${C[0].toFixed(1)} ${C[1].toFixed(1)}, ${B[0].toFixed(1)} ${B[1].toFixed(1)}`}

function scene(host,cfg){
  const id=host.id;
  const s=el(host,"svg",{viewBox:"0 0 1200 675",role:"img","aria-label":cfg.label});
  const pat=el(el(s,"defs"),"pattern",{id:id+"dots",width:24,height:24,patternUnits:"userSpaceOnUse"});el(pat,"rect",{width:24,height:24,fill:"#ffffff"});el(pat,"circle",{cx:12,cy:12,r:1.4,fill:"#4fb898","fill-opacity":.35});
  el(s,"rect",{width:1200,height:675,fill:`url(#${id}dots)`});
  const root=el(s,"g",{});
  const kinds=["mail","sheet","chat","cal","crm","folder"], xs=kinds.map((_,i)=>150+i*180), R=40;
  const linkLayer=el(root,"g",{}), outLayer=el(root,"g",{}), siloLayer=el(root,"g",{}), fg=el(root,"g",{});

  const arcs=el(siloLayer,"g",{});
  for(let i=0;i<3;i++) el(arcs,"path",{d:`M${xs[i]} 420 Q ${(xs[i]+xs[i+1])/2} 300, ${xs[i+1]} 420`,fill:"none",stroke:SLATE,"stroke-width":2,"stroke-dasharray":"6 8"});
  const silos=xs.map((x,i)=>{
    const rect=el(siloLayer,"rect",{fill:TOWER,stroke:LINE,"stroke-width":3});
    const floors=el(siloLayer,"g",{});
    for(let r=0;r<6;r++) el(floors,"rect",{x:x-32,y:300+r*40,width:64,height:18,rx:2,fill:"#dcefe9"});
    const ic=icon(siloLayer,kinds[i]);
    const kept=doc(siloLayer); set(kept,{opacity:0});
    return {x,rect,floors,ic,kept,end:cfg.nodes[i]}});
  // selection box shown while copying / pasting
  const sel=el(fg,"rect",{width:48,height:56,rx:6,fill:"none",stroke:MINT,"stroke-width":2.5,"stroke-dasharray":"5 4",opacity:0});

  const mk=(layer,d,k,col,w)=>{
    const base=el(layer,"path",{d,fill:"none",stroke:col,"stroke-width":w,"stroke-linecap":"round",pathLength:1,"stroke-dasharray":1,"stroke-dashoffset":1});
    const flow=el(layer,"path",{d,fill:"none",stroke:PAPER,"stroke-width":2,"stroke-linecap":"round",class:"flow",opacity:0});
    const pulses=[0,1].map(()=>el(layer,"circle",{r:5,fill:MINT,opacity:0}));
    return {base,flow,pulses,len:base.getTotalLength(),k}};
  const N=cfg.nodes;
  const links=cfg.links.map(([i,j],k)=>mk(linkLayer,bow(N[i],N[j],R,k%2?.08:-.08),k,"#4fb898",2.5));

  // output box on the right; chords enter its left edge in order
  const [ox,oy]=cfg.out, bw=170, bh=130;
  const order=[...cfg.outs].sort((a,b)=>N[a][1]-N[b][1]);
  const outs=order.map((i,k)=>{
    const ey=oy-bh/2+22+(bh-44)*(order.length===1?.5:k/(order.length-1)), ex=ox-bw/2;
    const [x,y]=N[i], sx=x+R+2, mx=(sx+ex)/2;
    return mk(outLayer,`M${sx} ${y} C ${mx+40} ${y}, ${mx-20} ${ey}, ${ex} ${ey.toFixed(1)}`,k,LINE,3)});

  const outG=el(fg,"g",{opacity:0});
  el(outG,"rect",{x:ox-bw/2,y:oy-bh/2,width:bw,height:bh,rx:12,fill:TOWER,stroke:LINE,"stroke-width":3});
  const bars=[0,1,2,3].map(i=>el(outG,"rect",{x:ox-56+i*30,width:20,rx:2,fill:i===3?MINT:GREY}));
  const cards=cfg.cardTargets.map(()=>{const g=el(fg,"g",{opacity:0}); doc(g);
    const b=el(g,"g",{transform:"translate(16 -20)"}); el(b,"circle",{r:11,fill:CHECK,stroke:PAPER,"stroke-width":2});
    el(b,"path",{d:"M-5 0 L-1 4 L6 -4",fill:"none",stroke:PAPER,"stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"});
    return {g,b}});
  const check=el(fg,"g",{opacity:0});
  el(check,"circle",{cx:1128,cy:66,r:28,fill:CHECK});
  el(check,"path",{d:"M1115 66 L1124 75 L1141 57",fill:"none",stroke:PAPER,"stroke-width":5,"stroke-linecap":"round","stroke-linejoin":"round"});
  // clock with twelve dots that light up behind the hand, like a loading spinner
  const clock=el(fg,"g",{});
  el(clock,"circle",{cx:1128,cy:66,r:30,fill:PAPER,stroke:LINE,"stroke-width":3});
  const dots=[...Array(12)].map((_,i)=>{const a=i*Math.PI/6;return el(clock,"circle",{cx:1128+Math.sin(a)*21,cy:66-Math.cos(a)*21,r:2.8,fill:ORANGE,opacity:.15})});
  const hand=el(clock,"path",{d:"M1128 66 L1128 52",stroke:LINE,"stroke-width":3,"stroke-linecap":"round"});
  el(clock,"circle",{cx:1128,cy:66,r:3.5,fill:LINE});
  const err=el(fg,"g",{opacity:0});
  el(err,"circle",{cx:xs[2]+34,cy:258,r:16,fill:ORANGE});
  el(err,"path",{d:`M${xs[2]+34} 249 V260 M${xs[3]+34} 266 V267`,stroke:PAPER,"stroke-width":4,"stroke-linecap":"round"});
  const tag=el(fg,"text",{"font-family":"Inter,system-ui,sans-serif","font-size":17,"font-weight":600,fill:MINT,"text-anchor":"middle",opacity:0});
  const carried=doc(fg);
  const cursor=el(fg,"path",{d:"M0 0 L0 26 L7 19 L12 30 L17 28 L12 17 L21 17 Z",fill:PAPER,stroke:BG,"stroke-width":2,"stroke-linejoin":"round"});

  const H=1.9, hb=i=>0.5+i*H; // hop i: copy [b,b+.5], move [b+.5,b+1.4], paste [b+1.4,b+1.9]
  const runPulses=(T,t0,speed,on,bidir)=>T.pulses.forEach((c,j)=>{
    let f=((((t0)*speed+T.k*0.19+j/2)%1)+1)%1; if(bidir&&j%2) f=1-f;
    const p=T.base.getPointAtLength(f*T.len), edge=Math.min(f,1-f);
    set(c,{cx:p.x,cy:p.y,opacity:on*clamp(edge/.06)})});

  function render(t,still=false){
    set(root,{opacity:Math.min(seg(t,0,.5),1-seg(t,17.4,18))});
    const e=ease(seg(t,6.4,8.2)), linkDraw=ease(seg(t,7.8,9.2)), talk=seg(t,9.2,9.8),
          outDraw=ease(seg(t,11.2,12.6)), outOn=seg(t,12.4,13);
    silos.forEach((S,i)=>{
      const [nx,ny]=S.end;
      set(S.rect,{x:lerp(S.x-50,nx-R,e),y:lerp(170,ny-R,e),width:lerp(100,2*R,e),height:lerp(390,2*R,e),rx:lerp(8,R,e)});
      set(S.floors,{opacity:1-seg(e,0,.5)});
      set(S.ic,{transform:`translate(${lerp(S.x,nx,e)} ${lerp(222,ny,e)})`});
      // the copy that stays behind: source after its copy, destination after its paste
      const has=(i<3&&t>=hb(i)+.5)||(i>0&&i<=3&&t>=hb(i-1)+H);
      set(S.kept,{transform:`translate(${S.x} 420)`,opacity:has?.6*(1-e):0});
    });
    set(arcs,{opacity:1-seg(t,6,7)});

    // manual phase
    let cx=xs[0], cy=420, mode="", at=0;
    for(let i=0;i<3;i++){const b=hb(i);
      if(t>=b&&t<b+.5){cx=xs[i];mode="copy";at=i}
      else if(t>=b+.5&&t<b+1.4){const u=ease(seg(t,b+.5,b+1.4));cx=lerp(xs[i],xs[i+1],u);cy=(1-u)*(1-u)*420+2*u*(1-u)*300+u*u*420;mode="move"}
      else if(t>=b+1.4&&t<b+H){cx=xs[i+1];mode="paste";at=i+1}
      else if(t>=b+H){cx=xs[i+1];mode="";}}
    const mv=1-seg(t,6,6.6);
    set(carried,{transform:`translate(${cx} ${cy})`,opacity:mv*(t<hb(0)?.6:1)});
    set(cursor,{transform:`translate(${cx+8} ${cy+6})`,opacity:mv});
    const blink=(mode==="copy"||mode==="paste")&&t<6.2;
    set(sel,{x:cx-24,y:cy-28,opacity:blink?(Math.sin(t*20)>-.3?1:.35):0});
    tag.textContent=mode==="copy"?"Ctrl+C":"Ctrl+V";
    set(tag,{x:cx,y:cy-40,opacity:blink?1:0});
    const errOn=t>=hb(1)+1.4&&t<hb(2)+.5;
    set(err,{opacity:errOn?(Math.sin(t*14)>0?1:.25):0});
    set(clock,{opacity:1-seg(t,6.4,7.2)});
    const ang=(t*150)%360;
    set(hand,{transform:`rotate(${ang} 1128 66)`});
    dots.forEach((d,i)=>{const lag=((ang-i*30)%360+360)%360; set(d,{opacity:lag<120?1-lag/120*.85:.15})});
    set(check,{opacity:seg(t,13.2,13.8)});

    links.forEach(T=>{set(T.base,{"stroke-dashoffset":1-linkDraw});set(T.flow,{opacity:talk*.5});runPulses(T,t-9.2,.45,talk,true)});
    outs.forEach(T=>{set(T.base,{"stroke-dashoffset":1-outDraw});set(T.flow,{opacity:outOn*.8});runPulses(T,t-12.4,.4,outOn,false)});
    set(outG,{opacity:seg(t,12,12.8)});
    bars.forEach((b,i)=>{const h=lerp(6,[36,58,46,78][i],ease(seg(t,12.8+i*.45,13.6+i*.45)));set(b,{y:oy+46-h,height:h})});
    cards.forEach((c,i)=>{const a=13.6+i*1.1,u=ease(seg(t,a,a+.8)),[tx,ty]=cfg.cardTargets[i];
      set(c.g,{transform:`translate(${lerp(ox,tx,u)} ${lerp(oy,ty,u)}) rotate(${lerp(0,cfg.cardTilt[i],u)})`,opacity:seg(t,a,a+.2)});
      const since=t-(a+.8), flash=still?1:since<0?0:since<1.2?(Math.sin(since*Math.PI*5)>-.2?1:.2):1;
      set(c.b,{opacity:flash,transform:`translate(16 -20) scale(${since>0&&since<.25?1+since*1.6:1})`})});
  }

  // Loop. Pauses with the button, while the hero is off screen, and never runs for reduced motion.
  render(17.2,true); // finished state: tools connected, result box full, all documents checked
  const btn=host.parentElement.querySelector(".hero__pause");
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){if(btn)btn.hidden=true;return}
  let start=performance.now(), paused=false, visible=true, cur=0, raf=0;
  const frame=now=>{cur=((now-start)/1000)%L;render(cur);raf=requestAnimationFrame(frame)};
  const run=()=>{if(!paused&&visible&&!raf){start=performance.now()-cur*1000;raf=requestAnimationFrame(frame)}};
  const stop=()=>{cancelAnimationFrame(raf);raf=0};
  if(btn) btn.addEventListener("click",()=>{paused=!paused;btn.setAttribute("aria-pressed",paused);host.classList.toggle("is-paused",paused);paused?stop():run()});
  if("IntersectionObserver" in window) new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?run():stop()}).observe(host);
  run();
}


const host=document.getElementById("hero-anim");
if(host) scene(host,{label:host.dataset.label||"",
  nodes:[[160,150],[220,337],[160,525],[470,215],[520,337],[470,460]],
  links:[[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[0,4],[2,4]],
  outs:[3,4,5], out:[930,337], cardTargets:[[1110,215],[1128,337],[1110,459]], cardTilt:[-8,2,9]});
})();
