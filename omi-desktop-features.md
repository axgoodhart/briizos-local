# Omi desktop — what users can see and do

Source: `briizOS/omi-main-new` (copied 2026-10-07), macOS app only. Catalogued 2026-10-08.
Features only — no description of how they're built or how they connect.

---

## 1. Getting started

- **Opening animation** — a short cinematic intro with sound on first launch.
- **Setup wizard in four phases**
  - **Profile:** your name, language, how you heard about Omi.
  - **Permissions:** screen recording, full disk access, microphone, accessibility, automation. It includes a file scan of your Mac and on-screen arrows that point at the switch to flip in System Settings.
  - **Shortcuts:** pick the floating bar shortcut and the push-to-talk key, then try a live voice demo.
  - **Your memory:** pick data sources to import, choose where to export your memory, set a goal, and review first tasks.
- **Memory paste-in** — paste text from elsewhere (for example, another AI's memory of you) and Omi pulls out lasting facts.
- **"Where to try it first" cards** — the end of setup opens a real site (Figma, X, Amazon, a game) with a matching question already typed in.
- **"I can see <App>" card** — a one-time card the first time Omi notices a real app on screen.
- **What's new card** — appears bottom-right after an update; tapping it opens the release notes.

## 2. Always-present controls (outside the main window)

- **Notch bar** — lives at the top-center of the screen, in or around the MacBook notch. It shows when Omi is listening, thinking or speaking.
- **Notch hover controls** — show what Omi is currently looking at, cut screen capture or audio with one click, and hide the notch.
- **Menu bar icon** — screen and audio switches, plus "Show/Hide Floating Bar".
- **Open Omi shortcut** — a global key combination that brings up the main app from anywhere.
- **Rewind shortcut** — ⌘⌥R opens Rewind from anywhere.
- **Push-to-talk** — hold a key, speak, and release to ask Omi.
  - Double-tap the key for **locked mode**, which keeps listening hands-free.
  - Optional start/stop sounds.
  - Also works by clicking a mic button.
- **Voice typing ("Omi Type")** — start a push-to-talk turn with the word "type" and Omi types what you say into whatever app has the cursor.
  - It removes filler words, fixes punctuation and polishes the text.
  - The notch dots turn red while it's dictating.
  - It works offline with on-device transcription.
  - **Silent Type** keeps dictations out of your chat history.
- **Spoken replies** — Omi can answer out loud.
  - Choose its voice and playback speed.
  - Turn spoken replies on or off for typed questions.
  - You can talk over it to interrupt.
- **Screen sharing in voice chat** — Omi can look at your screen when you ask about it.
- **Notification cards in the notch**
  - Suggestions, reminders and meeting notes appear as cards.
  - Each card can be marked helpful or not helpful, dismissed, or hidden for 2 hours.
  - Some cards have an **Execute** button that hands the job to an agent.
- **Live "receipts"** — small notes in the notch as Omi writes things down while you talk. When a conversation ends, a card says how many follow-ups it produced ("N follow-ups ready").
- **Background agent pills** — a visible pill for each agent you've launched, which you can stop. "Open the Omi app to steer this agent" takes you to its chat.

## 3. What Omi captures

- **Screen capture** — on/off switch. Screenshots are taken continuously and the text on them is read and stored on your Mac.
- **Audio recording** — three modes, picked from a menu on the top-bar mic: **Off**, **Always On**, **Only Meetings**. Each mode explains what it records.
- **Meeting detection** — notices when a call app (Zoom, Meet, etc.) is active.
  - Starts or splits recordings at call boundaries.
  - Shows a "taking notes" card once recording has actually started.
- **Meeting screenshots** — adds a few screenshots of what was on screen to a meeting's notes.
- **Live notes** — AI notes written as a conversation is happening.
- **Live transcript** — with speaker labels; you can name speakers during or after.
- **Finish conversation** — a button to save the current conversation and start a new one.
- **Excluded apps** — screen capture pauses while chosen apps are in front.
- **Ignore dictation apps** — stops listening while Wispr Flow, superwhisper or macOS Dictation is using the mic.
- **Battery optimization** — takes fewer screenshots on battery.
- **Data retention** — choose how long screen history is kept, or keep everything. The Storage card shows frame count and disk use.
- **Local file indexing** — scans your files on-device to build your memory map. A Rescan option is in Settings.

## 4. Finding things again

### Chat home (search + ask)

- **One search bar over everything** — conversations, memories and screens in one merged list.
  - Filter by type and by time window.
  - A live count shows how much matched.
- **⌘⏎ turns the search into a question** — the answer appears in the same panel, without jumping to another page.
- **Answers carry citations** — numbered references open the exact memory, conversation or screen they came from.
- **Attach a recent screen** — pick a recent screenshot from a menu (sorted by app, labeled "how long ago") and attach it to a question.
- **Chat menu** — copy, clear and AI settings.

### Memories section (the brain icon) — five views, switched with chips

- **Activity**
  - A day-by-day timeline of everything captured, newest first.
  - Each conversation has the memories and screens it produced underneath it.
  - Days can be folded shut, and an hour rail runs alongside.
  - Each day has a recap row.
- **Conversations** — list of recorded conversations.
  - **Finding:** search, filter by collection (folder), starred or date, and a compact view.
  - **Organizing:** collections with name, color and description; select several to merge or delete.
  - **Opening one shows:** summary, action items, photos, transcript and audio playback in sync, speaker naming, and a share link.
  - **Actions on one:**
    - "Discuss in Chat"
    - "Run this conversation through another app" to get a different style of summary
    - copy transcript, rename, move to folder, delete
    - re-sync the transcript to the audio
  - **Start Recording** by hand.
- **Memories** — the facts Omi has learned about you.
  - New memory (⌘N), edit, copy and delete.
  - Filter by status, source and type.
  - **Where it came from** — which app or device each memory was captured from.
  - **Public/private** per memory, or for all default memories at once. Protected memories can't be edited.
  - **Connect your memory to other AI tools** — set up and test a connection so another assistant (Claude, ChatGPT and others) can read your Omi memory. You can also let your agent set it up.
- **Rewind** — your screen history.
  - **Timeline:** a time-accurate track colored by app, with app icons, hour marks and a draggable playhead. Gaps like lunch breaks show as real gaps.
  - **Search** everything you've seen on screen. Results narrow as you type and appear as a grid of cards.
  - **Filter** results by the app they came from.
  - **Each frame:** view the text read off the screenshot, open it in Quick Look, or "Open on Timeline". There's also a list view and a timeline view.
  - **Navigation:** jump to a day; newer and older buttons.
  - **Fixing problems:** rebuild the search index, and permission-repair prompts.
- **Brain Map** — an interactive map of what Omi knows: people, topics and how they connect.
  - Zoom, inspect and replay.
  - Clicking a cited memory opens it.
  - Can be rebuilt.

### Outside the app

- **Siri / Shortcuts / Spotlight**
  - **Spoken commands:** "Remember in Omi", "Ask Omi", "Open Omi chat", "Save a Memory", "Add an Omi Task", "Complete an Omi Task", "Start / Stop Listening".
  - **Spotlight** can find your Omi memories and conversations.

## 5. Asking Omi to do things (the AI chat)

The chat can:

- **Search your stuff:** memories, conversations, tasks, screen history, past chats, email insights, messages, contacts, and a timeline of any person or topic.
- **Look at your screen:** take or fetch screenshots, and show the Rewind evidence behind an answer.
- **Create and change things:**
  - tasks and calendar events
  - memories and goals
  - **place-bound reminders**, which fire when you're in a certain app or window
  - **standing triggers** ("tell me when X happens")
  - mark old facts as no longer true
- **Act on your Mac:** click on screen, run AppleScript, read Mail and Messages, send messages, and fill in setup forms on websites.
- **Browse the web**, and use your logged-in Chrome through a browser extension.
- **Launch agents:** run background agents, check on them, message them and cancel them.
- **Think deeper** for harder questions, and ask you follow-up questions when something is unclear.
- **Learn and reuse procedures:**
  - **Playbooks** are saved step-by-step procedures the chat writes for itself.
  - **Skills** are reusable instructions you add.
- **Show its sources:** "Response Context" shows which sources were used for each answer.
- **Pick its brain:** **AI Provider** — use your Omi account or Claude for chat. **Workspace** — set a project folder for chat to use.

## 6. Omi acting on its own

- **Suggested tasks** — tasks pulled from what you said or saw on screen, waiting for you to accept. Each has a "Why Omi added this" explanation and a link back to the source.
- **Memory extraction** — learns facts from conversations and screens. An optional notification shows each new one.
- **Proactive suggestions** — advice cards based on what you're doing, at a frequency you control.
- **Task resurfacing** — brings a task back up when you're in a related context.
- **Post-meeting card** — the meeting summary plus "Copy share link" or "Email these notes to someone".
- **Integration nudges** — occasionally offers to connect an app it sees you using: Gmail, Notion, ChatGPT, Claude, Gemini, Obsidian, Apple Notes, Calendar, X, Finder. These can be reset.
- **Daily summary** — sent at an hour you choose.
- **Daily recap page**
  - day stats, your focused goal, other active goals and what's next
  - "Ask about this day", "View related tasks"
- **Goals**
  - Tracks personal goals and detects progress automatically.
  - Can suggest new goals daily.
  - "Set as focus" picks one goal to concentrate on, and "Talk to Omi about a goal" opens a chat about it.
- **AI user profile** — an AI-written summary of your habits and preferences, which can be regenerated.

## 7. Tasks

- **Views:** Today, To Do, Completed and Suggested lists.
- **Each task:** due date, priority, tags, description and repeat (daily, weekdays, weekly, every 2 weeks, monthly). There's also a **Daily task** type that repeats every day until it's done.
- **Organizing:**
  - Drag to reorder; drag sideways to indent or outdent.
  - Select several for bulk actions.
  - Search and filter by status.
- **Detail panel** — the task's source evidence, including the Rewind screenshot it came from.
- **"Work on this with Omi"** — opens a chat thread dedicated to that task, which can be resumed later. "New reply" badges show when there's something new.
- **Sharing:** copy a sharing link for a task.

## 8. Apps and connections

- **Catalog tabs:** All, Apps, Imports, Exports. Filter by connection or category, and choose "Show installed only".
- **Imports** (data into Omi): Gmail history, Google Calendar, Apple Notes, X posts and bookmarks, local files, and memory pasted from other AIs. Each shows live import progress and keeps running in the background.
- **Exports** (your Omi memory out to other tools):
  - ChatGPT, Claude, Claude Code, Codex, Hermes, OpenClaw, Notion and email
  - shown with guided setup and "copy prompt" helpers
- **Marketplace** — browse, install, rate and review community apps. It also offers to build your own app.
- **MCP servers** — add outside tool servers; their tools become available in chat.
- **Skills** — paste or drop in a SKILL.md file to teach the assistant reusable instructions.
- **Summary apps** — choose which app summarizes your conversations.
- **Disconnect or disable** any connection; data that was already imported stays.

## 9. Settings

| Section | What's in it |
|---|---|
| General | notifications permission, interface sounds, font size, window size reset, glass transparency, screen capture switch |
| Account & Plan | profile, sign out, current plan, upgrade (Operator / Architect tiers), usage limits |
| Transcription | single or multi-language, push-to-talk languages, custom vocabulary (names, brands, terms), skip silence to save cost, Silent Type, ignore dictation apps |
| Rewind | retention, excluded apps, battery optimization, storage, meeting screenshots, audio recording mode |
| Floating Bar | show/hide, spoken replies for typed questions, screen sharing in chat, voice speed |
| Alerts & Privacy | notification frequency, task/memory/integration/meeting notifications, daily summary and time, store recordings, private cloud sync, encryption, "What we track" |
| Permissions | every macOS permission's status, with repair buttons |
| Shortcuts | Open Omi shortcut, push-to-talk key, double-tap locked mode, push-to-talk sounds |
| AI & Automation | AI provider, workspace folder, browser extension, goals and auto-goals, AI user profile, your stats, rescan files, launch at login, reset onboarding, reset integration suggestions, dev mode, report an issue (sends logs) |
| Refer a Friend | share a free month |
| About | updates (automatic check, auto-install), install Omi Beta alongside, version info, community help |

- **Settings search** — type to find any setting by name or keyword.
- **Trial warnings** — notch cards at 24 hours left, 1 hour left, and expired.
- **Usage-limit popup** when you hit your plan's cap.
- **Feedback form**.

## 10. In the code but not available to users

These still exist in the code, but there's no way for a user to reach them, or they're deliberately switched off.

- **Floating typed text box** — the composer you could type into from the notch. It was retired; typed chat now lives only in the main window, and the box remains only for automated testing.
- **AI Persona** — "create an AI clone of yourself that others can chat with". The page exists but nothing opens it.
- **Chat Lab** — the page exists but nothing opens it.
- **Hidden settings panels**
  - task assistant, insight assistant and memory assistant panes
  - floating bar notification previews, solid/transparent background, draggable floating bar
  - All hidden on purpose since 2026-08-25.
- **Assistant prompt editors** — windows for editing the task and memory assistants' prompts and test-running them. They're tied to the hidden panels above.
- **Terminal task agent** — "execute this task" through a command-line agent. Removed; tasks are now a list you keep, with only the chat thread left.
- **Calendar meeting context** — matching meetings to your calendar. Only switched on for the beta build.
- **Old layouts that were replaced**
  - the standalone chat page
  - the hover "Library" menu
  - the widget dashboard on Home
  - the horizontal filmstrip of Rewind search results (now a grid)
  - the one-click mic toggle (now a menu)
