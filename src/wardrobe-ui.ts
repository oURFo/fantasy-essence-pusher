import {WARDROBE_ITEMS,WARDROBE_SLOTS,type WardrobeLook,type WardrobeSlot,WardrobeProfile} from './wardrobe.ts';
import type {AvatarBody,LobbyWorld} from './lobby-world.ts';
import {drawRigAvatar,type RigArtwork} from './avatar-rendering.ts';
import type {AvatarDirection} from './avatar-motion.ts';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
export function initWardrobe(world:LobbyWorld,profile:WardrobeProfile,onClose:()=>void){
 const picker=$<HTMLDialogElement>('avatar-picker');
 let draft:Record<AvatarBody,WardrobeLook>={male:profile.look('male'),female:profile.look('female')},body:AvatarBody='male',slot:WardrobeSlot='suit',walking=false,bare=false,directionIndex=0;
 const directions:AvatarDirection[]=['down','right','up','left'],directionNames=['正面','右側','背面','左側'];
 const tabs=$('wardrobe-tabs');
 for(const [key,name] of Object.entries(WARDROBE_SLOTS)){const button=document.createElement('button');button.type='button';button.textContent=name;button.dataset.slot=key;button.addEventListener('click',()=>{slot=key as WardrobeSlot;update();});tabs.append(button);}
 function update(){
  document.querySelectorAll<HTMLButtonElement>('[data-wardrobe-body]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wardrobeBody===body)));
  tabs.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.slot===slot)));
  const items=$('wardrobe-items');items.replaceChildren();
  for(const item of WARDROBE_ITEMS[slot]){const b=document.createElement('button');b.type='button';b.className='wardrobe-item';b.setAttribute('aria-pressed',String(draft[body][slot]===item.id));const swatch=document.createElement('span');swatch.className='wardrobe-swatch';swatch.style.setProperty('--swatch',item.color);swatch.textContent=slot==='effect'?'預留':slot==='expression'?({smile:'☺',laugh:'☻',wink:'😉',surprise:'!'} as Record<string,string>)[item.id]??'':item.name.slice(0,2);if(slot==='effect'){b.disabled=true;b.title='周身特效尚未啟用';}b.append(swatch,document.createTextNode(item.name));b.addEventListener('click',()=>{bare=false;(draft[body] as Record<string,string>)[slot]=item.id;update();items.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus({preventScroll:true});});items.append(b);}
  $('wardrobe-equipped').textContent=(Object.keys(WARDROBE_SLOTS) as WardrobeSlot[]).map(s=>WARDROBE_ITEMS[s].find(i=>i.id===draft[body][s])!.name).join(' · ');
  $('avatar-preview-base').setAttribute('aria-pressed',String(bare));$('avatar-preview-status').textContent=`${bare?'共用素體 · ':''}${walking?'行走':'待機'} · ${directionNames[directionIndex]}`;
  $('avatar-preview-walk').textContent=walking?'預覽待機':'預覽走路';$('avatar-preview-walk').setAttribute('aria-pressed',String(walking));
 }
 document.querySelectorAll<HTMLButtonElement>('[data-wardrobe-body]').forEach(b=>b.addEventListener('click',()=>{body=b.dataset.wardrobeBody as AvatarBody;update();}));
 $('avatar-preview-base').addEventListener('click',()=>{bare=!bare;update();});
 $('avatar-preview-turn').addEventListener('click',()=>{directionIndex=(directionIndex+1)%4;update();});
 $('avatar-preview-walk').addEventListener('click',()=>{walking=!walking;update();});
 $('wardrobe-reset').addEventListener('click',()=>{draft[body]=profile.look(body);update();});
 $('wardrobe-save').addEventListener('click',()=>{profile.commit(draft);world.choose(body);picker.close();onClose();});
 $('avatar-picker-cancel').addEventListener('click',()=>{if(world.appearance){picker.close();onClose();}});
 picker.addEventListener('cancel',event=>{if(!world.appearance)event.preventDefault();else onClose();});
 return {
  open(){if(picker.open)return;draft={male:profile.look('male'),female:profile.look('female')};body=world.appearance?.body??'male';walking=false;bare=false;directionIndex=0;$('avatar-picker-title').textContent=world.appearance?'我的衣櫃':'歡迎光臨！打造你的角色';$('avatar-picker-cancel').hidden=!world.appearance;update();picker.showModal();},
  draw(art:RigArtwork,time:number,reduced:boolean){if(!picker.open)return;const canvas=$<HTMLCanvasElement>('wardrobe-preview'),ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height-35);ctx.scale(1.45,1.45);drawRigAvatar(ctx,art,draft[body],directions[directionIndex],walking,time/1000*180,0,0,reduced,bare);ctx.restore();},
 };
}
