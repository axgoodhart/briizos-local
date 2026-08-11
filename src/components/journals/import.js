/* ── Journal import ───────────────────────────────────────────────────
   Turns plain text files into prefab folios so a new journal can be born
   already full. Pure data in, pure folio specs out — no DOM, no IPC, so
   the create modal stays the only place that knows about <input type=file>.

   Each file becomes ONE folio. Notes folios get a ProseMirror doc that the
   viewer's rebalance engine paginates on open (overflow rolls into
   continuation pages by itself), so a long file needs no page maths here.

   Version one understands two destinations:
     notes → { doc }                    paragraphs become paragraphs
     todo  → { items: [{text, done}] }  paragraph breaks become list items

   A file can be aimed by hand or left on 'auto', where classifyText picks
   the destination from how the text is shaped. */

/* Destination choices offered in the UI. `auto` is resolved per file by
   classifyText; the other two are the folio types v1 can fill. */
export const IMPORT_TARGETS = [
  { id: 'auto', label: 'sort for me', hint: 'Read each file and pick notes or list' },
  { id: 'notes', label: 'notes', hint: 'Prose pages, paragraphs preserved' },
  { id: 'todo', label: 'list', hint: 'One checkbox per paragraph break' },
];

export const IMPORT_TARGET_IDS = IMPORT_TARGETS.map((t) => t.id);

/* What the file picker will show. Anything that is really text is readable
   even if the extension is unusual, so the picker also allows a catch-all. */
export const TEXT_FILE_ACCEPT = '.txt,.md,.markdown,.text,.log,.csv,text/plain,text/markdown';

/* Guard rails: a journal page is not a place for a 5 MB log dump, and a
   single import shouldn't silently create hundreds of pagegroups. */
export const MAX_FILE_BYTES = 1024 * 1024; // 1 MB per file
export const MAX_FILES = 25;

/* ── Text shaping ────────────────────────────────────────────────────── */

const normalize = (text) =>
  String(text ?? '')
    .replace(/\r\n?/g, '\n') // CRLF / CR → LF
    .replace(/ /g, ' ') // NBSP reads as a space on the page
    .replace(/\t/g, '    ')
    .trim();

/* Paragraph break = one or more blank lines. This is the unit the user
   asked lists to be split on, and it doubles as the prose paragraph. */
export function splitParagraphs(text) {
  return normalize(text)
    .split(/\n[ \t]*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

const nonEmptyLines = (text) =>
  normalize(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/* Leading list furniture: bullets, numbers, and markdown checkboxes.
   Captured so an already-ticked `- [x]` imports as a done item. */
const MARKER = /^\s*(?:[-*+•·–—]|\d+[.)])?\s*(?:\[([ xX])\])?\s*/;

function stripMarker(line) {
  const match = line.match(MARKER);
  const box = match?.[1];
  const text = line.slice(match?.[0].length ?? 0).trim();
  return { text, done: box === 'x' || box === 'X' };
}

const hasMarker = (line) => /^\s*(?:[-*+•·–—]\s|\d+[.)]\s|\[[ xX]\])/.test(line);

/* ── Classification ──────────────────────────────────────────────────── */

const TODO_NAME_HINT = /\b(todo|to-?do|task|tasks|checklist|check-?list|shopping|groceries|errands|punch-?list)\b/i;
const NOTES_NAME_HINT = /\b(notes?|journal|diary|essay|draft|log|minutes|transcript|readme)\b/i;

/* Decide where an unaimed file belongs. Returns the chosen folio type plus
   the reason, so the modal can tell the user *why* a file was sorted the
   way it was instead of silently guessing at them.

   The signals, in the order they carry weight:
     1. Markdown/bullet furniture on most lines → a list, unambiguously.
     2. Filename says todo/checklist (or says notes/essay).
     3. Shape: many short blocks reads as a list; long blocks with
        sentence punctuation reads as prose. */
export function classifyText(text, filename = '') {
  const lines = nonEmptyLines(text);
  const blocks = splitParagraphs(text);

  if (!lines.length) return { type: 'notes', reason: 'empty file' };

  const markers = lines.filter(hasMarker).length;
  const markerRatio = markers / lines.length;
  if (markerRatio >= 0.5) {
    return {
      type: 'todo',
      reason: `${markers} of ${lines.length} lines are bulleted`,
    };
  }

  if (TODO_NAME_HINT.test(filename) && !NOTES_NAME_HINT.test(filename)) {
    return { type: 'todo', reason: 'filename reads like a checklist' };
  }
  if (NOTES_NAME_HINT.test(filename)) {
    return { type: 'notes', reason: 'filename reads like prose' };
  }

  const units = blocks.length > 1 ? blocks : lines;
  const avgLength = units.reduce((sum, u) => sum + u.length, 0) / units.length;
  const sentenceish = units.filter((u) => /[.!?]["')\]]?$/.test(u)).length / units.length;

  // Short, punctuation-free fragments are things to do; anything longer or
  // properly punctuated is something to read.
  if (units.length >= 3 && avgLength <= 60 && sentenceish < 0.5) {
    return {
      type: 'todo',
      reason: `${units.length} short fragments, no sentence endings`,
    };
  }

  return {
    type: 'notes',
    reason: avgLength > 60 ? 'long, prose-shaped blocks' : 'reads as prose',
  };
}

/* ── Folio builders ──────────────────────────────────────────────────── */

/* Paragraph breaks are the item boundary the user asked for. A file with no
   blank lines at all would collapse to a single giant item, which is never
   what someone importing a checklist wants — so fall back to one item per
   line in exactly that case. */
export function toListItems(text) {
  const blocks = splitParagraphs(text);
  const lines = nonEmptyLines(text);
  const units = blocks.length > 1 ? blocks : lines;

  return units
    // A multi-line block keeps its shape as one item; the newlines just go.
    .map((unit) => stripMarker(unit.replace(/\n[ \t]*/g, ' ')))
    .filter((item) => item.text);
}

/* ProseMirror JSON matching what createNotesEditor persists, so imported
   pages are indistinguishable from typed ones. Blank lines separate
   paragraphs; single newlines inside a paragraph become hard breaks. */
export function toProseDoc(text) {
  const content = splitParagraphs(text).map((block) => {
    const nodes = [];
    block.split('\n').forEach((line, i) => {
      if (i) nodes.push({ type: 'hardBreak' });
      const trimmed = line.trim();
      if (trimmed) nodes.push({ type: 'text', text: trimmed });
    });
    return nodes.length ? { type: 'paragraph', content: nodes } : { type: 'paragraph' };
  });

  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/* "meeting-notes_01.txt" → "Meeting notes 01" — a page title someone would
   actually have typed. */
export function titleFromFilename(name) {
  const base = String(name || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return 'Imported';
  const titled = base.charAt(0).toUpperCase() + base.slice(1);
  return titled.length > 48 ? `${titled.slice(0, 47).trimEnd()}…` : titled;
}

/* One import candidate → one folio spec, shaped like a template folio so
   the create flow can concatenate the two lists without special-casing.
   `target` is 'auto' | 'notes' | 'todo'. */
export function buildFolio(doc, target = 'auto') {
  const resolved = target === 'auto' ? classifyText(doc.text, doc.name).type : target;
  const title = doc.title || titleFromFilename(doc.name);

  if (resolved === 'todo') {
    return { type: 'todo', title, content: { items: toListItems(doc.text) } };
  }
  return { type: 'notes', title, content: { doc: toProseDoc(doc.text) } };
}

export function buildFolios(docs, targets = {}) {
  return (docs || [])
    .filter((doc) => doc && normalize(doc.text))
    .map((doc) => buildFolio(doc, targets[doc.id] || 'auto'));
}

/* What a file will turn into, for the modal's preview line. Cheap enough to
   recompute on every render. */
export function previewImport(doc, target = 'auto') {
  const classified = target === 'auto' ? classifyText(doc.text, doc.name) : null;
  const type = classified ? classified.type : target;

  if (type === 'todo') {
    const count = toListItems(doc.text).length;
    return { type, count, label: count === 1 ? '1 item' : `${count} items`, reason: classified?.reason };
  }
  const count = splitParagraphs(doc.text).length;
  return {
    type,
    count,
    label: count === 1 ? '1 paragraph' : `${count} paragraphs`,
    reason: classified?.reason,
  };
}

/* ── File reading ────────────────────────────────────────────────────── */

const isProbablyText = (file) =>
  !file.type || file.type.startsWith('text/') || /\.(txt|md|markdown|text|log|csv)$/i.test(file.name);

/* Read a FileList into import candidates. Resolves with both the readable
   docs and the reasons anything was left out, so the modal can say so
   rather than dropping files on the floor. */
export async function readTextFiles(fileList) {
  const files = Array.from(fileList || []);
  const docs = [];
  const skipped = [];

  for (const file of files.slice(0, MAX_FILES)) {
    if (!isProbablyText(file)) {
      skipped.push({ name: file.name, reason: 'not a text file' });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push({ name: file.name, reason: 'larger than 1 MB' });
      continue;
    }
    try {
      const text = await file.text();
      if (!normalize(text)) {
        skipped.push({ name: file.name, reason: 'empty' });
        continue;
      }
      docs.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        title: titleFromFilename(file.name),
        text,
        size: file.size,
      });
    } catch {
      skipped.push({ name: file.name, reason: 'could not be read' });
    }
  }

  if (files.length > MAX_FILES) {
    skipped.push({ name: `${files.length - MAX_FILES} more file(s)`, reason: `over the ${MAX_FILES}-file limit` });
  }

  return { docs, skipped };
}
