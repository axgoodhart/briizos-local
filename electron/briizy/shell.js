/**
 * briizy shell — the roaming avatar overlay (§9).
 *
 * A small, transparent, frameless, always-on-top BrowserWindow sized to the
 * avatar (like OpenPets/Codex pets). The window itself moves across the display
 * to drift, while the avatar bobs inside — the same split OpenPets uses:
 * NSPanel sized to the sprite + message area, level .statusBar, collection
 * [.canJoinAllSpaces, .fullScreenAuxiliary], nonactivating, no shadow.
 * Fullscreen overlay was the blocker: a workArea-sized window at
 * screen-saver level, even click-through, still interfered with the main
 * briizOS window's activation and drag. Pet-style small window only occupies the
 * avatar + bubble rect, so the rest of the desktop and briizOS stay fully
 * interactive.
 *
 * Click-through is the default: `setIgnoreMouseEvents(true, { forward: true })`
 * lets clicks fall through to the desktop/briizOS while still delivering
 * mousemove for hit-testing. Only when the pointer is actually over the avatar
 * or a bubble does the window become interactive.
 *
 * The shell renders suggestions; it never decides anything. Accept/dismiss are
 * forwarded to the runtime, so the proposal state machine and I6 stay in one
 * place.
 */

const path = require('path');

const SHELL_CHANNELS = Object.freeze({
  // main → overlay
  state: 'briizy:shell:state',
  focus: 'briizy:shell:focus',
  suggestion: 'briizy:shell:suggestion',
  dismissSuggestion: 'briizy:shell:dismiss-suggestion',
  actionResult: 'briizy:shell:action-result',
  // overlay → main
  setInteractive: 'briizy:shell:set-interactive',
  setChatActive: 'briizy:shell:set-chat-active',
  decide: 'briizy:shell:decide',
  openInApp: 'briizy:shell:open-in-app',
  hide: 'briizy:shell:hide',
  ready: 'briizy:shell:ready',
  updateBounds: 'briizy:shell:update-bounds',
  requestChat: 'briizy:shell:request-chat',
  chatResponse: 'briizy:shell:chat-response',
});

/** Avatar states, mirrored by the sprite sheet cell order in the renderer. */
const AVATAR_STATES = Object.freeze([
  'idle', 'working', 'error', 'thinking', 'sleeping', 'speaking',
]);

const AVATAR_SIZE_MIN_PX = 48;
const AVATAR_SIZE_MAX_PX = 140;
const DEFAULT_AVATAR_SIZE_PX = 70;
const AVATAR_ASPECT_RATIO = 499 / 330.5;
const BUBBLE_WIDTH_PX = 296;
const WINDOW_PADDING_PX = 24;
const EDGE_MARGIN_PX = 28;

class BriizyShell {
  constructor({ briizy, logger, electron, isDev, devServerUrl = 'http://localhost:5173' }) {
    this.briizy = briizy;
    this.logger = logger;
    this.electron = electron;
    this.isDev = isDev;
    this.devServerUrl = devServerUrl;

    this.window = null;
    this.interactive = false;
    this.visible = false;
    this.anchor = 'right'; // which side the avatar sits on inside the window; resizes keep that corner still
    this.getMainWindow = () => null;
    this.unsubscribers = [];
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.shell', message, data);
  }

  // ------------------------------------------------------------------
  // Overlay window
  // ------------------------------------------------------------------

  _windowBoundsForAvatar(avatarSizePx, suggestionVisible = false) {
    const size = Math.min(AVATAR_SIZE_MAX_PX, Math.max(AVATAR_SIZE_MIN_PX, Math.round(Number(avatarSizePx)) || DEFAULT_AVATAR_SIZE_PX));
    const avatarW = size;
    const avatarH = Math.round(size * AVATAR_ASPECT_RATIO);
    // Like OpenPets: window sized to sprite + message area, not fullscreen.
    // 316 is the min width OpenPets uses for sprite+cloud, and 108 is the
    // reserved messageAreaHeight.
    const contentW = suggestionVisible
      ? avatarW + BUBBLE_WIDTH_PX + WINDOW_PADDING_PX * 2 + 12
      : avatarW + WINDOW_PADDING_PX * 2;
    const contentH = suggestionVisible
      ? Math.max(avatarH, 240) + WINDOW_PADDING_PX * 2 + 24
      : avatarH + WINDOW_PADDING_PX * 2;
    return { avatarW, avatarH, contentW, contentH };
  }

  _defaultWindowOrigin(contentW, contentH) {
    const { workArea } = this.electron.screen.getPrimaryDisplay();
    return {
      x: Math.round(workArea.x + workArea.width - contentW - 40),
      y: Math.round(workArea.y + workArea.height - contentH - 40),
    };
  }

  createWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window;
    const { BrowserWindow, screen } = this.electron;
    const presentation = this.getPresentation();
    const { contentW, contentH } = this._windowBoundsForAvatar(presentation.avatarSizePx, false);
    const origin = this._defaultWindowOrigin(contentW, contentH);

    this.window = new BrowserWindow({
      x: origin.x,
      y: origin.y,
      width: contentW,
      height: contentH,
      transparent: true,
      frame: false,
      // Pet-style: floating level with canJoinAllSpaces keeps it forefront on
      // every Space/fullscreen without using screen-saver (which sat above the
      // main briizOS window and blocked activation/drag even when click-through).
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      // Never focusable: clicks on the avatar still land, but the overlay can
      // never become the key window, steal focus from real work, or stop the
      // main window's activation. Keep regular window (not panel) so the Dock
      // icon and main window activation stay intact — panel flips the app to
      // accessory mode (observed 2026-07-27). OpenPets uses NSPanel with
      // .accessory, but briizOS is a regular app.
      focusable: false,
      show: false,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'preload.js'),
      },
    });

    // floating is the OpenPets equivalent of .statusBar for a regular app:
    // above normal windows, below screen-saver, and with canJoinAllSpaces it
    // still appears on every Space. pop-up-menu would also work, but floating
    // is the least intrusive that still stays forefront.
    this.window.setAlwaysOnTop(true, 'floating');
    this.window.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      // Electron otherwise temporarily changes the whole application into a
      // UIElement process, which removes briizOS from the Dock after startup.
      skipTransformProcessType: true,
    });
    // Click-through by default; forward:true still delivers mousemove so the
    // renderer can hit-test the avatar. With a small window this only affects
    // the avatar rect, not the whole desktop.
    this.window.setIgnoreMouseEvents(true, { forward: true });
    this.interactive = false;

    if (this.isDev) {
      this.window.loadURL(`${this.devServerUrl}/briizy.html`);
    } else {
      this.window.loadFile(path.join(__dirname, '..', '..', 'dist', 'briizy.html'));
    }

    this.window.on('closed', () => {
      this.window = null;
      this.visible = false;
    });

    // A display change (unplugging a monitor, resolution change) keep the pet
    // visible instead of stranded off-screen. Small window just re-clamps,
    // not resizes to fullscreen.
    const onDisplayChange = () => this.fitToDisplay();
    screen.on('display-metrics-changed', onDisplayChange);
    screen.on('display-added', onDisplayChange);
    screen.on('display-removed', onDisplayChange);
    this.unsubscribers.push(() => {
      screen.off('display-metrics-changed', onDisplayChange);
      screen.off('display-added', onDisplayChange);
      screen.off('display-removed', onDisplayChange);
    });

    this._log('debug', 'The screen-memory avatar window was created (pet-style small window, not fullscreen).', {
      width: contentW,
      height: contentH,
      x: origin.x,
      y: origin.y,
      captureStartedByThisStep: false,
    });
    return this.window;
  }

  fitToDisplay() {
    if (!this.window || this.window.isDestroyed()) return;
    const { workArea } = this.electron.screen.getPrimaryDisplay();
    const bounds = this.window.getBounds();
    // Clamp small window inside the current workArea instead of resizing to
    // fullscreen. Prevents pet being stranded off-screen after display change.
    const clampedX = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - bounds.width);
    const clampedY = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - bounds.height);
    if (clampedX !== bounds.x || clampedY !== bounds.y) {
      this.window.setBounds({ x: clampedX, y: clampedY, width: bounds.width, height: bounds.height });
      this._log('debug', 'Overlay re-clamped to display', { x: clampedX, y: clampedY });
    }
  }

  /**
   * Resize/reposition the pet window. Called from the renderer when avatar size
   * changes, a bubble appears/dismisses, or drift picks a new screen position.
   * Validates bounds and keeps the window inside the current workArea.
   */
  setWindowBounds(nextBounds) {
    if (!this.window || this.window.isDestroyed()) return;
    const { workArea } = this.electron.screen.getPrimaryDisplay();
    const current = this.window.getBounds();
    const width = Math.round(Number(nextBounds.width)) || current.width;
    const height = Math.round(Number(nextBounds.height)) || current.height;
    if (nextBounds.anchor === 'left' || nextBounds.anchor === 'right') this.anchor = nextBounds.anchor;
    const moving = Number.isFinite(nextBounds.x) || Number.isFinite(nextBounds.y);
    let x;
    let y;
    if (moving) {
      x = Number.isFinite(nextBounds.x) ? Math.round(nextBounds.x) : current.x;
      y = Number.isFinite(nextBounds.y) ? Math.round(nextBounds.y) : current.y;
      // Keep at least 40px of the window visible so it never drifts completely off-screen.
      const minVisible = 40;
      x = Math.min(Math.max(x, workArea.x - width + minVisible), workArea.x + workArea.width - minVisible);
      y = Math.min(Math.max(y, workArea.y - height + minVisible), workArea.y + workArea.height - minVisible);
    } else {
      // Resize in place: avatar's bottom corner stays put, bubble grows up and outward, fully on-screen.
      x = this.anchor === 'right' ? current.x + current.width - width : current.x;
      y = current.y + current.height - height;
      x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - width);
      y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - height);
    }
    if (x === current.x && y === current.y && width === current.width && height === current.height) return;
    this.window.setBounds({ x, y, width, height });
    if (!moving) {
      this._log('debug', 'The avatar window was resized to fit its speech bubble or chat box.', {
        from: { width: current.width, height: current.height },
        to: { width, height },
        anchoredSide: this.anchor,
      });
    }
  }

  /**
   * The overlay is normally unfocusable so it never steals typing from real work.
   * While the quick-chat box is open it must take the keyboard, so it becomes
   * focusable for exactly that span.
   */
  setChatActive(active) {
    if (!this.window || this.window.isDestroyed()) return;
    const next = !!active;
    this.window.setFocusable(next);
    if (next) this.window.focus();
    else this.window.blur();
    this._log('info', next
      ? 'Briizy quick chat opened, so the avatar window can take keyboard input until it closes.'
      : 'Briizy quick chat closed, so the avatar window gave the keyboard back and no longer takes focus.', {
      focusable: next,
    });
  }

  show() {
    this.createWindow();
    if (this.window.isDestroyed()) return;
    // showInactive: the overlay must never steal focus from what the user is doing.
    this.window.showInactive();
    this.visible = true;
    this._log('info', 'Avatar shown');
    this.pushState();
  }

  hide() {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.hide();
    this.visible = false;
    this._log('info', 'Avatar hidden');
  }

  toggle() {
    this.setAvatarVisible(!this.visible);
  }

  /**
   * Toggle interactivity from the renderer's hit test. Everything outside the
   * avatar stays click-through, so the overlay never blocks the desktop.
   */
  setInteractive(interactive) {
    if (!this.window || this.window.isDestroyed()) return;
    const next = !!interactive;
    if (next === this.interactive) return;
    this.interactive = next;
    this.window.setIgnoreMouseEvents(!next, { forward: true });
    this._log('debug', `Overlay ${next ? 'interactive' : 'click-through'}`);
  }

  /**
   * The avatar's presentation is a saved preference, not a capture state. Keep
   * the bounds here as a defensive fallback; normal config values are already
   * clamped before reaching the shell.
   */
  getPresentation(config = this.briizy.getConfig?.()) {
    const requestedSize = Math.round(Number(config?.avatarSizePx));
    return {
      avatarVisible: config?.avatarVisible !== false,
      avatarSizePx: Number.isFinite(requestedSize)
        ? Math.min(AVATAR_SIZE_MAX_PX, Math.max(AVATAR_SIZE_MIN_PX, requestedSize))
        : DEFAULT_AVATAR_SIZE_PX,
    };
  }

  /** Apply saved presentation without changing capture, OCR, or analysis. */
  applyPresentation(config = this.briizy.getConfig?.()) {
    const presentation = this.getPresentation(config);
    // Keep pet window sized to avatar — like OpenPets resizing on scale change.
    if (this.window && !this.window.isDestroyed()) {
      const { contentW, contentH } = this._windowBoundsForAvatar(presentation.avatarSizePx, false);
      const cur = this.window.getBounds();
      if (cur.width !== contentW || cur.height !== contentH) {
        this.setWindowBounds({ width: contentW, height: contentH });
      }
    }
    if (presentation.avatarVisible) {
      if (this.visible) this.pushState(presentation);
      else this.show();
    } else if (this.visible) {
      this.hide();
    } else {
      this.pushState(presentation);
    }
    return presentation;
  }

  /** Route every Show/Hide affordance through the same persisted preference. */
  setAvatarVisible(visible) {
    const nextVisible = visible === true;
    const config = this.briizy.getConfig?.() || {};
    if (config.avatarVisible === nextVisible) {
      this.applyPresentation(config);
      return config;
    }
    return this.briizy.setConfig({ avatarVisible: nextVisible });
  }

  _send(channel, payload) {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.webContents.send(channel, payload);
  }

  /** Derive the avatar state from live pipeline status. */
  avatarStateFor(status) {
    if (!status) return 'idle';
    if (status.state === 'error') return 'error';
    if (status.state === 'unavailable' || status.state === 'permissionRequired') return 'error';
    if (!status.enabled || status.paused) return 'sleeping';
    if (status.session?.kind === 'display') return 'working';
    return 'idle';
  }

  pushState(overrides = {}) {
    const status = this.briizy.getStatus();
    const presentation = this.getPresentation();
    this._send(SHELL_CHANNELS.state, {
      avatar: overrides.avatar || this.avatarStateFor(status),
      status,
      ...presentation,
      ...overrides,
    });
  }

  /** Show a suggestion bubble anchored to the avatar. */
  showSuggestion(suggestion) {
    if (!suggestion) return;
    if (!this.getPresentation().avatarVisible) {
      this._log('info', 'Suggestion kept off-screen because the avatar is invisible', {
        id: suggestion.id,
        kind: suggestion.kind,
      });
      return;
    }
    this.show();
    // Tell renderer to resize window to fit bubble before showing it — the
    // renderer will send update-bounds with the measured bubble size, but we
    // pre-grow here so the bubble never clips on first frame.
    if (this.window && !this.window.isDestroyed()) {
      const presentation = this.getPresentation();
      const { contentW, contentH } = this._windowBoundsForAvatar(presentation.avatarSizePx, true);
      const cur = this.window.getBounds();
      if (cur.width < contentW || cur.height < contentH) {
        this.setWindowBounds({ width: Math.max(cur.width, contentW), height: Math.max(cur.height, contentH) });
      }
    }
    this._send(SHELL_CHANNELS.suggestion, suggestion);
    this.pushState({ avatar: 'speaking' });
    this._log('info', 'Suggestion surfaced on the avatar', {
      id: suggestion.id,
      kind: suggestion.kind,
      urgency: suggestion.urgency,
      title: suggestion.title || suggestion.summary,
    });
  }

  /**
   * Verify the capture path end to end, from inside the app that holds the
   * Screen Recording grant. Reads only a window it creates; see self-test.js for
   * why this is safe to run at any time, including while screen-sharing.
   */
  async runSelfTest() {
    const { dialog } = this.electron;
    const { runCaptureSelfTest } = require('./self-test');
    try {
      const result = await runCaptureSelfTest({
        helper: this.briizy.helper,
        logger: this.logger,
        BrowserWindow: this.electron.BrowserWindow,
        screen: this.electron.screen,
        userDataPath: this.electron.app?.getPath?.('userData') || null,
      });
      const failed = result.checks.filter((check) => !check.passed);
      await dialog.showMessageBox({
        type: result.ok ? 'info' : (result.skipped ? 'warning' : 'error'),
        message: result.ok ? 'Capture is working' : 'Capture self-test did not pass',
        detail: [
          result.summary,
          '',
          'This test captured only a window it created itself. Nothing else on your',
          'screen was read. One evidence frame of that test window is kept so the',
          'result can be checked rather than believed:',
          result.evidencePath || 'evidence frame unavailable',
          failed.length ? '' : null,
          ...failed.map((check) => `✗ ${check.label}`),
        ].filter((line) => line !== null).join('\n'),
        buttons: ['OK'],
      });
      return result;
    } catch (error) {
      this._log('error', 'Self-test crashed', { error: error?.message });
      await dialog.showMessageBox({
        type: 'error',
        message: 'Capture self-test crashed',
        detail: error?.message || String(error),
        buttons: ['OK'],
      });
      return { ok: false, error: error?.message };
    }
  }

  /** Bring the main briizOS window forward, optionally asking it to navigate. */
  focusMainWindow(options = {}) {
    const mainWindow = this.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      this._log('warn', 'No main window to focus');
      return;
    }
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
    if (options.route || options.frameId || options.sessionId) {
      // If the window was just created it has no listeners yet — a navigate
      // sent now lands in the void. Wait for the renderer before sending.
      const send = () => mainWindow.webContents.send('briizy:navigate', options);
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once('did-finish-load', send);
      } else {
        send();
      }
    }
    this._log('info', 'Main window focused', options);
  }

  /** Relay a desktop quick-chat turn to the main renderer's shared Chat engine. */
  requestQuickChat(request) {
    const mainWindow = this.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      this._send(SHELL_CHANNELS.chatResponse, {
        requestId: request?.requestId || null,
        status: 'error',
        response: 'briizOS is not available to answer right now.',
      });
      return;
    }
    const send = () => mainWindow.webContents.send('briizy:quick-chat', request);
    if (mainWindow.webContents.isLoading()) mainWindow.webContents.once('did-finish-load', send);
    else send();
    this._log('info', 'Quick-chat message sent from the desktop Briizy to saved Chats', {
      requestId: request?.requestId || null,
      characters: String(request?.message || '').length,
    });
  }

  // ------------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------------

  start({ getMainWindow }) {
    this.getMainWindow = getMainWindow || (() => null);
    const { ipcMain } = this.electron;

    const handlers = [
      [SHELL_CHANNELS.setInteractive, (_event, interactive) => this.setInteractive(interactive)],
      [SHELL_CHANNELS.setChatActive, (_event, active) => this.setChatActive(active)],
      [SHELL_CHANNELS.hide, () => this.setAvatarVisible(false)],
      [SHELL_CHANNELS.ready, () => {
        this._log('debug', 'The screen-memory avatar interface finished loading. This reports the controls only, not capture permission or screenshot success.');
        this.pushState();
      }],
      [SHELL_CHANNELS.openInApp, (_event, options) => this.focusMainWindow(options || {})],
      [SHELL_CHANNELS.updateBounds, (_event, bounds) => this.setWindowBounds(bounds || {})],
      [SHELL_CHANNELS.requestChat, (_event, request) => this.requestQuickChat(request || {})],
      [SHELL_CHANNELS.chatResponse, (_event, update) => this._send(SHELL_CHANNELS.chatResponse, update || {})],
    ];
    handlers.forEach(([channel, handler]) => ipcMain.on(channel, handler));
    this.unsubscribers.push(() => handlers.forEach(([channel, handler]) => (
      ipcMain.removeListener(channel, handler)
    )));

    // Accept/dismiss goes to the runtime; the shell decides nothing (I6).
    const decideHandler = async (_event, decision) => {
      this._log('info', 'Suggestion decided from the avatar', decision);
      try {
        const result = typeof this.briizy.decideProposal === 'function'
          ? await this.briizy.decideProposal(decision)
          : { ok: false, reason: 'proposals are not available yet' };
        this._send(SHELL_CHANNELS.actionResult, { decision, result });
        this.pushState();
        return result;
      } catch (error) {
        this._log('warn', 'Suggestion decision failed', { decision, error: error?.message });
        this._send(SHELL_CHANNELS.actionResult, {
          decision,
          result: { ok: false, reason: error?.message },
        });
        return { ok: false, reason: error?.message };
      }
    };
    ipcMain.handle(SHELL_CHANNELS.decide, decideHandler);
    this.unsubscribers.push(() => ipcMain.removeHandler(SHELL_CHANNELS.decide));

    // Pipeline events drive the avatar.
    const onStatus = () => {
      this.pushState();
    };
    const onSuggestion = (suggestion) => this.showSuggestion(suggestion);
    // Focus is ambient: it tints the overlay edge, it does not open a bubble
    // and it does not show the avatar if it is hidden (§11).
    const onFocus = (focus) => this._send(SHELL_CHANNELS.focus, focus);
    this.briizy.on('status', onStatus);
    this.briizy.on('suggestion', onSuggestion);
    this.briizy.on('proposal', onSuggestion);
    this.briizy.on('focus', onFocus);
    this.unsubscribers.push(() => {
      this.briizy.off('status', onStatus);
      this.briizy.off('suggestion', onSuggestion);
      this.briizy.off('proposal', onSuggestion);
      this.briizy.off('focus', onFocus);
    });

    this._log('info', 'The screen-memory avatar wiring started without a menu-bar icon.', {
      appRecovery: 'briizOS remains available from its Dock icon',
      captureStatus: 'reported separately',
    });
  }

  stop() {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch { /* already torn down */ }
    });
    this.unsubscribers = [];
    if (this.window && !this.window.isDestroyed()) this.window.destroy();
    this.window = null;
    this._log('info', 'Shell stopped');
  }
}

module.exports = { BriizyShell, SHELL_CHANNELS, AVATAR_STATES };
