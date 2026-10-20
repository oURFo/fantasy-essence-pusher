// One shared front edge defines both the physical reward width and its artwork.
export const SKY_FRONT={halfWidth:3.65,rewardHalfWidth:3.65/2,edgeZ:6.8,panelTop:1100,panelHeight:380,jewelY:1137} as const;
export function skyProject(x:number,y:number,z:number){
 const depth=Math.min(SKY_FRONT.edgeZ,Math.max(0,z));
 return{x:512+x*(z>.8?83+25*depth/7:87),y:800-y*48+z*44};
}
export function skyExitEdges(){
 return[-SKY_FRONT.halfWidth,-SKY_FRONT.rewardHalfWidth,SKY_FRONT.rewardHalfWidth,SKY_FRONT.halfWidth].map(x=>skyProject(x,0,SKY_FRONT.edgeZ).x);
}
