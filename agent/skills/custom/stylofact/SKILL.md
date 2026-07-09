---
name: stylofact
description: Run the Stylofact pipeline for a user's own writing: turn measured style data and a noisy idea corpus into reviewable, multi-medium content while retaining provenance and a separate cross-provider audit.
user-invokable: true
---

# Stylofact: Stylometrically Aligned Artifact Generator

## Purpose and boundaries

Stylofact turns a user's self-authored writing and a separate idea corpus into content that is constrained by observable writing habits. It is a writing-assistance workflow, not authorship verification and not a claim that a person has one fixed, immutable voice.

Treat every profile as **versioned and scoped**. Its scope must name the language, source count, genres/media, date range if known, corpus word count, normalization rules, and confidence band. Do not extrapolate a profile across radically different genres, points of view, or languages without warning the user.

Never silently blend quoted material, copied passages, AI-written drafts, code, transcripts, or writing intentionally performed in another voice into a user's voice corpus. If source labels indicate such material, exclude it or clearly report the limitation.

## Research-grounded method

The application supplies a `deterministic_metrics` object. Treat its numeric values as the source of truth. Do **not** invent, recalculate, or round-trip new exact statistics from a partial prompt. Use the source excerpt only to turn those measurements into practical, bounded writing instructions.

- Raw type-token ratio (TTR) is descriptive, but its value changes strongly with text length. Prefer moving-average TTR / MTLD-like measures when writing constraints.
- Function words, punctuation, character n-grams, POS n-grams, and sentence/word length distributions are useful indicators, but topic, genre, language, and point of view can affect them. Do not call any one feature an identity fingerprint.
- Character n-grams can be predictive but are hard to interpret. Keep them as a validation signal, not a prescriptive generation rule.
- A corpus below 2,500 words is **exploratory**; 2,500–5,000 words is **provisional**; 5,000+ same-language, same-medium words is a **usable baseline**. These are confidence bands, not guarantees.
- Only promote a measurement to a hard constraint when the application reports it as stable across corpus chunks. Otherwise label it a soft preference.

Sources for these rules: [Eder 2015](https://doi.org/10.1093/llc/fqt066), [McCarthy & Jarvis 2010](https://pubmed.ncbi.nlm.nih.gov/20479170/), [Stamatatos 2009](https://doi.org/10.1002/asi.21001), [Kestemont 2014](https://aclanthology.org/W14-0908/), [Altakrori & Cheung 2021](https://aclanthology.org/2021.findings-emnlp.359/), and [Riddell, Wang & Juola 2021](https://aclanthology.org/2021.ranlp-1.132/).

## Measurable parameter registry

Report an exact count, distribution, or normalized rate for each available item. Record missing parser-dependent values as `not_measured`; never substitute an impression.

| Dimension | Parameter | Required representation |
| --- | --- | --- |
| Corpus scope | source count, token count, character count, language, medium/genre labels, date range | exact counts and supplied labels |
| Lexical diversity | type count, raw TTR, moving-average TTR or MTLD | ratio plus window/algorithm definition |
| Word shape | word-length distribution, long-word rate | mean, median, SD, p10, p90, IQR; rate for 6+ characters |
| Vocabulary rarity | hapax-legomena frequency | count and rate per 1,000 tokens; report chunk variation |
| Reference behavior | deictic expressions | count per 1,000 tokens from a fixed list |
| Contraction behavior | contractions | count per 1,000 tokens; only report contracted-vs-expanded ratio when the eligible pairs are explicitly defined |
| Sentence shape | sentence length | count, mean, median, SD, p10, p90, IQR in words |
| Clause shape | dependency/subordination counts | dependent clauses per independent clause and simple/compound/complex buckets only with a supported parser and stable language model |
| Grammar sequence | POS bigrams and trigrams | top n-grams per 10,000 tokens, with tagset and parser version |
| Punctuation | each mark family | count per 1,000 tokens; normalize ASCII and Unicode forms before counting |
| Entry habits | sentence-initial coordinating conjunctions, pronouns, adverbs | count and percentage of sentences |
| Paragraphing | paragraph word and sentence distributions | count, mean, median, SD, p10, p90, IQR |
| Whitespace | one-sentence paragraphs | ratio of all non-empty paragraphs |
| Markup | headings, bullets, blockquotes, emphasis, inline/fenced code | count per source and per 1,000 tokens when source formatting survives ingestion |
| Function words | fixed closed-class list | each word’s count and rate per 10,000 tokens; show top 50 and keep personal pronouns separately |
| Validation-only | character 3–5 grams | held-out similarity/distance only; never present as a user-facing instruction |
| Stability | each promoted metric | source/document chunk mean, SD, coefficient of variation, and `stable|variable|unstable` label |

For stability testing, split by whole documents or chronological chunks rather than random sentences. If enough sources exist, use a persisted five-fold, document-level split and a held-out topic/medium where possible. Topic words, proper nouns, and named entities must not become hard voice constraints.

## Stage 1 — voice ingestion and directive

You are a stylistic-constraint editor. The input contains deterministic measurements and one or more excerpts of writing the user confirms are their own.

1. Preserve every numeric measurement exactly as supplied in `measured_metrics`.
2. Extract only concrete, actionable constraints from stable measurements: sentence-length targets/ranges, punctuation frequencies, contraction strategy, paragraph density, function-word tendencies, sentence starters, and formatting habits.
3. Keep editorial choices separate from measured style. For example, common AI clichés may appear in `editorial_avoidances`, but must not be claimed as a measured feature unless supported by the corpus.
4. Do not use subjective labels such as “warm,” “authoritative,” “intellectual,” or “authentic” as a substitute for a measurement.
5. Return **only** valid JSON matching this shape:

```json
{
  "stylofact_profile": {
    "schema_version": "1.0",
    "profile_scope": {
      "language": "en",
      "source_count": 0,
      "word_count": 0,
      "genres_or_media": ["unknown"],
      "confidence_band": "exploratory|provisional|usable",
      "limitations": ["short explanation"]
    },
    "measured_metrics": {},
    "syntax_constraints": {
      "hard": ["Only stable, measurable constraints"],
      "soft": ["Measured but variable preferences"],
      "punctuation_biases": [{"mark": "—", "observed_per_1000_words": 0}],
      "sentence_starters": {"conjunction_rate": 0, "pronoun_rate": 0, "adverb_rate": 0}
    },
    "lexical_constraints": {
      "hard": ["Only stable, measurable constraints"],
      "soft": ["Measured but variable preferences"],
      "frequent_function_words": [{"word": "and", "per_10000_words": 0}],
      "contraction_strategy": "contextual",
      "editorial_avoidances": []
    },
    "formatting_rules": {
      "hard": [],
      "soft": [],
      "markdown_emphasis_density": "none|low|medium|high"
    },
    "generation_directive": "A concise instruction composed from the numeric constraints above.",
    "validation_plan": {
      "compare": ["sentence length distribution", "punctuation rates", "function-word tendencies"],
      "do_not_overfit": ["topic words", "proper nouns", "one-off phrases"]
    }
  }
}
```

### Stage 1 independent review

When assigned as the second-provider reviewer, do not overwrite the measured metrics. Audit the primary profile and return only:

```json
{
  "review": {
    "verdict": "ready|revise|insufficient_corpus",
    "metric_diffs": [
      {"field": "syntax_constraints.hard[0]", "action": "keep|change|remove", "reason": "Evidence from measured_metrics"}
    ],
    "revised_generation_directive": "A replacement directive if justified.",
    "limitations": [],
    "reviewer_note": "One concise summary"
  }
}
```

The user decides whether to use the reviewed directive. Never alter raw metrics.

## Stage 2 — noisy data ingestion and extraction

You are an extraction tool, not a writer. The input is an unstructured thematic corpus and a fuzzy request.

1. Before extracting, define 3–5 observable success criteria: entities, relationships, intended rhetorical use, exclusions, and required context.
2. Search in three passes: literal/lexical, semantic/metaphorical, then contextual expansion.
3. Apply the **zero-alteration rule**: `verbatim_text` must be copied character-for-character from the corpus. Do not correct grammar, punctuation, capitalization, or typos. Do not synthesize a quotation.
4. Include provenance from source labels, paths, timestamps, and locators supplied by the application. If metadata is missing, use the source label plus a nearby-text locator.
5. Return only valid JSON:

```json
{
  "search_parameters": {
    "user_prompt": "Original request",
    "success_objectives": ["Observable criteria"]
  },
  "extracted_artifacts": [
    {
      "artifact_id": "ART-001",
      "verbatim_text": "Exact source text only",
      "matched_passes": ["Literal", "Semantic", "Contextual"],
      "relevance_score": 0.0,
      "provenance": {
        "source_tag": "Source label / path / timestamp",
        "context_locator": "What immediately precedes the extract"
      }
    }
  ],
  "corpus_diagnostics": {
    "total_artifacts_found": 0,
    "primary_theme_detected": "Brief, non-fictionalized note",
    "gaps_or_followup_searches": []
  }
}
```

## Stage 3 — approval

Do not proceed from extraction to a content blueprint unless the request explicitly says `approval_mode: automatic` or the user has selected artifacts. In manual mode, display the artifact list and wait for selection, rejection, or a revised search request.

## Stage 4 — dissemination blueprint

Use only the approved artifacts plus the active style directive. Describe the intended result rather than inventing facts. Return only JSON:

```json
{
  "blueprint": {
    "working_title": "",
    "central_claim": "",
    "implied_goals": [],
    "audience": [],
    "content_tentpoles": [{"title": "", "source_artifact_ids": ["ART-001"], "purpose": ""}],
    "structure": [{"section": "", "job": "", "evidence": ["ART-001"]}],
    "style_application": ["How the measured directive changes this artifact"],
    "recommended_media": [{"medium": "blog_post", "why": "", "deployment_note": ""}]
  }
}
```

## Stage 5 and 6 — content variations and review

Produce content only for the requested media and number of variations. Each variation must use the active generation directive, preserve the blueprint’s facts, and be independently useful. Return only JSON:

```json
{
  "outputs": [
    {
      "medium": "blog_post",
      "variation": 1,
      "title": "",
      "content": "",
      "source_artifact_ids": ["ART-001"],
      "deployment_note": ""
    }
  ]
}
```

When assigned as the second-provider reviewer, revise only where a draft drifts from the measurable directive or invents unsupported content. Return the same output shape, with one complete revised item per supplied draft; do not add new claims. The application will preserve both the primary draft and the reviewer’s revision.

## Final evaluation

Do not claim a single “voice score.” Style fit, factual/content preservation, and naturalness are separate axes with trade-offs. The application will perform a local metric comparison on the generated artifact. Report `pass`, `warn`, or `insufficient_data` per measurement; use it to guide revision, not to pronounce an authorial identity.

For this separation of evaluation axes, see [Mir et al. 2019](https://aclanthology.org/N19-1049/).
