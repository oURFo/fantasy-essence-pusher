import {HOOP,RING_PRIZES} from './ring-rules.ts';
export type TossRing={x:number;z:number;y:number;vx:number;vz:number;vy:number;age:number;wind:number;angle:number;candidate:number|null;stable:number;done:boolean;hit:number|null;bounces:number};
export function launchRing(x:number,power:number,windUnit:number):TossRing{
 power=Math.max(0,Math.min(1,power));const wind=(Math.max(0,Math.min(1,windUnit))*4-2)*Math.PI/180,vz=2.2+power*11.4;
 return{x:Math.max(-3.4,Math.min(3.4,x)),z:-2.15,y:.68,vx:Math.tan(wind)*vz,vz,vy:4.3+power*.6,age:0,wind,angle:0,candidate:null,stable:0,done:false,hit:null,bounces:0};
}
export function stepRing(r:TossRing,dt=1/120){
 if(r.done)return;r.age+=dt;r.angle+=dt*4;const oldY=r.y,oldX=r.x,oldZ=r.z;r.vy-=HOOP.gravity*dt;r.x+=r.vx*dt;r.z+=r.vz*dt;r.y+=r.vy*dt;
 for(const p of RING_PRIZES){
  if(r.y>p.height||r.y<0)continue;
  const clearance=HOOP.inner-p.radius;
  // Interpolate the neck-plane crossing so fast far-row throws cannot tunnel through.
  if(oldY>p.height&&r.y<=p.height&&r.vy<0){const t=(oldY-p.height)/(oldY-r.y),cx=oldX+(r.x-oldX)*t,cz=oldZ+(r.z-oldZ)*t,cd=Math.hypot(cx-p.x,cz-p.z);
   if(cd<clearance){r.candidate=p.id;r.x=cx+(r.x-cx)*.08;r.z=cz+(r.z-cz)*.08;r.vx*=.08;r.vz*=.08;}
   else if(cd<HOOP.outer+p.radius){r.x=cx;r.z=cz;r.y=p.height+.012;r.vy=Math.abs(r.vy)*.2;r.candidate=null;r.bounces++;}
  }
  const dx=r.x-p.x,dz=r.z-p.z,d=Math.hypot(dx,dz);
  if(d>clearance&&d<HOOP.outer+p.radius){
   const nx=d?dx/d:1,nz=d?dz/d:0,inside=r.candidate===p.id;
   const wall=inside?clearance:HOOP.outer+p.radius;
   const impact=r.vx*nx+r.vz*nz;
   r.x=p.x+nx*wall;r.z=p.z+nz*wall;
   if((inside&&impact>0)||(!inside&&impact<0)){r.vx-=1.32*impact*nx;r.vz-=1.32*impact*nz;r.bounces++;}
   if(oldY>p.height){r.y=p.height+.012;r.vy=Math.abs(r.vy)*.2;r.candidate=null;}
  }
 }
 if(r.y<=.025){r.y=.025;if(r.vy<-.3){r.vy=-r.vy*.18;r.bounces++;}else r.vy=0;const drag=Math.exp(-12*dt);r.vx*=drag;r.vz*=drag;
  if(Math.hypot(r.vx,r.vz)<.15){r.stable+=dt;if(r.stable>=.3){const p=r.candidate===null?null:RING_PRIZES[r.candidate];r.hit=p&&Math.hypot(r.x-p.x,r.z-p.z)<=HOOP.inner-p.radius?p.id:null;r.done=true;}}
 }
 if(r.age>6||Math.abs(r.x)>4.8||r.z>12){r.done=true;r.hit=null;}
}
