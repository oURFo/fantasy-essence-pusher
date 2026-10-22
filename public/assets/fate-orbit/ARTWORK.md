# 命運星軌 AI 素材

使用 imagegen 內建工具生成，非 CLI。機台、圓盤、洞口、彈珠、針柱及障礙物均使用點陣素材；Canvas 另繪互動指示、文字與光效。圖集依 alpha 邊界裁切並快取。

- `cabinet.png`：1024×1536 機台背景。
- `sprites.png`：1536×1024 RGBA 六物件圖集。

## 背景提示詞

Portrait 1024x1536 premium fantasy arcade cabinet background for a physical ball shooting and fate-disc game, theme celestial brass astrolabe, deep midnight blue with teal inlays, warm antique gold, ornate but legible mechanical clockwork. Camera straight front with slightly top-down playfield. Cabinet frame edges, sapphire crystals, subtle stars. Top blank dark title panel from y8%-18%, large completely EMPTY smooth dark blue-green felt/metal playfield rectangle x9%-91%, y25%-86%, no obstacles, no pins, no circles, no balls, no holes, no tracks because interactive sprites will be added in code. Bottom center integrated upward-facing brass ball launcher nozzle at x50% y88%, visible mechanical rounded base and barrel pointing upward. Bottom decorative panel at y94%-100%. Elegant cinematic painted realistic 3D game art, no text, no numbers, no characters, no watermark. Must be usable full cabinet illustration, not a webpage mockup.

## 圖集提示詞（transparent_background=true）

Game sprite atlas, exact THREE columns by TWO rows, SIX separate objects, centered in equal square cells with generous transparent padding and no overlap, genuine transparent background and clean silhouette. Premium realistic painted 3D celestial brass arcade props, midnight teal, gold and sapphire palette. TOP LEFT: a SINGLE plain round shallow golden brass bowl disc seen perfectly directly from above, circular, thin ornate rim, smooth EMPTY dark teal interior, subtle concentric wear patterns, NO holes, no numbers, no spokes, no ball, designed for runtime holes to be overlaid and for whole disc to rotate. TOP MIDDLE: a red glowing dark round drain hole socket with brass circular rim, seen exactly top down, center black-red. TOP RIGHT: a white pearl glowing dark round drain hole socket with brass circular rim, exactly top down, center black. BOTTOM LEFT: a shiny silver-blue glass marble, sphere with strong 3D light highlight and shading. BOTTOM MIDDLE: a small round gold needle peg cap with teal jewel, exactly top down. BOTTOM RIGHT: a long narrow rounded golden obstacle bar with teal inlay running horizontally, exactly top down, clean capsule silhouette, no extra components. No text, no watermark, no layout panels, true alpha between all sprites. Uniform individual cell framing, one object per cell.

## 完整可旋轉大砲更新

仍使用 imagegen 內建工具（非CLI）。新增 `cabinet-v2.png` 作為移除固定炮身的背景；新增 `cannon.png` 為真正透明、包含炮管、後膛與兩側支軸的完整精靈。保留原版素材供大廳卡片使用，遊戲載入新背景與獨立炮身；整體旋轉與炮口出球位置使用同一個轉軸。

### 背景編輯提示詞（參考原 cabinet.png）

Edit this exact fantasy celestial arcade cabinet background. Remove ONLY the entire golden cannon at bottom center, including its barrel, circular rear body, supports and base. Restore the dark navy celestial star-panel and brass decorative cabinet floor behind it, extending matching surrounding materials naturally. The lower central playfield should remain blank teal felt. Keep every other part exactly in place: same cabinet silhouette, side columns, title plaque, color palette, stars, perspective, 1024x1536 portrait composition. No cannon, no launcher, no text, no balls, no new objects. This is a clean background plate for a separately rotating cannon sprite.

### 透明大砲提示詞（transparent_background=true）

A single complete celestial fantasy arcade ball-launching CANNON game sprite on genuine transparent background. Whole cannon fully visible with generous padding, barrel points exactly straight UP in image toward 12 o'clock, long thick golden brass barrel with flared muzzle, ornate midnight blue and gold sun-star rear chamber, compact round rear assembly and side trunnions all included as ONE rigid rotating object. Top-down slightly frontal game perspective matching premium realistic painted 3D gold/brass navy teal celestial arcade cabinet. Rear pivot centered around x50% y75%, muzzle around x50% y12%. No wheels, no fixed stand, no detached pieces, no ground, no drop shadow outside silhouette, no labels, no UI, no text. Strong recognizable thick cannon silhouette, not a small thin rod. Square 1024x1024 transparent sprite.
