# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

**LLM Models (via LangChain):**
- Anthropic Claude - Primary model for agent reasoning
  - SDK: `langchain-anthropic` 1.3.4+
  - Configured in: `agent/src/models.py`
  - Vision support: Enabled (model-dependent)
  - Auth: API key via config.yaml or environment variables

- OpenAI (GPT-4, GPT-5, o1, o4 variants)
  - SDK: `langchain-openai` 1.1.7+
  - Configured in: Agent model config
  - Vision support: Yes
  - Auth: API key via config/environment

- Google Gemini
  - SDK: `langchain-google-genai` 4.2.1+
  - Auth: API key via config/environment

- DeepSeek
  - SDK: `langchain-deepseek` 1.0.1+
  - Auth: API key via config/environment

**Web Search & Data Extraction:**
- Tavily Search API - Web search capability
  - SDK: `tavily-python` 0.7.17+
  - Implementation: `agent/src/community/tavily/tools.py`
  - Config key: `web_search` in config.yaml
  - Auth: API key from tool config
  - Configurable: `max_results` parameter

- Firecrawl - Web scraping and data extraction
  - SDK: `firecrawl-py` 1.15.0+
  - Implementation: `agent/src/community/firecrawl/tools.py`
  - Config key: `web_search` in config.yaml
  - Auth: API key from tool config
  - Features: Web page scraping, content extraction

- Jina AI Reader - Web content extraction
  - SDK: Custom HTTP client in `agent/src/community/jina_ai/jina_client.py`
  - Endpoint: `https://r.jina.ai/`
  - Auth: `JINA_API_KEY` environment variable (optional, rate limited without key)
  - Features: HTML/markdown extraction, configurable timeout

- InfoQuest (BytePlus) - Web search and fetch
  - SDK: Custom client in `agent/src/community/infoquest/infoquest_client.py`
  - Auth: `INFOQUEST_API_KEY` environment variable
  - Features: Time-range search, configurable fetch timeout

- DuckDuckGo Search
  - SDK: `ddgs` 9.10.0+
  - Fallback option, no auth required

- Open-Meteo Weather API
  - Endpoint: `https://api.open-meteo.com/v1/forecast`
  - No authentication required
  - Used in: `src/App.jsx` for weather display
  - Parameters: latitude, longitude, current weather, temperature unit

## Data Storage

**Databases:**
- Firebase Firestore (Google Cloud)
  - Connection: Cloud-managed via Firebase config
  - Client: `firebase` SDK 12.8.0
  - Collections (user-scoped):
    - `users/{uid}/panels` - Notes (type='note')
    - `users/{uid}/tasks` - Task data
    - `users/{uid}/events` - Schedule events
    - `users/{uid}/organizer` - Projects (type='project')
  - Desktop-only collections:
    - `users/{uid}/desktopChatMessages`
    - `users/{uid}/desktopSessions`
    - `users/{uid}/desktopSelectedFiles`
    - `users/{uid}/desktopSettings` (config, layout subdocs)
    - `users/{uid}/desktopLogs`
  - Purpose: Display layer and cross-deployment sync (Local ↔ Web)
  - Auth: Email/password via Firebase Auth
  - Libraries: `firebase` 12.8.0 with persistent local cache

**Orchestrator Database:**
- SQLite (Local only)
  - Path: `agent/data/orchestrator.db`
  - Client: Python sqlite3 (built-in)
  - Purpose: Agent coordination backbone (append-only event pattern)
  - Schema includes:
    - `jobs` table - Agent job tracking
    - `events` table - Canonical event log
    - `results` table - Job outcomes
  - Features: Thread-local connections, WAL mode, foreign keys enabled

**File Storage:**
- Local filesystem only
  - Desktop app: Electron file API
  - Agent: File I/O via Python
  - No cloud file storage integration detected

**Analytics/Caching:**
- DuckDB 1.4.4+ - Analytics queries (internal use)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (email/password)
  - Implementation: `src/context/AuthContext.jsx`, `src/lib/firebase.js`
  - Sign-in method: Email/password only
  - Persistence: Browser local storage with fallback to in-memory
  - Timeout: 20-second request timeout
  - Auto-account creation: From login error fallback
  - Error handling: Detailed error messages for common cases

**Identity Services:**
- Google APIs
  - OAuth potentially via Firebase
  - Used for Google Sheets, Google Drive, Google Generative AI

- GitHub
  - Potential OAuth for MCP integration
  - Referenced in: `agent/src/gateway/routers/mcp.py` (GITHUB_TOKEN)
  - Purpose: Potential code/repo access

## Communication Channels

**Incoming Channels (via ChannelManager):**
- Slack
  - SDK: `slack-sdk` 3.33.0+
  - Connection: Socket Mode (WebSocket, no public IP required)
  - Config location: `config.yaml` under `channels.slack`
  - Required config keys:
    - `bot_token` - Bot User OAuth Token (xoxb-...)
    - `app_token` - App-Level Token (xapp-...) for Socket Mode
    - `allowed_users` (optional) - List of allowed Slack user IDs
  - Implementation: `agent/src/channels/slack.py`
  - Features: Message threading, file uploads, emoji reactions, markdown conversion

- Telegram
  - SDK: `python-telegram-bot` 21.0+
  - Connection: Long-polling (no public IP required)
  - Config location: `config.yaml` under `channels.telegram`
  - Required config keys:
    - `bot_token` - Telegram Bot API token
    - `allowed_users` (optional) - List of allowed Telegram user IDs
  - Implementation: `agent/src/channels/telegram.py`
  - Features: Message threading via message ID tracking

- Feishu/Lark
  - SDK: `lark-oapi` 1.4.0+
  - Connection: WebSocket long-connection (no public IP)
  - Config location: `config.yaml` under `channels.feishu`
  - Required config keys:
    - `app_id` - Feishu app ID
    - `app_secret` - Feishu app secret
    - `verification_token` (optional) - Event verification token
  - Implementation: `agent/src/channels/feishu.py`
  - Features: Message reactions, file/image uploads, threaded replies

## Monitoring & Observability

**Error Tracking:**
- Not detected in production build
- Development: Browser console logging via `src/lib/logger.js`

**Logs:**
- Frontend: Custom logger to LogPanel (`src/lib/logger.js`)
  - Categories: auth, firestore, sync, ui, agent, etc.
  - Levels: debug, info, warn, error
  - Output: In-app LogPanel and Firestore (`users/{uid}/desktopLogs`)

- Backend (Agent):
  - Python logging via `logging` module
  - LangSmith integration via `LANGSMITH_API_KEY` (optional)
  - Configurable via `src/config/tracing_config.py`

## CI/CD & Deployment

**Hosting:**
- Electron Desktop App (macOS, Windows, Linux)
- Python LangGraph agent backend (local or cloud)
- Google Cloud (Firebase, optionally Firestore, Cloud Run)

**CI Pipeline:**
- Not detected (GitHub Actions not found)

**Kubernetes Integration:**
- Sandbox execution via Kubernetes client
  - SDK: `kubernetes` 30.0.0+
  - Purpose: Execute subagent jobs in sandboxed containers
  - Kubeconfig support in: `agent/src/config/provisioner_kubeconfig.py`

## Environment Configuration

**Required env vars (Frontend - Vite):**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Required env vars (Agent/Backend):**
- Model API Keys (one required):
  - `ANTHROPIC_API_KEY` - Claude models
  - `OPENAI_API_KEY` - OpenAI models
  - `GOOGLE_API_KEY` - Google Gemini
  - `DEEPSEEK_API_KEY` - DeepSeek models

- Tool API Keys (optional, feature-dependent):
  - `TAVILY_API_KEY` - Web search
  - `FIRECRAWL_API_KEY` - Web scraping
  - `JINA_API_KEY` - Web content extraction
  - `INFOQUEST_API_KEY` - BytePlus web search
  - `LANGSMITH_API_KEY` - LangSmith tracing

- Channel Config (optional):
  - Slack: `bot_token`, `app_token` (in config.yaml)
  - Telegram: `bot_token` (in config.yaml)
  - Feishu: `app_id`, `app_secret`, `verification_token` (in config.yaml)

- Misc:
  - `DEER_FLOW_CONFIG_PATH` - Path to config.yaml (optional)
  - `GITHUB_TOKEN` - MCP integration for code access
  - `NODE_ENV` - Development/production flag

**Secrets location:**
- Vite: Environment variables injected at build time
- Python: `dotenv` library loads from `.env` file (gitignored)
- config.yaml: Supports environment variable interpolation via `$VAR_NAME` syntax
- Electron/Desktop: IPC bridge to access API keys from secure storage

## Webhooks & Callbacks

**Incoming:**
- Slack/Telegram/Feishu: Message events via channel service
- No explicit webhook endpoints detected (channels use polling or socket modes)

**Outgoing:**
- Agent → Firestore: Job status updates
- Agent → Slack/Telegram/Feishu: Bot messages/replies
- No external webhook calls detected

## MCP (Model Context Protocol)

**Integration:**
- SDK: `langchain-mcp-adapters` 0.1.0+
- Config: ExtensionsConfig in agent system
- Features:
  - Tool discovery and caching
  - Environment variable interpolation for tool config
  - Lazy initialization in LangGraph Server
- Example: GitHub MCP for code access via GITHUB_TOKEN

---

*Integration audit: 2026-03-25*
