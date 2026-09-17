# Theme authoring

The app has one structural stylesheet, `src/AppCombined.css`, and one active complete appearance stylesheet. Shipped appearance files are ordinary editable CSS in `src/themes/AppCombined-THEMEVALUES-<id>.css`. There are 21 visible built-in choices and two preserved legacy contexts. Each file contains the common appearance plus that theme's own declarations, including literal colors, gradients, shadows, borders, corner shapes, and typography. No theme file imports another theme.

`src/App.css` is a compatibility entry without rules. Its former late adjustments were merged in their original order. Do not restart the old pattern of accumulating new appearance overrides there.

## In the app

Restart briizOS after installing this change because the Electron settings validator and storage limits changed too.

- **Global:** search actual custom properties, selectors, property names, or values. Multiple definitions retain their original selectors, source lines, conditions, and order. The usage count is CSS `var()` references, not proof that JavaScript never reads a name. Structural variables are labeled; editing one creates a theme-specific declaration at the same selector and conditions.
- **Selected:** use Pick object, then Up for the parent, Down for the first child, and Left/Right for siblings. Breadcrumbs and buttons provide the same navigation. Arrow keys retain their normal behavior in text fields and other editable controls. Picking selects the actual element rather than the nearest registered theme role.
- **Edit a source declaration:** enter a CSS value and press Enter or leave the field. The declaration stays in its original rule. An existing `!important` is retained; the full CSS editor can remove it explicitly. Opaque hex/RGB literals also have a color picker.
- **Add an override:** choose the individual element or an existing selector, then a state/part and property/value. The scope control applies to new overrides; editing a displayed source rule always changes that displayed rule. Hover, keyboard focus, pressed, and pseudo-element styles are available. `!important` is explicit when needed to beat a runtime inline value.
- **Understand a result:** authored rules, ancestor rules, inactive state candidates, inline values, and computed appearance are separate. A matching source rule is not presented as the winning declaration. Computed appearance is what the browser currently renders. The inspection outline is a separate overlay and does not alter the selected object's own border or shadow.
- **Create:** start with a complete independent default snapshot, or explicitly choose an empty appearance stylesheet. The latter retains structural layout and starts appearance at browser defaults. The palette generator remains available as a shortcut.
- **Save:** preview, undo/redo, revert, Save, and Save as operate on the complete CSS document. The full stylesheet text area has Apply and Reload controls; switching editor tabs keeps unapplied text. Closing or replacing it prompts before discarding changes.

## Chromap

Use Theme Studio's CSS export even when a built-in is selected. Open that complete file in Chromap, edit the entire document, then import the resulting CSS through Theme Studio and save it. CSS import creates an independent draft. JSON export carries the complete CSS plus its name, ID, mode, and metadata.

You can also edit a shipped file directly in `src/themes/`. Keep its `/* briizOS theme-context: ... */` comment and existing root theme selectors. The context activates selectors already contained in that same file; it does not load a parent theme. A saved custom snapshot is intentionally unaffected by later edits to the shipped file it originally copied.

App-selected colors such as note colors and artwork, avatar animation images, and calculated 3D surfaces remain runtime content. The inspector identifies inline values and permits explicit CSS overrides. Embedded applications in separate documents retain their own styling. Individual elements without a stable unique identifier may require a positional selector; the editor explains this and offers class/selector scope for edits that must survive list reordering.

## Source and recovery

The migration retired 25 names with no CSS references or literal JavaScript/TypeScript consumers. Their original definitions remain in `src/themes/retiredThemeVariables.json`; importing a legacy theme that explicitly references one restores its matching declarations. Equal-valued role variables were not merged because their meanings can diverge in another theme.

The conversion also moved 92 fixed/variable appearance declarations and 10 conditional appearance expressions out of React components. State logic remains in the components; 23 new CSS state rules contain the corresponding values. Former inline declarations retain higher normal specificity, while existing important rules continue to take precedence.

The original stylesheets and migration additions are preserved under `docs/theme-archive/`. `docs/theme-extraction.md` records ownership, retired variables, keyframe handling, and per-file sizes. Regeneration scripts are migration tools, not the normal way to edit a theme: regenerating from historical sources would replace current authored outputs, archiving them first. New app features should add their structural rules to the monolith and their initial appearance rules to each shipped complete theme. Do not regenerate over manually edited themes as routine maintenance.

Saved libraries use schema 2. Before conversion or recovery, the app preserves the original payload and earlier recovery snapshots in the local `ui_theme_library_backup` setting. If a backup cannot be stored, previews remain available and saves/deletes pause until the original has been exported and the owner explicitly confirms keeping it. Renderer and Electron share version, fields, limits, and CSS policy through `src/theme/themeContract.json`.

The app logs theme selection, edits, saves, imports/exports, conversion, recovery, and errors. Slider edits are grouped into one readable log entry instead of producing an entry for every intermediate value.

No servers, builds, tests, lint commands, or visual checks were run for this change, as instructed. The implementation has not been verified in the running app.
