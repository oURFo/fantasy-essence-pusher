export const RING_PACKS=[{cost:100,rings:30},{cost:300,rings:100},{cost:500,rings:200}] as const;
export const RING_ROWS=[
 {name:'小玩具',price:5,height:.64,radius:.13},
 {name:'牛奶・果汁',price:10,height:.74,radius:.145},
 {name:'汽水',price:20,height:.83,radius:.155},
 {name:'啤酒',price:35,height:.9,radius:.16},
 {name:'紅酒・白酒',price:60,height:1.02,radius:.17},
 {name:'洋酒',price:100,height:1.08,radius:.174},
] as const;
const names=[['星光機器人','蜜桃機器人','翡翠機器人','琥珀機器人'],['原味鮮乳','柳橙果汁','牧場牛奶','青蘋果汁'],['柳橙汽水','經典可樂','青檸汽水','莓果汽水'],['金標啤酒','琥珀啤酒','翡翠啤酒','麥香啤酒'],['珍藏紅酒','白葡萄酒','酒莊紅酒','金標白酒'],['琥珀威士忌','金標白蘭地','翡翠琴酒','珍藏蘭姆酒']];
const sprites=[[0,0,0,0],[1,8,1,11],[2,10,2,2],[3,3,3,3],[4,9,4,9],[5,5,5,5]];
export const RING_PRIZES=RING_ROWS.flatMap((r,row)=>Array.from({length:8},(_,col)=>({id:row*8+col,row,col,x:(col-3.5)*.82,z:1.5+row*1.6,base:.18+row*.1,height:r.height,radius:r.radius,price:r.price,name:names[row][col%4],sprite:sprites[row][col%4],variant:col%4})));
export const RING_PLATFORMS=RING_ROWS.map((_,row)=>({row,height:.18+row*.1,left:-3.5,right:3.5,front:1.5+row*1.6-.45,back:1.5+row*1.6+.45}));
export const HOOP={inner:.18,outer:.225,gravity:9.8} as const;
export function ringProjection(x:number,z:number,height=0){const scale=1/(1+.035*z);return{x:512+x*108*scale,y:1190-z*95*scale-height*110*scale,scale};}

export const RING_HIT_TOLERANCE=1.3;
export function ringClearance(radius:number){return (HOOP.inner-radius)*RING_HIT_TOLERANCE;}
