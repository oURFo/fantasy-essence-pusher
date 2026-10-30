import type {AvatarBody} from './lobby-world.ts';
import type {WalletStorage} from './wallet.ts';

export const WARDROBE_KEY='fantasy-arcade.wardrobe.v1';
export const WARDROBE_ITEMS={
 hair:[{id:'brown',name:'經典棕髮',color:'#754a32'},{id:'honey',name:'蜂蜜金髮',color:'#c49148'},{id:'silver',name:'霧銀髮色',color:'#a3a7b2'}],
 top:[{id:'classic',name:'經典外套',color:'#36a3a6'},{id:'sky',name:'晴空藍外套',color:'#529de0'},{id:'berry',name:'莓果紫外套',color:'#a577bf'},{id:'sun',name:'奶油黃外套',color:'#e2ba58'}],
 bottom:[{id:'classic',name:'經典下身',color:'#414e70'},{id:'lavender',name:'薰衣草下身',color:'#9d8fbe'},{id:'mint',name:'薄荷綠下身',color:'#7eac9a'}],
 shoes:[{id:'ivory',name:'奶白球鞋',color:'#f2ede4'},{id:'mint',name:'薄荷球鞋',color:'#7fc9b6'},{id:'gold',name:'暖黃球鞋',color:'#d8b871'}],
 head:[{id:'none',name:'不戴頭飾',color:'#ebe5e1'},{id:'star',name:'星願髮夾',color:'#f2c660'},{id:'cap',name:'晴日棒球帽',color:'#edcc66'},{id:'cat',name:'貓耳髮箍',color:'#e9a2b8'},{id:'crown',name:'小小皇冠',color:'#d8ad4c'}],
} as const;
export type WardrobeSlot=keyof typeof WARDROBE_ITEMS;
export type WardrobeLook={[K in WardrobeSlot]:typeof WARDROBE_ITEMS[K][number]['id']};
export const WARDROBE_SLOTS:Record<WardrobeSlot,string>={hair:'髮色',top:'上衣',bottom:'下身',shoes:'鞋子',head:'頭飾'};
export function defaultLook():WardrobeLook{return {hair:'brown',top:'classic',bottom:'classic',shoes:'ivory',head:'none'};}
export function safeLook(value:unknown):WardrobeLook{
 const look=defaultLook();if(!value||typeof value!=='object')return look;
 for(const slot of Object.keys(look) as WardrobeSlot[]){const v=(value as Record<string,unknown>)[slot];if(WARDROBE_ITEMS[slot].some(item=>item.id===v))(look as Record<string,string>)[slot]=v as string;}
 return look;
}
export function lookKey(body:AvatarBody,look:WardrobeLook){return `${body}:${look.hair}:${look.top}:${look.bottom}:${look.shoes}:${look.head}`;}
export class WardrobeProfile {
 private saved:Record<AvatarBody,WardrobeLook>={male:defaultLook(),female:defaultLook()};
 private storage?:WalletStorage;
 constructor(storage?:WalletStorage){this.storage=storage;try{const p=JSON.parse(storage?.getItem(WARDROBE_KEY)??'null');if(p?.version===1)this.saved={male:safeLook(p.male),female:safeLook(p.female)};}catch{/* Free wardrobe also works without storage. */}}
 look(body:AvatarBody){return {...this.saved[body]};}
 commit(looks:Record<AvatarBody,WardrobeLook>){this.saved={male:safeLook(looks.male),female:safeLook(looks.female)};try{this.storage?.setItem(WARDROBE_KEY,JSON.stringify({version:1,...this.saved}));}catch{}}
}
