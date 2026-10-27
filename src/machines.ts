export const MACHINES=[{
  id:'essence-vault',name:'秘境金庫',tag:'奇幻冒險 · 推珠 × SLOT',
  description:'讓精華穿越針陣，喚醒龍珠，開啟寶箱裡的命運。',
  image:'machine.png',entryCost:1,
},{
  id:'sky-wings',name:'空之翼',tag:'天空冒險 · 推珠 × 升階輪盤',
  description:'從浮島振翅，穿越蒼穹雲海，飛向金色天域。',
  image:'sky-wings/base.png',entryCost:1,
},{
  id:'fruit-banquet',name:'水果星宴',tag:'星光果園 · 十六彈珠 × 水果配方',
  description:'拉下右側拉把，控制星珠力道，喚醒盤面上的水果配方。',
  image:'fruit-banquet/cabinet.png',entryCost:20,
},{id:'night-market',name:'夜市拾寶',tag:'夜市套圈圈 · 戰利品背包',description:'把圈圈套進好運，把夜市戰利品帶回家。',image:'night-market/stall.png',entryCost:100},{id:'fate-orbit',name:'命運星軌',tag:'障礙射球 × 四層命運盤',description:'穿越星軌障礙，開啟四層命運，挑戰 9,999 積分。',image:'fate-orbit/cabinet.png',entryCost:3},{id:'gold-mine',name:'金礦傳說',tag:'柏青哥 × 金礦時間',description:'轉動旋鈕探尋礦脈，喚醒蒸汽列車，右打開啟耀眼金礦時間。',image:'gold-mine/cabinet.png',entryCost:1},{id:'temple-fortune',name:'土地公賜福',tag:'廟宇柏青哥 × 月曆祈福',description:'香火翻曆，恭迎福德正神；廟門開啟，祥雲金珠賜福。',image:'temple-fortune/cabinet.png',entryCost:1}] as const;
export type MachineId=typeof MACHINES[number]['id'];
