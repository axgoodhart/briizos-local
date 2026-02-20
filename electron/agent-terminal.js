const { spawn } = require('child_process');
const os = require('os');
const { getReceipt, recordReceipt } = require('./agent-op-receipts');

function runCommand(command, cwd, opId = null) {
  return new Promise((resolve) => {
    const replay = opId ? getReceipt(opId) : null;
    if (replay) {
      resolve({
        ...replay.result,
        idempotentReplay: true,
        opId,
      });
      return;
    }

    const workDir = cwd || os.homedir();
    let stdout = '';
    let stderr = '';

    const child = spawn('bash', ['-c', command], {
      cwd: workDir,
      env: { ...process.env, HOME: os.homedir() },
      timeout: 30000,
    });

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const maxLen = 50000;
      if (stdout.length > maxLen) stdout = stdout.slice(0, maxLen) + '\n... (truncated)';
      if (stderr.length > maxLen) stderr = stderr.slice(0, maxLen) + '\n... (truncated)';

      const result = {
        success: code === 0,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
        cwd: workDir,
      };
      if (opId) {
        recordReceipt(opId, result);
      }
      resolve(result);
    });

    child.on('error', (error) => {
      const result = {
        success: false,
        exitCode: -1,
        stdout: '',
        stderr: error.message,
        command,
        cwd: workDir,
      };
      if (opId) {
        recordReceipt(opId, result);
      }
      resolve(result);
    });
  });
}

module.exports = { runCommand };
