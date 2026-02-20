const agentFs = require('./agent-fs');
const agentTerminal = require('./agent-terminal');

async function executeAgentJob(job = {}) {
  const tool = job.tool;
  const params = job.params || {};
  const opId = job.opId || null;

  switch (tool) {
    case 'agentWriteFile':
      return agentFs.agentWriteFile(params.path, params.content, opId);
    case 'agentDeleteFile':
      return agentFs.agentDeleteFile(params.path, opId);
    case 'agentMoveFile':
      return agentFs.agentMoveFile(params.source, params.destination, opId);
    case 'agentCopyFile':
      return agentFs.agentCopyFile(params.source, params.destination, opId);
    case 'runCommand':
      return agentTerminal.runCommand(params.command, params.cwd, opId);
    default:
      return {
        error: `Unsupported job tool: ${tool || 'unknown'}`,
      };
  }
}

module.exports = {
  executeAgentJob,
};
