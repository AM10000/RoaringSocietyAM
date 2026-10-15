# Roaring Society — museum visual update

This branch changes presentation while preserving the historical narrative, dialogue, quests, artifacts, gallery order, controls and saved progress format.

## Visual changes
- 128px procedural marble, timber, plaster and woven carpet tiles, with smooth texture sampling.
- Lit architectural surfaces with computed normals, limestone columns, brass chandeliers and curved foliage.
- Connected NPC shoulders and articulated limb geometry, round shoes, facial details and period clothing.
- Ivory, forest green and brass interface with serif typography and sharper source displays.
- Stationary decorative geometry grouped by material to reduce draw calls.

## Run
From this directory run `python -m http.server 8765` and visit http://localhost:8765. No install or build step is required.

## Validation
- Loaded in headless Microsoft Edge without uncaught JavaScript errors.
- 29 NPC models, 63 artworks and 44 quests instantiate.
- Historical data, dialogue, simulations, progression and physics files remain unchanged.
- Eight existing gallery teleport destinations were checked against the original checkout. The same six destinations overlap furniture in both versions (I, II, IV, V, Research and Synthesis). This pre-existing navigation issue is outside this visual-only update.
- Screenshots reviewed for the entrance hall and character models. This is not a complete story playthrough or a mobile performance certification.

## Practical limits
The museum retains its original floor plan and much of its furniture geometry. Characters use procedural stylized geometry rather than scanned human models. Remaining legacy atlas tiles are smoothly enlarged; selected materials are repainted at higher resolution. The new lighting and smoother models increase GPU work. Historical photographs still depend on Wikimedia access; web fonts fall back to local serif and sans-serif fonts.

Local branch: codex/museum-visual-redesign. Changes have not been pushed to GitHub.
