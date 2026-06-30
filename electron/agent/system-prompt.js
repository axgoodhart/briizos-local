/**
 * DeerFlow prompt/template port.
 *
 * Source of truth:
 *   - agent/src/agents/lead_agent/prompt.py
 *   - agent/src/config/agents_config.py
 *   - agent/src/skills/loader.py
 *   - agent/src/agents/memory/prompt.py
 *
 * This file owns the same dynamic sections as Python DeerFlow: agent soul,
 * memory injection, enabled skills, subagent instructions, and current date.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const AGENT_DIR = path.resolve(__dirname, '../../agent');
const CONFIG_PATH = path.join(AGENT_DIR, 'config.yaml');
const DEFAULT_DEER_HOME = process.env.DEER_FLOW_HOME
  ? path.resolve(process.env.DEER_FLOW_HOME)
  : path.join(AGENT_DIR, '.deer-flow');
let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

function readYaml(filePath) {
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function getConfig() {
  return readYaml(CONFIG_PATH);
}

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${y}-${m}-${day}, ${weekday}`;
}

function resolveSkillsRoot(config = getConfig()) {
  const rawPath = config?.skills?.path || './skills';
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(AGENT_DIR, rawPath);
}

function getContainerBasePath(config = getConfig()) {
  return config?.skills?.container_path || '/mnt/skills';
}

function parseSkillFile(skillFile, category, relativePath) {
  try {
    const content = fs.readFileSync(skillFile, 'utf8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) return null;

    const metadata = {};
    for (const rawLine of match[1].split('\n')) {
      const line = rawLine.trim();
      if (!line || !line.includes(':')) continue;
      const idx = line.indexOf(':');
      metadata[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }

    if (!metadata.name || !metadata.description) return null;
    return {
      name: metadata.name,
      description: metadata.description,
      category,
      relativePath: relativePath.split(path.sep).join('/'),
    };
  } catch {
    return null;
  }
}

function walkSkills(categoryRoot, category) {
  if (!fs.existsSync(categoryRoot)) return [];
  const out = [];
  const stack = [''];
  while (stack.length > 0) {
    const rel = stack.pop();
    const dir = path.join(categoryRoot, rel);
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (entries.some((entry) => entry.isFile() && entry.name === 'SKILL.md')) {
      const skill = parseSkillFile(path.join(dir, 'SKILL.md'), category, rel || '.');
      if (skill) out.push(skill);
    }

    for (const entry of entries) {
      if (entry.isDirectory()) stack.push(path.join(rel, entry.name));
    }
  }
  return out;
}

function isSkillEnabled(skill, extensions = {}) {
  const entry = extensions?.skills?.[skill.name];
  return entry ? entry.enabled !== false : true;
}

function loadSkills({ enabledOnly = false } = {}) {
  const config = getConfig();
  const root = resolveSkillsRoot(config);
  const skills = [
    ...walkSkills(path.join(root, 'public'), 'public'),
    ...walkSkills(path.join(root, 'custom'), 'custom'),
  ];
  const localSkills = localDataService?.getSetting?.('skills_config')?.value || {};
  const extensions = { skills: Object.fromEntries(
    Object.entries(localSkills).map(([name, enabled]) => [name, { enabled }]),
  ) };
  return skills
    .map((skill) => ({ ...skill, enabled: isSkillEnabled(skill, extensions) }))
    .filter((skill) => !enabledOnly || skill.enabled)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function skillContainerPath(skill, containerBasePath) {
  const base = `${containerBasePath}/${skill.category}`;
  return skill.relativePath && skill.relativePath !== '.'
    ? `${base}/${skill.relativePath}/SKILL.md`
    : `${base}/SKILL.md`;
}

function getSkillsPromptSection(availableSkills = null) {
  const config = getConfig();
  const containerBasePath = getContainerBasePath(config);
  let skills = loadSkills({ enabledOnly: true });
  if (availableSkills instanceof Set) {
    skills = skills.filter((skill) => availableSkills.has(skill.name));
  } else if (Array.isArray(availableSkills)) {
    const allowed = new Set(availableSkills);
    skills = skills.filter((skill) => allowed.has(skill.name));
  }
  if (skills.length === 0) return '';

  const skillItems = skills.map((skill) => (
    `    <skill>\n` +
    `        <name>${skill.name}</name>\n` +
    `        <description>${skill.description}</description>\n` +
    `        <location>${skillContainerPath(skill, containerBasePath)}</location>\n` +
    `    </skill>`
  )).join('\n');

  return `<skill_system>
You have access to skills that provide optimized workflows for specific tasks. Each skill contains best practices, frameworks, and references to additional resources.

**Progressive Loading Pattern:**
1. When a user query matches a skill's use case, immediately call \`read_file\` on the skill's main file using the path attribute provided in the skill tag below
2. Read and understand the skill's workflow and instructions
3. The skill file contains references to external resources under the same folder
4. Load referenced resources only when needed during execution
5. Follow the skill's instructions precisely

**Skills are located at:** ${containerBasePath}

<available_skills>
${skillItems}
</available_skills>

</skill_system>`;
}

function getAgentDir(agentName) {
  return agentName
    ? path.join(DEFAULT_DEER_HOME, 'agents', String(agentName).toLowerCase())
    : DEFAULT_DEER_HOME;
}

function getAgentSoul(agentName = null) {
  const soulPath = path.join(getAgentDir(agentName), 'SOUL.md');
  try {
    const soul = fs.readFileSync(soulPath, 'utf8').trim();
    return soul ? `<soul>\n${soul}\n</soul>\n` : '';
  } catch {
    return '';
  }
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function formatMemoryForInjection(memoryData, maxTokens = 2000) {
  if (!memoryData || typeof memoryData !== 'object') return '';
  const sections = [];

  const userData = memoryData.user || {};
  const userSections = [];
  if (userData.workContext?.summary) userSections.push(`Work: ${userData.workContext.summary}`);
  if (userData.personalContext?.summary) userSections.push(`Personal: ${userData.personalContext.summary}`);
  if (userData.topOfMind?.summary) userSections.push(`Current Focus: ${userData.topOfMind.summary}`);
  if (userSections.length > 0) {
    sections.push(`User Context:\n${userSections.map((s) => `- ${s}`).join('\n')}`);
  }

  const historyData = memoryData.history || {};
  const historySections = [];
  if (historyData.recentMonths?.summary) historySections.push(`Recent: ${historyData.recentMonths.summary}`);
  if (historyData.earlierContext?.summary) historySections.push(`Earlier: ${historyData.earlierContext.summary}`);
  if (historySections.length > 0) {
    sections.push(`History:\n${historySections.map((s) => `- ${s}`).join('\n')}`);
  }

  if (memoryData.agentContext) {
    sections.push(`Additional Context:\n${memoryData.agentContext}`);
  }

  const facts = Array.isArray(memoryData.facts) ? memoryData.facts.slice(0, 30) : [];
  if (facts.length > 0) {
    sections.push(`Remembered Facts:\n${facts.map((fact) => `- ${fact.content}`).join('\n')}`);
  }

  if (sections.length === 0) return '';
  let result = sections.join('\n\n');
  const tokenCount = estimateTokens(result);
  if (tokenCount > maxTokens) {
    const targetChars = Math.floor(maxTokens * 4 * 0.95);
    result = `${result.slice(0, targetChars)}\n...`;
  }
  return result;
}

function getMemoryContext(agentName = null, injectMemory = true) {
  if (!injectMemory) return '';
  const config = getConfig();
  const memoryConfig = config.memory || {};
  if (memoryConfig.enabled === false || memoryConfig.injection_enabled === false) return '';
  try {
    const memoryData = localDataService?.getMemoryProfile?.(agentName);
    const memoryContent = formatMemoryForInjection(memoryData, memoryConfig.max_injection_tokens || 2000);
    return memoryContent.trim() ? `<memory>\n${memoryContent}\n</memory>\n` : '';
  } catch {
    return '';
  }
}

function buildSubagentSection(maxConcurrent) {
  const n = maxConcurrent;
  return `<subagent_system>
**SUBAGENT MODE ACTIVE - DECOMPOSE, DELEGATE, SYNTHESIZE**

You are running with subagent capabilities enabled. Your role is to be a task orchestrator:
1. DECOMPOSE: Break complex tasks into parallel sub-tasks
2. DELEGATE: Launch multiple subagents simultaneously using parallel \`task\` calls
3. SYNTHESIZE: Collect and integrate results into a coherent answer

**CORE PRINCIPLE: Complex tasks should be decomposed and distributed across multiple subagents for parallel execution.**

**HARD CONCURRENCY LIMIT: MAXIMUM ${n} \`task\` CALLS PER RESPONSE. THIS IS NOT OPTIONAL.**
- Each response, you may include at most ${n} \`task\` tool calls. Any excess calls are discarded by the system.
- Before launching subagents, you MUST count your sub-tasks in your thinking.
- If count <= ${n}: launch all in this response.
- If count > ${n}: pick the ${n} most important/foundational sub-tasks for this turn and save the rest for the next turn.
- For >${n} sub-tasks, use sequential batches of ${n} across multiple turns, then synthesize all results.

**Available Subagents:**
- **general-purpose**: For non-trivial tasks: web research, code exploration, file operations, analysis, etc.
- **bash**: For command execution: git, build, test, deploy operations.

Use parallel subagents when a task has multiple independent dimensions, requires broad research, or benefits from isolated context.
Do NOT use subagents for simple single-step actions, immediate clarification, meta conversation, or sequential dependencies.

**Workflow:**
1. COUNT sub-tasks explicitly.
2. PLAN batches if count exceeds ${n}.
3. EXECUTE only the current batch.
4. REPEAT until all batches complete.
5. SYNTHESIZE all results.

The \`task\` tool runs subagents asynchronously in the background, backend polling waits for completion, and results return directly.
</subagent_system>`;
}

const SYSTEM_PROMPT_TEMPLATE = `<role>
You are {agent_name}, a personal AI assistant in briizOS.
</role>

{soul}
{memory_context}

<thinking_style>
- Think concisely and strategically about the user's request BEFORE taking action
- Break down the task: What is clear? What is ambiguous? What is missing?
- **PRIORITY CHECK: If anything is unclear, missing, or has multiple interpretations, you MUST ask for clarification FIRST - do NOT proceed with work**
{subagent_thinking}- Never write down your full final answer or report in thinking process, but only outline
- CRITICAL: After thinking, you MUST provide your actual response to the user. Thinking is for planning, the response is for delivery.
- Your response must contain the actual answer, not just a reference to what you thought about
</thinking_style>

<clarification_system>
**WORKFLOW PRIORITY: CLARIFY -> PLAN -> ACT**
1. **FIRST**: Analyze the request in your thinking - identify what's unclear, missing, or ambiguous
2. **SECOND**: If clarification is needed, call \`ask_clarification\` tool IMMEDIATELY - do NOT start working
3. **THIRD**: Only after all clarifications are resolved, proceed with planning and execution

**CRITICAL RULE: Clarification ALWAYS comes BEFORE action. Never start working and clarify mid-execution.**

**MANDATORY Clarification Scenarios - You MUST call ask_clarification BEFORE starting work when:**

1. **Missing Information** (\`missing_info\`): Required details not provided
2. **Ambiguous Requirements** (\`ambiguous_requirement\`): Multiple valid interpretations exist
3. **Approach Choices** (\`approach_choice\`): Several valid approaches exist
4. **Risky Operations** (\`risk_confirmation\`): Destructive actions need confirmation
5. **Suggestions** (\`suggestion\`): You have a recommendation but want approval

**STRICT ENFORCEMENT:**
- Do NOT start working and then ask for clarification mid-execution - clarify FIRST
- Do NOT skip clarification for efficiency - accuracy matters more than speed
- Do NOT make assumptions when information is missing - ALWAYS ask
- After calling ask_clarification, execution will be interrupted automatically
- Wait for user response - do NOT continue with assumptions
</clarification_system>

{skills_section}

{subagent_section}

<working_directory existed="true">
- User workspace: Available for temporary files and working data
- Output files: Final deliverables saved for user access

**File Management:**
- Use \`read_file\` tool to read files on the local filesystem
- Use \`write_file\` tool to create or modify files
- Use \`bash\` tool for command execution
</working_directory>

<response_style>
- Clear and Concise: Communicate directly without excessive formatting
- Personal and Helpful: You know the user personally and assist with their goals
- Action-Oriented: Focus on delivering results, not explaining processes
- Contextual: Reference prior conversations and known facts naturally
</response_style>

<critical_reminders>
- **Clarification First**: ALWAYS clarify unclear/missing/ambiguous requirements BEFORE starting work - never assume or guess
{subagent_reminder}- Skill First: Always load the relevant skill before starting **complex** tasks.
- Progressive Loading: Load resources incrementally as referenced in skills
- Clarity: Be direct and helpful, avoid unnecessary meta-commentary
- Multi-task: Better utilize parallel tool calling to call multiple tools at one time for better performance
- Language Consistency: Keep using the same language as user's
- Always Respond: Your thinking is internal. You MUST always provide a visible response to the user after thinking.
</critical_reminders>`;

/**
 * Build a system-prompt string from the runtime config.
 *
 * @param {object} opts
 * @param {boolean} opts.planMode            Plan-mode toggle.
 * @param {boolean} opts.subagentEnabled     Subagent dispatch toggle.
 * @param {string|null} opts.agentName       Custom-agent name override (future).
 * @param {boolean} opts.injectMemory        Whether to inject long-term memory facts.
 */
function applyPromptTemplate({
  planMode = false,
  subagentEnabled = false,
  maxConcurrentSubagents = 3,
  agentName = null,
  availableSkills = null,
  injectMemory = true,
} = {}) {
  const n = maxConcurrentSubagents || 3;
  const subagentSection = subagentEnabled ? buildSubagentSection(n) : '';
  const subagentReminder = subagentEnabled
    ? `- **Orchestrator Mode**: You are a task orchestrator - decompose complex tasks into parallel sub-tasks. **HARD LIMIT: max ${n} \`task\` calls per response.** If >${n} sub-tasks, split into sequential batches of <=${n}. Synthesize after ALL batches complete.\n`
    : '';
  const subagentThinking = subagentEnabled
    ? `- **DECOMPOSITION CHECK: Can this task be broken into 2+ parallel sub-tasks? If YES, COUNT them. If count > ${n}, you MUST plan batches of <=${n} and only launch the FIRST batch now. NEVER launch more than ${n} \`task\` calls in one response.**\n`
    : '';

  let prompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{agent_name}', agentName || 'briizOS')
    .replace('{soul}', getAgentSoul(agentName))
    .replace('{memory_context}', getMemoryContext(agentName, injectMemory))
    .replace('{skills_section}', getSkillsPromptSection(availableSkills))
    .replace('{subagent_section}', subagentSection)
    .replace('{subagent_reminder}', subagentReminder)
    .replace('{subagent_thinking}', subagentThinking);

  if (planMode) {
    prompt += '\n<plan_mode>Plan mode is active. Propose clear steps before executing them, then wait if the user asked only for a plan.</plan_mode>';
  }

  return `${prompt}\n<current_date>${todayLocal()}</current_date>`;
}

module.exports = {
  applyPromptTemplate,
  getSkillsPromptSection,
  loadSkills,
  getMemoryContext,
  formatMemoryForInjection,
  setLocalDataService,
};
