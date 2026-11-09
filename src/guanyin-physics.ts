import {GUANYIN,GUANYIN_PINS,GUANYIN_SLOT,GUANYIN_OUTS} from './guanyin-rules.ts';
export interface GuanyinBall{id:number;x:number;y:number;vx:number;vy:number;age:number;rail:number;power:number;variation:number;done:boolean;result:'score'|'slot'|'out'|null;source:'paid'|'gift'|'bottle';rest:number;}
const grid=new Map<string,typeof GUANYIN_PINS>();for(const p of GUANYIN_PINS){const key=Math.floor(p.x/64)+','+Math.floor(p.y/64);const list=grid.get(key)??[];list.push(p);grid.set(key,list);}
export function guanyinBall(id:number,power:number,unit:number,source:GuanyinBall['source']='paid'):GuanyinBall{return {id,x:source==='paid'?122:source==='bottle'?352:805,y:source==='paid'?1280:source==='bottle'?380:460,vx:source==='paid'?0:source==='bottle'?(unit-.5)*200:-(130+unit*180),vy:source==='paid'?0:70,age:0,rail:source==='paid'?0:1,power:Math.max(1,Math.min(15,power)),variation:unit-.5,done:false,result:null,source,rest:0};}
function contact(b:GuanyinBall,x:number,y:number,r:number){const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy),min=8+r;if(d>=min)return;const nx=d?dx/d:1,ny=d?dy/d:0;b.x=x+nx*(min+.03);b.y=y+ny*(min+.03);const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=v*nx*1.32;b.vy-=v*ny*1.32;}if(ny<-.97&&Math.abs(b.vx)<16)b.vx+=(b.id%2?1:-1)*22;}
function swept(b:GuanyinBall,ox:number,oy:number,x:number,y:number,r:number){const dx=b.x-ox,dy=b.y-oy,t=Math.max(0,Math.min(1,((x-ox)*dx+(y-oy)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(ox+dx*t-x,oy+dy*t-y)<r;}
export function guanyinGateX(x:number,closed:number){return x+(1-closed)*(GUANYIN.outRadius*2+24);}
export function stepGuanyinBall(b:GuanyinBall,gate:number,dt=1/120){if(b.done)return;b.age+=dt;
 if(b.rail<1){b.rail=Math.min(1,b.rail+dt/.85);const f=b.rail;if(f<.65){b.x=122;b.y=1280-940*f/.65;}else{const t=(f-.65)/.35;b.x=122+(160+b.power*43+b.variation*25-122)*t;b.y=340-32*Math.sin(t*Math.PI);}if(b.rail===1){b.vx=40+b.power*2;b.vy=40;}return;}
 const ox=b.x,oy=b.y;b.vy+=GUANYIN.gravity*dt;b.vx*=Math.exp(-.12*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<154){b.x=154;b.vx=Math.abs(b.vx)*.3;}if(b.x>870){b.x=870;b.vx=-Math.abs(b.vx)*.3;}
 const gx=Math.floor(b.x/64),gy=Math.floor(b.y/64);for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const p of grid.get(x+','+y)??[])contact(b,p.x,p.y,p.r);
 // Moving shutters are solid collision geometry, including during travel.
 for(const p of GUANYIN_OUTS){const x=guanyinGateX(p.x,gate),half=GUANYIN.outRadius+7;const left=Math.max(p.x-half,x-half),right=Math.min(p.x+half,x+half);if(gate>.001&&right>left&&b.x>left-8&&b.x<right+8&&Math.abs(b.y-1100)<18)contact(b,Math.max(left,Math.min(right,b.x)),1100,7);}
 if(swept(b,ox,oy,GUANYIN_SLOT.x,GUANYIN_SLOT.y,GUANYIN_SLOT.r)){b.done=true;b.result='slot';return;}
 for(const p of GUANYIN_OUTS)if(swept(b,ox,oy,p.x,p.y,p.r)){b.done=true;b.result='out';return;}
 b.rest=Math.hypot(b.x-ox,b.y-oy)<.12?b.rest+dt:0;if(b.rest>.3){b.vx+=(b.id%2?1:-1)*28;b.rest=0;}
 if(b.y>1215){b.done=true;b.result='score';}
}
export function guanyinContacts(balls:GuanyinBall[]){const cells=new Map<string,GuanyinBall[]>();for(const b of balls){if(b.done||b.rail<1)continue;const gx=Math.floor(b.x/20),gy=Math.floor(b.y/20);for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const a of cells.get(x+','+y)??[]){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=16)continue;const nx=d?dx/d:1,ny=d?dy/d:0,o=(16-d)/2+.02;b.x+=nx*o;b.y+=ny*o;a.x-=nx*o;a.y-=ny*o;const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){a.vx+=v*.5*nx;a.vy+=v*.5*ny;b.vx-=v*.5*nx;b.vy-=v*.5*ny;}}const key=gx+','+gy,cell=cells.get(key)??[];cell.push(b);cells.set(key,cell);}}
