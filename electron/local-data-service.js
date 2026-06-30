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
