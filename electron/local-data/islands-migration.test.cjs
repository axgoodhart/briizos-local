const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');
const { LocalDataService } = require('../local-data-service');

// Run with ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron --test electron/local-data/islands-migration.test.cjs
function beforeIslands(t) {
  const service = new LocalDataService({ databasePath: ':memory:' });
  service.db = new Database(':memory:');
  service.db.pragma('foreign_keys = ON');
  t.after(() => service.close());
  service.db.exec(`CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL
  )`);
  const names = fs.readdirSync(service.migrationsPath)
    .filter((name) => /^\d+_.*\.sql$/.test(name) && Number.parseInt(name, 10) < 17)
    .sort();
  for (const name of names) {
    const sql = fs.readFileSync(path.join(service.migrationsPath, name), 'utf8');
    service.db.exec(sql);
    service.db.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?, 1)')
      .run(Number.parseInt(name, 10), name, crypto.createHash('sha256').update(sql).digest('hex'));
  }
  return service;
}

test('mixed saved identities upgrade without replacing panels, projects, or tasks', (t) => {
  const service = beforeIslands(t);
  const { db } = service;
  db.exec(`
    INSERT INTO workspace_panels (id, feature_key, column_id, position, created_at, updated_at)
    VALUES ('forest', 'forest', 'left', 1, 1, 1), ('island', 'island', 'right', 2, 1, 1),
      ('custom-panel', 'forest', 'left', 3, 1, 1);
    INSERT INTO forest_projects (id, title, created_at, updated_at)
    VALUES ('project', 'Saved project', 1, 1);
    INSERT INTO tasks (id, title, forest_project_id, source_key, created_at, updated_at, deleted_at)
    VALUES ('legacy', 'Earlier task', 'project', 'forest-project:project', 1, 1, NULL),
      ('current', 'Current task', 'project', 'island-project:project', 1, 1, NULL),
      ('agent', 'Agent task', 'project', 'forest-agent:card:123', 1, 1, NULL),
      ('archived', 'Earlier archived task', 'project', 'forest-project:project', 1, 1, 2);
    UPDATE domain_revisions SET revision = 8, updated_at = 3 WHERE domain = 'forest';
    INSERT INTO domain_revisions VALUES ('island', 4, 5);
    INSERT INTO sync_outbox VALUES ('forest', 8, 'failed', 3, 100, 'old failure', 1, 3),
      ('island', 4, 'uploading', 0, NULL, NULL, 2, 5);
    INSERT INTO sync_state VALUES ('forest', 6, 'old-remote', 'old-cursor', 3),
      ('island', 2, 'current-remote', 'current-cursor', 5);
    INSERT INTO settings (key, value_json, created_at, updated_at)
    VALUES ('ambient_workspace', '{"windows":[{"app":"forest"}]}', 1, 1);
  `);
  const originalPanels = db.prepare('SELECT * FROM workspace_panels ORDER BY id').all();

  service._runMigrations();
  assert.deepEqual(db.prepare('SELECT * FROM workspace_panels ORDER BY id').all(),
    originalPanels.map((panel) => ({ ...panel, feature_key: 'island' })));
  assert.equal(db.prepare('SELECT title FROM island_projects WHERE id = ?').get('project').title, 'Saved project');
  assert.deepEqual(db.prepare('SELECT id, island_project_id, source_key FROM tasks ORDER BY id').all(), [
    { id: 'agent', island_project_id: 'project', source_key: 'island-agent:card:123' },
    { id: 'archived', island_project_id: 'project', source_key: 'island-project:project' },
    { id: 'current', island_project_id: 'project', source_key: 'island-project:project' },
    { id: 'legacy', island_project_id: 'project', source_key: null },
  ]);
  assert.deepEqual(db.prepare("SELECT * FROM domain_revisions WHERE domain = 'island'").get(),
    { domain: 'island', revision: 8, updated_at: 5 });
  assert.deepEqual(db.prepare('SELECT * FROM sync_outbox').all(), [{
    domain: 'island', dirty_revision: 8, status: 'pending', attempts: 0,
    next_attempt_at: null, last_error_code: null, created_at: 1, updated_at: 5,
  }]);
  assert.deepEqual(db.prepare('SELECT * FROM sync_state').all(), [{
    domain: 'island', last_uploaded_revision: 6, remote_revision: 'current-remote', cursor: 'current-cursor', updated_at: 5,
  }]);
  assert.equal(db.prepare("SELECT 1 FROM domain_revisions WHERE domain = 'forest'").get(), undefined);
  assert.deepEqual(JSON.parse(db.prepare("SELECT value_json FROM settings WHERE key = 'ambient_workspace'").get().value_json),
    { windows: [{ app: 'island' }] });
  assert.deepEqual(db.pragma('foreign_key_check'), []);
  assert.doesNotThrow(() => service._runMigrations());
});

test('legacy sync metadata moves when no current identity exists', (t) => {
  const service = beforeIslands(t);
  service.db.exec(`
    INSERT INTO sync_outbox VALUES ('forest', 3, 'failed', 2, 100, 'retry', 1, 2);
    INSERT INTO sync_state VALUES ('forest', 2, 'remote', 'cursor', 2);
  `);
  service._runMigrations();
  assert.equal(service.db.prepare('SELECT domain FROM sync_outbox').get().domain, 'island');
  assert.deepEqual(service.db.prepare('SELECT * FROM sync_state').get(),
    { domain: 'island', last_uploaded_revision: 2, remote_revision: 'remote', cursor: 'cursor', updated_at: 2 });
});

test('a fresh database initializes and can reopen its applied migrations', (t) => {
  const service = new LocalDataService({ databasePath: ':memory:' });
  t.after(() => service.close());
  assert.equal(service.initialize().schemaVersion, 17);
  assert.doesNotThrow(() => service._runMigrations());
});

test('the original successful migration receipt is accepted without rerunning table renames', (t) => {
  const service = beforeIslands(t);
  service._runMigrations();
  service.db.prepare('UPDATE schema_migrations SET checksum = ? WHERE version = 17')
    .run('cc614e7053aacabd89fbdcd6ec61086c5da205d72bb93525bcda32a814993b8c');
  assert.doesNotThrow(() => service._runMigrations());
  service.db.prepare("UPDATE schema_migrations SET checksum = 'unexpected' WHERE version = 17").run();
  assert.throws(() => service._runMigrations(), /Migration 017_islands_identity.sql changed after it was applied/);
});
