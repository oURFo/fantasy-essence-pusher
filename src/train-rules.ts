export const TRAIN={rtp:.95,maxBet:3,pointsPerGold:10,shotInterval:.5,scroll:42,speed:1450,arcHeight:55,coefficient:0.6998047,missionRatio:.1,failedCreditRate:.25,loopWidth:1230} as const;
export const TRAIN_KEY='fantasy-arcade.train-tail.v1';
export const TRAIN_ITEMS=[
 {name:'鋁罐',points:60,w:58,h:76,material:'metal'},
 {name:'木箱',points:110,w:88,h:76,material:'wood'},
 {name:'蘋果',points:50,w:58,h:58,material:'fruit'},
 {name:'大象玩偶',points:720,w:106,h:87,material:'toy'},
 {name:'禮物盒',points:180,w:76,h:70,material:'wood'},
 {name:'小鴨',points:95,w:66,h:60,material:'toy'},
 {name:'小桌子',points:150,w:116,h:90,material:'wood'},
 {name:'西瓜',points:270,w:78,h:65,material:'fruit'},
 {name:'油桶',points:130,w:70,h:86,material:'metal'},
 {name:'機器人',points:540,w:78,h:92,material:'toy'},
 {name:'積木',points:70,w:66,h:60,material:'toy'},
 {name:'恐龍玩具',points:390,w:92,h:84,material:'toy'},
 {name:'牛奶瓶',points:120,w:48,h:86,material:'glass'},
 {name:'甜甜圈',points:35,w:64,h:48,material:'fruit'},
 {name:'寶箱',points:1440,w:94,h:76,material:'wood'},
 {name:'招財貓',points:3600,w:82,h:98,material:'glass'},
] as const;
// Each array is a single, unambiguous support chain, bottom to top.
export const TRAIN_COMBOS=[
 {name:'經典三罐',items:[0,0,0],values:[60,90,60]},
 {name:'蘋果小站',items:[1,2]}, {name:'大象平衡術',items:[0,3]},
 {name:'小鴨的禮物',items:[1,4,5]}, {name:'西瓜野餐',items:[6,7]},
 {name:'機器人工坊',items:[8,9]}, {name:'恐龍積木塔',items:[10,10,11]},
 {name:'早餐快車',items:[1,12,13]}, {name:'鴨鴨高塔',items:[8,5]},
 {name:'大象的行李',items:[1,4,3]}, {name:'甜甜下午茶',items:[6,12,13]},
 {name:'水果疊疊樂',items:[1,7,2]}, {name:'馬戲團來了',items:[6,0,3]},
 {name:'玩具運輸隊',items:[1,9,5]}, {name:'彩色罐罐塔',items:[8,0,0]},
 {name:'海盜寶藏',items:[8,14]}, {name:'金貓招好運',items:[1,15]},
 {name:'奇趣全家福',items:[6,14,15]},
] as const;
export const TRAIN_MISSIONS=TRAIN_ITEMS.slice(0,12).flatMap((item,type)=>[5,12].map(count=>({id:type*2+(count===12?1:0),type,count,reward:Math.max(1,Math.floor(item.points*count*TRAIN.missionRatio)),label:`破壞${count}個${item.name}`})));
export function trainChance(total:number,bet:number,coefficient:number=TRAIN.coefficient){return total>0?Math.min(.98,Math.max(0,10*bet*coefficient/total)):0;}
export function trainSeed(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

export const TRAIN_BETS=[1,2,3] as const;
