# Sky Wings AI artwork

Generated with the built-in imagegen tool, using the imagegen skill. Cabinet assets share one reference image to keep camera, rails, shelf and collection holes aligned. Existing AI-painted platform, round pegs, bead, pipes, divider posts and splitter are reused from the first machine; Canvas animates the sprites, wheel labels, lighting and particles.

## base.png — generation prompt

Use case: stylized-concept. Production game asset, portrait 1024x1536. A richly rendered 3D fantasy SKY WINGS coin pusher arcade cabinet, front view slight elevated view of horizontal lower shelf. Ivory carved feather wings and pale mint green enamel, aged champagne gold trim. Sky and floating islands behind the recessed upper playfield. Exact composition: cabinet fills whole image; rails at x8% and92%; top header occupies y0-14%; empty upper vertical playfield y15%-53%; full width empty lower horizontal pusher bed y54%-76%; bottom collection panel y77%-96%, central dark collection mouth occupying middle third, left and right third deep empty dark recovery shafts. Decorative ivory wings and a jade jewel on central collection panel. Leave upper playfield empty for program pegs and central roulette at x50% y35%. Do NOT paint roulette, pegs, balls, text, symbols, coins, movable pusher, dispensers. Cabinet is an actual cohesive ornate machine, not disconnected parts. Beautiful luminous daylight, detailed real materials, strong depth, no text, no watermark. Static game background production art.

## azure.png — edit prompt, reference base.png

Edit this game cabinet background into tier TWO Sky Wings. Preserve EXACT same cabinet layout, rails, floor, holes, camera angle and portrait dimensions. Change mint enamel to vivid cyan blue and gold trim to silver champagne. Replace floating island landscape with high altitude turquoise sky and a dense sea of white clouds BELOW, no islands, feeling much higher. Top wings now longer double feather layers sweeping outward within original header silhouette. Jewel ice blue. Do not add text, balls, pegs, roulette or dispensers. Production matching background.

## gold.png — edit prompt, reference base.png

Edit this game cabinet background into tier THREE celestial Sky Wings. Preserve EXACT same cabinet layout, rails, floor, holes, camera angle and portrait dimensions. Change mint enamel and trim to luminous rich gold and pearl white, amber jewels. Replace floating island landscape with sunlit celestial golden cloud tops, distant heavenly temple spires, radiant sun halo, feeling at highest heaven. Top wings become majestic triple layered golden ivory seraph feathers within original header silhouette. Do not add text, balls, pegs, roulette or dispensers. Production matching background.

## wheel.png — transparent generation prompt

Use case stylized-concept. Game sprite, a single circular fantasy roulette wheel face viewed perfectly front on orthographic, isolated on transparent background. Eight equal radial pie sectors, mint green ivory enamel alternating with deep teal, fine gold borders. Elegant ornate gilded feather rim. Small carved ivory feather wing motif engraved in EACH of eight sectors near outer end, leave broad blank inner area for program numbers. Central luminous jade gem cap. No text, NO numbers, no pointer, no background, no stand, no perspective, no drop shadow outside object. Disk fills square image with 5% transparent margin. Rich detailed 3D rendered materials matching an ivory gold sky fantasy arcade cabinet.

## wings.png — transparent generation prompt

Use case stylized-concept. Production transparent game sprite sheet for SKY WINGS fantasy arcade. Landscape canvas 1536x1024, exactly THREE horizontal rows of isolated symmetrical wing emblems. Each row centred, full emblem completely inside its own third of image, generous transparent space between rows, no overlap. Top row y0-341: small compact pair of white ivory feather wings with mint green central crystal and gold trim. Middle row y342-682: longer sweeping double layered ivory silver feather wings with cyan blue central crystal. Bottom row y683-1024: majestic broad triple layered golden seraph feather wings with amber central crystal and small radiant crown. Each emblem width about1300, height about250 pixels. Perfect front view, beautifully detailed 3D sculpted feathers, luminous gems, matching ornate fantasy sky arcade. NO backgrounds, no plates or rectangular frames, no text or numbers, no extra props, transparent background.

Final atlas: wings-v2.png. Repaired with built-in imagegen using wings.png as the edit reference: preserve the three designs and transparency, shrink each emblem into its own row, keep all tips and gems inside, and remove background haze. Runtime crops follow the actual generated bounds (mint y0–300, cyan y295–630, gold y630–1024); no raster recoloring or background removal was used. Original draft retained locally as preview-sky-wings-draft.png.


## collection-bay-v2.png — built-in imagegen generation

Production bitmap lower collection bay for an ivory gold sky fantasy coin pusher. Front orthographic view, three equally wide deep rectangular dark shafts. Left recycling hole x0–512, central reward hole x512–1024, right recycling hole x1024–1536 on the requested 1536×768 canvas; very thin straight dividers at x512 and x1024. All openings share their height and width. Central shaft has a small ivory wing and mint crystal above it, wholly within middle third. Side shafts empty. Deep dark metal interiors, thin gold rails, detailed realistic luxury materials. No curved arches, flared thick pillars, text, balls or coins. Render the whole strip behind falling beads. Generated result is 1774×887 and is fitted to the shared three-zone front-edge bounds; theme tint is applied at runtime. Original saved non-destructively as collection-bay-v2.png.


Current runtime layout: the three AI-painted source shafts are drawn separately into left 1/4 recycling, middle 1/2 reward, and right 1/4 recycling regions. The center artwork expands with the reward opening; shared projected boundaries align both dividers with physical collection rules. The original AI bitmap is preserved.
