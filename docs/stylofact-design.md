# Stylofact, second version

Draft for Alex, 2026-10-27. This replaces the old tool set aside in `docs/quarantine/stylofact/`. Not built yet. The decisions near the end were made by Alex on 2026-10-27.

## What it does

With Stylofact, pieces get written in your voice from opinions you have already expressed.

First, samples of your writing are given once. From them, a style guide is written: a plain-English document about how you write, which you can read and correct.

Then, for each new piece, you describe what it should be about. Your ChatGPT history is searched for things you have said on that subject, the quotes are shown to you, and you pick the ones worth using. From the guide and your chosen quotes, a draft is written.

Three steps: the guide once, then find, then write.

## What's different from the old version

| Old | New |
|---|---|
| Your voice was a list of numbers ("sentences about 22 words, em dashes 3 per 1000 words"). | Your voice is a written guide, in the shape of `Style Directions - Essays.md`. The numbers are still measured, but each one appears inside a sentence about what you do with it. |
| Writing samples belonged to one project. | Guides belong to you. One guide covers everything by default; a sample can be marked as belonging to one form of writing only. |
| Your ChatGPT history was read by Stylofact's own machinery, including a downloaded AI model that kept crashing. | Your history is read by Split. No downloaded model. |
| Six steps, six separate AI runs. | Three steps. |

## 1. The style guide

### What is in it

Two kinds of description, and both matter:

**How you think on the page.** The move your essays make (one contradiction, found early and held open rather than resolved). How an argument travels from an observation to something a performer can do. Who the reader is. Where the jokes go and what they are for. What an ending does.

**How your sentences are built.** How long your sentences tend to be and how much that varies. How many syllables your words tend to have. Where semicolons, colons, dashes, parentheses and slashes appear and what each one is doing. How sentences tend to start. How long paragraphs run. Whether contractions are used. Favourite verbs and nouns. Foreign phrases. The one exclamation mark per essay.

The second kind is counted, not guessed. Before the guide is written, these things are counted in your samples. The counts are handed, with the samples, to the AI writing the guide, whose job is to turn each count into a description of a habit. For example: "Semicolons appear about three times per thousand words, almost always joining two clauses that could each stand alone. Colons are used for heavier work: a claim is set up, then delivered." A number never appears on its own; it always comes with the habit it describes.

### What it looks like

A document of about thirteen sections, in the shape of the essay guide already in the folder: who it's for, the governing idea, titles and headings, openings, the shape of the argument, voice, sentence habits (with the counts), word choice, evidence, interpretive frames, endings, how the page looks, and a checklist at the end. The checklist is what a draft is later compared against.

### How you make one

1. Drop in your samples, as files or pasted text. PDFs and Pages documents are fine.
2. You are shown one line: how many pieces, how many words, and whether that is enough. Under about 2,500 words, the guide is marked as a rough sketch. Over about 5,000, it is marked solid.
3. The guide is written by the AI while you watch it appear.
4. You edit it like any other document. Once edited, your words win and are never overwritten. When you add samples later, a recount is offered, and any suggested changes are shown to you before you accept them.

One guide by default, covering all your writing. When you add a sample, you choose whether it belongs to the general guide or to one form only (essays, blog, notes). Form-specific samples produce a short addendum to the general guide for that form.

With each guide, its samples, its counts and its date are kept. For each piece, the guide version used is kept.

## 2. Finding material

For a new piece, you write one sentence about what you want: "what I've said about modal harmony as emotional practice."

1. Your sentence is turned by the AI into a list of search phrasings: the literal words, synonyms, metaphors you might have reached for, nearby topics. This is the job the old downloaded model was meant to do, and the AI is better at it.
2. The list is sent to Split, and your matching messages are returned with each conversation's title and date. Only your messages count; what ChatGPT said back is context, never a quote.
3. The promising messages are read by the AI along with the messages before and after, and quotes are pulled out.
4. Any quote not actually found in your messages is dropped. Split's copy of your messages is all lowercase, and that is fine: these are your opinions, not demonstrations of your style.

The quotes are shown to you as a list: the quote, the conversation it came from, the date, and a way to open the surrounding conversation. You keep the ones you want. Nothing is done without your say.

If Split isn't running, it is started by briizOS. Pasted material works without Split.

## 3. Writing

From the approved quotes and the guide, a draft is written in one AI run. The whole guide goes in as text. The result is the piece.

A second-AI review is available but off by default. When turned on, the draft is read against the guide's checklist and a revision is offered. Draft and revision are shown side by side, and you pick one.

After a draft, the same things are counted in it that were counted in your samples, and you are told where it drifted: "sentences run shorter than yours; no semicolons." Information, not a judgment, and nothing is changed by it.

## Where it lives

Its own panel, as the old version was. Not inside Islands for now.

## What Split needs

Your messages are already held by Split in memory, with dates, and are searchable in a fraction of a second. Two small changes:

- **Which message, not which file.** Today a search in Split is answered with the file that matched. Stylofact needs the message that matched, with its conversation's title and date. So a reference from each message to its conversation is added to Split's stored index.
- **Neighbours.** For a matched message, the message before and after in the same conversation, so quotes can be read in context.

Capitals and punctuation do not need to be preserved. Split's lowercase copy is what gets searched and quoted.

## Decisions made (Alex, 2026-10-27)

1. Its own panel, not Islands.
2. Split is started by briizOS when needed and not already running.
3. Second-AI review off by default.
4. One guide for everything by default. When adding samples, you choose: all writing, or one form only.
5. Exact capitals and punctuation from Split are not needed.

---

## Builder's notes

Skippable for Alex.

- **Storage.** Two tables. `stylofact_guides`: id, guide_text, addenda_json (per form), samples_json (each tagged with a form or 'all'), measurements_json, created_at, updated_at, revision. `stylofact_pieces`: id, guide_revision, request_text, quotes_json, draft_text, review_text, drift_json, timestamps. The old `007` and `013` tables stay inert.
- **Agent tools.** `history_search` and `history_context`, wrapping Split's two routes. Read-only. Offered only during the Find step.
- **Split routes.** `POST /api/messages/search` with `{ queries, role, from, to, limit }`: score each record in `historybot-meta.json` by how many queries it contains (case-insensitive substring over the existing text buffer); return the top hits with conversation reference, title, date, role and text. `GET /api/messages/context?conversation=&index=&before=1&after=1`: adjacent records in the same conversation, from the same buffer. No JSON parsing at query time. The cache build adds a `conversations` array to `historybot-meta.json` (`[file, indexInFile, title, create_time]` per conversation) so a record resolves to a title and date.
- **Quote check.** Lowercase the model's quote and confirm it appears in the matched message text from Split; drop it otherwise.
- **Launching Split.** A setting for Split's folder. When `/api/historybot/status` is unreachable, run `node server.js` there and wait for it to answer. Default address `http://localhost:9002`.
- **Keep from quarantine.** `src/lib/stylofactMetrics.js`, adding syllable distribution and clause markers. The JSON recovery in `decodeJson`. The streaming run pattern in `runAgent`.
- **Remove.** `electron/stylofact-corpus/`, both old schemas, the six-stage prompts in the skill file (three short ones instead), the old panel and CSS, the corpus tests. Drop `@huggingface/transformers`, `sqlite-vec` and `stream-json` from `package.json` after checking nothing else imports them.

---

## Built (2026-10-27)

Everything above is now in the app, in its own panel. What to look for:

- **Stylofact in the Control Bar and header dock**, with a quotation-mark icon. It opens a panel with three steps across the top: Guide, Find, Write. It can also pop out as a floating window.
- **Guide.** Drop files from Sources, press Add files (PDF, Pages, Word, RTF, HTML or plain text), or paste. Each sample is marked “all writing” or a form you name. Write the guide; it streams in. Read or Edit it in place; your edits are kept and the AI only ever offers a revision as a marked-up comparison you accept or keep yours. Form addenda appear under the guide for each form with samples. Measurements sit in a fold-out as plain sentences, with every count behind another fold.
- **Find.** Start a piece, say what it is about, pick its form. The Split row shows whether Split is running, lets you start or stop it, choose its folder, and turn automatic starting on or off. Find material starts Split if needed, has the AI search your history with its own phrasings, drops any quote not actually in your messages, and lists the rest with a checkbox, the conversation's title and date, and Open the conversation.
- **Write.** Second-AI review is a checkbox, off by default. Write the piece produces the draft (and the revision when review is on) side by side with Keep this one, Copy, and a readout of where the draft drifts from your samples.
- **Log Panel.** Every step writes plain entries under Stylofact, Stylofact samples, and Stylofact history (Split), including Split's own start-up lines.

Where it lives, for whoever works on it next: `electron/stylofact/` (storage, sample reading, the Split connection, the window bridge), `electron/local-data/schema/018_stylofact.sql`, the two history tools at the end of `electron/agent/tools.js`, the AI instructions in `agent/skills/custom/stylofact/` (with the essay guide as `EXEMPLAR.md`), `src/components/stylofact/` and `src/lib/stylofactMetrics.js`, and the Stylofact section at the end of `src/AppCombined.css`. The four essays and the original style guide moved to `docs/stylofact/`. The retired first version was deleted from `docs/quarantine/`, and its three dependencies left `package.json`.
