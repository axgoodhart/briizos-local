# Theme stylesheet extraction

The original files were renamed to `docs/theme-archive/AppCombined.before-theme-split.css` and `docs/theme-archive/App.before-theme-split.css`. The late App.css declarations follow AppCombined declarations in both extracted streams. Every shipped appearance file contains its own complete common appearance and selected theme declarations; no appearance file imports or derives from another theme file.

## Runtime and Chromap contract

Load structural `src/AppCombined.css` once. Install exactly one complete appearance stylesheet after it, before user overrides. Set the root `data-theme` to that file's context ID, including for a saved/custom copy, and retain `/* briizOS theme-context: <id> */` on export/import. A custom copy needs this context ID to activate its own selectors; it needs no other theme stylesheet. `getBuiltInThemeCss(id)` returns raw CSS and `getBuiltInThemeFile(id)` returns its filename, with a default fallback. IDs absent from the visible registry but present in original CSS are preserved: `space-ss`, `transparent`.

Root `:root[data-theme="..."]` selectors remain byte-for-byte unchanged except filtering comma-separated branches for other app themes. This preserves the original specificity, inheritance, cascade order, conditional wrappers, and theme-dependent structural variables. Non-root theme attributes, including Forest's `.forest-shell[data-theme="dim"]`, remain independent and are included in every appearance file. Custom-theme selectors remain conditional on `data-custom-theme`.

Appearance includes literal values and custom properties consumed by appearance, with transitive variable dependencies. Mixed variables live in the appearance file because the structural sheet can consume the active theme's values. Variables used exclusively by geometry, spacing, interaction, or motion retain their original structural declarations and root theme gates. Runtime-only appearance tokens are retained. Unused names with no CSS or literal JavaScript/TypeScript consumers are retired from active stylesheets, with exact source definitions preserved in src/themes/retiredThemeVariables.json for explicit legacy-reference rescue. Semantic role names are never merged merely because their current values coincide.

Shorthand families (background, border, outline, font, mask, and list-style) are kept together. Motion-only keyframes remain structural. If any definition of a keyframe name animates appearance, every definition of that name moves whole to each appearance file, including its geometry declarations; two partial keyframes would not merge and would break existing animations. Existing last-definition behavior is preserved. The affected names are `aiviz-pulse`, `backflow`, `bfast-bead-pulse`, `bfast-fade-in-up`, `briizy-bubble-in`, `briizy-glow-in`, `bzf-active-breathe`, `bzf-pulse`, `bzf-step-in`, `cal-fadeIn`, `cal-slideUp`, `cardSlideIn`, `cardSlideOut`, `cv-slidein`, `fadeIn`, `fdockIn`, `flipUp`, `fwIn`, `ghostPulse`, `hue-drift`, `hueroto`, `jfGrabPulse`, `jfPopIn`, `jfTrayIn`, `logoGradient`, `modalIn`, `pendingPulse`, `ph-pulse`, `popIn`, `pulse`, `recordPulse`, `sleep-bounce`, `slideInFromLeft`, `slideUp`, `streamPulse`, `stylofact-pulse`, `stylofact-stage-in`, `themePickerPopIn`, `themeTransitionFlash`, `wake-up`.

Typography and border widths retain their original values, although editing them later can intentionally change density. The migration does not increase spacing, dimensions, or control sizes. Remote/data image URLs remain unchanged.

## Counts

- 429 custom-property names retained from 454 original names.
- 403 names belong to appearance; 26 remain structural.
- 1 names have both appearance and structural consumers.
- 0 exact duplicate declarations removed within their original blocks only. Different values and repeated selector blocks are retained.
- 25 unused names with no CSS var() reference and no literal JavaScript/TypeScript reference under src/ or electron/ are removed from active stylesheets. Their exact selector/context definitions are retained in retiredThemeVariables.json and the untouched source archives.
- 4 names with no CSS var() reference are explicitly mentioned in JavaScript/TypeScript and preserved.

| Complete appearance file context | Declarations | Bytes |
| --- | ---: | ---: |
| antarctic-teafog | 8326 | 458194 |
| autumn-candle | 8326 | 457785 |
| burnt-chestnut | 8315 | 459024 |
| caspian-sea | 8329 | 458195 |
| default | 8039 | 435674 |
| glacial-dusk | 8323 | 458403 |
| great-wave | 8177 | 443852 |
| medieval-taurus | 8341 | 459047 |
| mint-icecube | 8321 | 461801 |
| mistic | 8325 | 458262 |
| neon-orbi | 8320 | 458090 |
| pearlescence | 8152 | 443710 |
| peppermint-foil | 8323 | 458432 |
| postlinear-glassos | 8324 | 457926 |
| rose-petal | 8151 | 443664 |
| sherbert-sakura | 8312 | 457167 |
| space-glass | 8152 | 443571 |
| sunbrocksen | 8322 | 458948 |
| verdigris | 8433 | 464592 |
| vineyard-gloom | 8326 | 458630 |
| winterbloom | 8327 | 457514 |
| space-ss | 8149 | 443504 |
| transparent | 8313 | 455629 |

## Mixed variables

- `--cc-font-size-medium`

## Structural variables

- `--card-w`
- `--cb-tab-active-width`
- `--cb-tab-width`
- `--cc-app-header-height`
- `--cc-gap-huge`
- `--cc-gap-large`
- `--cc-gap-medium`
- `--cc-gap-none`
- `--cc-gap-small`
- `--cc-padding-huge`
- `--cc-padding-large`
- `--cc-padding-medium`
- `--cc-padding-small`
- `--cc-padding-tiny`
- `--fdock-height`
- `--interaction-bar-height`
- `--layout-gap`
- `--layout-header-height`
- `--layout-resize-handle-size`
- `--layout-transition-fast`
- `--layout-transition-normal`
- `--stylofact-space-lg`
- `--stylofact-space-sm`
- `--ui-controlbar-bg-speed`
- `--ui-title-duration`
- `--vertical-header-width`

## Retired unused names

The existing version 1 saved-theme schema restricts user variables to its curated registry. These names have no CSS var() consumers and no literal JavaScript/TypeScript references. Removing them is limited to the active generated stylesheets. Legacy import can inspect explicit var() references and restore the matching exact definitions from retiredThemeVariables.json, which records value, importance, selector, conditional ancestry, theme contexts, source location, and ready-to-append CSS. No equal-valued semantic role names are merged.

| Variable | Original definition |
| --- | --- |
| `--bg-0` | docs/theme-archive/AppCombined.before-theme-split.css:29431 |
| `--bg-1` | docs/theme-archive/AppCombined.before-theme-split.css:29432 |
| `--bg-2` | docs/theme-archive/AppCombined.before-theme-split.css:29433 |
| `--darktext` | docs/theme-archive/AppCombined.before-theme-split.css:29439 |
| `--dna-frame-border-width` | docs/theme-archive/AppCombined.before-theme-split.css:9970 |
| `--glass-2` | docs/theme-archive/AppCombined.before-theme-split.css:29435 |
| `--radius` | docs/theme-archive/AppCombined.before-theme-split.css:29443 |
| `--shadowtop` | docs/theme-archive/AppCombined.before-theme-split.css:29441 |
| `--stylofact-shadow` | docs/theme-archive/AppCombined.before-theme-split.css:21932 |
| `--stylofact-space-md` | docs/theme-archive/AppCombined.before-theme-split.css:21958 |
| `--stylofact-space-xl` | docs/theme-archive/AppCombined.before-theme-split.css:21960 |
| `--stylofact-space-xs` | docs/theme-archive/AppCombined.before-theme-split.css:21956 |
| `--theme-components-controlbar-controlbar-cb-toggle-hover-box-shadow-1bm8l` | docs/theme-archive/AppCombined.before-theme-split.css:1334 |
| `--theme-components-overlays-calendarmodal-calendar-modal-border-1jdub` | docs/theme-archive/AppCombined.before-theme-split.css:1390 |
| `--theme-components-overlays-calendarmodal-calendar-overlay-background-gb7i3` | docs/theme-archive/AppCombined.before-theme-split.css:1393 |
| `--theme-components-overlays-calendarmodal-quick-add-btn-background-jlh43` | docs/theme-archive/AppCombined.before-theme-split.css:1399 |
| `--theme-components-overlays-calendarmodal-quick-add-btn-hover-background-1m6k2` | docs/theme-archive/AppCombined.before-theme-split.css:1400 |
| `--theme-components-overlays-organizermodal-organizer-modal-border-d763t` | docs/theme-archive/AppCombined.before-theme-split.css:1434 |
| `--theme-components-overlays-organizermodal-organizer-modal-border-eerk1` | docs/theme-archive/AppCombined.before-theme-split.css:1435 |
| `--theme-components-phantomsection-root-app-b5mm4` | docs/theme-archive/AppCombined.before-theme-split.css:1327 |
| `--theme-components-phantomsection-root-app-o0md2` | docs/theme-archive/AppCombined.before-theme-split.css:1328 |
| `--ui-header-bag` | docs/theme-archive/AppCombined.before-theme-split.css:8047 |
| `--ui-logo-font` | docs/theme-archive/AppCombined.before-theme-split.css:11863 |
| `--ui-master-filter` | docs/theme-archive/AppCombined.before-theme-split.css:7102 |
| `--ui-modal-border` | docs/theme-archive/AppCombined.before-theme-split.css:1192 |

## Runtime-only names, retained

| Variable | Code references |
| --- | --- |
| `--card-glass` | src/theme/themeRegistry.js, electron/theme-library-validation.js |
| `--glass-border` | src/theme/themeRegistry.js, electron/theme-library-validation.js |
| `--layout-bg-secondary` | src/theme/themeRegistry.js, electron/theme-library-validation.js |
| `--theme-corner-style` | src/theme/themeRegistry.js, src/theme/themeRuntime.test.js, src/theme/themeSource.js, electron/theme-library-validation.js |

## Proven duplicate declarations removed

| Property | Selector/context | Original source |
| --- | --- | --- |
| None |

## Regenerating the migration

Direct edits to the appearance files are the normal authoring workflow. The migration script is for explicitly rebuilding from preserved original inputs: `node scripts/extract-theme-styles.mjs --regenerate`. Add `--additions /absolute/path/to/additions.css` to append new shared declarations after the archived App.css content. Regeneration renames all replaced generated outputs into a dated directory under docs/theme-archive before writing replacements, so direct theme edits remain recoverable.

No build, test, lint, server, or visual verification was run by this migration. The report is generated from the same AST transform that writes the implementation.
