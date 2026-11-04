import type {MachineId} from './machines.ts';
// Only gameplay controls are mirrored; rules and payout tables never enter the stage.
export const FULLSCREEN_CONTROLS:Record<MachineId,readonly string[]>={
 'essence-vault':['drop','auto-drop'],
 'sky-wings':['drop','auto-drop'],
 'fruit-banquet':['drop'],
 'night-market':['ring-buy-0','ring-buy-1','ring-buy-2','ring-sell-all'],
 'fate-orbit':['fate-left','fate-fire','fate-right','fate-auto','fate-redeem'],
 'gold-mine':['mine-dial','mine-left','mine-stop','mine-right','mine-redeem'],
 'temple-fortune':['temple-dial','temple-start','temple-stop','temple-fire','temple-redeem'],
 'thunder-forge':['forge-power','forge-play','forge-auto'],
 'cultivation':[], // Joystick, upgrades, mana shop and pause are already inside the game.
 'wonder-train':['train-mobile-bet','train-fire','train-auto'],
};
export function fullscreenSize(w:number,h:number,viewportW:number,viewportH:number,chromeH:number){const scale=Math.max(.01,Math.min(Math.max(1,viewportW-16)/w,Math.max(1,viewportH-chromeH-16)/h));return {width:w*scale,height:h*scale};}
