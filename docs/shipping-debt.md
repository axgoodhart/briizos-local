# Shipping debt

Intentional shortcuts that are fine while briizOS runs from `npm run dev` but
must change before it is distributed as a packaged app. Each entry names the
file where the shortcut lives so the fix is a lookup, not an archaeology dig.

Add an entry every time a dev-only decision is made. Remove it when the
shipped-grade version lands.

Rule of thumb used to decide what goes here: decisions that are a single file
behind a clean seam can be deferred and are listed below. Decisions that leak
into architecture (data schema, IPC contract, security posture, user-facing
naming) are built to shipped standards immediately and never appear here.

## Open

### 1. Codex CLI is taken from the user's machine, not bundled
- **Where:** `electron/codex-provider.js`, `resolveCodexBinary()` and `executableCandidates()`
- **Today:** probes every `codex` on PATH plus nvm and Homebrew locations, runs
  `--version` on each, and picks the newest one that is at least 0.100. A
  packaged build logs a warning pointing at this file.
- **Why deferred:** during development we want the user's existing ChatGPT
  login and their current Codex install.
- **Ship-grade fix:** add `@openai/codex` as a pinned npm dependency, copy its
  platform binary into the bundle via electron-builder `extraResources`, and
  resolve it from `process.resourcesPath` when `app.isPackaged`. Keep
  `CODEX_BINARY` as the only override. Delete the PATH walk.
- **Watch out:** the binary must be outside `app.asar`, keep its executable
  bit, and be included in code signing and notarization.

### 2. Codex shares the user's global `~/.codex` state
- **Where:** `electron/codex-provider.js`, the `spawn()` call in `_start()`
- **Today:** the app-server inherits `process.env`, so it reads the user's own
  `CODEX_HOME` (`~/.codex`), including their login, config, and thread history.
- **Ship-grade fix:** pass an explicit `env` and set `CODEX_HOME` to a
  directory under `app.getPath('userData')` so briizOS has its own login and
  config and cannot be affected by, or affect, the user's CLI setup.
- **Trade-off:** users then sign in inside briizOS even if the CLI is already
  signed in. That is the correct isolation for a shipped product.

### 3. Child processes inherit the full Electron environment
- **Where:** `electron/codex-provider.js` and any other `spawn`/`exec` in `electron/`
- **Today:** `env: process.env`.
- **Ship-grade fix:** build a minimal env (PATH, HOME, locale, plus explicit
  variables the tool needs). Prevents dev-machine variables such as API keys or
  nvm paths from leaking into subprocesses and prevents "works in the terminal,
  fails from Finder" bugs, which is exactly what caused the 2026-09-02 Codex
  exit-code-2 auth failure.

### 4. No packaging pipeline exists
- **Where:** `package.json` has only `vite build`; there is no electron-builder
  or Forge configuration.
- **Ship-grade fix:** add electron-builder config that produces a signed,
  notarized `.app` and `.dmg`, with `extraResources` for bundled binaries.
- **Why it matters now, not later:** a packaged build is the only way to
  surface the class of bugs that depend on how the app is launched. Doing a
  throwaway packaged build early, even unsigned, is cheap insurance.

### 5. Code signing, notarization, auto-update, crash reporting
- **Where:** nothing yet.
- **Ship-grade fix:** Apple Developer ID certificate, `notarytool` in the
  build, an update feed (electron-updater), and a crash reporter. All bolt-on;
  do them in the packaging milestone alongside item 4.

### 6. Logs go only to the dev terminal
- **Where:** `electron/logger.js`
- **Today:** everything writes to stdout/stderr of the `npm run dev` terminal.
  In a packaged app there is no terminal, so warnings such as the Codex
  binary-selection warning are invisible.
- **Ship-grade fix:** keep `logger.js` as the single choke point and add a
  rotating file sink under `app.getPath('logs')` when `app.isPackaged`.

## Resolved

_(none yet)_
