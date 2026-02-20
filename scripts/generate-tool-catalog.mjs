import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TOOLS_PATH = path.join(ROOT, 'src/lib/tools.js');
const OUTPUT_PATH = path.join(ROOT, 'docs/AI_TOOL_CATALOG.md');

const CATEGORY_ORDER = [
  'Read-Only / Analysis',
  'Filesystem Agent',
  'Terminal',
  'Canvas',
  'Memory',
  'Tasks / Calendar / Notes',
  'Panel/Layout Controls',
  'Timer',
  'Uncategorized',
];

const CATEGORY_MAP = {
  getScheduleSummary: 'Read-Only / Analysis',
  searchNotes: 'Read-Only / Analysis',
  findScheduleConflicts: 'Read-Only / Analysis',
  lookupOnline: 'Read-Only / Analysis',

  agentReadFile: 'Filesystem Agent',
  agentWriteFile: 'Filesystem Agent',
  agentDeleteFile: 'Filesystem Agent',
  agentMoveFile: 'Filesystem Agent',
  agentCopyFile: 'Filesystem Agent',
  agentListDir: 'Filesystem Agent',

  runCommand: 'Terminal',

  openCanvas: 'Canvas',
  updateCanvas: 'Canvas',
  listCanvases: 'Canvas',
  loadCanvas: 'Canvas',

  updateAgentMemory: 'Memory',

  completeTask: 'Tasks / Calendar / Notes',
  createThoughtStream: 'Tasks / Calendar / Notes',
  createPrioritizedTaskList: 'Tasks / Calendar / Notes',
  createSingleCalendarEvent: 'Tasks / Calendar / Notes',
  updateCalendarEvent: 'Tasks / Calendar / Notes',
  createRecurringCalendarEvent: 'Tasks / Calendar / Notes',
  createNotePanel: 'Tasks / Calendar / Notes',
  updateNoteContent: 'Tasks / Calendar / Notes',
  setPanelColor: 'Tasks / Calendar / Notes',
  setPanelTitle: 'Tasks / Calendar / Notes',
  deletePanel: 'Tasks / Calendar / Notes',
  duplicatePanel: 'Tasks / Calendar / Notes',

  movePanel: 'Panel/Layout Controls',
  resizePanel: 'Panel/Layout Controls',
  openPanel: 'Panel/Layout Controls',
  minimizePanel: 'Panel/Layout Controls',
  restorePanel: 'Panel/Layout Controls',
  tilePanels: 'Panel/Layout Controls',
  groupPanelsByType: 'Panel/Layout Controls',
  stackPanelsVertically: 'Panel/Layout Controls',
  focusMode: 'Panel/Layout Controls',
  minimizeAllPanels: 'Panel/Layout Controls',
  closeAllPanels: 'Panel/Layout Controls',

  startTimer: 'Timer',
};

function parseTools(content) {
  const headerRegex = /^  ([A-Za-z][A-Za-z0-9_]*): \{$/gm;
  const matches = [...content.matchAll(headerRegex)];
  const tools = [];

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const next = matches[i + 1];
    const start = curr.index;
    const end = next ? next.index : content.length;
    const block = content.slice(start, end);

    const name = curr[1];
    const requiresMatch = block.match(/requiresConfirmation:\s*(true|false),/);
    const descriptionMatch = block.match(/description:\s*'([^']*)',/);

    const requiresConfirmation = requiresMatch ? requiresMatch[1] === 'true' : null;
    const description = descriptionMatch ? descriptionMatch[1] : '';

    tools.push({
      name,
      requiresConfirmation,
      description,
      status: inferStatus(block),
      category: CATEGORY_MAP[name] || 'Uncategorized',
    });
  }

  return tools;
}

function inferStatus(block) {
  const lc = block.toLowerCase();
  if (lc.includes('not yet configured') || lc.includes('not yet available')) {
    return 'Stub';
  }
  if (
    lc.includes('not supported') ||
    lc.includes('managed automatically') ||
    lc.includes('not directly supported')
  ) {
    return 'Limited';
  }
  return 'Implemented';
}

function statusCounts(tools) {
  const counts = { Implemented: 0, Limited: 0, Stub: 0 };
  for (const t of tools) {
    if (counts[t.status] !== undefined) counts[t.status] += 1;
  }
  return counts;
}

function renderTableRows(tools) {
  return tools
    .map((t) => {
      const confirm =
        t.name === 'runCommand'
          ? 'Yes*'
          : t.requiresConfirmation === true
            ? 'Yes'
            : t.requiresConfirmation === false
              ? 'No'
              : '-';
      return `| \`${t.name}\` | ${confirm} | ${t.description || '-'} | ${t.status} |`;
    })
    .join('\n');
}

function renderMarkdown(tools) {
  const counts = statusCounts(tools);
  const now = new Date().toISOString();
  const grouped = new Map();
  for (const category of CATEGORY_ORDER) grouped.set(category, []);
  for (const tool of tools) grouped.get(tool.category).push(tool);

  const sections = CATEGORY_ORDER
    .map((category) => {
      const items = grouped.get(category) || [];
      if (items.length === 0) return '';
      return [
        `## ${category}`,
        '| Tool | Confirm | Purpose | Status |',
        '|---|---|---|---|',
        renderTableRows(items),
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n\n');

  return [
    '# AI Tool Catalog',
    '',
    `Generated: \`${now}\``,
    'Source: `src/lib/tools.js`',
    '',
    '## Summary',
    `- Total tools: **${tools.length}**`,
    `- Implemented: **${counts.Implemented}**`,
    `- Limited: **${counts.Limited}**`,
    `- Stub: **${counts.Stub}**`,
    '',
    sections,
    '',
    '## Notes',
    '- `runCommand` confirmation is dynamic: terminal mode can change behavior (`ask-always`, `ask-destructive`, `no-asking`) in `src/context/ToolContext.jsx`.',
    '',
    '## Regenerate',
    '- Run: `npm run tools:catalog`',
    '',
  ].join('\n');
}

function main() {
  const toolsSource = fs.readFileSync(TOOLS_PATH, 'utf8');
  const tools = parseTools(toolsSource);
  const markdown = renderMarkdown(tools);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${tools.length} tools)`);
}

main();
