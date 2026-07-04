# Three-Theme Consolidation Analysis

> Source of truth: current `src/App.css`. The simplified `design/` presets are not treated as authoritative.

## Executive conclusion

Per-theme repetition is substantial, but cross-theme equality is extremely low. After resolving aliases, **331 names produce 310 distinct three-theme value signatures**. Only **36 variables participate in any repeated signature**, and only **7 component variables have an exact non-component donor across all three themes**.

A 22-token replacement therefore cannot preserve these themes through mechanical deduplication. The smallest honest system needs shared foundations, semantic roles, authored composite recipes, and initially retained component exceptions.

## Measured baseline

| Theme | Declarations | Raw values | Resolved values | Component vars | Literal colors | Top 10 cover | Maximum exact reduction |
|---|---:|---:|---:|---:|---:|---:|---:|
| Root | 327 | 203 | 195 | 184 | 175 | 71/327 (21.7%) | 132/327 (40.4%) |
| Antarctic Teafog | 328 | 160 | 159 | 184 | 121 | 98/328 (29.9%) | 169/328 (51.5%) |
| Postlinear Glassos | 328 | 99 | 98 | 184 | 61 | 191/328 (58.2%) | 230/328 (70.1%) |

- Union: **331**. Shared names: **324**.
- Resolved signatures: **310**; repeated: **15** covering **36** variables; singletons: **295**.
- Exact reduction is an upper bound, not a semantic mapping: identical white can mean text, icon, border, or danger.

### Coverage curve

| Theme | Top 10 | Top 20 | Top 40 |
|---|---:|---:|---:|
| Root | 71 (21.7%) | 108 (33.0%) | 156 (47.7%) |
| Antarctic Teafog | 98 (29.9%) | 148 (45.1%) | 205 (62.5%) |
| Postlinear Glassos | 191 (58.2%) | 238 (72.6%) | 270 (82.3%) |

Postlinear is highly compressible internally because white and a white-alpha ramp recur broadly. Root is less compressible because it mixes several chromatic families and component effects. Antarctic sits between them with a coherent mint/teal/gold system and bespoke surfaces.

## Color analysis

Colors inside flat values, gradients, and shadows were normalized from names/hex/RGB(A) to sRGB and converted to OKLCH. Alpha is separate; transparent is excluded. Top ten literals:

### Root

| Normalized | Uses | OKLCH | Spellings |
|---|---:|---|---|
| <code>#000000</code> | 20 | <code>0.0% 0.000 —</code> | <code>#000</code>, <code>black</code> |
| <code>#00ff00</code> | 8 | <code>86.6% 0.295 142.5°</code> | <code>lime</code> |
| <code>#00c8c81a</code> | 8 | <code>75.4% 0.129 194.8° / 0.10</code> | <code>rgba(0, 200, 200, 0.1)</code> |
| <code>#00c8c833</code> | 7 | <code>75.4% 0.129 194.8° / 0.20</code> | <code>rgba(0, 200, 200, 0.2)</code> |
| <code>#00c8c84d</code> | 7 | <code>75.4% 0.129 194.8° / 0.30</code> | <code>rgba(0, 200, 200, 0.3)</code> |
| <code>#ffffff80</code> | 7 | <code>100.0% 0.000 — / 0.50</code> | <code>rgba(255, 255, 255, 0.5)</code> |
| <code>#ffffff</code> | 6 | <code>100.0% 0.000 —</code> | <code>#fff</code>, <code>white</code> |
| <code>#00c8c880</code> | 6 | <code>75.4% 0.129 194.8° / 0.50</code> | <code>rgba(0, 200, 200, 0.5)</code> |
| <code>#008080</code> | 5 | <code>54.3% 0.093 194.8°</code> | <code>teal</code> |
| <code>#ffffff1a</code> | 5 | <code>100.0% 0.000 — / 0.10</code> | <code>rgba(255, 255, 255, 0.1)</code> |

### Antarctic Teafog

| Normalized | Uses | OKLCH | Spellings |
|---|---:|---|---|
| <code>#d4a373</code> | 20 | <code>75.0% 0.086 65.3°</code> | <code>#d4a373</code> |
| <code>#4fd1c5</code> | 20 | <code>78.6% 0.114 186.6°</code> | <code>#4fd1c5</code> |
| <code>#98ffd9</code> | 17 | <code>92.7% 0.111 168.2°</code> | <code>#98ffd9</code> |
| <code>#81e6d9</code> | 12 | <code>86.0% 0.097 184.9°</code> | <code>#81e6d9</code> |
| <code>#f0fdfa</code> | 10 | <code>98.4% 0.014 180.7°</code> | <code>#f0fdfa</code> |
| <code>#64748b</code> | 8 | <code>55.4% 0.041 257.4°</code> | <code>#64748b</code> |
| <code>#0b1211</code> | 8 | <code>17.5% 0.011 185.4°</code> | <code>#0b1211</code> |
| <code>#1a2e2b</code> | 8 | <code>28.3% 0.027 183.9°</code> | <code>#1a2e2b</code> |
| <code>#98ffd91a</code> | 8 | <code>92.7% 0.111 168.2° / 0.10</code> | <code>rgba(152, 255, 217, 0.1)</code> |
| <code>#ffffff08</code> | 8 | <code>100.0% 0.000 — / 0.03</code> | <code>rgba(255, 255, 255, 0.03)</code> |

### Postlinear Glassos

| Normalized | Uses | OKLCH | Spellings |
|---|---:|---|---|
| <code>#ffffff</code> | 53 | <code>100.0% 0.000 —</code> | <code>#ffffff</code>, <code>white</code> |
| <code>#ffffff1a</code> | 37 | <code>100.0% 0.000 — / 0.10</code> | <code>rgba(255, 255, 255, 0.1)</code>, <code>rgba(255,255,255,.1)</code> |
| <code>#ffffff0d</code> | 36 | <code>100.0% 0.000 — / 0.05</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>#000000</code> | 20 | <code>0.0% 0.000 —</code> | <code>#000</code>, <code>#000000</code>, <code>black</code>, <code>rgb(0,0,0)</code>, <code>rgba(0,0,0,1)</code> |
| <code>#ffffff14</code> | 16 | <code>100.0% 0.000 — / 0.08</code> | <code>rgba(255, 255, 255, 0.08)</code>, <code>rgba(255,255,255,0.08)</code> |
| <code>#ffffff33</code> | 15 | <code>100.0% 0.000 — / 0.20</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>#888888</code> | 12 | <code>62.7% 0.000 —</code> | <code>#888888</code> |
| <code>#ffffff05</code> | 12 | <code>100.0% 0.000 — / 0.02</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>#ffffff08</code> | 9 | <code>100.0% 0.000 — / 0.03</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>#666666</code> | 9 | <code>51.0% 0.000 —</code> | <code>#666666</code> |

### Interpretation

- **Root** is not one cyan-on-black palette. Cyan, lime, pink/magenta, violet, and red are independent channels.
- **Antarctic Teafog is dark.** Near-black teal/brown foundations, a mint/teal ladder, gold accent, and textured gradients form authored material.
- **Postlinear Glassos** uses white/white-alpha as material, but its identical whites still carry different meanings.

## Proposed minimum honest schema

| Family | Proposed tokens |
|---|---|
| Type/shape | `--theme-font-ui`, panel/control radii, corner shape, gap, header height, fast/normal motion |
| Surfaces | canvas, recessed, panel, elevated, overlay |
| Text | strong, primary, soft, muted, faint, dim |
| Accents | primary, secondary, tertiary, and soft variants |
| Status | success, warning, danger |
| Lines/effects | border, strong border, glow color/strength, shadow |
| Recipes | app, header, panel, controlbar, chat input/header, modal, title |

The recipe layer is essential: flattening identity-bearing gradients and textures into one surface token would be compact but false.

## Classification findings

| Classification | Count | Meaning |
|---|---:|---|
| Component exception | 177 | No lossless donor proven. |
| Semantic role | 74 | Compatibility alias initially. |
| Foundational token | 21 | Direct shared foundation. |
| Exact alias | 19 | Identical signature across all three. |
| Composite recipe | 13 | Authored material/effect. |
| Structural token | 13 | Type, shape, spacing, sizing, motion, or filter. |
| Foundational candidate | 11 | Legacy primitive needing review. |
| Semantic token | 3 | Stable meaning. |

Only exact aliases are mechanically safe.

### Provably safe component aliases

| Component variable | Donor |
|---|---|
| <code>--theme-components-controlbar-controlbar-organizer-icon-color-26sfj</code> | <code>--chat-input-text-color</code> |
| <code>--theme-components-notes-noteswidget-note-btn-color-26sfj</code> | <code>--chat-input-text-color</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-header-border-bottom-1jdub</code> | <code>--layout-accent-cyan-dim</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-header-border-bottom-9zuog</code> | <code>--ui-settings-radio-border</code> |
| <code>--theme-components-overlays-calendarmodal-quick-add-btn-background-jlh43</code> | <code>--ui-modal-save-bg</code> |
| <code>--theme-components-overlays-organizermodal-organizer-header-border-bottom-9zuog</code> | <code>--ui-settings-radio-border</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tab-active-color-26sfj</code> | <code>--chat-input-text-color</code> |

## Recommended reversible pilot

1. Add foundations and recipes without removing old variables.
2. Alias only exact mappings; retain unmatched overrides.
3. Migrate type/shape → text → status → borders/alpha → flat surfaces → recipes.
4. Compare real shell, ActionDeck, Notes, Calendar, Organizer, Login, Canvas, and Dashboard after each slice.
5. Keep old names through the pilot for removal-based rollback.

Migrate structural variables, palette ladders, layout roles, and the seven exact aliases first. Leave gradients, textures, shadows, filters, logo treatments, and unproven component overrides alone initially.

## Complete normalized mapping matrix

Every union variable appears below. Values are whitespace-normalized and aliases resolved. `∅` means absent.

| Existing | Classification | Destination | Root | Antarctic | Postlinear |
|---|---|---|---|---|---|
| <code>--card-glass</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.07)</code> | <code>rgba(15, 23, 22, 0.65)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--chat-input-border-color</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>lime</code> | <code>palegoldenrod</code> | <code>∅</code> |
| <code>--chat-input-text-color</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>lime</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--chat-inut-border-color</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>∅</code> | <code>∅</code> | <code>gray</code> |
| <code>--chat-send-btn-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>∅</code> | <code>rgba(0,210,240,.8)</code> | <code>rgb(0,0,0)</code> |
| <code>--glass-bg</code> | Composite recipe | <code>Retain as authored recipe</code> | <code>linear-gradient(to bottom, gray, rgba(255, 255, 255, 0.083) 20%)</code> | <code>linear-gradient(135deg, rgba(224, 255, 247, 0.12) 0%, rgba(200, 215, 210, 0.05) 50%, rgba(142, 84, 49, 0.08) 100%)</code> | <code>linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0,0,0,1) 100%)</code> |
| <code>--glass-bg-light</code> | Composite recipe | <code>Retain as authored recipe</code> | <code>linear-gradient(to bottom, gray, rgba(255, 255, 255, 0.083) 20%, transparent 50%, rgba(255,255,255,.4) 130%)</code> | <code>linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(224, 255, 247, 0.08) 30%, transparent 60%, rgba(212, 163, 115, 0.1) 130%)</code> | <code>linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05) 20%, transparent 50%, rgba(255,255,255,0.08) 130%)</code> |
| <code>--glass-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.08)</code> | <code>rgba(152, 255, 217, 0.18)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--holo-bg-dark</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#0a0e17</code> | <code>#0f1716</code> | <code>#050505</code> |
| <code>--holo-blue</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#00f1fe3d</code> | <code>#a3f7e5</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--holo-glow-blue</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>0 0 1.5px rgba(0, 242, 254, 0.6)</code> | <code>0 0 12px rgba(163, 247, 229, 0.45)</code> | <code>0 0 1.5px rgba(255, 255, 255, 0.2)</code> |
| <code>--holo-glow-green</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>0 0 2.5px rgba(67, 233, 123, 0.6)</code> | <code>0 0 10px rgba(152, 255, 217, 0.5)</code> | <code>0 0 2.5px rgba(150, 150, 150, 0.2)</code> |
| <code>--holo-glow-pink</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>0 0 1.5px rgba(245, 87, 108, 0.6)</code> | <code>0 0 12px rgba(212, 163, 115, 0.35)</code> | <code>0 0 1.5px rgba(255, 255, 255, 0.4)</code> |
| <code>--holo-glow-purple</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>0 0 2px rgba(209, 65, 238, 0.6)</code> | <code>0 0 15px rgba(142, 84, 49, 0.25)</code> | <code>0 0 2px rgba(200, 200, 200, 0.3)</code> |
| <code>--holo-green</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#43e97b</code> | <code>#98ffd9</code> | <code>#888888</code> |
| <code>--holo-pink</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#f5576c</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--holo-purple</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#d141ee</code> | <code>#8e5431</code> | <code>#d1d1d1</code> |
| <code>--layout-accent-cyan</code> | Foundational token | <code>--theme-accent-primary</code> | <code>#00e5e5</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--layout-accent-cyan-dim</code> | Foundational token | <code>--theme-accent-soft</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(79, 209, 197, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--layout-accent-cyan-glow</code> | Foundational token | <code>--theme-glow-color</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>rgba(79, 209, 197, 0.4)</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--layout-accent-orange</code> | Foundational token | <code>--theme-accent-secondary</code> | <code>#ff6b35</code> | <code>#d4a373</code> | <code>#999999</code> |
| <code>--layout-accent-orange-dim</code> | Foundational token | <code>--theme-accent-secondary-soft</code> | <code>rgba(255, 107, 53, 0.3)</code> | <code>rgba(212, 163, 115, 0.2)</code> | <code>rgba(150, 150, 150, 0.1)</code> |
| <code>--layout-bg-panel</code> | Composite recipe | <code>--theme-recipe-panel</code> | <code>black</code> | <code>repeating-linear-gradient(135deg, #0f0000, #0f0f0f 4px, #1a1a1a 3px, #1a1a1a 5px)</code> | <code>linear-gradient(to bottom, transparent, rgba(0,0,0,.1)),radial-gradient(rgba(0,0,0,.7) 3px, rgba(0,40,40.8) .4px) 10px 10px / 5px 5px rgb(0,21,20)</code> |
| <code>--layout-bg-panel-header</code> | Composite recipe | <code>--theme-recipe-header</code> | <code>black</code> | <code>linear-gradient(to right, #0f1716 0%, #1a2e2b 50%, #17100b 100%)</code> | <code>linear-gradient(to bottom,rgba(255,255,255,.1), transparent 30%),radial-gradient(rgba(0,0,0,.7) 3px, rgba(0,40,40.8) .4px) 10px 10px / 5px 5px black</code> |
| <code>--layout-bg-primary</code> | Foundational token | <code>--theme-canvas</code> | <code>black</code> | <code>#0b1211</code> | <code>gray</code> |
| <code>--layout-bg-secondary</code> | Foundational token | <code>--theme-surface-recessed</code> | <code>black</code> | <code>#050808</code> | <code>black</code> |
| <code>--layout-border-color</code> | Foundational token | <code>--theme-border</code> | <code>rgba(0, 0, 0, 0.15)</code> | <code>rgba(152, 255, 217, 0.08)</code> | <code>rgba(255, 255, 255, 0.07)</code> |
| <code>--layout-border-color-active</code> | Foundational token | <code>--theme-accent-primary</code> | <code>rgba(200, 0, 153, 0.6)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.25)</code> |
| <code>--layout-border-color-hover</code> | Foundational token | <code>--theme-border-strong</code> | <code>rgba(200, 0, 107, 0.4)</code> | <code>rgba(212, 163, 115, 0.3)</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--layout-gap</code> | Structural token | <code>--theme-space-gap</code> | <code>1px</code> | <code>4px</code> | <code>1px</code> |
| <code>--layout-header-height</code> | Structural token | <code>--theme-panel-header-height</code> | <code>36px</code> | <code>44px</code> | <code>40px</code> |
| <code>--layout-panel-radius</code> | Structural token | <code>Retain as structural semantic</code> | <code>6px</code> | <code>12px</code> | <code>0px</code> |
| <code>--layout-resize-handle-size</code> | Structural token | <code>Retain as structural semantic</code> | <code>2px</code> | <code>2px</code> | <code>4px</code> |
| <code>--layout-transition-fast</code> | Structural token | <code>--theme-motion-fast</code> | <code>0.15s ease</code> | <code>0.12s ease-out</code> | <code>0.1s cubic-bezier(0.4, 0, 0.2, 1)</code> |
| <code>--layout-transition-normal</code> | Structural token | <code>--theme-motion-normal</code> | <code>0.2s ease</code> | <code>0.25s cubic-bezier(0.4, 0, 0.2, 1)</code> | <code>0.25s cubic-bezier(0.4, 0, 0.2, 1)</code> |
| <code>--log-section-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#0a0a0a</code> | <code>#070a0a</code> | <code>#030303</code> |
| <code>--log-section-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(25, 255, 55, 0.23)</code> | <code>rgba(152, 255, 217, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--log-section-header-color</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>deepskyblue</code> | <code>#81e6d9</code> | <code>#ffffff</code> |
| <code>--palette-accent-briizlogo</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>rgb(191, 234, 191)</code> | <code>#e0fff7</code> | <code>#ffffff</code> |
| <code>--palette-accent-primary</code> | Foundational token | <code>--theme-accent-primary</code> | <code>#00e5e5</code> | <code>gold</code> | <code>#ffffff</code> |
| <code>--palette-accent-primary-soft</code> | Foundational token | <code>--theme-accent-soft</code> | <code>#a4ac8d</code> | <code>palegoldenrod</code> | <code>#cccccc</code> |
| <code>--palette-danger</code> | Semantic token | <code>--theme-danger</code> | <code>#ff6b6b</code> | <code>magenta</code> | <code>#444444</code> |
| <code>--palette-neon-accent</code> | Foundational token | <code>--theme-accent-secondary</code> | <code>#00ff88</code> | <code>violet</code> | <code>#f0f0f0</code> |
| <code>--palette-success</code> | Semantic token | <code>--theme-success</code> | <code>#4caf50</code> | <code>white</code> | <code>#e0e0e0</code> |
| <code>--palette-text-dim</code> | Foundational token | <code>--theme-text-dim</code> | <code>#555</code> | <code>#334155</code> | <code>#333333</code> |
| <code>--palette-text-faint</code> | Foundational token | <code>--theme-text-faint</code> | <code>#ccc</code> | <code>#94a3b8</code> | <code>#888888</code> |
| <code>--palette-text-main</code> | Foundational token | <code>--theme-text</code> | <code>lime</code> | <code>#e6fffa</code> | <code>#ffffff</code> |
| <code>--palette-text-muted</code> | Foundational token | <code>--theme-text-faint</code> | <code>#666</code> | <code>#475569</code> | <code>#444444</code> |
| <code>--palette-text-soft</code> | Foundational token | <code>--theme-text-soft</code> | <code>#aaa</code> | <code>#cbd5e1</code> | <code>#aaaaaa</code> |
| <code>--palette-text-subtle</code> | Foundational token | <code>--theme-text-muted</code> | <code>#888</code> | <code>#64748b</code> | <code>#666666</code> |
| <code>--palette-warning</code> | Semantic token | <code>--theme-warning</code> | <code>#ffd54f</code> | <code>orange</code> | <code>#999999</code> |
| <code>--palette-white</code> | Foundational token | <code>--theme-text-strong</code> | <code>#fff</code> | <code>#ffffff</code> | <code>#ffffff</code> |
| <code>--text-glow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 2px rgba(226, 232, 240, 0.4)</code> | <code>0 0 4px rgba(240, 253, 250, 0.3)</code> | <code>0 0 2px rgba(255, 255, 255, 0.2)</code> |
| <code>--text-primary</code> | Foundational candidate | <code>Semantic review; do not auto-alias</code> | <code>#e2e8f0</code> | <code>#f0fdfa</code> | <code>#f2f2f2</code> |
| <code>--theme-components-controlbar-controlbar-briiztorm-icon-color-hav81</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgb(255, 53, 161)</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-controlbar-controlbar-briiztorm-icon-webkit-text-stroke-9ja92</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>pink</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>transparent</code> |
| <code>--theme-components-controlbar-controlbar-calendar-icon-color-i0tgi</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>red</code> | <code>#81e6d9</code> | <code>#cccccc</code> |
| <code>--theme-components-controlbar-controlbar-calendar-icon-webkit-text-stroke-1g777</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgb(255, 161, 102)</code> | <code>#1a2e2b</code> | <code>transparent</code> |
| <code>--theme-components-controlbar-controlbar-cb-label-color-sqqmz</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.8)</code> | <code>#64748b</code> | <code>#888888</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-active-background-jlh43</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 150, 180, 0.5)</code> | <code>rgba(79, 209, 197, 0.15)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-active-border-color-1if95</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 255, 0.7)</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-active-box-shadow-kz1a9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>0 0 10px rgba(79, 209, 197, 0.1)</code> | <code>none</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-active-cb-label-color-1sl84</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#00ffff</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-active-cb-label-text-shadow-sw3f5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 255, 0.5)</code> | <code>0 0 5px #4fd1c5</code> | <code>none</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-background-yovd6</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.4)</code> | <code>rgba(0, 0, 0, 0.3)</code> | <code>rgba(0, 0, 0, 0.3)</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-border-1jdub</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-hover-background-1trbk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.5)</code> | <code>rgba(79, 209, 197, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-hover-border-color-9ve10</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.6)</code> | <code>rgba(152, 255, 217, 0.3)</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-controlbar-controlbar-cb-toggle-hover-box-shadow-1bm8l</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>0 0 15px rgba(0, 0, 0, 0.2)</code> | <code>none</code> |
| <code>--theme-components-controlbar-controlbar-notes-icon-color-qo8di</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>palegoldenrod</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--theme-components-controlbar-controlbar-notes-icon-webkit-text-stroke-o0md2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>black</code> | <code>#334155</code> | <code>transparent</code> |
| <code>--theme-components-controlbar-controlbar-organizer-icon-color-26sfj</code> | Exact alias | <code>--chat-input-text-color</code> | <code>lime</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-controlbar-controlbar-organizer-icon-webkit-text-stroke-b5mm4</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>green</code> | <code>#1a2e2b</code> | <code>transparent</code> |
| <code>--theme-components-loginoverlay-login-btn-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(45deg, #00ffcc, #ff4da6)</code> | <code>linear-gradient(45deg, #4fd1c5, #d4a373)</code> | <code>linear-gradient(45deg, #333333, #ffffff)</code> |
| <code>--theme-components-loginoverlay-login-btn-color-1q77m</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#000</code> | <code>#050808</code> | <code>#000</code> |
| <code>--theme-components-loginoverlay-login-btn-hover-not-disabled-box-shadow-183ir</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 204, 0.6)</code> | <code>0 0 20px rgba(79, 209, 197, 0.4)</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-loginoverlay-login-error-background-1iva2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 107, 107, 0.1)</code> | <code>rgba(253, 164, 175, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-loginoverlay-login-error-border-9dbrq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 107, 107, 0.3)</code> | <code>rgba(253, 164, 175, 0.3)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-loginoverlay-login-info-color-1tcs7</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.5)</code> | <code>rgba(203, 213, 225, 0.5)</code> | <code>rgba(255, 255, 255, 0.3)</code> |
| <code>--theme-components-loginoverlay-login-input-background-ypdc9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.3)</code> | <code>rgba(15, 23, 22, 0.7)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-loginoverlay-login-input-box-shadow-u3asw</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 204, 0.2)</code> | <code>inset 0 2px 4px rgba(0, 0, 0, 0.3)</code> | <code>transparent</code> |
| <code>--theme-components-loginoverlay-login-input-focus-box-shadow-1iz3u</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 77, 166, 0.4)</code> | <code>0 0 0 2px rgba(79, 209, 197, 0.2)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-loginoverlay-login-input-placeholder-color-1ll6h</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.4)</code> | <code>rgba(100, 116, 139, 0.6)</code> | <code>#444444</code> |
| <code>--theme-components-loginoverlay-login-logo-circle-background-1mpnj</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#ff4da6</code> | <code>#d4a373</code> | <code>#666666</code> |
| <code>--theme-components-loginoverlay-login-logo-circle-background-1pjs9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#00ffcc</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-loginoverlay-login-logo-circle-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, #00ffcc, #ff4da6, #00e5e5)</code> | <code>conic-gradient(from 180deg at 50% 50%, #98ffd9, #4fd1c5, #d4a373, #8e5431, #98ffd9)</code> | <code>linear-gradient(135deg, #ffffff, #000000)</code> |
| <code>--theme-components-loginoverlay-login-logo-circle-box-shadow-1hvbq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 77, 166, 0.2)</code> | <code>0 0 30px rgba(212, 163, 115, 0.3)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-loginoverlay-login-logo-circle-box-shadow-qr99k</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 204, 0.4)</code> | <code>0 0 30px rgba(152, 255, 217, 0.3)</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-loginoverlay-login-logo-text-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(90deg, #00ffcc, #ff4da6)</code> | <code>linear-gradient(to right, #f0fdfa, #98ffd9)</code> | <code>linear-gradient(90deg, #ffffff, #666666)</code> |
| <code>--theme-components-loginoverlay-login-logo-text-text-shadow-11uwi</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 204, 0.3)</code> | <code>0 2px 10px rgba(0, 0, 0, 0.5)</code> | <code>none</code> |
| <code>--theme-components-loginoverlay-login-overlay-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, rgba(106, 58, 90, 0.95), rgba(26, 10, 74, 0.95))</code> | <code>radial-gradient(circle at center, #1a2e2b 0%, #050808 100%)</code> | <code>radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)</code> |
| <code>--theme-components-loginoverlay-login-subtitle-color-sqqmz</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.8)</code> | <code>rgba(203, 213, 225, 0.8)</code> | <code>#888888</code> |
| <code>--theme-components-loginoverlay-login-toggle-link-color-tuiqr</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.6)</code> | <code>#81e6d9</code> | <code>#666666</code> |
| <code>--theme-components-notes-noteswidget-create-note-btn-border-1efjr</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(251, 228, 111, 0.485)</code> | <code>rgba(212, 163, 115, 0.4)</code> | <code>#ffffff</code> |
| <code>--theme-components-notes-noteswidget-drawer-resize-handle-after-background-image-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.5) 50%, transparent 50%), linear-gradient(135deg, transparent 60%, rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0.5) 70%, transparent 70%), linear-gradient(135deg, transparent 80%, rgba(255, 255, 255, 0.5) 80%, rgba(255, 255, 255, 0.5) 90%, transparent 90%)</code> | <code>linear-gradient(135deg, transparent 40%, #d4a373 40%, #d4a373 50%, transparent 50%)</code> | <code>linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.2) 50%, transparent 50%)</code> |
| <code>--theme-components-notes-noteswidget-floating-note-active-box-shadow-1x3oe</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.6)</code> | <code>0 0 10px white,0 0px 30px rgba(0, 220, 250, 0.5)</code> | <code>0 10px 30px rgba(0, 0, 0, 0.5)</code> |
| <code>--theme-components-notes-noteswidget-floating-note-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(to bottom, transparent, black, transparent)</code> | <code>linear-gradient(to bottom, #1a2e2b, #0b1211)</code> | <code>linear-gradient(to bottom, rgba(30, 30, 30, 0.9), rgba(10, 10, 10, 0.95))</code> |
| <code>--theme-components-notes-noteswidget-floating-note-box-shadow-op6ip</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.5)</code> | <code>0 4px 20px rgba(0, 0, 0, 0.4)</code> | <code>0 4px 20px rgba(0, 0, 0, 0.4)</code> |
| <code>--theme-components-notes-noteswidget-floating-note-note-card-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)</code> | <code>linear-gradient(to bottom, rgba(26, 46, 43, 0.5), transparent)</code> | <code>repeating-linear-gradient(45deg, #111, #000 2px, #111 2px, #111 4px),repeating-linear-gradient(-45deg, #000, #222 2px, #111 2px, #111 4px),#000</code> |
| <code>--theme-components-notes-noteswidget-floating-note-note-textarea-background-1p7wk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0,0,0,.8)</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>transparent</code> |
| <code>--theme-components-notes-noteswidget-note-btn-color-26sfj</code> | Exact alias | <code>--chat-input-text-color</code> | <code>lime</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-notes-noteswidget-note-btn-hover-background-rlxn3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-notes-noteswidget-note-card-background-48988</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgb(14, 68, 68)</code> | <code>#111a19</code> | <code>#0a0a0a</code> |
| <code>--theme-components-notes-noteswidget-note-card-border-9zuog</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.15)</code> | <code>rgba(152, 255, 217, 0.2)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-notes-noteswidget-note-card-border-top-12gea</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#ffc107</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--theme-components-notes-noteswidget-note-card-box-shadow-1rf5c</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.571)</code> | <code>0 4px 12px rgba(0, 0, 0, 0.3)</code> | <code>none</code> |
| <code>--theme-components-notes-noteswidget-note-card-hover-border-color-hm0l4</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.63)</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--theme-components-notes-noteswidget-note-card-hover-box-shadow-ypdc9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.3)</code> | <code>0 8px 24px rgba(0, 0, 0, 0.4)</code> | <code>none</code> |
| <code>--theme-components-notes-noteswidget-note-header-background-qxrmc</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>rgba(0, 140, 120, 0.15)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-notes-noteswidget-note-header-border-bottom-kz1a9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-notes-noteswidget-note-resize-handle-background-image-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, transparent 45%, rgba(180, 220, 235, 0.8) 45%, rgba(180, 220, 235, 0.8) 55%, transparent 55%)</code> | <code>linear-gradient(135deg, transparent 45%, #81e6d9 45%, #81e6d9 55%, transparent 55%)</code> | <code>none</code> |
| <code>--theme-components-notes-noteswidget-notes-add-btn-border-1plkp</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>white</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--theme-components-notes-noteswidget-notes-close-btn-background-i0tgi</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>red</code> | <code>#8e5431</code> | <code>#222222</code> |
| <code>--theme-components-notes-noteswidget-notes-close-btn-box-shadow-9ja92</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>pink</code> | <code>0 0 8px rgba(142, 84, 49, 0.4)</code> | <code>none</code> |
| <code>--theme-components-notes-noteswidget-notes-close-btn-hover-background-gpmda</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(250, 30, 30, 0.5)</code> | <code>#a66a46</code> | <code>#444444</code> |
| <code>--theme-components-notes-noteswidget-notes-close-btn-hover-border-color-1lj9y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 100, 100, 0.5)</code> | <code>rgba(212, 163, 115, 0.5)</code> | <code>#666666</code> |
| <code>--theme-components-notes-noteswidget-notes-drawer-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(to bottom left, rgba(255,155,55,0.1), rgba(213, 195, 160, 0.51), rgb(200, 90, 0))</code> | <code>linear-gradient(to bottom left, #0b1211, #17100b)</code> | <code>repeating-linear-gradient(45deg, #333, #333 1px, #111 1px, #111 3px)</code> |
| <code>--theme-components-notes-noteswidget-notes-drawer-open-box-shadow-ly038</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(200, 180, 60, .1)</code> | <code>-10px 0 30px rgba(0, 0, 0, 0.3)</code> | <code>inset 0 0 3px cyan</code> |
| <code>--theme-components-notes-noteswidget-notes-title-text-shadow-o0md2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>black</code> | <code>0 2px 4px rgba(0,0,0,0.5)</code> | <code>none</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-btn-background-yovd6</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.4)</code> | <code>rgba(0, 0, 0, 0.3)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-btn-border-1i94y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.2)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-btn-close-hover-background-1fshh</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(150, 30, 30, 0.6)</code> | <code>#8e5431</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-btn-close-hover-border-color-1lj9y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 100, 100, 0.5)</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-btn-hover-background-1trbk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.5)</code> | <code>rgba(79, 209, 197, 0.15)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-header-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(90deg, rgba(0, 50, 70, 0.9) 0%, rgba(0, 30, 50, 0.9) 100%)</code> | <code>linear-gradient(90deg, #1a2e2b 0%, #0f1716 100%)</code> | <code>linear-gradient(90deg, #0a0a0a 0%, #000000 100%)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-header-border-bottom-1jdub</code> | Exact alias | <code>--layout-accent-cyan-dim</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(79, 209, 197, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-overlay-background-afq8i</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#0a0a0a</code> | <code>rgba(5, 8, 8, 0.95)</code> | <code>rgba(0, 0, 0, 0.85)</code> |
| <code>--theme-components-overlays-briiztormoverlay-briiztorm-title-text-shadow-19dnh</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>0 0 10px rgba(79, 209, 197, 0.3)</code> | <code>none</code> |
| <code>--theme-components-overlays-calendarmodal-cal-cell-background-xc5kq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.12)</code> | <code>rgba(255, 255, 255, 0.01)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-cell-hover-background-iliqk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.25)</code> | <code>rgba(79, 209, 197, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-cell-selected-background-1mg6o</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 229, 229, 0.1)</code> | <code>rgba(212, 163, 115, 0.12)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-cell-selected-box-shadow-1rqic</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 229, 229, 0.15)</code> | <code>inset 0 0 8px rgba(212, 163, 115, 0.2)</code> | <code>none</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-done-btn-border-1i94y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.2)</code> | <code>rgba(152, 255, 217, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-done-btn-checked-background-5xil6</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(76, 175, 80, 0.1)</code> | <code>rgba(167, 243, 208, 0.15)</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-item-background-1d738</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(30, 50, 70, 0.3)</code> | <code>rgba(26, 46, 43, 0.4)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-item-border-1w8u1</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.08)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-item-hover-background-10wdq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.2)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-item-rec-color-lx85k</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#a855f7</code> | <code>#d4a373</code> | <code>#888888</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daily-today-badge-color-1q77m</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#000</code> | <code>#050808</code> | <code>#000000</code> |
| <code>--theme-components-overlays-calendarmodal-cal-daynum-color-ygsz5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#d0d0d0</code> | <code>#cbd5e1</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-btn-close-border-1gvsk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.15)</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-btn-close-hover-background-vmrwx</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-header-background-1oise</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 50, 80, 0.2)</code> | <code>rgba(26, 46, 43, 0.3)</code> | <code>rgba(0, 0, 0, 0.4)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-header-border-bottom-9zuog</code> | Exact alias | <code>--ui-settings-radio-border</code> | <code>rgba(0, 200, 200, 0.15)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-modal-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, #80d2972d 0%, #0115343a 100%)</code> | <code>linear-gradient(135deg, #0b1211, #17100b)</code> | <code>linear-gradient(135deg, #111 0%, #000 100%)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-modal-border-1jdub</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(212, 163, 115, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-nav-background-1jtgs</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 30, 50, 0.3)</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-nav-border-bottom-kz1a9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-calendarmodal-calendar-overlay-background-gb7i3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.25)</code> | <code>rgba(0, 0, 0, 0.7)</code> | <code>rgba(0, 0, 0, 0.6)</code> |
| <code>--theme-components-overlays-calendarmodal-nav-btn-background-1uokm</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 80, 100, 0.3)</code> | <code>rgba(255, 255, 255, 0.02)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-overlays-calendarmodal-nav-btn-border-1bm8l</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-nav-btn-hover-background-4pwci</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.4)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-calendarmodal-nav-btn-hover-border-color-1jdcc</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.4)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-overlays-calendarmodal-nav-btn-today-background-9ls9m</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 150, 180, 0.4)</code> | <code>rgba(212, 163, 115, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-quick-add-btn-background-jlh43</code> | Exact alias | <code>--ui-modal-save-bg</code> | <code>rgba(0, 150, 180, 0.5)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-calendarmodal-quick-add-btn-hover-background-1m6k2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 180, 200, 0.6)</code> | <code>#81e6d9</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-overlays-calendarmodal-quick-add-input-background-xo1bj</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(20, 40, 60, 0.6)</code> | <code>rgba(0, 0, 0, 0.4)</code> | <code>rgba(0, 0, 0, 0.3)</code> |
| <code>--theme-components-overlays-calendarmodal-quick-add-input-focus-border-color-19dnh</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.4)</code> |
| <code>--theme-components-overlays-livecanvas-canvas-header-background-8mqiq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(26, 46, 43, 0.5)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-overlays-livecanvas-canvas-header-border-bottom-33gfy</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.06)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-livecanvas-canvas-modal-background-1of2t</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#111</code> | <code>#0b1211</code> | <code>#050505</code> |
| <code>--theme-components-overlays-livecanvas-canvas-modal-border-rlxn3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(212, 163, 115, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-livecanvas-canvas-modal-box-shadow-1x3oe</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.6)</code> | <code>0 30px 60px rgba(0, 0, 0, 0.7)</code> | <code>0 40px 100px rgba(0, 0, 0, 0.9)</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-active-background-1j6gx</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(3, 95, 42, 0.771)</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-active-border-color-1xb8f</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 100, 0.912)</code> | <code>#81e6d9</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-background-1kr6b</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.52)</code> | <code>rgba(0, 0, 0, 0.3)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-border-1ytae</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-color-fs5n5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#777</code> | <code>#64748b</code> | <code>#555555</code> |
| <code>--theme-components-overlays-organizermodal-org-filter-btn-hover-color-rnz45</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#bbb</code> | <code>#cbd5e1</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-item-check-border-1i94y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.2)</code> | <code>rgba(152, 255, 217, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-org-item-check-checked-background-5xil6</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(76, 175, 80, 0.1)</code> | <code>rgba(167, 243, 208, 0.2)</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-item-rec-color-lx85k</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#a855f7</code> | <code>#d4a373</code> | <code>#888888</code> |
| <code>--theme-components-overlays-organizermodal-org-item-row-background-1d738</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(30, 50, 70, 0.3)</code> | <code>rgba(26, 46, 43, 0.3)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-overlays-organizermodal-org-item-row-hover-background-10wdq</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 120, 0.2)</code> | <code>rgba(79, 209, 197, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-btn-background-jlh43</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 150, 180, 0.5)</code> | <code>#d4a373</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-btn-border-1jdcc</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.4)</code> | <code>#8e5431</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-btn-hover-background-1m6k2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 180, 200, 0.6)</code> | <code>#8e5431</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-name-background-xo1bj</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(20, 40, 60, 0.6)</code> | <code>rgba(0, 0, 0, 0.4)</code> | <code>rgba(0, 0, 0, 0.4)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-name-focus-border-color-19dnh</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-rec-toggle-active-border-color-1jdub</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-rec-toggle-background-qxrmc</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-org-qa-rec-toggle-border-rlxn3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-org-quick-add-background-1oise</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 50, 80, 0.2)</code> | <code>rgba(26, 46, 43, 0.2)</code> | <code>rgba(0, 0, 0, 0.4)</code> |
| <code>--theme-components-overlays-organizermodal-org-quick-add-border-19ivk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.12)</code> | <code>rgba(152, 255, 217, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-org-rec-panel-background-1wu8q</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 0, 0, 0.15)</code> | <code>rgba(0, 0, 0, 0.1)</code> | <code>rgba(0, 0, 0, 0.2)</code> |
| <code>--theme-components-overlays-organizermodal-org-section-title-border-bottom-vmrwx</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-btn-secondary-border-1gvsk</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.15)</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-header-border-bottom-9zuog</code> | Exact alias | <code>--ui-settings-radio-border</code> | <code>rgba(0, 200, 200, 0.15)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-modal-background-gradient</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>linear-gradient(135deg, #80d2972d 0%, #0115343a 100%)</code> | <code>linear-gradient(135deg, #0b1211, #17100b)</code> | <code>linear-gradient(135deg, #111 0%, #000 100%)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-modal-border-d763t</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.7)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-modal-border-eerk1</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 100, 100, 0.6)</code> | <code>rgba(142, 84, 49, 0.3)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-overlay-background-gowbr</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0,255,255,.1)</code> | <code>rgba(0, 0, 0, 0.75)</code> | <code>rgba(0, 0, 0, 0.5)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tab-active-background-1w8u1</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.08)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tab-active-color-26sfj</code> | Exact alias | <code>--chat-input-text-color</code> | <code>lime</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tab-color-1plkp</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>white</code> | <code>#f0fdfa</code> | <code>#888888</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tab-hover-background-762aa</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.05)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tabs-background-1jtgs</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 30, 50, 0.3)</code> | <code>rgba(0, 0, 0, 0.2)</code> | <code>rgba(0, 0, 0, 0.4)</code> |
| <code>--theme-components-overlays-organizermodal-organizer-tabs-border-bottom-kz1a9</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-overlays-organizermodal-tab-count-background-1bm8l</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>#334155</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-overlays-organizermodal-to-box-shadow-n09w3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0,0,0,0.2)</code> | <code>0 10px 20px rgba(0, 0, 0, 0.4)</code> | <code>none</code> |
| <code>--theme-components-phantomsection-phantom-btn-danger-border-color-1d4wr</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(248, 113, 113, 0.2)</code> | <code>rgba(253, 164, 175, 1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-phantomsection-phantom-btn-danger-not-disabled-hover-background-1swzb</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(248, 113, 113, 0.12)</code> | <code>rgba(253, 164, 175, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-btn-primary-border-color-kf5iz</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.2)</code> | <code>rgba(152, 255, 217, 0.3)</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--theme-components-phantomsection-phantom-btn-primary-not-disabled-hover-background-1ak3j</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.12)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-phantomsection-phantom-btn-record-launch-border-color-1j9jl</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.25)</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-phantom-btn-record-launch-hover-background-12szs</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.14)</code> | <code>rgba(212, 163, 115, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-phantomsection-phantom-drawer-background-1q77m</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#000</code> | <code>#050808</code> | <code>#050505</code> |
| <code>--theme-components-phantomsection-phantom-event-row-color-1gv4y</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#3a3a3a</code> | <code>#94a3b8</code> | <code>#444444</code> |
| <code>--theme-components-phantomsection-phantom-event-row-hover-background-i129j</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.015)</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-phantomsection-phantom-events-background-1eqtm</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#020202</code> | <code>#070a0a</code> | <code>#000000</code> |
| <code>--theme-components-phantomsection-phantom-events-border-top-1u83g</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#0f0f0f</code> | <code>rgba(152, 255, 217, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-record-hint-color-39knf</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#222</code> | <code>red</code> | <code>#555555</code> |
| <code>--theme-components-phantomsection-phantom-run-opts-input-border-h3919</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#1e1e1e</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--theme-components-phantomsection-phantom-run-opts-input-focus-border-color-1rpa6</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.3)</code> | <code>#4fd1c5</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-phantom-status-background-16ah5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.03)</code> | <code>rgba(15, 23, 22, 0.4)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-phantomsection-phantom-status-border-bottom-1of2t</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#111</code> | <code>rgba(255, 255, 255, 0.02)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-status-dot-background-1uyf8</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#333</code> | <code>#334155</code> | <code>#333333</code> |
| <code>--theme-components-phantomsection-phantom-status-error-phantom-status-dot-background-sabad</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#f87171</code> | <code>#fda4af</code> | <code>#666666</code> |
| <code>--theme-components-phantomsection-phantom-status-text-color-fs5n5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#777</code> | <code>#64748b</code> | <code>#888888</code> |
| <code>--theme-components-phantomsection-phantom-status-waiting-phantom-status-dot-background-ujrr8</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#facc15</code> | <code>#fde68a</code> | <code>#aaaaaa</code> |
| <code>--theme-components-phantomsection-phantom-tab-color-161cz</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#444</code> | <code>red</code> | <code>#555555</code> |
| <code>--theme-components-phantomsection-phantom-tabs-background-yq5ln</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#050505</code> | <code>black</code> | <code>#080808</code> |
| <code>--theme-components-phantomsection-phantom-toggle-background-afq8i</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#0a0a0a</code> | <code>#070a0a</code> | <code>#000000</code> |
| <code>--theme-components-phantomsection-phantom-toggle-border-top-2mdx5</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#1a1a1a</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-toggle-dot-background-1p0ut</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#2a2a2a</code> | <code>#334155</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-phantom-toggle-open-border-top-color-1glmw</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.4)</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-phantom-wf-del-color-13fl3</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#2a1010</code> | <code>#331515</code> | <code>#444444</code> |
| <code>--theme-components-phantomsection-phantom-wf-del-hover-background-f4575</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(248, 113, 113, 0.06)</code> | <code>rgba(253, 164, 175, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-wf-inspect-hover-background-avbmd</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.04)</code> | <code>rgba(79, 209, 197, 0.05)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--theme-components-phantomsection-phantom-wf-name-color-rnz45</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#bbb</code> | <code>#cbd5e1</code> | <code>#cccccc</code> |
| <code>--theme-components-phantomsection-phantom-wf-row-hover-background-1f6dx</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(255, 255, 255, 0.025)</code> | <code>rgba(255, 255, 255, 0.02)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--theme-components-phantomsection-phantom-wf-row-selected-background-1vsvg</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.05)</code> | <code>rgba(79, 209, 197, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--theme-components-phantomsection-phantom-wf-run-border-p8yj7</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#132a1e</code> | <code>rgba(152, 255, 217, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-phantomsection-phantom-wf-run-color-13c30</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#1a4a2e</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-phantom-wf-run-hover-background-walzz</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>rgba(0, 255, 136, 0.06)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--theme-components-phantomsection-root-app-1jpsf</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>#00e5ff</code> | <code>black</code> | <code>#ffffff</code> |
| <code>--theme-components-phantomsection-root-app-b5mm4</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>green</code> | <code>black</code> | <code>#888888</code> |
| <code>--theme-components-phantomsection-root-app-o0md2</code> | Component exception | <code>Retain unchanged in pilot</code> | <code>black</code> | <code>#050808</code> | <code>#000000</code> |
| <code>--ui-app-bg</code> | Composite recipe | <code>--theme-recipe-app</code> | <code>black</code> | <code>linear-gradient(to right, #0f1716 0%, #1a2e2b 50%, #17100b 100%)</code> | <code>radial-gradient(ellipse farthest-side at top left, teal 0%, rgba(14,0,20) 50%)</code> |
| <code>--ui-app-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>3px solid #000</code> | <code>2px solid rgba(152, 255, 217, 0.2)</code> | <code>1px solid rgba(255, 255, 255, 0.08)</code> |
| <code>--ui-app-shadow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>inset 0 0 10px rgba(0, 40, 70)</code> | <code>0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(212, 163, 115, 0.05)</code> | <code>0 20px 50px rgba(0, 0, 0, 0.8)</code> |
| <code>--ui-body-bg</code> | Foundational token | <code>--theme-canvas</code> | <code>black</code> | <code>#0b1211</code> | <code>radial-gradient(ellipse farthest-corner at top left, rgba(0,0,10) 0%, rgba(14, 0, 20) 50%)</code> |
| <code>--ui-border-radius</code> | Structural token | <code>--theme-radius-panel</code> | <code>16px</code> | <code>3px</code> | <code>15px</code> |
| <code>--ui-btn-border-radius</code> | Structural token | <code>--theme-radius-control</code> | <code>22px</code> | <code>0px</code> | <code>12px</code> |
| <code>--ui-button-ghost-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>transparent</code> | <code>rgba(255, 255, 255, 0.02)</code> | <code>transparent</code> |
| <code>--ui-button-ghost-bg-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-button-ghost-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(163, 247, 229, 0.15)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-button-ghost-border-strong</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.15)</code> | <code>rgba(163, 247, 229, 0.3)</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--ui-button-ghost-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#888</code> | <code>#94a3b8</code> | <code>#888888</code> |
| <code>--ui-button-ghost-text-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#aaa</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--ui-chat-header-bg</code> | Composite recipe | <code>--theme-recipe-chat-header</code> | <code>linear-gradient(teal, black 50%, lime 150%)</code> | <code>linear-gradient(to right, rgba(152, 255, 217, 0.13) 0%, rgba(152, 255, 217, 0.2) 50%, rgba(152, 255, 217, 0.1) 100%)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-chat-header-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>lime</code> | <code>rgba(152, 255, 217, 0.3)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-chat-header-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>pink</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--ui-chat-input-bg</code> | Composite recipe | <code>--theme-recipe-chat-input</code> | <code>linear-gradient(rgba(22, 135, 131, 0.6), rgba(0, 43, 54, 0.447))</code> | <code>linear-gradient(rgba(15, 23, 22, 0.9), rgba(26, 16, 11, 0.8))</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--ui-chat-input-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>rgba(152, 255, 217, 0.15)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--ui-chat-input-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#fff</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--ui-chat-placeholder</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 255, 136, 0.5)</code> | <code>rgba(152, 255, 217, 0.3)</code> | <code>#444444</code> |
| <code>--ui-chat-textarea</code> | Composite recipe | <code>Retain as authored recipe</code> | <code>linear-gradient(rgba(22, 135, 131, 0.6), rgba(0, 43, 54, 0.447))</code> | <code>∅</code> | <code>∅</code> |
| <code>--ui-controlbar-bg</code> | Composite recipe | <code>--theme-recipe-controlbar</code> | <code>linear-gradient(120deg, teal, black, magenta, rgba(90, 6, 6), purple, black, teal)</code> | <code>linear-gradient(45deg, rgba(255,255,0,0.02) 25%, transparent 25%) 0 0 / 20px 20px, linear-gradient(-45deg, rgba(255,255,0,0.02) 25%, transparent 25%) 0 0 / 20px 20px, linear-gradient(45deg, transparent 75%, rgba(255,255,0,0.02) 75%) 0 0 / 20px 20px, linear-gradient(-45deg, transparent 75%, rgba(255,255,0,0.02) 75%) 0 0 / 20px 20px, #2c2c2c</code> | <code>radial-gradient(rgb(20,20,20) 2px, black 4px)</code> |
| <code>--ui-controlbar-bg-size</code> | Structural token | <code>Retain as structural semantic</code> | <code>∅</code> | <code>120px 120px</code> | <code>45px 45px</code> |
| <code>--ui-controlbar-filter</code> | Structural token | <code>Retain as structural semantic</code> | <code>blur(0px) brightness(1) saturate(.35)</code> | <code>blur(0px) brightness(1) saturate(0.2)</code> | <code>∅</code> |
| <code>--ui-controlbar-filter-hover</code> | Structural token | <code>Retain as structural semantic</code> | <code>blur(0px) brightness(2) saturate(1)</code> | <code>blur(0px) brightness(1.2) saturate(1.1)</code> | <code>blur(0px) brightness(.9) grayscale(1)contrast(1)</code> |
| <code>--ui-controlbar-shadow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>inset 0 0 8px #fff, inset 0 0 20px red</code> | <code>inset 0 0 8px black,inset 0 0 20px goldenrod</code> | <code>0 -1px 0 rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-corner-shape</code> | Structural token | <code>--theme-corner-shape</code> | <code>∅</code> | <code>∅</code> | <code>bevel</code> |
| <code>--ui-font-main</code> | Structural token | <code>--theme-font-ui</code> | <code>chillax</code> | <code>warbler variable</code> | <code>bc alphapipe</code> |
| <code>--ui-header-bg</code> | Composite recipe | <code>--theme-recipe-header</code> | <code>linear-gradient(to bottom, black 80%, deeppink)</code> | <code>linear-gradient(to right, #0f1716 0%, #1a2e2b 50%, #17100b 100%)</code> | <code>linear-gradient(to bottom, transparent, rgba(0,0,0,.1)),radial-gradient(rgba(0,0,0,.7) 3px, rgba(0,40,40.8) .4px) 10px 10px / 5px 5px rgb(0,20,21)</code> |
| <code>--ui-header-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>limegreen</code> | <code>#f0fdfa</code> | <code>gray</code> |
| <code>--ui-markdown-code-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 229, 229, 0.1)</code> | <code>rgba(15, 23, 22, 0.8)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-markdown-code-color</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#00e5e5</code> | <code>#81e6d9</code> | <code>#f0f0f0</code> |
| <code>--ui-markdown-th-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 229, 229, 0.1)</code> | <code>rgba(212, 163, 115, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-modal-bg</code> | Composite recipe | <code>--theme-recipe-modal</code> | <code>linear-gradient(135deg, #80d2972d 0%, #0115343a 100%)</code> | <code>linear-gradient(135deg, rgba(15, 23, 22, 0.98) 0%, rgba(26, 16, 11, 0.98) 100%)</code> | <code>radial-gradient(rgba(0,0,0,.7) 3px, rgba(0,40,40.8) .4px) 10px 10px / 5px 5px black</code> |
| <code>--ui-modal-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(163, 247, 229, 0.25)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-modal-close</code> | Exact alias | <code>--ui-panel-btn</code> | <code>#666</code> | <code>#64748b</code> | <code>#666666</code> |
| <code>--ui-modal-footer-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 30, 50, 0.3)</code> | <code>rgba(26, 16, 11, 0.2)</code> | <code>rgba(0, 0, 0, 0.2)</code> |
| <code>--ui-modal-footer-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>rgba(212, 163, 115, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-modal-header-bg</code> | Composite recipe | <code>Retain as authored recipe</code> | <code>rgba(0, 50, 80, 0.2)</code> | <code>rgba(79, 209, 197, 0.05)</code> | <code>radial-gradient(rgba(0,0,0,.7) 3px, rgba(0,40,40.8) .4px) 10px 10px / 5px 5px black</code> |
| <code>--ui-modal-header-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.15)</code> | <code>rgba(163, 247, 229, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-modal-save-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 150, 180, 0.5)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-modal-save-bg-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 180, 200, 0.6)</code> | <code>#81e6d9</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--ui-modal-save-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.4)</code> | <code>#81e6d9</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--ui-modal-save-shadow-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 15px rgba(0, 200, 200, 0.2)</code> | <code>0 0 15px rgba(79, 209, 197, 0.4)</code> | <code>0 0 20px rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-modal-save-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#00e5e5</code> | <code>#0b1211</code> | <code>#ffffff</code> |
| <code>--ui-modal-tab-active-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.08)</code> | <code>rgba(79, 209, 197, 0.1)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-modal-tab-active-text</code> | Exact alias | <code>--ui-modal-title</code> | <code>#00e5e5</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--ui-modal-tab-hover-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.05)</code> | <code>rgba(79, 209, 197, 0.05)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--ui-modal-tab-hover-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#aaa</code> | <code>#81e6d9</code> | <code>#999999</code> |
| <code>--ui-modal-tab-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#666</code> | <code>#94a3b8</code> | <code>#666666</code> |
| <code>--ui-modal-tabs-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 30, 50, 0.3)</code> | <code>rgba(15, 23, 22, 0.4)</code> | <code>rgba(0, 0, 0, 0.2)</code> |
| <code>--ui-modal-tabs-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.1)</code> | <code>rgba(152, 255, 217, 0.08)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-modal-title</code> | Exact alias | <code>--ui-modal-tab-active-text</code> | <code>#00e5e5</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--ui-panel-btn</code> | Exact alias | <code>--ui-modal-close</code> | <code>#666</code> | <code>#64748b</code> | <code>#666666</code> |
| <code>--ui-panel-btn-hover</code> | Exact alias | <code>--ui-modal-tab-active-text</code> | <code>#00e5e5</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--ui-panel-header-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#888</code> | <code>#81e6d9</code> | <code>#aaaaaa</code> |
| <code>--ui-provider-tab-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.03)</code> | <code>rgba(255, 255, 255, 0.02)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--ui-provider-tab-bg-active</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 229, 229, 0.15)</code> | <code>rgba(212, 163, 115, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--ui-provider-tab-bg-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.05)</code> | <code>rgba(79, 209, 197, 0.05)</code> | <code>rgba(255, 255, 255, 0.04)</code> |
| <code>--ui-provider-tab-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(255, 255, 255, 0.1)</code> | <code>rgba(152, 255, 217, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-provider-tab-border-active</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 229, 229, 0.3)</code> | <code>#d4a373</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--ui-provider-tab-text</code> | Exact alias | <code>--ui-settings-section-desc</code> | <code>#888</code> | <code>#64748b</code> | <code>#777777</code> |
| <code>--ui-provider-tab-text-active</code> | Exact alias | <code>--ui-settings-radio-label-active</code> | <code>#00e5e5</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--ui-provider-tab-text-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#ccc</code> | <code>#cbd5e1</code> | <code>#ffffff</code> |
| <code>--ui-settings-hint</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#666</code> | <code>#475569</code> | <code>#555555</code> |
| <code>--ui-settings-input-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(20, 40, 60, 0.6)</code> | <code>rgba(15, 23, 22, 0.6)</code> | <code>rgba(0, 0, 0, 0.4)</code> |
| <code>--ui-settings-input-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>rgba(152, 255, 217, 0.12)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--ui-settings-input-focus-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>#4fd1c5</code> | <code>rgba(255, 255, 255, 0.2)</code> |
| <code>--ui-settings-input-focus-shadow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 10px rgba(0, 200, 200, 0.1)</code> | <code>0 0 12px rgba(79, 209, 197, 0.2)</code> | <code>0 0 15px rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-settings-input-placeholder</code> | Exact alias | <code>--palette-text-dim</code> | <code>#555</code> | <code>#334155</code> | <code>#333333</code> |
| <code>--ui-settings-input-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>lime</code> | <code>#f0fdfa</code> | <code>#ffffff</code> |
| <code>--ui-settings-label</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#aaa</code> | <code>#cbd5e1</code> | <code>#999999</code> |
| <code>--ui-settings-radio-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(20, 40, 60, 0.4)</code> | <code>rgba(15, 23, 22, 0.4)</code> | <code>rgba(255, 255, 255, 0.02)</code> |
| <code>--ui-settings-radio-bg-active</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 100, 120, 0.3)</code> | <code>rgba(212, 163, 115, 0.15)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-settings-radio-bg-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 80, 100, 0.3)</code> | <code>rgba(79, 209, 197, 0.05)</code> | <code>rgba(255, 255, 255, 0.05)</code> |
| <code>--ui-settings-radio-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.15)</code> | <code>rgba(152, 255, 217, 0.1)</code> | <code>rgba(255, 255, 255, 0.08)</code> |
| <code>--ui-settings-radio-border-active</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.5)</code> | <code>#d4a373</code> | <code>rgba(255, 255, 255, 0.3)</code> |
| <code>--ui-settings-radio-border-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.3)</code> | <code>rgba(152, 255, 217, 0.3)</code> | <code>rgba(255, 255, 255, 0.12)</code> |
| <code>--ui-settings-radio-label</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>lime</code> | <code>#cbd5e1</code> | <code>#888888</code> |
| <code>--ui-settings-radio-label-active</code> | Exact alias | <code>--ui-provider-tab-text-active</code> | <code>#00e5e5</code> | <code>#d4a373</code> | <code>#ffffff</code> |
| <code>--ui-settings-radio-shadow-active</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 15px rgba(0, 200, 200, 0.1)</code> | <code>0 0 15px rgba(212, 163, 115, 0.15)</code> | <code>0 0 10px rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-settings-section-desc</code> | Exact alias | <code>--ui-provider-tab-text</code> | <code>#888</code> | <code>#64748b</code> | <code>#777777</code> |
| <code>--ui-settings-toggle-bg</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 80, 100, 0.3)</code> | <code>rgba(26, 46, 43, 0.5)</code> | <code>rgba(255, 255, 255, 0.03)</code> |
| <code>--ui-settings-toggle-bg-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 100, 120, 0.4)</code> | <code>rgba(79, 209, 197, 0.15)</code> | <code>rgba(255, 255, 255, 0.06)</code> |
| <code>--ui-settings-toggle-border</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.2)</code> | <code>rgba(152, 255, 217, 0.2)</code> | <code>rgba(255, 255, 255, 0.1)</code> |
| <code>--ui-settings-toggle-border-hover</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>rgba(0, 200, 200, 0.4)</code> | <code>rgba(152, 255, 217, 0.4)</code> | <code>rgba(255, 255, 255, 0.15)</code> |
| <code>--ui-settings-toggle-text</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#00e5e5</code> | <code>#4fd1c5</code> | <code>#cccccc</code> |
| <code>--ui-slider-thumb-bg</code> | Exact alias | <code>--ui-modal-tab-active-text</code> | <code>#00e5e5</code> | <code>#98ffd9</code> | <code>#ffffff</code> |
| <code>--ui-slider-thumb-shadow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 6px rgba(0, 229, 229, 0.5)</code> | <code>0 0 8px #4fd1c5</code> | <code>0 0 8px rgba(255, 255, 255, 0.4)</code> |
| <code>--ui-text-primary</code> | Exact alias | <code>--palette-text-main</code> | <code>lime</code> | <code>#e6fffa</code> | <code>#ffffff</code> |
| <code>--ui-title-gradient</code> | Composite recipe | <code>--theme-recipe-title</code> | <code>linear-gradient(120deg, teal, black, magenta, rgba(90, 6, 6), purple, black, teal)</code> | <code>linear-gradient(120deg, #a3f7e5, #4fd1c5, #d4a373, #8e5431, #4fd1c5)</code> | <code>linear-gradient(90deg, #ffffff, #888888, #ffffff)</code> |
| <code>--ui-title-icon</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>#00e5e5</code> | <code>#98ffd9</code> | <code>white</code> |
| <code>--ui-title-icon-glow</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0 0 8px #00e5e5</code> | <code>0 0 10px rgba(152, 255, 217, 0.6)</code> | <code>0 0 10px rgba(255, 255, 255, 0.3)</code> |
| <code>--ui-title-stroke</code> | Semantic role | <code>Retain as semantic alias pending pilot</code> | <code>0.1px #fff</code> | <code>0.2px rgba(255, 255, 255, 0.4)</code> | <code>0.5px rgba(255, 255, 255, 0.5)</code> |

## Boundary

No selector, theme value, runtime behavior, or prototype was modified. The evidence supports a reversible pilot; it does **not** support replacing 331 names with 22 tokens in one pass.

