// Destructive command verbs
const DESTRUCTIVE_VERBS = [
  'rm', 'rmdir', 'mv', 'chmod', 'chown', 'chgrp',
  'kill', 'killall', 'pkill',
  'mkfs', 'fdisk', 'dd',
  'truncate', 'shred',
  'launchctl', 'systemctl',
  'defaults', 'xattr',
];

// Non-destructive verbs
const SAFE_VERBS = [
  'ls', 'cat', 'head', 'tail', 'less', 'more',
  'echo', 'printf', 'pwd', 'whoami', 'which', 'where',
  'find', 'grep', 'rg', 'ag', 'ack',
  'wc', 'sort', 'uniq', 'diff', 'comm',
  'file', 'stat', 'du', 'df',
  'date', 'cal', 'uptime', 'uname',
  'env', 'printenv', 'set',
  'cp', 'mkdir', 'touch',
  'curl', 'wget', 'ping', 'dig', 'nslookup', 'host',
  'git', 'node', 'npm', 'npx', 'python', 'python3', 'pip',
  'brew', 'open',
  'top', 'ps', 'htop', 'lsof', 'netstat',
];

export function isDestructiveCommand(command) {
  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  let verb = parts[0];

  // Handle sudo prefix
  if (verb === 'sudo' && parts.length > 1) {
    verb = parts[1];
  }

  // Handle path-qualified commands like /usr/bin/rm
  verb = verb.split('/').pop();

  // Check if explicitly safe
  if (SAFE_VERBS.includes(verb)) return false;

  // Check if explicitly destructive
  if (DESTRUCTIVE_VERBS.includes(verb)) return true;

  // Pipe chains: check each command in the pipe
  if (trimmed.includes('|') || trimmed.includes('&&') || trimmed.includes(';')) {
    const subCommands = trimmed.split(/[|;&]+/).map(s => s.trim()).filter(Boolean);
    return subCommands.some(sub => isDestructiveCommand(sub));
  }

  // Redirect operators that write to files
  if (trimmed.includes('>')) return true;

  // Unknown commands default to destructive (safer)
  return true;
}

export function isPathBlacklisted(filePath, blacklist) {
  if (!blacklist) return false;
  const { paths = [], filetypes = [] } = blacklist;

  for (const blocked of paths) {
    if (filePath === blocked || filePath.startsWith(blocked + '/')) {
      return true;
    }
  }

  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext && filetypes.includes('.' + ext)) {
    return true;
  }

  return false;
}
