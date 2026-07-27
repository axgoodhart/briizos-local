/**
 * briizy shell — the roaming avatar overlay and the menu-bar item (§9).
 *
 * One transparent, frameless, always-on-top BrowserWindow covering the primary
 * display. The avatar moves *inside* that window rather than the window moving,
 * which keeps motion smooth and avoids a window-position animation fighting the
 * compositor.
 *
 * Click-through is the default: `setIgnoreMouseEvents(true, { forward: true })`
 * lets every click reach the app underneath while still delivering mousemove to
 * the renderer, which reports when the pointer is actually over the avatar or a
 * bubble. Only then does the window become interactive.
 *
 * The shell renders suggestions; it never decides anything. Accept/dismiss are
 * forwarded to the runtime, so the proposal state machine and I6 stay in one
 * place.
 */

const path = require('path');

const SHELL_CHANNELS = Object.freeze({
  // main → overlay
  state: 'briizy:shell:state',
  suggestion: 'briizy:shell:suggestion',
  dismissSuggestion: 'briizy:shell:dismiss-suggestion',
  actionResult: 'briizy:shell:action-result',
  // overlay → main
  setInteractive: 'briizy:shell:set-interactive',
  decide: 'briizy:shell:decide',
  openInApp: 'briizy:shell:open-in-app',
  hide: 'briizy:shell:hide',
  ready: 'briizy:shell:ready',
});

/** Avatar states, mirrored by the sprite sheet cell order in the renderer. */
const AVATAR_STATES = Object.freeze([
  'idle', 'working', 'error', 'thinking', 'sleeping', 'speaking',
]);

class BriizyShell {
  constructor({ briizy, logger, electron, isDev, devServerUrl = 'http://localhost:5173' }) {
    this.briizy = briizy;
    this.logger = logger;
    this.electron = electron;
    this.isDev = isDev;
    this.devServerUrl = devServerUrl;

    this.window = null;
    this.tray = null;
    this.interactive = false;
    this.visible = false;
    this.getMainWindow = () => null;
    this.unsubscribers = [];
  }

  _log(level, message, data) {
    this.logger?.[level]?.('briizy.shell', message, data);
  }

  // ------------------------------------------------------------------
  // Overlay window
  // ------------------------------------------------------------------

  createWindow() {
    if (this.window && !this.window.isDestroyed()) return this.window;
    const { BrowserWindow, screen } = this.electron;
    const display = screen.getPrimaryDisplay();
    const { x, y, width, height } = display.workArea;

    this.window = new BrowserWindow({
      x,
      y,
      width,
      height,
      transparent: true,
      frame: false,
      // 'screen-saver' is the level that clears fullscreen apps; combined with
      // visibleOnFullScreen below it covers Spaces too (§14 open question).
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      focusable: true,
      show: false,
      // Keep it out of the window list and off the Dock's window menu.
      type: process.platform === 'darwin' ? 'panel' : undefined,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'preload.js'),
      },
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    // Click-through by default; forward:true still delivers mousemove so the
    // renderer can hit-test the avatar.
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

    // A display change (unplugging a monitor, resolution change) would otherwise
    // leave the overlay sized for a screen that no longer exists.
    const resize = () => this.fitToDisplay();
    screen.on('display-metrics-changed', resize);
    screen.on('display-added', resize);
    screen.on('display-removed', resize);
    this.unsubscribers.push(() => {
      screen.off('display-metrics-changed', resize);
      screen.off('display-added', resize);
      screen.off('display-removed', resize);
    });

    this._log('info', 'Overlay window created', { width, height });
    return this.window;
  }

  fitToDisplay() {
    if (!this.window || this.window.isDestroyed()) return;
    const { workArea } = this.electron.screen.getPrimaryDisplay();
    this.window.setBounds(workArea);
    this._log('debug', 'Overlay refitted to display', workArea);
  }

  show() {
    this.createWindow();
    if (this.window.isDestroyed()) return;
    // showInactive: the overlay must never steal focus from what the user is doing.
    this.window.showInactive();
    this.visible = true;
    this._log('info', 'Avatar shown');
    this.pushState();
    this._refreshTray();
  }

  hide() {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.hide();
    this.visible = false;
    this._log('info', 'Avatar hidden');
    this._refreshTray();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
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
    this._send(SHELL_CHANNELS.state, {
      avatar: overrides.avatar || this.avatarStateFor(status),
      status,
      ...overrides,
    });
  }

  /** Show a suggestion bubble anchored to the avatar. */
  showSuggestion(suggestion) {
    if (!suggestion) return;
    this.show();
    this._send(SHELL_CHANNELS.suggestion, suggestion);
    this.pushState({ avatar: 'speaking' });
    this._log('info', 'Suggestion surfaced on the avatar', {
      id: suggestion.id,
      kind: suggestion.kind,
      urgency: suggestion.urgency,
      title: suggestion.title || suggestion.summary,
    });
  }

  // ------------------------------------------------------------------
  // Menu-bar item
  // ------------------------------------------------------------------

  createTray() {
    if (this.tray) return this.tray;
    const { Tray, nativeImage } = this.electron;
    const iconPath = path.join(__dirname, '..', 'icon.png');
    let icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 18, height: 18 });
      // Template images follow the menu bar's light/dark appearance.
      icon.setTemplateImage(true);
    }
    this.tray = new Tray(icon);
    this.tray.setToolTip('briizy');
    this._refreshTray();
    this._log('info', 'Menu bar item created');
    return this.tray;
  }

  _refreshTray() {
    if (!this.tray) return;
    const { Menu, app } = this.electron;
    const status = this.briizy.getStatus();
    const displayActive = status.session?.kind === 'display';
    const storage = status.storage;

    const menu = Menu.buildFromTemplate([
      {
        label: `briizy — ${this._statusLabel(status)}`,
        enabled: false,
      },
      ...(storage ? [{
        label: `  ${this._formatBytes(storage.bytes)} of ${this._formatBytes(storage.retentionBytes)} · ${storage.frames.toLocaleString()} frames`,
        enabled: false,
      }] : []),
      { type: 'separator' },
      {
        label: this.visible ? 'Hide briizy' : 'Show briizy',
        click: () => this.toggle(),
      },
      {
        label: status.paused ? 'Resume capture' : 'Pause capture',
        enabled: status.enabled,
        click: () => {
          if (status.paused) this.briizy.resume('tray');
          else this.briizy.pause('tray');
        },
      },
      {
        label: displayActive ? 'Stop display session' : 'Start display session',
        enabled: status.enabled,
        click: async () => {
          if (displayActive) await this.briizy.endDisplaySession();
          else await this.briizy.startDisplaySession();
        },
      },
      { type: 'separator' },
      {
        label: 'Open briizOS…',
        click: () => this.focusMainWindow(),
      },
      {
        label: 'Settings…',
        click: () => this.focusMainWindow({ route: 'briizy-settings' }),
      },
      { type: 'separator' },
      {
        // Closing the main window only hides it and monitoring continues; this
        // is the one action that flushes and stops the helper (§9).
        label: 'Quit briizOS',
        click: () => app.quit(),
      },
    ]);
    this.tray.setContextMenu(menu);
  }

  _statusLabel(status) {
    switch (status?.state) {
      case 'capturingWindow': return 'watching the active window';
      case 'capturingDisplay': return 'recording this display';
      case 'paused': return status.enabled ? 'paused' : 'off';
      case 'permissionRequired': return 'needs Screen Recording permission';
      case 'unavailable': return 'helper unavailable';
      case 'error': return 'error';
      default: return 'idle';
    }
  }

  _formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
    if (value < 1024 ** 3) return `${Math.round(value / 1024 ** 2)} MB`;
    return `${(value / 1024 ** 3).toFixed(1)} GB`;
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
      mainWindow.webContents.send('briizy:navigate', options);
    }
    this._log('info', 'Main window focused', options);
  }

  // ------------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------------

  start({ getMainWindow }) {
    this.getMainWindow = getMainWindow || (() => null);
    const { ipcMain } = this.electron;

    const handlers = [
      [SHELL_CHANNELS.setInteractive, (_event, interactive) => this.setInteractive(interactive)],
      [SHELL_CHANNELS.hide, () => this.hide()],
      [SHELL_CHANNELS.ready, () => {
        this._log('info', 'Overlay renderer ready');
        this.pushState();
      }],
      [SHELL_CHANNELS.openInApp, (_event, options) => this.focusMainWindow(options || {})],
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

    // Pipeline events drive the avatar and keep the tray honest.
    const onStatus = () => {
      this.pushState();
      this._refreshTray();
    };
    const onSuggestion = (suggestion) => this.showSuggestion(suggestion);
    this.briizy.on('status', onStatus);
    this.briizy.on('suggestion', onSuggestion);
    this.briizy.on('proposal', onSuggestion);
    this.unsubscribers.push(() => {
      this.briizy.off('status', onStatus);
      this.briizy.off('suggestion', onSuggestion);
      this.briizy.off('proposal', onSuggestion);
    });

    this.createTray();
    this._log('info', 'Shell started');
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
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    this._log('info', 'Shell stopped');
  }
}

module.exports = { BriizyShell, SHELL_CHANNELS, AVATAR_STATES };
