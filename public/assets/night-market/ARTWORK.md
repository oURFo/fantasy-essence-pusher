# 夜市拾寶 AI 素材

使用 imagegen 內建工具生成（非 CLI）；保留工具回傳的 alpha 通道。程式在 Canvas 裁切圖集並快取色彩變體，沒有以幾何圖形替代攤位、瓶子、玩具、圈圈或背包。

- `stall.png`：夜市攤位空場地，1024×1536。
- `prizes.png`：1536×1024 RGBA，四欄兩列圖集。第一列：玩具機器人、牛奶、汽水、啤酒。第二列：葡萄酒、洋酒、圈圈、背包。

## 攤位最終提示詞

Create a polished portrait game background for a Taiwanese night-market ring toss stall, painterly realistic 3D illustration, 1024x1536 portrait composition. Warm red lanterns, striped burgundy canopy, neon amber and teal night market glimpses around outer edges. Main central playfield must be EMPTY dark emerald felt / worn wooden floor, flat ground viewed from elevated front, vanishing point centered at top, no steps or shelves: floor trapezoid stretching from x about 16%-84% at y30% to x7%-93% at y85%. No bottles or prizes whatsoever on the floor because sprites will be added. Tasteful wooden stall frame side pillars, top sign blank dark panel at y10%-19%, bottom wooden counter at y87%-98% with room for a row of rings. Attractive premium arcade artwork, detailed materials, unified clear perspective, no people, no lettering, no numbers, no watermark.

## 圖集最終提示詞（transparent_background=true）

Game sprite atlas on transparent background. EXACTLY eight separate objects, arranged perfectly in 4 columns and 2 rows of equally sized square cells, generous clear padding inside every cell, no grid lines. 1536x1024 landscape or same 3:2 ratio. Each object centered within its cell. Top row left to right: (1) slim upright cute little toy robot figurine with narrow body and rounded head on small round base; (2) glass milk bottle with creamy white milk, small colorful label, red cap; (3) glass orange soda bottle with bright orange soda and green cap; (4) green glass beer bottle with cream label and gold cap. Bottom row left to right: (5) elegant dark red wine bottle with burgundy foil neck; (6) slender amber whisky bottle with black label and gold stopper, no box; (7) ONE golden red braided plastic ring toss hoop lying flat, viewed from straight above, circular hole completely transparent, thick attractive woven rim; (8) open little brown canvas prize satchel backpack seen front three-quarter, visible open mouth with golden sparkle. The six prize objects have vertical axes, seen slightly elevated front, upright narrow shape with visible base, all fit through a hoop at top. Premium realistic hand-painted 3D game props, warm Taiwanese night market lighting, rich jewel colors, crisp clean silhouettes, no shadows outside objects, NO text, NO watermarks, preserve true alpha transparency between objects and inside hoop. No additional items.


- `drinks.png`：補充果汁、白酒、可樂、青蘋果汁的2×2 RGBA圖集。載入時在Canvas依alpha裁切格內空白，置中快取。

## 飲料補充圖集最終提示詞（transparent_background=true）

Transparent game sprite atlas of exactly FOUR upright glass beverage bottles, 2 columns by 2 rows, equally sized square cells with generous transparent padding, each bottle fully contained and centered. Premium realistic painted 3D game art, warm Taiwanese night market lighting, slight elevated frontal view, crisp silhouettes matching a ring toss game. Top left: orange juice in a slim clear glass juice bottle, orange liquid, white cap, orange fruit illustrated label. Top right: white wine in a classic slender wine bottle, transparent pale green glass, pale straw yellow wine, elegant cream label, gold foil long thin neck. Bottom left: cola in a slender dark brown glass soda bottle with a red illustrated label and silver crown cap. Bottom right: green apple juice in a narrow clear glass juice bottle with pale green liquid, green cap, illustrated apple label. No lettering, no brands, no additional props, no external shadow, no decorative background, no grid lines. Real transparent alpha around all four bottles. Landscape or square image, exact two by two alignment.
