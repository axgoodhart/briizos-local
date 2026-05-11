# briizos-dev (Web) — Persistence Analysis

## Architecture: Firestore-First, Single Page App

The web version is a vanilla JS app served via Firebase Hosting. No build system or npm dependencies for the core app — Firebase SDK is loaded via CDN (v10.12.4). All persistent data flows through Firestore.

---

## Persistence Mechanisms

### 1. Firestore (Primary — Cloud)

**Firebase Config:** Inline in `/public/index.html`
- Project: `briizos`
- Auth: email/password via Firebase Authentication
- Security Rules: **Development mode** (`allow read, write: if true;`)

**Firestore Structure:**

```
users/{uid}/
  ├── panels/{panelId}
  │   ├── id, type, title, content, tags
  │   ├── x, y (position), w, h (dimensions)
  │   ├── active, customColor {h, s, l}
  │   ├── externalUrl, externalData
  │   ├── chat {provider, model}
  │   ├── createdAt, updatedAt (serverTimestamp)
  │
  ├── tasks/{taskId}
  │   ├── id, name, completed, due, tag
  │   ├── createdAt, updatedAt
  │
  ├── events/{eventId}
  │   ├── id, name, scheduledDate, dateValue, recurrence
  │   ├── createdAt, updatedAt
  │
  ├── organizer/{itemId}
  │   ├── id, type, name, completed, tag
  │   ├── createdAt, updatedAt
  │
  └── app/
      └── minStack
          ├── value (array of minimized panel IDs)
          └── updatedAt (serverTimestamp)
```

**Migration:** V1 (`users/{uid}/snapshots/app` monolithic doc) → V2 (subcollections). Auto-migrates on first load.

### 2. localStorage (Secondary — Client)

| Key | Purpose | Active? |
|-----|---------|---------|
| `glOS.state.v1` | Full app state backup | **Disabled** (`USE_LOCAL_CACHE = false`) |
| `glOS.pending.v1` | Pending offline changes | Not active |
| `briizos.chatSettings.v1` | AI provider/model settings | Yes |
| `briizos.chatHistory.{panelId}` | Chat messages per panel (7-day auto-cleanup) | Yes |
| `gcal_user` | Google Calendar auth info | Yes |
| `gcal_auth_time` | Google Calendar auth timestamp | Yes |
| `GEMINI_API_KEY` | Gemini API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |

### 3. sessionStorage (Ephemeral)

| Key | Purpose |
|-----|---------|
| `cw-collapsed-{panelId}` | Chat panel collapse state (per tab) |

---

## State Management

**Centralized in-memory state object** (`window.state` / `window.appState`):
- `state.panels[]` — All UI panels
- `state.tasks[]` — Tasks/to-dos
- `state.events[]` — Calendar events
- `state.organizer[]` — Organizer items
- `state.panelMinStack[]` — Minimized panel IDs

**Supporting stores:**
- `window.OrganizerStore` — Tasks, events, organizer CRUD
- `window.settingsManager` — AI provider settings (up to 50 snapshots)
- `window.ChatWidget` — Chat history per panel
- `window.googleCalendarSync` — Google Calendar OAuth session
- `window.panelManager` — Panel lifecycle management

---

## Data Flow

### Write Path (UI → Firestore)

1. User action in UI
2. `state.panels[]` / `state.tasks[]` etc. updated in memory
3. `persistence.savePanel(panel)` called
4. `queueFirebaseSave()` adds to debounce queue (1000ms)
5. `flushSaveQueue()` sanitizes data → `setDoc()` with merge to Firestore
6. `serverTimestamp()` applied to `updatedAt`

### Read Path (Firestore → UI)

1. `onAuthStateChanged()` fires after login
2. `setupRealtimeSync(uid)` attaches `onSnapshot()` listeners to all collections
3. Firestore pushes real-time updates
4. `mergeArrayByIdInPlace()` updates in-memory state preserving object identity
5. `notifyUIUpdate(name)` triggers component re-renders

### Pre-Auth Queuing

- Writes queued before auth completes
- Retry with backoff every 2 seconds until `uid` available
- `flushAll()` called on `beforeunload` to ensure saves

---

## What's Persistent vs. Ephemeral

| Data | Firestore | localStorage | Ephemeral |
|------|-----------|--------------|-----------|
| Panels (notes, apps, timers) | ✅ | — | — |
| Panel position/size/color | ✅ | — | — |
| Tasks | ✅ | — | — |
| Events | ✅ | — | — |
| Organizer items | ✅ | — | — |
| Minimized panel stack | ✅ | — | — |
| AI model/provider settings | — | ✅ | — |
| Chat history (7-day TTL) | — | ✅ | — |
| Google Calendar session | — | ✅ | — |
| API keys | — | ✅ | — |
| Chat collapse state | — | — | ✅ (sessionStorage) |
| Scroll positions | — | — | ✅ |
| Search results | — | — | ✅ |
| Undo/redo stacks | — | — | ✅ |

---

## Key Characteristics

- **Firestore is the authoritative source** for all core app data
- **No offline mode** — app requires Firestore connectivity for data
- **Debounced writes** (1000ms) minimize API calls
- **Real-time sync** via `onSnapshot()` listeners
- **No build step** — vanilla JS, Firebase via CDN
- **Security rules are wide open** (`allow read, write: if true;`) — development mode
