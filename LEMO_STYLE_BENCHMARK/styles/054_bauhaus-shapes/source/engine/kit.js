// engine/kit.js — excerpt from lemo-opuscar styles/bauhaus-shapes/demo/index.html: the drawing helpers (disc, poly, rect, line, arc, cross,
// text, measure, runs) and the matte-card finish (buildTooth, finish), copied unchanged; marked edits only bind them to this page:
// EDIT 054: the canvas, palette, font names and TEX switch are defined here instead of in the demo page, and the functions are exported.
import { mulberry, clamp, lerp } from '/core/lib.js';
export const W = 1920, H = 1080, TAU = Math.PI * 2, SANS = '"BH Sans"', HEI = '"BH Sans"', TEX = true;
export const P = { paper: '#F7F5F0', red: '#D9343B', blue: '#23409A', yel: '#F2B630', tint: '#CFD8E8', ink: '#18203A', light: '#F7F5F0' };   // roles: protagonist = red (AKI), field = blue, pivot = yel, secondary = tint
const cv = document.getElementById('c'); export const g = cv.getContext('2d');
function disc(x,y,r,col){ if (r<=0) return; g.fillStyle=col; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
function poly(pts,col){ g.fillStyle=col; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); }
function rect(x,y,w,h,col){ g.fillStyle=col; g.fillRect(x,y,w,h); }
function line(pts,col,w=5){ g.strokeStyle=col; g.lineWidth=w; g.lineCap='butt'; g.lineJoin='round'; g.beginPath();
  pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); }
function arc(x,y,r,a0,a1,col,w=5){ g.strokeStyle=col; g.lineWidth=w; g.lineCap='butt'; g.beginPath(); g.arc(x,y,r,a0,a1); g.stroke(); }
// a compass mark: the centre a circle was drawn from (our addition: the Vorkurs construction layer, left visible)
function cross(x,y,col,s=14,w=2){ line([[x-s,y],[x+s,y]],col,w); line([[x,y-s],[x,y+s]],col,w); }
function text(str,x,y,{size=40,weight=800,fam=SANS,col=P.ink,align='left',base='alphabetic',rot=0,track=0}={}){
  g.save(); g.translate(x,y); if (rot) g.rotate(rot);
  g.font=`${weight} ${size}px ${fam}`; g.fillStyle=col; g.textAlign=align; g.textBaseline=base;
  g.letterSpacing = track ? `${track}px` : '0px';
  g.fillText(str,0,0); g.restore();
}
function measure(str,size,weight=800,fam=SANS,track=0){ g.font=`${weight} ${size}px ${fam}`; g.letterSpacing = track?`${track}px`:'0px'; return g.measureText(str).width; }
// one line made of several runs, each with its own colour (used to set "×" or a word in an accent)
function runs(parts,x,y,opt){ let cx=x; for (const [s,col] of parts){ text(s,cx,y,{...opt,col}); cx+=measure(s,opt.size,opt.weight??800,opt.fam??SANS,opt.track??0); } return cx; }

// ---------------- material: opaque ink on matte card ----------------
// Fine tooth everywhere, plus a slow, very low ink-density drift inside the colour fields (screen-printed, not glossy).
let TOOTH = null;
function buildTooth(){
  const rnd = mulberry(11), N = new Float32Array(W*H);
  // value noise for the slow drift
  const gw = 48, gh = 28, grid = Array.from({length:(gw+1)*(gh+1)}, ()=>rnd()*2-1);
  const vn = (x,y)=>{ const fx=x/W*gw, fy=y/H*gh, ix=Math.floor(fx), iy=Math.floor(fy), tx=fx-ix, ty=fy-iy;
    const s=t=>t*t*(3-2*t), a=grid[iy*(gw+1)+ix], b=grid[iy*(gw+1)+ix+1], c=grid[(iy+1)*(gw+1)+ix], d=grid[(iy+1)*(gw+1)+ix+1];
    return lerp(lerp(a,b,s(tx)),lerp(c,d,s(tx)),s(ty)); };
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const fibre = Math.sin(x*0.013+y*0.0035+Math.sin(y*0.002)*3)*0.5 + Math.sin(x*0.0021-y*0.011)*0.5;
    N[y*W+x] = (rnd()-0.5)*1.0 + fibre*0.14 + vn(x,y)*0.22;
  }
  return N;
}
function finish(){
  if (!TEX) return;
  if (!TOOTH) TOOTH = buildTooth();
  const img = g.getImageData(0,0,W,H), d = img.data;
  for (let i=0,p=0;i<d.length;i+=4,p++){
    const n = TOOTH[p];
    const lum = (d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11)/255;
    const amp = 7.5 - lum*2.5;                 // a touch more tooth in the darker inks
    d[i]   = clamp(d[i]  + n*amp, 0, 255);
    d[i+1] = clamp(d[i+1]+ n*amp, 0, 255);
    d[i+2] = clamp(d[i+2]+ n*amp*0.85, 0, 255);
  }
  g.putImageData(img,0,0);
}
export { disc, poly, rect, line, arc, cross, text, measure, runs, finish };
