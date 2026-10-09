# Interface functionality notes

Implemented September 13, 2026. Restart briizOS to load the updated desktop storage validator. No server, build, test, lint, or live interface check was run, following the project instructions. These are implementation notes and things to try, not a claim that the running app has been verified.

## Briizy

An in-app Briizy rests at the edge, reveals on hover or keyboard focus, and opens a message bubble when clicked. It moves to the left edge when the floating dock occupies the right edge. A breathing motion and greeting motion accompany the existing mood artwork; reduced-motion preferences disable those animations. The existing avatar visibility preference applies to the in-app companion too.

System → briizy has Animated / Still, Tucked at edge / Visible, an inactivity delay, and an editable response-preference field. Its “Where these decisions live” disclosure identifies the relevant source files. The behavior settings for the in-app companion are distinct from the existing desktop pet and screen-memory assistants.

Messages open Chats and use its current model, conversation, streaming response, and tool approvals. The bubble displays the response and points to Chats when approval is needed. It never starts a second assistant runtime. Response preferences are included as user-provided text with a submitted message. They do not grant execution permissions. No AI request was sent while implementing this.

| Decision | Source |
| --- | --- |
| In-app reveal, tuck, idle timer, mood selection | `src/components/briizy/BriizyCompanion.jsx` |
| User-editable behavior controls | `src/components/briizy/BriizyBehaviorSettings.jsx` |
| Default values and saved choices | `src/lib/interfacePreferences.js` |
| Message handoff and response state | `src/lib/briizyConversation.js`, `src/components/InteractionPanel.jsx`, `src/hooks/useChat.js` |
| Motion and dimensions | `src/AppCombined.css`, search for `briizy-companion` |
| Existing desktop pet | `src/briizy/BriizyShell.jsx`, `electron/briizy/shell.js` |
| Screen-memory prompts | Existing assistant controls in `src/components/briizy/CaptureSettingsPanel.jsx` |

The in-app inactivity delay defaults to 10 seconds; the controls offer 3, 5, 10, 20, 30, or 60 seconds. Draft input and an active request keep Briizy available. The breathing cycle is 2.8 seconds in the structural stylesheet.

## Dragging and reopening

Text selection is disabled across the document while a native item drag, custom window drag, or panel resize is active. Embedded browser surfaces stop intercepting the drag. Selection returns on release, cancellation, blur, or cleanup. The shared implementation is `src/lib/dragSelection.js`; Notes, Journals, Media, LiveCanvas, the reusable drag hook, Forest cards, and the floating-window frame use it.

Grid panels record their column identity, neighboring columns, stack position, and width before hiding or closing. Reopening restores that placement, distributing remaining space among other columns. Saved width is a percentage of the available row. Restoration respects a usable range when other panels also occupy the row. This lives in `src/lib/layoutUtils.js` and `src/hooks/useLayout.js`; placement memory is part of the existing workspace database payload.

Floating windows retain their geometry when closed and restore it on reopening. Closed entries are stored but excluded from rendered and minimized windows. The manager is `src/hooks/useFloatWindows.js`, with storage validation in `electron/local-data-service.js`.

Try dragging across editable text, releasing outside a window, and switching apps during a drag. Move a panel into a stack, resize its column, close it, and reopen it. Close and reopen a floating window after moving and resizing it.

## Dock

System → Appearance includes Monochrome / Colored for both docks, Top / Bottom / Left / Right for the floating dock, and Always visible / Auto hide. The hidden dock leaves an edge strip to hover; keyboard focus also reveals it. An open Canvases popover keeps it available. Popovers position according to the selected edge.

The header dock’s glass container now measures its contents instead of using a fixed viewport width. Narrow layouts retain scrolling. Source: `src/components/controlbar/DockAppearanceSettings.jsx`, `src/components/shell/FloatDock.jsx`, `src/components/canvases/CanvasesPopover.jsx`, and the structural stylesheet. Initial appearance rules are included in every shipped complete theme. Previously saved custom theme snapshots remain independent; their appearance may need the new selectors copied in through Theme Studio.

## Forest

Project membership no longer implies FileHawk monitoring. Each file defaults to unwatched unless explicitly designated. Expanded project cards have Files and FileHawk suggestions tabs. The latter provides Unwatched / Watching choices for all attached files. FileHawk lists and scans only designated files; Stop watching retains the project attachment. Existing automatic project membership is not treated as a manual designation.

The floating Forest body has a stable containing block for its overlays. Decorative aurora layers are suppressed in that mode, nested backdrop blur is removed, and project-card movement no longer animates layout coordinates. These changes address plausible stacking and compositing causes found in the source. The reported visual glitch was not reproduced or verified in a running app, so its resolution remains unconfirmed.

Source: `src/components/forest/app.js`, structural rules in `src/AppCombined.css`, and matching appearance rules in every shipped theme. Watch choices survive normalization and save with each project file’s existing database metadata.

**Auto tags (October 2026).** Projects with fewer than 12 tags are topped up to 12 by the Background helpers model. It runs about 4 seconds after Forest opens and again when files are added, but only for projects whose file list changed since the last check. It sends the name, tags, milestones, relevance note and file list. It also reads the opening lines of at most 3 plain-text files: 2 by default, a third only if the first two held fewer than 80 lines. The total stays under 200 non-empty lines. Tags that are deleted or undone are remembered per project and never suggested again. Source: `electron/forest-ai.js` (`runAutoTag`), renderer queue in `src/components/forest/app.js`.

**File Hunter tray.** Triple-click a card's top rail (title area) to toggle the tray; Escape also closes it. Double-click rename now waits 320 ms so a third click can open the tray instead. The tray replaces the old Hunter slideout, which remains only for FileHawk's Relocate. Its controls are:
- **Kinds:** Docs and Code, Image and Video, Emails and Texts (mail files, including ~/Library/Mail), PDF and ebooks, Folders.
- **Date range:** a fixed range picker.
- **Modes:** Single (1 result, description required), Top Hits (about 10, AI-ranked), Exhaustive (every match, capped at 300, no AI ranking).

Each search runs in three steps:
1. The AI turns the description, or the project's context if there is none, into name and content terms, sizes and dates.
2. Spotlight (`mdfind`) searches the default or custom search folders. If Spotlight returns nothing, Forest falls back to the older name-only folder walk.
3. In Single and Top Hits, the AI picks the best matches.

Results never join a project automatically. The tray is warm in dark themes and cool in light themes; `themeRuntime.js` sets `data-theme-mode` on the document root. Source: `electron/forest-ai.js` (`runHunt`).

**Changes.** The top-bar Changes button opens a log of auto-tag runs and File Hunter results, and shows a count of entries not yet seen.
- Files are added to a project only from this view, one at a time or with Add all.
- Each auto-tag run can be undone for its project for 7 days. After that the entry is kept as a record with no actions.
- The history is stored with the board view state (`changes`, max 150 entries) in `electron/local-data-service.js`.

## Journals

Pages and Scroll are always visible, with the selected mode marked. Edit and Select use the same two-choice presentation. Wheel navigation applies to wide spreads as well as narrow and floating journals; continuous-scroll mode keeps ordinary scrolling. Nested scrollable page content can consume scrolling until it reaches its boundary.

Page navigation fades the outgoing contents for 110 milliseconds and reveals the incoming contents over 160 milliseconds. Existing editors are retained where possible. Reduced-motion mode changes pages immediately. Journal shelf and editor SVG icons have been replaced with glyphs from the supplied SF Symbols CSV; dock icon rendering also uses SF glyphs.

Source: `src/components/journals/JournalView.jsx`, `JournalPanel.jsx`, `richtext.jsx`, and `src/components/controlbar/ControlBar.jsx`.

Try Pages / Scroll in both panel and floating editing, then scroll a multi-page journal. Try selecting text and using the formatting toolbar after navigation.

## Notes

The drawer opens at the nearest side of the window, hinges open, and sits above the other app surfaces. After ten seconds without pointer, keyboard, or wheel interaction it closes and flushes a focused text edit. It does not close during an active drag. A floating note leaves a tinted placeholder that can return it to the drawer.

Color controls no longer trigger the floating note’s drag handler. The drawer card expands on hover or focus so its color controls are reachable; selected colors tint the card and retain a visible top accent. The blue option now appears alongside the other five colors.

Source: `src/components/notes/NotesWidget.jsx`, structural rules in `src/AppCombined.css`, and corresponding shipped-theme appearance rules. The drawer inactivity timer is 10,000 milliseconds in `resetDrawerIdle`.

Try changing a floating note’s color, returning it through its placeholder, and leaving the drawer idle after typing. Confirm the text is still present after reopening.

## Future topics retained

Suggestions manager: a central review surface for suggestions from different parts of briizOS, with clear origin and disposition. This remains a planning topic.

Global search: parallel searches across multiple sources, with results surfaced as each source becomes available. Result grouping, source scope, and interaction behavior remain design decisions. This remains a planning topic.
