const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const Database = require('better-sqlite3');
const v = require('./local-data/validation');
const { FOREST_MAX_PROJECTS, FOREST_MAX_FILES_PER_PROJECT } = require('./local-data/limits');
const { BUILT_IN_MODELS } = require('./built-in-models');
const { validateThemeLibrary } = require('./theme-library-validation');

const TASK_STATUSES = [
  'pending', 'created', 'running', 'in_progress', 'active', 'waiting',
  'deferred', 'completed', 'cancelled', 'blocked',
];
const TASK_PRIORITIES = ['low', 'normal', 'medium', 'high', 'urgent'];
const ORGANIZER_TYPES = ['note', 'project', 'event', 'timer'];
const CONTINUITY_DOMAINS = new Set(['tasks', 'organizer', 'retainedText']);
const SETTING_KEYS = new Set([
  'ui_theme',
  'ui_theme_library',
  'chat_config',
  'actiondeck_panel_settings',
  'selected_model',
  'suggestions_enabled',
  'agent_config',
  'skills_config',
  'studio_video_url',
  'studio_website_url',
  'studio_replicate_url',
  'studio_suno_url',
  'studio_dalle_url',
  'studio_ideogram_url',
  'studio_myaudio_url',
  'studio_briizclerk_url',
]);
const BRIIZTORM_KEYS = new Set(['projects', 'theme', 'flightSettings', 'flightPresets']);
const COMMAND_STATUSES = ['accepted', 'queued', 'running', 'waiting_for_user', 'completed', 'failed', 'cancelled', 'expired', 'rejected'];
const RUN_STATUSES = new Set(COMMAND_STATUSES);
const TERMINAL_RUN_STATUSES = new Set(['completed', 'failed', 'cancelled', 'expired', 'rejected']);
const SHARED_TEXT_TYPES = ['task', 'note', 'project', 'event', 'timer', 'retained_text'];
const STYLOFACT_STAGES = ['voice', 'theme', 'review', 'blueprint', 'generate', 'complete'];
const STYLOFACT_APPROVAL_MODES = ['manual', 'automatic'];
const STYLOFACT_PROFILE_CHOICES = ['primary', 'review'];
const STYLOFACT_SOURCE_ROLES = ['style', 'thematic'];
const STYLOFACT_SOURCE_ORIGINS = ['paste', 'drop', 'import'];

function now() {
  return Date.now();
}

function id() {
  return crypto.randomUUID();
}

function toBooleanRow(row, fields) {
  if (!row) return row;
  const result = { ...row };
  fields.forEach((field) => {
    if (field in result) result[field] = result[field] === 1;
  });
  return result;
}

class LocalDataService extends EventEmitter {
  constructor({ databasePath, safeStorage, logger, migrationsPath } = {}) {
    super();
    if (!databasePath) throw new Error('LocalDataService requires a databasePath');
    this.databasePath = databasePath;
    this.safeStorage = safeStorage;
    this.logger = logger;
    this.migrationsPath = migrationsPath || path.join(__dirname, 'local-data', 'schema');
    this.db = null;
  }

  initialize() {
    if (this.db) return this.getStatus();
    fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
    this.db = new Database(this.databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('busy_timeout = 5000');

    try {
      this._runMigrations();
      this._ensureDeviceIdentity();
      const status = this.getStatus();
      const availableRecordTables = this.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type = 'table' AND name IN ('messages', 'ai_turn_audit_events')
        ORDER BY name
      `).all().map((row) => row.name);
      this.logger?.info?.(
        'local-data',
        'Local database opened and all migrations completed. User-visible chat messages and full developer AI request/response records can now be written.',
        {
          databasePath: this.databasePath,
          schemaVersion: status.schemaVersion,
          storageGeneration: status.storageGeneration,
          writableRecordTables: availableRecordTables,
          evidence: {
            databaseOpen: !!this.db?.open,
            migrationsCompletedThrough: status.schemaVersion,
            userVisibleChatTable: availableRecordTables.includes('messages'),
            developerAiAuditTable: availableRecordTables.includes('ai_turn_audit_events'),
          },
        },
      );
      return status;
    } catch (error) {
      this.close();
      throw error;
    }
  }

  _assertReady() {
    if (!this.db || !this.db.open) v.fail('NOT_READY', 'Local data is not ready');
  }

  _runMigrations() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `);

    const files = fs.readdirSync(this.migrationsPath)
      .filter((name) => /^\d+_[A-Za-z0-9_-]+\.sql$/.test(name))
      .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

    for (const name of files) {
      const version = Number.parseInt(name, 10);
      const sql = fs.readFileSync(path.join(this.migrationsPath, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const applied = this.db.prepare('SELECT checksum FROM schema_migrations WHERE version = ?').get(version);
      if (applied) {
        if (applied.checksum !== checksum) {
          throw new Error(`Migration ${name} changed after it was applied`);
        }
        continue;
      }

      this.db.transaction(() => {
        this.db.exec(sql);
        this.db.prepare(`
          INSERT INTO schema_migrations (version, name, checksum, applied_at)
          VALUES (?, ?, ?, ?)
        `).run(version, name, checksum, now());
      })();
    }
  }

  _ensureDeviceIdentity() {
    const existing = this.db.prepare('SELECT device_id FROM device_identity WHERE singleton_id = 1').get();
    if (existing) return;
    const timestamp = now();
    this.db.prepare(`
      INSERT INTO device_identity (singleton_id, device_id, label, created_at, updated_at)
      VALUES (1, ?, ?, ?, ?)
    `).run(id(), os.hostname() || 'briizOS Mac', timestamp, timestamp);
  }

  getStatus() {
    this._assertReady();
    const generation = this.db.prepare("SELECT value FROM app_meta WHERE key = 'storage_generation'").get();
    const migration = this.db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get();
    return {
      ready: true,
      storageGeneration: Number(generation?.value || 0),
      schemaVersion: migration?.version || 0,
    };
  }

  getDomainRevisions() {
    this._assertReady();
    return this.db.prepare('SELECT domain, revision, updated_at FROM domain_revisions ORDER BY domain').all();
  }

  _jsonValue(value, label, maxBytes = 1000000) {
    let json;
    try {
      json = JSON.stringify(value);
    } catch {
      v.fail('INVALID_INPUT', `${label} must be JSON-compatible`);
    }
    if (json === undefined || Buffer.byteLength(json, 'utf8') > maxBytes) {
      v.fail('INVALID_INPUT', `${label} is too large or invalid`);
    }
    return json;
  }

  _validateSetting(key, value) {
    if (!SETTING_KEYS.has(key)) v.fail('INVALID_INPUT', 'Unsupported setting key');
    if (key === 'ui_theme') return v.string(value, key, { required: true, max: 100 });
    if (key === 'ui_theme_library') return validateThemeLibrary(value);
    if (key === 'selected_model') return v.string(value, key, { nullable: true, max: 200 });
    if (key === 'suggestions_enabled') return v.boolean(value, key);
    if (key.endsWith('_url')) {
      const candidate = v.string(value, key, { max: 2000 });
      if (candidate && !/^https?:\/\//i.test(candidate)) v.fail('INVALID_INPUT', `${key} must be an HTTP URL`);
      return candidate;
    }
    if (key === 'agent_config') {
      v.object(value, key, ['permissions', 'memory']);
      const normalizeSurface = (surface, label) => {
        v.object(surface, label, ['mode', 'blacklist']);
        v.object(surface.blacklist, `${label}.blacklist`, ['paths', 'filetypes']);
        return {
          mode: v.oneOf(surface.mode, `${label}.mode`, ['ask-always', 'ask-destructive', 'no-asking']),
          blacklist: {
            paths: v.stringArray(surface.blacklist.paths, `${label}.blacklist.paths`, { maxItems: 500, maxLength: 4096 }),
            filetypes: v.stringArray(surface.blacklist.filetypes, `${label}.blacklist.filetypes`, { maxItems: 200, maxLength: 100 }),
          },
        };
      };
      v.object(value.permissions, 'agent_config.permissions', ['chat', 'task']);
      v.object(value.memory, 'agent_config.memory', ['chunksToInclude']);
      return {
        permissions: {
          chat: normalizeSurface(value.permissions.chat, 'agent_config.permissions.chat'),
          task: normalizeSurface(value.permissions.task, 'agent_config.permissions.task'),
        },
        memory: {
          chunksToInclude: v.integer(value.memory.chunksToInclude, 'agent_config.memory.chunksToInclude', { min: 1, max: 20 }),
        },
      };
    }
    if (key === 'skills_config') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 500) {
        v.fail('INVALID_INPUT', 'skills_config must be a skill map');
      }
      const normalized = {};
      Object.entries(value).forEach(([name, enabled]) => {
        normalized[v.string(name, 'skill name', { required: true, max: 200 })] = v.boolean(enabled, `skill ${name}`);
      });
      return normalized;
    }
    if (key === 'actiondeck_panel_settings') {
      v.object(value, key, ['filters', 'startAs', 'lastUsedView', 'pinToCurrentLocation', 'pinnedPosition', 'headerBg']);
      return value;
    }
    if (key === 'chat_config') {
      v.object(value, key, ['provider', 'providers', 'snapshots', 'chatBackground', 'chatBgBlur', 'themeChatBackgrounds']);
      return value;
    }
    return value;
  }

  listSettings() {
    this._assertReady();
    const result = {};
    this.db.prepare('SELECT key, value_json FROM settings ORDER BY key').all().forEach((row) => {
      if (SETTING_KEYS.has(row.key)) result[row.key] = JSON.parse(row.value_json);
    });
    return result;
  }

  getSetting(key) {
    this._assertReady();
    key = v.string(key, 'setting key', { required: true, max: 100 });
    if (!SETTING_KEYS.has(key)) v.fail('INVALID_INPUT', 'Unsupported setting key');
    const row = this.db.prepare('SELECT value_json, revision FROM settings WHERE key = ?').get(key);
    return row ? { key, value: JSON.parse(row.value_json), revision: row.revision } : null;
  }

  setSetting(key, value) {
    key = v.string(key, 'setting key', { required: true, max: 100 });
    const normalized = this._validateSetting(key, value);
    const valueJson = this._jsonValue(normalized, key, 2000000);
    this._assertReady();
    const existing = this.db.prepare(`
      SELECT key, value_json, revision, updated_at
      FROM settings WHERE key = ?
    `).get(key);
    if (existing?.value_json === valueJson) {
      return {
        row: {
          key: existing.key,
          value: JSON.parse(existing.value_json),
          revision: existing.revision,
          updated_at: existing.updated_at,
        },
        unchanged: true,
      };
    }
    return this._write('settings', (timestamp) => {
      this.db.prepare(`
        INSERT INTO settings (key, value_json, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at,
          revision = settings.revision + 1
      `).run(key, valueJson, timestamp, timestamp);
      const row = this.db.prepare('SELECT key, value_json, revision, updated_at FROM settings WHERE key = ?').get(key);
      return { row: { key: row.key, value: JSON.parse(row.value_json), revision: row.revision, updated_at: row.updated_at } };
    }, { settingKeys: [key] });
  }

  ensureDefaultModelProfiles() {
    this._assertReady();
    const existing = new Map(this.db.prepare(`
      SELECT name, provider, model, settings_json, deleted_at FROM model_profiles
    `).all().map((row) => [row.name, row]));
    const obsoleteSeeds = ['gemini-2.5-flash', 'claude-sonnet-4-5', 'gpt-5.4'];
    const needsUpdate = BUILT_IN_MODELS.some((profile) => {
      const row = existing.get(profile.name);
      const settings = JSON.stringify({
        displayName: profile.displayName,
        adapter: profile.provider === 'claude' ? 'langchain_anthropic:ChatAnthropic'
          : profile.provider === 'openai' ? 'langchain_openai:ChatOpenAI'
            : 'langchain_google_genai:ChatGoogleGenerativeAI',
        maxTokens: profile.maxTokens,
        supportsVision: profile.supportsVision,
        supportsThinking: profile.supportsThinking,
        thinking: profile.thinking || null,
      });
      return !row || row.deleted_at != null || row.provider !== profile.provider
        || row.model !== profile.model || row.settings_json !== settings;
    }) || obsoleteSeeds.some((name) => existing.get(name)?.deleted_at == null);
    if (!needsUpdate) return this.listModelProfiles();
    return this._write('settings', (timestamp) => {
      BUILT_IN_MODELS.forEach((profile, index) => {
        this.db.prepare(`
          INSERT INTO model_profiles (
            id, name, provider, model, settings_json, is_default, created_at, updated_at, revision
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT(name) DO UPDATE SET provider = excluded.provider, model = excluded.model,
            settings_json = excluded.settings_json, is_default = excluded.is_default,
            updated_at = excluded.updated_at, revision = model_profiles.revision + 1, deleted_at = NULL
        `).run(`builtin:${profile.name}`, profile.name, profile.provider, profile.model, JSON.stringify({
          displayName: profile.displayName,
          adapter: profile.provider === 'claude' ? 'langchain_anthropic:ChatAnthropic'
            : profile.provider === 'openai' ? 'langchain_openai:ChatOpenAI'
              : 'langchain_google_genai:ChatGoogleGenerativeAI',
          maxTokens: profile.maxTokens,
          supportsVision: profile.supportsVision,
          supportsThinking: profile.supportsThinking,
          thinking: profile.thinking || null,
        }), index === 0 ? 1 : 0, timestamp, timestamp);
      });
      this.db.prepare(`UPDATE model_profiles SET deleted_at = ?, updated_at = ?, revision = revision + 1
        WHERE name IN ('gemini-2.5-flash', 'claude-sonnet-4-5', 'gpt-5.4') AND deleted_at IS NULL`)
        .run(timestamp, timestamp);
      return { rows: this.listModelProfiles() };
    });
  }

  listModelProfiles() {
    this._assertReady();
    return this.db.prepare(`
      SELECT id, name, provider, model, settings_json, is_default, revision
      FROM model_profiles WHERE deleted_at IS NULL ORDER BY is_default DESC, name
    `).all().map((row) => ({
      id: row.id,
      name: row.name,
      display_name: JSON.parse(row.settings_json).displayName || row.name,
      provider: row.provider,
      model: row.model,
      isDefault: row.is_default === 1,
      ...JSON.parse(row.settings_json),
      max_tokens: JSON.parse(row.settings_json).maxTokens || null,
      supports_thinking: !!JSON.parse(row.settings_json).supportsThinking,
      supports_vision: !!JSON.parse(row.settings_json).supportsVision,
      revision: row.revision,
    }));
  }

  getModelProfile(name) {
    name = v.string(name, 'model name', { required: true, max: 200 });
    return this.listModelProfiles().find((profile) => profile.name === name || profile.model === name) || null;
  }

  setProviderApiKey(provider, plaintext) {
    provider = v.oneOf(provider, 'provider', ['openai', 'claude', 'gemini']);
    return this.setSecret(`provider.${provider}`, plaintext);
  }

  getProviderApiKey(provider) {
    provider = v.oneOf(provider, 'provider', ['openai', 'claude', 'gemini']);
    return this.getSecret(`provider.${provider}`);
  }

  getProviderKeyStatus() {
    this._assertReady();
    const status = {};
    ['openai', 'claude', 'gemini'].forEach((provider) => {
      status[provider] = !!this.db.prepare('SELECT 1 FROM secrets WHERE key = ?').get(`provider.${provider}`);
    });
    return { ...status, anthropic: status.claude, google: status.gemini };
  }

  getWorkspaceLayout() {
    this._assertReady();
    const panelRows = this.db.prepare(`
      SELECT id, feature_key, column_id, position, size_json, visible, updated_at
      FROM workspace_panels
      WHERE deleted_at IS NULL AND feature_key != 'sticky-note'
      ORDER BY position, created_at
    `).all();
    if (!panelRows.length) return null;
    const columnsById = new Map();
    const hiddenPanels = [];
    panelRows.forEach((row) => {
      const sizing = row.size_json ? JSON.parse(row.size_json) : {};
      if (!row.visible || !row.column_id) {
        hiddenPanels.push({ panelId: row.id, type: row.feature_key });
        return;
      }
      if (!columnsById.has(row.column_id)) {
        columnsById.set(row.column_id, {
          id: row.column_id,
          size: sizing.columnSize ?? 20,
          columnPosition: sizing.columnPosition ?? columnsById.size,
          panels: [],
        });
      }
      columnsById.get(row.column_id).panels.push({
        panelId: row.id,
        type: row.feature_key,
        size: sizing.panelSize ?? 100,
      });
    });
    const columns = Array.from(columnsById.values())
      .sort((a, b) => a.columnPosition - b.columnPosition)
      .map(({ columnPosition, ...column }) => column);
    const workspaceRow = this.db.prepare("SELECT value_json, revision, updated_at FROM workspace_state WHERE key = 'workspace'").get();
    const domain = this.db.prepare("SELECT revision, updated_at FROM domain_revisions WHERE domain = 'workspace'").get();
    return {
      config: {
        version: 2,
        columns,
        hiddenPanels,
        workspace: workspaceRow ? JSON.parse(workspaceRow.value_json) : {},
      },
      revision: domain?.revision || workspaceRow?.revision || 0,
      updatedAt: domain?.updated_at || workspaceRow?.updated_at || null,
    };
  }

  saveWorkspaceLayout(layout) {
    v.object(layout, 'layout', ['version', 'columns', 'hiddenPanels', 'workspace']);
    if (layout.version !== 2 || !Array.isArray(layout.columns) || layout.columns.length > 100) {
      v.fail('INVALID_INPUT', 'layout must be a version-2 column layout');
    }
    layout.columns.forEach((column, columnIndex) => {
      v.object(column, `columns[${columnIndex}]`, ['id', 'size', 'panels']);
      v.string(column.id, `columns[${columnIndex}].id`, { required: true, max: 200 });
      v.number(column.size, `columns[${columnIndex}].size`, { min: 0, max: 100 });
      if (!Array.isArray(column.panels) || column.panels.length > 100) v.fail('INVALID_INPUT', 'layout column panels are invalid');
      column.panels.forEach((panel, panelIndex) => {
        v.object(panel, `columns[${columnIndex}].panels[${panelIndex}]`, ['panelId', 'type', 'size', 'visible']);
        v.string(panel.panelId, 'panelId', { required: true, max: 200 });
        v.string(panel.type, 'panel type', { required: true, max: 100 });
        v.number(panel.size, 'panel size', { min: 0, max: 100 });
        if (panel.visible !== undefined) v.boolean(panel.visible, 'panel visible');
      });
    });
    if (layout.hiddenPanels !== undefined && !Array.isArray(layout.hiddenPanels)) {
      v.fail('INVALID_INPUT', 'hiddenPanels must be a list');
    }
    if (layout.workspace !== undefined && (!layout.workspace || typeof layout.workspace !== 'object' || Array.isArray(layout.workspace))) {
      v.fail('INVALID_INPUT', 'workspace must be an object');
    }
    const workspaceJson = this._jsonValue(layout.workspace || {}, 'workspace', 1000000);
    return this._write('workspace', (timestamp) => {
      const activeIds = [];
      layout.columns.forEach((column, columnPosition) => {
        column.panels.forEach((panel, panelPosition) => {
          activeIds.push(panel.panelId);
          const sizing = JSON.stringify({
            panelSize: panel.size,
            columnSize: column.size,
            columnPosition,
          });
          this.db.prepare(`
            INSERT INTO workspace_panels (
              id, feature_key, column_id, position, size_json, visible,
              created_at, updated_at, revision, deleted_at
            ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, 1, NULL)
            ON CONFLICT(id) DO UPDATE SET
              feature_key = excluded.feature_key,
              column_id = excluded.column_id,
              position = excluded.position,
              size_json = excluded.size_json,
              visible = 1,
              updated_at = excluded.updated_at,
              revision = workspace_panels.revision + 1,
              deleted_at = NULL
          `).run(panel.panelId, panel.type, column.id, panelPosition, sizing, timestamp, timestamp);
        });
      });
      (layout.hiddenPanels || []).forEach((panel, hiddenPosition) => {
        v.object(panel, `hiddenPanels[${hiddenPosition}]`, ['panelId', 'type']);
        const panelId = v.identifier(panel.panelId, 'hidden panel id');
        const type = v.string(panel.type, 'hidden panel type', { required: true, max: 100 });
        activeIds.push(panelId);
        this.db.prepare(`
          INSERT INTO workspace_panels (
            id, feature_key, column_id, position, visible, created_at, updated_at, revision, deleted_at
          ) VALUES (?, ?, NULL, ?, 0, ?, ?, 1, NULL)
          ON CONFLICT(id) DO UPDATE SET
            feature_key = excluded.feature_key,
            column_id = NULL,
            position = excluded.position,
            visible = 0,
            updated_at = excluded.updated_at,
            revision = workspace_panels.revision + 1,
            deleted_at = NULL
        `).run(panelId, type, hiddenPosition, timestamp, timestamp);
      });
      if (activeIds.length) {
        const placeholders = activeIds.map(() => '?').join(', ');
        this.db.prepare(`
          UPDATE workspace_panels SET deleted_at = ?, updated_at = ?, revision = revision + 1
          WHERE deleted_at IS NULL AND feature_key != 'sticky-note' AND id NOT IN (${placeholders})
        `).run(timestamp, timestamp, ...activeIds);
      } else {
        this.db.prepare(`
          UPDATE workspace_panels SET deleted_at = ?, updated_at = ?, revision = revision + 1
          WHERE deleted_at IS NULL AND feature_key != 'sticky-note'
        `).run(timestamp, timestamp);
      }
      this.db.prepare(`
        INSERT INTO workspace_state (key, value_json, created_at, updated_at, revision)
        VALUES ('workspace', ?, ?, ?, 1)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at,
          revision = workspace_state.revision + 1
      `).run(workspaceJson, timestamp, timestamp);
      return { row: this.getWorkspaceLayout() };
    });
  }

  listSelectedFiles(purpose = 'chat') {
    this._assertReady();
    purpose = v.oneOf(purpose, 'purpose', ['chat', 'attachment']);
    return this.db.prepare(`
      SELECT f.id, f.path, f.display_name, f.kind, f.size, f.modified_at, f.availability,
             s.purpose, s.selected_at
      FROM selected_files s
      JOIN external_files f ON f.id = s.file_id
      WHERE s.purpose = ? AND f.deleted_at IS NULL
      ORDER BY s.selected_at DESC
    `).all(purpose);
  }

  listExternalFiles(input = {}) {
    this._assertReady();
    v.object(input, 'external file filters', ['id', 'kind', 'availability', 'query', 'limit']);
    const clauses = ['f.deleted_at IS NULL'];
    const params = [];
    if (input.id !== undefined) {
      clauses.push('f.id = ?');
      params.push(v.identifier(input.id, 'id'));
    }
    if (input.kind !== undefined) {
      clauses.push('f.kind = ?');
      params.push(v.string(input.kind, 'kind', { required: true, max: 100 }));
    }
    if (input.availability !== undefined) {
      clauses.push('f.availability = ?');
      params.push(v.oneOf(input.availability, 'availability', ['available', 'missing', 'unknown']));
    }
    if (input.query !== undefined) {
      const query = v.string(input.query, 'query', { required: true, max: 500 }).toLowerCase();
      clauses.push('(LOWER(f.display_name) LIKE ? OR LOWER(f.path) LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }
    const limit = input.limit === undefined ? 200 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    return this.db.prepare(`
      SELECT f.id, f.path, f.display_name, f.kind, f.size, f.modified_at, f.availability,
             f.created_at, f.updated_at, f.revision,
             EXISTS(
               SELECT 1 FROM selected_files s WHERE s.file_id = f.id
             ) AS selected,
             EXISTS(
               SELECT 1 FROM media_queue_items q WHERE q.file_id = f.id AND q.deleted_at IS NULL
             ) AS in_media_queue,
             (
               SELECT COUNT(*) FROM forest_files ff
               WHERE ff.file_id = f.id AND ff.deleted_at IS NULL
             ) AS forest_project_count
      FROM external_files f
      WHERE ${clauses.join(' AND ')}
      ORDER BY f.updated_at DESC LIMIT ?
    `).all(...params, limit).map((row) => toBooleanRow(row, ['selected', 'in_media_queue']));
  }

  addSelectedFile(input) {
    v.object(input, 'selected file', ['path', 'displayName', 'kind', 'size', 'modifiedAt', 'purpose']);
    const file = this._normalizeExternalFile(input);
    const purpose = input.purpose === undefined ? 'chat' : v.oneOf(input.purpose, 'purpose', ['chat', 'attachment']);
    return this._write('files', (timestamp) => {
      const fileId = this._upsertExternalFile(file, timestamp);
      this.db.prepare(`
        INSERT INTO selected_files (file_id, purpose, selected_at) VALUES (?, ?, ?)
        ON CONFLICT(file_id, purpose) DO UPDATE SET selected_at = excluded.selected_at
      `).run(fileId, purpose, timestamp);
      return { row: this.listSelectedFiles(purpose).find((entry) => entry.id === fileId) };
    });
  }

  removeSelectedFile(fileId, purpose = 'chat') {
    fileId = v.identifier(fileId, 'fileId');
    purpose = v.oneOf(purpose, 'purpose', ['chat', 'attachment']);
    return this._write('files', () => {
      this.db.prepare('DELETE FROM selected_files WHERE file_id = ? AND purpose = ?').run(fileId, purpose);
      return { fileId, purpose };
    });
  }

  clearSelectedFiles(purpose = 'chat') {
    purpose = v.oneOf(purpose, 'purpose', ['chat', 'attachment']);
    return this._write('files', () => {
      const result = this.db.prepare('DELETE FROM selected_files WHERE purpose = ?').run(purpose);
      return { removed: result.changes };
    });
  }

  _normalizeExternalFile(input) {
    return {
      path: v.string(input.path, 'path', { required: true, max: 4096 }),
      displayName: v.string(input.displayName, 'displayName', { required: true, max: 1000 }),
      kind: v.optional(input.kind, (value) => v.string(value, 'kind', { required: true, max: 100 })) ?? 'file',
      size: v.optional(input.size, (value) => v.integer(value, 'size', { nullable: true, min: 0 })) ?? null,
      modifiedAt: v.optional(input.modifiedAt, (value) => (
        value == null ? null : v.integer(Math.floor(value), 'modifiedAt', { min: 0 })
      )) ?? null,
    };
  }

  _upsertExternalFile(file, timestamp) {
    const existing = this.db.prepare('SELECT id FROM external_files WHERE path = ?').get(file.path);
    const fileId = existing?.id || id();
    this.db.prepare(`
      INSERT INTO external_files (
        id, path, display_name, kind, size, modified_at, availability, created_at, updated_at, revision, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, 1, NULL)
      ON CONFLICT(path) DO UPDATE SET
        display_name = excluded.display_name,
        kind = excluded.kind,
        size = excluded.size,
        modified_at = excluded.modified_at,
        availability = 'available',
        updated_at = excluded.updated_at,
        revision = external_files.revision + 1,
        deleted_at = NULL
    `).run(fileId, file.path, file.displayName, file.kind, file.size, file.modifiedAt, timestamp, timestamp);
    return fileId;
  }

  getMediaState() {
    this._assertReady();
    const tracks = this.db.prepare(`
      SELECT q.id AS queue_id, q.position, f.id AS file_id, f.path, f.display_name, f.kind,
             f.size, f.modified_at, f.availability
      FROM media_queue_items q
      JOIN external_files f ON f.id = q.file_id
      WHERE q.deleted_at IS NULL AND f.deleted_at IS NULL
      ORDER BY q.position
    `).all();
    const state = this.db.prepare('SELECT * FROM media_state WHERE singleton_id = 1').get();
    return {
      tracks,
      currentItemId: state?.current_item_id || null,
      currentTime: state?.position_seconds || 0,
      volume: Math.round((state?.volume ?? 1) * 100),
      isMuted: state?.muted === 1,
      repeatMode: state?.repeat_mode || 'off',
      shuffle: state?.shuffle === 1,
      panelState: state ? JSON.parse(state.panel_state_json) : { queueOpen: true, shellHidden: false },
      revision: state?.revision || 0,
    };
  }

  saveMediaState(input) {
    v.object(input, 'media state', ['tracks', 'currentIndex', 'currentTime', 'volume', 'isMuted', 'repeatMode', 'shuffle', 'queueOpen', 'shellHidden']);
    if (!Array.isArray(input.tracks) || input.tracks.length > 2000) v.fail('INVALID_INPUT', 'tracks must be a list');
    const tracks = input.tracks.map((track, index) => {
      v.object(track, `tracks[${index}]`, ['path', 'displayName', 'kind', 'size', 'modifiedAt']);
      return this._normalizeExternalFile(track);
    });
    const currentIndex = v.integer(input.currentIndex, 'currentIndex', { min: 0, max: Math.max(tracks.length - 1, 0) });
    const currentTime = v.number(input.currentTime, 'currentTime', { min: 0, max: Number.MAX_SAFE_INTEGER });
    const volume = v.number(input.volume, 'volume', { min: 0, max: 100 });
    const isMuted = v.boolean(input.isMuted, 'isMuted');
    const repeatMode = v.oneOf(input.repeatMode, 'repeatMode', ['off', 'one', 'all']);
    const shuffle = v.boolean(input.shuffle, 'shuffle');
    const queueOpen = v.boolean(input.queueOpen, 'queueOpen');
    const shellHidden = v.boolean(input.shellHidden, 'shellHidden');
    return this._write('files', (timestamp) => {
      this.db.prepare('UPDATE media_queue_items SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE deleted_at IS NULL')
        .run(timestamp, timestamp);
      const queueIds = [];
      tracks.forEach((track, position) => {
        const fileId = this._upsertExternalFile(track, timestamp);
        const existingQueueItem = this.db.prepare(`
          SELECT id FROM media_queue_items WHERE file_id = ? ORDER BY updated_at DESC LIMIT 1
        `).get(fileId);
        const queueId = existingQueueItem?.id || id();
        if (existingQueueItem) {
          this.db.prepare(`
            UPDATE media_queue_items SET position = ?, deleted_at = NULL, updated_at = ?, revision = revision + 1
            WHERE id = ?
          `).run(position, timestamp, queueId);
        } else {
          this.db.prepare(`
            INSERT INTO media_queue_items (id, file_id, position, created_at, updated_at, revision)
            VALUES (?, ?, ?, ?, ?, 1)
          `).run(queueId, fileId, position, timestamp, timestamp);
        }
        queueIds.push(queueId);
      });
      const currentItemId = queueIds[currentIndex] || null;
      const panelJson = JSON.stringify({ queueOpen, shellHidden });
      this.db.prepare(`
        INSERT INTO media_state (
          singleton_id, current_item_id, position_seconds, volume, muted, repeat_mode,
          shuffle, panel_state_json, updated_at, revision
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(singleton_id) DO UPDATE SET
          current_item_id = excluded.current_item_id,
          position_seconds = excluded.position_seconds,
          volume = excluded.volume,
          muted = excluded.muted,
          repeat_mode = excluded.repeat_mode,
          shuffle = excluded.shuffle,
          panel_state_json = excluded.panel_state_json,
          updated_at = excluded.updated_at,
          revision = media_state.revision + 1
      `).run(currentItemId, currentTime, volume / 100, isMuted ? 1 : 0, repeatMode,
        shuffle ? 1 : 0, panelJson, timestamp);
      return { row: this.getMediaState() };
    });
  }

  listCanvases(input = {}) {
    this._assertReady();
    v.object(input, 'canvas filters', ['includeDeleted', 'query']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const clauses = includeDeleted ? [] : ['deleted_at IS NULL'];
    const params = [];
    if (input.query !== undefined) {
      const query = v.string(input.query, 'query', { required: true, max: 500 }).toLowerCase();
      clauses.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(source_url, \'\')) LIKE ? OR LOWER(html_text) LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    return this.db.prepare(`
      SELECT id, title, length(html_text) AS size, source_kind, source_url, render_engine,
             form_factor, panel_settings_json, created_at, updated_at, revision, deleted_at
      FROM canvases ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY updated_at DESC
    `).all(...params).map((row) => this._canvasSummary(row));
  }

  _canvasSummary(row) {
    return {
      id: row.id,
      filename: row.id,
      title: row.title,
      size: row.size || 0,
      source: row.source_kind || 'ai',
      url: row.source_url || '',
      renderEngine: row.render_engine || 'iframe',
      formFactor: row.form_factor || 'float',
      panelSettings: row.panel_settings_json ? JSON.parse(row.panel_settings_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
      deletedAt: row.deleted_at,
    };
  }

  getCanvas(canvasId) {
    this._assertReady();
    canvasId = v.identifier(canvasId, 'canvasId');
    const row = this.db.prepare('SELECT * FROM canvases WHERE id = ? AND deleted_at IS NULL').get(canvasId);
    if (!row) v.fail('NOT_FOUND', 'Canvas not found');
    return {
      ...this._canvasSummary({ ...row, size: Buffer.byteLength(row.html_text, 'utf8') }),
      html: row.html_text,
    };
  }

  createCanvas(input) {
    v.object(input, 'canvas', ['title', 'html', 'source', 'url', 'renderEngine', 'formFactor', 'panelSettings']);
    const canvas = {
      id: id(),
      title: v.string(input.title, 'title', { required: true, max: 1000 }),
      html: v.optional(input.html, (value) => v.string(value, 'html', { max: 10000000 })) ?? '',
      source: v.optional(input.source, (value) => v.oneOf(value, 'source', ['ai', 'url', 'user'])) ?? 'ai',
      url: v.optional(input.url, (value) => v.string(value, 'url', { max: 10000 })) ?? '',
      renderEngine: v.optional(input.renderEngine, (value) => v.oneOf(value, 'renderEngine', ['iframe', 'browser'])) ?? 'iframe',
      formFactor: v.optional(input.formFactor, (value) => v.oneOf(value, 'formFactor', ['float', 'tile', 'hybrid', 'widget'])) ?? 'float',
      panelSettingsJson: this._jsonValue(input.panelSettings || {}, 'panelSettings', 100000),
    };
    return this._write('canvases', (timestamp) => {
      this.db.prepare(`
        INSERT INTO canvases (
          id, title, html_text, source_kind, source_url, render_engine, form_factor,
          panel_settings_json, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(canvas.id, canvas.title, canvas.html, canvas.source, canvas.url, canvas.renderEngine,
        canvas.formFactor, canvas.panelSettingsJson, timestamp, timestamp);
      return { row: this.getCanvas(canvas.id) };
    });
  }

  updateCanvas(canvasId, expectedRevision, patch) {
    v.object(patch, 'canvas patch', ['title', 'html', 'source', 'url', 'renderEngine', 'formFactor', 'panelSettings']);
    const columnMap = {
      title: ['title', (value) => v.string(value, 'title', { required: true, max: 1000 })],
      html: ['html_text', (value) => v.string(value, 'html', { max: 10000000 })],
      source: ['source_kind', (value) => v.oneOf(value, 'source', ['ai', 'url', 'user'])],
      url: ['source_url', (value) => v.string(value, 'url', { max: 10000 })],
      renderEngine: ['render_engine', (value) => v.oneOf(value, 'renderEngine', ['iframe', 'browser'])],
      formFactor: ['form_factor', (value) => v.oneOf(value, 'formFactor', ['float', 'tile', 'hybrid', 'widget'])],
      panelSettings: ['panel_settings_json', (value) => this._jsonValue(value, 'panelSettings', 100000)],
    };
    return this._updateRow('canvases', 'canvases', canvasId, expectedRevision, patch, columnMap, [], null,
      (rowId) => this.getCanvas(rowId));
  }

  archiveCanvas(canvasId, expectedRevision) {
    return this._archiveRow('canvases', 'canvases', canvasId, expectedRevision, [],
      (rowId) => {
        const row = this.db.prepare('SELECT * FROM canvases WHERE id = ?').get(rowId);
        return this._canvasSummary({ ...row, size: Buffer.byteLength(row.html_text, 'utf8') });
      });
  }

  getBriiztormState() {
    this._assertReady();
    const result = {};
    this.db.prepare(`
      SELECT key, value_json FROM embedded_app_state WHERE app_id = 'briiztorm'
    `).all().forEach((row) => {
      if (BRIIZTORM_KEYS.has(row.key)) result[row.key] = JSON.parse(row.value_json);
    });
    return result;
  }

  setBriiztormState(key, value) {
    key = v.string(key, 'briiZtorm key', { required: true, max: 100 });
    if (!BRIIZTORM_KEYS.has(key)) v.fail('INVALID_INPUT', 'Unsupported briiZtorm state key');
    if (key === 'theme') {
      value = v.oneOf(value, 'theme', ['vaporwave', 'onyx', 'dusk', 'rose']);
    } else if (key === 'projects') {
      const projects = Array.isArray(value) ? value : value?.projects;
      if (!Array.isArray(projects) || projects.length > 1000) {
        v.fail('INVALID_INPUT', 'briiZtorm projects are invalid');
      }
    } else if (key === 'flightPresets' && (!Array.isArray(value) || value.length > 200)) {
      v.fail('INVALID_INPUT', 'briiZtorm flight presets are invalid');
    } else if (key === 'flightSettings') {
      v.object(value, 'flightSettings', ['acceleration', 'deceleration', 'maxSpeed', 'fov', 'lookSpeed']);
      ['acceleration', 'deceleration', 'maxSpeed', 'fov', 'lookSpeed'].forEach((field) => {
        v.number(value[field], `flightSettings.${field}`, { min: 0, max: 1000 });
      });
    }
    const valueJson = this._jsonValue(value, `briiZtorm ${key}`, 5000000);
    return this._write('embeddedApps', (timestamp) => {
      this.db.prepare(`
        INSERT INTO embedded_app_state (app_id, key, value_json, created_at, updated_at, revision)
        VALUES ('briiztorm', ?, ?, ?, ?, 1)
        ON CONFLICT(app_id, key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at,
          revision = embedded_app_state.revision + 1
      `).run(key, valueJson, timestamp, timestamp);
      return { key, value };
    });
  }

  _write(domain, work, change = null) {
    return this._writeDomains([domain], work, change);
  }

  _writeDomains(domains, work, change = null) {
    this._assertReady();
    const timestamp = now();
    const committed = this.db.transaction(() => {
      const value = work(timestamp);
      const revisions = {};
      domains.forEach((domain) => {
        const revisionRow = this.db.prepare(`
          INSERT INTO domain_revisions (domain, revision, updated_at)
          VALUES (?, 1, ?)
          ON CONFLICT(domain) DO UPDATE SET
            revision = domain_revisions.revision + 1,
            updated_at = excluded.updated_at
          RETURNING revision
        `).get(domain, timestamp);
        revisions[domain] = revisionRow.revision;
        if (CONTINUITY_DOMAINS.has(domain)) {
          this.db.prepare(`
            INSERT INTO sync_outbox (domain, dirty_revision, status, attempts, created_at, updated_at)
            VALUES (?, ?, 'pending', 0, ?, ?)
            ON CONFLICT(domain) DO UPDATE SET
              dirty_revision = excluded.dirty_revision,
              status = 'pending', attempts = 0, next_attempt_at = NULL,
              last_error_code = NULL, updated_at = excluded.updated_at
          `).run(domain, revisionRow.revision, timestamp, timestamp);
        }
      });
      return { value, revisions };
    })();

    this.emit('changed', {
      domains,
      revision: committed.revisions[domains[0]],
      ...(change && typeof change === 'object' ? change : {}),
    });
    return {
      ...committed.value,
      domainRevision: committed.revisions[domains[0]],
      domainRevisions: committed.revisions,
    };
  }

  _requireCurrent(table, rowId, expectedRevision) {
    const current = this.db.prepare(`SELECT revision, deleted_at FROM ${table} WHERE id = ?`).get(rowId);
    if (!current) v.fail('NOT_FOUND', 'The requested item does not exist');
    if (current.deleted_at != null) v.fail('DELETED', 'The requested item is archived');
    if (current.revision !== expectedRevision) {
      v.fail('REVISION_CONFLICT', `This item changed elsewhere (current revision ${current.revision})`);
    }
    return current;
  }

  listTasks(input = {}) {
    this._assertReady();
    v.object(input, 'task filters', ['projectId', 'forestProjectId', 'sourceKey', 'status', 'includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const clauses = [];
    const params = [];
    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (input.projectId !== undefined) {
      clauses.push('project_id = ?');
      params.push(v.identifier(input.projectId, 'projectId'));
    }
    if (input.forestProjectId !== undefined) {
      clauses.push('forest_project_id = ?');
      params.push(v.identifier(input.forestProjectId, 'forestProjectId'));
    }
    if (input.sourceKey !== undefined) {
      clauses.push('source_key = ?');
      params.push(v.string(input.sourceKey, 'sourceKey', { required: true, max: 500 }));
    }
    if (input.status !== undefined) {
      clauses.push('status = ?');
      params.push(v.oneOf(input.status, 'status', TASK_STATUSES));
    }
    const limit = input.limit === undefined ? 500 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`
      SELECT id, project_id, forest_project_id, source_key, title, description, status, priority, due_at, automated,
             created_at, updated_at, revision, deleted_at
      FROM tasks ${where}
      ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((row) => toBooleanRow(row, ['automated']));
  }

  listTasksDetailed(input = {}) {
    return this.listTasks(input).map((task) => this._decorateTask(task));
  }

  getTask(taskId) {
    this._assertReady();
    taskId = v.identifier(taskId, 'taskId');
    const task = this.db.prepare(`
      SELECT id, project_id, forest_project_id, source_key, title, description, status, priority, due_at, automated,
             created_at, updated_at, revision, deleted_at
      FROM tasks WHERE id = ? AND deleted_at IS NULL
    `).get(taskId);
    return task ? this._decorateTask(toBooleanRow(task, ['automated'])) : null;
  }

  _decorateTask(task) {
    const subtasks = this.db.prepare(`
      SELECT id, task_id AS parent_id, title, status, position, completed_at,
             created_at, updated_at, revision, deleted_at
      FROM task_steps WHERE task_id = ? AND deleted_at IS NULL ORDER BY position, created_at
    `).all(task.id);
    const taskLog = this.db.prepare(`
      SELECT id, message, data_json, created_at
      FROM logs WHERE task_id = ? AND type = 'task_activity' ORDER BY created_at, id
    `).all(task.id).map((entry) => ({
      id: entry.id,
      timestamp: entry.created_at,
      type: entry.data_json ? JSON.parse(entry.data_json).entryType : 'status',
      message: entry.message,
    }));
    return { ...task, subtasks, actions: subtasks, taskLog };
  }

  appendTaskLog(taskId, entryType, message) {
    taskId = v.identifier(taskId, 'taskId');
    entryType = v.oneOf(entryType, 'entryType', ['status', 'question', 'response', 'error']);
    message = v.string(message, 'message', { required: true, max: 100000 });
    return this._write('tasks', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL').get(taskId)) {
        v.fail('NOT_FOUND', 'The task does not exist');
      }
      const logId = id();
      this.db.prepare(`
        INSERT INTO logs (
          id, type, source, category, message, data_json, level, task_id, created_at
        ) VALUES (?, 'task_activity', 'automation', 'tasks', ?, ?, ?, ?, ?)
      `).run(logId, message, JSON.stringify({ entryType }), entryType === 'error' ? 'error' : 'info', taskId, timestamp);
      return { row: { id: logId, taskId, timestamp, type: entryType, message } };
    });
  }

  createTask(input) {
    v.object(input, 'task', [
      'projectId', 'forestProjectId', 'sourceKey', 'title', 'description', 'status', 'priority', 'dueAt', 'automated',
    ]);
    const row = {
      id: id(),
      projectId: v.optional(input.projectId, (value) => this._normalizeProjectId(value)) ?? null,
      forestProjectId: v.optional(input.forestProjectId, (value) => this._normalizeForestProjectId(value)) ?? null,
      sourceKey: v.optional(
        input.sourceKey,
        (value) => v.string(value, 'sourceKey', { nullable: true, max: 500 }),
      ) ?? null,
      title: v.string(input.title, 'title', { required: true, max: 500 }),
      description: v.optional(input.description, (value) => v.string(value, 'description', { max: 50000 })) ?? '',
      status: v.optional(input.status, (value) => v.oneOf(value, 'status', TASK_STATUSES)) ?? 'pending',
      priority: v.optional(input.priority, (value) => v.oneOf(value, 'priority', TASK_PRIORITIES)) ?? 'normal',
      dueAt: v.optional(input.dueAt, (value) => v.integer(value, 'dueAt', { nullable: true, min: 0 })) ?? null,
      automated: v.optional(input.automated, (value) => v.boolean(value, 'automated')) ?? false,
    };
    return this._write('tasks', (timestamp) => {
      this.db.prepare(`
        INSERT INTO tasks (
          id, project_id, forest_project_id, source_key, title, description, status, priority, due_at, automated,
          created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(row.id, row.projectId, row.forestProjectId, row.sourceKey, row.title, row.description, row.status, row.priority,
        row.dueAt, row.automated ? 1 : 0, timestamp, timestamp);
      return { row: toBooleanRow(this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id), ['automated']) };
    });
  }

  updateTask(taskId, expectedRevision, patch) {
    taskId = v.identifier(taskId, 'taskId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    v.object(patch, 'task patch', [
      'projectId', 'forestProjectId', 'title', 'description', 'status', 'priority', 'dueAt', 'automated',
    ]);
    const columnMap = {
      projectId: ['project_id', (value) => this._normalizeProjectId(value)],
      forestProjectId: ['forest_project_id', (value) => this._normalizeForestProjectId(value)],
      title: ['title', (value) => v.string(value, 'title', { required: true, max: 500 })],
      description: ['description', (value) => v.string(value, 'description', { max: 50000 })],
      status: ['status', (value) => v.oneOf(value, 'status', TASK_STATUSES)],
      priority: ['priority', (value) => v.oneOf(value, 'priority', TASK_PRIORITIES)],
      dueAt: ['due_at', (value) => v.integer(value, 'dueAt', { nullable: true, min: 0 })],
      automated: ['automated', (value) => v.boolean(value, 'automated') ? 1 : 0],
    };
    return this._updateRow('tasks', 'tasks', taskId, expectedRevision, patch, columnMap, ['automated']);
  }

  archiveTask(taskId, expectedRevision) {
    taskId = v.identifier(taskId, 'taskId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    return this._writeDomains(['tasks', 'placements'], (timestamp) => {
      this._requireCurrent('tasks', taskId, expectedRevision);
      this.db.prepare(`
        UPDATE tasks SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
      `).run(timestamp, timestamp, taskId);
      this.db.prepare(`
        UPDATE placements SET deleted_at = ?, updated_at = ?, revision = revision + 1
        WHERE ref_type = 'task' AND ref_id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, taskId);
      return {
        row: toBooleanRow(this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId), ['automated']),
      };
    });
  }

  listPlacements(input = {}) {
    this._assertReady();
    v.object(input, 'placement filters', ['id', 'date', 'dateFrom', 'dateTo', 'refId', 'includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const date = input.date === undefined ? null : this._normalizeDate(input.date, 'date');
    const dateFrom = input.dateFrom === undefined ? date : this._normalizeDate(input.dateFrom, 'dateFrom');
    const dateTo = input.dateTo === undefined ? date : this._normalizeDate(input.dateTo, 'dateTo');
    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      v.fail('INVALID_INPUT', 'dateFrom and dateTo must be provided together');
    }
    if (dateFrom && dateTo && dateFrom > dateTo) v.fail('INVALID_INPUT', 'dateFrom must be on or before dateTo');
    if (dateFrom && dateTo && this._daysBetween(dateFrom, dateTo) > 366) {
      v.fail('INVALID_INPUT', 'Placement queries are limited to 366 days');
    }
    const clauses = [];
    const params = [];
    if (!includeDeleted) clauses.push('p.deleted_at IS NULL');
    if (input.id !== undefined) {
      clauses.push('p.id = ?');
      params.push(v.identifier(input.id, 'id'));
    }
    if (input.refId !== undefined) {
      clauses.push('p.ref_id = ?');
      params.push(v.identifier(input.refId, 'refId'));
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = input.limit === undefined ? 2000 : v.integer(input.limit, 'limit', { min: 1, max: 5000 });
    const rows = this.db.prepare(`
      SELECT p.*, t.title AS task_title, t.description AS task_description,
             t.status AS task_status, t.priority AS task_priority, t.due_at AS task_due_at,
             t.project_id AS task_project_id, t.forest_project_id AS task_forest_project_id,
             t.revision AS task_revision, t.deleted_at AS task_deleted_at
      FROM placements p
      JOIN tasks t ON t.id = p.ref_id
      ${where}
      ORDER BY p.date, p.start_minute, p.created_at
      LIMIT ?
    `).all(...params, limit);

    const occurrences = [];
    for (const row of rows) {
      const recurrence = row.recurrence_json ? JSON.parse(row.recurrence_json) : null;
      const completedDates = JSON.parse(row.completed_dates_json || '[]');
      const occurrenceDates = dateFrom && dateTo
        ? this._datesBetween(dateFrom, dateTo).filter((candidate) => (
          this._placementOccursOnDate(row.date, recurrence, candidate)
        ))
        : [row.date];
      for (const occurrenceDate of occurrenceDates) {
        occurrences.push(this._mapPlacement(row, occurrenceDate, recurrence, completedDates));
      }
    }
    return occurrences.sort((a, b) => (
      a.occurrence_date.localeCompare(b.occurrence_date)
      || a.start_minute - b.start_minute
      || a.id.localeCompare(b.id)
    ));
  }

  listSchedule(input = {}) {
    v.object(input, 'schedule filters', ['dateFrom', 'dateTo']);
    const dateFrom = this._normalizeDate(input.dateFrom, 'dateFrom');
    const dateTo = this._normalizeDate(input.dateTo, 'dateTo');
    if (dateFrom > dateTo) v.fail('INVALID_INPUT', 'dateFrom must be on or before dateTo');
    if (this._daysBetween(dateFrom, dateTo) > 366) v.fail('INVALID_INPUT', 'Schedule queries are limited to 366 days');

    const dates = this._datesBetween(dateFrom, dateTo);
    const events = this.listOrganizerItems({ type: 'event', limit: 5000 }).flatMap((event) => {
      const anchorDate = event.scheduled_start_at == null
        ? null
        : this._localDateFromTimestamp(event.scheduled_start_at);
      if (!anchorDate) return [];
      return dates.filter((date) => this._placementOccursOnDate(anchorDate, event.recurrence, date))
        .map((occurrenceDate) => {
          const startDate = new Date(event.scheduled_start_at);
          const endDate = event.scheduled_end_at == null ? null : new Date(event.scheduled_end_at);
          const startMinute = startDate.getHours() * 60 + startDate.getMinutes();
          const durationMinutes = event.duration_seconds != null
            ? Math.max(1, Math.round(event.duration_seconds / 60))
            : endDate
              ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
              : 60;
          return {
            kind: 'event',
            id: event.id,
            occurrence_date: occurrenceDate,
            title: event.title,
            status: event.status,
            start_minute: startMinute,
            duration_minutes: durationMinutes,
            recurrence: event.recurrence,
            tags: event.tags || [],
          };
        });
    });
    const placements = this.listPlacements({ dateFrom, dateTo, limit: 5000 }).map((placement) => ({
      kind: 'task',
      ...placement,
    }));
    return [...events, ...placements].sort((a, b) => (
      a.occurrence_date.localeCompare(b.occurrence_date)
      || a.start_minute - b.start_minute
      || a.id.localeCompare(b.id)
    ));
  }

  createPlacement(input) {
    v.object(input, 'placement', ['refType', 'refId', 'date', 'startMinute', 'durationMinutes', 'recurrence']);
    const refType = v.optional(input.refType, (value) => v.oneOf(value, 'refType', ['task'])) ?? 'task';
    const refId = v.identifier(input.refId, 'refId');
    const date = this._normalizeDate(input.date, 'date');
    const startMinute = v.integer(input.startMinute, 'startMinute', { min: 0, max: 1439 });
    const durationMinutes = v.optional(
      input.durationMinutes,
      (value) => v.integer(value, 'durationMinutes', { min: 1, max: 1440 }),
    ) ?? 60;
    const recurrenceJson = input.recurrence == null ? null : this._stringifyRecurrence({
      ...input.recurrence,
      anchorDate: input.recurrence.anchorDate || date,
    });
    return this._write('placements', (timestamp) => {
      const task = this.db.prepare('SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL').get(refId);
      if (!task) v.fail('INVALID_RELATION', 'refId must refer to an active task');
      const placementId = id();
      this.db.prepare(`
        INSERT INTO placements (
          id, ref_type, ref_id, date, start_minute, duration_minutes, recurrence_json,
          completed_dates_json, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, 1)
      `).run(placementId, refType, refId, date, startMinute, durationMinutes, recurrenceJson, timestamp, timestamp);
      return { row: this.listPlacements({ refId, includeDeleted: true }).find((item) => item.id === placementId) };
    });
  }

  updatePlacement(placementId, expectedRevision, patch) {
    placementId = v.identifier(placementId, 'placementId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    v.object(patch, 'placement patch', ['date', 'startMinute', 'durationMinutes', 'recurrence']);
    const columnMap = {
      date: ['date', (value) => this._normalizeDate(value, 'date')],
      startMinute: ['start_minute', (value) => v.integer(value, 'startMinute', { min: 0, max: 1439 })],
      durationMinutes: ['duration_minutes', (value) => v.integer(value, 'durationMinutes', { min: 1, max: 1440 })],
      recurrence: ['recurrence_json', (value) => value == null ? null : this._stringifyRecurrence(value)],
    };
    return this._updateRow('placements', 'placements', placementId, expectedRevision, patch, columnMap, [], null,
      (rowId) => this.listPlacements({ id: rowId, includeDeleted: true })[0]);
  }

  archivePlacement(placementId, expectedRevision) {
    return this._archiveRow('placements', 'placements', placementId, expectedRevision, [],
      (rowId) => this.listPlacements({ id: rowId, includeDeleted: true })[0]);
  }

  setPlacementOccurrenceCompleted(placementId, expectedRevision, occurrenceDate, completed = true) {
    placementId = v.identifier(placementId, 'placementId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    occurrenceDate = this._normalizeDate(occurrenceDate, 'occurrenceDate');
    completed = v.boolean(completed, 'completed');
    return this._write('placements', (timestamp) => {
      this._requireCurrent('placements', placementId, expectedRevision);
      const current = this.db.prepare('SELECT * FROM placements WHERE id = ?').get(placementId);
      const recurrence = current.recurrence_json ? JSON.parse(current.recurrence_json) : null;
      if (!this._placementOccursOnDate(current.date, recurrence, occurrenceDate)) {
        v.fail('INVALID_INPUT', 'That date is not an occurrence of this placement');
      }
      const dates = new Set(JSON.parse(current.completed_dates_json || '[]'));
      if (completed) dates.add(occurrenceDate);
      else dates.delete(occurrenceDate);
      const completedDates = [...dates].sort();
      this.db.prepare(`
        UPDATE placements SET completed_dates_json = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
      `).run(JSON.stringify(completedDates), timestamp, placementId);
      return {
        row: this.listPlacements({ id: placementId, includeDeleted: true })[0],
        occurrenceDate,
        completed,
      };
    });
  }

  listTaskSteps(taskId, input = {}) {
    this._assertReady();
    taskId = v.identifier(taskId, 'taskId');
    v.object(input, 'step filters', ['includeDeleted']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    return this.db.prepare(`
      SELECT id, task_id, title, status, position, completed_at, created_at, updated_at, revision, deleted_at
      FROM task_steps
      WHERE task_id = ? ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
      ORDER BY position, created_at
    `).all(taskId);
  }

  createTaskStep(taskId, input) {
    taskId = v.identifier(taskId, 'taskId');
    v.object(input, 'task step', ['title', 'status', 'position']);
    const title = v.string(input.title, 'title', { required: true, max: 1000 });
    const status = v.optional(input.status, (value) => v.oneOf(value, 'status', TASK_STATUSES)) ?? 'pending';
    const position = v.optional(input.position, (value) => v.integer(value, 'position', { min: 0 })) ?? 0;
    return this._write('tasks', (timestamp) => {
      const task = this.db.prepare('SELECT id FROM tasks WHERE id = ? AND deleted_at IS NULL').get(taskId);
      if (!task) v.fail('NOT_FOUND', 'The task does not exist');
      const stepId = id();
      const completedAt = status === 'completed' ? timestamp : null;
      this.db.prepare(`
        INSERT INTO task_steps (
          id, task_id, title, status, position, completed_at, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(stepId, taskId, title, status, position, completedAt, timestamp, timestamp);
      return { row: this.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(stepId) };
    });
  }

  updateTaskStep(stepId, expectedRevision, patch) {
    v.object(patch, 'task step patch', ['title', 'status', 'position']);
    const columnMap = {
      title: ['title', (value) => v.string(value, 'title', { required: true, max: 1000 })],
      status: ['status', (value) => v.oneOf(value, 'status', TASK_STATUSES)],
      position: ['position', (value) => v.integer(value, 'position', { min: 0 })],
    };
    return this._updateRow('tasks', 'task_steps', stepId, expectedRevision, patch, columnMap, [], (sets, values, timestamp) => {
      if (patch.status !== undefined) {
        sets.push('completed_at = ?');
        values.push(patch.status === 'completed' ? timestamp : null);
      }
    });
  }

  archiveTaskStep(stepId, expectedRevision) {
    return this._archiveRow('tasks', 'task_steps', stepId, expectedRevision);
  }

  listOrganizerItems(input = {}) {
    this._assertReady();
    v.object(input, 'organizer filters', ['type', 'parentId', 'includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const clauses = [];
    const params = [];
    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (input.type !== undefined) {
      clauses.push('type = ?');
      params.push(v.oneOf(input.type, 'type', ORGANIZER_TYPES));
    }
    if (input.parentId !== undefined) {
      clauses.push('parent_id = ?');
      params.push(v.identifier(input.parentId, 'parentId'));
    }
    const limit = input.limit === undefined ? 1000 : v.integer(input.limit, 'limit', { min: 1, max: 5000 });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`
      SELECT id, type, parent_id, title, body, status, scheduled_start_at, scheduled_end_at,
             due_at, duration_seconds, recurrence_json, tags_json, created_at, updated_at, revision, deleted_at
      FROM organizer_items ${where}
      ORDER BY updated_at DESC LIMIT ?
    `).all(...params, limit).map((row) => ({
      ...row,
      recurrence: row.recurrence_json ? JSON.parse(row.recurrence_json) : null,
      tags: JSON.parse(row.tags_json),
      recurrence_json: undefined,
      tags_json: undefined,
    }));
  }

  createOrganizerItem(input) {
    v.object(input, 'organizer item', [
      'type', 'parentId', 'title', 'body', 'status', 'scheduledStartAt', 'scheduledEndAt',
      'dueAt', 'durationSeconds', 'recurrence', 'tags',
    ]);
    const item = this._normalizeOrganizerInput(input, true);
    return this._write('organizer', (timestamp) => {
      const itemId = id();
      this.db.prepare(`
        INSERT INTO organizer_items (
          id, type, parent_id, title, body, status, scheduled_start_at, scheduled_end_at,
          due_at, duration_seconds, recurrence_json, tags_json, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(itemId, item.type, item.parentId, item.title, item.body, item.status,
        item.scheduledStartAt, item.scheduledEndAt, item.dueAt, item.durationSeconds,
        item.recurrenceJson, item.tagsJson, timestamp, timestamp);
      return { row: this._getOrganizerItem(itemId) };
    });
  }

  updateOrganizerItem(itemId, expectedRevision, patch) {
    v.object(patch, 'organizer patch', [
      'parentId', 'title', 'body', 'status', 'scheduledStartAt', 'scheduledEndAt',
      'dueAt', 'durationSeconds', 'recurrence', 'tags',
    ]);
    const columnMap = {
      parentId: ['parent_id', (value) => v.identifier(value, 'parentId', { nullable: true })],
      title: ['title', (value) => v.string(value, 'title', { max: 1000 })],
      body: ['body', (value) => v.string(value, 'body', { max: 1000000 })],
      status: ['status', (value) => v.string(value, 'status', { nullable: true, max: 100 })],
      scheduledStartAt: ['scheduled_start_at', (value) => v.integer(value, 'scheduledStartAt', { nullable: true, min: 0 })],
      scheduledEndAt: ['scheduled_end_at', (value) => v.integer(value, 'scheduledEndAt', { nullable: true, min: 0 })],
      dueAt: ['due_at', (value) => v.integer(value, 'dueAt', { nullable: true, min: 0 })],
      durationSeconds: ['duration_seconds', (value) => v.integer(value, 'durationSeconds', { nullable: true, min: 0 })],
      recurrence: ['recurrence_json', (value) => this._stringifyRecurrence(value)],
      tags: ['tags_json', (value) => JSON.stringify(v.stringArray(value, 'tags'))],
    };
    return this._updateRow('organizer', 'organizer_items', itemId, expectedRevision, patch, columnMap, [], null,
      (rowId) => this._getOrganizerItem(rowId));
  }

  archiveOrganizerItem(itemId, expectedRevision) {
    return this._archiveRow('organizer', 'organizer_items', itemId, expectedRevision, [],
      (rowId) => this._getOrganizerItem(rowId));
  }

  _normalizeOrganizerInput(input, requireType) {
    return {
      type: requireType ? v.oneOf(input.type, 'type', ORGANIZER_TYPES) : undefined,
      parentId: v.optional(input.parentId, (value) => v.identifier(value, 'parentId', { nullable: true })) ?? null,
      title: v.optional(input.title, (value) => v.string(value, 'title', { max: 1000 })) ?? '',
      body: v.optional(input.body, (value) => v.string(value, 'body', { max: 1000000 })) ?? '',
      status: v.optional(input.status, (value) => v.string(value, 'status', { nullable: true, max: 100 })) ?? null,
      scheduledStartAt: v.optional(input.scheduledStartAt, (value) => v.integer(value, 'scheduledStartAt', { nullable: true, min: 0 })) ?? null,
      scheduledEndAt: v.optional(input.scheduledEndAt, (value) => v.integer(value, 'scheduledEndAt', { nullable: true, min: 0 })) ?? null,
      dueAt: v.optional(input.dueAt, (value) => v.integer(value, 'dueAt', { nullable: true, min: 0 })) ?? null,
      durationSeconds: v.optional(input.durationSeconds, (value) => v.integer(value, 'durationSeconds', { nullable: true, min: 0 })) ?? null,
      recurrenceJson: input.recurrence === undefined ? null : this._stringifyRecurrence(input.recurrence),
      tagsJson: JSON.stringify(input.tags === undefined ? [] : v.stringArray(input.tags, 'tags')),
    };
  }

  _stringifyRecurrence(value) {
    if (value == null) return null;
    v.object(value, 'recurrence', [
      'enabled', 'type', 'frequency', 'interval', 'daysOfWeek', 'dayOfMonth',
      'anchorDate', 'endDate', 'untilAt',
    ]);
    const frequency = value.frequency || value.type;
    const normalized = {
      enabled: value.enabled === undefined ? true : v.boolean(value.enabled, 'recurrence.enabled'),
      type: v.oneOf(frequency, 'recurrence.type', ['daily', 'weekly', 'monthly', 'yearly']),
      interval: value.interval === undefined ? 1 : v.integer(value.interval, 'recurrence.interval', { min: 1, max: 1000 }),
      daysOfWeek: value.daysOfWeek == null
        ? null
        : (() => {
          if (!Array.isArray(value.daysOfWeek) || value.daysOfWeek.length > 7) {
            v.fail('INVALID_INPUT', 'recurrence.daysOfWeek must be a day list');
          }
          return value.daysOfWeek.map((day, index) => (
            v.integer(day, `recurrence.daysOfWeek[${index}]`, { min: 0, max: 6 })
          ));
        })(),
      dayOfMonth: value.dayOfMonth == null
        ? null
        : v.integer(value.dayOfMonth, 'recurrence.dayOfMonth', { min: 1, max: 31 }),
      anchorDate: value.anchorDate == null ? null : v.string(value.anchorDate, 'recurrence.anchorDate', { max: 10 }),
      endDate: value.endDate == null ? null : v.string(value.endDate, 'recurrence.endDate', { max: 10 }),
      untilAt: value.untilAt === undefined ? null : v.integer(value.untilAt, 'recurrence.untilAt', { nullable: true, min: 0 }),
    };
    return JSON.stringify(normalized);
  }

  _getOrganizerItem(itemId) {
    const row = this.db.prepare('SELECT * FROM organizer_items WHERE id = ?').get(itemId);
    return row ? {
      ...row,
      recurrence: row.recurrence_json ? JSON.parse(row.recurrence_json) : null,
      tags: JSON.parse(row.tags_json),
      recurrence_json: undefined,
      tags_json: undefined,
    } : null;
  }

  listStickyNotes() {
    this._assertReady();
    return this.db.prepare(`
      SELECT o.id, o.title, o.body, o.created_at, o.updated_at, o.revision,
             p.id AS panel_id, p.view_mode, p.size_json, p.placement_json, p.style_json,
             p.revision AS panel_revision
      FROM organizer_items o
      LEFT JOIN workspace_panels p
        ON p.linked_organizer_id = o.id AND p.feature_key = 'sticky-note' AND p.deleted_at IS NULL
      WHERE o.type = 'note' AND o.deleted_at IS NULL
      ORDER BY o.updated_at DESC
    `).all().map((row) => {
      const size = row.size_json ? JSON.parse(row.size_json) : {};
      const placement = row.placement_json ? JSON.parse(row.placement_json) : {};
      const style = row.style_json ? JSON.parse(row.style_json) : {};
      return {
        id: row.id,
        title: row.title,
        content: row.body,
        color: style.color || '#fef08a',
        floating: row.view_mode === 'floating',
        x: placement.x ?? 100,
        y: placement.y ?? 100,
        width: size.width ?? 250,
        height: size.height ?? 200,
        revision: row.revision,
        panelRevision: row.panel_revision || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  createStickyNote(input) {
    v.object(input, 'sticky note', ['title', 'content', 'color', 'floating', 'x', 'y', 'width', 'height']);
    const note = this._normalizeStickyNote(input, true);
    return this._writeDomains(['organizer', 'workspace'], (timestamp) => {
      const noteId = id();
      this.db.prepare(`
        INSERT INTO organizer_items (
          id, type, title, body, tags_json, created_at, updated_at, revision
        ) VALUES (?, 'note', ?, ?, '[]', ?, ?, 1)
      `).run(noteId, note.title, note.content, timestamp, timestamp);
      this._upsertStickyPanel(noteId, note, timestamp);
      return { row: this.listStickyNotes().find((entry) => entry.id === noteId) };
    });
  }

  updateStickyNote(noteId, input) {
    noteId = v.identifier(noteId, 'noteId');
    v.object(input, 'sticky note patch', ['title', 'content', 'color', 'floating', 'x', 'y', 'width', 'height']);
    if (!Object.keys(input).length) v.fail('INVALID_INPUT', 'At least one sticky note change is required');
    const note = this._normalizeStickyNote(input, false);
    return this._writeDomains(['organizer', 'workspace'], (timestamp) => {
      const current = this.db.prepare(`
        SELECT id FROM organizer_items WHERE id = ? AND type = 'note' AND deleted_at IS NULL
      `).get(noteId);
      if (!current) v.fail('NOT_FOUND', 'The note does not exist');
      const sets = [];
      const values = [];
      if (note.title !== undefined) { sets.push('title = ?'); values.push(note.title); }
      if (note.content !== undefined) { sets.push('body = ?'); values.push(note.content); }
      sets.push('updated_at = ?', 'revision = revision + 1');
      values.push(timestamp, noteId);
      this.db.prepare(`UPDATE organizer_items SET ${sets.join(', ')} WHERE id = ?`).run(...values);
      const existing = this.listStickyNotes().find((entry) => entry.id === noteId);
      this._upsertStickyPanel(noteId, {
        color: note.color ?? existing.color,
        floating: note.floating ?? existing.floating,
        x: note.x ?? existing.x,
        y: note.y ?? existing.y,
        width: note.width ?? existing.width,
        height: note.height ?? existing.height,
      }, timestamp);
      return { row: this.listStickyNotes().find((entry) => entry.id === noteId) };
    });
  }

  archiveStickyNote(noteId) {
    noteId = v.identifier(noteId, 'noteId');
    return this._writeDomains(['organizer', 'workspace'], (timestamp) => {
      const result = this.db.prepare(`
        UPDATE organizer_items SET deleted_at = ?, updated_at = ?, revision = revision + 1
        WHERE id = ? AND type = 'note' AND deleted_at IS NULL
      `).run(timestamp, timestamp, noteId);
      if (!result.changes) v.fail('NOT_FOUND', 'The note does not exist');
      this.db.prepare(`
        UPDATE workspace_panels SET deleted_at = ?, updated_at = ?, revision = revision + 1
        WHERE linked_organizer_id = ? AND feature_key = 'sticky-note' AND deleted_at IS NULL
      `).run(timestamp, timestamp, noteId);
      return { noteId };
    });
  }

  _normalizeStickyNote(input, creating) {
    const field = (key, validate, fallback) => {
      if (input[key] === undefined) return creating ? fallback : undefined;
      return validate(input[key]);
    };
    return {
      title: field('title', (value) => v.string(value, 'title', { max: 1000 }), 'New Note'),
      content: field('content', (value) => v.string(value, 'content', { max: 1000000 }), ''),
      color: field('color', (value) => v.string(value, 'color', { required: true, max: 30 }), '#fef08a'),
      floating: field('floating', (value) => v.boolean(value, 'floating'), false),
      x: field('x', (value) => v.number(value, 'x', { min: -100000, max: 100000 }), 100),
      y: field('y', (value) => v.number(value, 'y', { min: -100000, max: 100000 }), 100),
      width: field('width', (value) => v.number(value, 'width', { min: 1, max: 10000 }), 250),
      height: field('height', (value) => v.number(value, 'height', { min: 1, max: 10000 }), 200),
    };
  }

  _upsertStickyPanel(noteId, note, timestamp) {
    const panelId = `sticky:${noteId}`;
    this.db.prepare(`
      INSERT INTO workspace_panels (
        id, feature_key, linked_organizer_id, position, size_json, placement_json,
        style_json, visible, view_mode, created_at, updated_at, revision, deleted_at
      ) VALUES (?, 'sticky-note', ?, 0, ?, ?, ?, 1, ?, ?, ?, 1, NULL)
      ON CONFLICT(id) DO UPDATE SET
        size_json = excluded.size_json,
        placement_json = excluded.placement_json,
        style_json = excluded.style_json,
        visible = 1,
        view_mode = excluded.view_mode,
        updated_at = excluded.updated_at,
        revision = workspace_panels.revision + 1,
        deleted_at = NULL
    `).run(panelId, noteId, JSON.stringify({ width: note.width, height: note.height }),
      JSON.stringify({ x: note.x, y: note.y }), JSON.stringify({ color: note.color }),
      note.floating ? 'floating' : 'docked', timestamp, timestamp);
  }

  listWorkspacePanels(input = {}) {
    this._assertReady();
    v.object(input, 'workspace panel filters', ['includeDeleted']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    return this.db.prepare(`
      SELECT id, feature_key, linked_organizer_id, linked_canvas_id, column_id, position,
             size_json, visible, view_mode, created_at, updated_at, revision, deleted_at
      FROM workspace_panels ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'}
      ORDER BY column_id, position, created_at
    `).all().map((row) => ({
      ...toBooleanRow(row, ['visible']),
      size: row.size_json ? JSON.parse(row.size_json) : null,
      size_json: undefined,
    }));
  }

  saveWorkspacePanel(input) {
    this._assertReady();
    v.object(input, 'workspace panel', [
      'id', 'expectedRevision', 'featureKey', 'linkedOrganizerId', 'linkedCanvasId',
      'columnId', 'position', 'size', 'visible', 'viewMode',
    ]);
    const panelId = input.id === undefined ? id() : v.identifier(input.id, 'id');
    const existing = this.db.prepare('SELECT revision, deleted_at FROM workspace_panels WHERE id = ?').get(panelId);
    const fields = {
      featureKey: v.string(input.featureKey, 'featureKey', { required: true, max: 200 }),
      linkedOrganizerId: v.optional(input.linkedOrganizerId, (value) => v.identifier(value, 'linkedOrganizerId', { nullable: true })) ?? null,
      linkedCanvasId: v.optional(input.linkedCanvasId, (value) => v.identifier(value, 'linkedCanvasId', { nullable: true })) ?? null,
      columnId: v.optional(input.columnId, (value) => v.string(value, 'columnId', { nullable: true, max: 200 })) ?? null,
      position: v.optional(input.position, (value) => v.integer(value, 'position', { min: 0 })) ?? 0,
      sizeJson: input.size === undefined ? null : this._stringifyPanelSize(input.size),
      visible: v.optional(input.visible, (value) => v.boolean(value, 'visible')) ?? true,
      viewMode: v.optional(input.viewMode, (value) => v.string(value, 'viewMode', { nullable: true, max: 100 })) ?? null,
    };

    return this._write('workspace', (timestamp) => {
      if (existing) {
        const expected = v.integer(input.expectedRevision, 'expectedRevision', { min: 1 });
        this._requireCurrent('workspace_panels', panelId, expected);
        this.db.prepare(`
          UPDATE workspace_panels SET
            feature_key = ?, linked_organizer_id = ?, linked_canvas_id = ?, column_id = ?,
            position = ?, size_json = ?, visible = ?, view_mode = ?, updated_at = ?, revision = revision + 1
          WHERE id = ?
        `).run(fields.featureKey, fields.linkedOrganizerId, fields.linkedCanvasId, fields.columnId,
          fields.position, fields.sizeJson, fields.visible ? 1 : 0, fields.viewMode, timestamp, panelId);
      } else {
        if (input.expectedRevision !== undefined) v.fail('NOT_FOUND', 'The workspace panel does not exist');
        this.db.prepare(`
          INSERT INTO workspace_panels (
            id, feature_key, linked_organizer_id, linked_canvas_id, column_id, position,
            size_json, visible, view_mode, created_at, updated_at, revision
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(panelId, fields.featureKey, fields.linkedOrganizerId, fields.linkedCanvasId,
          fields.columnId, fields.position, fields.sizeJson, fields.visible ? 1 : 0,
          fields.viewMode, timestamp, timestamp);
      }
      const row = this.db.prepare('SELECT * FROM workspace_panels WHERE id = ?').get(panelId);
      return { row: { ...toBooleanRow(row, ['visible']), size: row.size_json ? JSON.parse(row.size_json) : null, size_json: undefined } };
    });
  }

  _stringifyPanelSize(value) {
    v.object(value, 'size', ['width', 'height']);
    return JSON.stringify({
      width: v.number(value.width, 'size.width', { min: 1, max: 10000 }),
      height: v.number(value.height, 'size.height', { min: 1, max: 10000 }),
    });
  }

  archiveWorkspacePanel(panelId, expectedRevision) {
    return this._archiveRow('workspace', 'workspace_panels', panelId, expectedRevision, ['visible']);
  }

  _folioRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      journalId: row.journal_id,
      type: row.type,
      title: row.title,
      content: JSON.parse(row.content_json),
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  _journalRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      tags: JSON.parse(row.tags_json),
      cover: row.cover_key || '',
      page: row.page_key || '',
      settings: row.settings_json ? JSON.parse(row.settings_json) : {},
      folioCount: row.folio_count,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  listJournals() {
    this._assertReady();
    return this.db.prepare(`
      SELECT j.*,
             (SELECT COUNT(*) FROM folios f WHERE f.journal_id = j.id AND f.deleted_at IS NULL) AS folio_count
      FROM journals j
      WHERE j.deleted_at IS NULL
      ORDER BY j.position, j.created_at
    `).all().map((row) => this._journalRow(row));
  }

  createJournal(input = {}) {
    v.object(input, 'journal', ['title', 'tags', 'cover', 'page', 'folios']);
    const journalId = id();
    const title = v.string(input.title, 'title', { required: true, max: 1000 });
    const tags = input.tags === undefined ? [] : v.stringArray(input.tags, 'tags', { maxItems: 100, maxLength: 200 });
    const cover = v.optional(input.cover, (value) => v.string(value, 'cover', { max: 500 })) ?? '';
    const page = v.optional(input.page, (value) => v.string(value, 'page', { max: 500 })) ?? '';
    const folios = input.folios === undefined ? [] : input.folios;
    if (!Array.isArray(folios) || folios.length > 500) v.fail('INVALID_INPUT', 'folios must be a list with at most 500 items');
    const normalizedFolios = folios.map((folio, index) => {
      v.object(folio, `folios[${index}]`, ['type', 'title', 'content']);
      return {
        id: id(),
        type: v.optional(folio.type, (value) => v.string(value, `folios[${index}].type`, { required: true, max: 100 })) ?? 'notes',
        title: v.optional(folio.title, (value) => v.string(value, `folios[${index}].title`, { max: 1000 })) ?? '',
        contentJson: this._jsonValue(folio.content ?? {}, `folios[${index}].content`, 5000000),
      };
    });

    return this._write('forest', (timestamp) => {
      const position = this.db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS position FROM journals WHERE deleted_at IS NULL').get().position;
      this.db.prepare(`
        INSERT INTO journals (id, title, cover_key, tags_json, page_key, position, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(journalId, title, cover, JSON.stringify(tags), page, position, timestamp, timestamp);
      const insert = this.db.prepare(`
        INSERT INTO folios (id, journal_id, type, title, content_json, position, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      normalizedFolios.forEach((folio, index) => {
        insert.run(folio.id, journalId, folio.type, folio.title, folio.contentJson, index, timestamp + index, timestamp + index);
      });
      const row = this.db.prepare(`
        SELECT j.*, (SELECT COUNT(*) FROM folios f WHERE f.journal_id = j.id AND f.deleted_at IS NULL) AS folio_count
        FROM journals j WHERE j.id = ?
      `).get(journalId);
      return { row: this._journalRow(row) };
    });
  }

  updateJournal(journalId, patch = {}) {
    journalId = v.identifier(journalId, 'journalId');
    v.object(patch, 'journal changes', ['title', 'tags', 'cover', 'page', 'settings']);
    if (!Object.keys(patch).length) v.fail('INVALID_INPUT', 'At least one journal change is required');
    const title = patch.title === undefined ? undefined : v.string(patch.title, 'title', { required: true, max: 1000 });
    const tags = patch.tags === undefined ? undefined : v.stringArray(patch.tags, 'tags', { maxItems: 100, maxLength: 200 });
    const cover = patch.cover === undefined ? undefined : v.string(patch.cover, 'cover', { max: 500 });
    const page = patch.page === undefined ? undefined : v.string(patch.page, 'page', { max: 500 });
    const settingsJson = patch.settings === undefined ? undefined : this._jsonValue(patch.settings, 'settings', 100000);
    return this._write('forest', (timestamp) => {
      const current = this.db.prepare('SELECT * FROM journals WHERE id = ? AND deleted_at IS NULL').get(journalId);
      if (!current) v.fail('NOT_FOUND', 'Journal not found');
      this.db.prepare(`
        UPDATE journals SET title = ?, tags_json = ?, cover_key = ?, page_key = ?, settings_json = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(
        title ?? current.title,
        tags === undefined ? current.tags_json : JSON.stringify(tags),
        cover ?? current.cover_key,
        page ?? current.page_key,
        settingsJson ?? current.settings_json ?? '{}',
        timestamp,
        journalId,
      );
      const row = this.db.prepare(`
        SELECT j.*, (SELECT COUNT(*) FROM folios f WHERE f.journal_id = j.id AND f.deleted_at IS NULL) AS folio_count
        FROM journals j WHERE j.id = ?
      `).get(journalId);
      return { row: this._journalRow(row) };
    });
  }

  archiveJournal(journalId) {
    journalId = v.identifier(journalId, 'journalId');
    return this._write('forest', (timestamp) => {
      const journal = this.db.prepare('SELECT id FROM journals WHERE id = ? AND deleted_at IS NULL').get(journalId);
      if (!journal) v.fail('NOT_FOUND', 'Journal not found');
      this.db.prepare('UPDATE folios SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE journal_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, journalId);
      this.db.prepare('UPDATE journals SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, journalId);
      return { ok: true };
    });
  }

  listFolios(journalId) {
    this._assertReady();
    journalId = v.identifier(journalId, 'journalId');
    return this.db.prepare(`
      SELECT * FROM folios WHERE journal_id = ? AND deleted_at IS NULL ORDER BY position, created_at
    `).all(journalId).map((row) => this._folioRow(row));
  }

  createFolio(journalId, folio = {}, opts = {}) {
    journalId = v.identifier(journalId, 'journalId');
    v.object(folio, 'folio', ['type', 'title', 'content']);
    v.object(opts || {}, 'folio options', ['afterId']);
    const afterId = opts?.afterId == null ? null : v.identifier(opts.afterId, 'afterId');
    const folioId = id();
    const type = v.optional(folio.type, (value) => v.string(value, 'type', { required: true, max: 100 })) ?? 'notes';
    const title = v.optional(folio.title, (value) => v.string(value, 'title', { max: 1000 })) ?? '';
    const contentJson = this._jsonValue(folio.content ?? {}, 'content', 5000000);
    return this._write('forest', (timestamp) => {
      const journal = this.db.prepare('SELECT id FROM journals WHERE id = ? AND deleted_at IS NULL').get(journalId);
      if (!journal) v.fail('NOT_FOUND', 'Journal not found');
      const after = afterId
        ? this.db.prepare('SELECT position FROM folios WHERE id = ? AND journal_id = ? AND deleted_at IS NULL').get(afterId, journalId)
        : null;
      const position = after
        ? after.position + 1
        : this.db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS position FROM folios WHERE journal_id = ? AND deleted_at IS NULL').get(journalId).position;
      if (after) {
        this.db.prepare('UPDATE folios SET position = position + 1, updated_at = ?, revision = revision + 1 WHERE journal_id = ? AND position > ? AND deleted_at IS NULL')
          .run(timestamp, journalId, after.position);
      }
      this.db.prepare(`
        INSERT INTO folios (id, journal_id, type, title, content_json, position, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(folioId, journalId, type, title, contentJson, position, timestamp, timestamp);
      this.db.prepare('UPDATE journals SET updated_at = ?, revision = revision + 1 WHERE id = ?').run(timestamp, journalId);
      return { row: this._folioRow(this.db.prepare('SELECT * FROM folios WHERE id = ?').get(folioId)) };
    });
  }

  updateFolio(folioId, patch = {}) {
    folioId = v.identifier(folioId, 'folioId');
    v.object(patch, 'folio changes', ['title', 'content']);
    if (!Object.keys(patch).length) v.fail('INVALID_INPUT', 'At least one folio change is required');
    const title = patch.title === undefined ? undefined : v.string(patch.title, 'title', { max: 1000 });
    const contentJson = patch.content === undefined ? undefined : this._jsonValue(patch.content, 'content', 5000000);
    return this._write('forest', (timestamp) => {
      const current = this.db.prepare('SELECT * FROM folios WHERE id = ? AND deleted_at IS NULL').get(folioId);
      if (!current) v.fail('NOT_FOUND', 'Folio not found');
      this.db.prepare(`
        UPDATE folios SET title = ?, content_json = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
      `).run(title ?? current.title, contentJson ?? current.content_json, timestamp, folioId);
      return { row: this._folioRow(this.db.prepare('SELECT * FROM folios WHERE id = ?').get(folioId)) };
    });
  }

  archiveFolio(folioId) {
    folioId = v.identifier(folioId, 'folioId');
    return this._write('forest', (timestamp) => {
      const current = this.db.prepare('SELECT journal_id FROM folios WHERE id = ? AND deleted_at IS NULL').get(folioId);
      if (!current) v.fail('NOT_FOUND', 'Folio not found');
      this.db.prepare('UPDATE folios SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, folioId);
      this.db.prepare('UPDATE journals SET updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, current.journal_id);
      return { ok: true };
    });
  }

  _postAttachments(postId, role) {
    return this.db.prepare(`
      SELECT a.id, f.path, f.kind, f.display_name AS name
      FROM post_attachments a JOIN external_files f ON f.id = a.file_id
      WHERE a.post_id = ? AND a.role = ? AND a.deleted_at IS NULL AND f.deleted_at IS NULL
      ORDER BY a.position, a.created_at
    `).all(postId, role);
  }

  _notefallRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      authorType: row.author_type,
      authorAgentId: row.author_agent_id,
      body: row.body,
      media: this._postAttachments(row.id, 'media'),
      journalId: row.journal_id,
      tags: JSON.parse(row.tags_json),
      statusDot: row.status_dot,
      sourceApp: row.source_app,
      sourceIcon: row.source_icon,
      captureMode: row.capture_mode,
      sessionStart: row.session_start,
      sessionEnd: row.session_end,
      screenshots: this._postAttachments(row.id, 'screenshot'),
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  listNotefallPosts() {
    this._assertReady();
    return this.db.prepare('SELECT * FROM notefall_posts WHERE deleted_at IS NULL ORDER BY created_at DESC')
      .all().map((row) => this._notefallRow(row));
  }

  _normalizeAttachment(value, label) {
    v.object(value, label, ['id', 'path', 'kind', 'name', 'size', 'modifiedAt']);
    let modifiedAt = value.modifiedAt;
    if (typeof modifiedAt === 'string') modifiedAt = Date.parse(modifiedAt);
    if (!Number.isFinite(modifiedAt)) modifiedAt = null;
    return this._normalizeExternalFile({
      path: value.path,
      displayName: value.name || path.basename(value.path || ''),
      kind: value.kind || 'file',
      size: value.size ?? null,
      modifiedAt,
    });
  }

  _replacePostAttachments(postId, role, attachments, timestamp) {
    if (!Array.isArray(attachments) || attachments.length > 200) {
      v.fail('INVALID_INPUT', `${role} attachments must be a list with at most 200 items`);
    }
    this.db.prepare(`
      UPDATE post_attachments SET deleted_at = ?, updated_at = ?, revision = revision + 1
      WHERE post_id = ? AND role = ? AND deleted_at IS NULL
    `).run(timestamp, timestamp, postId, role);
    const insert = this.db.prepare(`
      INSERT INTO post_attachments (id, post_id, file_id, role, position, created_at, updated_at, revision)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    attachments.forEach((attachment, position) => {
      const file = this._normalizeAttachment(attachment, `${role}[${position}]`);
      insert.run(id(), postId, this._upsertExternalFile(file, timestamp), role, position, timestamp, timestamp);
    });
  }

  createNotefallPost(input = {}) {
    v.object(input, 'Notefalls post', ['body', 'media', 'journalId', 'tags', 'statusDot']);
    const postId = id();
    const body = v.optional(input.body, (value) => v.string(value, 'body', { max: 200000 })) ?? '';
    const tags = input.tags === undefined ? [] : v.stringArray(input.tags, 'tags', { maxItems: 100, maxLength: 200 });
    const journalId = input.journalId == null ? null : v.identifier(input.journalId, 'journalId');
    const statusDot = input.statusDot == null ? null : v.string(input.statusDot, 'statusDot', { max: 100 });
    const media = input.media ?? [];
    return this._write('forest', (timestamp) => {
      if (journalId && !this.db.prepare('SELECT id FROM journals WHERE id = ? AND deleted_at IS NULL').get(journalId)) {
        v.fail('INVALID_RELATION', 'journalId must refer to an active journal');
      }
      this.db.prepare(`
        INSERT INTO notefall_posts (
          id, title, body, author_type, journal_id, tags_json, status_dot, source_icon,
          capture_mode, created_at, updated_at, revision
        ) VALUES (?, '', ?, 'user', ?, ?, ?, 'note', 'manual', ?, ?, 1)
      `).run(postId, body, journalId, JSON.stringify(tags), statusDot, timestamp, timestamp);
      this._replacePostAttachments(postId, 'media', media, timestamp);
      return { row: this._notefallRow(this.db.prepare('SELECT * FROM notefall_posts WHERE id = ?').get(postId)) };
    });
  }

  updateNotefallPost(postId, patch = {}) {
    postId = v.identifier(postId, 'postId');
    v.object(patch, 'Notefalls changes', ['body', 'tags', 'media', 'notes', 'screenshots']);
    if (!Object.keys(patch).length) v.fail('INVALID_INPUT', 'At least one post change is required');
    const body = patch.body === undefined ? undefined : v.string(patch.body, 'body', { max: 200000 });
    const tagsJson = patch.tags === undefined ? undefined : JSON.stringify(v.stringArray(patch.tags, 'tags', { maxItems: 100, maxLength: 200 }));
    const notes = patch.notes === undefined ? undefined : v.string(patch.notes, 'notes', { nullable: true, max: 500000 });
    return this._write('forest', (timestamp) => {
      const current = this.db.prepare('SELECT * FROM notefall_posts WHERE id = ? AND deleted_at IS NULL').get(postId);
      if (!current) v.fail('NOT_FOUND', 'Notefalls post not found');
      this.db.prepare(`
        UPDATE notefall_posts SET body = ?, tags_json = ?, notes = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
      `).run(body ?? current.body, tagsJson ?? current.tags_json, notes === undefined ? current.notes : notes, timestamp, postId);
      if (patch.media !== undefined) this._replacePostAttachments(postId, 'media', patch.media, timestamp);
      if (patch.screenshots !== undefined) this._replacePostAttachments(postId, 'screenshot', patch.screenshots, timestamp);
      return { row: this._notefallRow(this.db.prepare('SELECT * FROM notefall_posts WHERE id = ?').get(postId)) };
    });
  }

  archiveNotefallPost(postId) {
    postId = v.identifier(postId, 'postId');
    return this._write('forest', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM notefall_posts WHERE id = ? AND deleted_at IS NULL').get(postId)) {
        v.fail('NOT_FOUND', 'Notefalls post not found');
      }
      this.db.prepare('UPDATE post_attachments SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE post_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, postId);
      this.db.prepare('UPDATE notefall_posts SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, postId);
      return { ok: true };
    });
  }

  getForestState() {
    this._assertReady();
    const saved = this.db.prepare('SELECT value_json FROM forest_view_state WHERE singleton_id = 1').get();
    const view = saved ? JSON.parse(saved.value_json) : {};
    const projects = this.db.prepare('SELECT * FROM forest_projects WHERE deleted_at IS NULL ORDER BY created_at')
      .all().map((project) => {
        const data = JSON.parse(project.data_json);
        const files = this.db.prepare(`
          SELECT ff.*, ef.path, ef.display_name, ef.kind, ef.size, ef.modified_at
          FROM forest_files ff JOIN external_files ef ON ef.id = ff.file_id
          WHERE ff.project_id = ? AND ff.deleted_at IS NULL AND ef.deleted_at IS NULL
          ORDER BY ff.position, ff.created_at
        `).all(project.id).map((file) => ({
          ...JSON.parse(file.data_json),
          id: file.board_file_id,
          name: file.display_name,
          path: file.path,
          size: file.size,
          modifiedAt: file.modified_at == null ? null : new Date(file.modified_at).toISOString(),
          typeGroup: file.kind,
          tags: JSON.parse(file.tags_json),
        }));
        return {
          ...data,
          id: project.id,
          name: project.title,
          x: project.position_x,
          y: project.position_y,
          files,
          revision: project.revision,
        };
      });
    return {
      version: 1,
      viewport: { x: 260, y: 160, scale: 1, ...(view.viewport || {}) },
      hunterDirs: Array.isArray(view.hunterDirs) ? view.hunterDirs : [],
      projects,
    };
  }

  updateForestProjectScoring(projectId, expectedRevision, patch = {}) {
    projectId = v.identifier(projectId, 'projectId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    v.object(patch, 'Forest project scoring changes', ['deadline', 'importance', 'size', 'relevance']);
    const keys = Object.keys(patch);
    if (!keys.length) v.fail('INVALID_INPUT', 'At least one scoring change is required');

    const normalized = {};
    if (patch.deadline !== undefined) {
      const deadline = v.string(patch.deadline, 'deadline', { nullable: true, max: 10 });
      if (deadline != null && deadline !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
          v.fail('INVALID_INPUT', 'deadline must use YYYY-MM-DD');
        }
        const parsed = new Date(`${deadline}T00:00:00Z`);
        if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== deadline) {
          v.fail('INVALID_INPUT', 'deadline must be a real calendar date');
        }
        normalized.deadline = deadline;
      } else {
        normalized.deadline = null;
      }
    }
    if (patch.importance !== undefined) {
      normalized.importance = patch.importance == null
        ? null
        : v.integer(patch.importance, 'importance', { min: 1, max: 10 });
    }
    if (patch.size !== undefined) {
      normalized.size = patch.size == null
        ? null
        : v.number(patch.size, 'size', { min: 0, max: 1000000 });
    }
    if (patch.relevance !== undefined) {
      const relevance = v.string(patch.relevance, 'relevance', { nullable: true, max: 5000 });
      normalized.relevance = relevance == null || relevance.trim() === '' ? null : relevance.trim();
    }

    return this._write('forest', (timestamp) => {
      this._requireCurrent('forest_projects', projectId, expectedRevision);
      const current = this.db.prepare('SELECT * FROM forest_projects WHERE id = ?').get(projectId);
      const data = JSON.parse(current.data_json);
      Object.entries(normalized).forEach(([key, value]) => {
        if (value == null) delete data[key];
        else data[key] = value;
      });
      this.db.prepare(`
        UPDATE forest_projects
        SET data_json = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(this._jsonValue(data, 'Forest project data', 5000000), timestamp, projectId);
      const updated = this.db.prepare('SELECT * FROM forest_projects WHERE id = ?').get(projectId);
      const updatedData = JSON.parse(updated.data_json);
      return {
        row: {
          id: updated.id,
          name: updated.title,
          deadline: updatedData.deadline ?? null,
          importance: updatedData.importance ?? null,
          size: updatedData.size ?? null,
          relevance: updatedData.relevance ?? null,
          revision: updated.revision,
        },
      };
    });
  }

  saveForestState(state = {}) {
    v.object(state, 'Forest state', ['version', 'viewport', 'hunterDirs', 'projects']);
    v.object(state.viewport || {}, 'viewport', ['x', 'y', 'scale']);
    const viewport = {
      x: v.number(state.viewport?.x ?? 260, 'viewport.x', { min: -10000000, max: 10000000 }),
      y: v.number(state.viewport?.y ?? 160, 'viewport.y', { min: -10000000, max: 10000000 }),
      scale: v.number(state.viewport?.scale ?? 1, 'viewport.scale', { min: 0.01, max: 100 }),
    };
    const hunterDirs = state.hunterDirs === undefined ? [] : v.stringArray(state.hunterDirs, 'hunterDirs', { maxItems: 100, maxLength: 4096 });
    const projects = state.projects ?? [];
    if (!Array.isArray(projects) || projects.length > FOREST_MAX_PROJECTS) {
      v.fail('INVALID_INPUT', `projects must be a list with at most ${FOREST_MAX_PROJECTS} items`);
    }
    const normalized = projects.map((project, projectIndex) => {
      if (!project || typeof project !== 'object' || Array.isArray(project)) v.fail('INVALID_INPUT', `projects[${projectIndex}] must be an object`);
      const projectId = v.identifier(project.id, `projects[${projectIndex}].id`);
      const projectFiles = project.files ?? [];
      if (!Array.isArray(projectFiles)) v.fail('INVALID_INPUT', `projects[${projectIndex}].files must be a list`);
      if (projectFiles.length > FOREST_MAX_FILES_PER_PROJECT) {
        v.fail('INVALID_INPUT', `projects[${projectIndex}] ("${project.name}") has ${projectFiles.length} files — max ${FOREST_MAX_FILES_PER_PROJECT} per project`);
      }
      const projectData = { ...project };
      delete projectData.id;
      delete projectData.name;
      delete projectData.x;
      delete projectData.y;
      delete projectData.files;
      return {
        id: projectId,
        title: v.string(project.name, `projects[${projectIndex}].name`, { required: true, max: 1000 }),
        x: v.number(Number(project.x), `projects[${projectIndex}].x`, { min: -10000000, max: 10000000 }),
        y: v.number(Number(project.y), `projects[${projectIndex}].y`, { min: -10000000, max: 10000000 }),
        dataJson: this._jsonValue(projectData, `projects[${projectIndex}]`, 5000000),
        files: projectFiles.map((file, fileIndex) => {
          if (!file || typeof file !== 'object' || Array.isArray(file)) v.fail('INVALID_INPUT', `projects[${projectIndex}].files[${fileIndex}] must be an object`);
          let modifiedAt = file.modifiedAt;
          if (typeof modifiedAt === 'string') modifiedAt = Date.parse(modifiedAt);
          if (!Number.isFinite(modifiedAt)) modifiedAt = null;
          const fileData = { ...file };
          delete fileData.id;
          delete fileData.name;
          delete fileData.path;
          delete fileData.size;
          delete fileData.modifiedAt;
          delete fileData.tags;
          delete fileData.typeGroup;
          return {
            boardId: v.identifier(file.id, `projects[${projectIndex}].files[${fileIndex}].id`),
            external: this._normalizeExternalFile({
              path: file.path,
              displayName: file.name || path.basename(file.path || ''),
              kind: file.typeGroup || 'other',
              size: file.size ?? null,
              modifiedAt,
            }),
            tagsJson: JSON.stringify(file.tags === undefined ? [] : v.stringArray(file.tags, `projects[${projectIndex}].files[${fileIndex}].tags`, { maxItems: 100, maxLength: 200 })),
            dataJson: this._jsonValue(fileData, `projects[${projectIndex}].files[${fileIndex}]`, 1000000),
          };
        }),
      };
    });

    return this._write('forest', (timestamp) => {
      const activeProjectIds = [];
      normalized.forEach((project) => {
        activeProjectIds.push(project.id);
        this.db.prepare(`
          INSERT INTO forest_projects (id, title, position_x, position_y, data_json, created_at, updated_at, revision, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL)
          ON CONFLICT(id) DO UPDATE SET title = excluded.title, position_x = excluded.position_x,
            position_y = excluded.position_y, data_json = excluded.data_json, updated_at = excluded.updated_at,
            revision = forest_projects.revision + 1, deleted_at = NULL
        `).run(project.id, project.title, project.x, project.y, project.dataJson, timestamp, timestamp);
        const activeBoardIds = [];
        project.files.forEach((file, position) => {
          activeBoardIds.push(file.boardId);
          const externalId = this._upsertExternalFile(file.external, timestamp);
          const existing = this.db.prepare('SELECT id FROM forest_files WHERE project_id = ? AND board_file_id = ?').get(project.id, file.boardId);
          const relationId = existing?.id || id();
          this.db.prepare(`
            INSERT INTO forest_files (id, project_id, file_id, board_file_id, position, tags_json, data_json, created_at, updated_at, revision, deleted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)
            ON CONFLICT(project_id, board_file_id) DO UPDATE SET file_id = excluded.file_id, position = excluded.position,
              tags_json = excluded.tags_json, data_json = excluded.data_json, updated_at = excluded.updated_at,
              revision = forest_files.revision + 1, deleted_at = NULL
          `).run(relationId, project.id, externalId, file.boardId, position, file.tagsJson, file.dataJson, timestamp, timestamp);
        });
        if (activeBoardIds.length) {
          const placeholders = activeBoardIds.map(() => '?').join(', ');
          this.db.prepare(`UPDATE forest_files SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE project_id = ? AND deleted_at IS NULL AND board_file_id NOT IN (${placeholders})`)
            .run(timestamp, timestamp, project.id, ...activeBoardIds);
        } else {
          this.db.prepare('UPDATE forest_files SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE project_id = ? AND deleted_at IS NULL')
            .run(timestamp, timestamp, project.id);
        }
      });
      if (activeProjectIds.length) {
        const placeholders = activeProjectIds.map(() => '?').join(', ');
        this.db.prepare(`UPDATE forest_files SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE deleted_at IS NULL AND project_id NOT IN (${placeholders})`)
          .run(timestamp, timestamp, ...activeProjectIds);
        this.db.prepare(`UPDATE forest_projects SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE deleted_at IS NULL AND id NOT IN (${placeholders})`)
          .run(timestamp, timestamp, ...activeProjectIds);
      } else {
        this.db.prepare('UPDATE forest_files SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE deleted_at IS NULL').run(timestamp, timestamp);
        this.db.prepare('UPDATE forest_projects SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE deleted_at IS NULL').run(timestamp, timestamp);
      }
      const viewJson = JSON.stringify({ version: 1, viewport, hunterDirs });
      this.db.prepare(`
        INSERT INTO forest_view_state (singleton_id, value_json, updated_at, revision) VALUES (1, ?, ?, 1)
        ON CONFLICT(singleton_id) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at,
          revision = forest_view_state.revision + 1
      `).run(viewJson, timestamp);
      return { ok: true };
    });
  }

  _recorderSession(row, includeEvents = false) {
    if (!row) return null;
    const session = {
      id: row.id,
      name: row.name,
      start_time: new Date(row.started_at).toISOString(),
      end_time: row.ended_at == null ? null : new Date(row.ended_at).toISOString(),
      revision: row.revision,
    };
    if (includeEvents) {
      session.data = {
        events: this.db.prepare(`
          SELECT * FROM recorder_events WHERE session_id = ? AND deleted_at IS NULL ORDER BY sequence
        `).all(row.id).map((event) => ({
          id: event.id,
          type: event.event_type,
          timestamp: new Date(event.occurred_at).toISOString(),
          data: JSON.parse(event.data_json),
        })),
      };
    }
    return session;
  }

  listRecorderSessions() {
    this._assertReady();
    return this.db.prepare('SELECT * FROM recorder_sessions WHERE deleted_at IS NULL ORDER BY started_at DESC')
      .all().map((row) => this._recorderSession(row));
  }

  getRecorderSession(sessionId) {
    this._assertReady();
    sessionId = v.identifier(sessionId, 'sessionId');
    const row = this.db.prepare('SELECT * FROM recorder_sessions WHERE id = ? AND deleted_at IS NULL').get(sessionId);
    if (!row) v.fail('NOT_FOUND', 'Recorder session not found');
    return this._recorderSession(row, true);
  }

  createRecorderSession(name) {
    name = v.string(name, 'name', { required: true, max: 1000 });
    const sessionId = id();
    return this._write('recorder', (timestamp) => {
      this.db.prepare(`
        INSERT INTO recorder_sessions (id, name, started_at, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(sessionId, name, timestamp, timestamp, timestamp);
      return { row: this._recorderSession(this.db.prepare('SELECT * FROM recorder_sessions WHERE id = ?').get(sessionId), true) };
    });
  }

  endRecorderSession(sessionId) {
    sessionId = v.identifier(sessionId, 'sessionId');
    return this._write('recorder', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM recorder_sessions WHERE id = ? AND deleted_at IS NULL').get(sessionId)) {
        v.fail('NOT_FOUND', 'Recorder session not found');
      }
      this.db.prepare('UPDATE recorder_sessions SET ended_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, sessionId);
      return { row: this._recorderSession(this.db.prepare('SELECT * FROM recorder_sessions WHERE id = ?').get(sessionId), true) };
    });
  }

  addRecorderEvent(sessionId, eventType, data) {
    sessionId = v.identifier(sessionId, 'sessionId');
    eventType = v.string(eventType, 'eventType', { required: true, max: 200 });
    const dataJson = this._jsonValue(data ?? {}, 'event data', 2000000);
    const eventId = id();
    return this._write('recorder', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM recorder_sessions WHERE id = ? AND deleted_at IS NULL').get(sessionId)) {
        v.fail('NOT_FOUND', 'Recorder session not found');
      }
      const sequence = this.db.prepare('SELECT COALESCE(MAX(sequence), -1) + 1 AS sequence FROM recorder_events WHERE session_id = ?').get(sessionId).sequence;
      this.db.prepare(`
        INSERT INTO recorder_events (id, session_id, sequence, event_type, data_json, occurred_at, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(eventId, sessionId, sequence, eventType, dataJson, timestamp, timestamp, timestamp);
      this.db.prepare('UPDATE recorder_sessions SET updated_at = ?, revision = revision + 1 WHERE id = ?').run(timestamp, sessionId);
      return { row: { id: eventId, type: eventType, timestamp: new Date(timestamp).toISOString(), data } };
    });
  }

  renameRecorderSession(sessionId, name) {
    sessionId = v.identifier(sessionId, 'sessionId');
    name = v.string(name, 'name', { required: true, max: 1000 });
    return this._write('recorder', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM recorder_sessions WHERE id = ? AND deleted_at IS NULL').get(sessionId)) {
        v.fail('NOT_FOUND', 'Recorder session not found');
      }
      this.db.prepare('UPDATE recorder_sessions SET name = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(name, timestamp, sessionId);
      return { row: this._recorderSession(this.db.prepare('SELECT * FROM recorder_sessions WHERE id = ?').get(sessionId)) };
    });
  }

  archiveRecorderSession(sessionId) {
    sessionId = v.identifier(sessionId, 'sessionId');
    return this._write('recorder', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM recorder_sessions WHERE id = ? AND deleted_at IS NULL').get(sessionId)) {
        v.fail('NOT_FOUND', 'Recorder session not found');
      }
      this.db.prepare('UPDATE recorder_events SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE session_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, sessionId);
      this.db.prepare('UPDATE recorder_sessions SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, sessionId);
      return { ok: true };
    });
  }

  listThreads(input = {}) {
    this._assertReady();
    v.object(input, 'thread filters', ['id', 'kind', 'query', 'includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const clauses = [];
    const params = [];
    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (input.id !== undefined) {
      clauses.push('id = ?');
      params.push(v.identifier(input.id, 'id'));
    }
    if (input.kind !== undefined) {
      clauses.push('kind = ?');
      params.push(v.string(input.kind, 'kind', { required: true, max: 100 }));
    }
    if (input.query !== undefined) {
      const query = v.string(input.query, 'query', { required: true, max: 500 }).toLowerCase();
      clauses.push(`(
        LOWER(title) LIKE ? OR EXISTS (
          SELECT 1 FROM messages m
          WHERE m.thread_id = threads.id AND m.deleted_at IS NULL AND LOWER(m.content_text) LIKE ?
        )
      )`);
      params.push(`%${query}%`, `%${query}%`);
    }
    const limit = input.limit === undefined ? 500 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    return this.db.prepare(`
      SELECT id, kind, title, model_profile_id, status, created_at, updated_at, revision, deleted_at
      FROM threads ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY updated_at DESC LIMIT ?
    `).all(...params, limit);
  }

  createThread(input = {}) {
    v.object(input, 'thread', ['id', 'kind', 'title', 'modelProfileId']);
    const thread = {
      id: input.id === undefined ? id() : v.identifier(input.id, 'id'),
      kind: v.optional(input.kind, (value) => v.string(value, 'kind', { required: true, max: 100 })) ?? 'chat',
      title: v.optional(input.title, (value) => v.string(value, 'title', { max: 1000 })) ?? '',
      modelProfileId: v.optional(input.modelProfileId, (value) => v.identifier(value, 'modelProfileId', { nullable: true })) ?? null,
    };
    return this._write('threads', (timestamp) => {
      this.db.prepare(`
        INSERT INTO threads (id, kind, title, model_profile_id, status, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, 'active', ?, ?, 1)
      `).run(thread.id, thread.kind, thread.title, thread.modelProfileId, timestamp, timestamp);
      return { row: this.db.prepare('SELECT * FROM threads WHERE id = ?').get(thread.id) };
    });
  }

  _ensureThreadRecord(threadId, kind, timestamp) {
    this.db.prepare(`
      INSERT INTO threads (id, kind, title, status, created_at, updated_at, revision, deleted_at)
      VALUES (?, ?, '', 'active', ?, ?, 1, NULL)
      ON CONFLICT(id) DO NOTHING
    `).run(threadId, kind, timestamp, timestamp);
  }

  updateThread(threadId, patch = {}) {
    threadId = v.identifier(threadId, 'threadId');
    v.object(patch, 'thread changes', ['title', 'status', 'modelProfileId']);
    if (!Object.keys(patch).length) v.fail('INVALID_INPUT', 'At least one thread change is required');
    const title = patch.title === undefined ? undefined : v.string(patch.title, 'title', { max: 1000 });
    const status = patch.status === undefined ? undefined : v.string(patch.status, 'status', { required: true, max: 100 });
    const modelProfileId = patch.modelProfileId === undefined
      ? undefined
      : v.identifier(patch.modelProfileId, 'modelProfileId', { nullable: true });
    return this._write('threads', (timestamp) => {
      const current = this.db.prepare('SELECT * FROM threads WHERE id = ? AND deleted_at IS NULL').get(threadId);
      if (!current) v.fail('NOT_FOUND', 'Thread not found');
      this.db.prepare(`
        UPDATE threads SET title = ?, status = ?, model_profile_id = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(title ?? current.title, status ?? current.status,
        modelProfileId === undefined ? current.model_profile_id : modelProfileId, timestamp, threadId);
      return { row: this.db.prepare('SELECT * FROM threads WHERE id = ?').get(threadId) };
    });
  }

  listMessages(threadId) {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    return this.db.prepare(`
      SELECT id, thread_id, sequence, role, content_text, is_error, created_at, updated_at, revision
      FROM messages WHERE thread_id = ? AND deleted_at IS NULL ORDER BY sequence
    `).all(threadId).map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      sequence: row.sequence,
      role: row.role,
      content: row.content_text,
      isError: row.is_error === 1,
      timestamp: new Date(row.created_at).toISOString(),
      revision: row.revision,
    }));
  }

  appendMessage(threadId, input = {}) {
    threadId = v.identifier(threadId, 'threadId');
    v.object(input, 'message', ['role', 'content', 'isError', 'activityId', 'outcome']);
    // `messages` is deliberately the clean, user-visible transcript. System
    // prompts and tool traffic belong in ai_turn_audit_events instead.
    const role = v.oneOf(input.role, 'role', ['user', 'assistant']);
    const content = v.string(input.content, 'content', { max: 2000000 });
    const isError = input.isError === undefined ? false : v.boolean(input.isError, 'isError');
    const messageId = id();
    const saved = this._write('threads', (timestamp) => {
      if (!this.db.prepare('SELECT id FROM threads WHERE id = ? AND deleted_at IS NULL').get(threadId)) {
        v.fail('NOT_FOUND', 'Thread not found');
      }
      const sequence = this.db.prepare('SELECT COALESCE(MAX(sequence), -1) + 1 AS sequence FROM messages WHERE thread_id = ?').get(threadId).sequence;
      this.db.prepare(`
        INSERT INTO messages (id, thread_id, sequence, role, content_text, is_error, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(messageId, threadId, sequence, role, content, isError ? 1 : 0, timestamp, timestamp);
      this.db.prepare('UPDATE threads SET updated_at = ?, revision = revision + 1 WHERE id = ?').run(timestamp, threadId);
      return { row: this.listMessages(threadId).find((message) => message.id === messageId) };
    });
    const label = role === 'user' ? 'User message' : 'AI response';
    this.logger?.info?.(
      `chat.${role}_message`,
      `${label} saved to conversation ${threadId}:\n${content}`,
      {
        threadId,
        messageId,
        role,
        content,
        isError,
        effect: 'This exact user-visible text is stored in the Messages table.',
      },
      {
        threadId,
        entryCategory: 'chat',
        source: role === 'user' ? 'user' : 'agent',
        activityId: input.activityId || null,
        phase: 'transcript',
        outcome: input.outcome || (isError ? 'failed' : 'saved'),
      },
    );
    return saved;
  }

  /**
   * Append one immutable piece of developer-facing AI evidence.
   *
   * A provider request and its later response/error are separate rows with the
   * same turn/invocation IDs. Nothing here updates or deletes earlier evidence.
   * Prompts and message history are intentionally retained; callers must redact
   * credentials before passing an envelope to this storage boundary.
   */
  appendAiTurnAuditEvent(input = {}) {
    v.object(input, 'AI turn audit event', [
      'threadId',
      'turnId',
      'invocationId',
      'eventType',
      'turnKind',
      'provider',
      'model',
      'modality',
      'outcome',
      'effectiveConfig',
      'permissionPolicy',
      'request',
      'response',
      'error',
      'tokenUsage',
    ]);
    const threadId = v.identifier(input.threadId, 'threadId');
    const turnId = v.identifier(input.turnId, 'turnId');
    const invocationId = input.invocationId == null
      ? null
      : v.identifier(input.invocationId, 'invocationId');
    const eventType = v.string(input.eventType, 'eventType', { required: true, max: 100 });
    const turnKind = v.string(input.turnKind, 'turnKind', { required: true, max: 100 });
    const provider = v.optional(
      input.provider,
      (value) => v.string(value, 'provider', { nullable: true, max: 100 }),
    ) ?? null;
    const model = v.optional(
      input.model,
      (value) => v.string(value, 'model', { nullable: true, max: 500 }),
    ) ?? null;
    const modality = v.optional(
      input.modality,
      (value) => v.string(value, 'modality', { nullable: true, max: 100 }),
    ) ?? null;
    const outcome = v.string(input.outcome, 'outcome', { required: true, max: 100 });
    const maxEnvelopeBytes = 128 * 1024 * 1024;
    const optionalJson = (value, label) => (
      value === undefined || value === null
        ? null
        : this._jsonValue(value, label, maxEnvelopeBytes)
    );
    const effectiveConfigJson = this._jsonValue(
      input.effectiveConfig || {},
      'effectiveConfig',
      maxEnvelopeBytes,
    );
    const permissionPolicyJson = optionalJson(input.permissionPolicy, 'permissionPolicy');
    const requestJson = optionalJson(input.request, 'request');
    const responseJson = optionalJson(input.response, 'response');
    const errorJson = optionalJson(input.error, 'error');
    const tokenUsageJson = optionalJson(input.tokenUsage, 'tokenUsage');
    const eventId = id();

    return this._write('aiAudit', (timestamp) => {
      const sequence = this.db.prepare(`
        SELECT COALESCE(MAX(sequence), -1) + 1 AS sequence
        FROM ai_turn_audit_events WHERE turn_id = ?
      `).get(turnId).sequence;
      this.db.prepare(`
        INSERT INTO ai_turn_audit_events (
          id, thread_id, turn_id, invocation_id, sequence, event_type,
          turn_kind, provider, model, modality, outcome,
          effective_config_json, permission_policy_json, request_json,
          response_json, error_json, token_usage_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        threadId,
        turnId,
        invocationId,
        sequence,
        eventType,
        turnKind,
        provider,
        model,
        modality,
        outcome,
        effectiveConfigJson,
        permissionPolicyJson,
        requestJson,
        responseJson,
        errorJson,
        tokenUsageJson,
        timestamp,
      );
      return {
        row: {
          id: eventId,
          threadId,
          turnId,
          invocationId,
          sequence,
          eventType,
          turnKind,
          provider,
          model,
          modality,
          outcome,
          timestamp: new Date(timestamp).toISOString(),
        },
      };
    });
  }

  listAiTurnAuditEvents(filters = {}) {
    this._assertReady();
    v.object(filters, 'AI turn audit filters', [
      'threadId',
      'turnId',
      'invocationId',
      'eventType',
      'outcome',
      'limit',
    ]);
    const clauses = [];
    const params = [];
    if (filters.threadId !== undefined) {
      clauses.push('thread_id = ?');
      params.push(v.identifier(filters.threadId, 'threadId'));
    }
    if (filters.turnId !== undefined) {
      clauses.push('turn_id = ?');
      params.push(v.identifier(filters.turnId, 'turnId'));
    }
    if (filters.invocationId !== undefined) {
      clauses.push('invocation_id = ?');
      params.push(v.identifier(filters.invocationId, 'invocationId'));
    }
    if (filters.eventType !== undefined) {
      clauses.push('event_type = ?');
      params.push(v.string(filters.eventType, 'eventType', { required: true, max: 100 }));
    }
    if (filters.outcome !== undefined) {
      clauses.push('outcome = ?');
      params.push(v.string(filters.outcome, 'outcome', { required: true, max: 100 }));
    }
    const limit = filters.limit === undefined
      ? 200
      : v.integer(filters.limit, 'limit', { min: 1, max: 2000 });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`
      SELECT * FROM ai_turn_audit_events
      ${where}
      ORDER BY created_at DESC, sequence DESC
      LIMIT ?
    `).all(...params, limit).map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      turnId: row.turn_id,
      invocationId: row.invocation_id,
      sequence: row.sequence,
      eventType: row.event_type,
      turnKind: row.turn_kind,
      provider: row.provider,
      model: row.model,
      modality: row.modality,
      outcome: row.outcome,
      effectiveConfig: JSON.parse(row.effective_config_json),
      permissionPolicy: row.permission_policy_json ? JSON.parse(row.permission_policy_json) : null,
      request: row.request_json ? JSON.parse(row.request_json) : null,
      response: row.response_json ? JSON.parse(row.response_json) : null,
      error: row.error_json ? JSON.parse(row.error_json) : null,
      tokenUsage: row.token_usage_json ? JSON.parse(row.token_usage_json) : null,
      timestamp: new Date(row.created_at).toISOString(),
    }));
  }

  archiveThread(threadId) {
    threadId = v.identifier(threadId, 'threadId');
    return this._writeDomains(['threads', 'checkpoints'], (timestamp) => {
      if (!this.db.prepare('SELECT id FROM threads WHERE id = ? AND deleted_at IS NULL').get(threadId)) {
        v.fail('NOT_FOUND', 'Thread not found');
      }
      this.db.prepare('DELETE FROM checkpoint_writes WHERE thread_id = ?').run(threadId);
      this.db.prepare('DELETE FROM checkpoints WHERE thread_id = ?').run(threadId);
      this.db.prepare('UPDATE messages SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE thread_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, threadId);
      this.db.prepare('UPDATE conversation_summaries SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE thread_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, threadId);
      this.db.prepare("UPDATE threads SET status = 'archived', deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?")
        .run(timestamp, timestamp, threadId);
      return { ok: true };
    });
  }

  // ---------------------------------------------------------------------------
  // Stylofact — local, versioned writing-voice projects.
  // ---------------------------------------------------------------------------

  _stylofactProject(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      stage: row.stage,
      approvalMode: row.approval_mode,
      profileChoice: row.profile_choice,
      targetPrompt: row.target_prompt,
      primaryModel: row.primary_model,
      criticModel: row.critic_model,
      styleMetrics: JSON.parse(row.style_metrics_json || '{}'),
      styleProfile: JSON.parse(row.style_profile_json || '{}'),
      styleReview: JSON.parse(row.style_review_json || '{}'),
      extraction: JSON.parse(row.extraction_json || '{}'),
      selectedArtifactIds: JSON.parse(row.selected_artifact_ids_json || '[]'),
      blueprint: JSON.parse(row.blueprint_json || '{}'),
      generationOptions: JSON.parse(row.generation_options_json || '{}'),
      projectThreadId: row.project_thread_id,
      sourceCount: Number(row.source_count || 0),
      outputCount: Number(row.output_count || 0),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      revision: row.revision,
    };
  }

  _stylofactSource(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      role: row.role,
      origin: row.origin,
      label: row.label,
      filePath: row.file_path,
      bodyText: row.body_text,
      provenance: JSON.parse(row.provenance_json || '{}'),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      revision: row.revision,
    };
  }

  _stylofactArtifact(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      medium: row.medium,
      variation: row.variation,
      title: row.title,
      content: row.content_text,
      draftContent: row.draft_text,
      criticContent: row.critic_text,
      voiceEvaluation: JSON.parse(row.voice_evaluation_json || '{}'),
      sourceBrief: JSON.parse(row.source_brief_json || '{}'),
      primaryModel: row.primary_model,
      criticModel: row.critic_model,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      revision: row.revision,
    };
  }

  _stylofactRun(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      stage: row.stage,
      modelName: row.model_name,
      criticModelName: row.critic_model_name,
      status: row.status,
      input: JSON.parse(row.input_json || '{}'),
      result: JSON.parse(row.result_json || '{}'),
      error: row.error_text,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      revision: row.revision,
    };
  }

  _stylofactProjectRow(projectId, includeDeleted = false) {
    const deletedClause = includeDeleted ? '' : 'AND p.deleted_at IS NULL';
    return this.db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM stylofact_sources s WHERE s.project_id = p.id AND s.deleted_at IS NULL) AS source_count,
        (SELECT COUNT(*) FROM stylofact_artifacts a WHERE a.project_id = p.id AND a.deleted_at IS NULL) AS output_count
      FROM stylofact_projects p
      WHERE p.id = ? ${deletedClause}
    `).get(projectId);
  }

  listStylofactProjects(input = {}) {
    this._assertReady();
    v.object(input, 'Stylofact project filters', ['includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined ? false : v.boolean(input.includeDeleted, 'includeDeleted');
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 500 });
    const rows = this.db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM stylofact_sources s WHERE s.project_id = p.id AND s.deleted_at IS NULL) AS source_count,
        (SELECT COUNT(*) FROM stylofact_artifacts a WHERE a.project_id = p.id AND a.deleted_at IS NULL) AS output_count
      FROM stylofact_projects p
      ${includeDeleted ? '' : 'WHERE p.deleted_at IS NULL'}
      ORDER BY p.updated_at DESC LIMIT ?
    `).all(limit);
    return rows.map((row) => this._stylofactProject(row));
  }

  getStylofactProject(projectId) {
    this._assertReady();
    projectId = v.identifier(projectId, 'projectId');
    const row = this._stylofactProjectRow(projectId);
    if (!row) v.fail('NOT_FOUND', 'Stylofact project not found');
    return {
      project: this._stylofactProject(row),
      sources: this.listStylofactSources(projectId),
      artifacts: this.listStylofactArtifacts(projectId),
      runs: this.listStylofactRuns(projectId, 40),
    };
  }

  createStylofactProject(input = {}) {
    v.object(input, 'Stylofact project', ['title', 'primaryModel', 'criticModel', 'approvalMode']);
    const project = {
      id: id(),
      title: v.optional(input.title, (value) => v.string(value, 'title', { max: 1000 })) ?? 'Untitled Stylofact',
      primaryModel: v.optional(input.primaryModel, (value) => v.string(value, 'primaryModel', { nullable: true, max: 200 })) ?? null,
      criticModel: v.optional(input.criticModel, (value) => v.string(value, 'criticModel', { nullable: true, max: 200 })) ?? null,
      approvalMode: input.approvalMode === undefined ? 'manual' : v.oneOf(input.approvalMode, 'approvalMode', STYLOFACT_APPROVAL_MODES),
    };
    return this._write('stylofact', (timestamp) => {
      this.db.prepare(`
        INSERT INTO stylofact_projects (
          id, title, stage, approval_mode, profile_choice, primary_model, critic_model,
          created_at, updated_at, revision
        ) VALUES (?, ?, 'voice', ?, 'primary', ?, ?, ?, ?, 1)
      `).run(project.id, project.title, project.approvalMode, project.primaryModel, project.criticModel, timestamp, timestamp);
      return { row: this._stylofactProject(this._stylofactProjectRow(project.id)) };
    });
  }

  updateStylofactProject(projectId, expectedRevision, patch = {}) {
    projectId = v.identifier(projectId, 'projectId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    v.object(patch, 'Stylofact project changes', [
      'title', 'stage', 'approvalMode', 'profileChoice', 'targetPrompt', 'primaryModel', 'criticModel',
      'styleMetrics', 'styleProfile', 'styleReview', 'extraction', 'selectedArtifactIds', 'blueprint',
      'generationOptions', 'projectThreadId',
    ]);
    if (!Object.keys(patch).length) v.fail('INVALID_INPUT', 'At least one Stylofact project change is required');
    const normalized = {
      title: v.optional(patch.title, (value) => v.string(value, 'title', { max: 1000 })),
      stage: patch.stage === undefined ? undefined : v.oneOf(patch.stage, 'stage', STYLOFACT_STAGES),
      approvalMode: patch.approvalMode === undefined ? undefined : v.oneOf(patch.approvalMode, 'approvalMode', STYLOFACT_APPROVAL_MODES),
      profileChoice: patch.profileChoice === undefined ? undefined : v.oneOf(patch.profileChoice, 'profileChoice', STYLOFACT_PROFILE_CHOICES),
      targetPrompt: v.optional(patch.targetPrompt, (value) => v.string(value, 'targetPrompt', { max: 300000 })),
      primaryModel: v.optional(patch.primaryModel, (value) => v.string(value, 'primaryModel', { nullable: true, max: 200 })),
      criticModel: v.optional(patch.criticModel, (value) => v.string(value, 'criticModel', { nullable: true, max: 200 })),
      styleMetrics: patch.styleMetrics === undefined ? undefined : this._jsonValue(patch.styleMetrics, 'styleMetrics', 5000000),
      styleProfile: patch.styleProfile === undefined ? undefined : this._jsonValue(patch.styleProfile, 'styleProfile', 5000000),
      styleReview: patch.styleReview === undefined ? undefined : this._jsonValue(patch.styleReview, 'styleReview', 5000000),
      extraction: patch.extraction === undefined ? undefined : this._jsonValue(patch.extraction, 'extraction', 10000000),
      selectedArtifactIds: patch.selectedArtifactIds === undefined ? undefined : this._jsonValue(
        v.stringArray(patch.selectedArtifactIds, 'selectedArtifactIds', { maxItems: 1000, maxLength: 200 }),
        'selectedArtifactIds',
        500000,
      ),
      blueprint: patch.blueprint === undefined ? undefined : this._jsonValue(patch.blueprint, 'blueprint', 5000000),
      generationOptions: patch.generationOptions === undefined ? undefined : this._jsonValue(patch.generationOptions, 'generationOptions', 1000000),
      projectThreadId: v.optional(patch.projectThreadId, (value) => v.string(value, 'projectThreadId', { nullable: true, max: 200 })),
    };
    return this._write('stylofact', (timestamp) => {
      this._requireCurrent('stylofact_projects', projectId, expectedRevision);
      const current = this.db.prepare('SELECT * FROM stylofact_projects WHERE id = ?').get(projectId);
      this.db.prepare(`
        UPDATE stylofact_projects SET
          title = ?, stage = ?, approval_mode = ?, profile_choice = ?, target_prompt = ?,
          primary_model = ?, critic_model = ?, style_metrics_json = ?, style_profile_json = ?,
          style_review_json = ?, extraction_json = ?, selected_artifact_ids_json = ?, blueprint_json = ?,
          generation_options_json = ?, project_thread_id = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(
        normalized.title ?? current.title,
        normalized.stage ?? current.stage,
        normalized.approvalMode ?? current.approval_mode,
        normalized.profileChoice ?? current.profile_choice,
        normalized.targetPrompt ?? current.target_prompt,
        normalized.primaryModel === undefined ? current.primary_model : normalized.primaryModel,
        normalized.criticModel === undefined ? current.critic_model : normalized.criticModel,
        normalized.styleMetrics ?? current.style_metrics_json,
        normalized.styleProfile ?? current.style_profile_json,
        normalized.styleReview ?? current.style_review_json,
        normalized.extraction ?? current.extraction_json,
        normalized.selectedArtifactIds ?? current.selected_artifact_ids_json,
        normalized.blueprint ?? current.blueprint_json,
        normalized.generationOptions ?? current.generation_options_json,
        normalized.projectThreadId === undefined ? current.project_thread_id : normalized.projectThreadId,
        timestamp,
        projectId,
      );
      return { row: this._stylofactProject(this._stylofactProjectRow(projectId)) };
    });
  }

  archiveStylofactProject(projectId, expectedRevision) {
    projectId = v.identifier(projectId, 'projectId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    return this._write('stylofact', (timestamp) => {
      this._requireCurrent('stylofact_projects', projectId, expectedRevision);
      ['stylofact_sources', 'stylofact_artifacts', 'stylofact_runs'].forEach((table) => {
        this.db.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE project_id = ? AND deleted_at IS NULL`)
          .run(timestamp, timestamp, projectId);
      });
      this.db.prepare('UPDATE stylofact_projects SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, projectId);
      return { ok: true };
    });
  }

  listStylofactSources(projectId, role = null) {
    this._assertReady();
    projectId = v.identifier(projectId, 'projectId');
    if (role != null) role = v.oneOf(role, 'source role', STYLOFACT_SOURCE_ROLES);
    const rows = this.db.prepare(`
      SELECT * FROM stylofact_sources
      WHERE project_id = ? AND deleted_at IS NULL ${role ? 'AND role = ?' : ''}
      ORDER BY created_at ASC, id ASC
    `).all(...(role ? [projectId, role] : [projectId]));
    return rows.map((row) => this._stylofactSource(row));
  }

  createStylofactSource(projectId, input = {}) {
    projectId = v.identifier(projectId, 'projectId');
    v.object(input, 'Stylofact source', ['role', 'origin', 'label', 'filePath', 'bodyText', 'provenance']);
    const source = {
      id: id(),
      role: v.oneOf(input.role, 'role', STYLOFACT_SOURCE_ROLES),
      origin: input.origin === undefined ? 'paste' : v.oneOf(input.origin, 'origin', STYLOFACT_SOURCE_ORIGINS),
      label: v.optional(input.label, (value) => v.string(value, 'label', { max: 2000 })) ?? '',
      filePath: v.optional(input.filePath, (value) => v.string(value, 'filePath', { nullable: true, max: 10000 })) ?? null,
      bodyText: v.optional(input.bodyText, (value) => v.string(value, 'bodyText', { max: 3000000 })) ?? '',
      provenance: input.provenance === undefined ? {} : input.provenance,
    };
    const provenanceJson = this._jsonValue(source.provenance, 'source provenance', 1000000);
    return this._write('stylofact', (timestamp) => {
      if (!this._stylofactProjectRow(projectId)) v.fail('NOT_FOUND', 'Stylofact project not found');
      const count = this.db.prepare('SELECT COUNT(*) AS count FROM stylofact_sources WHERE project_id = ? AND deleted_at IS NULL').get(projectId).count;
      if (count >= 500) v.fail('INVALID_INPUT', 'A Stylofact project can contain at most 500 sources');
      this.db.prepare(`
        INSERT INTO stylofact_sources (
          id, project_id, role, origin, label, file_path, body_text, provenance_json,
          created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        source.id, projectId, source.role, source.origin, source.label, source.filePath, source.bodyText,
        provenanceJson, timestamp, timestamp,
      );
      this.db.prepare('UPDATE stylofact_projects SET updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, projectId);
      return { row: this._stylofactSource(this.db.prepare('SELECT * FROM stylofact_sources WHERE id = ?').get(source.id)) };
    });
  }

  archiveStylofactSource(sourceId, expectedRevision) {
    sourceId = v.identifier(sourceId, 'sourceId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    return this._write('stylofact', (timestamp) => {
      this._requireCurrent('stylofact_sources', sourceId, expectedRevision);
      const source = this.db.prepare('SELECT project_id FROM stylofact_sources WHERE id = ?').get(sourceId);
      this.db.prepare('UPDATE stylofact_sources SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, timestamp, sourceId);
      this.db.prepare('UPDATE stylofact_projects SET updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, source.project_id);
      return { ok: true };
    });
  }

  listStylofactArtifacts(projectId) {
    this._assertReady();
    projectId = v.identifier(projectId, 'projectId');
    return this.db.prepare(`
      SELECT * FROM stylofact_artifacts WHERE project_id = ? AND deleted_at IS NULL
      ORDER BY medium ASC, variation ASC, created_at ASC
    `).all(projectId).map((row) => this._stylofactArtifact(row));
  }

  replaceStylofactArtifacts(projectId, artifacts = []) {
    projectId = v.identifier(projectId, 'projectId');
    if (!Array.isArray(artifacts) || artifacts.length > 100) {
      v.fail('INVALID_INPUT', 'Stylofact output list must contain at most 100 artifacts');
    }
    const normalized = artifacts.map((artifact, index) => {
      v.object(artifact, `artifact ${index + 1}`, [
        'medium', 'variation', 'title', 'content', 'draftContent', 'criticContent', 'voiceEvaluation',
        'sourceBrief', 'primaryModel', 'criticModel',
      ]);
      return {
        id: id(),
        medium: v.string(artifact.medium, `artifact ${index + 1} medium`, { required: true, max: 200 }),
        variation: v.integer(artifact.variation, `artifact ${index + 1} variation`, { min: 1, max: 100 }),
        title: v.optional(artifact.title, (value) => v.string(value, `artifact ${index + 1} title`, { max: 2000 })) ?? '',
        content: v.optional(artifact.content, (value) => v.string(value, `artifact ${index + 1} content`, { max: 3000000 })) ?? '',
        draftContent: v.optional(artifact.draftContent, (value) => v.string(value, `artifact ${index + 1} draftContent`, { max: 3000000 })) ?? '',
        criticContent: v.optional(artifact.criticContent, (value) => v.string(value, `artifact ${index + 1} criticContent`, { nullable: true, max: 3000000 })) ?? null,
        voiceEvaluation: artifact.voiceEvaluation === undefined ? {} : artifact.voiceEvaluation,
        sourceBrief: artifact.sourceBrief === undefined ? {} : artifact.sourceBrief,
        primaryModel: v.optional(artifact.primaryModel, (value) => v.string(value, `artifact ${index + 1} primaryModel`, { nullable: true, max: 200 })) ?? null,
        criticModel: v.optional(artifact.criticModel, (value) => v.string(value, `artifact ${index + 1} criticModel`, { nullable: true, max: 200 })) ?? null,
      };
    });
    return this._write('stylofact', (timestamp) => {
      if (!this._stylofactProjectRow(projectId)) v.fail('NOT_FOUND', 'Stylofact project not found');
      this.db.prepare('UPDATE stylofact_artifacts SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE project_id = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, projectId);
      const insert = this.db.prepare(`
        INSERT INTO stylofact_artifacts (
          id, project_id, medium, variation, title, content_text, draft_text, critic_text,
          voice_evaluation_json, source_brief_json, primary_model, critic_model,
          created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      normalized.forEach((artifact) => insert.run(
        artifact.id, projectId, artifact.medium, artifact.variation, artifact.title, artifact.content,
        artifact.draftContent, artifact.criticContent,
        this._jsonValue(artifact.voiceEvaluation, 'voice evaluation', 1000000),
        this._jsonValue(artifact.sourceBrief, 'source brief', 1000000),
        artifact.primaryModel, artifact.criticModel, timestamp, timestamp,
      ));
      this.db.prepare('UPDATE stylofact_projects SET updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(timestamp, projectId);
      return { rows: this.listStylofactArtifacts(projectId) };
    });
  }

  listStylofactRuns(projectId, limit = 100) {
    this._assertReady();
    projectId = v.identifier(projectId, 'projectId');
    limit = v.integer(limit, 'limit', { min: 1, max: 500 });
    return this.db.prepare(`
      SELECT * FROM stylofact_runs WHERE project_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT ?
    `).all(projectId, limit).map((row) => this._stylofactRun(row));
  }

  createStylofactRun(projectId, input = {}) {
    projectId = v.identifier(projectId, 'projectId');
    v.object(input, 'Stylofact run', ['stage', 'modelName', 'criticModelName', 'status', 'input', 'result', 'error']);
    const run = {
      id: id(),
      stage: v.string(input.stage, 'stage', { required: true, max: 100 }),
      modelName: v.optional(input.modelName, (value) => v.string(value, 'modelName', { nullable: true, max: 200 })) ?? null,
      criticModelName: v.optional(input.criticModelName, (value) => v.string(value, 'criticModelName', { nullable: true, max: 200 })) ?? null,
      status: v.oneOf(input.status, 'status', ['completed', 'failed']),
      input: input.input === undefined ? {} : input.input,
      result: input.result === undefined ? {} : input.result,
      error: v.optional(input.error, (value) => v.string(value, 'error', { nullable: true, max: 200000 })) ?? null,
    };
    return this._write('stylofact', (timestamp) => {
      if (!this._stylofactProjectRow(projectId)) v.fail('NOT_FOUND', 'Stylofact project not found');
      this.db.prepare(`
        INSERT INTO stylofact_runs (
          id, project_id, stage, model_name, critic_model_name, status, input_json, result_json,
          error_text, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        run.id, projectId, run.stage, run.modelName, run.criticModelName, run.status,
        this._jsonValue(run.input, 'run input', 10000000), this._jsonValue(run.result, 'run result', 20000000),
        run.error, timestamp, timestamp,
      );
      return { row: this._stylofactRun(this.db.prepare('SELECT * FROM stylofact_runs WHERE id = ?').get(run.id)) };
    });
  }

  _serializedJson(value, label, maxBytes = 20000000) {
    value = v.string(value, label, { required: true, max: maxBytes });
    try {
      JSON.parse(value);
    } catch {
      v.fail('INVALID_INPUT', `${label} must contain valid JSON`);
    }
    return value;
  }

  getCheckpoint(threadId, checkpointNamespace = '', checkpointId = null) {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    checkpointNamespace = v.string(checkpointNamespace || '', 'checkpointNamespace', { max: 1000 });
    if (checkpointId != null) {
      checkpointId = v.string(checkpointId, 'checkpointId', { required: true, max: 1000 });
      return this.db.prepare(`
        SELECT checkpoint_id, checkpoint_json, metadata_json, parent_checkpoint_id
        FROM checkpoints WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
      `).get(threadId, checkpointNamespace, checkpointId);
    }
    return this.db.prepare(`
      SELECT checkpoint_id, checkpoint_json, metadata_json, parent_checkpoint_id
      FROM checkpoints WHERE thread_id = ? AND checkpoint_ns = ? ORDER BY checkpoint_id DESC LIMIT 1
    `).get(threadId, checkpointNamespace);
  }

  listCheckpointThreadIds() {
    this._assertReady();
    return this.db.prepare('SELECT DISTINCT thread_id FROM checkpoints ORDER BY thread_id').all().map((row) => row.thread_id);
  }

  listCheckpointNamespaces(threadId) {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    return this.db.prepare('SELECT DISTINCT checkpoint_ns FROM checkpoints WHERE thread_id = ? ORDER BY checkpoint_ns')
      .all(threadId).map((row) => row.checkpoint_ns);
  }

  listCheckpoints(threadId, checkpointNamespace = '') {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    checkpointNamespace = v.string(checkpointNamespace || '', 'checkpointNamespace', { max: 1000 });
    return this.db.prepare(`
      SELECT checkpoint_id, checkpoint_json, metadata_json, parent_checkpoint_id
      FROM checkpoints WHERE thread_id = ? AND checkpoint_ns = ? ORDER BY checkpoint_id DESC
    `).all(threadId, checkpointNamespace);
  }

  listCheckpointWrites(threadId, checkpointNamespace, checkpointId) {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    checkpointNamespace = v.string(checkpointNamespace || '', 'checkpointNamespace', { max: 1000 });
    checkpointId = v.string(checkpointId, 'checkpointId', { required: true, max: 1000 });
    return this.db.prepare(`
      SELECT task_id, idx, channel, value_json FROM checkpoint_writes
      WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ? ORDER BY task_id, idx
    `).all(threadId, checkpointNamespace, checkpointId);
  }

  putCheckpoint(input) {
    v.object(input, 'checkpoint', [
      'threadId', 'checkpointNamespace', 'checkpointId', 'parentCheckpointId', 'checkpointJson', 'metadataJson',
    ]);
    const threadId = v.identifier(input.threadId, 'threadId');
    const checkpointNamespace = v.string(input.checkpointNamespace || '', 'checkpointNamespace', { max: 1000 });
    const checkpointId = v.string(input.checkpointId, 'checkpointId', { required: true, max: 1000 });
    const parentCheckpointId = input.parentCheckpointId == null
      ? null
      : v.string(input.parentCheckpointId, 'parentCheckpointId', { required: true, max: 1000 });
    const checkpointJson = this._serializedJson(input.checkpointJson, 'checkpointJson');
    const metadataJson = this._serializedJson(input.metadataJson, 'metadataJson', 5000000);
    return this._write('checkpoints', (timestamp) => {
      this._ensureThreadRecord(threadId, 'agent', timestamp);
      this.db.prepare(`
        INSERT INTO checkpoints (
          thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, checkpoint_json, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(thread_id, checkpoint_ns, checkpoint_id) DO UPDATE SET
          parent_checkpoint_id = excluded.parent_checkpoint_id,
          checkpoint_json = excluded.checkpoint_json,
          metadata_json = excluded.metadata_json,
          created_at = excluded.created_at
      `).run(threadId, checkpointNamespace, checkpointId, parentCheckpointId, checkpointJson, metadataJson, timestamp);
      return { ok: true };
    });
  }

  putCheckpointWrites(input) {
    v.object(input, 'checkpoint writes', ['threadId', 'checkpointNamespace', 'checkpointId', 'writes']);
    const threadId = v.identifier(input.threadId, 'threadId');
    const checkpointNamespace = v.string(input.checkpointNamespace || '', 'checkpointNamespace', { max: 1000 });
    const checkpointId = v.string(input.checkpointId, 'checkpointId', { required: true, max: 1000 });
    if (!Array.isArray(input.writes) || input.writes.length > 10000) v.fail('INVALID_INPUT', 'writes must be a bounded list');
    const writes = input.writes.map((write, index) => {
      v.object(write, `writes[${index}]`, ['taskId', 'index', 'channel', 'valueJson', 'skipExisting']);
      return {
        taskId: v.string(write.taskId, `writes[${index}].taskId`, { required: true, max: 1000 }),
        index: v.integer(write.index, `writes[${index}].index`),
        channel: v.string(write.channel, `writes[${index}].channel`, { required: true, max: 1000 }),
        valueJson: this._serializedJson(write.valueJson, `writes[${index}].valueJson`, 10000000),
        skipExisting: write.skipExisting === undefined ? false : v.boolean(write.skipExisting, `writes[${index}].skipExisting`),
      };
    });
    return this._write('checkpoints', (timestamp) => {
      if (!this.db.prepare('SELECT checkpoint_id FROM checkpoints WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?')
        .get(threadId, checkpointNamespace, checkpointId)) {
        v.fail('NOT_FOUND', 'Checkpoint not found');
      }
      const exists = this.db.prepare(`
        SELECT 1 FROM checkpoint_writes WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ? AND task_id = ? AND idx = ?
      `);
      const insert = this.db.prepare(`
        INSERT OR REPLACE INTO checkpoint_writes
          (thread_id, checkpoint_ns, checkpoint_id, task_id, idx, channel, value_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      writes.forEach((write) => {
        if (write.skipExisting && exists.get(threadId, checkpointNamespace, checkpointId, write.taskId, write.index)) return;
        insert.run(threadId, checkpointNamespace, checkpointId, write.taskId, write.index, write.channel, write.valueJson, timestamp);
      });
      return { ok: true };
    });
  }

  deleteThreadCheckpoints(threadId) {
    threadId = v.identifier(threadId, 'threadId');
    return this._write('checkpoints', () => {
      this.db.prepare('DELETE FROM checkpoint_writes WHERE thread_id = ?').run(threadId);
      this.db.prepare('DELETE FROM checkpoints WHERE thread_id = ?').run(threadId);
      return { ok: true };
    });
  }

  getConversationSummary(threadId, contentHash) {
    this._assertReady();
    threadId = v.identifier(threadId, 'threadId');
    contentHash = v.string(contentHash, 'contentHash', { required: true, max: 128 });
    return this.db.prepare(`
      SELECT * FROM conversation_summaries
      WHERE thread_id = ? AND content_hash = ? AND deleted_at IS NULL
      ORDER BY updated_at DESC LIMIT 1
    `).get(threadId, contentHash) || null;
  }

  saveConversationSummary(input) {
    v.object(input, 'conversation summary', ['threadId', 'firstSequence', 'lastSequence', 'contentHash', 'summary']);
    const threadId = v.identifier(input.threadId, 'threadId');
    const firstSequence = v.integer(input.firstSequence, 'firstSequence', { min: 0 });
    const lastSequence = v.integer(input.lastSequence, 'lastSequence', { min: firstSequence });
    const contentHash = v.string(input.contentHash, 'contentHash', { required: true, max: 128 });
    const summary = v.string(input.summary, 'summary', { required: true, max: 1000000 });
    return this._write('memory', (timestamp) => {
      this._ensureThreadRecord(threadId, 'agent', timestamp);
      const existing = this.db.prepare(`
        SELECT id FROM conversation_summaries
        WHERE thread_id = ? AND first_sequence = ? AND last_sequence = ? AND content_hash = ?
      `).get(threadId, firstSequence, lastSequence, contentHash);
      const summaryId = existing?.id || id();
      this.db.prepare(`
        INSERT INTO conversation_summaries (
          id, thread_id, first_sequence, last_sequence, content_hash, summary, created_at, updated_at, revision, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)
        ON CONFLICT(thread_id, first_sequence, last_sequence, content_hash) DO UPDATE SET
          summary = excluded.summary, updated_at = excluded.updated_at,
          revision = conversation_summaries.revision + 1, deleted_at = NULL
      `).run(summaryId, threadId, firstSequence, lastSequence, contentHash, summary, timestamp, timestamp);
      return { row: this.db.prepare('SELECT * FROM conversation_summaries WHERE id = ?').get(summaryId) };
    });
  }

  listConversationSummaries(limit = 100) {
    this._assertReady();
    limit = v.integer(limit, 'limit', { min: 1, max: 1000 });
    return this.db.prepare(`
      SELECT id, thread_id, first_sequence, last_sequence, content_hash, summary, created_at, updated_at, revision
      FROM conversation_summaries WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ?
    `).all(limit);
  }

  _memoryAgentKey(agentName = null) {
    if (agentName == null || String(agentName).trim() === '') return 'main';
    const normalized = String(agentName).trim().toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').slice(0, 100);
    return normalized || 'main';
  }

  _memorySectionDefinitions(agentKey) {
    return [
      // "About me" is a row in THIS table, not a separate profile store (I1).
      // briizy proposes additions to it as accept/reject diffs; the user edits it
      // directly in Settings; it reaches prompts through the existing injection
      // path, so there is exactly one memory system.
      ['user.aboutMe', 'About Me'],
      ['user.workContext', 'Work Context'],
      ['user.personalContext', 'Personal Context'],
      ['user.topOfMind', 'Current Focus'],
      ['history.recentMonths', 'Recent Months'],
      ['history.earlierContext', 'Earlier Context'],
      ['history.longTermBackground', 'Long-term Background'],
      ['agentContext', 'Additional Agent Context'],
    ].map(([key, title], position) => ({ id: `${agentKey}:${key}`, key: `${agentKey}:${key}`, profileKey: key, title, position }));
  }

  listMemorySections(agentName = null) {
    this._assertReady();
    const agentKey = this._memoryAgentKey(agentName);
    const definitions = this._memorySectionDefinitions(agentKey);
    const rows = this.db.prepare(`
      SELECT * FROM memory_sections WHERE key LIKE ? AND deleted_at IS NULL ORDER BY position
    `).all(`${agentKey}:%`);
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return definitions.map((definition) => {
      const row = byKey.get(definition.key);
      return {
        id: row?.id || definition.id,
        key: definition.profileKey,
        title: definition.title,
        body: row?.body || '',
        position: definition.position,
        updatedAt: row?.updated_at || null,
        revision: row?.revision || 0,
      };
    });
  }

  listMemoryFacts(agentName = null) {
    this._assertReady();
    const agentKey = this._memoryAgentKey(agentName);
    return this.db.prepare(`
      SELECT id, fact_text, source_thread_id, category, confidence, created_at, updated_at, revision
      FROM memory_facts WHERE agent_key = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).all(agentKey).map((row) => ({
      id: row.id,
      content: row.fact_text,
      source: row.source_thread_id,
      category: row.category,
      confidence: row.confidence,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      revision: row.revision,
    }));
  }

  getMemoryProfile(agentName = null) {
    const sections = this.listMemorySections(agentName);
    const section = (key) => sections.find((item) => item.key === key);
    const updatedAt = sections.reduce((latest, item) => Math.max(latest, item.updatedAt || 0), 0);
    return {
      version: '2.0',
      lastUpdated: updatedAt ? new Date(updatedAt).toISOString() : new Date(0).toISOString(),
      user: {
        aboutMe: { summary: section('user.aboutMe').body, updatedAt: section('user.aboutMe').updatedAt || '' },
        workContext: { summary: section('user.workContext').body, updatedAt: section('user.workContext').updatedAt || '' },
        personalContext: { summary: section('user.personalContext').body, updatedAt: section('user.personalContext').updatedAt || '' },
        topOfMind: { summary: section('user.topOfMind').body, updatedAt: section('user.topOfMind').updatedAt || '' },
      },
      history: {
        recentMonths: { summary: section('history.recentMonths').body, updatedAt: section('history.recentMonths').updatedAt || '' },
        earlierContext: { summary: section('history.earlierContext').body, updatedAt: section('history.earlierContext').updatedAt || '' },
        longTermBackground: { summary: section('history.longTermBackground').body, updatedAt: section('history.longTermBackground').updatedAt || '' },
      },
      agentContext: section('agentContext').body,
      facts: this.listMemoryFacts(agentName),
    };
  }

  saveMemoryProfile(memoryData, agentName = null) {
    v.object(memoryData, 'memory profile', ['version', 'lastUpdated', 'user', 'history', 'agentContext', 'facts']);
    const agentKey = this._memoryAgentKey(agentName);
    const definitions = this._memorySectionDefinitions(agentKey);
    const bodies = {
      'user.aboutMe': memoryData.user?.aboutMe?.summary || '',
      'user.workContext': memoryData.user?.workContext?.summary || '',
      'user.personalContext': memoryData.user?.personalContext?.summary || '',
      'user.topOfMind': memoryData.user?.topOfMind?.summary || '',
      'history.recentMonths': memoryData.history?.recentMonths?.summary || '',
      'history.earlierContext': memoryData.history?.earlierContext?.summary || '',
      'history.longTermBackground': memoryData.history?.longTermBackground?.summary || '',
      agentContext: memoryData.agentContext || '',
    };
    Object.entries(bodies).forEach(([key, body]) => {
      bodies[key] = v.string(body, key, { max: 1000000 });
    });
    const facts = memoryData.facts || [];
    if (!Array.isArray(facts) || facts.length > 1000) v.fail('INVALID_INPUT', 'Memory facts must be a bounded list');
    return this._write('memory', (timestamp) => {
      const insertSection = this.db.prepare(`
        INSERT INTO memory_sections (id, key, title, body, position, created_at, updated_at, revision, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL)
        ON CONFLICT(key) DO UPDATE SET title = excluded.title, body = excluded.body, position = excluded.position,
          updated_at = excluded.updated_at, revision = memory_sections.revision + 1, deleted_at = NULL
      `);
      const sectionIds = {};
      definitions.forEach((definition) => {
        insertSection.run(definition.id, definition.key, definition.title, bodies[definition.profileKey], definition.position, timestamp, timestamp);
        sectionIds[definition.profileKey] = definition.id;
      });
      this.db.prepare('UPDATE memory_facts SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE agent_key = ? AND deleted_at IS NULL')
        .run(timestamp, timestamp, agentKey);
      const insertFact = this.db.prepare(`
        INSERT INTO memory_facts (
          id, section_id, fact_text, source_thread_id, agent_key, category, confidence,
          created_at, updated_at, revision, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)
        ON CONFLICT(id) DO UPDATE SET section_id = excluded.section_id, fact_text = excluded.fact_text,
          source_thread_id = excluded.source_thread_id, agent_key = excluded.agent_key, category = excluded.category,
          confidence = excluded.confidence, updated_at = excluded.updated_at,
          revision = memory_facts.revision + 1, deleted_at = NULL
      `);
      facts.forEach((fact, index) => {
        const factId = fact.id && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(fact.id) ? fact.id : id();
        const content = v.string(fact.content, `facts[${index}].content`, { required: true, max: 100000 });
        const category = v.optional(fact.category, (value) => v.string(value, `facts[${index}].category`, { required: true, max: 100 })) || 'context';
        const confidence = fact.confidence === undefined ? 1 : v.number(Number(fact.confidence), `facts[${index}].confidence`, { min: 0, max: 1 });
        const source = fact.source && this.db.prepare('SELECT id FROM threads WHERE id = ?').get(fact.source) ? fact.source : null;
        insertFact.run(factId, sectionIds['agentContext'], content, source, agentKey, category, confidence, timestamp, timestamp);
      });
      return { row: this.getMemoryProfile(agentName) };
    });
  }

  updateMemorySection(key, body, agentName = null) {
    const agentKey = this._memoryAgentKey(agentName);
    const definition = this._memorySectionDefinitions(agentKey).find((item) => item.profileKey === key);
    if (!definition) v.fail('INVALID_INPUT', 'Unsupported memory section');
    body = v.string(body, 'body', { max: 1000000 });
    return this._write('memory', (timestamp) => {
      this.db.prepare(`
        INSERT INTO memory_sections (id, key, title, body, position, created_at, updated_at, revision, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL)
        ON CONFLICT(key) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at,
          revision = memory_sections.revision + 1, deleted_at = NULL
      `).run(definition.id, definition.key, definition.title, body, definition.position, timestamp, timestamp);
      return { row: this.listMemorySections(agentName).find((section) => section.key === key) };
    });
  }

  archiveMemoryFact(factId) {
    factId = v.identifier(factId, 'factId');
    const current = this.db.prepare('SELECT revision FROM memory_facts WHERE id = ? AND deleted_at IS NULL').get(factId);
    if (!current) v.fail('NOT_FOUND', 'Memory fact not found');
    return this._archiveRow('memory', 'memory_facts', factId, current.revision);
  }

  getDeviceIdentity() {
    this._assertReady();
    return this.db.prepare(`
      SELECT device_id AS deviceId, label, created_at AS createdAt, updated_at AS updatedAt
      FROM device_identity WHERE singleton_id = 1
    `).get();
  }

  getAppMeta(key) {
    this._assertReady();
    key = v.identifier(key, 'meta key');
    return this.db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key)?.value ?? null;
  }

  setAppMeta(key, value) {
    key = v.identifier(key, 'meta key');
    value = v.string(String(value), 'meta value', { max: 100000 });
    const timestamp = now();
    this.db.prepare(`
      INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, timestamp);
    return { key, value, updatedAt: timestamp };
  }

  acceptCommand(input = {}) {
    const remoteCommandId = v.string(input.remoteCommandId, 'remoteCommandId', { nullable: true, max: 200 }) ?? null;
    const idempotencyKey = v.string(input.idempotencyKey, 'idempotencyKey', { required: true, max: 200 });
    const source = v.oneOf(input.source || 'local', 'source', ['local', 'remote']);
    const instruction = v.string(input.instruction, 'instruction', { required: true, max: 20000 });
    const contextText = v.string(input.contextText, 'contextText', { nullable: true, max: 50000 }) ?? null;
    const requestedAt = v.integer(input.requestedAt || now(), 'requestedAt', { min: 1 });
    const taskId = v.string(input.taskId, 'taskId', { nullable: true, max: 200 }) ?? null;
    this._assertReady();
    const duplicate = this.db.prepare(`
      SELECT r.id AS run_id FROM commands c JOIN runs r ON r.command_id = c.id
      WHERE (c.idempotency_key = ? OR (? IS NOT NULL AND c.remote_command_id = ?)) AND c.deleted_at IS NULL
      LIMIT 1
    `).get(idempotencyKey, remoteCommandId, remoteCommandId);
    if (duplicate) return { duplicate: true, run: this.getRun(duplicate.run_id) };

    return this._write('automation', (timestamp) => {
      const commandId = id();
      const runId = remoteCommandId || id();
      this.db.prepare(`
        INSERT INTO commands (id, remote_command_id, idempotency_key, source, instruction, context_text,
          status, requested_at, accepted_at, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, 'accepted', ?, ?, ?, ?, 1)
      `).run(commandId, remoteCommandId, idempotencyKey, source, instruction, contextText,
        requestedAt, timestamp, timestamp, timestamp);
      this.db.prepare(`
        INSERT INTO runs (id, command_id, task_id, status, created_at, updated_at, revision)
        VALUES (?, ?, ?, 'accepted', ?, ?, 1)
      `).run(runId, commandId, taskId, timestamp, timestamp);
      this._appendRunEvent(runId, 'accepted', 'Request accepted', null, timestamp);
      return { duplicate: false, run: this.getRun(runId) };
    });
  }

  listRuns(input = {}) {
    this._assertReady();
    const statuses = Array.isArray(input.statuses) ? input.statuses : [];
    statuses.forEach((status) => v.oneOf(status, 'run status', COMMAND_STATUSES));
    const clauses = ['r.deleted_at IS NULL'];
    const args = [];
    if (statuses.length) {
      clauses.push(`r.status IN (${statuses.map(() => '?').join(', ')})`);
      args.push(...statuses);
    }
    return this.db.prepare(`
      SELECT r.id, r.command_id AS commandId, r.task_id AS taskId, r.thread_id AS threadId,
        r.status, r.progress_current AS progressCurrent, r.progress_total AS progressTotal,
        r.result_summary AS resultSummary, r.error_code AS errorCode, r.error_message AS errorMessage,
        r.started_at AS startedAt, r.finished_at AS finishedAt, r.created_at AS createdAt,
        r.updated_at AS updatedAt, r.revision, c.remote_command_id AS remoteCommandId,
        c.source, c.instruction, c.context_text AS contextText
      FROM runs r LEFT JOIN commands c ON c.id = r.command_id
      WHERE ${clauses.join(' AND ')} ORDER BY r.created_at DESC
    `).all(...args);
  }

  getRun(runId) {
    runId = v.string(runId, 'runId', { required: true, max: 200 });
    const run = this.listRuns().find((candidate) => candidate.id === runId);
    if (!run) return null;
    run.events = this.db.prepare(`
      SELECT id, sequence, event_type AS eventType, message, payload_json AS payloadJson,
        created_at AS createdAt FROM run_events
      WHERE run_id = ? AND deleted_at IS NULL ORDER BY sequence
    `).all(runId).map((event) => ({ ...event, payload: event.payloadJson ? JSON.parse(event.payloadJson) : null }));
    return run;
  }

  transitionRun(runId, status, input = {}) {
    runId = v.string(runId, 'runId', { required: true, max: 200 });
    status = v.oneOf(status, 'status', COMMAND_STATUSES);
    const progressCurrent = input.progressCurrent == null ? null : v.integer(input.progressCurrent, 'progressCurrent', { min: 0 });
    const progressTotal = input.progressTotal == null ? null : v.integer(input.progressTotal, 'progressTotal', { min: 0 });
    const resultSummary = v.string(input.resultSummary, 'resultSummary', { nullable: true, max: 20000 });
    const errorCode = v.string(input.errorCode, 'errorCode', { nullable: true, max: 100 });
    const errorMessage = v.string(input.errorMessage, 'errorMessage', { nullable: true, max: 20000 });
    const eventMessage = v.string(input.eventMessage, 'eventMessage', { nullable: true, max: 1000 });
    return this._write('automation', (timestamp) => {
      const current = this.db.prepare('SELECT command_id, status FROM runs WHERE id = ? AND deleted_at IS NULL').get(runId);
      if (!current) v.fail('NOT_FOUND', 'Run not found');
      if (TERMINAL_RUN_STATUSES.has(current.status) && current.status !== status) v.fail('INVALID_STATE', 'A finished run cannot be reopened');
      const fields = ['status = ?', 'updated_at = ?', 'revision = revision + 1'];
      const values = [status, timestamp];
      if (progressCurrent != null) { fields.push('progress_current = ?'); values.push(progressCurrent); }
      if (progressTotal != null) { fields.push('progress_total = ?'); values.push(progressTotal); }
      if (resultSummary != null) { fields.push('result_summary = ?'); values.push(resultSummary); }
      if (errorCode != null) { fields.push('error_code = ?'); values.push(errorCode); }
      if (errorMessage != null) { fields.push('error_message = ?'); values.push(errorMessage); }
      if (status === 'running') fields.push('started_at = COALESCE(started_at, updated_at)');
      if (TERMINAL_RUN_STATUSES.has(status)) { fields.push('finished_at = ?'); values.push(timestamp); }
      values.push(runId);
      this.db.prepare(`UPDATE runs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      if (current.command_id) this.db.prepare(`UPDATE commands SET status = ?, updated_at = ?, revision = revision + 1 WHERE id = ?`)
        .run(status, timestamp, current.command_id);
      this._appendRunEvent(runId, status, eventMessage || status.replaceAll('_', ' '), input.payload, timestamp);
      return { row: this.getRun(runId) };
    });
  }

  attachRun(runId, { taskId = null, threadId = null } = {}) {
    runId = v.string(runId, 'runId', { required: true, max: 200 });
    taskId = v.string(taskId, 'taskId', { nullable: true, max: 200 }) ?? null;
    threadId = v.string(threadId, 'threadId', { nullable: true, max: 200 }) ?? null;
    return this._write('automation', (timestamp) => {
      const current = this.db.prepare('SELECT id FROM runs WHERE id = ? AND deleted_at IS NULL').get(runId);
      if (!current) v.fail('NOT_FOUND', 'Run not found');
      this.db.prepare('UPDATE runs SET task_id = ?, thread_id = ?, updated_at = ?, revision = revision + 1 WHERE id = ?')
        .run(taskId, threadId, timestamp, runId);
      return { row: this.getRun(runId) };
    });
  }

  _appendRunEvent(runId, eventType, message, payload, timestamp = now()) {
    const sequence = this.db.prepare('SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM run_events WHERE run_id = ?').get(runId).sequence;
    this.db.prepare(`
      INSERT INTO run_events (id, run_id, sequence, event_type, message, payload_json, created_at, updated_at, revision)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id(), runId, sequence, eventType, message, payload == null ? null : this._jsonValue(payload, 'run event payload', 100000), timestamp, timestamp);
  }

  getOperationReceipt(opId) {
    this._assertReady();
    opId = v.string(opId, 'opId', { required: true, max: 200 });
    const row = this.db.prepare('SELECT status, result_json AS resultJson FROM operation_receipts WHERE op_id = ? AND deleted_at IS NULL').get(opId);
    return row ? { status: row.status, result: row.resultJson ? JSON.parse(row.resultJson) : null } : null;
  }

  recordOperationReceipt(opId, input = {}) {
    opId = v.string(opId, 'opId', { required: true, max: 200 });
    const toolName = v.string(input.toolName || 'unknown', 'toolName', { required: true, max: 200 });
    const requestHash = v.string(input.requestHash || crypto.createHash('sha256').update(opId).digest('hex'), 'requestHash', { required: true, max: 200 });
    const status = v.oneOf(input.status || 'completed', 'status', ['pending', 'completed', 'failed']);
    const resultJson = input.result == null ? null : this._jsonValue(input.result, 'operation result', 1000000);
    return this._write('automation', (timestamp) => {
      this.db.prepare(`
        INSERT INTO operation_receipts (op_id, run_id, tool_name, request_hash, status, result_json, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(op_id) DO UPDATE SET status = excluded.status, result_json = excluded.result_json,
          updated_at = excluded.updated_at, revision = operation_receipts.revision + 1
      `).run(opId, input.runId || null, toolName, requestHash, status, resultJson, timestamp, timestamp);
      return { opId, status };
    });
  }

  appendLog(input = {}) {
    const timestamp = input.timestamp ? new Date(input.timestamp).getTime() : now();
    const row = {
      id: v.string(input.id || id(), 'log id', { required: true, max: 200 }),
      type: v.string(input.type || 'system.event', 'log type', { required: true, max: 200 }),
      source: v.string(input.source || 'system', 'log source', { required: true, max: 100 }),
      category: v.string(input.category || 'system', 'log category', { required: true, max: 100 }),
      // Chat transcript logs intentionally mirror the complete Messages text;
      // never clip a long user or assistant message at the logging boundary.
      message: v.string(input.message || '', 'log message', { max: 2100000 }),
      level: v.oneOf(input.level || 'info', 'log level', ['debug', 'info', 'warn', 'error']),
      activityId: input.activityId == null ? null : v.string(input.activityId, 'activity id', { max: 200 }),
      spanId: input.spanId == null ? null : v.string(input.spanId, 'span id', { max: 200 }),
      parentSpanId: input.parentSpanId == null ? null : v.string(input.parentSpanId, 'parent span id', { max: 200 }),
      activitySequence: input.activitySequence == null
        ? null
        : v.integer(input.activitySequence, 'activity sequence', { min: 0 }),
      phase: input.phase == null ? null : v.string(input.phase, 'activity phase', { max: 100 }),
      outcome: input.outcome == null ? null : v.string(input.outcome, 'activity outcome', { max: 100 }),
    };
    this.db.prepare(`
      INSERT OR IGNORE INTO logs (
        id, type, source, category, message, data_json, level, thread_id, session_id,
        task_id, activity_id, span_id, parent_span_id, activity_sequence, phase, outcome, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(row.id, row.type, row.source, row.category, row.message,
      // JSON escaping and UTF-8 can require several bytes per message
      // character, so leave enough room for a full 2,000,000-character
      // transcript plus its structured metadata.
      input.data == null ? null : this._jsonValue(input.data, 'log data', 16000000), row.level,
      input.threadId || null, input.sessionId || null, input.taskId || null,
      row.activityId, row.spanId, row.parentSpanId, row.activitySequence, row.phase, row.outcome,
      Number.isFinite(timestamp) ? timestamp : now());
    return row;
  }

  listLogs(input = {}) {
    this._assertReady();
    v.object(input, 'log filters', ['id', 'category', 'level', 'source', 'threadId', 'activityId', 'query', 'since', 'until', 'limit']);
    const clauses = [];
    const params = [];
    if (input.id !== undefined) {
      clauses.push('id = ?');
      params.push(v.identifier(input.id, 'id'));
    }
    if (input.category !== undefined) {
      clauses.push('category = ?');
      params.push(v.string(input.category, 'category', { required: true, max: 100 }));
    }
    if (input.level !== undefined) {
      clauses.push('level = ?');
      params.push(v.oneOf(input.level, 'level', ['debug', 'info', 'warn', 'error']));
    }
    if (input.source !== undefined) {
      clauses.push('source = ?');
      params.push(v.string(input.source, 'source', { required: true, max: 100 }));
    }
    if (input.threadId !== undefined) {
      clauses.push('thread_id = ?');
      params.push(v.identifier(input.threadId, 'threadId'));
    }
    if (input.activityId !== undefined) {
      clauses.push('activity_id = ?');
      params.push(v.string(input.activityId, 'activityId', { required: true, max: 200 }));
    }
    if (input.query !== undefined) {
      const query = v.string(input.query, 'query', { required: true, max: 500 }).toLowerCase();
      clauses.push('(LOWER(message) LIKE ? OR LOWER(type) LIKE ? OR LOWER(category) LIKE ? OR LOWER(COALESCE(data_json, \'\')) LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (input.since !== undefined) {
      clauses.push('created_at >= ?');
      params.push(v.integer(input.since, 'since', { min: 0 }));
    }
    if (input.until !== undefined) {
      clauses.push('created_at <= ?');
      params.push(v.integer(input.until, 'until', { min: 0 }));
    }
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 1000 });
    return this.db.prepare(`
      SELECT id, type, source, category, message, data_json, level, thread_id, session_id,
             task_id, activity_id, span_id, parent_span_id, activity_sequence, phase, outcome,
             created_at
      FROM logs ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((entry) => ({
      id: entry.id,
      type: entry.type,
      source: entry.source,
      category: entry.category,
      message: entry.message,
      data: entry.data_json ? JSON.parse(entry.data_json) : null,
      level: entry.level,
      threadId: entry.thread_id,
      sessionId: entry.session_id,
      taskId: entry.task_id,
      activityId: entry.activity_id,
      spanId: entry.span_id,
      parentSpanId: entry.parent_span_id,
      activitySequence: entry.activity_sequence,
      phase: entry.phase,
      outcome: entry.outcome,
      timestamp: new Date(entry.created_at).toISOString(),
    }));
  }

  getPendingSyncDomains() {
    this._assertReady();
    return this.db.prepare(`
      SELECT domain, dirty_revision AS dirtyRevision, attempts, next_attempt_at AS nextAttemptAt
      FROM sync_outbox WHERE status IN ('pending', 'failed') AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
      ORDER BY updated_at
    `).all(now());
  }

  markSyncResult(domain, revision, errorCode = null) {
    domain = v.oneOf(domain, 'domain', [...CONTINUITY_DOMAINS]);
    revision = v.integer(revision, 'revision', { min: 1 });
    const timestamp = now();
    if (!errorCode) {
      this.db.transaction(() => {
        this.db.prepare('DELETE FROM sync_outbox WHERE domain = ? AND dirty_revision <= ?').run(domain, revision);
        this.db.prepare(`
          INSERT INTO sync_state (domain, last_uploaded_revision, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(domain) DO UPDATE SET last_uploaded_revision = excluded.last_uploaded_revision, updated_at = excluded.updated_at
        `).run(domain, revision, timestamp);
      })();
      return;
    }
    this.db.prepare(`
      UPDATE sync_outbox SET status = 'failed', attempts = attempts + 1, next_attempt_at = ?,
        last_error_code = ?, updated_at = ? WHERE domain = ?
    `).run(timestamp + 30000, String(errorCode).slice(0, 100), timestamp, domain);
  }

  buildContinuitySnapshot(domain) {
    domain = v.oneOf(domain, 'domain', [...CONTINUITY_DOMAINS]);
    this._assertReady();
    const revision = this.db.prepare('SELECT revision FROM domain_revisions WHERE domain = ?').get(domain)?.revision || 0;
    let items;
    if (domain === 'tasks') {
      const steps = this.db.prepare(`
        SELECT id, task_id AS taskId, title, status, position, completed_at AS completedAt
        FROM task_steps WHERE deleted_at IS NULL ORDER BY task_id, position, id
      `).all();
      const byTask = new Map();
      steps.forEach((step) => { if (!byTask.has(step.taskId)) byTask.set(step.taskId, []); byTask.get(step.taskId).push(step); });
      items = this.db.prepare(`
        SELECT id, title, description, status, priority, due_at AS dueAt
        FROM tasks WHERE deleted_at IS NULL ORDER BY id
      `).all().map((task) => ({ ...task, steps: byTask.get(task.id) || [] }));
    } else if (domain === 'organizer') {
      items = this.db.prepare(`
        SELECT id, type, parent_id AS parentId, title, body, status,
          scheduled_start_at AS scheduledStartAt, scheduled_end_at AS scheduledEndAt,
          due_at AS dueAt, duration_seconds AS durationSeconds, recurrence_json AS recurrenceJson,
          tags_json AS tagsJson FROM organizer_items WHERE deleted_at IS NULL ORDER BY id
      `).all().map((item) => ({ ...item, recurrence: item.recurrenceJson ? JSON.parse(item.recurrenceJson) : null, tags: JSON.parse(item.tagsJson) }));
    } else {
      items = this.db.prepare(`
        SELECT id, title, body, format, tags_json AS tagsJson
        FROM retained_text WHERE deleted_at IS NULL ORDER BY id
      `).all().map((item) => ({ ...item, tags: JSON.parse(item.tagsJson) }));
    }
    return { schemaVersion: 1, domain, revision, items };
  }

  importContinuitySnapshots(snapshots = {}) {
    const domains = Object.keys(snapshots).filter((domain) => CONTINUITY_DOMAINS.has(domain));
    if (!domains.length) v.fail('INVALID_INPUT', 'No continuity domains were selected');
    const contentCount = this.db.prepare(`
      SELECT (SELECT COUNT(*) FROM tasks) + (SELECT COUNT(*) FROM organizer_items) + (SELECT COUNT(*) FROM retained_text) AS count
    `).get().count;
    if (contentCount > 0) v.fail('RESTORE_NOT_ALLOWED', 'Continuity can only restore an empty local database');
    return this._writeDomains(domains, (timestamp) => {
      for (const task of snapshots.tasks?.items || []) {
        this.db.prepare(`INSERT INTO tasks (id, title, description, status, priority, due_at, automated, created_at, updated_at, revision)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`)
          .run(task.id, task.title || '', task.description || '', task.status || 'pending', task.priority || 'normal', task.dueAt || null, timestamp, timestamp);
        for (const step of task.steps || []) this.db.prepare(`INSERT INTO task_steps
          (id, task_id, title, status, position, completed_at, created_at, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`)
          .run(step.id, task.id, step.title || '', step.status || 'pending', step.position || 0, step.completedAt || null, timestamp, timestamp);
      }
      for (const item of snapshots.organizer?.items || []) this.db.prepare(`INSERT INTO organizer_items
        (id, type, parent_id, title, body, status, scheduled_start_at, scheduled_end_at, due_at, duration_seconds,
          recurrence_json, tags_json, created_at, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
        .run(item.id, item.type, null, item.title || '', item.body || '', item.status || null,
          item.scheduledStartAt || null, item.scheduledEndAt || null, item.dueAt || null, item.durationSeconds || null,
          item.recurrence == null ? null : JSON.stringify(item.recurrence), JSON.stringify(item.tags || []), timestamp, timestamp);
      for (const item of snapshots.organizer?.items || []) {
        if (item.parentId) this.db.prepare('UPDATE organizer_items SET parent_id = ? WHERE id = ?').run(item.parentId, item.id);
      }
      for (const item of snapshots.retainedText?.items || []) this.db.prepare(`INSERT INTO retained_text
        (id, title, body, format, tags_json, created_at, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`)
        .run(item.id, item.title || '', item.body || '', item.format || 'plain', JSON.stringify(item.tags || []), timestamp, timestamp);
      return { restored: Object.fromEntries(domains.map((domain) => [domain, snapshots[domain]?.items?.length || 0])) };
    });
  }

  listSharedTextMirrors(ownerAppId = null) {
    this._assertReady();
    const args = [];
    const ownerClause = ownerAppId ? 'AND owner_app_id = ?' : '';
    if (ownerAppId) args.push(v.identifier(ownerAppId, 'ownerAppId'));
    return this.db.prepare(`SELECT owner_app_id AS ownerAppId, remote_id AS remoteId, type,
      payload_json AS payloadJson, remote_revision AS remoteRevision, updated_at AS updatedAt
      FROM shared_text_mirrors WHERE deleted_at IS NULL ${ownerClause} ORDER BY updated_at DESC`).all(...args)
      .map((row) => ({ ...row, payload: JSON.parse(row.payloadJson) }));
  }

  saveSharedTextMirror(input = {}) {
    const ownerAppId = v.identifier(input.ownerAppId, 'ownerAppId');
    if (ownerAppId === 'briizos.local') v.fail('INVALID_AUTHORITY', 'Local-owned shared text is projected from local core tables');
    const remoteId = v.string(input.remoteId, 'remoteId', { required: true, max: 200 });
    const type = v.oneOf(input.type, 'type', SHARED_TEXT_TYPES);
    const remoteRevision = v.integer(input.remoteRevision, 'remoteRevision', { min: 1 });
    const payloadJson = this._jsonValue(input.payload || {}, 'shared text payload', 500000);
    return this._write('sharedText', (timestamp) => {
      this.db.prepare(`INSERT INTO shared_text_mirrors
        (owner_app_id, remote_id, type, payload_json, remote_revision, created_at, updated_at, revision, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NULL)
        ON CONFLICT(owner_app_id, remote_id) DO UPDATE SET type = excluded.type, payload_json = excluded.payload_json,
          remote_revision = excluded.remote_revision, updated_at = excluded.updated_at,
          revision = shared_text_mirrors.revision + 1, deleted_at = NULL
        WHERE excluded.remote_revision > shared_text_mirrors.remote_revision`)
        .run(ownerAppId, remoteId, type, payloadJson, remoteRevision, timestamp, timestamp);
      return { row: this.listSharedTextMirrors(ownerAppId).find((item) => item.remoteId === remoteId) };
    });
  }

  importSharedTextMirror(ownerAppId, remoteId) {
    ownerAppId = v.identifier(ownerAppId, 'ownerAppId');
    remoteId = v.string(remoteId, 'remoteId', { required: true, max: 200 });
    const mirror = this.listSharedTextMirrors(ownerAppId).find((item) => item.remoteId === remoteId);
    if (!mirror) v.fail('NOT_FOUND', 'Shared text item not found');
    const payload = mirror.payload || {};
    if (mirror.type === 'task') return this.createTask({
      title: payload.title || 'Imported task', description: payload.description || payload.body || '',
      status: payload.status || 'pending', priority: payload.priority || 'normal', dueAt: payload.dueAt || null,
    });
    if (mirror.type === 'retained_text') return this._write('retainedText', (timestamp) => {
      const rowId = id();
      this.db.prepare(`INSERT INTO retained_text (id, title, body, format, tags_json, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`).run(rowId, payload.title || '', payload.body || '', payload.format || 'plain', JSON.stringify(payload.tags || []), timestamp, timestamp);
      return { row: this.db.prepare('SELECT id, title, body, format, revision FROM retained_text WHERE id = ?').get(rowId) };
    });
    return this.createOrganizerItem({
      type: mirror.type, title: payload.title || '', body: payload.body || '', status: payload.status || null,
      scheduledStartAt: payload.scheduledStartAt || null, scheduledEndAt: payload.scheduledEndAt || null,
      dueAt: payload.dueAt || null, durationSeconds: payload.durationSeconds || null,
    });
  }

  buildLocalSharedTextProjection() {
    const tasks = this.db.prepare(`SELECT id, title, description, status, priority, due_at AS dueAt, revision, updated_at AS updatedAt
      FROM tasks WHERE deleted_at IS NULL ORDER BY id`).all().map((item) => ({ ...item, type: 'task' }));
    const organizer = this.db.prepare(`SELECT id, type, title, body, status, scheduled_start_at AS scheduledStartAt,
      scheduled_end_at AS scheduledEndAt, due_at AS dueAt, duration_seconds AS durationSeconds, revision, updated_at AS updatedAt
      FROM organizer_items WHERE deleted_at IS NULL ORDER BY id`).all();
    const retained = this.db.prepare(`SELECT id, title, body, format, revision, updated_at AS updatedAt
      FROM retained_text WHERE deleted_at IS NULL ORDER BY id`).all().map((item) => ({ ...item, type: 'retained_text' }));
    return [...tasks, ...organizer, ...retained];
  }

  _normalizeProjectId(value) {
    const projectId = v.identifier(value, 'projectId', { nullable: true });
    if (projectId == null) return null;
    const project = this.db.prepare(`
      SELECT id FROM organizer_items WHERE id = ? AND type = 'project' AND deleted_at IS NULL
    `).get(projectId);
    if (!project) v.fail('INVALID_RELATION', 'projectId must refer to an active organizer project');
    return projectId;
  }

  _normalizeForestProjectId(value) {
    const projectId = v.identifier(value, 'forestProjectId', { nullable: true });
    if (projectId == null) return null;
    const project = this.db.prepare(`
      SELECT id FROM forest_projects WHERE id = ? AND deleted_at IS NULL
    `).get(projectId);
    if (!project) v.fail('INVALID_RELATION', 'forestProjectId must refer to an active Forest project');
    return projectId;
  }

  _normalizeDate(value, label = 'date') {
    const date = v.string(value, label, { required: true, max: 10 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) v.fail('INVALID_INPUT', `${label} must use YYYY-MM-DD`);
    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year
      || parsed.getUTCMonth() !== month - 1
      || parsed.getUTCDate() !== day
    ) {
      v.fail('INVALID_INPUT', `${label} must be a real calendar date`);
    }
    return date;
  }

  _dateOrdinal(date) {
    const [year, month, day] = date.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  _dateFromOrdinal(ordinal) {
    return new Date(ordinal * 86400000).toISOString().slice(0, 10);
  }

  _localDateFromTimestamp(timestamp) {
    const date = new Date(timestamp);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  _daysBetween(from, to) {
    return this._dateOrdinal(to) - this._dateOrdinal(from);
  }

  _datesBetween(from, to) {
    const start = this._dateOrdinal(from);
    const end = this._dateOrdinal(to);
    const dates = [];
    for (let ordinal = start; ordinal <= end; ordinal += 1) dates.push(this._dateFromOrdinal(ordinal));
    return dates;
  }

  _placementOccursOnDate(anchorDate, recurrence, targetDate) {
    if (!recurrence?.enabled) return anchorDate === targetDate;
    const anchor = recurrence.anchorDate || anchorDate;
    const diffDays = this._daysBetween(anchor, targetDate);
    if (diffDays < 0) return false;
    if (recurrence.endDate && targetDate > recurrence.endDate) return false;
    if (recurrence.untilAt != null) {
      const untilDate = new Date(recurrence.untilAt).toISOString().slice(0, 10);
      if (targetDate > untilDate) return false;
    }
    const interval = Math.max(1, Number(recurrence.interval) || 1);
    const [anchorYear, anchorMonth, anchorDay] = anchor.split('-').map(Number);
    const [targetYear, targetMonth, targetDay] = targetDate.split('-').map(Number);
    const type = recurrence.type || recurrence.frequency || 'weekly';

    if (type === 'daily') return diffDays % interval === 0;
    if (type === 'monthly') {
      const monthsApart = (targetYear - anchorYear) * 12 + targetMonth - anchorMonth;
      return monthsApart >= 0
        && monthsApart % interval === 0
        && targetDay === (recurrence.dayOfMonth || anchorDay);
    }
    if (type === 'yearly') {
      return (targetYear - anchorYear) % interval === 0
        && targetMonth === anchorMonth
        && targetDay === anchorDay;
    }

    const targetWeekday = new Date(`${targetDate}T00:00:00Z`).getUTCDay();
    const anchorWeekday = new Date(`${anchor}T00:00:00Z`).getUTCDay();
    const daysOfWeek = Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length
      ? recurrence.daysOfWeek.map(Number)
      : [anchorWeekday];
    return daysOfWeek.includes(targetWeekday) && Math.floor(diffDays / 7) % interval === 0;
  }

  _mapPlacement(row, occurrenceDate, recurrence, completedDates) {
    return {
      id: row.id,
      ref_type: row.ref_type,
      ref_id: row.ref_id,
      date: row.date,
      occurrence_date: occurrenceDate,
      start_minute: row.start_minute,
      duration_minutes: row.duration_minutes,
      recurrence,
      completed_dates: completedDates,
      session_completed: completedDates.includes(occurrenceDate),
      task: {
        id: row.ref_id,
        title: row.task_title,
        description: row.task_description || '',
        status: row.task_status,
        priority: row.task_priority,
        due_at: row.task_due_at,
        project_id: row.task_project_id || null,
        forest_project_id: row.task_forest_project_id || null,
        revision: row.task_revision,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      revision: row.revision,
      deleted_at: row.deleted_at,
    };
  }

  _updateRow(domain, table, rowId, expectedRevision, patch, columnMap, booleanFields = [], extend, getRow) {
    rowId = v.identifier(rowId, 'id');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    const keys = Object.keys(patch);
    if (!keys.length) v.fail('INVALID_INPUT', 'At least one change is required');
    const sets = [];
    const values = [];
    keys.forEach((key) => {
      const [column, validate] = columnMap[key];
      sets.push(`${column} = ?`);
      values.push(validate(patch[key]));
    });
    return this._write(domain, (timestamp) => {
      this._requireCurrent(table, rowId, expectedRevision);
      if (extend) extend(sets, values, timestamp);
      sets.push('updated_at = ?', 'revision = revision + 1');
      values.push(timestamp, rowId);
      this.db.prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).run(...values);
      const row = getRow ? getRow(rowId) : this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(rowId);
      return { row: toBooleanRow(row, booleanFields) };
    });
  }

  _archiveRow(domain, table, rowId, expectedRevision, booleanFields = [], getRow) {
    rowId = v.identifier(rowId, 'id');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    return this._write(domain, (timestamp) => {
      this._requireCurrent(table, rowId, expectedRevision);
      this.db.prepare(`
        UPDATE ${table} SET deleted_at = ?, updated_at = ?, revision = revision + 1 WHERE id = ?
      `).run(timestamp, timestamp, rowId);
      const row = getRow ? getRow(rowId) : this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(rowId);
      return { row: toBooleanRow(row, booleanFields) };
    });
  }

  setSecret(key, plaintext) {
    key = v.identifier(key, 'secret key');
    plaintext = v.string(plaintext, 'secret value', { required: true, max: 100000 });
    if (!this.safeStorage?.isEncryptionAvailable?.()) {
      v.fail('ENCRYPTION_UNAVAILABLE', 'Secure local encryption is not available');
    }
    const encrypted = this.safeStorage.encryptString(plaintext);
    return this._write('settings', (timestamp) => {
      this.db.prepare(`
        INSERT INTO secrets (key, encrypted_value, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(key) DO UPDATE SET
          encrypted_value = excluded.encrypted_value,
          updated_at = excluded.updated_at,
          revision = secrets.revision + 1
      `).run(key, encrypted, timestamp, timestamp);
      return { key };
    });
  }

  getSecret(key) {
    this._assertReady();
    key = v.identifier(key, 'secret key');
    const row = this.db.prepare('SELECT encrypted_value FROM secrets WHERE key = ?').get(key);
    if (!row) return null;
    if (!this.safeStorage?.isEncryptionAvailable?.()) {
      v.fail('ENCRYPTION_UNAVAILABLE', 'Secure local encryption is not available');
    }
    return this.safeStorage.decryptString(row.encrypted_value);
  }

  // ------------------------------------------------------------------
  // briizy work memory (PLAN-BRIIZY.md §8)
  //
  // Electron owns all of this metadata (I4). Writes use the 'rewind' domain,
  // which is deliberately absent from CONTINUITY_DOMAINS, so nothing here can
  // reach sync_outbox and therefore Firestore (I9).
  //
  // Rows handed to the renderer never carry an archive path (§2): frame
  // identifiers are opaque and images are fetched by id through IPC. Only the
  // main-process callers that must unlink files ask for paths explicitly.
  // ------------------------------------------------------------------

  getBriizyState() {
    this._assertReady();
    const rows = this.db.prepare(`
      SELECT key, value_json FROM embedded_app_state WHERE app_id = 'briizy'
    `).all();
    const state = {};
    rows.forEach((row) => {
      try {
        state[row.key] = JSON.parse(row.value_json);
      } catch {
        state[row.key] = null;
      }
    });
    return state;
  }

  setBriizyState(key, value) {
    key = v.identifier(key, 'briizy state key');
    const valueJson = this._jsonValue(value, `briizy state ${key}`, 2000000);
    return this._write('briizy', (timestamp) => {
      this.db.prepare(`
        INSERT INTO embedded_app_state (app_id, key, value_json, created_at, updated_at, revision)
        VALUES ('briizy', ?, ?, ?, ?, 1)
        ON CONFLICT(app_id, key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at,
          revision = embedded_app_state.revision + 1
      `).run(key, valueJson, timestamp, timestamp);
      return { key, value };
    });
  }

  _rewindSessionRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      kind: row.kind,
      topApps: JSON.parse(row.top_apps_json || '[]'),
      headline: row.headline,
      frameCount: row.frame_count,
      bytes: row.bytes,
      notefallPostId: row.notefall_post_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  /**
   * Frame row for consumers. `includePath` is main-process only — the IPC layer
   * must never pass it, so the renderer cannot learn where the archive lives.
   */
  _rewindFrameRow(row, { includePath = false } = {}) {
    if (!row) return null;
    const frame = {
      frameId: row.id,
      sessionId: row.session_id,
      capturedAt: row.captured_at,
      appName: row.app_name,
      bundleId: row.bundle_id,
      windowTitle: row.window_title,
      captureMode: row.capture_mode,
      width: row.width,
      height: row.height,
      bytes: row.bytes,
      phash: row.phash,
      ocrStatus: row.ocr_status,
      hasImage: !!(row.image_path || row.media_path),
    };
    if (row.ocr_text !== undefined) frame.ocrText = row.ocr_text;
    if (includePath) {
      frame.imagePath = row.image_path;
      frame.mediaPath = row.media_path;
      frame.mediaOffset = row.media_offset;
    }
    return frame;
  }

  createRewindSession(input = {}) {
    v.object(input, 'rewind session', ['kind', 'startedAt']);
    const kind = v.oneOf(input.kind || 'auto', 'kind', ['auto', 'display']);
    const startedAt = input.startedAt === undefined
      ? now()
      : v.integer(input.startedAt, 'startedAt', { min: 1 });
    const sessionId = id();
    return this._write('rewind', (timestamp) => {
      this.db.prepare(`
        INSERT INTO rewind_sessions (id, started_at, kind, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(sessionId, startedAt, kind, timestamp, timestamp);
      return { row: this._rewindSessionRow(this._getRewindSessionRow(sessionId)) };
    });
  }

  _getRewindSessionRow(sessionId) {
    return this.db.prepare('SELECT * FROM rewind_sessions WHERE id = ?').get(sessionId);
  }

  getRewindSession(sessionId) {
    this._assertReady();
    sessionId = v.identifier(sessionId, 'sessionId');
    return this._rewindSessionRow(this._getRewindSessionRow(sessionId));
  }

  /** The session currently accepting frames, if any. */
  getOpenRewindSession(kind = null) {
    this._assertReady();
    if (kind != null) v.oneOf(kind, 'kind', ['auto', 'display']);
    const row = kind
      ? this.db.prepare(`
          SELECT * FROM rewind_sessions
          WHERE ended_at IS NULL AND deleted_at IS NULL AND kind = ?
          ORDER BY started_at DESC LIMIT 1
        `).get(kind)
      : this.db.prepare(`
          SELECT * FROM rewind_sessions
          WHERE ended_at IS NULL AND deleted_at IS NULL
          ORDER BY started_at DESC LIMIT 1
        `).get();
    return this._rewindSessionRow(row);
  }

  /**
   * Recompute a session's aggregates from its frames. Called when a session
   * closes and after pruning, so frame_count/bytes/top_apps never drift from
   * what is actually on disk.
   */
  _recomputeRewindSession(sessionId, timestamp) {
    const totals = this.db.prepare(`
      SELECT COUNT(*) AS frames, COALESCE(SUM(bytes), 0) AS bytes
      FROM rewind_frames WHERE session_id = ? AND deleted_at IS NULL
    `).get(sessionId);
    const topApps = this.db.prepare(`
      SELECT app_name AS appName, COUNT(*) AS frames
      FROM rewind_frames
      WHERE session_id = ? AND deleted_at IS NULL AND app_name IS NOT NULL
      GROUP BY app_name ORDER BY frames DESC LIMIT 8
    `).all(sessionId);
    this.db.prepare(`
      UPDATE rewind_sessions
      SET frame_count = ?, bytes = ?, top_apps_json = ?, updated_at = ?, revision = revision + 1
      WHERE id = ?
    `).run(totals.frames, totals.bytes, JSON.stringify(topApps), timestamp, sessionId);
  }

  endRewindSession(sessionId, input = {}) {
    sessionId = v.identifier(sessionId, 'sessionId');
    v.object(input, 'session close', ['endedAt', 'headline']);
    const endedAt = input.endedAt === undefined ? now() : v.integer(input.endedAt, 'endedAt', { min: 1 });
    const headline = input.headline === undefined
      ? undefined
      : v.string(input.headline, 'headline', { nullable: true, max: 500 });
    return this._write('rewind', (timestamp) => {
      const current = this._getRewindSessionRow(sessionId);
      if (!current) v.fail('NOT_FOUND', 'Session not found');
      this.db.prepare(`
        UPDATE rewind_sessions SET ended_at = ?, headline = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(endedAt, headline === undefined ? current.headline : headline, timestamp, sessionId);
      this._recomputeRewindSession(sessionId, timestamp);
      return { row: this._rewindSessionRow(this._getRewindSessionRow(sessionId)) };
    });
  }

  updateRewindSession(sessionId, patch = {}) {
    sessionId = v.identifier(sessionId, 'sessionId');
    v.object(patch, 'session changes', ['headline', 'notefallPostId']);
    const headline = patch.headline === undefined
      ? undefined
      : v.string(patch.headline, 'headline', { nullable: true, max: 500 });
    const notefallPostId = patch.notefallPostId === undefined
      ? undefined
      : v.identifier(patch.notefallPostId, 'notefallPostId', { nullable: true });
    return this._write('rewind', (timestamp) => {
      const current = this._getRewindSessionRow(sessionId);
      if (!current) v.fail('NOT_FOUND', 'Session not found');
      this.db.prepare(`
        UPDATE rewind_sessions SET headline = ?, notefall_post_id = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(
        headline === undefined ? current.headline : headline,
        notefallPostId === undefined ? current.notefall_post_id : notefallPostId,
        timestamp,
        sessionId,
      );
      return { row: this._rewindSessionRow(this._getRewindSessionRow(sessionId)) };
    });
  }

  listRewindSessions(input = {}) {
    this._assertReady();
    v.object(input, 'session filters', ['from', 'to', 'kind', 'limit', 'openOnly']);
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (input.from !== undefined) {
      clauses.push('started_at >= ?');
      params.push(v.integer(input.from, 'from', { min: 0 }));
    }
    if (input.to !== undefined) {
      clauses.push('started_at <= ?');
      params.push(v.integer(input.to, 'to', { min: 0 }));
    }
    if (input.kind !== undefined) {
      clauses.push('kind = ?');
      params.push(v.oneOf(input.kind, 'kind', ['auto', 'display']));
    }
    if (input.openOnly === true) clauses.push('ended_at IS NULL');
    const limit = input.limit === undefined ? 200 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    const rows = this.db.prepare(`
      SELECT * FROM rewind_sessions WHERE ${clauses.join(' AND ')}
      ORDER BY started_at DESC LIMIT ?
    `).all(...params, limit);
    // Earliest frame that still has an image, so a feed card can show a
    // thumbnail without pulling the whole timeline. Indexed by (session_id,
    // captured_at), so this stays cheap across the listing.
    const coverStatement = this.db.prepare(`
      SELECT id FROM rewind_frames
      WHERE session_id = ? AND deleted_at IS NULL AND image_path IS NOT NULL
      ORDER BY captured_at ASC LIMIT 1
    `);
    return rows.map((row) => ({
      ...this._rewindSessionRow(row),
      coverFrameId: coverStatement.get(row.id)?.id || null,
    }));
  }

  /**
   * Record one captured frame. The privacy gate has already run (I3) — a frame
   * that reaches this method is one the user permitted, already written to disk
   * by the helper.
   */
  recordRewindFrame(input = {}) {
    v.object(input, 'frame', [
      'sessionId', 'capturedAt', 'appName', 'bundleId', 'windowTitle', 'captureMode',
      'imagePath', 'bytes', 'width', 'height', 'phash', 'ocrStatus', 'ocrText', 'ocrBlocks',
    ]);
    const sessionId = v.identifier(input.sessionId, 'sessionId', { nullable: true });
    const capturedAt = input.capturedAt === undefined
      ? now()
      : v.integer(input.capturedAt, 'capturedAt', { min: 1 });
    const appName = v.string(input.appName, 'appName', { nullable: true, max: 300 }) ?? null;
    const bundleId = v.string(input.bundleId, 'bundleId', { nullable: true, max: 300 }) ?? null;
    const windowTitle = v.string(input.windowTitle, 'windowTitle', { nullable: true, max: 2000 }) ?? null;
    const captureMode = v.oneOf(input.captureMode || 'window', 'captureMode', ['window', 'display']);
    const imagePath = v.string(input.imagePath, 'imagePath', { nullable: true, max: 4000 }) ?? null;
    const bytes = input.bytes === undefined ? 0 : v.integer(input.bytes, 'bytes', { min: 0 });
    const width = v.integer(input.width, 'width', { nullable: true, min: 0, max: 100000 });
    const height = v.integer(input.height, 'height', { nullable: true, min: 0, max: 100000 });
    const phash = v.string(input.phash, 'phash', { nullable: true, max: 64 }) ?? null;
    const ocrStatus = v.oneOf(
      input.ocrStatus || 'pending', 'ocrStatus',
      ['pending', 'done', 'skipped', 'deferred', 'failed', 'duplicate'],
    );
    const ocrText = v.string(input.ocrText, 'ocrText', { nullable: true, max: 2000000 }) ?? null;
    const frameId = id();

    return this._write('rewind', (timestamp) => {
      this.db.prepare(`
        INSERT INTO rewind_frames (
          id, captured_at, session_id, app_name, bundle_id, window_title, capture_mode,
          image_path, bytes, width, height, phash, ocr_status, ocr_text, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        frameId, capturedAt, sessionId, appName, bundleId, windowTitle, captureMode,
        imagePath, bytes, width, height, phash, ocrStatus, ocrText, timestamp,
      );
      if (Array.isArray(input.ocrBlocks) && input.ocrBlocks.length) {
        this._replaceRewindOcrBlocks(frameId, input.ocrBlocks);
      }
      if (sessionId) {
        this.db.prepare(`
          UPDATE rewind_sessions
          SET frame_count = frame_count + 1, bytes = bytes + ?, updated_at = ?, revision = revision + 1
          WHERE id = ?
        `).run(bytes, timestamp, sessionId);
      }
      return { row: this._rewindFrameRow(this.db.prepare('SELECT * FROM rewind_frames WHERE id = ?').get(frameId)) };
    });
  }

  _replaceRewindOcrBlocks(frameId, blocks) {
    if (!Array.isArray(blocks)) v.fail('INVALID_INPUT', 'ocrBlocks must be a list');
    // Cap per frame: a dense IDE screenshot yields a few hundred blocks; beyond
    // this the extra rows cost more than the highlighting they enable.
    const capped = blocks.slice(0, 600);
    this.db.prepare('DELETE FROM rewind_ocr_blocks WHERE frame_id = ?').run(frameId);
    const insert = this.db.prepare(`
      INSERT INTO rewind_ocr_blocks (frame_id, position, text, x, y, w, h, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    capped.forEach((block, position) => {
      if (!block || typeof block !== 'object') return;
      const text = v.string(block.text, 'block text', { nullable: true, max: 5000 }) ?? '';
      if (!text) return;
      insert.run(
        frameId, position, text,
        v.number(Number(block.x) || 0, 'block x', { min: -1, max: 2 }),
        v.number(Number(block.y) || 0, 'block y', { min: -1, max: 2 }),
        v.number(Number(block.w) || 0, 'block w', { min: 0, max: 2 }),
        v.number(Number(block.h) || 0, 'block h', { min: 0, max: 2 }),
        v.number(Number(block.confidence) || 0, 'block confidence', { min: 0, max: 1 }),
      );
    });
  }

  /** Attach (or update) OCR output for a frame captured earlier. */
  setRewindFrameOcr(frameId, input = {}) {
    frameId = v.identifier(frameId, 'frameId');
    v.object(input, 'frame OCR', ['status', 'text', 'blocks']);
    const status = v.oneOf(
      input.status || 'done', 'status',
      ['pending', 'done', 'skipped', 'deferred', 'failed', 'duplicate'],
    );
    const text = v.string(input.text, 'text', { nullable: true, max: 2000000 }) ?? null;
    return this._write('rewind', (timestamp) => {
      const current = this.db.prepare('SELECT id FROM rewind_frames WHERE id = ?').get(frameId);
      if (!current) v.fail('NOT_FOUND', 'Frame not found');
      this.db.prepare('UPDATE rewind_frames SET ocr_status = ?, ocr_text = ? WHERE id = ?')
        .run(status, text, frameId);
      if (input.blocks !== undefined) this._replaceRewindOcrBlocks(frameId, input.blocks || []);
      return { frameId, status, indexedAt: timestamp };
    });
  }

  listRewindFrames(input = {}) {
    this._assertReady();
    v.object(input, 'frame filters', ['from', 'to', 'apps', 'sessionId', 'limit', 'withText', 'includePath']);
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (input.from !== undefined) {
      clauses.push('captured_at >= ?');
      params.push(v.integer(input.from, 'from', { min: 0 }));
    }
    if (input.to !== undefined) {
      clauses.push('captured_at <= ?');
      params.push(v.integer(input.to, 'to', { min: 0 }));
    }
    if (input.sessionId !== undefined) {
      clauses.push('session_id = ?');
      params.push(v.identifier(input.sessionId, 'sessionId'));
    }
    if (input.apps !== undefined) {
      const apps = v.stringArray(input.apps, 'apps', { maxItems: 50, maxLength: 300 });
      if (apps.length) {
        clauses.push(`app_name IN (${apps.map(() => '?').join(', ')})`);
        params.push(...apps);
      }
    }
    if (input.withText === true) clauses.push("ocr_text IS NOT NULL AND ocr_text <> ''");
    const limit = input.limit === undefined ? 500 : v.integer(input.limit, 'limit', { min: 1, max: 5000 });
    const includePath = input.includePath === true;
    return this.db.prepare(`
      SELECT * FROM rewind_frames WHERE ${clauses.join(' AND ')}
      ORDER BY captured_at DESC LIMIT ?
    `).all(...params, limit).map((row) => this._rewindFrameRow(row, { includePath }));
  }

  /**
   * FTS5 keyword search over OCR text and window titles, ranked by bm25 then
   * recency (omi RewindDatabase.swift:2796-2819). Semantic search is the one
   * deferral in the plan (§13); this contract does not change when it lands.
   */
  searchRewindFrames(input = {}) {
    this._assertReady();
    v.object(input, 'work memory query', ['text', 'from', 'to', 'apps', 'sessionId', 'limit']);
    const text = v.string(input.text, 'text', { required: true, max: 500 });
    const matchExpression = this._toFtsMatchExpression(text);
    if (!matchExpression) return [];

    const clauses = ['f.deleted_at IS NULL'];
    const params = [matchExpression];
    if (input.from !== undefined) {
      clauses.push('f.captured_at >= ?');
      params.push(v.integer(input.from, 'from', { min: 0 }));
    }
    if (input.to !== undefined) {
      clauses.push('f.captured_at <= ?');
      params.push(v.integer(input.to, 'to', { min: 0 }));
    }
    if (input.sessionId !== undefined) {
      clauses.push('f.session_id = ?');
      params.push(v.identifier(input.sessionId, 'sessionId'));
    }
    if (input.apps !== undefined) {
      const apps = v.stringArray(input.apps, 'apps', { maxItems: 50, maxLength: 300 });
      if (apps.length) {
        clauses.push(`f.app_name IN (${apps.map(() => '?').join(', ')})`);
        params.push(...apps);
      }
    }
    const limit = input.limit === undefined ? 50 : v.integer(input.limit, 'limit', { min: 1, max: 500 });

    const rows = this.db.prepare(`
      SELECT f.*, snippet(rewind_frames_fts, 0, '⟦', '⟧', '…', 12) AS snippet
      FROM rewind_frames_fts
      JOIN rewind_frames f ON f.rowid = rewind_frames_fts.rowid
      WHERE rewind_frames_fts MATCH ? AND ${clauses.join(' AND ')}
      ORDER BY bm25(rewind_frames_fts) ASC, f.captured_at DESC
      LIMIT ?
    `).all(...params, limit);

    return rows.map((row) => ({
      ...this._rewindFrameRow(row),
      snippet: row.snippet,
      // Only the blocks that actually contain a query term, so the caller can
      // highlight the match without pulling several hundred boxes per frame.
      blocks: this._matchingRewindBlocks(row.id, text),
    }));
  }

  /**
   * Turn user text into a safe FTS5 MATCH expression. Every term is quoted, so
   * punctuation, `NEAR`, `OR`, and column filters in user input are treated as
   * literal text rather than as query syntax.
   */
  _toFtsMatchExpression(text) {
    const terms = String(text)
      .toLowerCase()
      .split(/[^\p{L}\p{N}_]+/u)
      .filter((term) => term.length > 0)
      .slice(0, 12);
    if (!terms.length) return null;
    return terms.map((term) => `"${term.replace(/"/g, '""')}"`).join(' AND ');
  }

  _matchingRewindBlocks(frameId, text) {
    const terms = String(text).toLowerCase().split(/[^\p{L}\p{N}_]+/u).filter(Boolean).slice(0, 8);
    if (!terms.length) return [];
    const blocks = this.db.prepare(`
      SELECT text, x, y, w, h, confidence FROM rewind_ocr_blocks
      WHERE frame_id = ? ORDER BY position LIMIT 600
    `).all(frameId);
    return blocks
      .filter((block) => {
        const lower = block.text.toLowerCase();
        return terms.some((term) => lower.includes(term));
      })
      .slice(0, 40);
  }

  getRewindFrame(frameId, { includePath = false } = {}) {
    this._assertReady();
    frameId = v.identifier(frameId, 'frameId');
    const row = this.db.prepare('SELECT * FROM rewind_frames WHERE id = ? AND deleted_at IS NULL').get(frameId);
    if (!row) return null;
    return {
      ...this._rewindFrameRow(row, { includePath }),
      blocks: this.db.prepare(`
        SELECT text, x, y, w, h, confidence FROM rewind_ocr_blocks
        WHERE frame_id = ? ORDER BY position LIMIT 600
      `).all(frameId),
    };
  }

  /**
   * Segment a session into contiguous (app, window) runs — the filmstrip
   * structure the Notefalls drawer renders. One entry per run, not per frame.
   */
  getRewindSessionTimeline(sessionId) {
    this._assertReady();
    sessionId = v.identifier(sessionId, 'sessionId');
    const session = this._rewindSessionRow(this._getRewindSessionRow(sessionId));
    if (!session) return null;
    const frames = this.db.prepare(`
      SELECT id, captured_at, app_name, bundle_id, window_title, ocr_status, bytes
      FROM rewind_frames WHERE session_id = ? AND deleted_at IS NULL
      ORDER BY captured_at ASC LIMIT 20000
    `).all(sessionId);

    const segments = [];
    for (const frame of frames) {
      const last = segments[segments.length - 1];
      const sameContext = last
        && last.appName === frame.app_name
        && last.windowTitle === frame.window_title;
      if (sameContext) {
        last.endedAt = frame.captured_at;
        last.frameCount += 1;
        last.bytes += frame.bytes;
        if (last.frameIds.length < 60) last.frameIds.push(frame.id);
      } else {
        segments.push({
          appName: frame.app_name,
          bundleId: frame.bundle_id,
          windowTitle: frame.window_title,
          startedAt: frame.captured_at,
          endedAt: frame.captured_at,
          frameCount: 1,
          bytes: frame.bytes,
          coverFrameId: frame.id,
          frameIds: [frame.id],
        });
      }
    }
    return { session, segments };
  }

  /**
   * Compact digest of recent activity, for `get_recent_activity` — the tool
   * that closes the app-state awareness gap. Text is truncated per app so the
   * digest stays small enough to sit in a prompt.
   */
  getRecentRewindActivity(minutes = 30, { maxChars = 4000 } = {}) {
    this._assertReady();
    const windowMinutes = v.integer(minutes, 'minutes', { min: 1, max: 24 * 60 });
    const since = now() - windowMinutes * 60 * 1000;
    const apps = this.db.prepare(`
      SELECT app_name AS appName, COUNT(*) AS frames,
        MIN(captured_at) AS firstSeen, MAX(captured_at) AS lastSeen
      FROM rewind_frames
      WHERE captured_at >= ? AND deleted_at IS NULL
      GROUP BY app_name ORDER BY frames DESC LIMIT 12
    `).all(since);
    const titles = this.db.prepare(`
      SELECT DISTINCT app_name AS appName, window_title AS windowTitle, MAX(captured_at) AS lastSeen
      FROM rewind_frames
      WHERE captured_at >= ? AND deleted_at IS NULL AND window_title IS NOT NULL AND window_title <> ''
      GROUP BY app_name, window_title ORDER BY lastSeen DESC LIMIT 30
    `).all(since);

    const textRows = this.db.prepare(`
      SELECT app_name AS appName, window_title AS windowTitle, captured_at AS capturedAt, ocr_text AS ocrText
      FROM rewind_frames
      WHERE captured_at >= ? AND deleted_at IS NULL AND ocr_text IS NOT NULL AND ocr_text <> ''
      ORDER BY captured_at DESC LIMIT 40
    `).all(since);

    let budget = v.integer(maxChars, 'maxChars', { min: 200, max: 40000 });
    const excerpts = [];
    for (const row of textRows) {
      if (budget <= 0) break;
      const excerpt = row.ocrText.replace(/\s+/g, ' ').trim().slice(0, Math.min(600, budget));
      if (!excerpt) continue;
      budget -= excerpt.length;
      excerpts.push({
        appName: row.appName,
        windowTitle: row.windowTitle,
        capturedAt: row.capturedAt,
        excerpt,
      });
    }

    return { since, until: now(), windowMinutes, apps, titles, excerpts };
  }

  getRewindStorageUsage() {
    this._assertReady();
    const frames = this.db.prepare(`
      SELECT COUNT(*) AS frames, COALESCE(SUM(bytes), 0) AS bytes,
        MIN(captured_at) AS oldest, MAX(captured_at) AS newest
      FROM rewind_frames WHERE deleted_at IS NULL
    `).get();
    const pendingOcr = this.db.prepare(`
      SELECT COUNT(*) AS count FROM rewind_frames
      WHERE deleted_at IS NULL AND ocr_status IN ('pending', 'deferred')
    `).get().count;
    const sessions = this.db.prepare(
      'SELECT COUNT(*) AS count FROM rewind_sessions WHERE deleted_at IS NULL',
    ).get().count;
    return { ...frames, pendingOcr, sessions };
  }

  /**
   * Retention under BOTH caps (I8): anything older than retentionDays goes,
   * then oldest-first until total bytes fit under retentionBytes. At 3s cadence
   * the byte cap is what actually bites until Phase 7 compaction lands — that
   * is the intended behaviour, not a bug (§3).
   *
   * Returns the removed rows WITH paths so the caller can unlink the files.
   * Main-process only; never exposed over IPC.
   */
  pruneRewindFrames(input = {}) {
    v.object(input, 'prune options', ['retentionDays', 'retentionBytes', 'keepSessionIds', 'maxDeletes']);
    const retentionDays = input.retentionDays === undefined
      ? null
      : v.integer(input.retentionDays, 'retentionDays', { min: 1, max: 3650 });
    const retentionBytes = input.retentionBytes === undefined
      ? null
      : v.integer(input.retentionBytes, 'retentionBytes', { min: 0 });
    const keepSessionIds = input.keepSessionIds === undefined
      ? []
      : v.stringArray(input.keepSessionIds, 'keepSessionIds', { maxItems: 50, maxLength: 128 });
    // Bound each pass so a first prune on a very full archive cannot hold the
    // write lock for an unbounded stretch; the caller re-runs until clean.
    const maxDeletes = input.maxDeletes === undefined
      ? 5000
      : v.integer(input.maxDeletes, 'maxDeletes', { min: 1, max: 100000 });

    return this._write('rewind', (timestamp) => {
      const keepClause = keepSessionIds.length
        ? ` AND (session_id IS NULL OR session_id NOT IN (${keepSessionIds.map(() => '?').join(', ')}))`
        : '';
      const doomed = [];
      const touchedSessions = new Set();

      if (retentionDays != null) {
        const cutoff = timestamp - retentionDays * 24 * 60 * 60 * 1000;
        doomed.push(...this.db.prepare(`
          SELECT id, image_path, media_path, bytes, session_id FROM rewind_frames
          WHERE captured_at < ?${keepClause}
          ORDER BY captured_at ASC LIMIT ?
        `).all(cutoff, ...keepSessionIds, maxDeletes));
      }

      if (retentionBytes != null) {
        let total = this.db.prepare(
          'SELECT COALESCE(SUM(bytes), 0) AS bytes FROM rewind_frames WHERE deleted_at IS NULL',
        ).get().bytes;
        const alreadyDoomed = new Set(doomed.map((row) => row.id));
        total -= doomed.reduce((sum, row) => sum + row.bytes, 0);
        if (total > retentionBytes) {
          const candidates = this.db.prepare(`
            SELECT id, image_path, media_path, bytes, session_id FROM rewind_frames
            WHERE deleted_at IS NULL${keepClause}
            ORDER BY captured_at ASC LIMIT ?
          `).all(...keepSessionIds, maxDeletes);
          for (const row of candidates) {
            if (total <= retentionBytes || doomed.length >= maxDeletes) break;
            if (alreadyDoomed.has(row.id)) continue;
            alreadyDoomed.add(row.id);
            doomed.push(row);
            total -= row.bytes;
          }
        }
      }

      if (!doomed.length) return { deleted: [], freedBytes: 0 };

      const remove = this.db.prepare('DELETE FROM rewind_frames WHERE id = ?');
      let freedBytes = 0;
      for (const row of doomed) {
        remove.run(row.id);
        freedBytes += row.bytes;
        if (row.session_id) touchedSessions.add(row.session_id);
      }
      touchedSessions.forEach((sessionId) => this._recomputeRewindSession(sessionId, timestamp));

      return {
        deleted: doomed.map((row) => ({
          frameId: row.id,
          imagePath: row.image_path,
          mediaPath: row.media_path,
          bytes: row.bytes,
        })),
        freedBytes,
      };
    });
  }

  /**
   * Point a run of frames at a video chunk instead of their loose JPEGs (§13).
   *
   * One transaction for the whole chunk: a partial rewrite would leave some
   * frames pointing at files the compactor is about to delete. `media_offset` is
   * positional, so the caller must pass every frame in the chunk, in order.
   */
  compactRewindFrames(input = {}) {
    v.object(input, 'compaction', ['mediaPath', 'mediaBytes', 'frames']);
    const mediaPath = v.string(input.mediaPath, 'mediaPath', { required: true, max: 4000 });
    const mediaBytes = input.mediaBytes === undefined
      ? 0
      : v.integer(input.mediaBytes, 'mediaBytes', { min: 0 });
    const frames = Array.isArray(input.frames) ? input.frames : [];
    if (!frames.length || frames.length > 5000) {
      v.fail('INVALID_INPUT', 'frames must be a non-empty list of at most 5000 entries');
    }
    frames.forEach((frame, index) => {
      v.identifier(frame?.frameId, `frames[${index}].frameId`);
      v.integer(frame?.mediaOffset, `frames[${index}].mediaOffset`, { min: 0 });
    });

    // The chunk's bytes are attributed to its first frame, so SUM(bytes) still
    // reflects real disk usage and the byte cap keeps working after compaction.
    const perFrameBytes = frames.map((_, index) => (index === 0 ? mediaBytes : 0));

    return this._write('rewind', (timestamp) => {
      const update = this.db.prepare(`
        UPDATE rewind_frames
        SET image_path = NULL, media_path = ?, media_offset = ?, bytes = ?
        WHERE id = ? AND deleted_at IS NULL
      `);
      let updated = 0;
      const touchedSessions = new Set();
      frames.forEach((frame, index) => {
        const row = this.db.prepare('SELECT session_id FROM rewind_frames WHERE id = ?').get(frame.frameId);
        if (!row) return;
        updated += update.run(mediaPath, frame.mediaOffset, perFrameBytes[index], frame.frameId).changes;
        if (row.session_id) touchedSessions.add(row.session_id);
      });
      touchedSessions.forEach((sessionId) => this._recomputeRewindSession(sessionId, timestamp));
      return { updated, mediaPath, mediaBytes };
    });
  }

  /**
   * User-initiated history deletion (§4 "both clear-history flows"): a time
   * range, one session, or everything. Returns removed paths for file cleanup.
   */
  deleteRewindHistory(input = {}) {
    v.object(input, 'delete history', ['from', 'to', 'sessionId', 'all']);
    const all = input.all === true;
    const from = input.from === undefined ? null : v.integer(input.from, 'from', { min: 0 });
    const to = input.to === undefined ? null : v.integer(input.to, 'to', { min: 0 });
    const sessionId = input.sessionId === undefined
      ? null
      : v.identifier(input.sessionId, 'sessionId');
    if (!all && from == null && to == null && sessionId == null) {
      v.fail('INVALID_INPUT', 'Specify a range, a session, or all: true');
    }

    return this._write('rewind', (timestamp) => {
      const clauses = [];
      const params = [];
      if (!all) {
        if (from != null) { clauses.push('captured_at >= ?'); params.push(from); }
        if (to != null) { clauses.push('captured_at <= ?'); params.push(to); }
        if (sessionId != null) { clauses.push('session_id = ?'); params.push(sessionId); }
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const doomed = this.db.prepare(
        `SELECT id, image_path, media_path, bytes, session_id FROM rewind_frames ${where}`,
      ).all(...params);
      this.db.prepare(`DELETE FROM rewind_frames ${where}`).run(...params);

      let removedSessions = 0;
      if (all) {
        removedSessions = this.db.prepare('DELETE FROM rewind_sessions').run().changes;
      } else {
        // Drop sessions left with no frames; recompute the rest.
        const affected = new Set(doomed.map((row) => row.session_id).filter(Boolean));
        if (sessionId) affected.add(sessionId);
        affected.forEach((affectedId) => {
          const remaining = this.db.prepare(
            'SELECT COUNT(*) AS count FROM rewind_frames WHERE session_id = ? AND deleted_at IS NULL',
          ).get(affectedId).count;
          if (remaining === 0) {
            removedSessions += this.db.prepare('DELETE FROM rewind_sessions WHERE id = ?')
              .run(affectedId).changes;
          } else {
            this._recomputeRewindSession(affectedId, timestamp);
          }
        });
      }

      this.logger?.info?.('rewind', 'History deleted', {
        frames: doomed.length,
        sessions: removedSessions,
        scope: all ? 'all' : { from, to, sessionId },
      });

      return {
        deleted: doomed.map((row) => ({
          frameId: row.id,
          imagePath: row.image_path,
          mediaPath: row.media_path,
          bytes: row.bytes,
        })),
        removedSessions,
      };
    });
  }

  /**
   * Post (or update) the one Notefalls card for a closed session (§8: one card
   * per session, never one per frame). Frames are NOT attached as files —
   * the renderer fetches them by opaque frame id, so no archive path is ever
   * handed to the UI (§2).
   */
  upsertRewindSessionPost(sessionId, input = {}) {
    sessionId = v.identifier(sessionId, 'sessionId');
    v.object(input, 'session post', ['body', 'notes', 'sourceApp', 'tags']);
    const body = v.string(input.body, 'body', { required: true, max: 200000 });
    const notes = v.string(input.notes, 'notes', { nullable: true, max: 500000 }) ?? null;
    const sourceApp = v.string(input.sourceApp, 'sourceApp', { nullable: true, max: 300 }) ?? null;
    const tags = input.tags === undefined
      ? []
      : v.stringArray(input.tags, 'tags', { maxItems: 100, maxLength: 200 });

    return this._writeDomains(['rewind', 'forest'], (timestamp) => {
      const session = this._getRewindSessionRow(sessionId);
      if (!session) v.fail('NOT_FOUND', 'Session not found');

      const existingId = session.notefall_post_id
        && this.db.prepare('SELECT id FROM notefall_posts WHERE id = ? AND deleted_at IS NULL')
          .get(session.notefall_post_id)?.id;

      if (existingId) {
        this.db.prepare(`
          UPDATE notefall_posts
          SET body = ?, notes = ?, source_app = ?, tags_json = ?, session_start = ?, session_end = ?,
            updated_at = ?, revision = revision + 1
          WHERE id = ?
        `).run(body, notes, sourceApp, JSON.stringify(tags), session.started_at, session.ended_at,
          timestamp, existingId);
        return {
          postId: existingId,
          row: this._notefallRow(this.db.prepare('SELECT * FROM notefall_posts WHERE id = ?').get(existingId)),
        };
      }

      const postId = id();
      this.db.prepare(`
        INSERT INTO notefall_posts (
          id, title, body, author_type, author_agent_id, tags_json, source_app, source_icon,
          capture_mode, session_start, session_end, notes, created_at, updated_at, revision
        ) VALUES (?, '', ?, 'agent', 'briizy', ?, ?, 'note', 'auto', ?, ?, ?, ?, ?, 1)
      `).run(postId, body, JSON.stringify(tags), sourceApp, session.started_at, session.ended_at,
        notes, session.started_at, timestamp);
      this.db.prepare(`
        UPDATE rewind_sessions SET notefall_post_id = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(postId, timestamp, sessionId);

      return {
        postId,
        row: this._notefallRow(this.db.prepare('SELECT * FROM notefall_posts WHERE id = ?').get(postId)),
      };
    });
  }

  // ------------------------------------------------------------------
  // briizy assistants: extractions, staged tasks, proposals, goals (§10)
  //
  // Every row here is a *derived* write, so every row is reversible and carries
  // provenance back to the frame or session that produced it (I7). Accepting a
  // proposal creates one pending, non-automated task and performs no work (I6).
  // ------------------------------------------------------------------

  recordBriizyExtraction(input = {}) {
    v.object(input, 'extraction', [
      'assistantId', 'kind', 'content', 'reasoning', 'contextSummary', 'model',
      'sourceFrameId', 'sourceSessionId',
    ]);
    const assistantId = v.string(input.assistantId, 'assistantId', { required: true, max: 100 });
    const kind = v.oneOf(input.kind, 'kind', ['insight', 'task', 'memory', 'goal', 'focus', 'summary']);
    const content = v.string(input.content, 'content', { required: true, max: 200000 });
    const reasoning = v.string(input.reasoning, 'reasoning', { nullable: true, max: 100000 }) ?? null;
    const contextSummary = v.string(input.contextSummary, 'contextSummary', { nullable: true, max: 100000 }) ?? null;
    const model = v.string(input.model, 'model', { nullable: true, max: 200 }) ?? null;
    const sourceFrameId = v.identifier(input.sourceFrameId, 'sourceFrameId', { nullable: true });
    const sourceSessionId = v.identifier(input.sourceSessionId, 'sourceSessionId', { nullable: true });
    const extractionId = id();

    return this._write('briizy', (timestamp) => {
      this.db.prepare(`
        INSERT INTO briizy_extractions (
          id, assistant_id, kind, content, reasoning, context_summary, model,
          source_frame_id, source_session_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)
      `).run(extractionId, assistantId, kind, content, reasoning, contextSummary, model,
        sourceFrameId, sourceSessionId, timestamp);
      return { row: this._briizyExtractionRow(this._getBriizyExtraction(extractionId)) };
    });
  }

  _getBriizyExtraction(extractionId) {
    return this.db.prepare('SELECT * FROM briizy_extractions WHERE id = ?').get(extractionId);
  }

  _briizyExtractionRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      assistantId: row.assistant_id,
      kind: row.kind,
      content: row.content,
      reasoning: row.reasoning,
      contextSummary: row.context_summary,
      model: row.model,
      sourceFrameId: row.source_frame_id,
      sourceSessionId: row.source_session_id,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  listBriizyExtractions(input = {}) {
    this._assertReady();
    v.object(input, 'extraction filters', ['kind', 'assistantId', 'status', 'sessionId', 'from', 'to', 'limit']);
    const clauses = [];
    const params = [];
    if (input.kind !== undefined) {
      clauses.push('kind = ?');
      params.push(v.oneOf(input.kind, 'kind', ['insight', 'task', 'memory', 'goal', 'focus', 'summary']));
    }
    if (input.assistantId !== undefined) {
      clauses.push('assistant_id = ?');
      params.push(v.string(input.assistantId, 'assistantId', { required: true, max: 100 }));
    }
    if (input.status !== undefined) {
      clauses.push('status = ?');
      params.push(v.oneOf(input.status, 'status', ['new', 'used', 'superseded', 'discarded']));
    }
    if (input.sessionId !== undefined) {
      clauses.push('source_session_id = ?');
      params.push(v.identifier(input.sessionId, 'sessionId'));
    }
    if (input.from !== undefined) {
      clauses.push('created_at >= ?');
      params.push(v.integer(input.from, 'from', { min: 0 }));
    }
    if (input.to !== undefined) {
      clauses.push('created_at <= ?');
      params.push(v.integer(input.to, 'to', { min: 0 }));
    }
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 1000 });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`
      SELECT * FROM briizy_extractions ${where} ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((row) => this._briizyExtractionRow(row));
  }

  setBriizyExtractionStatus(extractionId, status) {
    extractionId = v.identifier(extractionId, 'extractionId');
    status = v.oneOf(status, 'status', ['new', 'used', 'superseded', 'discarded']);
    return this._write('briizy', () => {
      const changed = this.db.prepare('UPDATE briizy_extractions SET status = ? WHERE id = ?')
        .run(status, extractionId).changes;
      if (!changed) v.fail('NOT_FOUND', 'Extraction not found');
      return { extractionId, status };
    });
  }

  createBriizyStagedTask(input = {}) {
    v.object(input, 'staged task', [
      'extractionId', 'title', 'detail', 'dueHint', 'confidence', 'sourceFrameId', 'sourceSessionId',
    ]);
    const extractionId = v.identifier(input.extractionId, 'extractionId', { nullable: true });
    const title = v.string(input.title, 'title', { required: true, max: 500 });
    const detail = v.string(input.detail, 'detail', { nullable: true, max: 20000 }) ?? null;
    const dueHint = v.string(input.dueHint, 'dueHint', { nullable: true, max: 200 }) ?? null;
    const confidence = input.confidence === undefined
      ? 0
      : v.number(Number(input.confidence), 'confidence', { min: 0, max: 1 });
    const sourceFrameId = v.identifier(input.sourceFrameId, 'sourceFrameId', { nullable: true });
    const sourceSessionId = v.identifier(input.sourceSessionId, 'sourceSessionId', { nullable: true });
    const stagedId = id();

    return this._write('briizy', (timestamp) => {
      this.db.prepare(`
        INSERT INTO briizy_staged_tasks (
          id, extraction_id, title, detail, due_hint, confidence, status,
          source_frame_id, source_session_id, created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, 'staged', ?, ?, ?, ?, 1)
      `).run(stagedId, extractionId, title, detail, dueHint, confidence,
        sourceFrameId, sourceSessionId, timestamp, timestamp);
      return { row: this._briizyStagedTaskRow(this._getBriizyStagedTask(stagedId)) };
    });
  }

  _getBriizyStagedTask(stagedId) {
    return this.db.prepare('SELECT * FROM briizy_staged_tasks WHERE id = ?').get(stagedId);
  }

  _briizyStagedTaskRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      extractionId: row.extraction_id,
      title: row.title,
      detail: row.detail,
      dueHint: row.due_hint,
      confidence: row.confidence,
      status: row.status,
      createdTaskId: row.created_task_id,
      sourceFrameId: row.source_frame_id,
      sourceSessionId: row.source_session_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  listBriizyStagedTasks(input = {}) {
    this._assertReady();
    v.object(input, 'staged task filters', ['status', 'sessionId', 'limit']);
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (input.status !== undefined) {
      clauses.push('status = ?');
      params.push(v.oneOf(input.status, 'status', ['staged', 'accepted', 'rejected', 'expired']));
    }
    if (input.sessionId !== undefined) {
      clauses.push('source_session_id = ?');
      params.push(v.identifier(input.sessionId, 'sessionId'));
    }
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 1000 });
    return this.db.prepare(`
      SELECT * FROM briizy_staged_tasks WHERE ${clauses.join(' AND ')}
      ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((row) => this._briizyStagedTaskRow(row));
  }

  /**
   * Create a proposal, or return the live one that already says this.
   * `dedupeKey` is the normalized identity of the thing being proposed, so the
   * same suggestion cannot reappear while an identical one is still pending.
   */
  createBriizyProposal(input = {}) {
    v.object(input, 'proposal', [
      'assistantId', 'kind', 'urgency', 'title', 'summary', 'rationale', 'evidence',
      'dedupeKey', 'extractionId', 'stagedTaskId', 'sourceFrameId', 'sourceSessionId',
    ]);
    const assistantId = v.string(input.assistantId, 'assistantId', { required: true, max: 100 });
    const kind = v.string(input.kind, 'kind', { required: true, max: 100 });
    const urgency = v.oneOf(input.urgency || 'normal', 'urgency', ['low', 'normal', 'high']);
    const title = v.string(input.title, 'title', { nullable: true, max: 300 }) ?? null;
    const summary = v.string(input.summary, 'summary', { required: true, max: 5000 });
    const rationale = v.string(input.rationale, 'rationale', { nullable: true, max: 10000 }) ?? null;
    const evidence = input.evidence === undefined ? [] : input.evidence;
    if (!Array.isArray(evidence) || evidence.length > 50) {
      v.fail('INVALID_INPUT', 'evidence must be a list of at most 50 items');
    }
    const evidenceJson = this._jsonValue(evidence, 'evidence', 200000);
    const dedupeKey = v.string(input.dedupeKey, 'dedupeKey', { nullable: true, max: 300 }) ?? null;
    const extractionId = v.identifier(input.extractionId, 'extractionId', { nullable: true });
    const stagedTaskId = v.identifier(input.stagedTaskId, 'stagedTaskId', { nullable: true });
    const sourceFrameId = v.identifier(input.sourceFrameId, 'sourceFrameId', { nullable: true });
    const sourceSessionId = v.identifier(input.sourceSessionId, 'sourceSessionId', { nullable: true });

    this._assertReady();
    if (dedupeKey) {
      const existing = this.db.prepare(`
        SELECT * FROM briizy_proposals
        WHERE dedupe_key = ? AND state = 'pending' AND deleted_at IS NULL LIMIT 1
      `).get(dedupeKey);
      if (existing) {
        return { duplicate: true, row: this._briizyProposalRow(existing) };
      }
    }

    const proposalId = id();
    return this._write('briizy', (timestamp) => {
      this.db.prepare(`
        INSERT INTO briizy_proposals (
          id, assistant_id, kind, urgency, title, summary, rationale, evidence_json,
          state, dedupe_key, extraction_id, staged_task_id, source_frame_id, source_session_id,
          created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(proposalId, assistantId, kind, urgency, title, summary, rationale, evidenceJson,
        dedupeKey, extractionId, stagedTaskId, sourceFrameId, sourceSessionId, timestamp, timestamp);
      this._appendBriizyProposalEvent(proposalId, null, 'pending', 'briizy', 'proposed', timestamp);
      return { duplicate: false, row: this._briizyProposalRow(this._getBriizyProposal(proposalId)) };
    });
  }

  _getBriizyProposal(proposalId) {
    return this.db.prepare('SELECT * FROM briizy_proposals WHERE id = ?').get(proposalId);
  }

  _briizyProposalRow(row) {
    if (!row) return null;
    let evidence = [];
    try {
      evidence = JSON.parse(row.evidence_json || '[]');
    } catch { /* keep empty */ }
    return {
      id: row.id,
      assistantId: row.assistant_id,
      kind: row.kind,
      urgency: row.urgency,
      title: row.title,
      summary: row.summary,
      rationale: row.rationale,
      evidence,
      state: row.state,
      snoozeUntil: row.snooze_until,
      createdTaskId: row.created_task_id,
      extractionId: row.extraction_id,
      stagedTaskId: row.staged_task_id,
      sourceFrameId: row.source_frame_id,
      sourceSessionId: row.source_session_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  _appendBriizyProposalEvent(proposalId, fromState, toState, actor, note, timestamp) {
    this.db.prepare(`
      INSERT INTO briizy_proposal_events (proposal_id, from_state, to_state, actor, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(proposalId, fromState, toState, actor, note || null, timestamp);
  }

  listBriizyProposals(input = {}) {
    this._assertReady();
    v.object(input, 'proposal filters', ['state', 'states', 'assistantId', 'limit', 'includeSnoozed']);
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    const states = input.states !== undefined
      ? input.states
      : (input.state !== undefined ? [input.state] : null);
    if (states) {
      if (!Array.isArray(states) || !states.length) v.fail('INVALID_INPUT', 'states must be a non-empty list');
      states.forEach((state) => v.oneOf(state, 'state', ['pending', 'accepted', 'dismissed', 'snoozed', 'expired']));
      clauses.push(`state IN (${states.map(() => '?').join(', ')})`);
      params.push(...states);
    }
    if (input.assistantId !== undefined) {
      clauses.push('assistant_id = ?');
      params.push(v.string(input.assistantId, 'assistantId', { required: true, max: 100 }));
    }
    // A snoozed proposal is hidden until its time comes round again.
    if (input.includeSnoozed !== true) {
      clauses.push('(state <> \'snoozed\' OR snooze_until IS NULL OR snooze_until <= ?)');
      params.push(now());
    }
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 1000 });
    return this.db.prepare(`
      SELECT * FROM briizy_proposals WHERE ${clauses.join(' AND ')}
      ORDER BY CASE urgency WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, created_at DESC
      LIMIT ?
    `).all(...params, limit).map((row) => this._briizyProposalRow(row));
  }

  listBriizyProposalEvents(proposalId) {
    this._assertReady();
    proposalId = v.identifier(proposalId, 'proposalId');
    return this.db.prepare(`
      SELECT from_state AS fromState, to_state AS toState, actor, note, created_at AS createdAt
      FROM briizy_proposal_events WHERE proposal_id = ? ORDER BY created_at, id
    `).all(proposalId);
  }

  /**
   * The proposal state machine (I6).
   *
   * Accepting creates exactly ONE task with `status: 'pending'` and
   * `automated: false`, source-linked to the proposal, and performs no work.
   *
   * Note on §10's wording: it points at `acceptCommand`, but that path creates a
   * command + run — an automation *request*. I6 and §4 assertion 2 require that
   * accepting cannot trigger an action, so accept goes through createTask here.
   * `acceptCommand` is Phase 6's business, where automation is explicitly turned
   * on for a specific plan.
   */
  decideBriizyProposal(proposalId, input = {}) {
    proposalId = v.identifier(proposalId, 'proposalId');
    v.object(input, 'decision', ['verdict', 'note', 'snoozeMinutes', 'actor']);
    const verdict = v.oneOf(input.verdict, 'verdict', ['accept', 'dismiss', 'snooze', 'expire']);
    const note = v.string(input.note, 'note', { nullable: true, max: 2000 }) ?? null;
    const actor = v.oneOf(input.actor || 'user', 'actor', ['user', 'briizy', 'system']);
    const snoozeMinutes = input.snoozeMinutes === undefined
      ? 60
      : v.integer(input.snoozeMinutes, 'snoozeMinutes', { min: 1, max: 60 * 24 * 30 });

    // 'tasks' is a continuity domain, so an accepted task syncs like any other.
    // The proposal's evidence — frame and session ids — stays in the local-only
    // briizy tables and is deliberately not copied onto the task (I9).
    const domains = verdict === 'accept' ? ['briizy', 'tasks'] : ['briizy'];

    return this._writeDomains(domains, (timestamp) => {
      const current = this._getBriizyProposal(proposalId);
      if (!current) v.fail('NOT_FOUND', 'Proposal not found');
      if (current.deleted_at != null) v.fail('DELETED', 'Proposal is archived');

      const terminal = ['accepted', 'dismissed', 'expired'];
      if (terminal.includes(current.state)) {
        v.fail('INVALID_STATE', `Proposal is already ${current.state}`);
      }

      const nextState = {
        accept: 'accepted', dismiss: 'dismissed', snooze: 'snoozed', expire: 'expired',
      }[verdict];

      let createdTaskId = current.created_task_id;
      if (verdict === 'accept') {
        if (createdTaskId) v.fail('INVALID_STATE', 'This proposal already created a task');
        const taskId = id();
        // source_key has a unique index over active rows, so a double-accept
        // cannot produce two tasks even if two callers race.
        const sourceKey = `briizy:proposal:${proposalId}`;
        const description = [current.summary, current.rationale]
          .filter(Boolean).join('\n\n').slice(0, 50000);
        this.db.prepare(`
          INSERT INTO tasks (
            id, title, description, status, priority, automated, source_key,
            created_at, updated_at, revision
          ) VALUES (?, ?, ?, 'pending', ?, 0, ?, ?, ?, 1)
        `).run(
          taskId,
          (current.title || current.summary).slice(0, 500),
          description,
          current.urgency === 'high' ? 'high' : 'normal',
          sourceKey,
          timestamp,
          timestamp,
        );
        createdTaskId = taskId;

        if (current.staged_task_id) {
          this.db.prepare(`
            UPDATE briizy_staged_tasks
            SET status = 'accepted', created_task_id = ?, updated_at = ?, revision = revision + 1
            WHERE id = ?
          `).run(taskId, timestamp, current.staged_task_id);
        }
      }

      if (verdict === 'dismiss' && current.staged_task_id) {
        this.db.prepare(`
          UPDATE briizy_staged_tasks SET status = 'rejected', updated_at = ?, revision = revision + 1
          WHERE id = ?
        `).run(timestamp, current.staged_task_id);
      }

      this.db.prepare(`
        UPDATE briizy_proposals
        SET state = ?, snooze_until = ?, created_task_id = ?, updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(
        nextState,
        verdict === 'snooze' ? timestamp + snoozeMinutes * 60 * 1000 : null,
        createdTaskId,
        timestamp,
        proposalId,
      );
      this._appendBriizyProposalEvent(proposalId, current.state, nextState, actor, note, timestamp);

      this.logger?.info?.('briizy', `Proposal ${nextState}`, {
        proposalId,
        kind: current.kind,
        assistantId: current.assistant_id,
        createdTaskId,
        actor,
      });

      return {
        row: this._briizyProposalRow(this._getBriizyProposal(proposalId)),
        task: createdTaskId
          ? toBooleanRow(this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(createdTaskId), ['automated'])
          : null,
      };
    });
  }

  /** Retire proposals nobody acted on, so the inbox does not grow forever. */
  expireBriizyProposals(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
    const cutoffAge = v.integer(olderThanMs, 'olderThanMs', { min: 60 * 1000 });
    return this._write('briizy', (timestamp) => {
      const stale = this.db.prepare(`
        SELECT id, state FROM briizy_proposals
        WHERE deleted_at IS NULL AND state IN ('pending', 'snoozed') AND created_at < ?
      `).all(timestamp - cutoffAge);
      stale.forEach((row) => {
        this.db.prepare(`
          UPDATE briizy_proposals SET state = 'expired', updated_at = ?, revision = revision + 1 WHERE id = ?
        `).run(timestamp, row.id);
        this._appendBriizyProposalEvent(row.id, row.state, 'expired', 'system', 'aged out', timestamp);
      });
      return { expired: stale.length };
    });
  }

  /**
   * A durable fact learned from the screen. Goes into the EXISTING memory_facts
   * table with provenance (I1, I7) — there is no second memory. Near-duplicates
   * are folded into the existing fact rather than piling up.
   */
  addBriizyMemoryFact(input = {}) {
    v.object(input, 'memory fact', [
      'factText', 'sectionKey', 'confidence', 'sourceFrameId', 'sourceSessionId', 'extractionId', 'agentName',
    ]);
    const factText = v.string(input.factText, 'factText', { required: true, max: 5000 });
    const confidence = input.confidence === undefined
      ? null
      : v.number(Number(input.confidence), 'confidence', { min: 0, max: 1 });
    const sourceFrameId = v.identifier(input.sourceFrameId, 'sourceFrameId', { nullable: true });
    const sourceSessionId = v.identifier(input.sourceSessionId, 'sourceSessionId', { nullable: true });
    const extractionId = v.identifier(input.extractionId, 'extractionId', { nullable: true });
    const agentKey = this._memoryAgentKey(input.agentName || null);
    const sectionKey = input.sectionKey === undefined ? 'user.workContext' : input.sectionKey;
    const definition = this._memorySectionDefinitions(agentKey)
      .find((item) => item.profileKey === sectionKey);
    if (!definition) v.fail('INVALID_INPUT', 'Unsupported memory section');

    this._assertReady();
    const normalized = factText.trim().toLowerCase().replace(/\s+/g, ' ');
    const existing = this.db.prepare(`
      SELECT id, fact_text FROM memory_facts WHERE agent_key = ? AND deleted_at IS NULL
    `).all(agentKey).find((row) => row.fact_text.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
    if (existing) {
      return { duplicate: true, factId: existing.id };
    }

    const factId = id();
    return this._write('memory', (timestamp) => {
      const sectionId = this.db.prepare('SELECT id FROM memory_sections WHERE key = ?')
        .get(definition.key)?.id || null;
      this.db.prepare(`
        INSERT INTO memory_facts (
          id, section_id, fact_text, created_at, updated_at, revision,
          agent_key, category, confidence,
          origin, source_frame_id, source_session_id, extraction_id
        ) VALUES (?, ?, ?, ?, ?, 1, ?, 'context', ?, 'screen', ?, ?, ?)
      `).run(factId, sectionId, factText, timestamp, timestamp,
        agentKey, confidence == null ? 1 : confidence,
        sourceFrameId, sourceSessionId, extractionId);
      this.logger?.info?.('briizy', 'Memory fact learned from the screen', {
        factId, sectionKey, confidence, sourceSessionId,
      });
      return { duplicate: false, factId };
    });
  }

  /**
   * "What briizy learned" (I7): every derived write with its provenance, so the
   * user can see, edit, or undo any of it.
   */
  getBriizyLearningLog(input = {}) {
    this._assertReady();
    v.object(input, 'learning log filters', ['from', 'to', 'limit']);
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 1000 });
    const from = input.from === undefined ? 0 : v.integer(input.from, 'from', { min: 0 });
    const to = input.to === undefined ? now() : v.integer(input.to, 'to', { min: 0 });

    const facts = this.db.prepare(`
      SELECT id, fact_text AS factText, origin, confidence, source_frame_id AS sourceFrameId,
        source_session_id AS sourceSessionId, extraction_id AS extractionId, created_at AS createdAt
      FROM memory_facts
      WHERE deleted_at IS NULL AND origin = 'screen' AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC LIMIT ?
    `).all(from, to, limit);

    const proposals = this.listBriizyProposals({ limit }).filter(
      (proposal) => proposal.createdAt >= from && proposal.createdAt <= to,
    );
    const extractions = this.listBriizyExtractions({ from, to, limit });

    return { facts, proposals, extractions };
  }

  createBriizyGoal(input = {}) {
    v.object(input, 'goal', ['title', 'detail', 'targetAt', 'status']);
    const title = v.string(input.title, 'title', { required: true, max: 300 });
    const detail = v.string(input.detail, 'detail', { nullable: true, max: 20000 }) ?? null;
    const targetAt = v.integer(input.targetAt ?? null, 'targetAt', { nullable: true, min: 0 });
    const status = v.oneOf(input.status || 'active', 'status', ['active', 'paused', 'achieved', 'abandoned']);
    const goalId = id();
    return this._write('briizy', (timestamp) => {
      this.db.prepare(`
        INSERT INTO briizy_goals (id, title, detail, status, target_at, created_at, updated_at, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(goalId, title, detail, status, targetAt, timestamp, timestamp);
      return { row: this._briizyGoalRow(this.db.prepare('SELECT * FROM briizy_goals WHERE id = ?').get(goalId)) };
    });
  }

  _briizyGoalRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      detail: row.detail,
      status: row.status,
      targetAt: row.target_at,
      lastEvaluatedAt: row.last_evaluated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
  }

  listBriizyGoals(input = {}) {
    this._assertReady();
    v.object(input, 'goal filters', ['status', 'limit']);
    const clauses = ['deleted_at IS NULL'];
    const params = [];
    if (input.status !== undefined) {
      clauses.push('status = ?');
      params.push(v.oneOf(input.status, 'status', ['active', 'paused', 'achieved', 'abandoned']));
    }
    const limit = input.limit === undefined ? 100 : v.integer(input.limit, 'limit', { min: 1, max: 500 });
    return this.db.prepare(`
      SELECT * FROM briizy_goals WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((row) => this._briizyGoalRow(row));
  }

  updateBriizyGoal(goalId, patch = {}) {
    goalId = v.identifier(goalId, 'goalId');
    v.object(patch, 'goal changes', ['title', 'detail', 'status', 'targetAt', 'lastEvaluatedAt']);
    return this._write('briizy', (timestamp) => {
      const current = this.db.prepare('SELECT * FROM briizy_goals WHERE id = ? AND deleted_at IS NULL').get(goalId);
      if (!current) v.fail('NOT_FOUND', 'Goal not found');
      const title = patch.title === undefined
        ? current.title
        : v.string(patch.title, 'title', { required: true, max: 300 });
      const detail = patch.detail === undefined
        ? current.detail
        : (v.string(patch.detail, 'detail', { nullable: true, max: 20000 }) ?? null);
      const status = patch.status === undefined
        ? current.status
        : v.oneOf(patch.status, 'status', ['active', 'paused', 'achieved', 'abandoned']);
      const targetAt = patch.targetAt === undefined
        ? current.target_at
        : v.integer(patch.targetAt ?? null, 'targetAt', { nullable: true, min: 0 });
      const lastEvaluatedAt = patch.lastEvaluatedAt === undefined
        ? current.last_evaluated_at
        : v.integer(patch.lastEvaluatedAt ?? null, 'lastEvaluatedAt', { nullable: true, min: 0 });
      this.db.prepare(`
        UPDATE briizy_goals SET title = ?, detail = ?, status = ?, target_at = ?, last_evaluated_at = ?,
          updated_at = ?, revision = revision + 1
        WHERE id = ?
      `).run(title, detail, status, targetAt, lastEvaluatedAt, timestamp, goalId);
      return { row: this._briizyGoalRow(this.db.prepare('SELECT * FROM briizy_goals WHERE id = ?').get(goalId)) };
    });
  }

  archiveBriizyGoal(goalId) {
    goalId = v.identifier(goalId, 'goalId');
    return this._write('briizy', (timestamp) => {
      const changed = this.db.prepare(`
        UPDATE briizy_goals SET deleted_at = ?, updated_at = ?, revision = revision + 1
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, goalId).changes;
      if (!changed) v.fail('NOT_FOUND', 'Goal not found');
      return { ok: true };
    });
  }

  close() {
    if (!this.db) return;
    this.logger?.info?.('local-data', 'The local database is closing after pending synchronous writes completed.');
    this.db.close();
    this.db = null;
  }
}

module.exports = { LocalDataService, LocalDataError: v.LocalDataError };
