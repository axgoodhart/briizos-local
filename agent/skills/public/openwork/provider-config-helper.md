---
name: provider-config-helper
description: Create provider-agnostic OpenCode config blocks and collect required inputs.
---

# Provider Config Helper

Use this skill when the user wants to add a new model provider to `opencode.jsonc` but has not provided all values yet.

## Goal

Produce a valid provider block with placeholders or user-provided values, and set a default model in the format:

`"model": "<PROVIDER_KEY>/<MODEL_KEY>"`

## What to ask for (only missing values)

Ask for only the fields that are unknown:

1. `PROVIDER_KEY` (slug, e.g. `ollama`)
2. `PROVIDER_DISPLAY_NAME` (human-readable)
3. `BASE_URL` (provider endpoint)
4. `MODEL_KEY` (exact model id)
5. `MODEL_DISPLAY_NAME`

Optional only if needed:
- `API_KEY_ENV_VAR` (for auth)
- Extra headers
- Token limits (`context`, `output`)

## Defaults

- Adapter: `"npm": "@ai-sdk/openai-compatible"`
- If no auth is needed, omit `apiKey` and `headers`
- If limits are unknown, omit `limit`

## Output template

Return this JSONC template and fill in known values:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "<PROVIDER_KEY>/<MODEL_KEY>",
  "provider": {
    "<PROVIDER_KEY>": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "<PROVIDER_DISPLAY_NAME>",
      "options": {
        "baseURL": "<BASE_URL>",
        "apiKey": "{env:<API_KEY_ENV_VAR>}",
        "headers": {
          "Authorization": "Bearer {env:<API_KEY_ENV_VAR>}"
        }
      },
      "models": {
        "<MODEL_KEY>": {
          "name": "<MODEL_DISPLAY_NAME>",
          "limit": {
            "context": 200000,
            "output": 65536
          }
        }
      }
    }
  }
}
```

## Editing behavior

When editing `opencode.jsonc`:
- Preserve existing keys and style.
- Merge into existing `provider` if present.
- Do not remove other providers.
- Do not hardcode secrets; always use env placeholders.

## Final response format

- Briefly state what was added/updated.
- List any missing values still required from the user.
- Include the file path changed: `opencode.jsonc`.
