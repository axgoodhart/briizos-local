const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');

// ==== LIMITS ====
const MAX_SAMPLE_CHARS = 400000;   // one sample's text
const MAX_GUIDE_CHARS = 200000;    // the guide or one addendum
const MAX_PIECE_CHARS = 400000;    // a request, draft or review
const MAX_LABEL = 300;
const MAX_FORM = 40;
const MAX_RUNS = 60;

const FORM_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u;

const now = () => Date.now();
const parse = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const words = (text) => (String(text || '').match(/[\p{L}\p{N}]+/gu) || []).length;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function text(value, label, max, { required = false } = {}) {
  if (value == null) { if (required) fail('INVALID_INPUT', `${label} is required.`); return ''; }
  if (typeof value !== 'string') fail('INVALID_INPUT', `${label} must be text.`);
  if (value.length > max) fail('INVALID_INPUT', `${label} is longer than ${max.toLocaleString()} characters.`);
  if (required && !value.trim()) fail('INVALID_INPUT', `${label} is required.`);
  return value;
}

function form(value) {
  const cleaned = String(value || 'all').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!cleaned) return 'all';
  if (cleaned.length > MAX_FORM || !FORM_RE.test(cleaned)) fail('INVALID_INPUT', 'A form name uses letters, numbers, spaces or dashes, up to 40 characters.');
  return cleaned;
}

function jsonText(value, label, max) {
  let out;
  try { out = JSON.stringify(value ?? {}); } catch { fail('INVALID_INPUT', `${label} is not storable.`); }
  if (out === undefined || out.length > max) fail('INVALID_INPUT', `${label} is too large.`);
  return out;
}

const guideRow = (r) => r && ({
  id: r.id, name: r.name, text: r.guide_text, addenda: parse(r.addenda_json, {}), measurements: parse(r.measurements_json, {}),
  measuredAt: r.measured_at, writtenAt: r.written_at, editedAt: r.edited_at, createdAt: r.created_at, updatedAt: r.updated_at, revision: r.revision,
});
const sampleRow = (r) => r && ({
  id: r.id, guideId: r.guide_id, label: r.label, form: r.form, origin: r.origin, filePath: r.file_path, fileKind: r.file_kind,
  text: r.body_text, wordCount: r.word_count, truncated: !!r.truncated, createdAt: r.created_at, updatedAt: r.updated_at,
});
const pieceRow = (r) => r && ({
  id: r.id, guideId: r.guide_id, guideRevision: r.guide_revision, title: r.title, request: r.request_text, form: r.form,
  phrasings: parse(r.phrasings_json, []), quotes: parse(r.quotes_json, []), draft: r.draft_text, review: r.review_text, chosen: r.chosen,
  drift: parse(r.drift_json, {}), stage: r.stage, createdAt: r.created_at, updatedAt: r.updated_at, revision: r.revision,
});
const runRow = (r) => r && ({
  id: r.id, pieceId: r.piece_id, guideId: r.guide_id, stage: r.stage, modelName: r.model_name, status: r.status,
  input: parse(r.input_json, {}), result: parse(r.result_json, {}), error: r.error_text, agentThreadId: r.agent_thread_id, agentTurnId: r.agent_turn_id, createdAt: r.created_at,
});

class StylofactStore extends EventEmitter {
  constructor(service, logger) { super(); this.service = service; this.db = service.db; this.logger = logger; }

  announce(kind, detail = {}) { this.emit('changed', { kind, ...detail }); }

  // ---- guide -------------------------------------------------------------
  guide() {
    const row = this.db.prepare('SELECT * FROM stylofact_guides WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1').get();
    if (row) return guideRow(row);
    const timestamp = now();
    const id = randomUUID();
    this.db.prepare('INSERT INTO stylofact_guides (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, 'Your voice', timestamp, timestamp);
    this.logger.info('stylofact', 'A blank style guide was created in local storage. Add writing samples, then have the guide written.', { guideId: id });
    return guideRow(this.db.prepare('SELECT * FROM stylofact_guides WHERE id = ?').get(id));
  }

  requireGuide(guideId, expectedRevision) {
    const row = this.db.prepare('SELECT * FROM stylofact_guides WHERE id = ? AND deleted_at IS NULL').get(guideId);
    if (!row) fail('NOT_FOUND', 'That style guide no longer exists.');
    if (expectedRevision != null && row.revision !== expectedRevision) fail('REVISION_CONFLICT', 'The guide changed elsewhere. Reload and try again.');
    return row;
  }

  // patch: { name?, text?, addenda?, measurements?, reason: 'ai' | 'edit' | 'measure' }
  saveGuide(guideId, expectedRevision, patch = {}) {
    const current = this.requireGuide(guideId, expectedRevision);
    const timestamp = now();
    const name = patch.name === undefined ? current.name : text(patch.name, 'Guide name', MAX_LABEL, { required: true }).trim();
    const guideText = patch.text === undefined ? current.guide_text : text(patch.text, 'Guide text', MAX_GUIDE_CHARS);
    let addendaJson = current.addenda_json;
    if (patch.addenda !== undefined) {
      if (!patch.addenda || typeof patch.addenda !== 'object' || Array.isArray(patch.addenda)) fail('INVALID_INPUT', 'Addenda must map a form name to text.');
      const cleaned = {};
      for (const [key, value] of Object.entries(patch.addenda)) {
        const formName = form(key);
        if (formName === 'all') continue;
        const body = text(value, `Addendum for ${formName}`, MAX_GUIDE_CHARS);
        if (body.trim()) cleaned[formName] = body;
      }
      addendaJson = jsonText(cleaned, 'Addenda', MAX_GUIDE_CHARS * 8);
    }
    const measurementsJson = patch.measurements === undefined ? current.measurements_json : jsonText(patch.measurements, 'Measurements', 2000000);
    const stamps = {
      measured_at: patch.measurements !== undefined ? timestamp : current.measured_at,
      written_at: patch.reason === 'ai' && patch.text !== undefined ? timestamp : current.written_at,
      edited_at: patch.reason === 'edit' && (patch.text !== undefined || patch.addenda !== undefined) ? timestamp : current.edited_at,
    };
    this.db.prepare(`
      UPDATE stylofact_guides SET name = ?, guide_text = ?, addenda_json = ?, measurements_json = ?,
        measured_at = ?, written_at = ?, edited_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
    `).run(name, guideText, addendaJson, measurementsJson, stamps.measured_at, stamps.written_at, stamps.edited_at, timestamp, guideId);
    const saved = guideRow(this.db.prepare('SELECT * FROM stylofact_guides WHERE id = ?').get(guideId));
    this.logger.info('stylofact', patch.reason === 'ai' ? 'The style guide written by the AI was saved.'
      : patch.reason === 'measure' ? 'Fresh measurements of the writing samples were saved to the guide.'
        : 'The style guide was edited by hand and saved. Hand edits are never overwritten by the AI.', {
      guideId, revision: saved.revision, guideCharacters: saved.text.length, addenda: Object.keys(saved.addenda), reason: patch.reason || 'edit',
    });
    this.announce('guide', { guideId });
    return saved;
  }

  // ---- samples -----------------------------------------------------------
  samples(guideId) {
    return this.db.prepare('SELECT * FROM stylofact_samples WHERE guide_id = ? AND deleted_at IS NULL ORDER BY created_at, id').all(guideId).map(sampleRow);
  }

  addSample(guideId, input = {}) {
    this.requireGuide(guideId);
    const body = text(input.text, 'Sample text', MAX_SAMPLE_CHARS, { required: true });
    const origin = input.origin === 'file' ? 'file' : 'paste';
    const label = text(input.label, 'Sample name', MAX_LABEL).trim() || (origin === 'file' ? 'Sample file' : 'Pasted sample');
    const sampleForm = form(input.form);
    const timestamp = now();
    const id = randomUUID();
    const count = words(body);
    this.db.prepare(`
      INSERT INTO stylofact_samples (id, guide_id, label, form, origin, file_path, file_kind, body_text, word_count, truncated, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guideId, label, sampleForm, origin, input.filePath ? String(input.filePath).slice(0, 2000) : null, input.fileKind ? String(input.fileKind).slice(0, 40) : null,
      body, count, input.truncated ? 1 : 0, timestamp, timestamp);
    this.logger.info('stylofact.samples', `A writing sample was added to the style guide: “${label}”.`, {
      sampleId: id, guideId, words: count, form: sampleForm, origin, filePath: input.filePath || null, truncated: !!input.truncated,
    });
    this.announce('samples', { guideId });
    return sampleRow(this.db.prepare('SELECT * FROM stylofact_samples WHERE id = ?').get(id));
  }

  updateSample(sampleId, patch = {}) {
    const current = this.db.prepare('SELECT * FROM stylofact_samples WHERE id = ? AND deleted_at IS NULL').get(sampleId);
    if (!current) fail('NOT_FOUND', 'That sample no longer exists.');
    const label = patch.label === undefined ? current.label : text(patch.label, 'Sample name', MAX_LABEL, { required: true }).trim();
    const sampleForm = patch.form === undefined ? current.form : form(patch.form);
    this.db.prepare('UPDATE stylofact_samples SET label = ?, form = ?, updated_at = ? WHERE id = ?').run(label, sampleForm, now(), sampleId);
    this.logger.info('stylofact.samples', `The sample “${label}” now counts toward ${sampleForm === 'all' ? 'all writing' : `the ${sampleForm} form only`}.`, { sampleId, form: sampleForm });
    this.announce('samples', { guideId: current.guide_id });
    return sampleRow(this.db.prepare('SELECT * FROM stylofact_samples WHERE id = ?').get(sampleId));
  }

  removeSample(sampleId) {
    const current = this.db.prepare('SELECT * FROM stylofact_samples WHERE id = ? AND deleted_at IS NULL').get(sampleId);
    if (!current) return { removed: false };
    this.db.prepare('UPDATE stylofact_samples SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), sampleId);
    this.logger.info('stylofact.samples', `The sample “${current.label}” was removed from the style guide. The guide text itself was not changed.`, { sampleId, guideId: current.guide_id });
    this.announce('samples', { guideId: current.guide_id });
    return { removed: true };
  }

  // ---- pieces ------------------------------------------------------------
  pieces() {
    return this.db.prepare('SELECT * FROM stylofact_pieces WHERE deleted_at IS NULL ORDER BY updated_at DESC, id').all().map(pieceRow);
  }

  piece(pieceId) {
    const row = this.db.prepare('SELECT * FROM stylofact_pieces WHERE id = ? AND deleted_at IS NULL').get(pieceId);
    if (!row) fail('NOT_FOUND', 'That piece no longer exists.');
    return pieceRow(row);
  }

  createPiece(input = {}) {
    const guide = this.guide();
    const timestamp = now();
    const id = randomUUID();
    const request = text(input.request, 'Request', MAX_PIECE_CHARS);
    const title = text(input.title, 'Title', MAX_LABEL).trim() || request.trim().slice(0, 80) || 'Untitled piece';
    this.db.prepare(`
      INSERT INTO stylofact_pieces (id, guide_id, guide_revision, title, request_text, form, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, guide.id, guide.revision, title, request, form(input.form), timestamp, timestamp);
    this.logger.info('stylofact', `A new piece was started: “${title}”.`, { pieceId: id, guideRevision: guide.revision, form: form(input.form) });
    this.announce('pieces', { pieceId: id });
    return this.piece(id);
  }

  updatePiece(pieceId, expectedRevision, patch = {}) {
    const current = this.db.prepare('SELECT * FROM stylofact_pieces WHERE id = ? AND deleted_at IS NULL').get(pieceId);
    if (!current) fail('NOT_FOUND', 'That piece no longer exists.');
    if (expectedRevision != null && current.revision !== expectedRevision) fail('REVISION_CONFLICT', 'The piece changed elsewhere. Reload and try again.');
    const next = {
      title: patch.title === undefined ? current.title : text(patch.title, 'Title', MAX_LABEL).trim() || current.title,
      request_text: patch.request === undefined ? current.request_text : text(patch.request, 'Request', MAX_PIECE_CHARS),
      form: patch.form === undefined ? current.form : form(patch.form),
      phrasings_json: patch.phrasings === undefined ? current.phrasings_json : jsonText(Array.isArray(patch.phrasings) ? patch.phrasings.slice(0, 40) : [], 'Phrasings', 20000),
      quotes_json: patch.quotes === undefined ? current.quotes_json : jsonText(Array.isArray(patch.quotes) ? patch.quotes.slice(0, 200) : [], 'Quotes', 2000000),
      draft_text: patch.draft === undefined ? current.draft_text : text(patch.draft, 'Draft', MAX_PIECE_CHARS),
      review_text: patch.review === undefined ? current.review_text : text(patch.review, 'Review', MAX_PIECE_CHARS),
      chosen: patch.chosen === undefined ? current.chosen : (patch.chosen === 'review' ? 'review' : 'draft'),
      drift_json: patch.drift === undefined ? current.drift_json : jsonText(patch.drift, 'Drift', 2000000),
      stage: patch.stage === undefined ? current.stage : (['find', 'choose', 'write', 'done'].includes(patch.stage) ? patch.stage : current.stage),
      guide_revision: patch.guideRevision === undefined ? current.guide_revision : Number(patch.guideRevision) || current.guide_revision,
    };
    this.db.prepare(`
      UPDATE stylofact_pieces SET title = ?, request_text = ?, form = ?, phrasings_json = ?, quotes_json = ?, draft_text = ?, review_text = ?,
        chosen = ?, drift_json = ?, stage = ?, guide_revision = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
    `).run(next.title, next.request_text, next.form, next.phrasings_json, next.quotes_json, next.draft_text, next.review_text,
      next.chosen, next.drift_json, next.stage, next.guide_revision, now(), pieceId);
    this.announce('pieces', { pieceId });
    return this.piece(pieceId);
  }

  archivePiece(pieceId) {
    const current = this.db.prepare('SELECT * FROM stylofact_pieces WHERE id = ? AND deleted_at IS NULL').get(pieceId);
    if (!current) return { removed: false };
    this.db.prepare('UPDATE stylofact_pieces SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), pieceId);
    this.logger.info('stylofact', `The piece “${current.title}” was put away. Its draft stays in local storage.`, { pieceId });
    this.announce('pieces', { pieceId });
    return { removed: true };
  }

  // ---- runs --------------------------------------------------------------
  recordRun(input = {}) {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO stylofact_piece_runs (id, piece_id, guide_id, stage, model_name, status, input_json, result_json, error_text, agent_thread_id, agent_turn_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.pieceId || null, input.guideId || null, text(input.stage, 'Stage', 40, { required: true }), input.modelName ? String(input.modelName).slice(0, 200) : null,
      input.status === 'failed' ? 'failed' : 'completed', jsonText(input.input || {}, 'Run input', 200000), jsonText(input.result || {}, 'Run result', 200000),
      input.error ? String(input.error).slice(0, 4000) : null, input.agentThreadId || null, input.agentTurnId || null, now());
    this.announce('runs');
    return runRow(this.db.prepare('SELECT * FROM stylofact_piece_runs WHERE id = ?').get(id));
  }

  runs(limit = MAX_RUNS) {
    return this.db.prepare('SELECT * FROM stylofact_piece_runs ORDER BY created_at DESC LIMIT ?').all(Math.max(1, Math.min(MAX_RUNS, limit))).map(runRow);
  }

  snapshot() {
    const guide = this.guide();
    return { guide, samples: this.samples(guide.id), pieces: this.pieces(), runs: this.runs() };
  }
}

module.exports = { StylofactStore };
