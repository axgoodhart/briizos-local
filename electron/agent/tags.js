/**
 * Thread tag generation.
 *
 * Shape parity with ./title.js — a post-model hook registered in lead-agent.js
 * immediately after the title hook, returning `{ tags }` into ThreadState.
 *
 * Contract: docs/conversation-browser-design.md §4. Five gates run before any
 * model call, so a greeting costs nothing; the model may add at most
 * MAX_NEW_TAGS_PER_EVALUATION tags per run; a conversation that reaches
 * MAX_TAGS_PER_THREAD is left alone from then on.
 *
 * Normalisation and the generic banlist are deliberately imported from
 * local-data-service rather than restated here: if the agent and the storage
 * layer ever disagreed about what a tag *is*, the model would keep proposing
 * tags the database would keep rejecting, and the checkpoint bookkeeping would
 * quietly burn evaluations. One definition, one behaviour.
 */

const { logger } = require('../logger');
const { createChatModel, getRoutingModel } = require('./models');
const { filterMessagesForMemory, formatConversationForUpdate } = require('./memory');
// The shape and volume limits of a tag are the database's to define, so they
// are imported rather than restated. Restating MAX_TAGS_PER_THREAD here is the
// exact failure this module's header warns about: the cap the model stops at
// and the cap the database enforces would be two numbers that only happen to
// agree today.
const {
  normalizeThreadTag,
  GENERIC_TAG_BANLIST,
  MAX_TAGS_PER_THREAD,
  MAX_NEW_TAGS_PER_EVALUATION,
  MAX_TAG_WORDS,
  MAX_TAG_LENGTH: MAX_TAG_CHARS,
} = require('../local-data-service');

// Gate constants that are this module's alone — they describe when to look,
// not what a tag may be, so the database has no opinion about them.
const EVALUATION_CHECKPOINTS = [2, 4, 8, 16, 32];
const MIN_USER_CHARS = 120;
const MIN_CONTENT_WORDS = 12;

// G4's first clause, and the smallest checkpoint: a single question and answer
// is not yet a conversation worth filing.
const MIN_EXCHANGES = 2;
// G5 passes the workspace's most-used tags to the model. Top 40 keeps the
// prompt small while still covering everything the user actually reuses.
const VOCABULARY_LIMIT = 40;

// Greetings, thanks, tests, one-word pings — matched against the whole of the
// user's side of the conversation, so this only fires when the user said
// nothing else.
const SMALLTALK_RE = /^(?:\s*(?:hi|hii+|hey+|hello|hallo|yo|sup|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|night)|thanks?|thank\s+you|thx|ty|cheers|ok|okay|k|kk|cool|nice|great|awesome|perfect|lol|haha+|hmm+|test(?:ing)?|ping|pong|hello\s*\?|you\s+there|are\s+you\s+there|anyone\s+there|yes|yeah|yep|yup|no|nope|nah|sure|please|bye|goodbye|see\s+ya|later|night|gm|gn)[\s!.,?…:;'"-]*)+$/i;

const WORD_RE = /[a-z0-9][a-z0-9'-]*/g;
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'done', 'down', 'during',
  'each', 'even', 'ever', 'few', 'for', 'from', 'further',
  'get', 'got', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'let', 'like', 'me', 'more', 'most', 'much', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'ok', 'okay', 'on', 'once', 'one', 'only', 'or', 'other',
  'our', 'ours', 'out', 'over', 'own',
  'really', 'said', 'same', 'say', 'see', 'she', 'should', 'so', 'some', 'still', 'such', 'sure',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'us', 'use', 'used',
  'very', 'want', 'was', 'we', 'well', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'will', 'with', 'would', 'yes', 'you', 'your', 'yours', 'yourself',
]);

const DEFAULT_PROMPT = `You label conversations for a personal workspace's conversation browser.
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
Example when nothing is specific enough: []`;

let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

function getLocalDataService() {
  return localDataService;
}

function readConfig() {
  return {
    tags: {
      enabled: true,
      max_tags: MAX_TAGS_PER_THREAD,
      max_new: MAX_NEW_TAGS_PER_EVALUATION,
      vocabulary_limit: VOCABULARY_LIMIT,
    },
  };
}

function messageRole(message) {
  if (!message) return 'unknown';
  if (typeof message._getType === 'function') return message._getType();
  if (typeof message.getType === 'function') return message.getType();
  return message.type || message.role || 'unknown';
}

function messageContent(message) {
  const content = message?.content ?? '';
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') return part;
      if (part?.type === 'text') return part.text || '';
      return part?.text || '';
    }).filter(Boolean).join(' ');
  }
  return String(content);
}

function hasToolCalls(message) {
  return Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;
}

/**
 * Fill the prompt template. `String.replace` with a *string* replacement
 * interprets `$&`, `$'` and friends, so a transcript containing those two
 * characters would silently rewrite the prompt around it. A function
 * replacement is inserted literally, which is the only safe way to splice
 * arbitrary user text into a template.
 */
function fillPrompt(template, values) {
  let out = String(template);
  for (const [key, value] of Object.entries(values)) {
    out = out.replace(`{${key}}`, () => String(value));
  }
  return out;
}

function countCompletedExchanges(messages = []) {
  let exchanges = 0;
  let awaitingAssistant = false;
  for (const msg of messages) {
    if (msg.role === 'human') awaitingAssistant = true;
    else if (msg.role === 'ai' && awaitingAssistant) {
      exchanges += 1;
      awaitingAssistant = false;
    }
  }
  return exchanges;
}

function distinctContentWords(text) {
  const words = String(text || '').toLowerCase().match(WORD_RE) || [];
  return new Set(words.filter((word) => word.length >= 2 && !STOPWORDS.has(word)));
}

// GENERIC_TAG_BANLIST belongs to local-data-service; accept either container
// shape so a later change there cannot silently disable this check.
function isBannedTag(tag) {
  if (GENERIC_TAG_BANLIST instanceof Set) return GENERIC_TAG_BANLIST.has(tag);
  if (Array.isArray(GENERIC_TAG_BANLIST)) return GENERIC_TAG_BANLIST.includes(tag);
  return false;
}

function normalizeTagList(values = []) {
  const out = [];
  for (const value of values) {
    const normalized = normalizeThreadTag(value) || '';
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

function formatVocabulary(vocabulary = []) {
  if (!vocabulary.length) return '(no tags in this workspace yet)';
  return vocabulary.map((entry) => `${entry.tag} (${entry.count})`).join(', ');
}

function formatCurrentTags(tags = []) {
  return tags.length ? tags.join(', ') : '(none yet)';
}

/**
 * G1 — turn shape. Tagging piggybacks on a finished assistant answer, and
 * never runs for a subagent or a suggestion run.
 */
function gateTurnShape(state, runConfig = {}) {
  if (runConfig?.configurable?.disable_tag_generation) {
    return {
      pass: false,
      reason: 'This run is a background helper (a subagent or a suggestion run), and background helpers are not allowed to tag the conversation you are having.',
    };
  }
  const messages = state?.messages || [];
  const last = messages[messages.length - 1];
  if (messageRole(last) !== 'ai') {
    return {
      pass: false,
      reason: 'The assistant has not finished answering yet, so there is nothing complete to read for tagging.',
    };
  }
  if (hasToolCalls(last)) {
    return {
      pass: false,
      reason: 'The assistant is still part-way through using tools, so the answer is not finished yet.',
    };
  }
  return { pass: true, reason: 'The assistant finished a reply, so the conversation can be looked at.' };
}

/**
 * G2 — cap. The single most important guard against endless curation: once a
 * conversation has a stable set of tags it is never re-evaluated again.
 */
function gateTagCap(tags = []) {
  if (tags.length >= MAX_TAGS_PER_THREAD) {
    return {
      pass: false,
      reason: `This conversation already has ${tags.length} tags, which is the maximum of ${MAX_TAGS_PER_THREAD}. briizOS will not propose any more for it, now or later.`,
      detail: { tagCount: tags.length },
    };
  }
  return {
    pass: true,
    reason: `This conversation has ${tags.length} of ${MAX_TAGS_PER_THREAD} possible tags.`,
    detail: { tagCount: tags.length },
  };
}

/**
 * G3 — checkpoint. A 40-turn conversation is evaluated at most five times,
 * not forty.
 */
function gateCheckpoint(exchanges, tagState = {}) {
  const lastEvaluatedExchanges = Number(tagState?.lastEvaluatedExchanges || 0);
  const checkpoint = EVALUATION_CHECKPOINTS
    .filter((value) => value <= exchanges)
    .pop() ?? null;
  const detail = { checkpoint, lastEvaluatedExchanges };
  if (checkpoint === null) {
    return {
      pass: false,
      reason: `This conversation has ${exchanges} completed back-and-forth${exchanges === 1 ? '' : 's'}; tagging first looks at ${EVALUATION_CHECKPOINTS[0]}.`,
      detail,
    };
  }
  if (checkpoint <= lastEvaluatedExchanges) {
    const next = EVALUATION_CHECKPOINTS.find((value) => value > lastEvaluatedExchanges);
    return {
      pass: false,
      reason: `Tagging was already considered when this conversation was ${lastEvaluatedExchanges} back-and-forths long. ${next ? `The next look happens at ${next} back-and-forths.` : 'There are no further looks; this conversation has had all the checks it gets.'}`,
      detail,
    };
  }
  return {
    pass: true,
    reason: `This conversation just passed the ${checkpoint}-exchange mark, which is one of the points where tagging takes a look.`,
    detail,
  };
}

/**
 * G4 — substance. "Hello" fails every clause of this, which is the point.
 */
function gateSubstance(messages = [], exchanges = 0) {
  const userText = messages
    .filter((msg) => msg.role === 'human')
    .map((msg) => String(msg.content || ''))
    .join(' ')
    .trim();
  const allText = messages.map((msg) => String(msg.content || '')).join(' ');
  const contentWords = distinctContentWords(allText);
  const detail = { userChars: userText.length, contentWords: contentWords.size };

  if (exchanges < MIN_EXCHANGES) {
    return {
      pass: false,
      reason: `Only ${exchanges} completed back-and-forth${exchanges === 1 ? '' : 's'} so far; tagging needs at least ${MIN_EXCHANGES} before there is a subject worth filing.`,
      detail,
    };
  }
  if (userText.length < MIN_USER_CHARS) {
    return {
      pass: false,
      reason: `You have written ${userText.length} characters in this conversation; tagging needs at least ${MIN_USER_CHARS} before it can tell what the conversation is about.`,
      detail,
    };
  }
  if (contentWords.size < MIN_CONTENT_WORDS) {
    return {
      pass: false,
      reason: `Setting aside common filler words, this conversation contains ${contentWords.size} distinct words; tagging needs at least ${MIN_CONTENT_WORDS} to find a real subject.`,
      detail,
    };
  }
  if (SMALLTALK_RE.test(userText)) {
    return {
      pass: false,
      reason: 'Everything you have written here is greetings, thanks, or a quick test, which is not a subject anyone would search for later.',
      detail,
    };
  }
  return {
    pass: true,
    reason: `There is enough here to tag: ${exchanges} back-and-forths, ${userText.length} characters of your own writing, and ${contentWords.size} distinct subject words.`,
    detail,
  };
}

/**
 * G5 — vocabulary. The model is shown what the workspace already uses so it
 * reuses a tag instead of minting a near-duplicate, which is what stops the
 * tag list growing without bound across conversations.
 */
function gateVocabulary(service, threadId, kind = 'chat', unavailableReason = null) {
  if (!service || !threadId) {
    return {
      pass: false,
      reason: `Tags could not be read or saved because ${unavailableReason || 'the local database that stores conversations is not ready'}, so a new tag would have nowhere to go.`,
      detail: { vocabulary: [] },
    };
  }
  try {
    const vocabulary = (service.listThreadTags({ kind }) || []).slice(0, VOCABULARY_LIMIT);
    return {
      pass: true,
      reason: vocabulary.length
        ? `${vocabulary.length} tag${vocabulary.length === 1 ? '' : 's'} already used elsewhere in this workspace will be offered to the model for reuse.`
        : 'This workspace has no tags yet, so anything the model suggests would be the first one.',
      detail: { vocabulary },
    };
  } catch (err) {
    return {
      pass: false,
      reason: `The list of tags already used in this workspace could not be read (${err?.message || 'unknown problem'}), so the model cannot be asked to reuse one.`,
      detail: { vocabulary: [] },
    };
  }
}

/**
 * Run G1..G5 in order and report the first gate that declined, with a reason
 * written for someone who only wants to know why "Hello" produced no tag.
 */
function shouldGenerateTags(state, runConfig = {}, context = {}) {
  const {
    tags = [],
    tagState = {},
    threadId = null,
    kind = 'chat',
    unavailableReason = null,
    service = getLocalDataService(),
  } = context;
  const messages = context.messages || filterMessagesForMemory(state?.messages || []);
  const exchanges = countCompletedExchanges(messages);
  const gates = [
    { id: 'G1', label: 'turn shape', run: () => gateTurnShape(state, runConfig) },
    { id: 'G2', label: 'tag cap', run: () => gateTagCap(tags) },
    { id: 'G3', label: 'checkpoint', run: () => gateCheckpoint(exchanges, tagState) },
    { id: 'G4', label: 'substance', run: () => gateSubstance(messages, exchanges) },
    { id: 'G5', label: 'vocabulary', run: () => gateVocabulary(service, threadId, kind, unavailableReason) },
  ];

  const detail = { exchanges, messages, currentTags: tags, vocabulary: [] };
  for (const gate of gates) {
    const result = gate.run();
    Object.assign(detail, result.detail || {});
    if (!result.pass) {
      return { pass: false, gate: gate.id, label: gate.label, reason: result.reason, ...detail };
    }
  }
  return {
    pass: true,
    gate: null,
    label: null,
    reason: 'All five checks passed, so the model can be asked for tags.',
    ...detail,
  };
}

/**
 * Accept the JSON array the prompt asks for, and also survive a fenced block,
 * an object with a `tags` key, or a model that answered in prose — a badly
 * behaved model must not be able to break tagging, only to have its answer
 * thrown away by post-processing.
 */
function parseTagsResponse(raw) {
  const normalized = Array.isArray(raw)
    ? raw.map((part) => (typeof part === 'string' ? part : part?.text || '')).filter(Boolean).join('')
    : raw;
  let clean = String(normalized || '').trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }

  const fromJson = (text) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((entry) => String(entry ?? ''));
      if (Array.isArray(parsed?.tags)) return parsed.tags.map((entry) => String(entry ?? ''));
    } catch {
      // Fall through to the next strategy.
    }
    return null;
  };

  const direct = fromJson(clean);
  if (direct) return direct;

  const embedded = clean.match(/\[[\s\S]*\]/);
  if (embedded) {
    const extracted = fromJson(embedded[0]);
    if (extracted) return extracted;
  }

  return clean
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').replace(/^["']|["',]+$/g, '').trim())
    .filter(Boolean);
}

/**
 * The eight post-processing steps from the contract, in order. Returns what
 * was kept and what was dropped with a plain-language reason for each, so the
 * log can say why a proposed tag did not stick.
 */
function postProcessTags(proposed = [], { tags = [], tagState = {} } = {}) {
  const existing = normalizeTagList(tags);
  const dismissed = normalizeTagList(tagState?.dismissed || []);
  const room = Math.max(0, MAX_TAGS_PER_THREAD - tags.length);
  const kept = [];
  const dropped = [];

  for (const candidate of proposed) {
    // Steps 1 + 2 — lowercase, trim, collapse whitespace, strip punctuation
    // other than internal hyphens. Owned by local-data-service.
    const tag = normalizeThreadTag(candidate) || '';
    if (!tag) {
      dropped.push({ tag: String(candidate ?? ''), reason: 'nothing usable was left after tidying it up' });
      continue;
    }
    // Step 3 — length.
    if (tag.split(' ').length > MAX_TAG_WORDS || tag.length > MAX_TAG_CHARS) {
      dropped.push({ tag, reason: `it is longer than a tag may be (${MAX_TAG_WORDS} words, ${MAX_TAG_CHARS} characters)` });
      continue;
    }
    // Step 4 — the generic banlist, the same list the prompt forbids.
    if (isBannedTag(tag)) {
      dropped.push({ tag, reason: 'it describes chatting rather than a subject, so it would not help anyone find this later' });
      continue;
    }
    // Step 5 — tags the user has already removed, which never come back.
    if (dismissed.includes(tag)) {
      dropped.push({ tag, reason: 'you removed this tag from this conversation before, so it is never suggested again' });
      continue;
    }
    // Step 6 — already on the conversation, or already proposed in this batch.
    if (existing.includes(tag) || kept.includes(tag)) {
      dropped.push({ tag, reason: 'this conversation already has that tag' });
      continue;
    }
    // Step 7 — at most MAX_NEW_TAGS_PER_EVALUATION per run.
    if (kept.length >= MAX_NEW_TAGS_PER_EVALUATION) {
      dropped.push({ tag, reason: `only ${MAX_NEW_TAGS_PER_EVALUATION} new tags may be added at a time` });
      continue;
    }
    // Step 8 — and never more than MAX_TAGS_PER_THREAD in total.
    if (kept.length >= room) {
      dropped.push({ tag, reason: `this conversation is at its limit of ${MAX_TAGS_PER_THREAD} tags` });
      continue;
    }
    kept.push(tag);
  }

  return { kept, dropped };
}

/**
 * Ask the model for tags and clean up the answer. Does not write anything and
 * does not decide whether the model should have been asked — that is
 * shouldGenerateTags' job.
 */
async function generateThreadTags(state, {
  modelName = null,
  tags = [],
  tagState = {},
  vocabulary = [],
  messages = null,
} = {}) {
  const config = readConfig();
  const tagsConfig = config.tags || {};
  const maxNew = tagsConfig.max_new || MAX_NEW_TAGS_PER_EVALUATION;
  const filtered = messages || filterMessagesForMemory(state?.messages || []);

  const prompt = fillPrompt(tagsConfig.prompt_template || DEFAULT_PROMPT, {
    vocabulary: formatVocabulary(vocabulary),
    current_tags: formatCurrentTags(tags),
    conversation: formatConversationForUpdate(filtered),
    max_new: String(maxNew),
  });

  const model = createChatModel({ name: tagsConfig.model_name || modelName || getRoutingModel('background'), thinkingEnabled: false });
  const response = await model.invoke(prompt);
  const proposed = parseTagsResponse(messageContent(response));
  const { kept, dropped } = postProcessTags(proposed, { tags, tagState });
  return { proposed, kept, dropped };
}

/**
 * Read everything the gates need about the thread in one place, so a missing
 * database or a missing thread is one condition rather than five.
 */
function readThreadTagRecord(service, threadId) {
  const empty = { available: false, problem: null, kind: 'chat', tags: [], tagState: {} };
  if (!service || !threadId) {
    return { ...empty, problem: 'the local database that stores conversations is not ready' };
  }
  try {
    const row = (service.listThreads({ id: threadId, limit: 1 }) || [])[0] || null;
    if (!row) return { ...empty, problem: 'this conversation has not been saved to the local database yet' };
    return {
      available: true,
      problem: null,
      kind: row.kind || 'chat',
      tags: Array.isArray(row.tags) ? row.tags : [],
      tagState: service.getThreadTagState(threadId) || {},
    };
  } catch (err) {
    // Background runs use synthetic thread ids (for example the suggestions
    // sub-thread) that were never stored. That is a gate decline, not a
    // failure, so it must not reach the warn path.
    return { ...empty, problem: `the conversation record could not be read (${err?.message || 'unknown problem'})` };
  }
}

function createTagPostModelHook({ modelName = null } = {}) {
  return async (state, config) => {
    const threadId = config?.configurable?.thread_id || null;
    try {
      const appConfig = readConfig();
      if (appConfig.tags?.enabled === false) {
        logger.debug('agent.tags', 'Automatic conversation tagging is switched off in the AI settings, so no conversation is read or tagged and no AI model is contacted for tags.', {
          threadId,
          modelContacted: false,
        });
        return {};
      }

      const service = getLocalDataService();
      const record = readThreadTagRecord(service, threadId);
      const decision = shouldGenerateTags(state, config, {
        tags: record.tags,
        tagState: record.tagState,
        threadId,
        kind: record.kind,
        unavailableReason: record.problem,
        service: record.available ? service : null,
      });

      if (!decision.pass) {
        logger.debug('agent.tags', `Automatic conversation tagging stopped at check ${decision.gate} (${decision.label}). ${decision.reason} No AI model was contacted and this conversation keeps whatever tags it already has.`, {
          threadId,
          gate: decision.gate,
          gateName: decision.label,
          plainReason: decision.reason,
          currentTags: record.tags,
          completedExchanges: decision.exchanges,
          lastEvaluatedExchanges: Number(record.tagState?.lastEvaluatedExchanges || 0),
          conversationRecord: record.available ? 'read from the local database' : record.problem,
          modelContacted: false,
        });
        return {};
      }

      const evaluation = Number(record.tagState?.evaluations || 0) + 1;
      logger.info('agent.tags', `Asking the AI model for up to ${MAX_NEW_TAGS_PER_EVALUATION} tag(s) for this conversation so it can be found again in the conversation browser. This reads the conversation only — nothing is saved until the answer comes back, and the conversation itself is never changed.`, {
        threadId,
        evaluation,
        completedExchanges: decision.exchanges,
        currentTags: record.tags,
        workspaceTagsOffered: decision.vocabulary.length,
        maxNewTags: MAX_NEW_TAGS_PER_EVALUATION,
        maxTagsPerConversation: MAX_TAGS_PER_THREAD,
      });

      const result = await generateThreadTags(state, {
        modelName,
        tags: record.tags,
        tagState: record.tagState,
        vocabulary: decision.vocabulary,
        messages: decision.messages,
      });

      // Written even when nothing was kept, so the checkpoint advances and the
      // same conversation is not re-read at the same size on the next turn.
      const write = service.appendThreadAutoTags(threadId, result.kept, {
        evaluations: evaluation,
        exchanges: decision.exchanges,
      });
      const added = write?.added || [];
      const visibleTags = Array.isArray(write?.row?.tags) ? write.row.tags : record.tags;
      const droppedSummary = result.dropped.map((entry) => `"${entry.tag}" — ${entry.reason}`);

      logger.info('agent.tags', added.length
        ? `The AI model suggested ${result.proposed.length} tag(s) and ${added.length} ${added.length === 1 ? 'was' : 'were'} added to this conversation: ${added.join(', ')}. Tags are only used to find this conversation again; nothing you or the assistant wrote was changed.`
        : `The AI model suggested ${result.proposed.length} tag(s) and none were added${droppedSummary.length ? `: ${droppedSummary.join('; ')}` : ' because it found no subject specific enough to be worth filing'}. This conversation keeps the tags it already had, and it will not be re-read until it grows past the next checkpoint.`, {
        threadId,
        evaluation,
        completedExchanges: decision.exchanges,
        modelSuggested: result.proposed,
        kept: result.kept,
        dropped: droppedSummary,
        addedByDatabase: added,
        skippedByDatabase: write?.skipped || [],
        tagsNow: visibleTags,
      });

      return added.length ? { tags: visibleTags } : {};
    } catch (err) {
      logger.warn('agent.tags', `Automatic conversation tagging could not run (${err?.message || 'unknown problem'}). This conversation is unaffected, keeps its existing tags, and will be looked at again on a later reply.`, {
        threadId,
        error: err?.message,
        conversationAffected: false,
      });
      return {};
    }
  };
}

module.exports = {
  createTagPostModelHook,
  generateThreadTags,
  shouldGenerateTags,
  postProcessTags,
  parseTagsResponse,
  setLocalDataService,
  MAX_TAGS_PER_THREAD,
  MAX_NEW_TAGS_PER_EVALUATION,
  EVALUATION_CHECKPOINTS,
  MIN_USER_CHARS,
  MIN_CONTENT_WORDS,
};
