# briizOS.Local — Development Rules: *Claude, Codex, Mistral, Muse, and Kimi  must verbally acknowledge reading this file at the start of every session.*



## important note:
[user] is not a software dev, they are a product designer. Their input comes from time spent working to conceptualize function+form factor. Your work must:

– Verify that the input is sufficient to understand the entire scope of what is being requested by articulating your understanding.
– Consider the current stack for implementation that maintains fluid reliable interaction.
– Appraise the user in specific but technically-bite-sized terms of the implementation choices and what that means for the reliability/visibility/footprint of the feature.

--> When a task is completed, inform them of what works differently in the app ***so that they can check to make sure it does indeed work by using it themselves.*** Then briefly explain how it was implemented and what files contain those changes.

Provide explanations in succinct bullet lists, but never use insider shorthand.







## General Design Principles

– Style
>> Keep one CSS monolith: src/AppCombined.css. It contains the shared rules plus named :root[data-theme] sections for the built-in themes; a theme is never a complete duplicate of the app stylesheet. Preserve matching selectors, cascade order, states, and conditions. Do not split styles into per-component files or add literal appearance values inline. src/App.css is only a compatibility entry. Theme Studio and Chromap work from the same master stylesheet and the active theme's differences. See docs/theme-authoring.md.
>>> Do not "normalize" BriizOS toward Material Design, Fluent, macOS, iOS, or common web dashboard aesthetics. BriizOS has its own visual language.
>> Visual density is a defining characteristic of BriizOS. Space is valuable. Do not increase padding, margins, gutters, row heights, or control sizes unless the mockup explicitly calls for it or there is a demonstrated usability issue.
>> Use glyph fonts for icons, preferably SF Symbols. There is a folder in the briizos repo root called "SFSymbiols" for you to reference. If you notice any svg rendered icons, change them to an SF Symbol icon. 

- Specifications, Plans, and Execution
>> The user's Photoshop mockups are the canonical design specification. Match their spacing, proportions, density, and hierarchy faithfully. Do not reinterpret or "improve" the layout using generic UI best practices.
>>> When the implementation and the mockup differ, assume the implementation is wrong until proven otherwise.
>> There is no v1. There is no "first iteration". There is no 'working example.' Requests need to be achieved in full as the first goal. 
>>> Spec logic that is based on ideas of "simplicity," "lightweight", "no additional dependencies" are the wrong direction. You do not prioritize NOT doing things just because it adds to the codebase.



## Hard Rules

### 1. Everything gets logged to the Log Panel

Every meaningful action in the app — persistent state changes, network requests/AI calls, Database or Firestore reads/writes, task automation steps, errors, — must produce a log entry visible in the LogPanel (`src/components/LogPanel.jsx`). 

Use the renderer logger (`src/lib/logger.js`) with an appropriate category and level. If an action doesn't show up in the log panel, it's a mistake and an incomplete implementation.

Here is an example implemented for location services issues demonstrating an A+ level of depth and effort in preparing for logs to surface with contextual transparency for users who are not technically experienced: 

> `11:51 PM - Header weather
weather.location | Location Services did not answer within 8 seconds, so only the header weather will use approximate coordinates for America/Los_Angeles. Chat, files, screen memory, and task automation are unaffected. 
> > App session
>>> ses_1785567060367_emtz3: Location Error / Timeout expired  / Error Code: 3 /  Location Failure Kind: timeout / Result: Fallback
>>>> Fallback Latitude: 34.0522 / Fallback Longitude:  -118.2437
>>>>> Next Step:  No action is required unless exact local weather matters; macOS Location Services can be reviewed in System Settings.`


### 3. Two-layer problem resolution

Every bug or error must be addressed at two levels:

1. **Symptom + cause**: Fix the immediate problem. Identify what broke and why, then apply the direct fix.
2. **Code hygiene**: Treat the bug as a signal. Ask why it was possible in the first place — missing version pins, absent error boundaries, no validation, unsafe assumptions, lack of types, etc. Apply the deeper structural fix that prevents the entire class of problem from recurring.

A fix that only addresses layer 1 is incomplete. If the deeper fix is too large for the current scope, document it as a TODO with rationale.


-----------------------------------------------------------------------

# Agent Preferences
- Do not run build, test, lint, or other invocations / commands intended to double check work unless explicitly requested by the user.

<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture / trace questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->



# briizOS.Local — Development Rules: ***Claude, Codex, Mistral, Muse, and Kimi  must verbally acknowledge reading this file at the start of every session.*** Verify having done so by including the word "Crystalloid" in the beginning of your work.








<ignore> ### 2. ~~Honor the SyncContract~~ [IGNORE FOR NOW]

~~The SyncContract defines how ~~data flows between Firestore and the local app. It lives at~~

~~`/Users/alex/Documents/Cufolio/briizOS/SyncContract.md` (parent directory, shared between Local and Web repos)~~

~~It is referenced by `src/lib/firestore.js` and `src/lib/syncAdapters.js`.~~

~~**At the start of every session**, read the SyncContract before making changes to any sync, Firestore, or data persistence code. Any change to tasks, organizer, calendar, notes, or app state must comply with it. See §2 (hard invariants, incl. prohibited legacy aliases) and §§4–5 (read/write rules) for compliance gates.~~
</ignore>
