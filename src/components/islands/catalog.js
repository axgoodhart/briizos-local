// Island catalog: card types, glyphs, accents, stages, questions and built-in templates.
// Spec: docs/island-desks/DECISIONS.md

export const GLYPH = {
  plus: '􀅼', minus: '􀅽', gear: '􀣋', close: '􀆄', sidebar: '􀏚', stack: '􀐞', map: '􀙊',
  search: '􀊫', journal: '􀉚', refresh: '􀅈', trash: '􀈑', attach: '􀉢', text: '􀅒', pencil: '􀒋',
  laptop: '􀟛', chevron: '􀆊', chevronLeft: '􀆉', chevronDown: '􀆈', share: '􀈂', eye: '􀋭', eyeClosed: '􂽁',
  archive: '􀈭', link: '􀉣', dashed: '􀓔', calendar: '􀉉', clock: '􀐫', undo: '􀱍', check: '􀆅',
  circle: '􀀀', compose: '􀈎', more: '􀍠', play: '􀊃', stop: '􀛶', open: '􀄯', pointer: '􀄮',
  warning: '􀅎', ladybug: '􀯔', expand: '􀅊', collapse: '􀅋', folder: '􀈕', file: '􀈷', tag: '􀋡', copy: '􀉁',
  desk: '􀇴', hammer: '􀙄', pin: '􀎦', bolt: '􀋥',
};

// ==== CARD TYPES ====
export const CARD_TYPES = [
  { kind: 'monetize', label: 'Monetize', glyph: '􂮇', w: 320, h: 300 },
  { kind: 'terminal', label: 'Terminal', glyph: '􀩼', w: 380, h: 420 },
  { kind: 'webview', label: 'Webview', glyph: '􀆪', w: 640, h: 420 },
  { kind: 'thoughts', label: 'Thoughts/Discussions', glyph: '􀒤', w: 320, h: 420 },
  { kind: 'media', label: 'Media', glyph: '􀏫', w: 380, h: 320 },
  { kind: 'agent', label: 'Agent', glyph: '􀆿', w: 320, h: 340 },
  { kind: 'docs', label: 'Docs/Code', glyph: '􀙚', w: 340, h: 420 },
  { kind: 'goals', label: 'Goals/Todo', glyph: '􀼏', w: 300, h: 360 },
  { kind: 'planning', label: 'Visual Planning', glyph: '􀐕', w: 500, h: 360 },
  { kind: 'ship', label: 'Ship/Finish', glyph: '􀐚', w: 300, h: 360 },
];
export const CARD_TYPE = Object.fromEntries(CARD_TYPES.map((type) => [type.kind, type]));

// ==== SIZES ====
export const GRID = 8;                 // snap step inside islands
export const CARD_MIN = { w: 200, h: 140 };
export const ISLAND_MIN = { w: 520, h: 360 };
export const ISLAND_HEAD = 104;        // tab + name band
export const ISLAND_RAIL = 84;         // node rail band
export const ISLAND_PAD = 24;
export const LOD_SUMMARY = 0.42;       // below this zoom, islands show their summary

export const ACCENTS = [
  { hex: '#16C784', rgb: '22,199,132' },
  { hex: '#3D7BE8', rgb: '61,123,232' },
  { hex: '#A2B84F', rgb: '162,184,79' },
  { hex: '#8B7AD9', rgb: '139,122,217' },
  { hex: '#E0A352', rgb: '224,163,82' },
  { hex: '#E0479E', rgb: '224,71,158' },
  { hex: '#2E9E8F', rgb: '46,158,143' },
  { hex: '#D4939F', rgb: '212,147,159' },
];

export const DEFAULT_STAGES = ['Start', 'Make', 'Refine', 'Finish'];

export const PROJECT_QUESTIONS = ['What is it?', 'What makes it unique?', '3 Best Features'];

// ==== ISLAND VIEWS (what a desk shows of each island) ====
export const ISLAND_VIEWS = [
  { id: 'full', label: 'Full view' },
  { id: 'main', label: 'Main view' },
  { id: 'progress', label: 'Progress', kinds: ['goals', 'ship', 'agent', 'monetize'] },
];

// ==== DESK RULES ====
export const DESK_RULES = [
  { type: 'manual', label: 'Islands I choose' },
  { type: 'tag', label: 'Islands tagged', input: 'tag' },
  { type: 'text', label: 'Islands mentioning', input: 'text' },
  { type: 'startsWith', label: 'Names starting with', input: 'letter' },
  { type: 'activeWithin', label: 'Worked on in the last', input: 'days' },
  { type: 'deadlineWithin', label: 'Due within', input: 'days' },
  { type: 'hasAgents', label: 'Islands with agent activity' },
];

const card = (kind, title, data = {}, size = {}) => ({ kind, title, data, ...size });

// ==== BUILT-IN ISLAND TEMPLATES ====
export const ISLAND_TEMPLATES = [
  {
    id: 'tpl-blank', name: 'Blank', builtIn: true, stages: DEFAULT_STAGES, cards: [],
  },
  {
    id: 'tpl-code-project', name: 'Code project', builtIn: true,
    stages: ['Spec', 'Prototype', 'Build', 'Test', 'Ship'],
    cards: [
      card('terminal', 'Server', { command: 'npm run dev' }),
      card('webview', 'Running app', { url: 'http://localhost:5173' }, { main: true }),
      card('thoughts', 'Spec', {}),
      card('goals', 'Next up', { items: [] }),
    ],
  },
  {
    id: 'tpl-fiction-book', name: 'Fiction book', builtIn: true,
    stages: ['Outline', 'Draft', 'Revise', 'Polish', 'Release'],
    cards: [
      card('docs', 'Character notes', { newDoc: 'Characters.md', newDocBody: '# Characters\n\n' }),
      card('planning', 'Plot', { nodes: [
        { id: 'n1', x: 24, y: 40, w: 120, h: 44, text: 'Setup' },
        { id: 'n2', x: 184, y: 40, w: 120, h: 44, text: 'Turn' },
        { id: 'n3', x: 344, y: 40, w: 120, h: 44, text: 'Ending' },
      ], edges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }] }),
      card('media', 'Mood board', {}, { main: true }),
      card('thoughts', 'Ideas', {}),
    ],
  },
  {
    id: 'tpl-research', name: 'Research', builtIn: true,
    stages: ['Question', 'Survey', 'Sample', 'Analyze', 'Write'],
    cards: [
      card('thoughts', 'Question', { prompts: ['What am I trying to find out?', 'What would change my mind?'] }),
      card('docs', 'Sources', {}),
      card('goals', 'Field kit', { items: [] }),
      card('docs', 'Draft', { newDoc: 'Draft.md', newDocBody: '# Draft\n\n' }, { main: true }),
    ],
  },
  {
    id: 'tpl-music', name: 'Music piece', builtIn: true,
    stages: ['Sketch', 'Compose', 'Orchestrate', 'Engrave', 'Perform'],
    cards: [
      card('docs', 'Score files', {}, { main: true }),
      card('media', 'Recordings', {}),
      card('thoughts', 'Program notes', {}),
      card('goals', 'Before rehearsal', { items: [] }),
    ],
  },
  {
    id: 'tpl-product', name: 'Product to sell', builtIn: true,
    stages: ['Idea', 'Make', 'Price', 'Launch', 'Grow'],
    cards: [
      card('media', 'Product shots', {}, { main: true }),
      card('monetize', 'Pricing', { rows: [] }),
      card('ship', 'Launch', {}),
      card('thoughts', 'Pitch', {}),
    ],
  },
];

// ==== BUILT-IN CARD TEMPLATES ====
export const CARD_TEMPLATES = [
  {
    id: 'ctpl-explain-mom', name: 'Explain this to my mom', builtIn: true, kind: 'thoughts',
    title: 'Explain it simply',
    data: { prompts: ['What is it, in one sentence?', 'Who is it for?', 'Why would they care?', 'What does it look like when it works?'] },
  },
  {
    id: 'ctpl-release-checklist', name: 'Release checklist', builtIn: true, kind: 'ship',
    title: 'Release',
    data: { steps: [
      { id: 's1', text: 'Final pass on the work', done: false },
      { id: 's2', text: 'Write the announcement', done: false },
      { id: 's3', text: 'Publish', done: false },
      { id: 's4', text: 'Tell the people who helped', done: false },
    ] },
  },
  {
    id: 'ctpl-dev-server', name: 'Dev server', builtIn: true, kind: 'terminal',
    title: 'Server', data: { command: 'npm run dev' },
  },
  {
    id: 'ctpl-pricing', name: 'Pricing sheet', builtIn: true, kind: 'monetize',
    title: 'Pricing',
    data: { rows: [
      { id: 'r1', label: 'Price per unit', amount: 0, kind: 'income' },
      { id: 'r2', label: 'Cost per unit', amount: 0, kind: 'cost' },
    ] },
  },
];

export const DEFAULT_SHIP_STEPS = [
  { id: 's1', text: 'It works end to end', done: false },
  { id: 's2', text: 'Someone else has tried it', done: false },
  { id: 's3', text: 'It is published', done: false },
];

export const MEDIA_TYPES = new Set(['image', 'video', 'audio']);

export function cardType(kind) {
  return CARD_TYPE[kind] || { kind, label: 'Card', glyph: GLYPH.file, w: 320, h: 300 };
}
