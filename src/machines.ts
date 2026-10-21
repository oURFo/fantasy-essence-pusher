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
  description:'讓十六顆星珠喚醒果園，點亮十五道星宴配方。',
  image:'fruit-banquet/cabinet.png',entryCost:20,
}] as const;
export type MachineId=typeof MACHINES[number]['id'];
