/**
 * The shell's decision logic (§9).
 *
 * The overlay's visual behaviour needs a display and a human, so what is
 * asserted here is the part that can be wrong silently: how pipeline status maps
 * to an avatar state and a menu-bar label, and the click-through handshake.
 */

const { BriizyShell, AVATAR_STATES, SHELL_CHANNELS } = require('../../electron/briizy/shell');
const { assert, makeLogger, section } = require('./harness');

function run() {
  const logger = makeLogger();
  let status = { state: 'paused', enabled: false, paused: false, session: null, storage: null };
  let config = { avatarVisible: true, avatarSizePx: 70 };
  const briizy = {
    getStatus: () => status,
    getConfig: () => config,
    setConfig: (patch) => {
      config = { ...config, ...patch };
      return config;
    },
    on: () => {},
    off: () => {},
  };

  // No start(): that would create a Tray and a window. Everything below is the
  // pure mapping layer.
  const shell = new BriizyShell({ briizy, logger, electron: {}, isDev: true });

  section('avatar state follows the pipeline, not the other way round');

  const cases = [
    ['off', { state: 'paused', enabled: false }, 'sleeping'],
    ['paused', { state: 'paused', enabled: true, paused: true }, 'sleeping'],
    ['watching a window', { state: 'capturingWindow', enabled: true }, 'idle'],
    ['recording a display', { state: 'capturingDisplay', enabled: true, session: { kind: 'display' } }, 'working'],
    ['needs permission', { state: 'permissionRequired', enabled: true }, 'error'],
    ['helper unavailable', { state: 'unavailable', enabled: true }, 'error'],
    ['errored', { state: 'error', enabled: true }, 'error'],
  ];
  cases.forEach(([label, input, expected]) => {
    assert(`${label} → ${expected}`, shell.avatarStateFor(input) === expected,
      shell.avatarStateFor(input));
  });
  assert('every mapped state exists in the sprite sheet',
    cases.every(([, , expected]) => AVATAR_STATES.includes(expected)), AVATAR_STATES);
  assert('missing status degrades to idle', shell.avatarStateFor(null) === 'idle');

  section('avatar presentation stays separate from capture');

  const compact = shell.getPresentation({ avatarVisible: false, avatarSizePx: 1 });
  const large = shell.getPresentation({ avatarVisible: true, avatarSizePx: 999 });
  assert('visibility can be off while capture status remains off',
    compact.avatarVisible === false && status.enabled === false, compact);
  assert('the avatar size is clamped before it reaches overlay geometry',
    compact.avatarSizePx === 48 && large.avatarSizePx === 140, { compact, large });
  assert('a hidden avatar does not reappear for a suggestion', (() => {
    config = { avatarVisible: false, avatarSizePx: 70 };
    let shown = false;
    shell.show = () => { shown = true; };
    shell.showSuggestion({ id: 'hidden-suggestion', kind: 'insight' });
    return shown === false;
  })());
  config = { avatarVisible: true, avatarSizePx: 70 };

  section('menu-bar labels');

  assert('watching', shell._statusLabel({ state: 'capturingWindow' }) === 'watching the active window');
  assert('recording', shell._statusLabel({ state: 'capturingDisplay' }) === 'recording this display');
  assert('off vs paused are distinguishable',
    shell._statusLabel({ state: 'paused', enabled: false }) === 'off'
    && shell._statusLabel({ state: 'paused', enabled: true }) === 'paused');
  assert('permission is named explicitly',
    /Screen Recording/.test(shell._statusLabel({ state: 'permissionRequired' })));
  assert('bytes are formatted for a menu, not a log', (() => (
    shell._formatBytes(512) === '1 KB'
    && shell._formatBytes(5 * 1024 * 1024) === '5 MB'
    && shell._formatBytes(4.25 * 1024 ** 3) === '4.3 GB'
    && shell._formatBytes(0) === '0 KB'
  ))(), [shell._formatBytes(512), shell._formatBytes(5 * 1024 ** 2), shell._formatBytes(4.25 * 1024 ** 3)]);

  section('click-through handshake');

  const calls = [];
  shell.window = {
    isDestroyed: () => false,
    setIgnoreMouseEvents: (ignore, options) => calls.push({ ignore, forward: options?.forward }),
  };
  assert('the overlay starts click-through', shell.interactive === false);
  shell.setInteractive(true);
  assert('hovering the avatar makes the window interactive',
    calls.at(-1)?.ignore === false, calls.at(-1));
  shell.setInteractive(true);
  assert('a repeat hover does not re-issue the call', calls.length === 1, calls.length);
  shell.setInteractive(false);
  assert('leaving restores click-through', calls.at(-1)?.ignore === true, calls.at(-1));
  assert('mouse events are always forwarded, so hit testing keeps working',
    calls.every((call) => call.forward === true), calls);

  section('channels are declared in both directions');

  ['state', 'suggestion', 'actionResult'].forEach((key) => {
    assert(`main → overlay: ${key}`, typeof SHELL_CHANNELS[key] === 'string'
      && SHELL_CHANNELS[key].startsWith('briizy:shell:'));
  });
  ['setInteractive', 'decide', 'openInApp', 'hide', 'ready'].forEach((key) => {
    assert(`overlay → main: ${key}`, typeof SHELL_CHANNELS[key] === 'string'
      && SHELL_CHANNELS[key].startsWith('briizy:shell:'));
  });
  assert('shell channels are namespaced away from the runtime channels',
    Object.values(SHELL_CHANNELS).every((channel) => channel.startsWith('briizy:shell:')));

  section('the shell decides nothing itself (I6)');

  const source = require('fs').readFileSync(
    require('path').join(__dirname, '..', '..', 'electron', 'briizy', 'shell.js'), 'utf8',
  );
  assert('accept is forwarded to the runtime, not handled locally',
    /decideProposal/.test(source) && !/acceptCommand|createTask/.test(source), undefined, 'I6');
  assert('the overlay never steals focus', /showInactive/.test(source));
  // Pet-style small window: floating level (statusBar equivalent) with
  // canJoinAllSpaces+visibleOnFullScreen, not fullscreen screen-saver which
  // blocked the main window even when click-through.
  assert('the overlay is visible over fullscreen Spaces',
    /visibleOnFullScreen:\s*true/.test(source) && /setAlwaysOnTop\(true,\s*'(floating|status|pop-up-menu|screen-saver)'\)/.test(source));
  assert('pet-style small window does not cover the whole display',
    !/this\.window\.setBounds\(workArea\)/.test(source) && /_windowBoundsForAvatar/.test(source));
  assert('overlay exposes updateBounds channel for window-driven drift',
    typeof SHELL_CHANNELS.updateBounds === 'string' && SHELL_CHANNELS.updateBounds === 'briizy:shell:update-bounds');
}

module.exports = { run };
