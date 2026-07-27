# briizy — work memory and background intelligence

Implementation of `PLAN-BRIIZY.md`. This file is the operational note the plan
asks for in §7: how to build the helper, how permissions behave in development,
and where each piece lives.

## Getting it running

```bash
npm install          # postinstall builds the helper
npm run helper:build # or build it on its own
npm run dev          # or dev:debug for per-frame logging
```

Then open Notefalls and click **auto capture is OFF**. Nothing captures until you
complete the onboarding sheet — that is I10, not a formality.

## Screen Recording permission in development

macOS grants Screen Recording to the *responsible process*, not to the helper.
The helper is a plain child process with no bundle of its own, so the grant
attaches to whatever launched it:

- `npm run dev` → the grant belongs to **Electron**. macOS will prompt on the
  first capture attempt. After granting, **quit and relaunch** — TCC does not
  apply to an already-running process.
- A packaged build → the grant belongs to **briizOS.app**.
- Running the helper straight from a terminal (`./electron/bin/briizy-helper`) →
  the grant belongs to **Terminal**, which is usually not granted. `meta` and
  `ping` still work; `capture` returns `PERMISSION_REQUIRED`. That is expected
  and is why the test suite treats it as a pass.

Accessibility permission is optional. It only improves window titles; without it
the helper falls back to the frontmost-largest-window heuristic.

## Layout

| Path | What it is |
|---|---|
| `electron/briizy-helper/BriizyHelper.swift` | the native helper: `meta`, `capture`, `ocr`, `encode`, `extract` over NDJSON on stdio |
| `electron/rewind/helper.js` | supervisor — spawn, correlate, restart, kill |
| `electron/rewind/privacy.js` | the one exclusion gate (I3) and the egress guard (I2) |
| `electron/rewind/indexer.js` | the capture loop, sessions, retention |
| `electron/rewind/storage.js` | frame paths, deletion, reconciliation |
| `electron/rewind/compactor.js` | JPEG runs → H.265 chunks (§13) |
| `electron/briizy/index.js` | the runtime everything hangs off |
| `electron/briizy/coordinator.js` | segment batching, throttling, backpressure |
| `electron/briizy/assistants/*` | the six assistants; `base.js` is the only path to a model |
| `electron/briizy/shell.js` | the overlay window and menu-bar item |
| `src/briizy/*` | the overlay renderer (separate Vite entry, `briizy.html`) |
| `src/components/notefalls/*` | capture UI, search, session cards, settings |
| `electron/local-data/schema/009_rewind.sql`, `010_briizy.sql` | the schema |

## Tests

```bash
npm run test:briizy            # all of it
npm run test:briizy -- privacy # one file
```

It runs under Electron rather than vitest because every assertion touches
`better-sqlite3` (built against Electron's ABI) or `nativeImage`.

## The invariants, and where each one is actually enforced

| | Enforced in |
|---|---|
| **I1** one briizy | facts go to `memory_facts`, "About me" is a `memory_sections` row; no briizy-side profile exists |
| **I2** pixels never leave | `assistants/base.js` aborts the request; `privacy.assertNoPixelEgress` is the check |
| **I3** one gate, first | `indexer._tickBody` calls `privacy.evaluate` before `helper.capture` |
| **I4** Electron owns metadata | the helper only writes media files; every row goes through `LocalDataService` |
| **I5** supervised helper | stdin EOF + parent-pid watchdog in the Swift; `helper.stop()` in `before-quit` |
| **I6** accept ≠ act | `decideBriizyProposal` writes a task with `status: pending, automated: 0` and no run |
| **I7** reversible + evidenced | provenance columns, `briizy_proposal_events`, `getBriizyLearningLog`, `forgetFact` |
| **I8** byte cap from day one | `pruneRewindFrames` honours both caps every 5 minutes |
| **I9** nothing to Firestore | the `rewind` and `briizy` domains are absent from `CONTINUITY_DOMAINS` |
| **I10** nothing silent | `enabled: false` by default; the helper is not even spawned until onboarding |

## Known limits

- macOS 14+, and the helper is built for the host architecture only.
- FTS5 keyword search, not semantic search. That is the plan's one deliberate
  deferral (§13); the archive and Notefalls contracts are shaped so embeddings can
  be added without changing either.
- Goals and focus need at least one goal set before they do anything.
- The overlay covers the primary display only.
