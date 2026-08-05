/**
 * The privacy gate and the pixel-egress guard — I2 and I3.
 *
 * These are the assertions the plan says must be enforced by test rather than by
 * convention, so they are pure and run first: no database, no helper process.
 */

const privacy = require('../../electron/rewind/privacy');
const briizyConfig = require('../../electron/rewind/config');
const { assert, section } = require('./harness');

function run() {
  const enabled = { ...briizyConfig.defaults(), enabled: true };

  section('I3 — one gate, default-closed on credential surfaces');

  const denials = [
    ['1Password', { bundleId: 'com.1password.1password', appName: '1Password', windowTitle: 'Personal' }],
    ['Bitwarden', { bundleId: 'com.bitwarden.desktop', appName: 'Bitwarden' }],
    ['KeePassXC', { bundleId: 'org.keepassxc.KeePassXC', appName: 'KeePassXC' }],
    ['Keychain Access', { bundleId: 'com.apple.keychainaccess', appName: 'Keychain Access' }],
    ['login window', { bundleId: 'com.apple.loginwindow', appName: 'loginwindow' }],
    ['security agent', { bundleId: 'com.apple.SecurityAgent', appName: 'SecurityAgent' }],
    ['screen saver', { bundleId: 'com.apple.ScreenSaver.Engine', appName: 'ScreenSaverEngine' }],
  ];
  denials.forEach(([label, meta]) => {
    assert(`${label} is denied`, privacy.evaluate(meta, enabled).allowed === false, undefined, 'I3');
  });

  assert('bundle matching is case-insensitive',
    privacy.evaluate({ bundleId: 'COM.BITWARDEN.DESKTOP', appName: 'Bitwarden' }, enabled).allowed === false,
    undefined, 'I3');

  const titleDenials = [
    ['Chrome incognito', 'New Incognito Tab'],
    ['Firefox private', 'Mozilla Firefox Private Browsing'],
    ['Safari private', 'Start Page (Private)'],
    ['a password page', 'Change your password — Account settings'],
    ['an authenticator', 'Authenticator — codes'],
    ['a one-time code', 'Your one-time code'],
  ];
  titleDenials.forEach(([label, windowTitle]) => {
    const verdict = privacy.evaluate({ bundleId: 'com.google.Chrome', appName: 'Chrome', windowTitle }, enabled);
    assert(`${label} is denied by title`, verdict.reason === privacy.DENY_REASONS.excludedTitle, windowTitle, 'I3');
  });

  section('I3 — the gate allows ordinary work, and says why when it does not');

  assert('an ordinary window is allowed',
    privacy.evaluate({ bundleId: 'com.apple.Safari', appName: 'Safari', windowTitle: 'briizOS docs' }, enabled).allowed,
    undefined, 'I3');
  assert('briizOS records itself by default — its user is its developer',
    privacy.evaluate({ bundleId: 'com.briizos.app', appName: 'briizOS' }, enabled,
      { ownBundleIds: ['com.briizos.app'] }).allowed,
    undefined, 'I3');
  assert('switching "record briizOS itself" off denies own windows',
    privacy.evaluate({ bundleId: 'com.briizos.app', appName: 'briizOS' },
      { ...enabled, captureOwnWindow: false },
      { ownBundleIds: ['com.briizos.app'] }).reason === privacy.DENY_REASONS.ownWindow,
    undefined, 'I3');
  assert('disabled config denies everything',
    privacy.evaluate({ bundleId: 'com.apple.Safari', appName: 'Safari' }, briizyConfig.defaults()).reason
      === privacy.DENY_REASONS.disabled, undefined, 'I10');
  assert('pause denies everything',
    privacy.evaluate({ bundleId: 'com.apple.Safari' }, enabled, { paused: true }).reason
      === privacy.DENY_REASONS.paused, undefined, 'I10');
  assert('a locked screen denies everything',
    privacy.evaluate({ bundleId: 'com.apple.Safari' }, enabled, { screenLocked: true }).reason
      === privacy.DENY_REASONS.screenLocked, undefined, 'I3');
  assert('an unresolvable window is denied',
    privacy.evaluate({}, enabled).reason === privacy.DENY_REASONS.noWindow, undefined, 'I3');
  assert('every denial carries a reason string',
    privacy.evaluate({ bundleId: 'com.1password.1password' }, enabled).reason.length > 0, undefined, 'I3');

  section('I3 — user-supplied patterns');

  const custom = {
    ...enabled,
    excludedBundleIds: ['com.example.private'],
    excludedTitlePatterns: ['(?i)payroll', '[unclosed'],
  };
  assert('a user bundle exclusion applies',
    privacy.evaluate({ bundleId: 'com.example.private', appName: 'X' }, custom).allowed === false, undefined, 'I3');
  assert('a user title pattern applies',
    privacy.evaluate({ bundleId: 'com.apple.Safari', appName: 'Safari', windowTitle: 'Q3 Payroll' }, custom)
      .allowed === false, undefined, 'I3');
  assert('an unparseable pattern does not disable the other rules',
    privacy.evaluate({ bundleId: 'com.example.private', appName: 'X' }, custom).allowed === false, undefined, 'I3');
  assert('a broken pattern is reported',
    privacy.compilePatterns(['[unclosed']).invalid.length === 1, undefined, 'I3');
  assert('replacing the defaults really replaces them',
    privacy.evaluate({ bundleId: 'com.1password.1password', appName: '1Password' }, custom).allowed === true,
    'user-managed list wins — the UI shows what is on it', 'I3');

  section('I2 — nothing that could carry pixels or paths reaches a provider');

  const violations = [
    ['a base64 data URI', { text: 'data:image/jpeg;base64,/9j/4AAQSkZJRg' }],
    ['raw JPEG base64', { blob: `/9j/${'A'.repeat(60)}` }],
    ['raw PNG base64', { blob: `iVBORw0KGgo${'A'.repeat(30)}` }],
    ['a Buffer', { image: Buffer.from([0xff, 0xd8, 0xff]) }],
    ['a Uint8Array', { image: new Uint8Array([1, 2, 3]) }],
    ['an absolute user path', { note: 'saved at /Users/alex/Desktop/shot.jpg' }],
    ['a Library path', { note: '/Library/Caches/thing' }],
    ['a file:// URL', { link: 'file:///tmp/x.jpg' }],
    ['an archive path', { ctx: 'rewind/frames/2026-07-26/1234-window.jpg' }],
    ['a nested violation', { messages: [{ content: [{ type: 'image', data: 'data:image/png;base64,iVBOR' }] }] }],
  ];
  violations.forEach(([label, payload]) => {
    const check = privacy.assertNoPixelEgress(payload);
    assert(`${label} is caught`, check.clean === false, check.violations[0], 'I2');
  });

  const legitimate = {
    model: 'claude-sonnet-5',
    messages: [{
      role: 'user',
      content: 'Recent context:\n[14:02] Slack — #eng: ship the staging deploy before friday standup',
    }],
    context: [
      { appName: 'Slack', windowTitle: '#eng — briizOS', at: '2026-07-26T14:02:00Z', text: 'ship the staging deploy' },
      { appName: 'Safari', windowTitle: 'fly.io dashboard', at: '2026-07-26T14:05:00Z', text: 'deploy succeeded' },
    ],
  };
  const clean = privacy.assertNoPixelEgress(legitimate);
  assert('a legitimate OCR-text payload passes', clean.clean === true, clean.violations, 'I2');
  assert('a self-referencing payload does not hang', (() => {
    const cyclic = { appName: 'Safari' };
    cyclic.self = cyclic;
    return privacy.assertNoPixelEgress(cyclic).clean === true;
  })(), undefined, 'I2');

  section('config normalization cannot widen behaviour');

  assert('defaults are off', briizyConfig.defaults().enabled === false, undefined, 'I10');
  assert('defaults stage every assistant',
    Object.values(briizyConfig.defaults().assistants)
      .every((a) => a.enabled === false && a.immediateExecution === false), undefined, 'I6');
  assert('cloud text analysis is off by default',
    briizyConfig.defaults().cloudTextAnalysisAllowed === false, undefined, 'I2');
  assert('automatic screenshots alternate window and full display by default',
    briizyConfig.defaults().captureStrategy === 'alternate');
  assert('the avatar defaults to visible at the mockup size', (() => {
    const config = briizyConfig.defaults();
    return config.avatarVisible === true && config.avatarSizePx === 70;
  })());
  assert('garbage normalizes to defaults',
    briizyConfig.normalize('not an object').captureIntervalMs === 3000);
  assert('a truthy-but-not-true enabled value stays off',
    briizyConfig.normalize({ enabled: 'yes' }).enabled === false, undefined, 'I10');
  assert('interval is clamped to the floor',
    briizyConfig.normalize({ captureIntervalMs: 1 }).captureIntervalMs === 1000);
  assert('retentionBytes has a floor',
    briizyConfig.normalize({ retentionBytes: 1 }).retentionBytes === 256 * 1024 * 1024, undefined, 'I8');
  assert('avatar presentation is independent and bounded', (() => {
    const config = briizyConfig.normalize({ avatarVisible: false, avatarSizePx: 999 });
    return config.avatarVisible === false && config.avatarSizePx === 140
      && briizyConfig.normalize({ avatarSizePx: 1 }).avatarSizePx === 48;
  })());
  assert('an unknown ocrMode falls back to fast',
    briizyConfig.normalize({ ocrMode: 'perfect' }).ocrMode === 'fast');
  assert('capture strategy accepts only the supported framings',
    briizyConfig.normalize({ captureStrategy: 'display' }).captureStrategy === 'display'
      && briizyConfig.normalize({ captureStrategy: 'invented' }).captureStrategy === 'alternate');
  assert('unknown top-level keys are dropped',
    briizyConfig.normalize({ sneaky: true }).sneaky === undefined);
  assert('unknown assistant ids are dropped',
    briizyConfig.normalize({ assistants: { evil: { enabled: true } } }).assistants.evil === undefined, undefined, 'I1');
  assert('merge preserves untouched assistant fields', (() => {
    const merged = briizyConfig.merge(briizyConfig.defaults(), { assistants: { insight: { enabled: true } } });
    return merged.assistants.insight.enabled === true
      && merged.assistants.insight.immediateExecution === false
      && merged.assistants.focus.enabled === false;
  })(), undefined, 'I6');

  section('quiet hours');

  const at = (h, m = 0) => new Date(2026, 6, 26, h, m);
  assert('inside a same-day window',
    briizyConfig.inQuietHours({ from: '09:00', to: '17:00' }, at(12)) === true);
  assert('outside a same-day window',
    briizyConfig.inQuietHours({ from: '09:00', to: '17:00' }, at(20)) === false);
  assert('inside a window that wraps midnight (late)',
    briizyConfig.inQuietHours({ from: '22:00', to: '08:00' }, at(23)) === true);
  assert('inside a window that wraps midnight (early)',
    briizyConfig.inQuietHours({ from: '22:00', to: '08:00' }, at(3)) === true);
  assert('outside a window that wraps midnight',
    briizyConfig.inQuietHours({ from: '22:00', to: '08:00' }, at(12)) === false);
  assert('no window means never quiet', briizyConfig.inQuietHours(null, at(3)) === false);
}

module.exports = { run };
