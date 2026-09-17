# Conversation history browser — design & contract

Canonical spec for the conversation browser built into the interaction panel's
toolbar section, the auto-tagging schema behind it, and the quick tag editor.

The two supplied mockups are the design specification:

- **Mockup A** — the *current* model selection dropdown (Mode / Provider / Models).
- **Mockup B** — the *desired* alternate mode of the same section (facets /
  conversation list / preview).

Both occupy the identical three-column grid inside `.chat-input-toolbar`. Nothing
about the panel's footprint, density, or row anatomy changes; only the contents
of the three columns and the header row swap.

---

## 1. The toolbar section is a two-mode surface

`.chat-input-toolbar` is an absolutely positioned overlay pinned to the top of
`.chat-container`. It has two rows:

```
row 1  (--interaction-bar-height: 28px)   the mode switch — always visible
row 2  (0fr → 1fr when expanded)          the body — three columns
```

### Header row = a segmented switch

The header row carries two segments:

| Segment | Grid | Label | Behaviour |
|---|---|---|---|
| Conversations | `1 / 3` (columns 1–2) | `Conversations` + `􀆊` | Active → bright; inactive → quiet |
| Model | `3` (column 3) | model display name + caret | Active → bright; inactive → quiet |

- Clicking the **inactive** segment switches mode and keeps the panel open.
- Clicking the **active** segment collapses the panel.
- Collapsed, both segments still render (quiet), so either mode is one click away.
- The caret on the model segment is `▴` when the model side is the open mode and
  `▾` otherwise — the existing `.model-picker-trigger-arrow` rotation.

> **Spec call.** Mockup A predates this feature, so it shows the model trigger
> spanning the full row with no Conversations segment. The switch is the new
> shared header for *both* modes. Everything else in Mockup A is preserved
> exactly.

### Body, model mode (Mockup A) — unchanged

```
col 1: MODE 5          col 2: PROVIDER 4       col 3: OPENAI / 13 MODELS
       Day                    Codex        1          GPT-4.1        VISION
     • Chat                   Anthropic    5          …
       Research             • OpenAI      13        • GPT-5.6 Luna   VISION
       Code                   Google      10          …
       Report
```

### Body, conversations mode (Mockup B)

```
col 1: (empty title cell)   col 2: [ search anything ]   col 3: PREVIEW
     • All            13            Confederacy Analogues        <transcript>
       Tags            5          • Baltimore Ravens
       Date                         Friendly Greeting
                                    Looping agents
                                    …
```

- Column 1's section-title cell is intentionally empty and shares the search
  row's background, so the search band reads as continuous from the left edge
  while its text aligns to column 2. This is what Mockup B shows.
- Facet rows, conversation rows, and tag rows reuse the exact anatomy of
  `.model-picker-provider`: `min-height: max(48px, 2.8em)`, `padding: 0 20px 0 36px`,
  count right-aligned, a 5×5 active dot at `left: 17px`.
- **Column ratios change with the mode.** Model mode keeps the live
  25% / 23% / 52%. Conversations mode is 15.5% / 32.5% / 52%, measured off
  Mockup B: facets need less room than Mode, conversation titles need more than
  provider names, and the preview column lands on the model list's 52%. The
  toolbar re-grids itself on `:has(.conversation-browser)`.

### A conversation's date is its last message

Every date the browser shows, sorts by, or buckets on is the time of the
conversation's **last message**, never its row's `updated_at`. Editing a tag is
a write, so `updated_at` moves — ordering or bucketing on it would yank a
year-old conversation to the top of the list and into Today the moment someone
tagged it. `THREAD_ACTIVITY_AT` in `electron/local-data-service.js` and
`activityAtOf` in `ConversationBrowser.jsx` are the two halves of this rule, and
they must agree: the bucket a row is counted in has to be the bucket it lists
in. A conversation with no messages yet falls back to `created_at`.

---

## 2. Class contract (structural CSS lives in `src/AppCombined.css`)

All new selectors are scoped `.interaction-panel …` alongside the model picker
block, and every shipped theme in `src/themes/` gets matching appearance rules.

```
.interaction-toolbar-switch              header row wrapper (display: contents)
.interaction-toolbar-switch-segment      a segment button
  .conversations                         grid-column 1 / 3
  .models                                grid-column 3
  .active                                the open mode

.conversation-browser                    display: contents (mirrors .model-picker)
.conversation-search-cell                col 1 header cell (empty, background only)
.conversation-search                     col 2 header cell wrapper
.conversation-search-input               the text input
.conversation-search-clear               􀆄 clear button
.conversation-new                        􀅼 new-conversation button in the search row

.conversation-facets                     col 1 body (scrolling column)
.conversation-facet                       a facet row (All / Tags / Date)
.conversation-facet-count                 right-aligned count
.conversation-facet-group                 expanded tag / date sub-list
.conversation-facet-child                 a tag or date-bucket row
.conversation-facet-child-count
.conversation-facet-clear                 "Clear filters" row

.conversation-list                       col 2 body (scrolling column)
.conversation-group-title                sticky date-bucket subheader
.conversation-row                        one conversation
  .active                                the conversation currently open in chat
  .selected                              the conversation being previewed
.conversation-row-title
.conversation-row-tag-btn                􀋡 hover affordance → focuses the tag strip
.conversation-empty                      empty-state copy

.conversation-preview                    col 3 body
.conversation-preview-scroll             the transcript scroller
.conversation-preview-message            one message
  .user / .assistant
.conversation-preview-avatar             assistant glyph + name stack
.conversation-preview-avatar-glyph
.conversation-preview-avatar-name
.conversation-preview-bubble
.conversation-preview-empty

.conversation-tagbar                     pinned tag strip at the bottom of col 3
.conversation-tagbar-label               􀋡 caption
.conversation-tag                        a tag chip
  .auto                                  applied by the model (carries 􀆿)
.conversation-tag-auto-mark              􀆿 sparkles marker
.conversation-tag-remove                 􀆄 on the chip
.conversation-tag-add                    􀅼 chip that opens the combobox
.conversation-tag-input                  inline combobox input
.conversation-tag-suggestions            autocomplete list
.conversation-tag-suggestion             one suggestion row
.conversation-tag-suggestion-count
```

Icons are SF Symbols glyphs, never SVG:
`􀊫` search · `􀋡` tag · `􀅼` add · `􀆄` remove/clear · `􀆊` chevron ·
`􀆿` model-applied marker · `􀐫` date · `􀋲` all · `􀌲` conversation.

---

## 3. Storage

### Migration `electron/local-data/schema/015_thread_tags.sql`

```sql
ALTER TABLE threads ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'
  CHECK (json_valid(tags_json) AND json_type(tags_json) = 'array');
ALTER TABLE threads ADD COLUMN tag_state_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(tag_state_json));
CREATE INDEX IF NOT EXISTS idx_threads_kind_updated
  ON threads(kind, deleted_at, updated_at DESC);
```

`tags_json` — the visible, ordered, deduped tag list. Same convention already
used by `journals`, `notefall_posts`, and `organizer_items`.

`tag_state_json` — bookkeeping that keeps auto-tagging honest:

```jsonc
{
  "auto": ["baltimore-ravens", "nfl history"],  // which visible tags the model added
  "dismissed": ["sports"],                       // user removed these → never re-propose
  "lastEvaluatedExchanges": 4,                   // completed user↔assistant pairs at last run
  "evaluations": 2,                              // how many times the model has been asked
  "lastEvaluatedAt": 1757960000000
}
```

### Service methods (`electron/local-data-service.js`)

```js
listThreads({ id, kind, query, tags, tagMatch, since, until, includeDeleted, limit })
// tags: string[]   tagMatch: 'any' (default) | 'all'
// since/until: epoch ms against updated_at
// Each row gains: tags (parsed array), tagState (parsed object),
//                 messageCount, lastMessageAt.

listThreadTags({ kind })
// → [{ tag, count }] over non-deleted threads, ordered count desc, then tag asc.

setThreadTags(threadId, tags, { source = 'user' })
// Replaces the visible list. Validates via v.stringArray (maxItems 12, maxLength 48).
// source 'user': any auto tag the user drops is appended to tagState.dismissed
//                and removed from tagState.auto.
// Returns { row } with tags/tagState parsed.

appendThreadAutoTags(threadId, tags, { evaluations, exchanges })
// Append-only. Drops anything already present, anything in dismissed, and
// anything beyond MAX_TAGS_PER_THREAD. Records the evaluation bookkeeping even
// when zero tags are added, so the checkpoint gate advances.
// Returns { row, added: [...], skipped: [...] }.

getThreadTagState(threadId)   // → parsed tagState, for the agent-side gate
```

`updateThread` also accepts `tags` in its patch for convenience.

### IPC + preload

| Channel | Preload |
|---|---|
| `local-data:threads:tags:list` | `window.api.localData.threads.tags.list(filters)` |
| `local-data:threads:tags:set` | `window.api.localData.threads.tags.set(threadId, tags)` |

---

## 4. Auto-tagging — `electron/agent/tags.js`

A post-model hook registered in `lead-agent.js` right after the title hook,
mirroring `createTitlePostModelHook`'s shape. It returns `{ tags }` into
`ThreadState`; `mapEvent` turns that into a `thread_tags` stream event; the
renderer persists it. One write path, one log site.

### Why gates exist

> "Hello" should not generate a tag, and tags shouldn't be endlessly curated.

Five gates run **before** any model call, so a greeting costs nothing:

**G1 — turn shape.** Last message is an AI message with no tool calls, and
`configurable.disable_tag_generation` is not set. (Subagent runs set it, exactly
as they already do for titles.)

**G2 — cap.** `tags.length >= MAX_TAGS_PER_THREAD (5)` → stop permanently. A
conversation reaches a stable set and then is left alone. This is the single
most important guard against endless curation.

**G3 — checkpoint.** Evaluate only when the completed exchange count crosses one
of `[2, 4, 8, 16, 32]` and is greater than `tagState.lastEvaluatedExchanges`.
A 40-turn conversation is evaluated at most 5 times, not 40.

**G4 — substance.** On the conversation text with upload blocks stripped:
- at least 2 completed user↔assistant exchanges, **and**
- at least `MIN_USER_CHARS (120)` of user text, **and**
- at least `MIN_CONTENT_WORDS (12)` distinct words after removing stopwords, **and**
- not matched by `SMALLTALK_RE` (greetings, thanks, tests, one-word pings).

"Hello" fails G3 (1 exchange) and G4 (every clause). No model call.

**G5 — vocabulary.** The existing workspace vocabulary (top 40 tags with counts)
is passed to the model with an explicit instruction to prefer an existing tag
over minting a new one. This is what stops the tag list from growing without
bound across conversations.

### The prompt

```
You label conversations for a personal workspace's conversation browser.
Tags are for finding this conversation again months from now.

Existing tags in this workspace (prefer these — reuse beats inventing):
{vocabulary}

Tags already on this conversation (do not repeat, do not rephrase):
{current_tags}

Conversation:
{conversation}

Rules:
- Return tags ONLY for durable, specific subject matter: a named entity, a
  project, a domain of work, a recurring topic.
- Return an EMPTY array when the conversation is greetings, small talk, a
  one-off lookup, a test, or has no subject that would still be meaningful
  later. An empty array is the correct and common answer.
- Never tag the medium or the act: no "chat", "conversation", "question",
  "help", "assistant", "ai", "general", "discussion", "misc", "info".
- Prefer an existing tag whenever it genuinely fits. Only mint a new tag when
  nothing in the list covers the subject.
- 1 to 2 words each, lowercase, no punctuation beyond internal hyphens.
- Return at most {max_new} tags.

Return ONLY a JSON array of strings. Example: ["baltimore ravens", "nfl history"]
Example when nothing is specific enough: []
```

### Post-processing

Applied to whatever the model returns, so a misbehaving model cannot pollute the
vocabulary:

1. lowercase, trim, collapse internal whitespace
2. strip everything but letters, digits, spaces, hyphens
3. reject > 3 words or > 48 characters
4. reject the generic banlist (same list as the prompt)
5. reject anything in `tagState.dismissed`
6. reject anything already present (case-insensitive)
7. truncate to `MAX_NEW_TAGS_PER_EVALUATION (2)`
8. truncate again so the total never exceeds `MAX_TAGS_PER_THREAD (5)`

`appendThreadAutoTags` records the evaluation even when the result is empty, so
the checkpoint gate advances and the same conversation is not re-evaluated at
the same size.

### Failure behaviour

Any error — model unreachable, unparseable JSON, local data not ready — logs at
`warn` and returns `{}`. Tagging never blocks or fails a chat turn.

---

## 5. Quick tag editing

The tag strip is pinned to the bottom of the preview column and always reflects
the previewed conversation.

- Each tag is a chip. Model-applied chips carry `􀆿`.
- Hovering or focusing a chip reveals `􀆄`; clicking removes the tag. Removing a
  model-applied tag also records it in `dismissed`, so it never returns.
- The `􀅼` chip opens an inline combobox. Typing filters the workspace
  vocabulary with counts; `↑`/`↓` move, `Enter` commits the highlighted
  suggestion or the raw text, `Esc` cancels, blur cancels.
- Committing writes through `threads.tags.set` with `source: 'user'` and
  optimistically updates the row, the facet counts, and the open chat.
- A `􀋡` affordance on each conversation row (hover/focus) selects that row and
  moves focus into the tag strip — quick editing without leaving the list.
- Editing the currently open conversation's tags updates the live chat state too.

Limits: 12 tags per conversation from the editor (the model stops at 5), 48
characters per tag.

---

## 6. Renderer wiring

### `src/hooks/useChat.js`

```js
openThread(threadId)        // switch the active conversation: load messages,
                            // re-register the surface policy, set title + tags,
                            // unregister the previous thread
startNewConversation()      // leave the current conversation intact and reset to
                            // a fresh one (distinct from clearHistory, which
                            // archives)
threadTags                  // string[] for the open conversation
syncThreadTags(id, tags)    // state only, for a tag edit already saved by the
                            // browser; ignores an id that is not the open one
threadId                    // exposed so the browser can mark the active row
```

`clearHistory` keeps its current archiving behaviour; the ♻ button is untouched.

### `src/components/ConversationBrowser.jsx`

Owns search, facet state, selection, preview, and the tag editor. Refreshes its
list from the existing `api.localData.onChanged` subscription whenever the
`threads` domain changes, so new conversations, renames, and tag writes appear
without polling.

### `src/components/InteractionPanel.jsx`

Renders the switch plus whichever mode is active:

```jsx
<div className="chat-input-toolbar">
  <InteractionToolbarSwitch mode={toolbarMode} … />
  {toolbarMode === 'models'
    ? <><ModelPicker … /><ModalitySelector … /></>
    : <ConversationBrowser … />}
</div>
```

---

## 7. Logging (Hard Rule 1)

Every action produces a LogPanel entry with plain-language cause and effect.

| Event | Level | Message shape |
|---|---|---|
| `chat.browser_opened` | info | Conversation browser opened. N saved conversations are listed; opening one replaces what the chat panel shows but does not delete anything. |
| `chat.browser_filtered` | debug | Filter applied — search "x", tags [a, b], date bucket "this week". N of M conversations match. |
| `chat.conversation_opened` | info | Opened conversation "Title" (id). The chat panel now shows its N saved messages, and new messages continue this conversation instead of the previous one. |
| `chat.conversation_started` | info | Started a new conversation. The previous conversation was left intact and can be reopened from the conversation browser. |
| `chat.tags_edited` | info | Tags for "Title" changed from [before] to [after]. Removed model-applied tags are not suggested again for this conversation. |

**One edit, one entry.** `chat.tags_edited` is written in exactly one place —
`setThreadTags` in `electron/local-data-service.js` — because that is the only
code that sees what was actually stored rather than what was asked for. Electron
log entries reach the Log Panel through `terminal-log-entry`, so nothing is lost
by keeping it there. The browser and the chat hook deliberately do not log the
same write, and there is one renderer write path for tags
(`threads.tags.set`, called by the browser) so the two cannot drift.
| `chat.tags_applied` | info | The model added N tag(s) to "Title" after its Nth check. Tags are used only for finding this conversation again. |
| `agent.tags` (electron) | debug | Gate outcome: which gate declined and why, or the model call result. |
| `chat.tags_failed` | warn | Tagging could not run (reason). The conversation is unaffected and keeps its existing tags. |

---

## 8. The mockup

`docs/conversation-browser-mockup.html` is the canonical picture: model mode
with the new switch, conversations mode, facets expanded, and the tag combobox.
It is built from the verdigris theme's own `--interaction-*` tokens and row
metrics, so it shows the real surface rather than a wireframe of it.

Where the implementation and the mockup disagree, the mockup is right.
