export const FORGE_HITS=[1.35,1.95,2.55] as const;
const poses=[{t:0,a:-1.05},{t:.85,a:-1.15},{t:1.05,a:-1.15},{t:1.35,a:0},{t:1.39,a:0},{t:1.52,a:-.28},{t:1.75,a:-1.1},{t:1.95,a:0},{t:1.99,a:0},{t:2.14,a:-.3},{t:2.32,a:-1.15},{t:2.55,a:0},{t:2.59,a:0},{t:2.75,a:-.26},{t:2.95,a:-.9}];
export function forgeHammerAngle(time:number){for(let i=1;i<poses.length;i++){const a=poses[i-1],b=poses[i];if(time<=b.t){const p=Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t))),strike=b.a===0&&a.a<0,e=strike?p*p*p:1-(1-p)**2;return a.a+(b.a-a.a)*e;}}return poses.at(-1)!.a;}
