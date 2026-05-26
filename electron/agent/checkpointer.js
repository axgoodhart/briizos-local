/**
 * LangGraph checkpointer provider for the in-process Electron agent.
 *
 * Source parity:
 *   - agent/src/agents/checkpointer/provider.py
 *   - agent/src/config/checkpointer_config.py
 *   - agent/src/config/paths.py
 *
 * Python DeerFlow uses a configured singleton checkpointer so thread state
 * survives process restarts. This file provides the same behavior for the JS
 * runtime without starting any external service.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  BaseCheckpointSaver,
  MemorySaver,
  WRITES_IDX_MAP,
  TASKS,
  copyCheckpoint,
  getCheckpointId,
  maxChannelVersion,
} = require('@langchain/langgraph-checkpoint');
const { logger } = require('../logger');

const AGENT_DIR = path.resolve(__dirname, '../../agent');
const CONFIG_PATH = path.join(AGENT_DIR, 'config.yaml');
const DEFAULT_DEER_HOME = process.env.DEER_FLOW_HOME
  ? path.resolve(process.env.DEER_FLOW_HOME)
  : path.join(AGENT_DIR, '.deer-flow');

let singleton = null;

function readConfig() {
  try {
    return yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function resolveDataPath(rawPath) {
  if (!rawPath) return path.join(DEFAULT_DEER_HOME, 'checkpoints.db');
  if (rawPath === ':memory:' || rawPath.startsWith('file:')) return rawPath;
  return path.isAbsolute(rawPath)
    ? path.resolve(rawPath)
    : path.resolve(DEFAULT_DEER_HOME, rawPath);
}

function generateWriteKey(threadId, checkpointNamespace, checkpointId) {
  return JSON.stringify([threadId, checkpointNamespace || '', checkpointId]);
}

function rowToWrite(row) {
  return [row.task_id, row.channel, row.value];
}

class SqliteCheckpointSaver extends BaseCheckpointSaver {
  constructor(filePath, serde) {
    super(serde);
    this.filePath = filePath;

    let sqlite;
    try {
      sqlite = require('node:sqlite');
    } catch (err) {
      err.message = `SQLite checkpointer unavailable in this Node/Electron runtime: ${err.message}`;
      throw err;
    }

    if (filePath !== ':memory:' && !filePath.startsWith('file:')) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    this.db = new sqlite.DatabaseSync(filePath);
    this.setup();
  }

  setup() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        thread_id TEXT NOT NULL,
        checkpoint_ns TEXT NOT NULL DEFAULT '',
        checkpoint_id TEXT NOT NULL,
        parent_checkpoint_id TEXT,
        checkpoint TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
      );
      CREATE TABLE IF NOT EXISTS checkpoint_writes (
        thread_id TEXT NOT NULL,
        checkpoint_ns TEXT NOT NULL DEFAULT '',
        checkpoint_id TEXT NOT NULL,
        inner_key TEXT NOT NULL,
        task_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, inner_key)
      );
      CREATE INDEX IF NOT EXISTS idx_checkpoints_thread_ns
        ON checkpoints (thread_id, checkpoint_ns, checkpoint_id);
      CREATE INDEX IF NOT EXISTS idx_checkpoint_writes_lookup
        ON checkpoint_writes (thread_id, checkpoint_ns, checkpoint_id);
    `);
  }

  _getCheckpointRow(threadId, checkpointNamespace, checkpointId) {
    return this.db.prepare(`
      SELECT checkpoint_id, checkpoint, metadata, parent_checkpoint_id
      FROM checkpoints
      WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
    `).get(threadId, checkpointNamespace || '', checkpointId);
  }

  _getLatestCheckpointRow(threadId, checkpointNamespace) {
    return this.db.prepare(`
      SELECT checkpoint_id, checkpoint, metadata, parent_checkpoint_id
      FROM checkpoints
      WHERE thread_id = ? AND checkpoint_ns = ?
      ORDER BY checkpoint_id DESC
      LIMIT 1
    `).get(threadId, checkpointNamespace || '');
  }

  _getWriteRows(threadId, checkpointNamespace, checkpointId) {
    return this.db.prepare(`
      SELECT task_id, channel, value
      FROM checkpoint_writes
      WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
      ORDER BY inner_key ASC
    `).all(threadId, checkpointNamespace || '', checkpointId);
  }

  async _pendingWrites(threadId, checkpointNamespace, checkpointId) {
    const rows = this._getWriteRows(threadId, checkpointNamespace, checkpointId);
    return Promise.all(rows.map(async (row) => [
      row.task_id,
      row.channel,
      await this.serde.loadsTyped('json', row.value),
    ]));
  }

  async _migratePendingSends(mutableCheckpoint, threadId, checkpointNamespace, parentCheckpointId) {
    const rows = this._getWriteRows(threadId, checkpointNamespace, parentCheckpointId);
    const pendingSends = await Promise.all(
      rows
        .map(rowToWrite)
        .filter(([, channel]) => channel === TASKS)
        .map(async ([, , value]) => this.serde.loadsTyped('json', value))
    );

    const checkpoint = mutableCheckpoint;
    checkpoint.channel_values ||= {};
    checkpoint.channel_values[TASKS] = pendingSends;
    checkpoint.channel_versions ||= {};
    checkpoint.channel_versions[TASKS] = Object.keys(checkpoint.channel_versions).length > 0
      ? maxChannelVersion(...Object.values(checkpoint.channel_versions))
      : this.getNextVersion(undefined);
  }

  async _rowToTuple(row, threadId, checkpointNamespace, config = null) {
    if (!row) return undefined;
    const checkpoint = await this.serde.loadsTyped('json', row.checkpoint);
    if (checkpoint.v < 4 && row.parent_checkpoint_id !== null && row.parent_checkpoint_id !== undefined) {
      await this._migratePendingSends(checkpoint, threadId, checkpointNamespace, row.parent_checkpoint_id);
    }

    const checkpointTuple = {
      config: config || {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: checkpointNamespace || '',
          checkpoint_id: row.checkpoint_id,
        },
      },
      checkpoint,
      metadata: await this.serde.loadsTyped('json', row.metadata),
      pendingWrites: await this._pendingWrites(threadId, checkpointNamespace, row.checkpoint_id),
    };

    if (row.parent_checkpoint_id !== null && row.parent_checkpoint_id !== undefined) {
      checkpointTuple.parentConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: checkpointNamespace || '',
          checkpoint_id: row.parent_checkpoint_id,
        },
      };
    }

    return checkpointTuple;
  }

  async getTuple(config) {
    const threadId = config.configurable?.thread_id;
    if (threadId === undefined) return undefined;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';
    const checkpointId = getCheckpointId(config);

    if (checkpointId) {
      const row = this._getCheckpointRow(threadId, checkpointNamespace, checkpointId);
      return this._rowToTuple(row, threadId, checkpointNamespace, config);
    }

    const row = this._getLatestCheckpointRow(threadId, checkpointNamespace);
    return this._rowToTuple(row, threadId, checkpointNamespace);
  }

  async *list(config = {}, options = {}) {
    const { before, filter } = options;
    let { limit } = options;
    const threadIds = config.configurable?.thread_id
      ? [config.configurable.thread_id]
      : this.db.prepare('SELECT DISTINCT thread_id FROM checkpoints ORDER BY thread_id ASC').all().map((row) => row.thread_id);
    const configuredNamespace = config.configurable?.checkpoint_ns;
    const configuredCheckpointId = config.configurable?.checkpoint_id;

    for (const threadId of threadIds) {
      const namespaces = configuredNamespace !== undefined
        ? [configuredNamespace]
        : this.db.prepare('SELECT DISTINCT checkpoint_ns FROM checkpoints WHERE thread_id = ? ORDER BY checkpoint_ns ASC').all(threadId).map((row) => row.checkpoint_ns);

      for (const checkpointNamespace of namespaces) {
        const rows = this.db.prepare(`
          SELECT checkpoint_id, checkpoint, metadata, parent_checkpoint_id
          FROM checkpoints
          WHERE thread_id = ? AND checkpoint_ns = ?
          ORDER BY checkpoint_id DESC
        `).all(threadId, checkpointNamespace || '');

        for (const row of rows) {
          if (configuredCheckpointId && row.checkpoint_id !== configuredCheckpointId) continue;
          if (before?.configurable?.checkpoint_id && row.checkpoint_id >= before.configurable.checkpoint_id) continue;

          const metadata = await this.serde.loadsTyped('json', row.metadata);
          if (filter && !Object.entries(filter).every(([key, value]) => metadata[key] === value)) continue;
          if (limit !== undefined) {
            if (limit <= 0) break;
            limit -= 1;
          }

          const tuple = await this._rowToTuple(row, threadId, checkpointNamespace);
          if (tuple) yield tuple;
        }
      }
    }
  }

  async put(config, checkpoint, metadata = {}) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';
    if (threadId === undefined) {
      throw new Error('Failed to put checkpoint. RunnableConfig is missing configurable.thread_id.');
    }

    const preparedCheckpoint = copyCheckpoint(checkpoint);
    const [[, serializedCheckpoint], [, serializedMetadata]] = await Promise.all([
      this.serde.dumpsTyped(preparedCheckpoint),
      this.serde.dumpsTyped(metadata),
    ]);

    this.db.prepare(`
      INSERT OR REPLACE INTO checkpoints
        (thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, checkpoint, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      threadId,
      checkpointNamespace,
      preparedCheckpoint.id,
      config.configurable?.checkpoint_id ?? null,
      serializedCheckpoint,
      serializedMetadata
    );

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNamespace,
        checkpoint_id: preparedCheckpoint.id,
      },
    };
  }

  async putWrites(config, writes, taskId) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? '';
    const checkpointId = config.configurable?.checkpoint_id;
    if (threadId === undefined) {
      throw new Error('Failed to put writes. RunnableConfig is missing configurable.thread_id.');
    }
    if (checkpointId === undefined) {
      throw new Error('Failed to put writes. RunnableConfig is missing configurable.checkpoint_id.');
    }

    const selectExisting = this.db.prepare(`
      SELECT inner_key FROM checkpoint_writes
      WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ? AND inner_key = ?
    `);
    const insertWrite = this.db.prepare(`
      INSERT OR REPLACE INTO checkpoint_writes
        (thread_id, checkpoint_ns, checkpoint_id, inner_key, task_id, channel, value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let idx = 0; idx < writes.length; idx += 1) {
      const [channel, value] = writes[idx];
      const [, serializedValue] = await this.serde.dumpsTyped(value);
      const writeIndex = WRITES_IDX_MAP[channel] || idx;
      const innerKey = `${taskId},${writeIndex}`;
      if (writeIndex >= 0 && selectExisting.get(threadId, checkpointNamespace, checkpointId, innerKey)) {
        continue;
      }
      insertWrite.run(threadId, checkpointNamespace, checkpointId, innerKey, taskId, channel, serializedValue);
    }
  }

  async deleteThread(threadId) {
    this.db.prepare('DELETE FROM checkpoint_writes WHERE thread_id = ?').run(threadId);
    this.db.prepare('DELETE FROM checkpoints WHERE thread_id = ?').run(threadId);
  }

  close() {
    this.db.close();
  }
}

class JsonCheckpointSaver extends MemorySaver {
  constructor(filePath, serde) {
    super(serde);
    this.filePath = filePath;
    this._flushQueue = Promise.resolve();
    this._load();
  }

  _load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      this.storage = parsed.storage || {};
      this.writes = parsed.writes || {};
    } catch (err) {
      if (err?.code === 'ENOENT') return;
      const corruptPath = `${this.filePath}.corrupt-${Date.now()}`;
      try {
        fs.renameSync(this.filePath, corruptPath);
        logger.warn('agent.checkpointer', 'Renamed unreadable checkpoint file', {
          filePath: this.filePath,
          corruptPath,
          error: err.message,
        });
      } catch {
        logger.warn('agent.checkpointer', 'Ignoring unreadable checkpoint file', {
          filePath: this.filePath,
          error: err.message,
        });
      }
      this.storage = {};
      this.writes = {};
    }
  }

  async _flush() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const payload = JSON.stringify({
      version: 1,
      storage: this.storage,
      writes: this.writes,
      updatedAt: new Date().toISOString(),
    });
    await fs.promises.writeFile(tmpPath, payload, 'utf8');
    await fs.promises.rename(tmpPath, this.filePath);
  }

  _queueFlush() {
    this._flushQueue = this._flushQueue.catch(() => {}).then(() => this._flush());
    return this._flushQueue;
  }

  async put(config, checkpoint, metadata) {
    const nextConfig = await super.put(config, checkpoint, metadata);
    await this._queueFlush();
    return nextConfig;
  }

  async putWrites(config, writes, taskId) {
    await super.putWrites(config, writes, taskId);
    await this._queueFlush();
  }

  async deleteThread(threadId) {
    await super.deleteThread(threadId);
    await this._queueFlush();
  }
}

function createCheckpointer() {
  const config = readConfig();
  const checkpointerConfig = config.checkpointer || { type: 'memory' };
  const type = checkpointerConfig.type || 'memory';

  if (type === 'memory') {
    logger.info('agent.checkpointer', 'Using in-memory LangGraph checkpointer');
    return new MemorySaver();
  }

  if (type === 'sqlite') {
    const filePath = resolveDataPath(checkpointerConfig.connection_string || 'checkpoints.db');
    if (filePath === ':memory:') {
      logger.info('agent.checkpointer', 'Using SQLite-compatible in-memory LangGraph checkpointer');
      return new MemorySaver();
    }

    try {
      const saver = new SqliteCheckpointSaver(filePath);
      logger.info('agent.checkpointer', 'Using SQLite LangGraph checkpointer', { filePath });
      return saver;
    } catch (err) {
      const fallbackPath = `${filePath}.json`;
      logger.warn('agent.checkpointer', 'Falling back to JSON checkpoint persistence', {
        filePath,
        fallbackPath,
        error: err.message,
      });
      return new JsonCheckpointSaver(fallbackPath);
    }
  }

  if (type === 'postgres') {
    throw new Error('Postgres checkpointer is configured, but the Electron JS runtime only supports memory and sqlite backends.');
  }

  throw new Error(`Unknown checkpointer type: ${type}`);
}

function getCheckpointer() {
  if (!singleton) singleton = createCheckpointer();
  return singleton;
}

function resetCheckpointer() {
  if (singleton && typeof singleton.close === 'function') singleton.close();
  singleton = null;
}

function getCheckpointerStatus() {
  const config = readConfig();
  const checkpointerConfig = config.checkpointer || { type: 'memory' };
  const type = checkpointerConfig.type || 'memory';
  return {
    type,
    path: type === 'sqlite'
      ? resolveDataPath(checkpointerConfig.connection_string || 'checkpoints.db')
      : null,
    durable: type === 'sqlite' && checkpointerConfig.connection_string !== ':memory:',
  };
}

module.exports = {
  SqliteCheckpointSaver,
  JsonCheckpointSaver,
  getCheckpointer,
  resetCheckpointer,
  getCheckpointerStatus,
  resolveDataPath,
};
