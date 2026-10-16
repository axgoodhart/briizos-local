# briizOS runtime architecture

Open [briizos-runtime.html](briizos-runtime.html) in a browser. This standalone diagram covers the visible React workspace and Briizy overlay, the main-process agent, renderer tool execution, direct Forest calls, screen-memory assistants, Execubriiz, Codex, persistence, external adapters and cloud command intake.

Use **PATH** to select a guided trace, **LENS** for focused exploration, and each component’s **SRC** badge for the exact source revision. Light/dark controls and the Export menu are built into the viewer. Scroll vertically to follow the full map.

The agent trace follows task creation through approval, renderer dispatch, the authoritative SQLite write, data-change notification, tool-result return and the visible chat response. The direct trace follows Forest file excerpts through createChatModel, provider invocation, tag parsing, visible changes and autosave. The background trace follows capture, OCR, text consent, extraction, proposals, acceptance and optional task execution. Automatic journal work and the Codex child process have separate paths.

Approval limitations appear at their actual seams and in the explanatory cards. The map distinguishes enforced checks, configuration assumptions, missing checks and inferred reach. Regions denote ownership/process slices. Repeated factory, database and provider boxes represent shared roles at different call sites.

## Source evidence

- [Source notes and authorization references](source-notes.md)
- [Authoring model](candidate.json)
- [Source snapshot and starting pending changes](source-snapshot.json)

Runtime evidence comes from electron/ and src/ at the revision recorded in the snapshot. Component links pin that revision. Application findings are static source analysis.

## Artifact verification

- [Final delivery receipt](review-3/briizos-runtime.finalize.json): source validation, generation, strict provenance and automated browser gates passed.
- [Browser receipt](review-3/briizos-runtime.browser-check.json): artifact-bound containment, readability, viewer and theme checks passed.
- [Capture receipt](visual-check/briizos-runtime.visual-check.json) and [contact sheet](visual-check/briizos-runtime.visual-check.html): light/dark captures passed. The light desktop and large dark captures were visually inspected for node fit, text, theme contrast and overall containment. This limited review is separate from automated browser evidence.

The graph has bridge-marked crossings among its own output/read/hook branches. The required placement-only alternative introduced invalid geometry, so the final artifact retains the passing layout. Its earlier attempt and receipts remain beside the final evidence. Only one placement-review round was performed.

The in-app browser blocks local file URLs; the HTML remains ready to open as a local standalone file.
