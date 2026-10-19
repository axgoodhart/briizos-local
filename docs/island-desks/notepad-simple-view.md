# Notepad: island simple view

Talked out 2026-10-19 and built the same night. Kept as the record of how it was decided; DECISIONS.md has the summary.

## Vocabulary (states of one island)
- Simple: the shape on the desk, zoomed out. Name, chips, cover
- Preview: zoomed in on the desk. The cards as a flat picture at their real spots, cropped to the top-left of the shape. Nothing runs
- Canvas view: the island opened on its own. Infinite, pan and zoom, cards live. The frame fills what you can see plus a little padding; the island's name moves up into the top bar
- Full screen view: what the + opens today. Header, masonry wall, timeline, files. Stays as it is
- Card: lives inside the island, never moved by any of this

## Settled
- Simple and Preview share one rectangle; only what is drawn inside changes. Zooming never resizes or pushes anything (already true today)
- Preview appears on its own past a zoom line. The line is a desk setting the user can change (42% today)
- Preview pictures are a snapshot taken when you leave the Canvas view. One image per card, same cost at any zoom
- Island size on the desk is free. The bottom-right handle still drag-resizes
- Click or click-and-drag on the handle shows a temporary size snapper beside it: Small (square), Medium (Small's height, ~2.3× wide), Large (Medium's width, twice as tall). Pick one and the island snaps to it
- Reference sizes: Small 728×720, Medium 1672×712, Large 1672×1424 (Kensingsongs, I Want You Green, conducdots)
- Default for new islands: Medium
- Tag arrangement is temporary. While in it, islands are forced to the nearest of Small or Medium so rows stay even (Large shows as Medium). Leaving it gives every island its own size back
- Existing islands keep their sizes; nothing is converted
- Desk views (Full / Main / Progress) stay as they are for now
- Timeline and files stay in the full screen view
- Cards never move, never get pushed, are not drawn in Simple

## Not yet clear
- (nothing right now)
