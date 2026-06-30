const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const Database = require('better-sqlite3');
const v = require('./local-data/validation');

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'blocked'];
const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const ORGANIZER_TYPES = ['note', 'project', 'event', 'timer'];
const CONTINUITY_DOMAINS = new Set(['tasks', 'organizer', 'retainedText']);
const SETTING_KEYS = new Set([
  'ui_theme',
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
      this.logger?.info?.('local-data', 'Generation-2 local database ready', this.getStatus());
      return this.getStatus();
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
    });
  }

  ensureDefaultModelProfiles() {
    this._assertReady();
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM model_profiles WHERE deleted_at IS NULL').get().count;
    if (count) return this.listModelProfiles();
    const defaults = [
      { name: 'gemini-2.5-flash', provider: 'gemini', model: 'gemini-2.5-flash', maxTokens: 8192, supportsThinking: false },
      { name: 'claude-sonnet-4-5', provider: 'claude', model: 'claude-sonnet-4-5-20250929', maxTokens: 8192, supportsThinking: true },
      { name: 'gpt-5.4', provider: 'openai', model: 'gpt-5.4', maxTokens: 8192, supportsThinking: true },
    ];
    return this._write('settings', (timestamp) => {
      defaults.forEach((profile, index) => {
        this.db.prepare(`
          INSERT INTO model_profiles (
            id, name, provider, model, settings_json, is_default, created_at, updated_at, revision
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(id(), profile.name, profile.provider, profile.model, JSON.stringify({
          maxTokens: profile.maxTokens,
          supportsThinking: profile.supportsThinking,
        }), index === 0 ? 1 : 0, timestamp, timestamp);
      });
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
      display_name: row.name,
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
      FROM workspace_panels WHERE deleted_at IS NULL ORDER BY position, created_at
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
          WHERE deleted_at IS NULL AND id NOT IN (${placeholders})
        `).run(timestamp, timestamp, ...activeIds);
      } else {
        this.db.prepare(`
          UPDATE workspace_panels SET deleted_at = ?, updated_at = ?, revision = revision + 1
          WHERE deleted_at IS NULL
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
    v.object(input, 'canvas filters', ['includeDeleted']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    return this.db.prepare(`
      SELECT id, title, length(html_text) AS size, source_kind, source_url, render_engine,
             form_factor, panel_settings_json, created_at, updated_at, revision, deleted_at
      FROM canvases ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'}
      ORDER BY updated_at DESC
    `).all().map((row) => this._canvasSummary(row));
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

  _write(domain, work) {
    this._assertReady();
    const timestamp = now();
    const committed = this.db.transaction(() => {
      const value = work(timestamp);
      const revisionRow = this.db.prepare(`
        INSERT INTO domain_revisions (domain, revision, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT(domain) DO UPDATE SET
          revision = domain_revisions.revision + 1,
          updated_at = excluded.updated_at
        RETURNING revision
      `).get(domain, timestamp);

      if (CONTINUITY_DOMAINS.has(domain)) {
        this.db.prepare(`
          INSERT INTO sync_outbox (domain, dirty_revision, status, attempts, created_at, updated_at)
          VALUES (?, ?, 'pending', 0, ?, ?)
          ON CONFLICT(domain) DO UPDATE SET
            dirty_revision = excluded.dirty_revision,
            status = 'pending',
            attempts = 0,
            next_attempt_at = NULL,
            last_error_code = NULL,
            updated_at = excluded.updated_at
        `).run(domain, revisionRow.revision, timestamp, timestamp);
      }
      return { value, revision: revisionRow.revision };
    })();

    this.emit('changed', { domains: [domain], revision: committed.revision });
    return { ...committed.value, domainRevision: committed.revision };
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
    v.object(input, 'task filters', ['projectId', 'status', 'includeDeleted', 'limit']);
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
    if (input.status !== undefined) {
      clauses.push('status = ?');
      params.push(v.oneOf(input.status, 'status', TASK_STATUSES));
    }
    const limit = input.limit === undefined ? 500 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`
      SELECT id, project_id, title, description, status, priority, due_at, automated,
             created_at, updated_at, revision, deleted_at
      FROM tasks ${where}
      ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit).map((row) => toBooleanRow(row, ['automated']));
  }

  createTask(input) {
    v.object(input, 'task', ['projectId', 'title', 'description', 'status', 'priority', 'dueAt', 'automated']);
    const row = {
      id: id(),
      projectId: v.optional(input.projectId, (value) => this._normalizeProjectId(value)) ?? null,
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
          id, project_id, title, description, status, priority, due_at, automated,
          created_at, updated_at, revision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(row.id, row.projectId, row.title, row.description, row.status, row.priority,
        row.dueAt, row.automated ? 1 : 0, timestamp, timestamp);
      return { row: toBooleanRow(this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id), ['automated']) };
    });
  }

  updateTask(taskId, expectedRevision, patch) {
    taskId = v.identifier(taskId, 'taskId');
    expectedRevision = v.integer(expectedRevision, 'expectedRevision', { min: 1 });
    v.object(patch, 'task patch', ['projectId', 'title', 'description', 'status', 'priority', 'dueAt', 'automated']);
    const columnMap = {
      projectId: ['project_id', (value) => this._normalizeProjectId(value)],
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
    return this._archiveRow('tasks', 'tasks', taskId, expectedRevision, ['automated']);
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
    v.object(value, 'recurrence', ['frequency', 'interval', 'untilAt']);
    const normalized = {
      frequency: v.oneOf(value.frequency, 'recurrence.frequency', ['daily', 'weekly', 'monthly', 'yearly']),
      interval: value.interval === undefined ? 1 : v.integer(value.interval, 'recurrence.interval', { min: 1, max: 1000 }),
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

  listThreads(input = {}) {
    this._assertReady();
    v.object(input, 'thread filters', ['kind', 'includeDeleted', 'limit']);
    const includeDeleted = input.includeDeleted === undefined
      ? false
      : v.boolean(input.includeDeleted, 'includeDeleted');
    const clauses = [];
    const params = [];
    if (!includeDeleted) clauses.push('deleted_at IS NULL');
    if (input.kind !== undefined) {
      clauses.push('kind = ?');
      params.push(v.string(input.kind, 'kind', { required: true, max: 100 }));
    }
    const limit = input.limit === undefined ? 500 : v.integer(input.limit, 'limit', { min: 1, max: 2000 });
    return this.db.prepare(`
      SELECT id, kind, title, model_profile_id, status, created_at, updated_at, revision, deleted_at
      FROM threads ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY updated_at DESC LIMIT ?
    `).all(...params, limit);
  }

  createThread(input = {}) {
    v.object(input, 'thread', ['kind', 'title', 'modelProfileId']);
    const thread = {
      id: id(),
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

  _normalizeProjectId(value) {
    const projectId = v.identifier(value, 'projectId', { nullable: true });
    if (projectId == null) return null;
    const project = this.db.prepare(`
      SELECT id FROM organizer_items WHERE id = ? AND type = 'project' AND deleted_at IS NULL
    `).get(projectId);
    if (!project) v.fail('INVALID_RELATION', 'projectId must refer to an active organizer project');
    return projectId;
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

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
    this.logger?.info?.('local-data', 'Generation-2 local database closed');
  }
}

module.exports = { LocalDataService, LocalDataError: v.LocalDataError };
