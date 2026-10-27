# 金礦傳說 AI 美術

使用內建 imagegen，2026-10-27 產生，未使用外部圖片或CLI模型。原始圖保留在Codex generated_images，本專案使用副本。

- cabinet.png：1024×1536直式正面日式柏青哥機殼；金色鉻、銅製採礦設備、翡翠礦脈、蒸汽時代燈具。中央為無針柱、無列車、無球、無拉霸的空白深青色盤面，頂部空白標牌，右下黃銅旋鈕，左下發射機構。遊戲物件由獨立圖層與物理配置呈現，避免圖像與碰撞不一致。
- sprites.png：1536×1024透明素材集，向右蒸汽機車與煤車、裝金礦的礦車、鋼珠、翡翠金色洞口、煤礦、銅礦、銀礦、金礦。AI回傳的物件邊界略偏離等分格，程式依實際像素區域裁切並快取；紅寶石與鑽石使用礦石素材的色調變化。

提示詞核心：production stylized-concept bitmap, orthographic premium Japanese pachinko gold mine legend, gold chrome amber LEDs emerald copper mining machinery, no letters/numbers, empty playfield, separate transparent sprites, consistent polished finish.

物理場景、旋轉指示、分數、SLOT視窗、光線、蒸汽、粒子及燈光為程式動態繪製，機殼與物件外觀使用上述AI點陣素材。
