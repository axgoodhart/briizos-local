# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- JavaScript (ES6+) - React frontend, Electron renderer process
- Python 3.12 - LangGraph agent backend (DeerFlow)
- JSX/TSX - React component markup

**Secondary:**
- HTML/CSS - UI styling (Tailwind CSS, custom CSS)
- YAML - Configuration files for agent system

## Runtime

**Environment:**
- Node.js 24 (specified in `.nvmrc`)
- Python 3.12 (specified in `pyproject.toml`)
- Electron 40.1.0 - Desktop application framework

**Package Manager:**
- npm - JavaScript dependencies
- uv - Python dependency manager (implied by uv.lock presence)
- Lockfile: `package-lock.json` (present), `agent/uv.lock` (present)

## Frameworks

**Core:**
- React 18.3.1 - UI framework
- Electron 40.1.0 - Cross-platform desktop application
- Vite 6.0.5 - Build tool and dev server
- FastAPI 0.115.0+ - Backend API gateway

**AI/Agent:**
- LangGraph 1.0.6+ - Graph-based orchestration for agent workflows
- LangChain 1.2.3+ - LLM framework and tools
- LangChain-Anthropic 1.3.4 - Claude integration
- LangChain-OpenAI 1.1.7 - OpenAI integration
- LangChain-DeepSeek 1.0.1 - DeepSeek integration
- LangChain-Google-GenAI 4.2.1 - Google Gemini integration

**3D/Graphics:**
- React Three Fiber 8.18.0 - React-based 3D rendering
- Three.js 0.183.2 - 3D graphics library
- React Three Drei 9.122.0 - 3D helpers/components
- GSAP 3.14.2 - Animation library
- React Three Postprocessing 2.19.1 - Post-processing effects
- OGL 1.0.11 - WebGL library

**UI Components:**
- React-DnD 16.0.1 - Drag-and-drop system
- React-Resizable-Panels 4.1.1 - Resizable panel layouts
- React-Markdown 10.1.0 - Markdown rendering
- Remark-GFM 4.0.1 - GitHub flavored markdown plugin

**Testing:**
- pytest 8.0.0+ - Python test framework
- No frontend test framework detected

**Build/Dev:**
- @vitejs/plugin-react 4.3.4 - Vite React plugin
- concurrently 9.1.0 - Run multiple processes in parallel
- wait-on 8.0.1 - Wait for services to be ready
- ruff 0.14.11+ - Python linter

## Key Dependencies

**Critical (AI/LLM):**
- langgraph 1.0.6+ - Multi-agent orchestration with state management
- langchain 1.2.3+ - Core LLM abstraction and tools
- langchain-anthropic 1.3.4 - Claude models (core to agent system)
- langchain-openai 1.1.7 - OpenAI models (gpt-4, gpt-5 variants)
- langchain-mcp-adapters 0.1.0 - Model Context Protocol integration
- tavily-python 0.7.17+ - Web search capability
- firecrawl-py 1.15.0+ - Web scraping/data extraction
- readabilipy 0.3.0 - Extract readable content from web pages
- markitdown[all,xlsx] 0.0.1a2 - Convert various formats to markdown

**Infrastructure:**
- Firebase 12.8.0 - Authentication & Firestore database (display layer)
- fastapi 0.115.0+ - REST API framework
- uvicorn[standard] 0.34.0+ - ASGI web server
- httpx 0.28.0+ - HTTP client
- kubernetes 30.0.0 - K8s integration for sandbox execution
- agent-sandbox 0.0.19+ - Sandboxed code execution

**Data & Storage:**
- langgraph-checkpoint-sqlite 3.0.3 - LangGraph state persistence
- duckdb 1.4.4+ - Analytics database (used internally)
- langgraph-api 0.7.0-0.8.0 - LangGraph API server
- pydantic 2.12.5+ - Data validation

**Communication & Channels:**
- slack-sdk 3.33.0+ - Slack bot integration (Socket Mode)
- python-telegram-bot 21.0+ - Telegram bot integration
- lark-oapi 1.4.0+ - Feishu/Lark integration
- markdown-to-mrkdwn 0.3.1 - Convert markdown to Slack markdown

**Utilities:**
- openai 6.15.0 - OpenAI SDK (legacy/alternative to langchain)
- face-api.js 0.22.2 - Face detection (Electron app)
- js-yaml 4.1.1 - YAML parsing
- dotenv 0.9.9 - Environment variable loading
- tiktoken 0.8.0 - Token counting for OpenAI models
- pyyaml 6.0.3 - YAML parsing (Python)
- python-multipart 0.0.20 - Multipart form parsing
- markdownify 1.2.2 - HTML to markdown conversion
- sse-starlette 2.1.0 - Server-sent events for FastAPI
- ddgs 9.10.0 - DuckDuckGo search API

## Configuration

**Environment (Frontend - Electron/Vite):**
- Firebase config via `VITE_FIREBASE_*` environment variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Vite config: `vite.config.js` (port 5173, react plugin)
- CSP (Content Security Policy) configured in `electron/main.js`

**Build:**
- Vite output: `dist/` directory
- Electron main: `electron/main.js`
- Entry point: `src/main.jsx`

**Agent (Python Backend):**
- config.yaml - Main agent system configuration (YAML-based, environment variable interpolation)
- `DEER_FLOW_CONFIG_PATH` - Env var to specify custom config location
- Dotenv support for loading `.env` files
- MCP extension configuration via `ExtensionsConfig`
- Model configuration from `config.yaml`
- Tool configuration from `config.yaml`

## Platform Requirements

**Development:**
- Node.js 24
- Python 3.12
- npm or yarn for frontend
- uv for Python backend
- Vite dev server on localhost:5173
- LangGraph API server (for agent backend)

**Production:**
- Electron packaged application (macOS, Windows, Linux)
- Python 3.12 runtime for agent backend
- Firestore database (Google Cloud)
- Optional: Kubernetes cluster for sandbox execution
- Optional: Google Cloud for infrastructure

## CSP & Security

**Content Security Policy (Electron):**
- Allows self, unsafe-inline, unsafe-eval (development relaxed)
- Script sources: CDN resources (Tailwind, Cloudflare, Google Fonts, jsdelivr, googleapis)
- Connect sources: localhost, Firebase, OpenAI API, Anthropic API, Google Generative AI, Open-Meteo, Google APIs

---

*Stack analysis: 2026-03-25*
