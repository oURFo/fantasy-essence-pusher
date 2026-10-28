import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const calibration=read('./temple-rtp-calibration-083.json'),validation=read('./temple-balance-results.json'),before=read('./temple-rtp-before.json');
const target=.92,p=validation.bonusChance,l=calibration.ledger,b=calibration.stages.base,g=calibration.stages.bonus;
const a=b.stageRtp,h=l.slotSpins/b.paidGold*l.bonusRuns/l.bonusAwards,v=g.returnedGold/l.bonusRuns,c=g.paidGold/l.bonusRuns;
const solvedP=(target-a)/(h*(v-target*c)),projected=(a+h*p*v)/(1+h*p*c);
const check=(a+h*solvedP*v)/(1+h*solvedP*c);assert.ok(Math.abs(check-target)<1e-12);
const format=n=>n.toLocaleString('en-US',{maximumFractionDigits:2}),pct=n=>(n*100).toFixed(2)+'%';
const summary={target,configuredBonusChance:p,projection:{baseReturnPerBaseCost:a,acceptedRunsPerBasePaidPerBonusProbability:h,goldPerBonusRun:v,paidCostPerBonusRun:c,solvedBonusChance:solvedP,projectedRtp:projected},validation:{shots:validation.shots,referenceRtp:validation.referenceRtp,interval:validation.runLevel95Interval,stages:validation.stages,bonusRuns:validation.ledger.bonusRuns},before:{shots:before.shots,referenceRtp:before.referenceRtp}};
fs.writeFileSync(new URL('./temple-rtp-summary.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
const sourceRows=['base','bonus'].flatMap((stage,i)=>{const d=validation.stages[stage];return[`|第${i+1}台面付費球|${format(d.paidBalls)}|${format(d.paidBalls)}|${format(d.paidPoints/10)}|`,`|第${i+1}台面免費球|${format(d.freeBalls)}|0|${format(d.freePoints/10)}|`];}).join('\n');
const stageRows=['base','bonus'].map((stage,i)=>{const d=validation.stages[stage];return`|第${i+1}台面（含該台免費球）|${format(d.paidGold)}|${format(d.returnedGold)}|${d.stageRtp===null?'無付費成本':pct(d.stageRtp)}|${pct(d.contributionToTotal)}|`;}).join('\n');
const table=validation.calendar.map(r=>`|${r.label}|${r.chance}%|${r.balls?r.balls+' 珠':r.label==='二月初二'?'開廟100秒':'未中獎'}|`).join('\n');
const doc=`# 土地公完整雙台面 RTP 與 92% 校準

日期：2026-10-28。版本基準：15段左打、蛇洞龜洞各20積分、每球1金幣、10積分換1金幣。

## 結果

- 設計目標：92%。以完整模擬取得局部更新週期模型，將二月初二開廟率調為每次SLOT **${pct(p)}**，模型預估 **${pct(projected)}**。
- 獨立驗證：${format(validation.shots)}顆付費球，${validation.runs}個新種子，每種子${format(validation.shotsPerRun)}球；完整實測 **${pct(validation.referenceRtp)}**。
- 按獨立重複樣本估算的95%區間：**${pct(validation.runLevel95Interval[0])}～${pct(validation.runLevel95Interval[1])}**。區間描述此基準策略的抽樣不確定性，不代表所有玩家、所有力道的RTP。
- 初一／十五／中秋獎勵、蛇龜各20分、第二台面五洞10／20／200／50／100分、100秒及100顆免費金珠都保留。

## RTP 的分子與分母

\`RTP = （第一台面返還金幣 + 第二台面返還金幣）÷（第一台面付費金幣 + 第二台面付費金幣）\`

所有免費球只計入返還，不增加投注成本；第二台面玩家繼續左打所花的金幣必須計入成本。不能把兩台面的百分比直接加總，也不能只除以第一台面成本。

|來源|球數|成本金幣|返還金幣|
|---|---:|---:|---:|
${sourceRows}
|合計|—|${format(validation.shots)}|${format(validation.points/10)}|

|台面|成本金幣|返還金幣|該段返還／該段成本|對整體RTP的貢獻|
|---|---:|---:|---:|---:|
${stageRows}
|總計|${format(validation.shots)}|${format(validation.points/10)}|${pct(validation.referenceRtp)}|${pct(validation.referenceRtp)}|

百分比顯示經四捨五入，末位加總可能相差0.01個百分點。整體是按成本加權的結果。第二台面含免費祥雲與較高分洞，單段RTP遠高於100%屬於大獎回饋；前段進入機會較少，不能將該段高回報當成整台機率。

## 機率調整

|日期|每次SLOT機率|獎勵|
|---|---:|---|
${table}

初一與一般十五各10%，均10珠；中秋3%，50珠；只有二月初二開廟率從2.5%降低到${pct(p)}，差額移至未中獎。獎項互斥，八月十五不另加一般十五小獎。SLOT日期及畫面機率表由同一份設定產生，沒有命中後拒絕派獎或按玩家輸贏動態修改機率。

## 校準模型

先以完整物理模擬量測：

- \`a = ${a.toFixed(8)}\`：第一台面每1金幣付費成本的返還，含該台SLOT免費珠連鎖。
- \`h = ${h.toFixed(8)}\`：第一台面付費球對應的有效開廟機會係數，已計入免費珠重進SLOT及結算期間重複二月初二轉50珠的影響。
- \`v = ${v.toFixed(8)}\`：每次第二台面返還金幣，含付費球與100顆祥雲。
- \`c = ${c.toFixed(8)}\`：每次第二台面付費成本金幣。
- \`p\`：每次SLOT抽到二月初二的機率。

局部更新週期近似式：\`R(p) = (a + h×p×v) / (1 + h×p×c)\`。

令R為0.92，解得 \`p = (0.92-a)/(h×(v-0.92×c)) = ${solvedP.toFixed(10)}\`，也就是${pct(solvedP)}；取容易顯示的${pct(p)}，模型預估${pct(projected)}，再使用全新種子驗證。係數隨排隊、球群互撞、操作策略可能略變，因此這是調參模型，不能取代完整獨立模擬。

## 模擬條件與完整性

1. 兩台面皆最高每秒2球持續付費左打，每5秒均勻隨機選1～15段。每球1金幣，SLOT使用實際加權抽選，球路、入洞與互撞使用正式遊戲物理。
2. 獎勵珠可再次得分、入爐、開SLOT；重複二月初二轉50珠；100秒到期後仍按原金色檯面結算，不強行刪球。
3. 每個種子達付費球預算後停止新付費球，但等待所有場上球、待轉SLOT、待派珠和完整賜福流程結束，回到第一台面後才統計。
4. 每個樣本核對：付費球總數＝兩台面付費球數之和；所有積分＝四種來源積分之和；祥雲總球數＝100×完整開廟次數；所有SLOT入球均已轉完。獨立驗證總計${validation.ledger.bonusRuns}次完整賜福、${format(validation.ledger.bonus.freeBalls)}顆免費金珠。
5. \`tests/temple-ledger.mjs\` 直接核對實際錢包扣款、兩台面付費／免費得分及兌換，不把第二台面成本漏掉。此版本分數都是10的倍數，完整結算並兌換時沒有積分尾數折損。
6. 信賴區間使用各等樣本種子的RTP標準差與t近似；不只列出單一運氣較好的種子。

## 限制與其他策略

92%是上述基準策略的期望校準目標，非每場、每位玩家或每一固定力道的保證。初速、落點與針柱碰撞由玩家力道影響，固定力道可能比均勻切換更好或更差。另附15種固定力道各2,000球的敏感度樣本；樣本較小、少數開廟會造成大幅波動，不應當成各段精確長期RTP。

\`tests/temple-rtp-free-bonus.json\`另檢查進第二台面後不付費發射、只領祥雲的策略；該段沒有付費分母時回傳null，仍把免費返還納入整體成本分母。

調整前新對照：${format(before.shots)}球實測${pct(before.referenceRtp)}；先前30,000球148.56%是另一組較小樣本，兩者均顯示舊版明顯高於92%，不能把其中一個有限樣本視為長期真值。

## 檔案與重現

- 正式獨立驗證：\`tests/temple-balance-results.json\`。
- 調參依據48萬球：\`tests/temple-rtp-calibration-083.json\`，與獨立驗證使用不同種子。
- 其他候選：\`tests/temple-rtp-calibration.json\`、\`tests/temple-rtp-calibration-073.json\`；調整前對照：\`tests/temple-rtp-before.json\`。
- 摘要與模型：\`tests/temple-rtp-summary.json\`；報告產生器：\`node tests/temple-rtp-report.mjs\`。
- 重現驗證：\`node tests/temple-balance.mjs --runs 32 --shots 15000 --workers 8 --seed 20261030\`。
- 全程使用正式\`TempleFortune\`及正式物理，沒有預先指定入洞或以權重作弊替代球路。
`;
fs.writeFileSync(new URL('../土地公RTP分析.md',import.meta.url),doc);
console.log(JSON.stringify(summary));
