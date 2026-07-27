# PLAN — Make briizy real

*Written 2026-07-27 from Alex's actual runtime log. This plan supersedes the
"all seven phases are built" product claim in `PLAN-BRIIZY.md`. The code may
contain all seven planned subsystems, but the product has not completed its
first required journey: observe real work → save it → recognize its text →
create a visible, searchable Notefalls entry.*

## Product verdict

briizy is not currently usable. Its visible shell starts, but the supplied
runtime session ended with:

- `captures: 0`
- `kept: 0`
- `ocr: 0`
- assistant `dispatched: 0`
- a two-minute display session containing `frames: 0`

The recovery is complete only when the user can see proof inside briizOS without
reading a terminal.

## Why nothing appeared in Notefalls

### 1. The status indicator reports work that is not happening

`RewindIndexer._refreshState()` maps almost every helper condition other than
`unavailable` or `error` to `capturingWindow` / `capturingDisplay`
(`electron/rewind/indexer.js:213`). A helper whose actual state is `stopped`
therefore produces a "capturing" product state.

This happened at 15:47:44: the runtime logged `Indexer started` with
`helper:"stopped"`, while the interface continued to describe capture as active.
The tick loop then returned every second because it only works when the helper
is `ready` (`electron/rewind/indexer.js:380`).

### 2. Turning capture off permanently disables the helper for that app run

`BriizyHelper.stop()` sets `stopping = true` (`electron/rewind/helper.js:315`).
`BriizyHelper.start()` refuses to start while `stopping` is true
(`electron/rewind/helper.js:62`). Nothing ever resets it.

Consequently, the normal OFF → ON control cannot work until briizOS is fully
restarted. The attached log shows that exact sequence.

### 3. The capture gate only saw briizOS itself

Every metadata poll in the supplied run reported `Electron` /
`com.github.Electron`. The privacy gate correctly rejects that bundle because
development briizOS adds it to its own-app list (`electron/main.js:1027` and
`electron/rewind/privacy.js:128`).

What remains to prove is *why* Electron stayed frontmost:

- It may simply be because the observed session was spent inside briizOS.
- The avatar overlay may also be activating Electron. It is created as both
  `focusable: true` and a macOS `panel` (`electron/briizy/shell.js:88`), while
  macOS logs that the non-activating panel style is unsupported.

The existing test does not answer this. It only checks that the text
`showInactive` exists in the source (`tests/briizy/shell.test.js:98`); it never
observes which application macOS actually considers frontmost.

### 4. Display recording also looked active while recording nothing

Starting a display session creates the session and changes the displayed state
without first proving that the helper is ready
(`electron/rewind/indexer.js:330`). In the supplied run, this created a
two-minute "recording" session while the helper remained stopped.

When it ended, the empty session was deliberately deleted
(`electron/rewind/indexer.js:313`). That is why no empty card appeared in
Notefalls.

### 5. Notefalls is the last step, not a live proof of capture

A card is posted only after a session closes, and only if it lasted at least
one minute and contains at least two frames
(`electron/briizy/index.js:343`). Until then the feed can remain blank even
during a healthy capture session.

That delay is acceptable only if the interface separately shows concrete live
proof: last successful capture time, saved-frame count, recognized-text count,
and the current reason when nothing is being saved.

### 6. The tests certify assembled pieces, not the product journey

- `tests/briizy/runtime.test.js` inserts fabricated frame rows directly into the
  database and calls `_postSessionCard()` directly. It never enables live
  capture.
- `electron/briizy/self-test.js` captures a window by explicit ID, then deletes
  the result. It deliberately bypasses the active-window resolver, privacy
  gate, indexer, database, session close, and Notefalls.
- `tests/briizy/helper.test.js` checks start and stop separately, but never tries
  start → stop → start.
- `tests/briizy/shell.test.js` checks source-code strings instead of real macOS
  focus behavior.

Those tests can remain as component tests, but none may be described as
end-to-end coverage.

---

## Recovery order

## Stage 1 — Make the controls and dashboard honest

1. Split temporary capture suspension from final application shutdown.
   `stop()` used by the ON/OFF switch must be restartable; permanent shutdown
   belongs to a separate final method used only when briizOS quits.
2. Make enablement wait for the helper to reach `ready` or a named failure
   before starting the indexer.
3. Add truthful runtime states:
   - starting
   - waiting because briizOS is frontmost
   - waiting because an excluded app is frontmost
   - capturing active window
   - capturing display
   - permission required
   - worker stopped/error
4. Never show “capturing” unless a frame has succeeded recently. If the last
   success is stale, show why.
5. Put `last successful capture`, `frames saved`, and `text recognized` in the
   Notefalls capture drawer.

**Acceptance:** toggle capture OFF → ON three times without relaunching. Each ON
cycle starts a new helper process, saves frames when an allowed window is
frontmost, and never reports capture while the helper is stopped.

## Stage 2 — Prove and fix active-window behavior with the avatar visible

1. Add a sacrificial, clearly marked test window owned by a separate native
   fixture process.
2. Activate that window while the briizy avatar is visible.
3. Assert that helper metadata changes away from Electron and names the fixture.
4. If it does not, correct the overlay configuration so showing, drifting,
   hovering, and clicking the avatar do not make Electron the frontmost app.
   Remove the unsupported macOS panel configuration rather than suppressing its
   warning.
5. Keep briizOS excluded, but report “waiting while briizOS is frontmost”
   instead of silently counting privacy denials.
6. Run the same proof with the avatar hidden to separate overlay behavior from
   main-window behavior.

**Acceptance:** with the avatar visible, switching among the fixture, Safari,
and briizOS produces the correct frontmost app each time. Allowed apps save
frames; briizOS saves none and says it is intentionally waiting.

## Stage 3 — Replace the theatrical self-test with the real journey

The in-app self-test must use the production path:

1. Start from the same ON control the user presses.
2. Confirm the helper reaches ready.
3. Activate the sacrificial native fixture window.
4. Pass its metadata through the real privacy gate.
5. Capture through the real indexer.
6. Save a real frame row and OCR text.
7. Find the one-time marker through the real screen-history search.
8. Close the session through the real session manager.
9. Create a Notefalls card through the real event path.
10. Open that card and its captured moment in the renderer.
11. Clean up the marked test data after showing the result to the user.

The result screen must name every stage and stop at the first failure. “Capture
works” is prohibited unless all eleven stages pass.

**Acceptance:** one button produces a visible temporary Notefalls card containing
the test marker, opens its screenshot and OCR text, and reports that the marker
was found through search.

## Stage 4 — Lock the real regressions into tests

Add tests for:

1. helper start → stop → start;
2. enabled + stopped helper never maps to a capturing state;
3. display session cannot report recording until the helper is ready;
4. an empty display session clearly reports failure instead of appearing to
   complete normally;
5. allowed metadata reaches `_captureOnce`;
6. a captured fixture frame creates a session through the indexer;
7. session close emits exactly one Notefalls card without calling
   `_postSessionCard()` directly from the test;
8. the card is visible through the same API used by `NotefallsPanel`;
9. the avatar does not change the fixture process's frontmost status on macOS;
10. a sixty-second zero-capture condition becomes a visible product warning.

The existing 360 assertions are component coverage. The new product journey is
the release gate.

## Stage 5 — Prove daily use before restoring “complete” status

Perform one real fifteen-minute use session:

1. Work in at least two allowed apps.
2. Return to briizOS and end the session.
3. Confirm a Notefalls card appears without restarting.
4. Search for a phrase that was visibly present in one captured app.
5. Open the matching moment and confirm the screenshot and recognized text.
6. Pause and resume once, then repeat a shorter session.
7. Quit and relaunch; confirm the earlier card remains searchable.

Keep a short evidence record: timestamps, apps seen, saved frame count, OCR
count, card ID, and searched phrase. No passwords, screen images, or OCR text
need to be committed.

**Definition of done:** Alex can complete the above from the interface, without a
terminal, and the interface never says it is capturing when no frame is being
saved.

---

## Work deliberately postponed

Do not spend recovery time on goals, focus glow, TaskAgent, prompt editing,
compaction tuning, or avatar polish. They cannot provide value until the first
real frame reaches Notefalls. After Stage 5 passes, evaluate each advanced
feature as its own user journey instead of treating the presence of its source
files as completion.
