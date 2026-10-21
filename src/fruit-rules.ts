export const FRUIT_COST=20,FRUIT_BALLS=16;
export const FRUIT_NAMES=['蘋果','西洋梨','柳橙','檸檬','萊姆','葡萄柚','水蜜桃','杏桃','李子','櫻桃','草莓','覆盆莓','藍莓','黑莓','葡萄','鳳梨','香蕉','西瓜','哈密瓜','奇異果','芒果','木瓜','火龍果','百香果','荔枝','龍眼','芭樂','楊桃','柿子','石榴','椰子','無花果','椰棗','榴槤','菠蘿蜜','酪梨'] as const;
const rare=new Map([[0,435],[5,445],[10,455],[15,465]]),common=[676,677,678,679,681,682,683,685,686,690,691,692];
let cursor=0,commonIndex=0;
export const FRUIT_CELLS=Array.from({length:16},(_,id)=>({id,weight:rare.get(id)??common[commonIndex++],fruits:Array.from({length:rare.has(id)?3:2},()=>cursor++)}));
export function cellFor(unit:number){let ticket=Math.min(1-Number.EPSILON,Math.max(0,unit))*10000;for(const cell of FRUIT_CELLS){ticket-=cell.weight;if(ticket<0)return cell.id;}return 15;}
export function combinationChance(slots:readonly number[]){let chance=0;for(let mask=0;mask<8;mask++){let p=0,n=0;for(let i=0;i<3;i++)if(mask&(1<<i)){p+=FRUIT_CELLS[slots[i]].weight/10000;n++;}chance+=(n%2?-1:1)*(1-p)**FRUIT_BALLS;}return chance;}
const groups=[[0,5,10],[1,6,11],[2,7,12],[3,8,13],[4,9,14],[0,6,15],[1,7,14],[2,8,11],[3,12,15],[4,5,13],[0,7,9],[1,8,10],[2,6,13],[3,5,14],[10,11,15]];
const used=Array(16).fill(0);
export const FRUIT_RECIPES=groups.map((slots,id)=>({id,slots,fruits:slots.map(slot=>{const c=FRUIT_CELLS[slot];return c.fruits[used[slot]++%c.fruits.length];}),chance:combinationChance(slots)}));
export function completedRecipes(mask:number){return FRUIT_RECIPES.filter(r=>r.slots.every(slot=>mask&(1<<slot)));}
// One whole-round award selected solely by completed recipe count.
export const FRUIT_PAYOUTS=[0,0,0,15,20,25,40,55,75,100,150,250,500,1000,2000,5000] as const;
export function fruitPayout(mask:number){return FRUIT_PAYOUTS[completedRecipes(mask).length];}
export const GIFT_WEIGHTS=[55,25,12,6,2];
export function giftCount(unit:number){let ticket=Math.min(1-Number.EPSILON,Math.max(0,unit))*100;for(let i=0;i<5;i++){ticket-=GIFT_WEIGHTS[i];if(ticket<0)return i+1;}return 5;}
export function giftCells(random:()=>number){const pool=Array.from({length:16},(_,i)=>i),n=giftCount(random()),out:number[]=[];for(let i=0;i<n;i++){const at=Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)));out.push(pool.splice(at,1)[0]);}return out;}
