# 雷神鍛造素材

使用內建 image_gen 工具生成，沒有使用 CLI/API fallback。

- cabinet.png：1024×1536，正面北歐雷神工坊、中央開放熔爐、鐵砧、熔岩槽、水晶線圈、無文字標牌。獨立雷鎚與爐門不烘焙在背景。
- sprites.png：1536×1024，真透明 3×2 圖集。依序為雷鎚、圓形爐門、雷電礦石、銅錠、黃金戰斧、雷神神器。載入時裁切透明邊界；銀錠由銅錠離線畫布預先轉為銀色。
- vfx.png：真透明 2×2 特效圖集。依序為熔岩碎石爆發、火光體積煙霧、雷電光環、金色碎片爆發。載入時縮為384px快取。

## 生成提示詞

### Cabinet
Use case: stylized-concept. Production game asset: portrait 1024x1536 full-frame front-facing premium Norse thunder god forging arcade cabinet background, no text no numbers no logos. Rich physically rendered black iron, carved Nordic gold trim, enormous stone foundry workshop, molten lava channels, intricate mechanical pipes, blue crystal coils on sides. Main circular furnace portal at center x512 y740, open incandescent deep orange interior, massive anvil lower center x512 y1110, ceiling hammer suspension above center. Leave central furnace aperture unobstructed, NO hammer in image, NO door in image, no floating rewards. Top header dark empty plaque for title, lower control area dark metal. Symmetric cabinet fills canvas edge to edge, straight-on game camera, cinematic high detail lavish polished realistic fantasy 3D game art, deep dimensional materials. This is the background layer for animated separate hammer and door sprites.

### Mechanisms
Production transparent game sprite atlas, 1536x1024 landscape, exactly SIX separate objects arranged uniform 3 columns x 2 rows, generous transparent padding in each equal cell, no touching. Premium cinematic realistic 3D Norse thunder forge, black iron gold rune carvings, molten orange and cyan magic detail, sharp material textures, front view. TOP LEFT: enormous detailed thunder hammer with rectangular wide head and vertical short handle pointing UP. TOP MIDDLE: closed circular heavy iron furnace door, ornate gold rim, radial engravings, no surrounding wall. TOP RIGHT: jagged dark ore chunk with glowing blue lightning crystals. BOTTOM LEFT: refined bronze ingot on small plinth. BOTTOM MIDDLE: elaborate golden axe upright. BOTTOM RIGHT: legendary thunder hammer trophy with cyan crystal and gold wings upright. Transparent background genuinely alpha. No text, no grid, no border, no cast background, each isolated object within its cell.

### Effects
Transparent VFX sprite atlas 1024x1024 exactly 2x2 equal square cells, each sprite fully separated with transparent padding. Premium cinematic game VFX with genuine transparent background, no black background no text. TOP LEFT: explosive eruption of molten metal orange flame and incandescent shards spraying outward, high detail volume and wisps. TOP RIGHT: thick volumetric curling charcoal smoke plume lit by orange fire from below. BOTTOM LEFT: circular blue-white electric portal corona, jagged branching lightning arcs around empty transparent center, rich layered plasma. BOTTOM RIGHT: golden magical forge burst with flying metal fragments, sparks and smoky golden energy trails. Crisp AAA game VFX texture assets designed for screen/additive compositing on dark forge background.

## 彈珠版新增素材（內建image_gen）

- pinball-board.png：開放暗藍針盤，黑鐵金框、雷電線圈、右側發射軌、七個底部凹槽，不烘焙雷鎚與熔爐。核心提示：Front-facing premium Norse 1024x1536 pinball cabinet; dark open hammered-metal field x160..864 y330..1040; NO hammer furnace anvil pins targets; blue crystal side coils; seven bottom recesses; empty header and bottom plaque; cinematic realistic 3D fantasy materials; no text.
- pinball-sprites.png：真透明3×2圖集，鋼珠、黃銅針柱、雷電洞、金幣洞、鍛造洞、回收漏斗。核心提示：Premium Norse pinball transparent sprite atlas, 3 columns x 2 rows, 1536x1024, six isolated objects; polished silver steel pinball, ornate brass cylindrical peg, open blue lightning socket, gold coin cup, open dwarven forge entrance with hammer emblem, scrap drain funnel; no labels, generous padding, actual alpha.

舊工坊背景和雷鎚素材改作命中中央鍛造洞後的彈出舞台，普通彈珠盤不顯示。
