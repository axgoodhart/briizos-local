import { COMPONENT_SELECTOR_MAP, ROLE_SELECTOR_MAP, TARGET_REGISTRY } from './themeRegistry';

const RUNTIME_STYLE_ID = 'briizos-theme-runtime-rules';
const annotatedElements = new Set();

function attributeSelector(name, value) {
  return `[${name}="${String(value).replace(/["\\]/g, '\\$&')}"]`;
}

export function selectorForOverride(override) {
  let selector = attributeSelector('data-theme-role', override.targetId);
  if (override.scope === 'component') selector += attributeSelector('data-theme-component', override.componentId);
  if (override.scope === 'instance') selector += attributeSelector('data-theme-instance', override.instanceId);
  return selector;
}

export function styleValueToCss(property, structured) {
  if (!structured) return '';
  if (structured.kind === 'color') return structured.value;
  if (structured.kind === 'solid') return structured.color;
  if (structured.kind === 'linear-gradient') {
    const stops = structured.stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');
    return `linear-gradient(${structured.angle}deg, ${stops})`;
  }
  if (structured.kind === 'shadow') {
    const alpha = Math.max(0, Math.min(1, structured.intensity));
    const color = structured.color.startsWith('#') && structured.color.length === 7
      ? `${structured.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
      : structured.color;
    return `${structured.x}px ${structured.y}px ${structured.blur}px ${structured.spread}px ${color}`;
  }
  if (structured.kind === 'length') return `${structured.value}${structured.unit}`;
  if (structured.kind === 'number') return String(structured.value);
  if (structured.kind === 'font' || structured.kind === 'keyword') return structured.value;
  throw new Error(`Unsupported ${property} theme value.`);
}

export function rulesForOverrides(overrides = []) {
  return overrides.map((override) => {
    const declarations = Object.entries(override.styles)
      .map(([property, value]) => `  ${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${styleValueToCss(property, value)} !important;`)
      .join('\n');
    return `${selectorForOverride(override)} {\n${declarations}\n}`;
  }).join('\n\n');
}

export function createThemeRuntime(doc = document) {
  let appliedVariables = new Set();

  const cleanup = () => {
    const root = doc.documentElement;
    appliedVariables.forEach((variable) => root.style.removeProperty(variable));
    appliedVariables = new Set();
    root.removeAttribute('data-custom-theme');
    doc.getElementById(RUNTIME_STYLE_ID)?.remove();
  };

  const apply = (theme) => {
    cleanup();
    const root = doc.documentElement;
    const baseThemeId = theme?.baseThemeId || theme?.id || 'default';
    if (!baseThemeId || baseThemeId === 'default') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', baseThemeId);

    if (!theme?.variables || !theme?.overrides) return;
    root.setAttribute('data-custom-theme', theme.id);
    Object.entries(theme.variables).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
      appliedVariables.add(variable);
    });
    const style = doc.createElement('style');
    style.id = RUNTIME_STYLE_ID;
    style.dataset.themeRuntime = theme.id;
    style.textContent = rulesForOverrides(theme.overrides);
    doc.head.appendChild(style);
  };

  return { apply, cleanup, getAppliedVariables: () => new Set(appliedVariables) };
}

function componentForElement(element) {
  if (element.dataset.themeComponent) return element.dataset.themeComponent;
  for (const [selector, componentId] of COMPONENT_SELECTOR_MAP) {
    if (element.matches(selector) || element.closest(selector)) return componentId;
  }
  return 'Application';
}

function annotateElement(element, role) {
  if (!(element instanceof HTMLElement) || element.closest('[data-theme-studio]')) return;
  if (!element.dataset.themeRole) element.dataset.themeRole = role;
  if (!element.dataset.themeComponent) element.dataset.themeComponent = componentForElement(element);
  const instanceOwner = element.closest('[data-theme-instance]');
  if (!element.dataset.themeInstance && instanceOwner?.dataset.themeInstance) {
    element.dataset.themeInstance = instanceOwner.dataset.themeInstance;
  }
  annotatedElements.add(element);
}

export function annotateThemeSurfaces(root = document) {
  ROLE_SELECTOR_MAP.forEach(([selector, role]) => {
    root.querySelectorAll(selector).forEach((element) => annotateElement(element, role));
  });
  root.querySelectorAll('[data-theme-role]').forEach((element) => {
    if (!element.closest('[data-theme-studio]') && !element.dataset.themeComponent) {
      element.dataset.themeComponent = componentForElement(element);
    }
  });
}

export function observeThemeSurfaces(root = document) {
  annotateThemeSurfaces(root);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      ROLE_SELECTOR_MAP.forEach(([selector, role]) => {
        if (node.matches(selector)) annotateElement(node, role);
        node.querySelectorAll(selector).forEach((element) => annotateElement(element, role));
      });
    }));
  });
  observer.observe(root.body || root, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function registeredTargetFromElement(element) {
  const registered = element?.closest?.('[data-theme-role]');
  if (!registered || registered.closest('[data-theme-studio]')) return null;
  const role = registered.dataset.themeRole;
  if (!TARGET_REGISTRY[role]) return null;
  return {
    element: registered,
    role,
    componentId: registered.dataset.themeComponent || null,
    instanceId: registered.dataset.themeInstance || null,
    label: TARGET_REGISTRY[role].label,
  };
}

export function clearPickerHighlight(element) {
  if (element) element.removeAttribute('data-theme-picker-hover');
}

export function setPickerHighlight(element) {
  if (element) element.setAttribute('data-theme-picker-hover', 'true');
}

export function cleanupThemeAnnotations() {
  annotatedElements.forEach((element) => {
    if (!element.isConnected) return;
    element.removeAttribute('data-theme-picker-hover');
  });
  annotatedElements.clear();
}
