export const COMPONENT_IDS = Object.freeze([
  'Application', 'ActionDeck', 'Tasks', 'Sources', 'Notes', 'Calendar',
  'Organizer', 'Dashboard', 'Media', 'Login', 'Canvas', 'Briiztorm', 'Chat',
  'Journals', 'Notefalls', 'Forest',
]);

const COLOR_PROPERTIES = ['color', 'background', 'borderColor', 'boxShadow', 'opacity'];
const TYPE_PROPERTIES = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing'];
const SHAPE_PROPERTIES = ['borderWidth', 'borderStyle', 'borderRadius', 'cornerShape'];

export const TARGET_REGISTRY = Object.freeze({
  canvas: { label: 'Application canvas', properties: [...COLOR_PROPERTIES] },
  header: { label: 'Header', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'minHeight'] },
  wordmark: { label: 'Wordmark', properties: ['color', 'opacity', ...TYPE_PROPERTIES] },
  'control-dock': { label: 'Control dock', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES] },
  panel: { label: 'Panel shell', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
  body: { label: 'Panel body', properties: [...COLOR_PROPERTIES, ...TYPE_PROPERTIES, 'padding'] },
  footer: { label: 'Footer', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
  'resize-handle': { label: 'Resize handle', properties: ['color', 'background', 'opacity'] },
  'button-primary': { label: 'Primary button', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  'button-secondary': { label: 'Secondary button', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  'button-ghost': { label: 'Ghost button', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  'button-icon': { label: 'Icon button', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
  'button-destructive': { label: 'Destructive button', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  input: { label: 'Input', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  textarea: { label: 'Text area', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  tabs: { label: 'Tab rail', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
  tab: { label: 'Tab', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  badge: { label: 'Badge', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding'] },
  progress: { label: 'Progress element', properties: ['color', 'background', 'borderColor', 'borderRadius', 'opacity'] },
  modal: { label: 'Modal', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
  overlay: { label: 'Overlay', properties: ['background', 'opacity'] },
  'chat-canvas': { label: 'Chat canvas', properties: [...COLOR_PROPERTIES, ...TYPE_PROPERTIES, 'padding'] },
  message: { label: 'Chat message', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding'] },
  composer: { label: 'Chat composer', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES, 'padding', 'minHeight'] },
  'model-picker': { label: 'Model picker', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, ...TYPE_PROPERTIES] },
  card: { label: 'Card', properties: [...COLOR_PROPERTIES, ...SHAPE_PROPERTIES, 'padding'] },
});

export const TARGET_IDS = Object.freeze(Object.keys(TARGET_REGISTRY));

export const EDITABLE_PROPERTIES = Object.freeze([
  'color', 'background', 'borderColor', 'borderWidth', 'borderStyle',
  'borderRadius', 'cornerShape', 'boxShadow', 'opacity', 'fontFamily', 'fontSize',
  'fontWeight', 'letterSpacing', 'padding', 'minHeight',
]);

export const FONT_OPTIONS = Object.freeze([
  { label: 'Avenir Next', value: '"Avenir Next", Avenir, sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, sans-serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", sans-serif' },
  { label: 'Optima', value: 'Optima, Candara, sans-serif' },
  { label: 'Futura', value: 'Futura, "Trebuchet MS", sans-serif' },
  { label: 'Charter', value: 'Charter, "Bitstream Charter", serif' },
  { label: 'Baskerville', value: 'Baskerville, "Times New Roman", serif' },
]);

export const GLOBAL_TOKEN_GROUPS = Object.freeze([
  {
    id: 'surfaces', label: 'Surfaces', tokens: [
      { id: 'canvas', label: 'Canvas', type: 'color', variables: ['--layout-bg-primary', '--ui-body-bg', '--ui-app-bg'] },
      { id: 'recessed', label: 'Recessed', type: 'color', variables: ['--layout-bg-secondary', '--log-section-bg'] },
      { id: 'panel', label: 'Panel', type: 'color', variables: ['--layout-bg-panel'] },
      { id: 'elevated', label: 'Elevated', type: 'color', variables: ['--card-glass', '--ui-settings-input-bg'] },
      { id: 'overlay', label: 'Overlay', type: 'color', variables: ['--ui-modal-bg'] },
    ],
  },
  {
    id: 'text', label: 'Text', tokens: [
      { id: 'textStrong', label: 'Strong', type: 'color', variables: ['--palette-white'] },
      { id: 'textPrimary', label: 'Primary', type: 'color', variables: ['--palette-text-main', '--ui-text-primary', '--chat-input-text-color'] },
      { id: 'textSoft', label: 'Soft', type: 'color', variables: ['--palette-text-soft'] },
      { id: 'textMuted', label: 'Muted', type: 'color', variables: ['--palette-text-subtle'] },
      { id: 'textFaint', label: 'Faint', type: 'color', variables: ['--palette-text-muted', '--palette-text-dim'] },
    ],
  },
  {
    id: 'identity', label: 'Identity', tokens: [
      { id: 'primary', label: 'Primary', type: 'color', variables: ['--palette-accent-primary', '--layout-accent-cyan'] },
      { id: 'secondary', label: 'Secondary', type: 'color', variables: ['--layout-accent-orange'] },
      { id: 'tertiary', label: 'Tertiary', type: 'color', variables: ['--palette-neon-accent'] },
      { id: 'accentSoft', label: 'Soft accent', type: 'color', variables: ['--palette-accent-primary-soft', '--layout-accent-cyan-dim'] },
    ],
  },
  {
    id: 'status', label: 'Status', tokens: [
      { id: 'success', label: 'Success', type: 'color', variables: ['--palette-success'] },
      { id: 'warning', label: 'Warning', type: 'color', variables: ['--palette-warning'] },
      { id: 'danger', label: 'Danger', type: 'color', variables: ['--palette-danger'] },
    ],
  },
  {
    id: 'effects', label: 'Lines & effects', advanced: true, tokens: [
      { id: 'border', label: 'Border', type: 'color', variables: ['--layout-border-color', '--glass-border'] },
      { id: 'borderStrong', label: 'Strong border', type: 'color', variables: ['--layout-border-color-hover'] },
      { id: 'glowColor', label: 'Glow color', type: 'color', variables: ['--layout-accent-cyan-glow'] },
      { id: 'glowStrength', label: 'Glow strength', type: 'range', min: 0, max: 40, step: 1, unit: 'px', variables: ['--theme-studio-glow-strength'] },
      { id: 'shadowDepth', label: 'Shadow depth', type: 'range', min: 0, max: 60, step: 1, unit: 'px', variables: ['--theme-studio-shadow-depth'] },
    ],
  },
  {
    id: 'shape', label: 'Type & shape', advanced: true, tokens: [
      { id: 'fontUi', label: 'UI font', type: 'font', variables: ['--ui-font-main'] },
      { id: 'fontDisplay', label: 'Display font', type: 'font', variables: ['--theme-font-display'] },
      { id: 'panelRadius', label: 'Panel radius', type: 'range', min: 0, max: 32, step: 1, unit: 'px', variables: ['--layout-panel-radius'] },
      { id: 'controlRadius', label: 'Control radius', type: 'range', min: 0, max: 24, step: 1, unit: 'px', variables: ['--ui-border-radius'] },
      { id: 'cornerStyle', label: 'Corner style', type: 'select', variables: ['--ui-corner-shape', '--theme-corner-style'], options: [
        { label: 'Round', value: 'round' }, { label: 'Squircle', value: 'squircle' },
        { label: 'Bevel', value: 'bevel' }, { label: 'Scoop', value: 'scoop' },
        { label: 'Notch', value: 'notch' }, { label: 'Square', value: 'square' },
      ] },
      { id: 'panelGap', label: 'Panel gap', type: 'range', min: 0, max: 16, step: 1, unit: 'px', variables: ['--layout-gap'] },
      { id: 'headerHeight', label: 'Header height', type: 'range', min: 28, max: 72, step: 1, unit: 'px', variables: ['--layout-header-height'] },
    ],
  },
  {
    id: 'motion', label: 'Motion', advanced: true, tokens: [
      { id: 'motionFast', label: 'Fast', type: 'range', min: 0, max: 600, step: 10, unit: 'ms', variables: ['--layout-transition-fast'] },
      { id: 'motionNormal', label: 'Normal', type: 'range', min: 0, max: 1200, step: 10, unit: 'ms', variables: ['--layout-transition-normal'] },
      { id: 'reducedMotion', label: 'Reduced', type: 'select', variables: ['--theme-motion-reduced'], options: [
        { label: 'Follow system', value: 'system' }, { label: 'Reduce', value: 'reduce' }, { label: 'Full motion', value: 'full' },
      ] },
    ],
  },
]);

export const GLOBAL_TOKEN_REGISTRY = Object.freeze(Object.fromEntries(
  GLOBAL_TOKEN_GROUPS.flatMap((group) => group.tokens.map((token) => [token.id, token])),
));

export const CURATED_VARIABLES = Object.freeze([
  ...new Set(Object.values(GLOBAL_TOKEN_REGISTRY).flatMap((token) => token.variables)),
]);

export function valuesForGlobalToken(tokenId, value) {
  const token = GLOBAL_TOKEN_REGISTRY[tokenId];
  if (!token) throw new Error(`Unknown global theme control: ${tokenId}`);
  let normalized = value;
  if (token.type === 'range') normalized = `${Number.parseFloat(value) || 0}${token.unit}`;
  if (tokenId === 'motionFast' || tokenId === 'motionNormal') {
    normalized = `${Number.parseFloat(value) || 0}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  }
  const entries = Object.fromEntries(token.variables.map((variable) => [variable, normalized]));
  if (tokenId === 'reducedMotion' && value === 'reduce') {
    entries['--layout-transition-fast'] = '0ms';
    entries['--layout-transition-normal'] = '0ms';
  }
  return entries;
}

export const COMPONENT_SELECTOR_MAP = Object.freeze([
  ['.interaction-panel', 'Chat'], ['.tasks-panel', 'Tasks'], ['.sources-panel', 'Sources'],
  ['.actiondeck-column', 'ActionDeck'], ['.notes-drawer, .note-window', 'Notes'],
  ['.calendar-modal', 'Calendar'], ['.organizer-modal', 'Organizer'],
  ['.dashboard-modal-container', 'Dashboard'], ['.media-panel', 'Media'],
  ['.login-container', 'Login'], ['.canvas-modal', 'Canvas'], ['.briiztorm-overlay', 'Briiztorm'],
  ['.journal-panel', 'Journals'], ['.notefalls-panel', 'Notefalls'], ['.forest-panel', 'Forest'],
]);

export const ROLE_SELECTOR_MAP = Object.freeze([
  ['.title-text', 'wordmark'], ['.header-dock-slot, .controlBar', 'control-dock'],
  ['.app-header, .panel-header, .actiondeck-header, .notes-drawer-header, .organizer-header, .calendar-header, .modal-header, .media-panel-header, .briiztorm-header, .canvas-header', 'header'],
  ['.resize-handle, .panel-resize-handle, .media-panel-resize-handle, .notes-resize-handle, [class*="resize-handle"]', 'resize-handle'],
  ['.modal-tabs, .organizer-tabs, [role="tablist"]', 'tabs'], ['.modal-tab, .organizer-tab, [role="tab"]', 'tab'],
  ['.model-picker, .model-picker-trigger', 'model-picker'],
  ['.messages-container, .chat-messages, .interaction-messages, .messages-list', 'chat-canvas'],
  ['.message, .message-bubble, .chat-message', 'message'],
  ['.chat-input-container, .input-container, .composer, .chat-input-wrapper', 'composer'],
  ['progress, [role="progressbar"], .progress-bar', 'progress'], ['.badge, [class*="badge"], .tab-count, [class*="count"]', 'badge'],
  ['textarea', 'textarea'], ['input:not([type="range"]):not([type="color"]):not([type="checkbox"]):not([type="radio"]):not([type="file"])', 'input'],
  ['button[class*="danger"], button[class*="delete"], button[class*="destructive"], .modal-btn-danger', 'button-destructive'],
  ['button[class*="primary"], button[type="submit"], .modal-btn-save, .settings-btn-connect', 'button-primary'],
  ['button[class*="ghost"], .modal-btn-cancel', 'button-ghost'],
  ['button[class*="icon"], button[class*="close"], button[class*="control"], .panel-header-btn, .panel-control-btn', 'button-icon'],
  ['button', 'button-secondary'],
  ['.modal-overlay, .organizer-overlay, .calendar-overlay, .login-overlay, .canvas-backdrop', 'overlay'],
  ['.modal-container, .organizer-modal, .calendar-modal, .canvas-modal, .login-container, .briiztorm-overlay', 'modal'],
  ['.task-card, .note-card, .journal-card, [class*="card"]', 'card'],
  ['.panel-content, .actiondeck-body, .actiondeck-content, .notes-drawer-content, .modal-content, .organizer-content, .calendar-content, .media-panel-content, .briiztorm-content, .canvas-content, .canvas-body, .canvas-settings-body', 'body'],
  ['.modal-footer, .panel-footer, .organizer-footer, .calendar-footer', 'footer'], ['.panel, .actiondeck-column, .media-panel', 'panel'],
  ['.app-main', 'canvas'],
]);
