# Theme model proposal — October 2026

Status: proposal, nothing changed yet. Companion to `docs/theme-authoring.md`. The interactive tooling lives in Chromap (`../chromap`, the ConsoliChrome workbench).

## What "unwieldy" means today, measured

| Fact | Number |
| --- | ---: |
| `src/AppCombined.css` | 31,106 lines, 1.27 MB |
| Built-in theme sections (`:root[data-theme='…']`) | 22 themes, ~300 variables each, ~5,900 declarations |
| Themes with two sections | 5 (verdigris has two full ones with 94 conflicting values; the later one wins) |
| Machine-named variables per theme (`--theme-components-…-1jdub`) | 174 of ~300 (57%) |
| Literal vs derived values in a typical theme | ~300 literal, 1–30 derived |
| Variables identical in every theme | 32 |
| Variables defined in themes but never read | 19 |
| Names referenced but never defined anywhere | 83 (`--palette-accent-cyan` 24 uses with no fallback, `--palette-neon-green` 16: invalid in every theme) |
| Shared declarations that hard-code a color, no variable | 2,180 (no theme can change them) |
| Saved custom theme | one 475 KB CSS blob per theme |
| Registry copies | 3 lists that disagree (22 ids in `builtInThemes.js`, 23 in `themeFiles.js`, 16 in `electron/theme-library-validation.js`); `cloudfrost` has no source file, `space-ss` and `transparent` are orphaned |

Two consequences matter most:

- **A theme is a flat list of ~300 hand-set colors.** The Palette shortcuts in Theme Studio move 2–3 variables each; the other ~290 stay where they were. That is why re-tinting a theme never looks right and why every new theme is a copy-and-retouch job.
- **Theme Studio does not edit the section that renders.** Built-in themes render from their section in `AppCombined.css`; the Studio needs to read, edit and save that section directly. Today the inventory also shows up to 24 definitions per variable (root + every theme).

Also found while measuring: `-ui-header-poop` (single dash, glacial-dusk) and `--palette-accent-primary: #lightgreen` (caspian-sea) are invalid, and the Islands `--accent-rgb` references are fine (set per island in code).

## The proposal in one sentence

A theme becomes about 25 **anchor** values; everything else becomes a shared **recipe** over those anchors; a theme keeps an explicit **exception** only where it deliberately differs. One stylesheet, same `data-theme` sections, same cascade; the sections shrink from ~300 literals to ~25 anchors plus exceptions.

## The model

- **Anchors (the palette).** Surfaces: canvas, recessed, panel, elevated, overlay. Text: strong, primary, soft, muted, dim. Accents: primary, secondary, tertiary, neon. Status: success, warning, danger. Lines: border, strong border, glow. Type: UI font, display font, mono. Shape: control radius, panel radius, corner shape. Chrome: app border, app shadow, master filter, header gradient. This is already the set in `themeRegistry.js` (`GLOBAL_TOKEN_GROUPS`) and the set the Chromap generator produces.
- **Roles (derived).** The remaining ~270 names are defined once in the shared `:root` as recipes, e.g. `--ui-modal-tab-hover-bg: rgb(from var(--accent-primary) r g b / .05)`. The browser mixes the color from the anchor at render time. Electron 40 supports `color-mix()` and relative color; the file already uses `color-mix()` 195 times.
- **Exceptions.** A theme section may override any role with a literal. The cascade already prefers the theme section over the shared root, so nothing new is needed for precedence.
- **Objects.** Picked-element edits stay as scoped rules inside the theme's section, as now.

## The interactive process: an Anchors workbench in Chromap

No reports. The fitting is done by hand on a board, with the app repainting as you go. Chromap already has the pieces: it reads a stylesheet, splits it into theme scopes (`:root[data-theme]`), keeps every variable's value per theme (`themeTokens`), compares them (the Cross screen), stages changes, and exports a rewritten file whose comment log restores the decisions on re-import. The Anchors workbench is one more screen beside Cross.

**Source.** Chromap opens `src/AppCombined.css` by path and re-reads it on save, so the board always shows the live file. (Today sources are pasted or uploaded; this adds a path option to the server.)

**What is on the screen**

- **Anchor strip** across the top: ~25 slots. Chromap proposes a set (the variables most other variables sit near, per theme). Drag any variable from the list onto a slot to swap it; each chip shows its swatch in the theme currently selected in the scope dock.
- **Judge themes** in the existing scope dock: the colorful themes decide which anchor a role really follows; near-grey themes can't, and you can exclude them from judging.
- **Role board**: one row per remaining variable. Each row shows a strip of 22 swatches (one per theme, the value as it is today), the best recipe found ("Accent at 5%", "Canvas lightened one step"), and a bar for how many themes that recipe reproduces within the current tolerance. Per theme the swatch is marked follows or kept. Click a swatch to flip that theme between following the recipe and keeping its literal.
- **Recipe editor** on a row: anchor picker, kind (opacity, mix with canvas, lighten, darken, same), amount slider. The 22 swatches update live, each with its colour difference from today's value, and the alternatives Chromap considered are one click away.
- **Tolerance slider**: moves the follow/keep boundary for every row at once. The per-theme totals update live ("Glacial Dusk: 25 anchors + 41 exceptions, was 301 lines"). Zero means exact.
- **Filters**: by component group (Header, Modal, Settings, Chat, Organizer, Islands…), and "unresolved only", so the list shrinks as you decide instead of being read top to bottom.
- **Housekeeping as staged tick-boxes**, not findings: "32 identical in every theme → move to root", "19 never read → retire", "2 invalid values → fix", "duplicate sections → merge". The Cross screen's invariant list gets the Stage button.

**Seeing it in the app.** "Apply to app" writes the staged export back to `AppCombined.css`. The briizOS dev build hot-reloads CSS without reloading the page, so the app window repaints in whichever theme it is showing while you drag a slider in Chromap. Switch the app's theme to check another one.

**Knowing nothing moved.** Chromap is a browser, so it resolves the recipes itself: for every theme and every role it computes the recipe's colour and compares it with today's literal. That is the per-theme dot next to each theme name: green when identical within tolerance, amber with a count when not. Clicking amber lists the differing values with old and new swatches. The same check runs on the file after export, so the verdict and the export can't disagree.

**Decisions persist.** Every follow, keep, anchor swap and recipe edit is recorded in Chromap's decision store and in the `CC Status + Log` comment of the exported stylesheet. Re-opening `AppCombined.css` later restores the board exactly, so the work can be done in sittings.

## What changes in briizOS afterwards

- Theme Studio reads and edits a built-in theme's section directly; the inventory shows one definition per variable with its shared recipe as the fallback. Its views become Palette (the anchors; the generator writes exactly these), Roles (recipe result per row, with detach and follow-palette), Objects (the existing picker, unchanged).
- A saved custom theme becomes its section only: anchors, exceptions, object rules. Existing saved themes are migrated by diffing their saved copy against the baseline in git history; the original stays in the existing `ui_theme_library_backup` setting.
- Delete `src/themes/` and `themeFiles.js`; the Studio reads sections instead. Main bundle loses ~11 MB.
- One registry: `builtInThemes.js` feeds the Electron validator and a test that checks every registered theme has a section.
- "Export full CSS" still works on demand by joining master and section, so Chromap keeps a complete sheet.

## Named for later, not part of this move

The 2,180 hard-coded colors in shared rules. The Families screen already groups them by base colour and alpha ramp; the same board can later offer "this literal equals an existing role in Dark Neon → use the role" per family, never inventing a one-off token. The rest stay as they are until each is a design decision.

## Order of work, each step complete on its own

1. Chromap: the Anchors workbench, path source, apply-to-app, per-theme verdict dots, housekeeping stage buttons.
2. The sitting(s) on the board, theme by theme, until every theme's dot is green or its differences are accepted. Export writes the new `AppCombined.css`.
3. briizOS: Studio reads sections, `src/themes/` removed, saved-theme migration, one registry.
4. Theme Studio views: Palette, Roles, Objects.

## Decisions needed

- Rename the 174 machine names to readable role names in the same move or afterwards (a rename map would be applied to saved and imported themes on load).
- Whether `space-ss` and `transparent` return to the picker or are retired.
