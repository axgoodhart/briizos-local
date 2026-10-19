# Islands: desks, islands, cards — decisions

Decided by Alex in conversation on 2026-10-13. Quotes are Alex's words. Mockups are in `mockups/` and are the spec where they exist.

## Words

- **Desk > Island > Card.** Don't use "floor" or "ground". Both meant desk.
- No metaphors or made-up names for things. Describe them literally.
- The app is called **Islands**. Everything a person or the AI reads says Islands. The code, IPC, database tables, and theme selectors now use Islands names; migration 017 carries existing project data and saved themes forward.

## Desk

- A view. It holds islands and works as a navigation boundary. "It doesn't do anything except hold interface."
- It can be made by hand or generated automatically: "the last month desk, the music desk, the desk for things that start with the letter Q".
- The same island can be on several desks. Only one desk is ever visible at a time.
- A desk sets how its islands appear and what they're doing, e.g. a desk that shows no agent activity, or a desk only for triaging progress. Which cards an island shows can differ from desk to desk.
- A desk has no end along its length, so it needs a minimap.
- A toggle shows all of the desk's islands as a stack you flip through. Picking one puts them all back in their places on the desk. Mockup: `stacked-view.webp`. Assumed, not yet confirmed: it also takes you to the island you picked.

## Island

- One project. "A folder for a project rendered visually, the way a real folder can be open and you can have different things in front of you at the same time."
- In `island-full-view.webp`, the magenta frame is the island.
- Highlighting empty space inside an island opens "new" and the card types.
- Zoomed out, an island keeps its identity: the name sits inside and wraps, there are count chips with icons, and the project's color runs through the border and the chips. Mockup: `island-zoomed-out.webp` (bottom half).
- Settings panel: `island-settings-panel.webp` (right half is Alex's version).

## Card

- Anything inside the island: resource files, website inspo, notes, diagrams, outlines, schedules, code, video, contacts, airline tickets.
- Some cards are working parts (the running app, a terminal). Some are just files (a Q&A doc). "Not complex to a human."
- One card is the island's main view (for BuilderBrock, the running app).
- Card types (`new-card-types.webp`): Monetize, Terminal, Webview, Thoughts/Discussions, Media, Agent, Docs/Code, Goals/Todo, Visual Planning, Ship/Finish.
- Chat icon: for now, pressing it anywhere brings up the same project questions (What is it? / What makes it unique? / 3 Best Features).

## Templates

- Templates exist at both levels.
  - Island template, e.g. "fiction book": an island that starts with character notes, a plot diagram, a mood board.
  - Card template, e.g. "explain this to my mom": a ready-made Thoughts/Discussions card.
- Anything you make can be kept as a template for future projects.

## Journal

- One journal for all islands.
- Opened from an island in the Islands workspace, it shows only that island. Its calendar is the exception: it also shows the other islands' items, faded.
- Opened in the Journals app, it shows every project: a shared calendar, a separate chapter ("bible") for each project, and timelines and logs of ongoing work.

## Files

- Islands never owns or moves files you bring in. Islands point to files where they already are. No symlinks.
- Consolidating only makes a dated archive. Each copied file, or the zip, is dated so it can never be mistaken for the original. (The old Consolidate made undated copies in the previous project folder; it is replaced by the dated archive.)
- "If it's created in the app it is briiz." Files made inside briizOS belong to briizOS and are stored there.

## Agents

- When a desk is set not to show agent activity, agents already working on its islands keep running. That desk just doesn't show them.
- This is the intention, not a promise, until briizOS can actually keep working with its window hidden or closed. See "Background agents" below.

## Look and feel

- Islands carries forward the established styling: teal stage with soft glows and a grid that pans and zooms with you, the drifting aurora, the floating green-glass top bar with the ZnikomitNo24 wordmark, asymmetric neon-edged glass islands (`--ui-island-card-radius`, `--ui-corner-shape`, so themes still shape them), glassy file rows and badges, the hot-pink File Hunter, and dim mode. Structure (tab, node rail, settings layout, loud Assign agent, stacked view) follows the mockups.
- Never delete existing styling as unused when replacing a feature; carry it forward.

From Alex's critique of the Astra mock:

- Functional metaphor only: no seas, shorelines, "claim land".
- Density sits between cockpit density and huge modern padding. Hierarchy does the work.
- Not fixed, not unorganized.
- No small labels above content announcing it. Fine: a quiet word after the content, or an ordinary row name beside a control.
- Each fact shows once. One loud action per panel. Danger is tinted, not shouting.
- No faint, tiny, translucent text as the default way to make something secondary.
- Cards live inside their island.

## Background agents — what briizOS does today (checked 2026-10-13)

- Automated tasks are run step by step from inside the main window. If the window is closed, they stop advancing.
- Most agent tools run through the main window: files, terminal, notes, calendar, completing tasks. With the window closed they fail immediately (`electron/agent/bridge.js`).
- When an automated task needs a permission it can't get, it pauses as "waiting". It does not act without permission.
- With the window open but hidden, these should keep working. Not confirmed: whether macOS slowing down hidden windows affects them.
- To keep the promise above, the step-by-step loop and those tools need to move into the part of the app that stays running with no window. The Agent card needs this either way.

## Feature placement

Alex said "time to just dive in" (2026-10-13), so the recommendations below were built as written. Rough option sketches were skipped at Alex's request: feedback comes from using the result.

### Where each earlier project-board feature went

| Today | Recommendation |
|---|---|
| Project Viewer (full-screen project) | Becomes the island's full view (`island-full-view.webp`) |
| Priority signals (deadline, importance, size, relevance) | Island settings. They keep feeding the day planner and can generate desks ("due this month") |
| Milestones and their timeline | Move into the journal: dates on its calendar, progress on its timeline. Their subtasks become a Goals/Todo card |
| Tags and auto-tags | Kept as data for search and auto-generated desks. Not shown on the island's face |
| Tag strip and search filter | Become how you make a desk from a rule |
| Sort by activity | Becomes an auto-generated desk ("last month") |
| Collapse-all | Replaced by the zoomed-out island |
| Cover image | Replaced by the main view card, which can be an image |
| File Hunter | Stays. It's how you find existing files to bring into an island. Results never join on their own |
| FileHawk | Stays, and matters more now that files stay in place. A moved or missing file shows on its own card instead of in a separate panel |
| Changes log (auto-tags, File Hunter results) | Merges into the journal's log, with undo kept |
| Consolidate | Becomes the dated archive |
| Dim toggle (dims Islands only) | Becomes a desk setting, since desks decide how islands appear |

## Built (2026-10-13)

What exists now, and where:

| Piece | Where |
|---|---|
| Data, saving, migration of old projects, desks, templates, agents, auto-tags, File Hunter | `src/components/islands/store.js` |
| Card types, glyphs, built-in island and card templates | `src/components/islands/catalog.js` |
| Desk canvas (pan, zoom, drawing new islands, dropping files) | `DeskView.jsx`, `camera.js`, `gestures.js`, `Minimap.jsx` |
| Island (tab, name, cards, node rail, zoomed-out summary) | `Island.jsx`, `CardFrame.jsx` |
| The ten card types | `src/components/islands/cards/` |
| Top bar, tool palette, desk controls, popovers | `Chrome.jsx`, `Overlays.jsx` |
| Island settings, desks panel, File Hunter, stacked view | `IslandSettings.jsx`, `DeskPanel.jsx`, `HuntPanel.jsx`, `StackView.jsx` |
| Islands journal (in the workspace and the Journals app) | `IslandsJournal.jsx`; shelf card in `src/components/journals/JournalPanel.jsx` |
| Full view of one island (the + button) | `FullView.jsx`; opened and closed from `store.js` (`openFullView`, `closeFullView`) |
| Tag strip, arrange by tag | `Chrome.jsx` (`TagStrip`, desk controls); `store.js` (`tagVocabulary`, `unifyTags`, `arrangeByTags`, tag filter) |
| Fog, covers | `Island.jsx`, `IslandSettings.jsx`, `cards/MediaCard.jsx`; `store.js` (`setFog`, `setCover`) |
| Tag stemming | `util.js` (`tagStem`, `canonicalTag`); AI prompt in `electron/island-ai.js` |
| Files made in briizOS, file previews, dated archives, terminal sessions | `electron/island-workspace.js` |
| Saving desks and templates | `electron/local-data-service.js` (`saveIslandState`, `getIslandState`) |
| Styles | `src/AppCombined.css`, Islands section |

Older projects are converted the first time Islands opens: each becomes an island, its files go into a Docs/Code card and a Media card, and a journal entry records it. Nothing on disk moves. The earlier project-board implementation (`app.js`, `canvas-markup.html`, `styles.css`) was removed; its visual language was carried into the Islands styles.

## Not built yet, and known limits

- **Background agents.** Agents still only advance while the briizOS window is open (see "Background agents" above). Moving the step-by-step loop and the window-side tools into the always-running part of the app is the next engineering job.
- **Terminal card.** Runs real commands with colors, live output, stop and restart. Full-screen terminal programs (anything that redraws the whole screen, like Claude Code's own interface or `top`) do not draw correctly; that needs a terminal emulator library.
- **Mockup details whose meaning is unknown:** the `{}` and `</>` buttons in the top bar, and the middle of the breadcrumb ("PRODXN > REVIE…"). The breadcrumb shows desk › island.
- **Islands and folders.** An island is not a real folder on disk; it points to files where they are, and its own documents live in briizOS's storage (`~/Library/Application Support/briizos/Islands/`). Dated archives go to `Documents/briizOS Island Archives/`.

## Performance (2026-10-13, after flickering and "tile memory limits exceeded")

Cause: every island and card was drawn whether on screen or not, inside one moving layer that also carried per-element filters, large blurred shadows, a blend mode on the aurora and blurred panels over it; and each pan frame restyled every island because the grid's position was set on the whole canvas.

Rules for the canvas (`.fo-world`):
- Only islands within half a screen of the view are in the page (`DeskView.jsx`, culling). Webview cards also unload when off screen.
- The canvas layer is held at one resolution while moving and redrawn sharp 0.18 s after it stops (`camera.js`).
- Grid position and zoom variables are set on the grid element only.
- No `filter`, `backdrop-filter` or `mix-blend-mode` on elements inside the canvas; keep blurred shadows small. Dim mode applies its one color shift to the whole canvas layer.
- The aurora sits outside the canvas and animates on the GPU; the top bar is the one place with background blur.

Gemini suggested dropping the moving layer and positioning every card in screen pixels. Not done: cards would have to recompute every size and font at each zoom, and established canvas tools (React Flow, tldraw) use one moving layer plus culling, which is what this now does.

## Alex's feedback, 2026-10-18 — open items

Not built yet unless a row says otherwise. Where this reverses a row in "Where each earlier project-board feature went", that row is now wrong and this section wins.

| Item | What Alex wants | What the code does today |
|---|---|---|
| Journal page dates | Hovering or clicking the page-type word in the top right of a folio shows when the page was made and when it was last edited | **Built 2026-10-18.** Hover the page-type word for made and edited dates; click pins them open (`JournalView.jsx`, `FolioStamp`) |
| Auto tagging | Bring it back. The old version was wasteful: it produced "color", "colors", "colorful" across projects, which defeats tagging. Tags must be shared across islands and reduced to one form | **Reworked 2026-10-18.** One shared vocabulary: the AI gets every tag in use across islands and must reuse them, singular nouns only; results are folded onto existing tags by stem (color/colors/colorful → color) before they land; existing tags were merged the same way on first open. Target is 8 tags per island, down from 12 |
| Tag filter strip with flowers | Bring it back | **Built 2026-10-18.** Grass along the bottom of the desk with the desk's tags; a picked tag blooms on a stem; islands without every picked tag dim (`Chrome.jsx`, `TagStrip`) |
| Fog | A per-island toggle. The island frame and title stay visible; nothing inside is, at any zoom | **Built 2026-10-18.** Eye button at the top right of an open island, or the Fog row in settings. Frame, name and cover stay; cards, rail and count chips go, at any zoom. The full view still opens the island |
| Resize at any zoom | An island can always be resized | **Built 2026-10-18** for the zoomed-out island: a large corner handle. Main-view and Progress islands still size to their cards |
| Arrange by tags | Islands can lay themselves out on the desk by their tags | **Built 2026-10-18.** Tag button in the bottom-left desk controls: one row per leading tag, biggest group first, untagged last; the desk then frames the result. Positions are saved like a drag |
| Island full view (the + button) | The top-right + on an island opens that island full screen. It should grow from the old fully-expanded card / Project Viewer: scroll-and-pinch timeline, file browsing, and the island's cards auto-arranged in a masonry grid. Alex: a major missing feature | **Built 2026-10-18**, see "Full view" below. Before this, the + in the zoomed-out summary only zoomed the camera to the island |
| Covers | Optional cover image on an island, as the old cards had | **Built 2026-10-18.** Cover row in island settings, or the picture button on a Media card tile. Shows faded behind the island, stronger when zoomed out or fogged, and as the full view's hero. The image stays where it lives on disk |

## Full view (built 2026-10-18)

The + button on an island, both the big one when zoomed out and the small one at the top right of an open island, opens that island full screen. The desk unmounts underneath it (same as the stacked view), so each card runs in one place at a time. Esc or the × goes back to the desk, which then frames that island.

What is in it, top to bottom:

- A faded strip of the island's images and videos behind the title (the old viewer's hero), the island's name, and facts as pills: stage, file count, when it was made, last session, milestone progress, deadline.
- Its tags as toggles. Turning tags on filters the file list and the files on the timeline.
- **Cards**: every card, live, laid out in columns like a masonry wall. Column count follows the window width; a card much wider than a column (a webview) takes two. Cards keep their own proportions within limits. They cannot be dragged here; the layout is automatic. Clicking a card selects it as on the desk.
- **Timeline**: one track with years / months / days / hours tiers that fade in as you zoom. Pinch (or ⌘ + scroll) zooms around the pointer; sideways scroll or drag pans; Fit and Today buttons; − and + zoom. It shows when the island was made, milestones (click to mark done or not), the deadline, ship dates from Ship cards, journal entries (click opens the journal), and files at their modified time (click opens the file). Crowded nodes drop to dots and show their label on hover. Double-click an empty spot to place a milestone on that day.
- **Files**: every file on the island grouped by kind, with a search box, size, age, which cards hold it, and its tags. Click opens the file in its app; the folder button shows it in the Finder; a missing file gets a Find button (FileHawk). Add files picks files into the island.
- A node rail along the bottom, one node per card as in the mockup; click to scroll to that card. Live terminals and agents glow the same way as on the desk.

Logged to the Log Panel under `island.fullview`, `island.timeline` and `island.files`: opening and closing, milestones added or toggled, files opened or shown from here.

Not in it yet: card covers (its own open item), and editing priority signals here (they stay in island settings).

## Tags (reworked 2026-10-18)

- One idea, one tag, across every island. `tagStem` reduces a tag to its idea (plural, -ful, -ing, -ed and similar endings drop); `canonicalTag` picks the form already in use for that idea, preferring the most-used spelling.
- Auto tagging sends the AI the shared vocabulary with counts and tells it to reuse those and to use singular nouns. Anything it returns is still folded onto existing tags by stem, and a tag whose idea the island already carries is dropped.
- Adding a tag by hand goes through the same fold.
- On first open after this change, `unifyTags` merges existing spellings and logs each merge under `island.tags`.
- The tag strip shows the active desk's tags (up to 18, most used first). Picking tags narrows: islands missing any picked tag dim. The flower on a picked tag is the old Forest bloom, carried over.
- Arrange by tag groups islands by their leading tag, the one they share with the most islands on that desk.
