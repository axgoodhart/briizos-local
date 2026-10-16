/**
 * Islands AI helpers — auto tags for project cards and the File Hunter search.
 * Both run on the "Background helpers" model route.
 */
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { execFile } = require('child_process');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { logger } = require('./logger');
const { createChatModel, getRoutingModel } = require('./agent/models');
const { isIgnored } = require('./island-ignore');
const islandFs = require('./island-fs');

// ==== AUTO TAG ====
const TAG_TARGET = 12;
const READ_LINE_BUDGET = 200;          // non-empty lines across all files, per project
const READ_FILES_PREFERRED = 2;
const READ_FILES_MAX = 3;
const THIRD_FILE_BELOW_LINES = 80;     // only read a third file when the first two were this thin
const READ_LINE_CHARS = 240;
const READ_CHUNK_BYTES = 64 * 1024;
const READ_MAX_FILE_BYTES = 5 * 1024 * 1024;
const TAG_MAX_CHARS = 32;

// ==== FILE HUNTER ====
const AI_TIMEOUT_MS = 45000;
const SPOTLIGHT_TIMEOUT_MS = 20000;
const SPOTLIGHT_MAX_PATHS = 4000;
const STAT_MAX = 2500;
const SINGLE_POOL = 40;
const TOP_POOL = 60;
const TOP_COUNT = 10;
const EXHAUSTIVE_CAP = 300;

const READABLE_EXTS = new Set([
  'md', 'markdown', 'txt', 'text', 'csv', 'tsv', 'json', 'yaml', 'yml', 'toml', 'ini', 'xml', 'html', 'htm',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'css', 'scss', 'less', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h',
  'hpp', 'go', 'rs', 'swift', 'kt', 'sql', 'sh', 'bash', 'zsh', 'log', 'srt', 'vtt', 'tex', 'org',
]);
const PROSE_EXTS = new Set(['md', 'markdown', 'txt', 'text', 'org', 'tex']);
const OVERVIEW_NAME = /readme|brief|overview|about|notes|spec|plan|summary|outline|proposal|intro|todo/i;
const GENERIC_TAGS = new Set(['file', 'files', 'project', 'projects', 'misc', 'stuff', 'documents', 'document', 'folder', 'untitled', 'other', 'new', 'final', 'draft']);

const MAIL_EXTS = ['eml', 'emlx', 'msg', 'mbox'];
const BOOK_EXTS = ['epub', 'mobi', 'azw', 'azw3', 'djvu', 'ibooks', 'fb2'];
const KINDS = {
  docs: { label: 'Docs and Code', groups: ['document', 'spreadsheet', 'slides', 'code', 'data'], spotlight: ['public.text', 'public.composite-content', 'public.spreadsheet', 'public.presentation', 'public.source-code', 'public.database'] },
  media: { label: 'Image and Video', groups: ['image', 'video', 'audio', 'design'], spotlight: ['public.image', 'public.movie', 'public.audio', 'public.audiovisual-content'] },
  mail: { label: 'Emails and Texts', exts: MAIL_EXTS, spotlight: ['com.apple.mail.emlx', 'public.email-message'] },
  books: { label: 'PDF and ebooks', groups: ['pdf'], exts: BOOK_EXTS, spotlight: ['com.adobe.pdf', 'org.idpf.epub-container', 'org.idpf.epub-folder'] },
  folders: { label: 'Folders', spotlight: ['public.folder'] },
};
const DATE_RANGES = {
  any: { label: 'any time' },
  day: { label: 'the past day', days: 1 },
  week: { label: 'the past week', days: 7 },
  month: { label: 'the past month', days: 31 },
  quarter: { label: 'the past 3 months', days: 92 },
  year: { label: 'the past year', days: 366 },
  older: { label: 'more than a year ago', olderThanDays: 366 },
};
const MODES = { single: 'Single', top: 'Top Hits', all: 'Exhaustive' };

// ── Shared model plumbing ──────────────────────────────────────────

function modelLabel() {
  return getRoutingModel('background') || 'the app default model';
}

function messageText(response) {
  const raw = response?.content;
  if (Array.isArray(raw)) return raw.map((p) => (typeof p === 'string' ? p : p?.text || '')).join(' ');
  return String(raw || '');
}

function parseJson(text) {
  const clean = String(text || '').replace(/```(?:json)?/gi, '').trim();
  const start = clean.search(/[[{]/);
  if (start === -1) return null;
  const open = clean[start];
  const end = clean.lastIndexOf(open === '{' ? '}' : ']');
  if (end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function askModel(system, user, purpose) {
  const model = createChatModel({ name: getRoutingModel('background'), thinkingEnabled: false });
  let timer = null;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`The AI model did not answer within ${AI_TIMEOUT_MS / 1000} seconds (${purpose})`)), AI_TIMEOUT_MS);
  });
  try {
    const response = await Promise.race([model.invoke([new SystemMessage(system), new HumanMessage(user)]), deadline]);
    return messageText(response);
  } finally {
    clearTimeout(timer);
  }
}

function friendlyAiProblem(error) {
  const message = error?.message || 'Unknown problem';
  if (/Codex Subscription/i.test(message)) return 'Background helpers are routed to the Codex Subscription, which cannot answer these one-off requests. Pick an OpenAI, Claude or Gemini model for Background helpers in Settings → AI Routing.';
  if (/No encrypted API credential/i.test(message)) return 'The model chosen for Background helpers has no API key saved. Add one in Settings → Model, or route Background helpers to a model that has a key.';
  return message;
}

function homeRelative(p) {
  const home = os.homedir();
  return p.startsWith(home) ? `~${p.slice(home.length)}` : p;
}

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// ── Auto tags ─────────────────────────────────────────────────────

function cleanTag(value) {
  return String(value ?? '').trim().toLowerCase()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, TAG_MAX_CHARS);
}

function scoreReadCandidate(file) {
  const ext = String(file.ext || path.extname(file.name || '').slice(1)).toLowerCase();
  let score = 0;
  if (OVERVIEW_NAME.test(file.name || '')) score += 5;
  if (PROSE_EXTS.has(ext)) score += 3;
  else if (file.typeGroup === 'code') score += 2;
  else score += 1;
  const size = Number(file.size) || 0;
  if (size >= 200 && size <= 200 * 1024) score += 1;
  return score;
}

async function readLeadingLines(filePath, maxLines) {
  const handle = await fs.open(filePath, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > READ_MAX_FILE_BYTES) return null;
    const buffer = Buffer.alloc(Math.min(READ_CHUNK_BYTES, stat.size));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const chunk = buffer.subarray(0, bytesRead);
    if (chunk.subarray(0, 4096).includes(0)) return null; // binary
    return chunk.toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, maxLines)
      .map((line) => line.slice(0, READ_LINE_CHARS));
  } finally {
    await handle.close();
  }
}

async function readProjectExcerpts(files) {
  const candidates = files
    .filter((file) => READABLE_EXTS.has(String(file.ext || '').toLowerCase()) && file.path)
    .sort((a, b) => scoreReadCandidate(b) - scoreReadCandidate(a));
  const excerpts = [];
  const skipped = [];
  let used = 0;
  for (const file of candidates) {
    if (excerpts.length >= READ_FILES_MAX || used >= READ_LINE_BUDGET) break;
    if (excerpts.length >= READ_FILES_PREFERRED && used >= THIRD_FILE_BELOW_LINES) break;
    const remainingSlots = READ_FILES_PREFERRED - excerpts.length;
    const share = remainingSlots > 0 ? Math.floor((READ_LINE_BUDGET - used) / remainingSlots) : READ_LINE_BUDGET - used;
    try {
      const lines = await readLeadingLines(file.path, Math.max(1, share));
      if (!lines || !lines.length) {
        skipped.push({ name: file.name, reason: lines ? 'empty' : 'not plain text or too large' });
        continue;
      }
      excerpts.push({ name: file.name, path: file.path, lines });
      used += lines.length;
    } catch (error) {
      skipped.push({ name: file.name, reason: error.code === 'ENOENT' ? 'missing on disk' : 'could not be opened' });
    }
  }
  return { excerpts, skipped, linesRead: used };
}

async function suggestProjectTags(input = {}) {
  const started = Date.now();
  const existing = (input.tags || []).map(cleanTag).filter(Boolean);
  const rejected = new Set((input.rejected || []).map(cleanTag).filter(Boolean));
  const need = Math.max(0, Math.min(TAG_TARGET, Number(input.need) || TAG_TARGET - existing.length));
  if (!need) return { tags: [], filesRead: [], skipped: [], linesRead: 0, model: modelLabel(), durationMs: 0 };

  const files = Array.isArray(input.files) ? input.files.slice(0, 400) : [];
  const { excerpts, skipped, linesRead } = await readProjectExcerpts(files);

  const fileList = files.slice(0, 80).map((file) => `- ${file.name} (${file.typeGroup || 'file'}${file.path ? `, in ${homeRelative(path.dirname(file.path))}` : ''})`).join('\n');
  const excerptText = excerpts.map((entry) => `### ${entry.name}\n${entry.lines.join('\n')}`).join('\n\n');
  const system = [
    'You add short topical tags to a project card on a personal file board.',
    'Return JSON only: {"tags": ["tag-one", "tag-two"]}.',
    `Return exactly ${need} tags when the material supports it, fewer if it truly does not.`,
    'Each tag: lowercase, 1 to 3 words joined with hyphens, at most 32 characters, no # sign.',
    'Tags describe subject, purpose, medium, client, tool, or audience. Be specific to this project.',
    'Never repeat or rephrase an existing tag. Never use a rejected tag. Avoid generic words like file, project, misc, documents, final, draft.',
  ].join('\n');
  const user = [
    `Project name: ${input.name || 'Untitled Project'}`,
    `Existing tags: ${existing.join(', ') || 'none'}`,
    `Rejected tags (never suggest): ${[...rejected].join(', ') || 'none'}`,
    input.relevance ? `Owner's note on relevance: ${String(input.relevance).slice(0, 600)}` : '',
    (input.milestones || []).length ? `Milestones: ${input.milestones.slice(0, 20).join('; ')}` : '',
    `Files (${files.length} total, first 80 shown):\n${fileList || '- none yet'}`,
    excerptText ? `Opening lines of ${excerpts.length} file${excerpts.length === 1 ? '' : 's'}:\n${excerptText}` : 'No file contents were read.',
  ].filter(Boolean).join('\n\n');

  const text = await askModel(system, user, 'Islands auto tags');
  const parsed = parseJson(text);
  const proposed = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.tags) ? parsed.tags : [];
  const taken = new Set(existing);
  const tags = [];
  for (const raw of proposed) {
    const tag = cleanTag(raw);
    if (!tag || tag.length < 2 || taken.has(tag) || rejected.has(tag) || GENERIC_TAGS.has(tag)) continue;
    taken.add(tag);
    tags.push(tag);
    if (tags.length >= need) break;
  }

  return {
    tags,
    filesRead: excerpts.map((entry) => ({ name: entry.name, path: entry.path, lines: entry.lines.length })),
    skipped,
    linesRead,
    model: modelLabel(),
    durationMs: Date.now() - started,
  };
}

async function runAutoTag(input = {}) {
  const projectName = input.name || 'Untitled Project';
  try {
    const result = await suggestProjectTags(input);
    logger.info('island.autotag', result.tags.length
      ? `Added ${result.tags.length} tag${result.tags.length === 1 ? '' : 's'} to “${projectName}” using ${result.filesRead.length ? `the opening lines of ${result.filesRead.length} file${result.filesRead.length === 1 ? '' : 's'}` : 'its name and file list only'}.`
      : `Looked for new tags for “${projectName}” but the AI found nothing specific enough to add.`, {
      projectId: input.projectId,
      tagsAdded: result.tags,
      filesRead: result.filesRead.map((f) => `${f.name} (${f.lines} lines)`),
      filesSkipped: result.skipped.map((f) => `${f.name}: ${f.reason}`),
      linesRead: `${result.linesRead} of ${READ_LINE_BUDGET} allowed`,
      model: result.model,
      durationMs: result.durationMs,
    });
    return { ok: true, ...result };
  } catch (error) {
    const problem = friendlyAiProblem(error);
    logger.warn('island.autotag', `Could not suggest tags for “${projectName}”. Existing tags are unchanged; it will try again the next time this project's files change or Islands reopens.`, {
      projectId: input.projectId,
      problem,
      model: modelLabel(),
      nextStep: /Settings/.test(problem) ? problem : 'No action needed unless this keeps happening; the Log Panel shows each attempt.',
    });
    return { ok: false, error: problem };
  }
}

// ── File Hunter: plan ─────────────────────────────────────────────

function sanitizeTerm(term) {
  return String(term ?? '').replace(/["\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function plainTerms(text) {
  const stop = new Set(['the', 'and', 'for', 'from', 'with', 'that', 'this', 'files', 'file', 'about', 'some', 'any', 'all', 'find', 'my', 'me', 'of', 'in', 'on', 'to', 'a', 'an', 'or']);
  return [...new Set(String(text || '').toLowerCase().split(/[^a-z0-9]+/g).filter((t) => t.length > 2 && !stop.has(t)))].slice(0, 8);
}

function fallbackPlan(input) {
  const source = input.description || [input.project?.name, ...(input.project?.tags || [])].join(' ');
  return { nameTerms: plainTerms(source), contentTerms: [], extensions: [], minBytes: null, maxBytes: null, modifiedAfter: null, modifiedBefore: null, summary: input.description ? `Files matching “${input.description}”` : `Files related to ${input.project?.name || 'this project'}` };
}

function normalizePlan(raw, input) {
  const list = (value, max) => (Array.isArray(value) ? value : []).map(sanitizeTerm).filter((t) => t.length > 1).slice(0, max);
  const day = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  const bytes = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.round(Number(value)) : null);
  const plan = {
    nameTerms: list(raw?.nameTerms, 8),
    contentTerms: list(raw?.contentTerms, 6),
    extensions: list(raw?.extensions, 12).map((e) => e.toLowerCase().replace(/^\./, '')).filter((e) => /^[a-z0-9]{1,8}$/.test(e)),
    minBytes: bytes(raw?.minBytes),
    maxBytes: bytes(raw?.maxBytes),
    modifiedAfter: day(raw?.modifiedAfter),
    modifiedBefore: day(raw?.modifiedBefore),
    summary: typeof raw?.summary === 'string' ? raw.summary.slice(0, 240) : '',
  };
  if (!plan.nameTerms.length && !plan.contentTerms.length) plan.nameTerms = fallbackPlan(input).nameTerms;
  if (!plan.summary) plan.summary = fallbackPlan(input).summary;
  return plan;
}

async function planSearch(input, kindsOn) {
  const today = isoDay(Date.now());
  const system = [
    'You turn a request for files on a Mac into search rules. Return JSON only with these keys:',
    '{"nameTerms": [words likely in file or folder names], "contentTerms": [distinctive words likely inside the files], "extensions": [file extensions only if the person named a format], "minBytes": number|null, "maxBytes": number|null, "modifiedAfter": "YYYY-MM-DD"|null, "modifiedBefore": "YYYY-MM-DD"|null, "summary": "one plain sentence describing what is being looked for"}',
    'Use at most 8 nameTerms and 6 contentTerms. Prefer single words or short fragments that would appear verbatim. Include spelling variants and abbreviations when useful.',
    `Today is ${today}. Convert relative dates and sizes in the request into the fields above. Leave fields null when the request does not mention them.`,
  ].join('\n');
  const user = [
    input.description
      ? `Request: ${input.description}`
      : `No request was written. Find files that belong with this project but are not in it yet.`,
    `Project: ${input.project?.name || 'Untitled Project'}`,
    `Project tags: ${(input.project?.tags || []).join(', ') || 'none'}`,
    `Some files already in the project: ${(input.project?.fileNames || []).slice(0, 25).join(', ') || 'none'}`,
    `Kinds of files wanted: ${kindsOn.map((k) => KINDS[k].label).join(', ')}`,
    `Search mode: ${MODES[input.mode]}`,
  ].join('\n');
  return normalizePlan(parseJson(await askModel(system, user, 'File Hunter planning')), input);
}

// ── File Hunter: search ───────────────────────────────────────────

function searchDirs(input, kindsOn) {
  const dirs = Array.isArray(input.customDirs) && input.customDirs.length ? input.customDirs : islandFs.hunterDefaultDirs();
  const extra = kindsOn.includes('mail') ? [path.join(os.homedir(), 'Library', 'Mail')] : [];
  return [...new Set([...dirs, ...extra])];
}

function dateWindow(input, plan) {
  const range = DATE_RANGES[input.dateRange] || DATE_RANGES.any;
  const now = Date.now();
  if (range.days) return { after: now - range.days * 86400000, before: null, source: 'tray' };
  if (range.olderThanDays) return { after: null, before: now - range.olderThanDays * 86400000, source: 'tray' };
  const after = plan.modifiedAfter ? Date.parse(`${plan.modifiedAfter}T00:00:00`) : null;
  const before = plan.modifiedBefore ? Date.parse(`${plan.modifiedBefore}T23:59:59`) : null;
  return { after: Number.isFinite(after) ? after : null, before: Number.isFinite(before) ? before : null, source: after || before ? 'description' : 'none' };
}

function spotlightQuery(plan, kindsOn, timeSpan) {
  const parts = [];
  const terms = [
    ...plan.nameTerms.map((t) => `kMDItemFSName == "*${t}*"cd`),
    ...plan.contentTerms.map((t) => `kMDItemTextContent == "${t}*"cdw`),
  ];
  if (terms.length) parts.push(`(${terms.join(' || ')})`);
  const types = [...new Set(kindsOn.flatMap((k) => KINDS[k].spotlight))];
  const extClauses = kindsOn.flatMap((k) => KINDS[k].exts || []).map((e) => `kMDItemFSName == "*.${e}"c`);
  parts.push(`(${[...types.map((t) => `kMDItemContentTypeTree == "${t}"`), ...extClauses].join(' || ')})`);
  if (plan.extensions.length) parts.push(`(${plan.extensions.map((e) => `kMDItemFSName == "*.${e}"c`).join(' || ')})`);
  if (plan.minBytes) parts.push(`kMDItemFSSize >= ${plan.minBytes}`);
  if (plan.maxBytes) parts.push(`kMDItemFSSize <= ${plan.maxBytes}`);
  if (timeSpan.after) parts.push(`kMDItemFSContentChangeDate >= $time.iso(${new Date(timeSpan.after).toISOString().replace(/\.\d{3}Z$/, 'Z')})`);
  if (timeSpan.before) parts.push(`kMDItemFSContentChangeDate <= $time.iso(${new Date(timeSpan.before).toISOString().replace(/\.\d{3}Z$/, 'Z')})`);
  return parts.join(' && ');
}

function mdfind(dir, query) {
  return new Promise((resolve, reject) => {
    execFile('/usr/bin/mdfind', ['-onlyin', dir, query], { timeout: SPOTLIGHT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 }, (error, stdout) => {
      if (error && !stdout) return reject(error);
      resolve(String(stdout || '').split('\n').filter(Boolean));
    });
  });
}

function insideIgnoredPath(filePath, roots) {
  const root = roots.find((r) => filePath === r || filePath.startsWith(`${r}${path.sep}`));
  const rel = root ? path.relative(root, filePath) : filePath;
  const segments = rel.split(path.sep).filter(Boolean);
  return segments.some((segment, index) => segment.startsWith('.') || isIgnored(segment, index < segments.length - 1));
}

function kindOf(record) {
  if (record.isFolder) return 'folders';
  if (MAIL_EXTS.includes(record.ext)) return 'mail';
  if (BOOK_EXTS.includes(record.ext) || record.typeGroup === 'pdf') return 'books';
  if (KINDS.docs.groups.includes(record.typeGroup)) return 'docs';
  if (KINDS.media.groups.includes(record.typeGroup)) return 'media';
  return null;
}

async function statRecords(paths) {
  const records = [];
  for (let i = 0; i < paths.length; i += 64) {
    const batch = await Promise.all(paths.slice(i, i + 64).map(async (p) => {
      try {
        const stat = await fs.stat(p);
        const record = islandFs.buildFileRecord(p, stat, path.basename(path.dirname(p)));
        if (stat.isDirectory()) Object.assign(record, { isFolder: true, typeGroup: 'folder', ext: '', previewable: false });
        return record;
      } catch {
        return null;
      }
    }));
    records.push(...batch.filter(Boolean));
  }
  return records;
}

function localScore(record, plan, viaContent) {
  const name = record.name.toLowerCase();
  const stem = path.basename(name, path.extname(name));
  const parent = path.basename(path.dirname(record.path)).toLowerCase();
  let score = 0;
  for (const raw of plan.nameTerms) {
    const t = raw.toLowerCase();
    if (stem === t) score += 8;
    else if (stem.includes(t)) score += 5;
    else if (name.includes(t)) score += 3;
    if (parent.includes(t)) score += 1;
  }
  if (!score && viaContent) score += 2; // Spotlight matched it on contents
  const ageDays = (Date.now() - Date.parse(record.modifiedAt)) / 86400000;
  if (ageDays < 30) score += 2;
  else if (ageDays < 180) score += 1;
  return score;
}

async function findCandidates(input, plan, kindsOn, timeSpan, progress) {
  const dirs = searchDirs(input, kindsOn);
  const exclude = new Set((input.excludePaths || []).map((p) => path.resolve(p)));
  let engine = 'spotlight';
  let paths = [];
  const query = spotlightQuery(plan, kindsOn, timeSpan);
  const outcomes = await Promise.allSettled(dirs.map((dir) => mdfind(dir, query)));
  const failures = outcomes.filter((o) => o.status === 'rejected');
  outcomes.forEach((o) => { if (o.status === 'fulfilled') paths.push(...o.value); });
  paths = [...new Set(paths)].slice(0, SPOTLIGHT_MAX_PATHS);

  let records = [];
  if (failures.length === outcomes.length || !paths.length) {
    engine = 'folder-walk';
    progress('searching', failures.length === outcomes.length
      ? 'Spotlight is unavailable, so searching folders by file name instead…'
      : 'Spotlight found nothing, so checking folders by file name too…');
    const groups = [...new Set(kindsOn.flatMap((k) => KINDS[k].groups || []))];
    records = await islandFs.huntFiles({
      keywords: plan.nameTerms,
      query: plan.nameTerms.join(' '),
      types: groups.length ? groups : null,
      excludePaths: [...exclude],
      customDirs: dirs,
      limit: 400,
    });
  } else {
    progress('checking', `Spotlight found ${paths.length} possible match${paths.length === 1 ? '' : 'es'}; checking each one…`);
    const kept = paths
      .map((p) => path.resolve(p))
      .filter((p) => !exclude.has(p) && !insideIgnoredPath(p, dirs))
      .slice(0, STAT_MAX);
    records = await statRecords(kept);
  }

  const filtered = records.filter((record) => {
    const kind = kindOf(record);
    if (!kind || !kindsOn.includes(kind)) return false;
    if (exclude.has(path.resolve(record.path))) return false;
    const mtime = Date.parse(record.modifiedAt);
    if (timeSpan.after && mtime < timeSpan.after) return false;
    if (timeSpan.before && mtime > timeSpan.before) return false;
    if (!record.isFolder && plan.minBytes && record.size < plan.minBytes) return false;
    if (!record.isFolder && plan.maxBytes && record.size > plan.maxBytes) return false;
    if (!record.isFolder && plan.extensions.length && !plan.extensions.includes(record.ext)) return false;
    return true;
  });
  filtered.forEach((record) => { record.score = localScore(record, plan, engine === 'spotlight'); });
  filtered.sort((a, b) => b.score - a.score || String(b.modifiedAt).localeCompare(String(a.modifiedAt)));
  return { records: filtered, engine, dirs, spotlightFailures: failures.length, rawCount: engine === 'spotlight' ? paths.length : records.length, query };
}

// ── File Hunter: rank ─────────────────────────────────────────────

async function rankCandidates(input, plan, pool, mode) {
  const lines = pool.map((r, i) => `${i}. ${r.name} | in ${homeRelative(path.dirname(r.path))} | ${r.isFolder ? 'folder' : `${Math.max(1, Math.round(r.size / 1024))} KB`} | modified ${r.modifiedAt.slice(0, 10)}`);
  const count = mode === 'single' ? 1 : TOP_COUNT;
  const system = [
    'You pick the files that best match what a person is looking for, from a numbered list of candidates found on their Mac.',
    'Return JSON only: {"picks": [{"index": number, "reason": "under 15 words, plain language"}]}.',
    `Pick at most ${count}, best first. Leave out anything that does not plausibly match. Return an empty list if nothing fits.`,
  ].join('\n');
  const user = [
    input.description ? `They asked for: ${input.description}` : `They want files that belong with the project “${input.project?.name}” (tags: ${(input.project?.tags || []).join(', ') || 'none'}).`,
    `Search summary: ${plan.summary}`,
    `Candidates:\n${lines.join('\n')}`,
  ].join('\n\n');
  const parsed = parseJson(await askModel(system, user, 'File Hunter ranking'));
  const picks = Array.isArray(parsed?.picks) ? parsed.picks : Array.isArray(parsed) ? parsed : [];
  const seen = new Set();
  const chosen = [];
  for (const pick of picks) {
    const index = Number(pick?.index);
    if (!Number.isInteger(index) || index < 0 || index >= pool.length || seen.has(index)) continue;
    seen.add(index);
    chosen.push({ ...pool[index], reason: typeof pick.reason === 'string' ? pick.reason.slice(0, 160) : '' });
    if (chosen.length >= count) break;
  }
  return chosen;
}

// ── File Hunter: entry point ──────────────────────────────────────

async function runHunt(input = {}, sendProgress = () => {}) {
  const started = Date.now();
  const runId = String(input.runId || '');
  const mode = MODES[input.mode] ? input.mode : 'top';
  const description = String(input.description || '').trim().slice(0, 2000);
  const kindsOn = Object.keys(KINDS).filter((k) => input.kinds?.[k]);
  const projectName = input.project?.name || 'Untitled Project';
  const progress = (stage, message) => sendProgress({ runId, stage, message });
  const job = { ...input, mode, description };

  if (mode === 'single' && !description) return { ok: false, runId, error: 'Single file searches need a description of the file.' };
  if (!kindsOn.length) return { ok: false, runId, error: 'Turn on at least one kind of file to search for.' };

  logger.info('island.hunter', `File Hunter started a ${MODES[mode]} search for “${projectName}”.`, {
    runId,
    description: description || '(none — looking for files related to the project)',
    kinds: kindsOn.map((k) => KINDS[k].label),
    dateRange: (DATE_RANGES[input.dateRange] || DATE_RANGES.any).label,
  });

  const ai = { planned: false, ranked: false, model: modelLabel(), notes: [] };
  let plan;
  progress('planning', description ? 'Asking the AI to turn your description into search rules…' : 'Asking the AI what files would belong with this project…');
  try {
    plan = await planSearch(job, kindsOn);
    ai.planned = true;
  } catch (error) {
    plan = fallbackPlan(job);
    ai.notes.push(`Planning fell back to plain word matching: ${friendlyAiProblem(error)}`);
  }

  const timeSpan = dateWindow(job, plan);
  progress('searching', 'Searching your Mac with Spotlight…');
  let found;
  try {
    found = await findCandidates(job, plan, kindsOn, timeSpan, progress);
  } catch (error) {
    logger.error('island.hunter', `File Hunter could not search the filesystem for “${projectName}”. Nothing was added to the project.`, {
      runId,
      problem: error.message,
      nextStep: 'Try again; if it keeps failing, check that the search folders still exist.',
    });
    return { ok: false, runId, error: `The filesystem search failed: ${error.message}` };
  }

  let results;
  if (mode === 'all' || !found.records.length) {
    results = found.records.slice(0, EXHAUSTIVE_CAP);
  } else {
    const pool = found.records.slice(0, mode === 'single' ? SINGLE_POOL : TOP_POOL);
    progress('ranking', `Asking the AI to pick the best of ${pool.length} candidate${pool.length === 1 ? '' : 's'}…`);
    try {
      results = await rankCandidates(job, plan, pool, mode);
      ai.ranked = true;
    } catch (error) {
      results = pool.slice(0, mode === 'single' ? 1 : TOP_COUNT);
      ai.notes.push(`Ranking fell back to name matching and recency: ${friendlyAiProblem(error)}`);
    }
  }

  const payload = results.map((r) => ({
    name: r.name,
    path: r.path,
    ext: r.ext,
    size: r.size,
    modifiedAt: r.modifiedAt,
    typeGroup: r.typeGroup,
    previewable: r.previewable,
    isFolder: !!r.isFolder,
    reason: r.reason || '',
  }));

  const durationMs = Date.now() - started;
  logger.info('island.hunter', `File Hunter finished: ${payload.length} result${payload.length === 1 ? '' : 's'} for “${projectName}” are waiting in the island's File Hunter panel and journal. Nothing is added to the project until you add it there.`, {
    runId,
    mode: MODES[mode],
    engine: found.engine === 'spotlight' ? 'Spotlight index' : 'Folder walk (file names only)',
    searchedFolders: found.dirs.map(homeRelative),
    candidatesFound: found.rawCount,
    candidatesMatchingFilters: found.records.length,
    results: payload.length,
    truncated: mode === 'all' && found.records.length > EXHAUSTIVE_CAP ? `Showing the first ${EXHAUSTIVE_CAP} of ${found.records.length}` : undefined,
    aiPlanned: ai.planned,
    aiRanked: ai.ranked,
    aiNotes: ai.notes.length ? ai.notes : undefined,
    nameTerms: plan.nameTerms,
    contentTerms: plan.contentTerms,
    dateWindow: timeSpan.source === 'none' ? 'any' : `${timeSpan.after ? `after ${isoDay(timeSpan.after)}` : ''}${timeSpan.before ? ` before ${isoDay(timeSpan.before)}` : ''}`.trim(),
    durationMs,
  });

  return {
    ok: true,
    runId,
    results: payload,
    summary: plan.summary,
    engine: found.engine,
    totalMatches: found.records.length,
    truncated: mode === 'all' && found.records.length > EXHAUSTIVE_CAP,
    ai,
    durationMs,
  };
}

module.exports = { runAutoTag, runHunt, TAG_TARGET };
