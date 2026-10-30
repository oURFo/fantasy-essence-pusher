import type {AvatarBody} from './lobby-world.ts';
import type {WalletStorage} from './wallet.ts';

export const WARDROBE_KEY='fantasy-arcade.wardrobe.v2';
export const LEGACY_WARDROBE_KEY='fantasy-arcade.wardrobe.v1';
export const EFFECTS_ENABLED=false;
export const WARDROBE_ITEMS={
 hairStyle:[{id:'short',name:'俐落短髮',color:'#73513b'},{id:'bob',name:'柔順短髮',color:'#9b7054'},{id:'ponytail',name:'高馬尾',color:'#866149'}],
 hairColor:[{id:'brown',name:'栗棕',color:'#79513b'},{id:'honey',name:'蜂蜜金',color:'#c49653'},{id:'silver',name:'霧銀',color:'#a3a9b7'}],
 expression:[{id:'smile',name:'微笑',color:'#f0c47d'},{id:'laugh',name:'開心',color:'#efaa8b'},{id:'wink',name:'眨眼',color:'#c9b5e7'},{id:'surprise',name:'驚喜',color:'#a8d9d4'}],
 suit:[{id:'base',name:'標準素體',color:'#b5b8c2'},{id:'arcade',name:'遊樂場套裝',color:'#499f9e'},{id:'denim',name:'晴日丹寧套裝',color:'#a2b9ca'},{id:'rose',name:'珊瑚冒險套裝',color:'#db8a7e'}],
 accessory:[{id:'none',name:'不戴配飾',color:'#ebe5e1'},{id:'star',name:'星願髮夾',color:'#f2c660'},{id:'cap',name:'晴日棒球帽',color:'#edcc66'},{id:'cat',name:'貓耳髮箍',color:'#e9a2b8'},{id:'crown',name:'小小皇冠',color:'#d8ad4c'}],
 effect:[{id:'none',name:'未裝備特效',color:'#e5e0ed'}],
} as const;
export type WardrobeSlot=keyof typeof WARDROBE_ITEMS;
export type WardrobeLook={[K in WardrobeSlot]:typeof WARDROBE_ITEMS[K][number]['id']};
export const WARDROBE_SLOTS:Record<WardrobeSlot,string>={hairStyle:'髮型',hairColor:'髮色',expression:'表情',suit:'套裝',accessory:'配飾',effect:'特效'};
export function defaultLook(preset:AvatarBody='male'):WardrobeLook{return {hairStyle:preset==='female'?'ponytail':'short',hairColor:'brown',expression:'smile',suit:preset==='female'?'denim':'arcade',accessory:'none',effect:'none'};}
export function safeLook(value:unknown,fallback:WardrobeLook=defaultLook()):WardrobeLook{
 const look={...fallback};if(!value||typeof value!=='object')return look;
 for(const slot of Object.keys(look) as WardrobeSlot[]){const v=(value as Record<string,unknown>)[slot];if(WARDROBE_ITEMS[slot].some(item=>item.id===v))(look as Record<string,string>)[slot]=v as string;}
 if(!EFFECTS_ENABLED)look.effect='none';return look;
}
// Preset IDs are deliberately excluded: both saved looks use the exact same rig.
export function lookKey(_preset:AvatarBody,look:WardrobeLook){return `shared-rig-v2:${look.hairStyle}:${look.hairColor}:${look.expression}:${look.suit}:${look.accessory}:${look.effect}`;}
export function migrateLook(old:unknown,preset:AvatarBody):WardrobeLook{
 const value=old&&typeof old==='object'?old as Record<string,unknown>:{};
 return safeLook({hairStyle:preset==='female'?'ponytail':'short',hairColor:value.hair,accessory:value.head,expression:'smile',suit:value.top==='berry'?'rose':value.top==='sky'?'denim':preset==='female'?'rose':'arcade',effect:'none'},defaultLook(preset));
}
export class WardrobeProfile {
 private saved:Record<AvatarBody,WardrobeLook>={male:defaultLook(),female:defaultLook('female')};
 private storage?:WalletStorage;
 constructor(storage?:WalletStorage){this.storage=storage;
  let restored=false;
  try{const p=JSON.parse(storage?.getItem(WARDROBE_KEY)??'null');if(p?.version===2){this.saved={male:safeLook(p.male),female:safeLook(p.female,defaultLook('female'))};restored=true;}}catch{}
  if(!restored)try{const old=JSON.parse(storage?.getItem(LEGACY_WARDROBE_KEY)??'null');if(old?.version===1)this.saved={male:migrateLook(old.male,'male'),female:migrateLook(old.female,'female')};}catch{}
 }
 look(preset:AvatarBody){return {...this.saved[preset]};}
 commit(looks:Record<AvatarBody,WardrobeLook>){this.saved={male:safeLook(looks.male),female:safeLook(looks.female,defaultLook('female'))};try{this.storage?.setItem(WARDROBE_KEY,JSON.stringify({version:2,rig:'shared-v2',...this.saved}));}catch{}}
}
