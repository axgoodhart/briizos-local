# BfastBundle — Toast, Snackbar, and Margerin

**Status:** implemented (initial cut)
**Owner:** briizOS.local, renderer-side
**Last updated:** 2026-04-09

The BfastBundle is the unified home for briizOS.local's three fast-feedback UI surfaces: `Toast`, `Snackbar`, and `Margerin`. It replaces the ad-hoc mix of the legacy `ConfirmationToast`/`ToolContext` gate, stray one-off confirmation patterns, and the (missing) pre-hoc intent-hold UI that chat-originated tool calls were silently bypassing.

---

## 1. Motivation

briizOS.local had two independent confirmation paths for tool calls:

1. **ToolContext/`ConfirmationToast`** — a React context with a `pendingConfirmation` state, consumed by `InteractionPanel` and the `useAgentWorkers`/`executeTool` pipeline. Every user- or agent-initiated call into `tools.js` that set `requiresConfirmation: true` was gated by a teal top-left pill that slid in via `.confirmation-toast { transform: translateX(-110%) → translateX(0) }`.
2. **Chat → `BriizTools.execute`** — the `useChat` pipeline called `briizToolsRef.current.execute(name, params)`, which (pre-remediation) hit a fake-success IPC stub in `electron/main.js` and (post-remediation) now hits the real registry via `getToolRegistry()`.

The remediation that reconnected chat to the real registry **also** quietly bypassed the confirmation gate, because the chat path never went through `ToolContext`. In briizOS.Web the equivalent gate was `window.confirmationUI.queueAction(...)` and every write was gated — including writes originated from the chat. briizOS.local ended up in a state where chat writes were *more* permissive than their web counterpart, which was never the intent.

BfastBundle restores the gate on a purpose-built queue that is:
- React-free at the core (usable from any renderer module, including `briizos-tools.js` which has no React context)
- gating for writes (returns a Promise; handler waits)
- non-gating for post-hoc receipts (toast/snackbar fire-and-forget)
- typed to a single mental model the user asked for: **toast, snackbar, margerin**.

---

## 2. Taxonomy

| Kind      | When             | Gating? | User intent         | Auto-dismiss? | Shape                 |
| --------- | ---------------- | ------- | ------------------- | ------------- | --------------------- |
| Margerin  | **Pre**-hoc      | Yes     | Authorize an action | No            | Dark pill + two secondary icons beneath |
| Toast     | **Post**-hoc     | No      | Confirm receipt     | Yes (~2.5s)   | Soft gradient pill, no buttons |
| Snackbar  | **Post**-hoc     | No      | Receipt + 1 action  | Yes (~5s)     | Dark pill w/ yellow stroke + pulsing bead + 1 action chip |

A **Margerin** is the user's invention: a pre-hoc intent hold that looks like a toast, defaults to ✓ (approve), and lets the user redirect with two secondary icons (✕ cancel, 💬 return-to-chat). It exists because a traditional confirmation dialog is too heavy, a plain toast is too passive, and a snackbar's post-hoc "undo" window doesn't protect against destructive or expensive actions.

### Why the name?

> margerin spreads out the execution process and presents a scrumptious and harmless request

The name comes from "margarine" — it spreads the commit over time, visually sits like a pat on a plate, and softens an otherwise sharp "are you sure?" moment.

---

## 3. Architecture

```
                            ┌──────────────────────┐
                            │   BfastBundle        │
                            │   (React view)       │
                            └──────────▲───────────┘
                                       │ useSyncExternalStore(subscribe, getState)
                                       │
                            ┌──────────┴───────────┐
                            │   bfast-queue.js     │
                            │   (non-React store)  │
                            └──────────▲───────────┘
                                       │
            ┌──────────────────────────┼────────────────────────────┐
            │                          │                            │
            │                          │                            │
   enqueueMargerin()              toast()                      snackbar()
            ▲                          ▲                            ▲
            │                          │                            │
   briizos-tools.js           anywhere in the renderer     anywhere in the renderer
   executeToolInternal()      (task completion, sync,      (undo windows, mid-
   pre-hoc gate on              panel ops, file ops,        action recovery)
   requiresConfirmation         scheduled reminders)
```

- `bfast-queue.js` is a module-level pub/sub store with no React imports. It exposes `subscribe`, `getState`, `enqueueMargerin`, `rotateSelectedIcon`, `setSelectedIcon`, `commitMargerin`, `toast`, `snackbar`, `dismiss`, `clearAll`, plus selectors (`selectCurrentMargerin`, `selectToasts`, `selectSnackbars`) and a chat-return event bus (`onChatReturn`).
- `BfastBundle.jsx` is a single React component that mounts once in `App.jsx` (AppContent), subscribes to the queue via `useSyncExternalStore`, and renders the current margerin plus all queued toasts and snackbars.
- The three visual components (`Margerin.jsx`, `Toast.jsx`, `Snackbar.jsx`) are stateless — they dispatch to the queue on click/scroll and let the queue own all state transitions.

### State shape

```js
{
  actions: [
    // margerin
    {
      id, kind: 'margerin',
      toolName, params, label,
      selectedIcon: 'check' | 'x' | 'chat',
      createdAt,
      _resolve, _reject,
    },
    // toast
    {
      id, kind: 'toast',
      message, tone: 'info' | 'success' | 'error',
      createdAt, durationMs,
    },
    // snackbar
    {
      id, kind: 'snackbar',
      message,
      action: null | { label, onPress },
      createdAt, durationMs,
    },
  ],
}
```

Only **one** margerin is presentable at a time (`selectCurrentMargerin` returns the head of the queue filtered to kind=margerin). This is intentional: margerins are gating, and two pending gates would create an ambiguous input surface. Toasts and snackbars have no such restriction and can pile up vertically.

---

## 4. Margerin — detailed behavior

### 4.1 Visual

A dark purple pill containing the action label and a single primary icon inside on the right. Beneath the pill, a horizontal row of two smaller secondary icon buttons (the two icons that are NOT currently selected). The primary icon's colored border tints with the selected action: green for ✓, red for ✕, blue for 💬.

The pill sits at the bottom of the screen above the toast/snackbar stack; on a fresh mount it fades/rises in over 200ms. On `prefers-reduced-motion` the animation is suppressed.

### 4.2 Icon order & default

```
ICON_ORDER = ['check', 'x', 'chat']
default    = 'check'
```

### 4.3 Interactions

| Gesture                                          | Effect                                        |
| ------------------------------------------------ | --------------------------------------------- |
| Click anywhere on the pill                       | Commit the currently-selected icon            |
| Click directly on the primary icon inside        | Commit the currently-selected icon (same as above, event bubbles up) |
| Click one of the two secondary icons             | Set that icon as selected AND commit it immediately |
| Scroll wheel over the pill                       | Rotate the selected icon through `ICON_ORDER` |
| Keyboard focus + Enter/Space                     | Commit (same as pill click)                   |

Scroll handling accumulates `deltaY` with a threshold of 20 so that a single gentle flick rotates exactly one step and a heavy scroll doesn't over-rotate. Direction is `sign(deltaY)`.

### 4.4 Commit resolutions

`commitMargerin(id, icon?)` removes the action from the queue and resolves/rejects its Promise:

| Chosen icon | Promise outcome                                                          |
| ----------- | ------------------------------------------------------------------------ |
| ✓ `check`   | `_resolve({ __approved: true })`                                         |
| ✕ `x`       | `_reject(new Error('Action cancelled by user'))`                         |
| 💬 `chat`   | `_reject(err)` where `err.__returnedToChat = true`, `err.__toolName`, `err.__params`, `err.__label`, AND emits `chatReturn` event |

### 4.5 The 💬 chat-return path

When the user taps 💬 on a margerin:

1. The margerin is removed from the queue and its Promise is rejected with a *marked* error.
2. `_emitChatReturn({ toolName, params, label })` fires to every subscriber of `onChatReturn`.
3. `briizos-tools.js`'s `executeToolInternal` catch re-throws the marked error up into `useChat.executeToolCall`.
4. `useChat.executeToolCall` sees `error.__returnedToChat === true` and marks the tool card `status: 'returned'` (not `'failed'`), then rethrows.
5. The stream consumer in `useChat.sendMessage` sees the same flag and skips the `[Tool failed: X]` stream append — a chat-return is not a failure.
6. `InteractionPanel`'s `useEffect(onChatReturn, [])` subscription fires, setting the textarea value to `re: {label}\n\n{prevDraft}` and refocusing the textarea with the caret at the end.

Net effect: from the user's perspective, tapping 💬 on "Add event 'Lunch' on Apr 10?" drops them back in the chat input with:

```
re: Add event 'Lunch' on Apr 10?

|
```

…where `|` is the caret. They can delete the quote, append a question ("why did you pick Apr 10 and not Apr 11?"), or rewrite the request entirely.

---

## 5. Toast — detailed behavior

### 5.1 Visual

A soft gradient pill with a message and no buttons. Three tones:
- `success` — soft purple gradient (default for tool-complete receipts)
- `info` — neutral slate
- `error` — muted red

### 5.2 Lifecycle

```
toast(message, opts?) → pushes { kind: 'toast' } into queue
                     → setTimeout(dismiss, durationMs) fires at ~2500ms
                     → user click also dismisses early
```

Returns the action id so callers can dismiss early via `dismiss(id)`. No Promise is returned — toasts are fire-and-forget.

### 5.3 Callers

- `briizos-tools.js` `executeToolInternal` fires a success toast after any gated (write) tool handler resolves. Read-only tools stay quiet.
- Any imperative caller in the renderer can import `toast` directly from `bfast-queue`.

---

## 6. Snackbar — detailed behavior

### 6.1 Visual

A dark pill with a yellow stroke, a pulsing blue bead on the left, an underlined message in the middle, and one optional action chip on the right.

### 6.2 Lifecycle

```
snackbar(message, action?, opts?)
  → pushes { kind: 'snackbar' } into queue
  → setTimeout(dismiss, durationMs) fires at ~5000ms
  → user click on body dismisses early (does NOT invoke action)
  → user click on action chip invokes action.onPress() then dismisses
```

### 6.3 Callers

Snackbars are most useful for:
- post-hoc "undo" windows (e.g. "Deleted 'Inbox'.", action: `{ label: 'Undo', onPress: restore }`)
- post-hoc "open" affordances (e.g. "Added 'Lunch' on Apr 10.", action: `{ label: 'Open', onPress: showOnCalendar }`)
- post-hoc "view" affordances for longer-lived receipts

No current `briizos-tools.js` call uses snackbars by default — the executor uses plain toasts so there's nothing for the user to click. Future work: give `completeTask`, `deletePanel`, and `closeAllPanels` undo-backed snackbars instead of toasts.

---

## 7. Tool executor integration

`briizos-tools.js`'s `executeToolInternal` is now:

```js
if (tool.requiresConfirmation) {
  const label = formatMargerinLabel(toolName, params);
  // Rejects with __returnedToChat on 💬 or a plain Error on ✕
  const decision = await enqueueMargerin({ toolName, params, label });
  if (!decision?.__approved) throw new Error('Margerin did not resolve approved');
}

const result = await tool.handler({ ...params, __agentAuto: true }, appContext, layoutHook);

if (tool.requiresConfirmation) {
  try { toast(formatToastMessage(toolName, params), { tone: 'success' }); } catch {}
}

return result;
```

The `__agentAuto: true` flag is still passed to the handler because the pre-hoc gate is the margerin itself — the real handler must NOT also prompt the user via `ToolContext.confirmAction`. The margerin *is* the confirmation.

Read-only tools (`requiresConfirmation: false`) skip both the margerin gate and the success toast entirely, staying on the zero-friction fast path.

---

## 8. Prose formatting (`bfast-format.js`)

All human text for the BfastBundle is centralized in `src/lib/bfast-format.js`:

- `formatMargerinLabel(toolName, params)` → pre-hoc, question form, imperative ("Add event 'Lunch' on Apr 10?")
- `formatToastMessage(toolName, params)` → post-hoc, past-tense ("Added 'Lunch' on Apr 10.")

Both functions fall back to a readable default derived from the tool name (camelCase → "Tool Name") when no bespoke formatter is registered, so adding a new tool never breaks the UI — it just shows a slightly less polished label until the tool gets its own case.

Guidance on adding new formatters:
- Keep labels under ~60 chars so they fit inside the pill without truncating.
- Margerin labels should end in `?` and use imperative verbs.
- Toast labels should end in `.` and use past-tense or plain verbs.
- Prefer `'quoted-titles'` over bare titles so tool calls with generic nouns ("event", "task") stay readable.
- Use `shortDate()` / `shortTime()` helpers for dates/times so "2026-04-10" renders as "Apr 10".

---

## 9. Positioning & stacking

BfastBundle is a fixed-position stack at the **bottom center** of the viewport:

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           (workspace)               │
│                                     │
│                                     │
│    ┌─ snackbar  ─────────────┐      │
│    ├─ toast     ─────────────┤      │
│    ├─ toast     ─────────────┤      │
│    └─ margerin  ─────────────┘      │  ← 24px from bottom, centered
└─────────────────────────────────────┘
```

The margerin slot is closest to the bottom because it's the element that demands user attention; toasts and snackbars stack upward above it. This differs from briizOS.Web's top-left confirmation pill, which competed with the left sidebar for attention. Bottom-center works for briizOS.local because the InteractionPanel is a floating panel and there's no fixed left column to avoid.

Max width is `min(560px, calc(100vw - 32px))` — wide enough for most labels, narrow enough to not dominate a large display.

---

## 10. Accessibility

- The margerin pill is a real `<button>` with `aria-label` that describes the current action and tells the user they can scroll to change it.
- Each secondary icon is a `<button>` with `aria-label` from `ICON_TITLE[icon]` and a matching `title` tooltip.
- Toasts and snackbars are `role="status" aria-live="polite"` so screen readers announce receipts without interrupting ongoing speech.
- The pulsing bead on the snackbar is `aria-hidden="true"` (decoration).
- `prefers-reduced-motion: reduce` suppresses all fade/bead animations.

Keyboard semantics: the margerin pill is focusable and Enter/Space commit the selected icon. **Known gap:** there's no keyboard path to rotate the selected icon — scroll-wheel is currently the only rotation affordance. A future iteration should add Arrow Left/Right rotation when the pill has focus.

---

## 11. Lifecycle edge cases

| Situation                                      | Behavior                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Route change / unmount while margerin pending  | `clearAll()` rejects pending margerins with `'Bfast queue cleared'`                     |
| Two chat tool calls back-to-back (both gated)  | Both margerins queue; only the head is rendered; the second appears when the first commits |
| User scrolls while hovering over a toast/snackbar, not a margerin | Scroll falls through; wheel handler is only on the margerin pill                        |
| User scrolls the margerin to 💬 and clicks     | Pill click commits 💬, which triggers chat-return                                       |
| `tool.handler` throws after margerin approval  | Error propagates to `useChat.executeToolCall` → failed tool card (no toast fires)       |
| Toast auto-dismiss fires after unmount         | `setTimeout` calls `dismiss(id)`; `dismiss` no-ops if id isn't in the queue             |

---

## 12. What this deliberately does not do

- **Does not replace `ToolContext` / `ConfirmationToast` yet.** The existing teal confirmation pill still gates agent-worker and hotkey-originated tool calls via `ToolContext.pendingConfirmation`. Unifying the two gates is tracked as future work (see §13). For now, chat-originated calls use the margerin and agent-worker calls keep using `ConfirmationToast`.
- **Does not surface `requiresConfirmation: false` read-only tools.** No margerin, no toast — reads stay silent so they don't spam the bundle.
- **Does not gate the 15 local-only tools.** `runCommand`, `agentReadFile`, canvas/scratchpad, etc. still live behind the agent-worker/tool-bridge path and are not exposed to chat at all.
- **Does not persist across reloads.** The queue is module-level state; a reload clears everything. This is intentional — pending margerins and toasts are ephemeral UI.
- **Does not serialize multiple margerins.** The queue data structure can hold many, but only the head is rendered. Rapid-fire chat calls will queue correctly; the user will see them one at a time.

---

## 13. Future work

1. **Unify with `ToolContext`.** Once the margerin gate has been shipped for a week or two and the prose coverage in `bfast-format.js` is fleshed out, rewrite `ToolContext.confirmAction` to delegate to `enqueueMargerin`, delete `ConfirmationToast.jsx`, and retire the `.confirmation-toast` CSS. Every tool call — chat, agent, or hotkey — goes through one gate.
2. **Keyboard rotation.** Arrow Left/Right when the pill has focus, with a visible focus ring.
3. **Snackbar upgrades.** Switch `completeTask`, `deletePanel`, `closeAllPanels` to snackbar-with-undo instead of plain toasts so destructive-but-reversible actions get a ~5s grace window.
4. **Rich margerin labels.** Allow formatters to return `{ label, detail }` where `detail` is an optional second line (e.g. "Add event 'Lunch'" / "Apr 10 at 12:30 PM · 60 min").
5. **Margerin drag-to-dismiss.** Pull the pill down off-screen to cancel, up to return-to-chat. Complements scroll-wheel for touch devices.
6. **Telemetry.** Log the three outcomes (✓/✕/💬) per-tool so we can see which tools the model over-calls and which ones users most often want to discuss before running.

---

## 14. File inventory

| File                                                | Purpose                                             |
| --------------------------------------------------- | --------------------------------------------------- |
| `src/lib/bfast-queue.js`                            | Non-React pub/sub store; source of truth            |
| `src/lib/bfast-format.js`                           | Prose helpers (margerin labels, toast messages)     |
| `src/components/bfast/BfastBundle.jsx`              | React view; mounts once in App.jsx                  |
| `src/components/bfast/Margerin.jsx`                 | Pre-hoc intent-hold pill + secondary icon row       |
| `src/components/bfast/Toast.jsx`                    | Post-hoc fire-and-forget receipt                    |
| `src/components/bfast/Snackbar.jsx`                 | Post-hoc receipt with one optional action           |
| `src/components/bfast/bfast.css`                    | All BfastBundle styles                              |
| `src/lib/briizos-tools.js` (modified)               | `executeToolInternal` gates on `enqueueMargerin`    |
| `src/hooks/useChat.js` (modified)                   | Suppresses failed-card on `__returnedToChat`        |
| `src/components/InteractionPanel.jsx` (modified)    | Subscribes to `onChatReturn`; prepends "re:" quote  |
| `src/App.jsx` (modified)                            | Mounts `<BfastBundle />`                            |
