import {WALK_STRIDE,type AvatarDirection} from './avatar-motion.ts';

/** All dimensions in the shared 136px avatar coordinate space. No sex variants. */
export const AVATAR_RIG={
 id:'shared-v2',height:136,
 head:{front:{x:-28,y:-136,w:56,h:54},side:{x:-25,y:-136,w:54,h:54},back:{x:-28,y:-136,w:56,h:54}},
 neck:{x:0,y:-83},shoulder:{x:14,y:-76},hip:{x:7,y:-44},knee:{x:7,y:-23},ankle:{x:7,y:-5},
 torso:{x:-18,y:-85,w:36,h:43},arm:{w:11,h:33},thigh:{w:11,h:24},calf:{w:10,h:21},shoe:{w:15,h:9},
 face:{front:{x:-17,y:-119,w:34,h:25},side:{x:9,y:-120,w:16,h:24}},
 mounts:{
  cap:[{x:-31,y:-144,w:62,h:36},{x:-27,y:-144,w:65,h:36},{x:-31,y:-144,w:62,h:36}],
  crown:[{x:-21,y:-151,w:42,h:26},{x:-20,y:-151,w:40,h:26},{x:-21,y:-151,w:42,h:26}],
  cat:[{x:-30,y:-151,w:60,h:51},{x:-12,y:-150,w:31,h:49},{x:-30,y:-151,w:60,h:51}],
  star:[{x:-27,y:-124,w:22,h:24},{x:-15,y:-125,w:22,h:24},{x:8,y:-124,w:22,h:24}],
 },
} as const;
export function rigMotion(direction:AvatarDirection,walking:boolean,distance:number,reduced=false){
 const phase=walking&&!reduced?Math.max(0,distance)/WALK_STRIDE*Math.PI*2:0,s=Math.sin(phase),active=walking&&!reduced;
 return {view:direction==='up'?2:direction==='left'||direction==='right'?1:0,flip:direction==='left',phase,active,bob:active?s*s*2:0,
  legs:[0,1].map(i=>{const p=phase+i*Math.PI;return {thigh:active?-Math.sin(p)*.34:0,knee:active?Math.max(0,-Math.cos(p))*.42:0,lift:active?Math.max(0,-Math.sin(p))*2:0};}),
  arms:active?[s*.24,-s*.24]:[0,0]};
}
export function rigMount(accessory:keyof typeof AVATAR_RIG.mounts,direction:AvatarDirection){return AVATAR_RIG.mounts[accessory][direction==='up'?2:direction==='left'||direction==='right'?1:0];}
