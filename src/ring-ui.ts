import {NightMarket} from './ring-game.ts';
import {RING_PACKS,RING_PRIZES,RING_ROWS} from './ring-rules.ts';
import {ringPrizeIcon} from './ring-rendering.ts';
export function initRingUI(getGame:()=>NightMarket|null,blocked:()=>boolean,changed:()=>void){
 const $=(id:string)=>document.getElementById(id)!;let revision='';const iconUrls=new Map<number,string>();
 RING_PACKS.forEach((pack,i)=>{const b=document.createElement('button');b.type='button';b.id=`ring-buy-${i}`;b.textContent=`${pack.cost} 金幣 / ${pack.rings} 個圈`;b.addEventListener('click',()=>{if(!blocked()){getGame()?.buy(i);changed();}});$('ring-shop').append(b);});
 RING_ROWS.forEach((r,i)=>{const p=document.createElement('p');p.textContent=`第 ${i+1} 排 · ${r.name}：${r.price} 金幣 / 件`;$('ring-prices').append(p);});
 $('ring-sell-all').addEventListener('click',()=>{if(!blocked()){getGame()?.sell();changed();}});
 return{update(g:NightMarket){
  $('ring-count').textContent=String(g.rings);$('ring-bag-total').textContent=`${g.bagCount} 件 · 可售 ${g.bagValue.toLocaleString()} 金幣`;$('ring-message').textContent=g.message;
  RING_PACKS.forEach((p,i)=>($(`ring-buy-${i}`) as HTMLButtonElement).disabled=blocked()||g.gold<p.cost);
  ($('ring-sell-all') as HTMLButtonElement).disabled=blocked()||g.bagValue===0;
  const key=g.inventory.join(',')+String(blocked());if(key===revision)return;revision=key;$('ring-bag-items').replaceChildren();
  if(!g.bagCount){const p=document.createElement('p');p.className='hint';p.textContent='背包還是空的。套中的獎品會飛進這裡，出售後才換成金幣。';$('ring-bag-items').append(p);}
  for(const p of RING_PRIZES){if(!g.inventory[p.id])continue;const row=document.createElement('div');row.className='ring-bag-item';const image=document.createElement('img');const iconKey=p.sprite*4+p.variant;if(!iconUrls.has(iconKey))iconUrls.set(iconKey,ringPrizeIcon(p.id).toDataURL());image.src=iconUrls.get(iconKey)!;image.alt=p.name;const label=document.createElement('span');label.textContent=`${p.name} × ${g.inventory[p.id]}\n${p.price} 金幣 / 件`;const b=document.createElement('button');b.type='button';b.textContent='賣出';b.disabled=blocked();b.addEventListener('click',()=>{if(!blocked()){getGame()?.sell(p.id);changed();}});row.append(image,label,b);$('ring-bag-items').append(row);}
 }};
}
