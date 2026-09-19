// Reuse the app's LangGraph serializer against journal-owned tables. The general
// chat checkpoint service creates chat records; a journal worker must not do that.
class ExecCheckpointService {
  constructor(db, logger) { this.db = db; this.logger = logger; }
  getCheckpoint(threadId, namespace, checkpointId) {
    return checkpointId
      ? this.db.prepare('SELECT * FROM exec_checkpoints WHERE thread_id=? AND checkpoint_ns=? AND checkpoint_id=?').get(threadId, namespace, checkpointId)
      : this.db.prepare('SELECT * FROM exec_checkpoints WHERE thread_id=? AND checkpoint_ns=? ORDER BY checkpoint_id DESC LIMIT 1').get(threadId, namespace);
  }
  listCheckpointThreadIds() { return this.db.prepare('SELECT DISTINCT thread_id FROM exec_checkpoints').all().map((r) => r.thread_id); }
  listCheckpointNamespaces(threadId) { return this.db.prepare('SELECT DISTINCT checkpoint_ns FROM exec_checkpoints WHERE thread_id=?').all(threadId).map((r) => r.checkpoint_ns); }
  listCheckpoints(threadId, namespace) { return this.db.prepare('SELECT * FROM exec_checkpoints WHERE thread_id=? AND checkpoint_ns=? ORDER BY checkpoint_id DESC').all(threadId, namespace); }
  listCheckpointWrites(threadId, namespace, checkpointId) { return this.db.prepare('SELECT * FROM exec_checkpoint_writes WHERE thread_id=? AND checkpoint_ns=? AND checkpoint_id=? ORDER BY task_id,idx').all(threadId, namespace, checkpointId); }
  putCheckpoint(input) {
    this.db.prepare(`INSERT INTO exec_checkpoints VALUES (?,?,?,?,?,?) ON CONFLICT(thread_id,checkpoint_ns,checkpoint_id)
      DO UPDATE SET checkpoint_json=excluded.checkpoint_json,metadata_json=excluded.metadata_json,parent_checkpoint_id=excluded.parent_checkpoint_id`)
      .run(input.threadId, input.checkpointNamespace, input.checkpointId, input.parentCheckpointId, input.checkpointJson, input.metadataJson);
    this.logger.info('journal.execubriiz', 'Journal worker checkpoint saved', { jobId: input.threadId });
  }
  putCheckpointWrites(input) {
    this.db.transaction(() => {
      for (const write of input.writes) this.db.prepare(`INSERT ${write.skipExisting ? 'OR IGNORE' : 'OR REPLACE'} INTO exec_checkpoint_writes VALUES (?,?,?,?,?,?,?)`)
        .run(input.threadId, input.checkpointNamespace, input.checkpointId, write.taskId, write.index, write.channel, write.valueJson);
    })();
    this.logger.info('journal.execubriiz', 'Journal worker checkpoint updates saved', { jobId: input.threadId });
  }
  deleteThreadCheckpoints(threadId) {
    this.db.prepare('DELETE FROM exec_checkpoints WHERE thread_id=?').run(threadId);
    this.logger.info('journal.execubriiz', 'Finished journal worker context released', { jobId: threadId });
  }
}
module.exports = { ExecCheckpointService };
