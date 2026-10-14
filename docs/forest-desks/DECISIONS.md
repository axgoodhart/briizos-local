# Islands (formerly Forest): desks, islands, cards — decisions

Decided by Alex in conversation on 2026-10-13. Quotes are Alex's words. Mockups are in `mockups/` and are the spec where they exist.

## Words

- **Desk > Island > Card.** Don't use "floor" or "ground". Both meant desk.
- No metaphors or made-up names for things. Describe them literally.
- The app is called **Islands** (Alex, 2026-10-13: "Forests (which needs to be renamed Islands, obviously)"). Everything a person or the AI reads says Islands. Internal names (code folder, database tables, `window.api.forest*`, theme keys) still say forest so saved data and saved themes keep working.

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
- Opened from an island in Forest, it shows only that island. Its calendar is the exception: it also shows the other islands' items, faded.
- Opened in the Journals app, it shows every project: a shared calendar, a separate chapter ("bible") for each project, and timelines and logs of ongoing work.

## Files

- Forest never owns or moves files you bring in. Islands point to files where they already are. No symlinks.
- Consolidating only makes a dated archive. Each copied file, or the zip, is dated so it can never be mistaken for the original. (The old Consolidate made undated copies in ~/Documents/briizos/forest-projects/<name>; it is replaced by the dated archive.)
- "If it's created in the app it is briiz." Files made inside briizOS belong to briizOS and are stored there.

## Agents

- When a desk is set not to show agent activity, agents already working on its islands keep running. That desk just doesn't show them.
- This is the intention, not a promise, until briizOS can actually keep working with its window hidden or closed. See "Background agents" below.

## Look and feel

- Islands carries the original Forest styling, brought back on purpose (Alex: "bringing back the styling in an intelligent way"): teal stage with soft glows and a grid that pans and zooms with you, the drifting aurora, the floating green-glass top bar with the ZnikomitNo24 wordmark, asymmetric neon-edged glass islands (`--ui-forest-card-radius`, `--ui-corner-shape`, so themes still shape them), glassy file rows and badges, the hot-pink File Hunter, and dim mode. Structure (tab, node rail, settings layout, loud Assign agent, stacked view) follows the mockups.
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

### Where each old Forest feature went

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
| Dim toggle (dims Forest only) | Becomes a desk setting, since desks decide how islands appear |

## Built (2026-10-13)

What exists now, and where:

| Piece | Where |
|---|---|
| Data, saving, migration of old projects, desks, templates, agents, auto-tags, File Hunter | `src/components/forest/store.js` |
| Card types, glyphs, built-in island and card templates | `src/components/forest/catalog.js` |
| Desk canvas (pan, zoom, drawing new islands, dropping files) | `DeskView.jsx`, `camera.js`, `gestures.js`, `Minimap.jsx` |
| Island (tab, name, cards, node rail, zoomed-out summary) | `Island.jsx`, `CardFrame.jsx` |
| The ten card types | `src/components/forest/cards/` |
| Top bar, tool palette, desk controls, popovers | `Chrome.jsx`, `Overlays.jsx` |
| Island settings, desks panel, File Hunter, stacked view | `IslandSettings.jsx`, `DeskPanel.jsx`, `HuntPanel.jsx`, `StackView.jsx` |
| Islands journal (in Forest and in the Journals app) | `IslandsJournal.jsx`; shelf card in `src/components/journals/JournalPanel.jsx` |
| Files made in briizOS, file previews, dated archives, terminal sessions | `electron/forest-workspace.js` |
| Saving desks and templates | `electron/local-data-service.js` (`saveForestState`, `getForestState`) |
| Styles | `src/AppCombined.css`, section "Forest: desks, islands, cards" |

Old projects are converted the first time Forest opens: each becomes an island, its files go into a Docs/Code card and a Media card, and a journal entry records it. Nothing on disk moves. The old Forest code (`app.js`, `canvas-markup.html`, `styles.css`) were removed. Its 2,800 lines of styles were removed too, then restored into the Islands styles at Alex's request (the look, not the old selectors).

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
