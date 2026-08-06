# GPT-5.6 OpenAI API research for Stylofact

> Research date: 2026-08-05  
> Scope: current OpenAI first-party documentation and the installed briizOS transport. This is a research note only; it does not change application code.

## Decision in brief

Stylofact should use `POST https://api.openai.com/v1/responses` for GPT-5.6 generation and review calls. The supported model IDs are `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna`; the `gpt-5.6` alias routes to Sol. OpenAI still supports Chat Completions for this family, but recommends Responses for reasoning, tools, and multi-turn work because it has the current agentic capabilities and better reasoning performance. [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model) · [Responses migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)

The only GPT-5.6 `reasoning.effort` strings that Stylofact should send are:

```text
none | low | medium | high | xhigh | max
```

`light` and `ultra` are not valid `reasoning.effort` values. In particular, **Ultra is not a model slug, effort enum, or different endpoint**: it is a multi-agent execution mode. An API implementation of Ultra-like work stays on `/v1/responses`, but requires the beta multi-agent request shape and `OpenAI-Beta: responses_multi_agent=v1` header. [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) · [OpenAI multi-agent guide](https://developers.openai.com/api/docs/guides/responses-multi-agent) · [GPT-5.6 announcement](https://openai.com/index/gpt-5-6/)

## Model profiles and documented capabilities

| Display name | Exact `model` value | API alias | Purpose from OpenAI | Text / image capability | Context window | Maximum output |
|---|---|---|---|---|---:|---:|
| GPT-5.6 Sol | `gpt-5.6-sol` | `gpt-5.6` routes here | Frontier/flagship capability | Text input/output; image input | 1.05M tokens | 128K tokens |
| GPT-5.6 Terra | `gpt-5.6-terra` | — | Balanced intelligence and cost | Text input/output; image input | 1.05M tokens | 128K tokens |
| GPT-5.6 Luna | `gpt-5.6-luna` | — | Cost-sensitive, high-volume work | Text input/output; image input | 1.05M tokens | 128K tokens |

All three are documented as supporting reasoning tokens, function calling, structured output, streaming, and the Responses API. Their model pages list both `/v1/chat/completions` and `/v1/responses`; the latter is the recommended transport for Stylofact’s reasoning and agentic workflow. [OpenAI model catalog](https://developers.openai.com/api/docs/models) · [Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) · [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) · [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)

For briizOS model-profile metadata, the documented image capability means all three should have `supportsVision: true`. The existing `supportsThinking` flag should not be used as the source of truth for OpenAI reasoning: the current runtime detects OpenAI reasoning models directly from the `gpt-5` prefix, while its existing OpenAI profiles use `supportsThinking: false` for a separate Anthropic-oriented feature gate.

## Exact Responses API request shape

Use this standard shape for every normal, single-agent GPT-5.6 request. The only model-specific value is `model`; the effort can be any valid GPT-5.6 effort shown below.

```http
POST https://api.openai.com/v1/responses
Authorization: Bearer $OPENAI_API_KEY
Content-Type: application/json
```

```json
{
  "model": "gpt-5.6-sol",
  "instructions": "Return only the requested JSON object.",
  "input": [
    {
      "role": "user",
      "content": "Create three rewritten alternatives for this source text."
    }
  ],
  "reasoning": {
    "effort": "medium"
  },
  "max_output_tokens": 8192,
  "stream": true
}
```

The direct substitutions are:

| Stylofact model choice | `model` in the JSON body |
|---|---|
| Sol | `gpt-5.6-sol` |
| Terra | `gpt-5.6-terra` |
| Luna | `gpt-5.6-luna` |

In Responses, the conversation lives in `input`, the reasoning configuration is the nested object `reasoning: { "effort": "…" }`, and generated text is delivered in typed `output` items (or the SDK convenience property `response.output_text`). OpenAI’s own GPT-5.6 example uses this exact `model` + `reasoning` + `input` form. [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) · [Responses create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)

`max_output_tokens` is a ceiling for **all generated tokens**: reasoning, visible output, and non-visible formatting. It is not a guaranteed visible-output allocation. If the cap is exhausted while reasoning, the response can have status `incomplete` with `incomplete_details.reason: "max_output_tokens"` before it contains visible text. The family’s documented hard maximum is 128K, but OpenAI recommends allowing enough headroom for reasoning when first tuning a workflow. [OpenAI reasoning guide: controlling costs](https://developers.openai.com/api/docs/guides/reasoning#controlling-costs) · [Sol model reference](https://developers.openai.com/api/docs/models/gpt-5.6-sol)

## The legacy Chat Completions shape is different

Chat Completions remains supported, but it is not an endpoint-name-only substitute. Its input, reasoning key, and response extraction differ:

```http
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer $OPENAI_API_KEY
Content-Type: application/json
```

```json
{
  "model": "gpt-5.6-sol",
  "messages": [
    {
      "role": "developer",
      "content": "Return only the requested JSON object."
    },
    {
      "role": "user",
      "content": "Create three rewritten alternatives for this source text."
    }
  ],
  "reasoning_effort": "medium",
  "max_completion_tokens": 8192,
  "stream": true
}
```

| Concern | Responses (recommended) | Chat Completions (legacy-compatible) |
|---|---|---|
| Endpoint | `/v1/responses` | `/v1/chat/completions` |
| Input field | `input` | `messages` |
| Reasoning field | `reasoning: { effort: "medium" }` | `reasoning_effort: "medium"` |
| Output-token field | `max_output_tokens` | `max_completion_tokens` |
| Text result | `output` items / `output_text` helper | `choices[0].message.content` |

OpenAI explicitly describes Responses as the current API primitive and recommends it for new integrations. [OpenAI migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses) · [Chat Completions reference](https://developers.openai.com/api/reference/resources/chat)

## A precise Stylofact effort menu

The service-side enum and a friendly product menu are not 1:1. This is the recommended display-to-transport mapping:

| Stylofact display label | `reasoning.effort` sent to standard Responses call | Notes |
|---|---|---|
| Fast / No reasoning (optional separate row) | `none` | API-supported baseline for work that does not benefit from reasoning. |
| Light | `low` | `light` is a Stylofact label, not an API value. |
| Medium | `medium` | GPT-5.6’s documented default when omitted. |
| High | `high` | More single-agent reasoning. |
| Extra High | `xhigh` | The API spelling is exactly lowercase `xhigh`, not `extra-high`. |
| Max | `max` | Highest single-agent quality-first effort. |
| Ultra | See the separate multi-agent shape below | Do **not** send `"ultra"` as `reasoning.effort`. |

If the product intentionally calls its lowest setting “Light” and does not expose a no-reasoning choice, map it to `low`, not `none`: that preserves the ordinary user expectation that Light still reasons a little. If the UX instead defines Light to mean “no reasoning,” it may deliberately map Light to `none`, but that is a Stylofact product decision rather than OpenAI terminology.

`minimal` appears in generic API schema material for some reasoning models, but OpenAI’s GPT-5.6-specific migration guidance excludes it from this family’s supported list. Do not expose or send `minimal` for Sol, Terra, or Luna. The documented GPT-5.6 default, when `reasoning.effort` is absent, is `medium`. [OpenAI GPT-5.6 migration guidance](https://developers.openai.com/api/docs/guides/latest-model#update-api-and-model-parameters) · [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning)

`reasoning.mode: "pro"` is another independent setting, not a fourth model name and not the Ultra transport. If later exposed, it can be combined with any valid effort:

```json
"reasoning": {
  "mode": "pro",
  "effort": "medium"
}
```

OpenAI describes Pro as a quality-first execution mode that uses more model work and is independent from `reasoning.effort`. [OpenAI GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model#update-api-and-model-parameters) · [OpenAI reasoning-mode example](https://developers.openai.com/api/docs/guides/reasoning)

## Ultra: the distinct beta Responses shape

OpenAI calls Ultra a multi-agent mode in Codex: it coordinates parallel subagents rather than simply increasing one model’s reasoning effort. In the API, OpenAI describes the equivalent as an **Ultra-like** experience built with the beta Responses multi-agent capability. It stays on `/v1/responses`; there is no `/v1/ultra` endpoint and no `gpt-5.6-*-ultra` model ID. [GPT-5.6 announcement](https://openai.com/index/gpt-5-6/) · [Multi-agent guide](https://developers.openai.com/api/docs/guides/responses-multi-agent)

For raw HTTP, include the beta header and the extra `multi_agent` object:

```http
POST https://api.openai.com/v1/responses
Authorization: Bearer $OPENAI_API_KEY
Content-Type: application/json
OpenAI-Beta: responses_multi_agent=v1
```

```json
{
  "model": "gpt-5.6-sol",
  "instructions": "Delegate independent review dimensions when this improves the result, then synthesize one final answer.",
  "input": "Review these drafts for style accuracy, factual consistency, and output-schema compliance.",
  "reasoning": {
    "effort": "max"
  },
  "multi_agent": {
    "enabled": true,
    "max_concurrent_subagents": 4
  }
}
```

`max_concurrent_subagents: 4` is the deliberate Stylofact choice for a Codex-Ultra-like setting: OpenAI’s GPT-5.6 announcement says Codex Ultra coordinates four agents by default. The raw multi-agent API itself defaults to three and lets the application choose another value. `max` in the body is optional but recommended as the closest single-agent component of an Ultra preset; it remains technically independent from multi-agent orchestration. [GPT-5.6 announcement](https://openai.com/index/gpt-5-6/) · [Multi-agent quickstart](https://developers.openai.com/api/docs/guides/responses-multi-agent#quickstart)

All three GPT-5.6 models are documented as eligible for the beta multi-agent capability. It is not a harmless boolean switch in a standard LangChain call: beta runs return agent-tagged output items and require the app to honor the beta transport rules. In particular, the API itself executes its hosted collaboration actions; the application should only process the developer-defined tool calls it owns. [OpenAI multi-agent guide](https://developers.openai.com/api/docs/guides/responses-multi-agent)

## Current briizOS transport findings

The relevant implementation is [`electron/agent/models.js`](../electron/agent/models.js). The current OpenAI path constructs `@langchain/openai`’s `ChatOpenAI` adapter in lines 178–183 and 253–260.

### 1. Force the Responses API

The installed `@langchain/openai` package is version `1.5.3`. Its `ChatOpenAI` defaults `useResponsesApi` to `false`; its automatic preference list covers selected Pro and Codex names, but not the three GPT-5.6 names. Therefore a normal GPT-5.6 model profile would otherwise retain the Chat Completions transport. Set the constructor field below for all OpenAI reasoning-model calls:

```js
useResponsesApi: true
```

That tells the installed adapter to call the OpenAI Responses client and convert LangChain messages to the Responses `input` array.

### 2. Send a nested `reasoning` object, not constructor `reasoningEffort`

The current code sets `constructorOptions.reasoningEffort = reasoningEffort` at [`electron/agent/models.js:182`](../electron/agent/models.js#L182). Local inspection of the installed adapter shows that this constructor field does not become a request parameter. `reasoningEffort` is only a per-invocation compatibility option there, while constructor configuration reads `reasoning` itself.

The local no-network parameter inspection produced:

```js
new ChatOpenAI({
  model: 'gpt-5.6-sol',
  useResponsesApi: true,
  reasoningEffort: 'max',
}).invocationParams();
// { model: 'gpt-5.6-sol', stream: false, text: {} }

new ChatOpenAI({
  model: 'gpt-5.6-sol',
  useResponsesApi: true,
  reasoning: { effort: 'max' },
}).invocationParams();
// { model: 'gpt-5.6-sol', stream: false, text: {}, reasoning: { effort: 'max' } }
```

For the current constructor-based architecture, the correct configuration is therefore:

```js
if (reasoningEffort) {
  constructorOptions.reasoning = { effort: reasoningEffort };
}
```

With `useResponsesApi: true`, the adapter maps its existing `maxTokens` constructor field to the raw Responses key `max_output_tokens`.

### 3. Keep Ultra separate from the ordinary adapter path

The installed OpenAI/LangChain packages do not contain the `responses_multi_agent` beta surface. An Ultra option should therefore be implemented through a beta-capable OpenAI SDK upgrade or a narrow, audited direct-Responses transport that adds the beta header and handles the agent-tagged response item model. It should not be represented by a fake `reasoningEffort: 'ultra'` value.

## Implementation checklist

1. Seed the three built-in profiles with their exact model IDs, `maxTokens: 128000`, and `supportsVision: true`.
2. Validate the selected standard effort against exactly `none`, `low`, `medium`, `high`, `xhigh`, and `max` before it reaches OpenAI.
3. Force `useResponsesApi: true` for the OpenAI GPT-5.6 path.
4. Replace constructor-level `reasoningEffort` with `reasoning: { effort }`, and keep audit reporting aligned with the actual nested request field.
5. Preserve enough `max_output_tokens` budget for both reasoning and Stylofact’s JSON response; handle `incomplete` responses rather than treating an empty visible output as malformed model JSON.
6. Treat Ultra as a separately implemented, beta-gated multi-agent mode. Do not show it as available until its beta transport and output handling are genuinely wired.

## Primary sources

- [OpenAI: GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI: model catalog](https://developers.openai.com/api/docs/models)
- [OpenAI: GPT-5.6 Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [OpenAI: GPT-5.6 Terra model page](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [OpenAI: GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
- [OpenAI: Reasoning models](https://developers.openai.com/api/docs/guides/reasoning)
- [OpenAI: Migrate to the Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI: Responses API create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI: Multi-agent (beta)](https://developers.openai.com/api/docs/guides/responses-multi-agent)
- [OpenAI: GPT-5.6 announcement](https://openai.com/index/gpt-5-6/)
