/**
 * shell-preview-mock — a generic window.api / window.briizy stand-in so the
 * FULL app shell (grid + chameleon float layer) can be exercised in a plain
 * browser tab, no Electron required.
 *
 * Dev harness only: loaded exclusively by shell-preview.html. Unlike
 * briizify-preview-mock (which fakes real task data for the briizify flow),
 * this mock is deliberately generic: settings and the workspace layout are
 * real (localStorage-backed) because the chameleon shell persists through
 * them; every other bridge call auto-stubs to a benign empty result, and
 * `on*` listener registrations return unsubscribe functions.
 */

/* eslint-disable no-console */

const SETTINGS_KEY = 'shell-preview-settings';
const LAYOUT_KEY = 'shell-preview-layout';

function readSettings() {
  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSettings(map) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

/**
 * A callable, infinitely-nestable stub. Calling it resolves undefined;
 * reading any member returns another stub. Members named like listener
 * registrations (`onSomething`) instead return an unsubscribe function when
 * called, so effect cleanups stay valid.
 */
function autoStub(name = '') {
  const isListener = /^on[A-Z]/.test(name);
  const fn = function stub() {
    return isListener ? () => {} : Promise.resolve(undefined);
  };
  return new Proxy(fn, {
    get(target, prop) {
      if (typeof prop === 'symbol') return Reflect.get(target, prop);
      if (['then', 'name', 'length', 'prototype', 'call', 'apply', 'bind', 'constructor'].includes(prop)) {
        return Reflect.get(target, prop);
      }
      if (!(prop in target)) target[prop] = autoStub(String(prop));
      return target[prop];
    },
    apply(target) {
      return target();
    },
  });
}

let layoutConfig = null;
try {
  layoutConfig = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || 'null');
} catch {
  layoutConfig = null;
}

const api = autoStub('api');
api.platform = 'browser-preview';

api.localData = autoStub('localData');
api.localData.onChanged = () => () => {};
api.localData.settings = {
  list: async () => readSettings(),
  get: async (key) => {
    const map = readSettings();
    return Object.prototype.hasOwnProperty.call(map, key)
      ? { key, value: map[key], revision: 1 }
      : null;
  },
  set: async (key, value) => {
    const map = readSettings();
    map[key] = value;
    writeSettings(map);
    return { row: { key, value, revision: 1 } };
  },
};
api.localData.workspace = {
  getLayout: async () => (layoutConfig
    ? { config: layoutConfig, updatedAt: new Date().toISOString() }
    : null),
  saveLayout: async (config) => {
    layoutConfig = config;
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(config));
    } catch { /* ignore */ }
    return { ok: true };
  },
};

window.api = api;
window.briizy = autoStub('briizy');

console.log('[shell-preview] generic window.api mock installed');
