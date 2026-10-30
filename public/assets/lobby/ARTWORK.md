# 歡樂遊樂場 AI 美術

2026-10-30，使用內建 imagegen 工具生成，非程式幾何拼組。素材已複製到本專案。

- `hall.png`：明亮歡樂的台灣家庭遊樂場，珊瑚粉、湖水綠、奶油黃與淡紫，星星燈串、正面微俯視空場景，無人物、無機台、無文字；牆面與地板交界水平。實作交替鏡像鋪接，讓兩端共享相同邊緣像素，新增模組可繼續向右延伸。
- `cabinets.png`：透明背景 4×2 圖集。上排秘境金庫、空之翼、水果星宴、夜市拾寶；下排命運星軌、金礦傳說、土地公賜福、雷神鍛造。統一 Q 版玩具感、正面微俯視、完整機台、相同尺寸、無文字。
- `avatars.png`：透明背景 4×2 圖集。上排男角色，湖水綠外套；下排女角色，珊瑚粉外套。各排為待機、左腳步行、右腳步行、揮手。全身、統一腳底基準、柔和 3D Q 版風格。

原始生成檔：

- hall：`exec-6cf539ba-aae3-432f-985f-713793b13464.png`
- cabinets：`exec-b43563e0-05ff-4d8c-adb9-c40ec53a27c4.png`
- avatars：`exec-046dcc53-9566-427a-b111-c0b7acecaa0d.png`

## 生成提示詞

### hall.png

Game background asset, landscape 1536x1024. A bright cheerful premium Taiwanese family amusement arcade interior in polished chibi 3D illustration, candy coral, turquoise, buttery yellow and lavender, warm white lighting, playful overhead star garlands and light bulbs, low colorful back wall with subtle decorative panels, white ceiling trim along top. Camera orthographic slightly elevated FRONT view, NOT isometric diagonal. EMPTY room with no machines and no people; large open pale cream tiled floor covering bottom 60 percent for walking, back wall top 40%. Horizontal floor and wall boundaries completely straight, consistent at both edges so a repeated image can connect left-to-right. No perspective vanishing point, no corner walls, no text, no logos, no watermark. Wall decorations stay away from left/right edges. Festive welcoming family game center atmosphere, soft shadows, beautifully finished illustration.

### cabinets.png

Transparent PNG GAME SPRITE ATLAS of EXACTLY EIGHT separate chibi arcade cabinets in 4 columns x 2 rows equal grid, each centered with generous transparent padding, no overlap, no lettering. Consistent orthographic slightly elevated FRONT camera, charming polished toy-like 3D illustration, clearly solid machines resting on ground, each front panel visible. TOP ROW left to right: 1 emerald green gold fantasy treasure coin pusher with ornate dragon and treasure coins behind glass; 2 sky blue ivory gold winged cloud coin pusher with circular wheel; 3 pink purple fruity pinball cabinet with strawberries oranges grapes; 4 cheerful red striped night market ring toss booth with rows of bottles and small toys on wooden shelves. BOTTOM ROW left to right: 5 midnight navy gold celestial ball shooting cabinet with four stacked circular orbit discs; 6 brass gold mining pachinko cabinet with small steam locomotive and glittering mineral decorations; 7 red gold Taiwanese Earth God temple pachinko cabinet with temple roof lanterns and smiling Tudigong ornament; 8 blue purple bronze thunder forge pinball cabinet with lightning hammer and glowing forge. All eight same visual size, large full cabinet silhouettes, no cut-off elements, clean true alpha transparent background and spaces, no ground plane, no cast shadow outside sprites, no words or labels, cute Q version designs.

### avatars.png

Transparent PNG character sprite sheet, EXACTLY 8 equal cells in 4 columns by 2 rows. Orthographic slightly elevated FRONT view cute chibi young adult visitors for bright cheerful arcade game. TOP ROW: same male character with brown short hair, turquoise varsity jacket white shirt navy pants white sneakers: front idle, walking left foot forward, walking right foot forward, front happy wave. BOTTOM ROW: same female character with brown ponytail, coral pink jacket cream skirt navy leggings white sneakers: front idle, walking left foot forward, walking right foot forward, front happy wave. Consistent identical body proportions across all cells, 2.5 heads tall, full body visible, feet at same baseline in every cell. Warm friendly faces, polished softly lit 3D toy illustration, no text, no logos, no background, true transparent alpha, generous padding around every cell, no overlapping. These are game sprites not a decorated poster.
