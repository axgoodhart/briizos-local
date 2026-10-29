---
name: stylofact
description: Write in the user's own voice. Three jobs, one per request: write (or revise) a plain-English style guide from the user's writing samples and the app's measurements; find what the user has already said on a subject in their ChatGPT history; write or review a piece from the guide and the approved quotes.
user-invokable: true
---

# Stylofact

The request is one JSON object. Its `operation` field names the job. Do exactly that job and return exactly what it asks for: a Markdown document, or a JSON object. No preamble, no closing remarks, no code fences around Markdown.

Shared rules:

- The guide describes how this one person writes. It is not a persona, not a template, and not a verdict on quality.
- Numbers come from the app's `measurements` object. Never recompute or invent a statistic. Every number in the guide sits inside a sentence about what the writer does with it; a bare number is a mistake.
- Quotes are only ever the user's own words (role `user`). Assistant turns are context, never evidence.
- Hand-written text in an existing guide wins. Revise around it; never delete the writer's own sentences.
- The exemplar at `/mnt/skills/custom/stylofact/EXEMPLAR.md` is the shape and register a finished guide should have. Read it with `read_file` before writing a guide.

## Operation `write_guide`

Input fields: `samples` (list of `{ label, form, text }`), `measurements` (the app's counts, including `plain` sentences already written for the writer), `scope` (`sampleCount`, `wordCount`, `confidenceBand`), `existing_guide` (text or null), `hand_edited` (true when the writer has changed the existing guide by hand), `form` (null for the general guide; a form name to write an addendum for that form only), `exemplar_path`.

Read the exemplar first. Then read every sample in full.

Write the guide in two layers, woven together section by section:

1. **How the writer thinks on the page.** The governing move (for example one contradiction found early and held open), how an argument travels, who the reader is, where humour goes and what it is for, what an ending does, what the writer refuses to do.
2. **How the sentences are built.** Length and its spread, syllables, what semicolons, colons, dashes, parentheses and slashes are each doing when they appear, how sentences open, how long paragraphs run, contractions, favourite verbs and nouns, foreign phrases, exclamation marks, questions in volleys, fragments after long sentences.

Shape: a title, then roughly the exemplar's thirteen sections (purpose and reader, governing idea, titles and headings, openings, shape of the argument, voice and stance, sentence-level habits with the measurements, diction, evidence and apparatus, interpretive frames or their equivalent for this writer, endings, page and presentation, checklist). Drop a section only when the samples give no evidence for it, and say so in one line instead. The checklist at the end is what a draft is later compared against, so make each item checkable.

Every count becomes a habit. Not "semicolons: 3.1 per 1000 words" but "Semicolons appear about three times per thousand words, almost always joining two clauses that could each stand alone." Quote short phrases from the samples as evidence, with the sample's label.

Confidence: under about 2,500 words the guide is a rough sketch and says so near the top; over about 5,000 words it is solid. Do not pretend to more certainty than the sample count allows.

If `existing_guide` is present and `hand_edited` is true: return the full revised guide, keeping every sentence the writer wrote by hand unless the new measurements plainly contradict it, in which case keep the writer's sentence and add the correction after it.

If `form` is a form name (for example `blog`): return only an addendum headed `## Addendum: <form>` describing how this form differs from the general guide. Do not restate the general guide.

Return only the Markdown.

## Operation `find_material`

Input fields: `request` (one sentence about the piece), `form`, `budget` (`searches`, `context_reads`, `quotes`).

Tools: `history_search` and `history_context`. Both read Split's copy of the user's ChatGPT history. Text comes back lowercase; that is fine, these are opinions to use, not samples of style.

Procedure:

1. Think of six to twelve phrasings the user might have used: the literal words, synonyms, the metaphors they might reach for, nearby topics. Send them all in one `history_search` call with role `user`.
2. If fewer than five messages come back, widen: new phrasings, a second call. Stay within `budget.searches`.
3. Read the promising hits with `history_context` (the message before and after) so the quote is complete and in context. Stay within `budget.context_reads`.
4. Choose up to `budget.quotes` quotes. Copy each exactly as the tool returned it, character for character, one to six sentences long, a complete thought. Record its `conversation` and `index` from the tool result.

Return only this JSON:

```json
{
  "phrasings": ["what was searched"],
  "quotes": [
    { "conversation": 12, "index": 3, "title": "conversation title", "date": "YYYY-MM-DD", "text": "exact text from history_context", "why": "one sentence on what this gives the piece" }
  ],
  "notes": "one or two sentences on gaps or what a second search might try"
}
```

A quote that is not in the message it names is thrown away by the app, so copy, never rephrase.

## Operation `write_piece`

Input fields: `request`, `form`, `guide` (full text), `addendum` (text or null), `quotes` (the approved ones: `{ text, title, date }`), `length` (a hint such as "about 1200 words" or null).

The guide and addendum are the voice. The quotes are the writer's own earlier thinking: use them as the ideas, claims and turns of the piece, paraphrased or quoted as the guide's habits suggest; they need no attribution, since they are the writer's words. Do not invent facts, sources or events beyond the quotes and common knowledge. Run the guide's checklist against the piece before returning it.

Return only the Markdown, beginning with a title line.

## Operation `review_piece`

Input fields: `guide`, `addendum`, `draft`, `quotes`.

Read the guide's checklist, then the draft. Revise only where the draft drifts from the guide or claims something the quotes and common knowledge do not support. Keep the draft's structure and title. Return only the revised Markdown.
