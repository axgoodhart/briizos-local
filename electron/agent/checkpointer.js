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
const DEFAULT_DEER_HOME = process.env.DEER_FLOW_HOME
  ? path.resolve(process.env.DEER_FLOW_HOME)
  : path.join(AGENT_DIR, '.deer-flow');

let singleton = null;
let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
  resetCheckpointer();
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
  return [row.task_id, row.channel, row.value_json];
}

function serializedJsonText(value) {
  return typeof value === 'string' ? value : Buffer.from(value).toString('utf8');
}

function serializedJsonBytes(value) {
  return Buffer.from(String(value), 'utf8');
}

class SqliteCheckpointSaver extends BaseCheckpointSaver {
  constructor(service, serde) {
    super(serde);
    if (!service) throw new Error('LocalDataService is required for checkpoint persistence');
    this.service = service;
  }

  _getCheckpointRow(threadId, checkpointNamespace, checkpointId) {
    const row = this.service.getCheckpoint(threadId, checkpointNamespace, checkpointId);
    return row && { ...row, checkpoint: row.checkpoint_json, metadata: row.metadata_json };
  }

  _getLatestCheckpointRow(threadId, checkpointNamespace) {
    const row = this.service.getCheckpoint(threadId, checkpointNamespace);
    return row && { ...row, checkpoint: row.checkpoint_json, metadata: row.metadata_json };
  }

  _getWriteRows(threadId, checkpointNamespace, checkpointId) {
    return this.service.listCheckpointWrites(threadId, checkpointNamespace, checkpointId);
  }

  async _pendingWrites(threadId, checkpointNamespace, checkpointId) {
    const rows = this._getWriteRows(threadId, checkpointNamespace, checkpointId);
    return Promise.all(rows.map(async (row) => [
      row.task_id,
      row.channel,
      await this.serde.loadsTyped('json', serializedJsonBytes(row.value_json)),
    ]));
  }

  async _migratePendingSends(mutableCheckpoint, threadId, checkpointNamespace, parentCheckpointId) {
    const rows = this._getWriteRows(threadId, checkpointNamespace, parentCheckpointId);
    const pendingSends = await Promise.all(
      rows
        .map(rowToWrite)
        .filter(([, channel]) => channel === TASKS)
        .map(async ([, , value]) => this.serde.loadsTyped('json', serializedJsonBytes(value)))
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
    const checkpoint = await this.serde.loadsTyped('json', serializedJsonBytes(row.checkpoint));
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
      metadata: await this.serde.loadsTyped('json', serializedJsonBytes(row.metadata)),
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
      : this.service.listCheckpointThreadIds();
    const configuredNamespace = config.configurable?.checkpoint_ns;
    const configuredCheckpointId = config.configurable?.checkpoint_id;

    for (const threadId of threadIds) {
      const namespaces = configuredNamespace !== undefined
        ? [configuredNamespace]
        : this.service.listCheckpointNamespaces(threadId);

      for (const checkpointNamespace of namespaces) {
        const rows = this.service.listCheckpoints(threadId, checkpointNamespace).map((row) => ({
          ...row,
          checkpoint: row.checkpoint_json,
          metadata: row.metadata_json,
        }));

        for (const row of rows) {
          if (configuredCheckpointId && row.checkpoint_id !== configuredCheckpointId) continue;
          if (before?.configurable?.checkpoint_id && row.checkpoint_id >= before.configurable.checkpoint_id) continue;

          const metadata = await this.serde.loadsTyped('json', serializedJsonBytes(row.metadata));
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

    this.service.putCheckpoint({
      threadId,
      checkpointNamespace,
      checkpointId: preparedCheckpoint.id,
      parentCheckpointId: config.configurable?.checkpoint_id ?? null,
      checkpointJson: serializedJsonText(serializedCheckpoint),
      metadataJson: serializedJsonText(serializedMetadata),
    });

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

    const preparedWrites = [];
    for (let idx = 0; idx < writes.length; idx += 1) {
      const [channel, value] = writes[idx];
      const [, serializedValue] = await this.serde.dumpsTyped(value);
      const writeIndex = WRITES_IDX_MAP[channel] ?? idx;
      preparedWrites.push({
        taskId,
        index: writeIndex,
        channel,
        valueJson: serializedJsonText(serializedValue),
        skipExisting: writeIndex >= 0,
      });
    }
    this.service.putCheckpointWrites({ threadId, checkpointNamespace, checkpointId, writes: preparedWrites });
  }

  async deleteThread(threadId) {
    this.service.deleteThreadCheckpoints(threadId);
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
  if (!localDataService) throw new Error('LocalDataService has not been attached to the agent checkpointer');
  logger.info('agent.checkpointer', 'Using briizos.db LangGraph checkpointer');
  return new SqliteCheckpointSaver(localDataService);
}

function getCheckpointer() {
  if (!singleton) singleton = createCheckpointer();
  return singleton;
}

function resetCheckpointer() {
  singleton = null;
}

function getCheckpointerStatus() {
  return {
    type: 'local-data',
    path: localDataService?.databasePath || null,
    durable: !!localDataService,
  };
}

module.exports = {
  SqliteCheckpointSaver,
  JsonCheckpointSaver,
  getCheckpointer,
  resetCheckpointer,
  getCheckpointerStatus,
  setLocalDataService,
  resolveDataPath,
};
