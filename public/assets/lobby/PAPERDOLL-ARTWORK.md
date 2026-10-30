# 紙娃娃與行走素材

2026-10-30，使用內建 imagegen 工具繪製，未使用外部 API。初版紙娃娃沿用男女預設身形，以衣物／頭髮的配色圖層與獨立頭飾組合；不同髮型、服裝版型另行擴充。

## 正式素材

- `avatar-male-walk.png`：男角色，正面／右側／背面各六幀行走及各一幀待機，共 21 幀。來源 `exec-b2f2ee87-c200-4629-94c7-14c2d3c22d34.png`。
- `avatar-female-walk.png`：女角色，同樣 21 幀。來源 `exec-b867007e-a5e0-493d-b4f2-3610998b6992.png`。
- `headwear.png`：星願髮夾、晴日棒球帽、貓耳髮箍、小小皇冠，各正面／右側／背面，共 12 個視圖。來源 `exec-2a6d27de-fbe6-464e-8f7f-a6a2e49c144f.png`。

左側方向使用右側圖鏡像。載入時從透明通道尋找每個完整輪廓，不假設圖格均分，避免切到鞋子或混入下一排；腳底與頭部中心定位後快取。衣物配色保留原 AI 材質明暗，頭飾按前後層組合。舊 `avatars.png` 不再用於行走。

## 完整提示詞

### 男角色初始動作

Use case: stylized-concept. Production GAME WALK-CYCLE SPRITE SHEET, transparent PNG, 1536x2048 portrait canvas. EXACTLY 6 equal COLUMNS and 4 equal ROWS, 24 cells, generous empty transparent gutters, each full body centered in its cell. SAME cute chibi male young adult in every occupied cell: brown short tousled hair, turquoise varsity jacket with white sleeves, white T-shirt, navy cuffed jeans, white sneakers; cheerful polished toy-like 3D rendering. Consistent body proportions, camera at waist level slightly above, identical body scale in every cell, head never changes size. ROW 1: 6 consecutive frames of natural WALK TOWARD CAMERA (front view), left heel contact, left passing, left lift, right heel contact, right passing, right lift. ROW 2: 6 consecutive frames WALK TO SCREEN RIGHT, strictly RIGHT-FACING SIDE PROFILE in every cell, opposite arm and leg swing, heel-to-toe steps, alternating feet, gentle knee bend, no marching or running. ROW 3: 6 consecutive frames WALK AWAY FROM CAMERA, strictly BACK VIEW in every cell. ROW 4: cell1 standing idle FRONT, cell2 standing idle RIGHT SIDE PROFILE, cell3 standing idle BACK; cells4-6 EMPTY TRANSPARENT. All ground contact soles share a consistent horizontal baseline within their row. Modest natural stride, relaxed arms, no exaggerated dance, no skating, no props, no lettering, no grid lines, no floor, no shadows or glow, true alpha transparent background. The right profile sequence is the most important. Preserve complete shoes and hair with ample cell padding.

### 女角色初始動作

Use case: stylized-concept. Production GAME WALK-CYCLE SPRITE SHEET, transparent PNG, 1536x2048 portrait canvas. EXACTLY 6 equal COLUMNS and 4 equal ROWS, 24 cells, generous empty transparent gutters, each full body centered in its cell. SAME cute chibi female young adult in every occupied cell: brown ponytail with soft bangs, coral pink jacket, cream skirt, navy leggings, white sneakers; cheerful polished toy-like 3D rendering. Consistent body proportions, camera at waist level slightly above, identical body scale in every cell, head never changes size. ROW 1: 6 consecutive frames of natural WALK TOWARD CAMERA (front view), left heel contact, left passing, left lift, right heel contact, right passing, right lift. ROW 2: 6 consecutive frames WALK TO SCREEN RIGHT, strictly RIGHT-FACING SIDE PROFILE in every cell, opposite arm and leg swing, heel-to-toe steps, alternating feet, gentle knee bend, no marching or running. ROW 3: 6 consecutive frames WALK AWAY FROM CAMERA, strictly BACK VIEW in every cell. ROW 4: cell1 standing idle FRONT, cell2 standing idle RIGHT SIDE PROFILE, cell3 standing idle BACK; cells4-6 EMPTY TRANSPARENT. All ground contact soles share a consistent horizontal baseline within their row. Modest natural stride, relaxed arms, no exaggerated dance, no skating, no props, no lettering, no grid lines, no floor, no shadows or glow, true alpha transparent background. The right profile sequence is the most important. Preserve complete shoes and hair with ample cell padding.

### 男角色排版修正

Edit this male sprite sheet to fix its layout only, preserve male character identity, turquoise varsity outfit and all 21 poses. Output LANDSCAPE 1536x1024 transparent PNG sheet, EXACTLY 6 columns x4 rows of SQUARE cells (256x256). Put each full character entirely inside its own square cell, at only 75% cell HEIGHT, with generous 12% transparent padding on ALL sides, especially profile stride feet. Do not let adjacent sprites touch or cross cells. Uniform character scale, full shoes and hair, aligned standing ground baselines. Row1 front 6 walk phases; row2 RIGHT facing side profile 6 walk phases with relaxed opposing arm/leg swing, natural walking heel-to-toe; row3 back6walk;row4 frontidle,rightprofileidle,backidle,then3EMPTYcells. Clean true alpha with no colored scraps or outlines, no floor, no shadows, no grid lines, no labels. Keep the same overall character size in every cell. All cells square so side strides have room.

### 女角色排版修正

Edit this female sprite sheet to fix its layout only, preserve female identity, brown ponytail, coral jacket cream skirt navy leggings white sneakers, and all21poses. Output LANDSCAPE 1536x1024 transparent PNG sheet, EXACTLY 6 columns x4 rows of SQUARE cells (256x256). Each full character entirely inside its own square cell, at only75% cell HEIGHT, with generous12% transparent padding on ALL sides, especially ponytail and profile stride feet. Adjacent sprites must NEVER touch or cross cell boundaries. Uniform character scale, full shoes and hair, standing ground baselines aligned. Row1 front6walk phases; row2 RIGHT facing side profile6walk phases with relaxed opposing arm/leg swing and natural heel-to-toe; row3 back6walk; row4 frontidle,rightprofileidle,backidle,then3EMPTYcells. Clean true alpha, no colored scraps or outlines, no floor, no shadows, no grid lines, no labels. Keep same character size in every cell. Square cells give side strides enough room.

### 頭飾

Use case stylized-concept. Transparent PNG PAPER DOLL HEADWEAR ASSET SHEET, landscape 1360x1024. EXACTLY 4 columns and3 rows of isolated wearable accessories, no people, no heads, no stands. Each asset centered in a generously padded cell. Same polished cute 3D arcade toy style, soft studio lighting, true alpha background. Columns are FOUR accessory items: 1 tiny gold five-point STAR HAIR CLIP with a small mint ribbon, 2 cheerful BUTTER YELLOW BASEBALL CAP with turquoise brim, 3 PINK CAT EARS on a slim curved headband, 4 SMALL GOLD CROWN with mint gemstones. Rows are views: top row straight FRONT view, middle row true RIGHT SIDE PROFILE, bottom row BACK view. Maintain same object identity and colors across its three views. All accessories full silhouettes, physically wearable by a chibi avatar, uncluttered high quality. NO human body or head, NO text, NO grid, NO labels, NO shadows outside asset, NO detached sparkles, no extra objects. Important cap must face RIGHT in middle row. Objects must never overlap adjacent cells.

