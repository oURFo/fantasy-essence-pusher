// Fifteen finer settings span the original physical range instead of overshooting the board.
export const LEFT_POWER_STEPS=15;
export const RIGHT_SHOT_DIAL=LEFT_POWER_STEPS+1;
export function clampLeftPower(value:number){return Math.max(1,Math.min(LEFT_POWER_STEPS,value));}
export function physicalLaunchPower(value:number){return 1+(clampLeftPower(value)-1)*9/(LEFT_POWER_STEPS-1);}
