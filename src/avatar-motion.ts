export type AvatarDirection='down'|'up'|'left'|'right';
export const WALK_STRIDE=108;
/** Six poses per full left/right step cycle, paced by ground distance. */
export function avatarPose(direction:AvatarDirection,walking:boolean,distance:number,reducedMotion=false){
 const view=direction==='up'?2:direction==='left'||direction==='right'?1:0;
 const column=walking&&!reducedMotion?Math.floor(Math.max(0,distance)/WALK_STRIDE*6)%6:view;
 return {row:walking&&!reducedMotion?view:3,column,flip:direction==='left'};
}
