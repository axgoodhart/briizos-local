const DEFAULT_RRF_K = 60;
const DEFAULT_MMR_LAMBDA = 0.75;

function candidateKey(candidate) {
  return `${candidate.corpusId}:${candidate.chunkId}`;
}

function reciprocalRankFuse(lexical = [], semantic = [], k = DEFAULT_RRF_K) {
  const merged = new Map();
  const add = (candidate, channel, index) => {
    const key = candidateKey(candidate);
    const current = merged.get(key) || { ...candidate, fusionScore: 0 };
    const rank = index + 1;
    current.fusionScore += 1 / (k + rank);
    current[`${channel}Rank`] = rank;
    current[`${channel}Score`] = candidate.score;
    merged.set(key, current);
  };
  lexical.forEach((candidate, index) => add(candidate, 'bm25', index));
  semantic.forEach((candidate, index) => add(candidate, 'semantic', index));
  return [...merged.values()].sort((a, b) => b.fusionScore - a.fusionScore);
}

function tokenSet(text) {
  return new Set(String(text || '').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []);
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  a.forEach((token) => { if (b.has(token)) common += 1; });
  return common / (a.size + b.size - common);
}

function diversifyCandidates(candidates, {
  limit = 20,
  lambda = DEFAULT_MMR_LAMBDA,
  maxPerConversation = 3,
} = {}) {
  const remaining = candidates.map((candidate) => ({ ...candidate, tokens: tokenSet(candidate.exactText) }));
  const selected = [];
  const counts = new Map();
  const maxFusion = Math.max(...remaining.map((candidate) => candidate.fusionScore), 1e-9);

  while (remaining.length && selected.length < limit) {
    let bestIndex = -1;
    let bestScore = -Infinity;
    remaining.forEach((candidate, index) => {
      if ((counts.get(candidate.conversationId) || 0) >= maxPerConversation) return;
      const relevance = candidate.fusionScore / maxFusion;
      const redundancy = selected.length
        ? Math.max(...selected.map((chosen) => jaccard(candidate.tokens, chosen.tokens)))
        : 0;
      const score = (lambda * relevance) - ((1 - lambda) * redundancy);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex < 0) break;
    const [chosen] = remaining.splice(bestIndex, 1);
    chosen.mmrScore = bestScore;
    chosen.finalRank = selected.length + 1;
    selected.push(chosen);
    counts.set(chosen.conversationId, (counts.get(chosen.conversationId) || 0) + 1);
  }
  return selected.map((candidate) => {
    const clean = { ...candidate };
    delete clean.tokens;
    return clean;
  });
}

function safeFtsQuery(input) {
  const terms = String(input || '').match(/[\p{L}\p{N}][\p{L}\p{N}_'-]*/gu) || [];
  return terms.slice(0, 24).map((term) => `"${term.replace(/"/g, '""')}"`).join(' OR ');
}

module.exports = {
  DEFAULT_MMR_LAMBDA,
  DEFAULT_RRF_K,
  diversifyCandidates,
  reciprocalRankFuse,
  safeFtsQuery,
};
