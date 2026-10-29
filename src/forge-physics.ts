// The outcome selects a fully simulated collision route. Every route shares the
// same physical launch rail and exit; no arbitrary entry-point interpolation.
export const FORGE_PORTS=[195,301,407,513,619,725,831] as const;
export const FORGE_PINS=Array.from({length:8},(_,row)=>Array.from({length:row%2?6:7},(_,col)=>({x:190+col*105+(row%2?52.5:0),y:410+row*76,r:12}))).flat();
const EXIT_ANGLE=65*Math.PI/180;
export const FORGE_RAIL={x:932,bottom:1190,curveY:500,cx:682,cy:500,radius:250,straight:690,angle:EXIT_ANGLE,length:690+250*EXIT_ANGLE,exitX:682+250*Math.cos(EXIT_ANGLE),exitY:500-250*Math.sin(EXIT_ANGLE)};
interface RailPoint{x:number;y:number;t:number;}
interface RailTrace{points:RailPoint[];duration:number;exited:boolean;speed:number;}
export interface ForgePath{points:{x:number;y:number}[];duration:number;port:number;contacts:number;launch:number;power:number;railPoints:RailPoint[];exitVelocity:{x:number;y:number};}
const traces=new Map<number,RailTrace>(),banks=new Map<number,ForgePath[][]>();
export function forgeRailPoint(distance:number){const s=Math.max(0,Math.min(FORGE_RAIL.length,distance));if(s<=690)return {x:932,y:1190-s,tx:0,ty:-1};const a=(s-690)/250;return {x:682+250*Math.cos(a),y:500-250*Math.sin(a),tx:-Math.sin(a),ty:-Math.cos(a)};}
export function forgeLaunchSpeed(power:number){return 220+2100*Math.sqrt(Math.max(.01,Math.min(1,power)));}
function railTrace(power:number):RailTrace{const key=Number(power.toFixed(4)),saved=traces.get(key);if(saved)return saved;const dt=1/240,v0=forgeLaunchSpeed(key),points:RailPoint[]=[{x:932,y:1190,t:0}];let s=0,v=v0,t=0,exited=false;
 for(let i=0;i<240*12;i++){const oldS=s,oldT=t,a=1050*forgeRailPoint(s).ty,half=v+a*dt/2;s+=half*dt;v=half+1050*forgeRailPoint(s).ty*dt/2;t+=dt;
  if(s>=FORGE_RAIL.length){t=oldT+dt*(FORGE_RAIL.length-oldS)/(s-oldS);points.push({x:FORGE_RAIL.exitX,y:FORGE_RAIL.exitY,t});exited=true;break;}
  if(s<=0&&i>0){points.push({x:932,y:1190,t});break;}
  if(i%2===1){const p=forgeRailPoint(s);points.push({x:p.x,y:p.y,t});}
 }
 const result={points,duration:t,exited,speed:exited?Math.sqrt(Math.max(0,v0*v0-2*1050*(FORGE_RAIL.bottom-FORGE_RAIL.exitY))):0};if(traces.size>=32)traces.delete(traces.keys().next().value!);traces.set(key,result);return result;}
function railPosition(points:RailPoint[],time:number){let lo=0,hi=points.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(points[mid].t<=time)lo=mid;else hi=mid;}const a=points[lo],b=points[hi],f=Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t||1)));if(a.y<=500&&b.y<=500){const aa=Math.atan2(500-a.y,a.x-682),ab=Math.atan2(500-b.y,b.x-682),angle=aa+(ab-aa)*f;return {x:682+250*Math.cos(angle),y:500-250*Math.sin(angle)};}return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}
export function forgeCanLaunch(power:number){return forgeLaunchSpeed(power)**2/(2*1050)>FORGE_RAIL.bottom-FORGE_RAIL.exitY+.05&&railTrace(power).exited;}
export function forgeReturnDuration(power:number){return railTrace(power).duration;}
export function forgeReturnPosition(power:number,time:number){return railPosition(railTrace(power).points,time);}
function simulate(power:number,trace:RailTrace,seed:number):ForgePath|null{const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};let x=FORGE_RAIL.exitX,y=FORGE_RAIL.exitY,vx=-trace.speed*Math.sin(FORGE_RAIL.angle),vy=-trace.speed*Math.cos(FORGE_RAIL.angle),contacts=0,lockedPort=-1;const dt=1/120,points=[{x,y}];
 for(let i=0;i<120*10;i++){x+=vx*dt;y+=vy*dt+525*dt*dt;vy+=1050*dt;if(y<226){y=226;vy=Math.abs(vy)*.52;}if(x<153){x=153;vx=Math.abs(vx)*.52;}if(x>873){x=873;vx=-Math.abs(vx)*.52;}
  for(const p of FORGE_PINS){if(Math.abs(y-p.y)>26)continue;const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);if(d<26){const nx=dx/(d||1),ny=dy/(d||1);x=p.x+nx*26.02;y=p.y+ny*26.02;const dot=vx*nx+vy*ny;if(dot<0){contacts++;const restitution=1.25+rand()*.4;vx-=restitution*dot*nx;vy-=restitution*dot*ny;}}}
  if(y>=1020){if(lockedPort<0)lockedPort=Math.max(0,Math.min(6,Math.floor((x-142)/106)));const cx=FORGE_PORTS[lockedPort],half=Math.max(14,50-(y-1020)*.45);if(x<cx-half){x=cx-half;vx=Math.abs(vx)*.5;}if(x>cx+half){x=cx+half;vx=-Math.abs(vx)*.5;}}
  if(i%2===1)points.push({x,y});if(y>=1100){const port=Math.max(0,Math.min(6,Math.floor((x-142)/106)));points.push({x,y:1100});return {points,duration:(points.length-1)/60,port,contacts,launch:trace.duration,power,railPoints:trace.points,exitVelocity:{x:-trace.speed*Math.sin(FORGE_RAIL.angle),y:-trace.speed*Math.cos(FORGE_RAIL.angle)}};}
 }return null;}
function bankFor(power:number){const key=Number(Math.max(.01,Math.min(1,power)).toFixed(4)),saved=banks.get(key);if(saved)return saved;const trace=railTrace(key);if(!trace.exited)throw Error('Insufficient launch energy');const bank:ForgePath[][]=Array.from({length:7},()=>[]);
 for(let i=0;i<12000&&!bank.every(b=>b.length>=8);i++){const path=simulate(key,trace,(Math.imul(i+1,7919)+13)>>>0);if(path&&path.contacts>=3&&path.duration<8&&bank[path.port].length<8)bank[path.port].push(path);}
 if(bank.some(b=>b.length===0))throw Error('No collision route at this launch power');if(banks.size>=12)banks.delete(banks.keys().next().value!);banks.set(key,bank);return bank;}
export function prepareForgePaths(){bankFor(.65);}
export function forgePath(port:number,variant:number,power=.65){const bank=bankFor(power)[port];return bank[Math.abs(variant)%bank.length];}
export function forgePathCounts(){return bankFor(.65).map(b=>b.length);}
export function forgePowerPathCounts(){return [.35,.65,1].map(p=>bankFor(p).map(b=>b.length));}
export function forgeBallPosition(path:ForgePath,time:number){if(time<path.launch)return railPosition(path.railPoints,Math.max(0,time));const elapsed=Math.max(0,time-path.launch);if(elapsed<1/60)return {x:FORGE_RAIL.exitX+path.exitVelocity.x*elapsed,y:FORGE_RAIL.exitY+path.exitVelocity.y*elapsed+525*elapsed*elapsed};const idx=Math.min(path.points.length-1,elapsed*60),a=path.points[Math.floor(idx)],b=path.points[Math.min(path.points.length-1,Math.floor(idx)+1)],f=idx%1;return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}

