// Deterministic measurements of a writer's samples. The counts go to the AI
// that writes the style guide, and later to the drift readout for a draft.
// Nothing here judges quality or identity; it counts what is on the page.

const FUNCTION_WORDS = [
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'been', 'being', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her',
  'hers', 'him', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'might', 'more',
  'most', 'my', 'no', 'not', 'of', 'on', 'or', 'our', 'ours', 'out', 'she', 'should', 'so',
  'some', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'up', 'us', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'will', 'with', 'would', 'you', 'your', 'yours',
];
const FUNCTION_WORD_SET = new Set(FUNCTION_WORDS);
const CONJUNCTION_STARTERS = new Set(['and', 'but', 'or', 'so', 'yet', 'for', 'nor']);
const ADVERB_STARTERS = new Set(['however', 'therefore', 'meanwhile', 'instead', 'still', 'then', 'now', 'perhaps', 'maybe', 'finally', 'actually', 'generally', 'certainly', 'usually', 'sometimes', 'often', 'indeed', 'rather']);
const SUBORDINATORS = new Set(['after', 'although', 'as', 'because', 'before', 'even', 'if', 'once', 'since', 'though', 'unless', 'until', 'when', 'whenever', 'where', 'whereas', 'while', 'who', 'which', 'that']);
const HEDGES = new Set(['perhaps', 'maybe', 'may', 'might', 'seems', 'seem', 'seemingly', 'likely', 'possibly', 'arguably', 'somewhat', 'rather', 'fairly', 'apparently', 'probably', 'suggests', 'suggest']);
const PRONOUNS = new Set(['i', 'we', 'you', 'he', 'she', 'they', 'it', 'this', 'that', 'these', 'those']);

const ANALYZER_VERSION = 'stylofact-metrics/2.0';
const CHUNK_WORDS = 500;

const safeDivide = (numerator, denominator, fallback = 0) => (denominator ? numerator / denominator : fallback);
const round = (value, digits = 2) => (Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : 0);
const per1000 = (count, total) => round(safeDivide(count * 1000, total));
const mean = (values) => safeDivide(values.reduce((total, value) => total + value, 0), values.length);
const median = (values) => {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
const standardDeviation = (values) => (values.length < 2 ? 0 : Math.sqrt(mean(values.map((value) => (value - mean(values)) ** 2))));
const quantile = (values, q) => {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const position = (ordered.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return lower === upper ? ordered[lower] : ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower);
};
const distribution = (values) => (values.length ? {
  count: values.length, mean: round(mean(values)), median: round(median(values)), standardDeviation: round(standardDeviation(values)),
  min: Math.min(...values), max: Math.max(...values), p10: round(quantile(values, 0.1)), p90: round(quantile(values, 0.9)),
} : { count: 0, mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, p10: 0, p90: 0 });
const countMatches = (text, expression) => (text.match(expression) || []).length;

export function tokenize(text) {
  return String(text || '').toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

export function splitSentences(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  return normalized.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
}

export function splitParagraphs(text) {
  return String(text || '').replace(/\r\n/g, '\n').split(/\n\s*\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

// Rule-based English syllable count. Good enough for distributions, not for
// scansion: it counts vowel groups and corrects the common silent endings.
export function countSyllables(word) {
  let w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]e|ed)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  let count = groups ? groups.length : 1;
  if (/(?:ion|ious|ia|io)$/.test(word) && count > 1) count -= 0; // keep: these are usually two syllables as counted
  if (/[^aeiou]le$/.test(String(word).toLowerCase()) && !/[aeiouy]le$/.test(w)) count += 1;
  return Math.max(1, count);
}

function movingAverageTtr(tokens, windowSize = 100) {
  if (!tokens.length) return 0;
  if (tokens.length <= windowSize) return safeDivide(new Set(tokens).size, tokens.length);
  let total = 0;
  let windows = 0;
  const stride = Math.max(1, Math.ceil((tokens.length - windowSize + 1) / 5000));
  for (let index = 0; index + windowSize <= tokens.length; index += stride) {
    total += safeDivide(new Set(tokens.slice(index, index + windowSize)).size, windowSize);
    windows += 1;
  }
  return safeDivide(total, windows);
}

function topCounts(items, limit) {
  const counts = new Map();
  items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, limit).map(([value, count]) => ({ value, count }));
}

function chunkStability(tokens) {
  if (tokens.length < CHUNK_WORDS * 2) return { chunkCount: tokens.length ? 1 : 0, status: 'insufficient_data', metrics: {} };
  const chunks = [];
  for (let offset = 0; offset + Math.floor(CHUNK_WORDS * 0.75) <= tokens.length; offset += CHUNK_WORDS) {
    const chunk = tokens.slice(offset, offset + CHUNK_WORDS);
    chunks.push({
      typeTokenRatio: safeDivide(new Set(chunk).size, chunk.length),
      meanWordLength: mean(chunk.map((word) => word.length)),
      meanSyllables: mean(chunk.map(countSyllables)),
      contractionsPer1000: safeDivide(chunk.filter((word) => /['’]/.test(word)).length * 1000, chunk.length),
    });
  }
  const metrics = Object.fromEntries(Object.keys(chunks[0]).map((metric) => {
    const values = chunks.map((chunk) => chunk[metric]);
    const variation = safeDivide(standardDeviation(values), mean(values));
    return [metric, { mean: round(mean(values), 3), coefficientOfVariation: round(variation, 3), stability: variation <= 0.15 ? 'steady' : variation <= 0.3 ? 'varies' : 'swings' }];
  }));
  return { chunkCount: chunks.length, status: chunks.length >= 3 ? 'measured' : 'limited', metrics };
}

export function confidenceBand(wordCount) {
  return wordCount < 2500 ? 'sketch' : wordCount < 5000 ? 'provisional' : 'solid';
}

export function analyzeStylometry(text, meta = {}) {
  const raw = String(text || '');
  const tokens = tokenize(raw);
  const sentences = splitSentences(raw);
  const paragraphs = splitParagraphs(raw);
  const sentenceWords = sentences.map((sentence) => tokenize(sentence));
  const sentenceLengths = sentenceWords.map((words) => words.length).filter(Boolean);
  const syllablesPerWord = tokens.map(countSyllables);
  const syllableBuckets = { one: 0, two: 0, three: 0, fourPlus: 0 };
  syllablesPerWord.forEach((count) => { if (count === 1) syllableBuckets.one += 1; else if (count === 2) syllableBuckets.two += 1; else if (count === 3) syllableBuckets.three += 1; else syllableBuckets.fourPlus += 1; });
  const counts = new Map();
  tokens.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  const hapax = [...counts.values()].filter((count) => count === 1).length;
  const contractions = tokens.filter((word) => /['’]/.test(word)).length;
  const hedges = tokens.filter((word) => HEDGES.has(word)).length;
  const contentWords = tokens.filter((word) => !FUNCTION_WORD_SET.has(word) && word.length >= 5 && !/\d/.test(word));
  const openers = sentenceWords.map((words) => words[0]).filter(Boolean);
  const starterCounts = { conjunction: 0, adverb: 0, pronoun: 0 };
  openers.forEach((word) => { if (CONJUNCTION_STARTERS.has(word)) starterCounts.conjunction += 1; if (ADVERB_STARTERS.has(word)) starterCounts.adverb += 1; if (PRONOUNS.has(word)) starterCounts.pronoun += 1; });
  let questionVolleys = 0;
  let run = 0;
  sentences.forEach((sentence) => { if (/\?["”’)]*$/.test(sentence)) { run += 1; if (run === 2) questionVolleys += 1; } else run = 0; });
  const fragments = sentenceLengths.filter((length) => length <= 4).length;
  const longSentences = sentenceLengths.filter((length) => length >= 40).length;
  const marks = {
    emDash: countMatches(raw, /—/g), enDash: countMatches(raw, /–/g), doubleHyphen: countMatches(raw, /--/g), spacedHyphen: countMatches(raw, / - /g),
    semicolon: countMatches(raw, /;/g), colon: countMatches(raw, /:(?!\/\/)/g), parentheses: countMatches(raw, /\(/g), exclamation: countMatches(raw, /!/g),
    question: countMatches(raw, /\?/g), ellipsis: countMatches(raw, /…|\.\.\./g), comma: countMatches(raw, /,/g),
    slashStack: countMatches(raw, /\p{L}\/\p{L}/gu), curlyQuotes: countMatches(raw, /[“”]/g), straightQuotes: countMatches(raw, /"/g), italicsOrBold: countMatches(raw, /\*[^*\n]+\*|_[^_\n]+_/g),
  };
  const wordCount = tokens.length;

  return {
    analyzerVersion: ANALYZER_VERSION,
    scope: {
      sampleCount: Number(meta.sampleCount || 0),
      forms: meta.forms || [],
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      characterCount: raw.length,
      confidenceBand: confidenceBand(wordCount),
    },
    words: {
      typeTokenRatio: round(safeDivide(counts.size, wordCount), 3),
      movingAverageTtr100: round(movingAverageTtr(tokens, 100), 3),
      hapaxPer1000: per1000(hapax, wordCount),
      lengthCharacters: distribution(tokens.map((word) => word.length)),
      longWordShare6Plus: round(safeDivide(tokens.filter((word) => word.length >= 6).length, wordCount), 3),
      syllables: {
        ...distribution(syllablesPerWord),
        share: { one: round(safeDivide(syllableBuckets.one, wordCount), 3), two: round(safeDivide(syllableBuckets.two, wordCount), 3), three: round(safeDivide(syllableBuckets.three, wordCount), 3), fourPlus: round(safeDivide(syllableBuckets.fourPlus, wordCount), 3) },
        perSentence: distribution(sentenceWords.map((words) => words.reduce((total, word) => total + countSyllables(word), 0)).filter(Boolean)),
      },
      contractionsPer1000: per1000(contractions, wordCount),
      hedgesPer1000: per1000(hedges, wordCount),
      firstPersonSingularPer1000: per1000((counts.get('i') || 0) + (counts.get('my') || 0) + (counts.get('me') || 0), wordCount),
      firstPersonPluralPer1000: per1000((counts.get('we') || 0) + (counts.get('our') || 0) + (counts.get('us') || 0), wordCount),
      secondPersonPer1000: per1000((counts.get('you') || 0) + (counts.get('your') || 0), wordCount),
      frequentContentWords: topCounts(contentWords, 40),
      functionWords: FUNCTION_WORDS.map((word) => ({ word, per10000: round(safeDivide((counts.get(word) || 0) * 10000, wordCount), 1) })).filter((entry) => entry.per10000 > 0).sort((a, b) => b.per10000 - a.per10000).slice(0, 40),
    },
    sentences: {
      lengthWords: distribution(sentenceLengths),
      fragmentsShare: round(safeDivide(fragments, sentenceLengths.length), 3),
      longSentencesShare40Plus: round(safeDivide(longSentences, sentenceLengths.length), 3),
      questionVolleys,
      openers: { top: topCounts(openers, 15), shares: { conjunction: round(safeDivide(starterCounts.conjunction, openers.length), 3), adverb: round(safeDivide(starterCounts.adverb, openers.length), 3), pronoun: round(safeDivide(starterCounts.pronoun, openers.length), 3) } },
      clauseMarkers: {
        subordinatorsPerSentence: round(safeDivide(tokens.filter((word) => SUBORDINATORS.has(word)).length, sentences.length)),
        coordinatorsPerSentence: round(safeDivide(tokens.filter((word) => CONJUNCTION_STARTERS.has(word)).length, sentences.length)),
        note: 'Word counts only; not a parsed clause analysis.',
      },
    },
    punctuation: {
      counts: marks,
      per1000Words: Object.fromEntries(Object.entries(marks).map(([mark, count]) => [mark, per1000(count, wordCount)])),
      perSentence: Object.fromEntries(['emDash', 'semicolon', 'colon', 'parentheses', 'question', 'exclamation'].map((mark) => [mark, round(safeDivide(marks[mark], sentences.length), 3)])),
    },
    paragraphs: {
      words: distribution(paragraphs.map((paragraph) => tokenize(paragraph).length)),
      sentences: distribution(paragraphs.map((paragraph) => splitSentences(paragraph).length)),
      oneSentenceShare: round(safeDivide(paragraphs.filter((paragraph) => splitSentences(paragraph).length === 1).length, paragraphs.length), 3),
      headings: countMatches(raw, /^#{1,6}\s+/gm),
      bullets: countMatches(raw, /^\s*(?:[-*+] |\d+[.)] )/gm),
      blockquotes: countMatches(raw, /^\s*>\s?/gm),
    },
    stability: chunkStability(tokens),
  };
}

// Plain sentences the AI can fold into the guide and the panel can show.
export function describeMeasurements(metrics) {
  if (!metrics?.scope?.wordCount) return [];
  const s = metrics.sentences.lengthWords;
  const p = metrics.punctuation.per1000Words;
  const lines = [
    `${metrics.scope.wordCount.toLocaleString()} words in ${metrics.scope.sentenceCount.toLocaleString()} sentences across ${metrics.scope.paragraphCount.toLocaleString()} paragraphs.`,
    `Sentences average ${s.mean} words; the middle 80% run ${s.p10} to ${s.p90} words, with a spread (standard deviation) of ${s.standardDeviation}.`,
    `${Math.round(metrics.sentences.fragmentsShare * 100)}% of sentences are four words or fewer; ${Math.round(metrics.sentences.longSentencesShare40Plus * 100)}% run forty words or more.`,
    `Words average ${metrics.words.syllables.mean} syllables (${Math.round(metrics.words.syllables.share.one * 100)}% one syllable, ${Math.round(metrics.words.syllables.share.fourPlus * 100)}% four or more) and ${metrics.words.lengthCharacters.mean} characters.`,
    `Per thousand words: semicolons ${p.semicolon}, colons ${p.colon}, em dashes ${p.emDash}, en dashes ${p.enDash}, double hyphens ${p.doubleHyphen}, parentheses ${p.parentheses}, slash stacks ${p.slashStack}, questions ${p.question}, exclamation marks ${p.exclamation}, ellipses ${p.ellipsis}.`,
    `Contractions ${metrics.words.contractionsPer1000} per thousand words; hedging words ${metrics.words.hedgesPer1000}; "I/my/me" ${metrics.words.firstPersonSingularPer1000}; "we/our/us" ${metrics.words.firstPersonPluralPer1000}; "you/your" ${metrics.words.secondPersonPer1000}.`,
    `${Math.round(metrics.sentences.openers.shares.conjunction * 100)}% of sentences open with and/but/or/so; ${Math.round(metrics.sentences.openers.shares.pronoun * 100)}% with a pronoun; ${Math.round(metrics.sentences.openers.shares.adverb * 100)}% with an adverb. ${metrics.sentences.questionVolleys} runs of two or more questions in a row.`,
    `Paragraphs average ${metrics.paragraphs.words.mean} words and ${metrics.paragraphs.sentences.mean} sentences; ${Math.round(metrics.paragraphs.oneSentenceShare * 100)}% are a single sentence.`,
    `Vocabulary variety (moving-average type-token ratio over 100 words): ${metrics.words.movingAverageTtr100}; ${metrics.words.hapaxPer1000} words per thousand appear only once.`,
  ];
  if (metrics.stability.status === 'measured') {
    const swings = Object.entries(metrics.stability.metrics).filter(([, value]) => value.stability !== 'steady').map(([key]) => key);
    lines.push(swings.length ? `Across ${metrics.stability.chunkCount} chunks of 500 words these vary: ${swings.join(', ')}. Treat them as tendencies, not rules.` : `Across ${metrics.stability.chunkCount} chunks of 500 words the word-level habits hold steady.`);
  }
  return lines;
}

const COMPARISONS = [
  { key: 'sentenceMean', label: 'sentence length', pick: (m) => m.sentences.lengthWords.mean, tolerance: 0.2, unit: 'words', lower: 'sentences run shorter than your samples', higher: 'sentences run longer than your samples' },
  { key: 'sentenceSpread', label: 'variety of sentence length', pick: (m) => m.sentences.lengthWords.standardDeviation, tolerance: 0.3, unit: 'words of spread', lower: 'sentence lengths are more uniform than yours', higher: 'sentence lengths swing more than yours' },
  { key: 'syllables', label: 'syllables per word', pick: (m) => m.words.syllables.mean, tolerance: 0.08, unit: 'syllables', lower: 'words are plainer than yours', higher: 'words are heavier than yours' },
  { key: 'semicolon', label: 'semicolons', pick: (m) => m.punctuation.per1000Words.semicolon, tolerance: 0.5, unit: 'per 1,000 words', lower: 'fewer semicolons than you use', higher: 'more semicolons than you use' },
  { key: 'colon', label: 'colons', pick: (m) => m.punctuation.per1000Words.colon, tolerance: 0.5, unit: 'per 1,000 words', lower: 'fewer colons than you use', higher: 'more colons than you use' },
  { key: 'dash', label: 'dashes', pick: (m) => m.punctuation.per1000Words.emDash + m.punctuation.per1000Words.enDash + m.punctuation.per1000Words.doubleHyphen, tolerance: 0.5, unit: 'per 1,000 words', lower: 'fewer dashes than you use', higher: 'more dashes than you use' },
  { key: 'parentheses', label: 'parentheses', pick: (m) => m.punctuation.per1000Words.parentheses, tolerance: 0.5, unit: 'per 1,000 words', lower: 'fewer parentheses than you use', higher: 'more parentheses than you use' },
  { key: 'question', label: 'questions', pick: (m) => m.punctuation.per1000Words.question, tolerance: 0.6, unit: 'per 1,000 words', lower: 'fewer questions than you ask', higher: 'more questions than you ask' },
  { key: 'contractions', label: 'contractions', pick: (m) => m.words.contractionsPer1000, tolerance: 0.6, unit: 'per 1,000 words', lower: 'fewer contractions than you use', higher: 'more contractions than you use' },
  { key: 'paragraph', label: 'paragraph length', pick: (m) => m.paragraphs.words.mean, tolerance: 0.35, unit: 'words', lower: 'paragraphs run shorter than yours', higher: 'paragraphs run longer than yours' },
  { key: 'fragments', label: 'short fragments', pick: (m) => m.sentences.fragmentsShare, tolerance: 0.6, unit: 'share of sentences', lower: 'fewer short fragments than you write', higher: 'more short fragments than you write' },
];

export function evaluateVoiceFit(text, baselineMetrics) {
  const baseline = baselineMetrics?.scope?.wordCount ? baselineMetrics : null;
  const candidate = analyzeStylometry(text, { sampleCount: 1 });
  if (!baseline) return { status: 'no_baseline', note: 'Measure your samples first to compare a draft against them.', measurements: [], candidateMetrics: candidate };
  if (candidate.scope.wordCount < 80) return { status: 'too_short', note: 'The draft is too short to compare.', measurements: [], candidateMetrics: candidate };
  const measurements = COMPARISONS.map((comparison) => {
    const target = comparison.pick(baseline);
    const actual = comparison.pick(candidate);
    if (!Number.isFinite(target) || !Number.isFinite(actual)) return null;
    const scale = Math.max(Math.abs(target), comparison.key === 'syllables' ? 1 : 0.5);
    const difference = (actual - target) / scale;
    const magnitude = Math.abs(difference);
    const status = magnitude <= comparison.tolerance ? 'matches' : magnitude <= comparison.tolerance * 1.75 ? 'leans' : 'drifts';
    return {
      key: comparison.key,
      label: comparison.label,
      target: round(target),
      actual: round(actual),
      unit: comparison.unit,
      status,
      sentence: status === 'matches' ? `${comparison.label} matches your samples` : (difference < 0 ? comparison.lower : comparison.higher),
    };
  }).filter(Boolean);
  const drifts = measurements.filter((entry) => entry.status === 'drifts').length;
  const leans = measurements.filter((entry) => entry.status === 'leans').length;
  return {
    status: drifts ? 'drifts' : leans ? 'leans' : 'matches',
    summary: drifts ? `${drifts} habit${drifts === 1 ? '' : 's'} drift${drifts === 1 ? 's' : ''} from your samples` : leans ? `close; ${leans} habit${leans === 1 ? '' : 's'} lean${leans === 1 ? 's' : ''} away` : 'the surface habits match your samples',
    note: 'A comparison of countable habits only. It says nothing about ideas, truth or quality.',
    measurements,
    candidateMetrics: candidate,
  };
}

export function corpusFromSamples(samples) {
  return (samples || []).filter((sample) => sample?.text).map((sample) => sample.text.trim()).join('\n\n');
}
