# Stylofact — quarantined

Stylofact (the writing-voice project feature: projects, sources, artifacts,
runs, corpora, and thematic-extraction retrieval) was removed from the app.
Every dedicated Stylofact file was moved here unchanged, preserving its
original repo-relative path, so the feature can be restored by moving the
files back and re-adding the integration points listed below.

## Files in this folder

| Quarantined path | Original path |
| --- | --- |
| `src/components/stylofact/` | `src/components/stylofact/` (panel UI + hook) |
| `src/lib/stylofactMetrics.js` | `src/lib/stylofactMetrics.js` |
| `electron/stylofact-corpus/` | `electron/stylofact-corpus/` (corpus service, parser, retrieval, worker) |
| `electron/local-data/schema/007_stylofact.sql` | `electron/local-data/schema/007_stylofact.sql` |
| `electron/local-data/schema/013_stylofact_corpus.sql` | `electron/local-data/schema/013_stylofact_corpus.sql` |
| `tests/stylofact-corpus/` | `tests/stylofact-corpus/` |
| `agent/skills/custom/stylofact/` | `agent/skills/custom/stylofact/` (agent skill) |

## Integration points that were removed (would need re-adding to restore)

- `package.json` — `test:stylofact-corpus`, `test:stylofact-semantic`, `benchmark:stylofact-corpus` scripts
- `electron/main.js` — `StylofactCorpusService` construction/shutdown, `stylofact: true` in `DEFAULT_SKILLS_CONFIG`
- `electron/preload.js` — `localData.stylofact.*` renderer API
- `electron/local-data-ipc.js` — `local-data:stylofact:*` channels and handlers (plus the `dialog`/`corpusService` parameters they used)
- `electron/local-data-service.js` — the "Stylofact" section (projects/sources/artifacts/runs/corpora/retrieval methods) and its constants
- `electron/agent/tools.js` — `stylofact_search_history` / `stylofact_fetch_context` tools, `stylofact_projects` query domain, corpus-service setter
- `electron/agent/lead-agent.js`, `electron/agent/index.js` — `setStylofactCorpusService` plumbing and `stylofact_*` runtime config passthrough
- `electron/agent/data-catalog.js` — `stylofact_projects` data object and the `stylofact` modality slice (`DATA-CATALOG.md` is generated from it)
- `src/components/InteractionPanel.jsx` — the Stylofact modality and panel mount
- `src/app.css` — `.stylofact-container` rules

## Notes

- Existing databases keep their applied `007`/`013` rows in `schema_migrations`;
  the migration runner skips missing files, so startup is unaffected. Fresh
  databases simply never create the stylofact tables. Existing stylofact
  tables/data in a user database are left in place (inert).
- `014_ai_turn_labels.sql` mentions Stylofact in a comment; it was left
  untouched because editing an applied migration changes its checksum and
  fails startup.
