// Deterministic, transparent measurements used by Stylofact.  This is not an
// authorship classifier: it reports corpus properties that a user can inspect
// before an LLM turns them into a generation directive.

const FUNCTION_WORDS = [
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'been', 'being', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her',
  'hers', 'him', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'might', 'more',
  'most', 'my', 'no', 'not', 'of', 'on', 'or', 'our', 'ours', 'out', 'she', 'should', 'so',
  'some', 'that', 'the', 'their', 'theirs', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'up', 'us', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'will', 'with', 'would', 'you', 'your', 'yours',
];

const DEICTIC_WORDS = new Set([
  'here', 'there', 'now', 'then', 'this', 'that', 'these', 'those', 'today', 'tomorrow',
  'yesterday', 'near', 'far', 'above', 'below', 'inside', 'outside', 'ahead', 'behind',
]);
const FUNCTION_WORD_SET = new Set(FUNCTION_WORDS);

const CONJUNCTION_STARTERS = new Set(['and', 'but', 'or', 'so', 'yet', 'for', 'nor']);
const ADVERB_STARTERS = new Set([
  'however', 'therefore', 'meanwhile', 'instead', 'still', 'then', 'now', 'perhaps', 'maybe',
  'finally', 'actually', 'generally', 'certainly', 'usually', 'sometimes', 'often',
]);

const SUBORDINATOR_MARKERS = new Set([
  'after', 'although', 'as', 'because', 'before', 'even', 'if', 'once', 'since', 'though',
  'unless', 'until', 'when', 'whenever', 'where', 'whereas', 'while', 'who', 'which', 'that',
]);

const ANALYZER_VERSION = 'stylofact-metrics/1.1';
const PROFILE_BUILDER_VERSION = 'stylofact-profile/1.0';
const DEFAULT_CHUNK_WORDS = 500;

function safeDivide(numerator, denominator, fallback = 0) {
  return denominator ? numerator / denominator : fallback;
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return 0;
  const shift = 10 ** digits;
  return Math.round(value * shift) / shift;
}

function compareCodePoints(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function corpusFingerprint(text) {
  let hash = 0x811c9dc5;
  for (const character of String(text || '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}:${String(text || '').length}`;
}

function mean(values) {
  return safeDivide(values.reduce((total, value) => total + value, 0), values.length);
}

function median(values) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function quantile(values, q) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const position = (ordered.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return ordered[lower];
  return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower);
}

function distribution(values) {
  if (!values.length) {
    return { count: 0, mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, p10: 0, p90: 0, iqr: 0 };
  }
  return {
    count: values.length,
    mean: round(mean(values)),
    median: round(median(values)),
    standardDeviation: round(standardDeviation(values)),
    min: Math.min(...values),
    max: Math.max(...values),
    p10: round(quantile(values, 0.1)),
    p90: round(quantile(values, 0.9)),
    iqr: round(quantile(values, 0.75) - quantile(values, 0.25)),
  };
}

function countMatches(text, expression) {
  return (text.match(expression) || []).length;
}

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

function rawWords(text) {
  return String(text || '').match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

function splitSentences(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  return normalized.match(/[^.!?…]+(?:[.!?…]+|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];
}

function splitParagraphs(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function movingAverageTtr(tokens, windowSize = 100) {
  if (!tokens.length) return 0;
  if (tokens.length <= windowSize) return safeDivide(new Set(tokens).size, tokens.length);
  let total = 0;
  let windows = 0;
  // Cap work around 5,000 windows so a long private corpus does not freeze
  // the renderer just to calculate a descriptive metric.
  const stride = Math.max(1, Math.ceil((tokens.length - windowSize + 1) / 5000));
  for (let index = 0; index + windowSize <= tokens.length; index += stride) {
    total += safeDivide(new Set(tokens.slice(index, index + windowSize)).size, windowSize);
    windows += 1;
  }
  return safeDivide(total, windows);
}

function functionWordMetrics(tokens) {
  const countByWord = new Map();
  tokens.forEach((word) => {
    if (FUNCTION_WORD_SET.has(word)) countByWord.set(word, (countByWord.get(word) || 0) + 1);
  });
  const all = FUNCTION_WORDS.map((word) => ({
    word,
    count: countByWord.get(word) || 0,
    per10000Words: round(safeDivide((countByWord.get(word) || 0) * 10000, tokens.length)),
  }));
  return {
    top: all.filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count || compareCodePoints(a.word, b.word)).slice(0, 50),
    all,
  };
}

function punctuationMetrics(text, wordCount) {
  const marks = {
    emDash: countMatches(text, /—/g),
    enDash: countMatches(text, /–/g),
    semicolon: countMatches(text, /;/g),
    colon: countMatches(text, /:/g),
    parentheses: countMatches(text, /[()]/g),
    exclamation: countMatches(text, /!/g),
    question: countMatches(text, /\?/g),
    ellipsis: countMatches(text, /…|\.\.\./g),
    comma: countMatches(text, /,/g),
  };
  const per1000Words = Object.fromEntries(Object.entries(marks).map(([mark, count]) => [
    mark,
    round(safeDivide(count * 1000, wordCount)),
  ]));
  const nonPeriod = marks.emDash + marks.enDash + marks.semicolon + marks.colon + marks.parentheses
    + marks.exclamation + marks.question + marks.ellipsis + marks.comma;
  return { counts: marks, per1000Words, nonPeriodPer1000Words: round(safeDivide(nonPeriod * 1000, wordCount)) };
}

function formattingMetrics(text, paragraphs) {
  const oneSentenceParagraphs = paragraphs.filter((paragraph) => splitSentences(paragraph).length === 1).length;
  return {
    paragraphCount: paragraphs.length,
    singleSentenceParagraphRatio: round(safeDivide(oneSentenceParagraphs, paragraphs.length)),
    headings: countMatches(text, /^#{1,6}\s+/gm),
    bullets: countMatches(text, /^\s*(?:[-*+] |\d+[.)] )/gm),
    blockquotes: countMatches(text, /^\s*>\s?/gm),
    boldMarkers: countMatches(text, /\*\*[^*]+\*\*|__[^_]+__/g),
    inlineCodeMarkers: countMatches(text, /`[^`]+`/g),
    fencedCodeBlocks: countMatches(text, /```/g) / 2,
  };
}

function sentenceStarterMetrics(sentences) {
  const counts = { conjunction: 0, adverb: 0, pronoun: 0 };
  const pronouns = new Set(['i', 'we', 'you', 'he', 'she', 'they', 'it', 'this', 'that', 'these', 'those']);
  sentences.forEach((sentence) => {
    const starter = tokenize(sentence)[0];
    if (!starter) return;
    if (CONJUNCTION_STARTERS.has(starter)) counts.conjunction += 1;
    if (ADVERB_STARTERS.has(starter)) counts.adverb += 1;
    if (pronouns.has(starter)) counts.pronoun += 1;
  });
  return {
    counts,
    rates: Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, round(safeDivide(value, sentences.length))])),
  };
}

function chunkStability(tokens) {
  if (tokens.length < DEFAULT_CHUNK_WORDS * 2) {
    return { chunkCount: Math.max(tokens.length ? 1 : 0, 0), status: 'insufficient_data', metrics: {} };
  }
  const chunks = [];
  for (let offset = 0; offset < tokens.length; offset += DEFAULT_CHUNK_WORDS) {
    const chunk = tokens.slice(offset, offset + DEFAULT_CHUNK_WORDS);
    if (chunk.length < Math.floor(DEFAULT_CHUNK_WORDS * 0.75)) continue;
    chunks.push({
      rawTtr: safeDivide(new Set(chunk).size, chunk.length),
      meanWordLength: mean(chunk.map((word) => [...word].length)),
      contractionDensity: safeDivide(chunk.filter((word) => /['’]/.test(word)).length * 1000, chunk.length),
    });
  }
  const metrics = Object.fromEntries(Object.keys(chunks[0] || {}).map((metric) => {
    const values = chunks.map((chunk) => chunk[metric]);
    const average = mean(values);
    const coefficientOfVariation = safeDivide(standardDeviation(values), average);
    return [metric, {
      mean: round(average),
      standardDeviation: round(standardDeviation(values)),
      coefficientOfVariation: round(coefficientOfVariation),
      stability: coefficientOfVariation <= 0.15 ? 'stable' : coefficientOfVariation <= 0.3 ? 'variable' : 'unstable',
    }];
  }));
  return { chunkCount: chunks.length, status: chunks.length >= 3 ? 'measured' : 'limited', metrics };
}

export function analyzeStylometry(text, sourceMetadata = {}) {
  const rawText = String(text || '');
  const tokens = tokenize(rawText);
  const words = rawWords(rawText);
  const sentences = splitSentences(rawText);
  const paragraphs = splitParagraphs(rawText);
  const wordLengths = tokens.map((word) => [...word].length);
  const sentenceLengths = sentences.map((sentence) => tokenize(sentence).length).filter(Boolean);
  const paragraphWordLengths = paragraphs.map((paragraph) => tokenize(paragraph).length);
  const paragraphSentenceLengths = paragraphs.map((paragraph) => splitSentences(paragraph).length);
  const counts = new Map();
  tokens.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  const hapaxCount = [...counts.values()].filter((count) => count === 1).length;
  const deicticCount = tokens.filter((word) => DEICTIC_WORDS.has(word)).length;
  const contractionCount = words.filter((word) => /['’]/.test(word)).length;
  const estimatedSubordinatorCount = tokens.filter((word) => SUBORDINATOR_MARKERS.has(word)).length;
  const coordinatingConjunctionCount = tokens.filter((word) => CONJUNCTION_STARTERS.has(word)).length;
  const confidenceBand = tokens.length < 2500 ? 'exploratory' : tokens.length < 5000 ? 'provisional' : 'usable';

  return {
    analyzerVersion: ANALYZER_VERSION,
    scope: {
      language: sourceMetadata.language || 'unknown',
      sourceCount: Number(sourceMetadata.sourceCount || 0),
      genresOrMedia: sourceMetadata.genresOrMedia || ['unspecified'],
      wordCount: tokens.length,
      characterCount: rawText.length,
      corpusFingerprint: corpusFingerprint(rawText),
      confidenceBand,
      normalization: 'Unicode word tokenization; locale-independent case folding; source formatting retained where supplied.',
      limitations: [
        tokens.length < 2500 ? 'Corpus is below the exploratory 2,500-word confidence threshold.' : null,
        sourceMetadata.mixedGenres ? 'Mixed genres or media can obscure a stable voice profile.' : null,
        'Clause and POS metrics are deliberately not inferred by this lightweight deterministic analyzer.',
      ].filter(Boolean),
    },
    lexical: {
      tokenCount: tokens.length,
      typeCount: counts.size,
      rawTypeTokenRatio: round(safeDivide(counts.size, tokens.length)),
      movingAverageTtr100: round(movingAverageTtr(tokens, 100)),
      hapaxLegomenaCount: hapaxCount,
      hapaxLegomenaPer1000Words: round(safeDivide(hapaxCount * 1000, tokens.length)),
      wordLengthCharacters: distribution(wordLengths),
      longWordRate6Plus: round(safeDivide(wordLengths.filter((length) => length >= 6).length, wordLengths.length)),
      deicticExpressionsPer1000Words: round(safeDivide(deicticCount * 1000, tokens.length)),
      contractionDensityPer1000Words: round(safeDivide(contractionCount * 1000, tokens.length)),
    },
    syntax: {
      sentenceLengthWords: distribution(sentenceLengths),
      punctuation: punctuationMetrics(rawText, tokens.length),
      sentenceStarters: sentenceStarterMetrics(sentences),
      estimatedClauseMarkers: {
        subordinatorsPerSentence: round(safeDivide(estimatedSubordinatorCount, sentences.length)),
        coordinatingConjunctionsPerSentence: round(safeDivide(coordinatingConjunctionCount, sentences.length)),
        note: 'Lexical marker count only; not a parser-derived clause classification.',
      },
    },
    formatting: {
      paragraphWords: distribution(paragraphWordLengths),
      paragraphSentences: distribution(paragraphSentenceLengths),
      ...formattingMetrics(rawText, paragraphs),
    },
    functionWords: functionWordMetrics(tokens),
    stability: chunkStability(tokens),
  };
}

function addConstraintByStability(stability, text, hard, soft) {
  (stability === 'stable' ? hard : soft).push(text);
}

function ratePer1000(value) {
  return `${round(value || 0)} per 1,000 words`;
}

function emphasisDensity(formatting, wordCount) {
  const density = safeDivide((formatting?.boldMarkers || 0) * 1000, wordCount);
  if (density === 0) return 'none';
  if (density <= 1) return 'low';
  if (density <= 4) return 'medium';
  return 'high';
}

export function compileStyleProfile(metrics = {}) {
  const scope = metrics.scope || {};
  const lexical = metrics.lexical || {};
  const syntax = metrics.syntax || {};
  const formatting = metrics.formatting || {};
  const stability = metrics.stability?.metrics || {};
  const sentenceLengths = syntax.sentenceLengthWords || {};
  const wordLengths = lexical.wordLengthCharacters || {};
  const punctuation = syntax.punctuation?.per1000Words || {};
  const starterRates = syntax.sentenceStarters?.rates || {};
  const lexicalHard = [];
  const lexicalSoft = [];
  const syntaxHard = [];
  const syntaxSoft = [];

  if (lexical.tokenCount) {
    addConstraintByStability(
      stability.rawTtr?.stability,
      `Keep raw lexical diversity near ${round(lexical.rawTypeTokenRatio)} (moving-average TTR-100: ${round(lexical.movingAverageTtr100)}).`,
      lexicalHard,
      lexicalSoft,
    );
    addConstraintByStability(
      stability.meanWordLength?.stability,
      `Use words averaging ${round(wordLengths.mean)} characters.`,
      lexicalHard,
      lexicalSoft,
    );
    addConstraintByStability(
      stability.contractionDensity?.stability,
      `Use contractions at roughly ${ratePer1000(lexical.contractionDensityPer1000Words)}.`,
      lexicalHard,
      lexicalSoft,
    );
  }

  if (sentenceLengths.count) {
    syntaxSoft.push(`Aim for sentences averaging ${round(sentenceLengths.mean)} words (observed middle 80%: ${round(sentenceLengths.p10)}–${round(sentenceLengths.p90)} words).`);
  }
  if (punctuation.emDash > 0) syntaxSoft.push(`Use em dashes at roughly ${ratePer1000(punctuation.emDash)}.`);
  if (punctuation.semicolon > 0) syntaxSoft.push(`Use semicolons at roughly ${ratePer1000(punctuation.semicolon)}.`);

  const punctuationBiases = [
    ['—', punctuation.emDash],
    ['–', punctuation.enDash],
    [';', punctuation.semicolon],
    [':', punctuation.colon],
    ['()', punctuation.parentheses],
    ['!', punctuation.exclamation],
    ['?', punctuation.question],
    ['…', punctuation.ellipsis],
    [',', punctuation.comma],
  ].map(([mark, observedPer1000Words]) => ({
    mark,
    observed_per_1000_words: round(observedPer1000Words || 0),
  }));
  const paragraphWords = formatting.paragraphWords || {};
  const formattingSoft = [];
  if (paragraphWords.count) {
    formattingSoft.push(`Use paragraphs averaging ${round(paragraphWords.mean)} words (observed middle 80%: ${round(paragraphWords.p10)}–${round(paragraphWords.p90)} words).`);
  }
  if (formatting.paragraphCount) {
    formattingSoft.push(`One-sentence paragraphs account for ${round((formatting.singleSentenceParagraphRatio || 0) * 100)}% of observed paragraphs.`);
  }

  const contractionRate = lexical.contractionDensityPer1000Words || 0;
  const contractionStrategy = contractionRate === 0 ? 'avoid contractions'
    : contractionRate >= 15 ? 'favor contractions'
      : 'use contractions selectively';
  const directive = [
    'Apply the measured profile rather than inferring a persona.',
    sentenceLengths.count ? `Target sentences around ${round(sentenceLengths.mean)} words, with the observed middle range of ${round(sentenceLengths.p10)}–${round(sentenceLengths.p90)} words as a soft guide.` : null,
    lexical.tokenCount ? `Aim for words averaging ${round(wordLengths.mean)} characters and a moving-average TTR-100 near ${round(lexical.movingAverageTtr100)}.` : null,
    lexical.tokenCount ? `Use contractions ${contractionStrategy} (observed ${ratePer1000(contractionRate)}).` : null,
    punctuation.emDash > 0 ? `Use em dashes near ${ratePer1000(punctuation.emDash)} when content permits.` : null,
    'Treat only stable constraints as firm; treat every other measurement as a soft tendency.',
    'Do not use topic words, proper nouns, or one-off phrases as voice constraints.',
  ].filter(Boolean).join(' ');

  return {
    stylofact_profile: {
      schema_version: '1.1',
      profile_builder: PROFILE_BUILDER_VERSION,
      profile_scope: {
        language: scope.language || 'unknown',
        source_count: Number(scope.sourceCount || 0),
        word_count: Number(scope.wordCount || 0),
        genres_or_media: scope.genresOrMedia || ['unspecified'],
        confidence_band: scope.confidenceBand || 'exploratory',
        analyzer_version: metrics.analyzerVersion || ANALYZER_VERSION,
        corpus_fingerprint: scope.corpusFingerprint || '',
        limitations: [
          ...(scope.limitations || []),
          'This directive is generated locally from deterministic measurements; it does not infer identity, quality, or authenticity.',
        ],
      },
      measured_metrics: metrics,
      syntax_constraints: {
        hard: syntaxHard,
        soft: syntaxSoft,
        punctuation_biases: punctuationBiases,
        sentence_starters: {
          conjunction_rate: round(starterRates.conjunction || 0),
          pronoun_rate: round(starterRates.pronoun || 0),
          adverb_rate: round(starterRates.adverb || 0),
        },
      },
      lexical_constraints: {
        hard: lexicalHard,
        soft: lexicalSoft,
        frequent_function_words: (metrics.functionWords?.top || []).map((entry) => ({
          word: entry.word,
          count: entry.count,
          per_10000_words: round(entry.per10000Words),
        })),
        contraction_strategy: contractionStrategy,
        editorial_avoidances: ['Do not treat topic words, proper nouns, or one-off phrases as voice constraints.'],
      },
      formatting_rules: {
        hard: [],
        soft: formattingSoft,
        markdown_emphasis_density: emphasisDensity(formatting, scope.wordCount || 0),
      },
      generation_directive: directive,
      validation_plan: {
        compare: ['sentence length distribution', 'word length distribution', 'punctuation rates', 'contraction density', 'function-word tendencies'],
        do_not_overfit: ['topic words', 'proper nouns', 'one-off phrases'],
      },
    },
  };
}

function compareNumber(name, target, actual, tolerance = 0.25) {
  if (!Number.isFinite(target) || !Number.isFinite(actual) || target === 0) {
    return { metric: name, status: 'insufficient_data', target, actual };
  }
  const difference = Math.abs(actual - target) / Math.max(Math.abs(target), 0.001);
  return {
    metric: name,
    target: round(target),
    actual: round(actual),
    relativeDifference: round(difference),
    status: difference <= tolerance ? 'pass' : difference <= tolerance * 1.75 ? 'warn' : 'drift',
  };
}

export function evaluateVoiceFit(text, storedMetrics) {
  const baseline = storedMetrics?.stylofact_profile?.measured_metrics || storedMetrics?.measured_metrics || storedMetrics || {};
  const candidate = analyzeStylometry(text, {
    language: baseline?.scope?.language || 'unknown',
    genresOrMedia: ['generated artifact'],
  });
  const baselineSentence = baseline?.syntax?.sentenceLengthWords?.mean;
  const baselineWord = baseline?.lexical?.wordLengthCharacters?.mean;
  const baselineContractions = baseline?.lexical?.contractionDensityPer1000Words;
  const baselineDash = baseline?.syntax?.punctuation?.per1000Words?.emDash;
  const results = [
    compareNumber('mean sentence length', baselineSentence, candidate.syntax.sentenceLengthWords.mean),
    compareNumber('mean word length', baselineWord, candidate.lexical.wordLengthCharacters.mean),
    compareNumber('contraction density', baselineContractions, candidate.lexical.contractionDensityPer1000Words, 0.45),
    compareNumber('em-dash rate', baselineDash, candidate.syntax.punctuation.per1000Words.emDash, 0.6),
  ];
  const reportable = results.filter((result) => result.status !== 'insufficient_data');
  return {
    status: candidate.scope.wordCount < 80 ? 'insufficient_data' : reportable.every((result) => result.status === 'pass')
      ? 'pass'
      : reportable.some((result) => result.status === 'drift') ? 'warn' : 'review',
    note: 'This compares a few transparent surface metrics. It does not establish identity, quality, factuality, or naturalness.',
    measurements: results,
    candidateMetrics: candidate,
  };
}

export function corpusFromSources(sources, { includeSourceLabels = true } = {}) {
  return [...(sources || [])]
    .filter((source) => source?.bodyText)
    .sort((left, right) => compareCodePoints(String(left.createdAt || ''), String(right.createdAt || '')) || compareCodePoints(String(left.id || ''), String(right.id || '')))
    .map((source) => includeSourceLabels ? `\n\n--- SOURCE: ${source.label || 'Untitled source'} ---\n${source.bodyText}` : `\n\n${source.bodyText}`)
    .join('')
    .trim();
}
