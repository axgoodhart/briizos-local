import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { getBuiltInThemeCss } from '../themes/themeFiles';
import structuralCss from '../AppCombined.css?raw';
import { rulesForOverrides } from './themeRuntime';

// Keep the authored tree, including comments, duplicate declarations and conditions.
// CSSOM is used for the current rendered result, never as the serialization format.
const sourceCache = new Map();
const selectorCache = new Map();
const STATE_PSEUDOS = new Set([':hover', ':active', ':focus', ':focus-visible', ':focus-within', ':disabled', ':enabled', ':checked', ':indeterminate', ':visited', ':link', ':target', ':open', ':placeholder-shown', ':autofill', ':-webkit-autofill']);
const COMMON_APPEARANCE = ['color', 'background', 'background-color', 'background-image', 'box-shadow', 'text-shadow', 'border', 'border-color', 'border-width', 'border-style', 'border-radius', 'corner-shape', 'outline', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-decoration', 'text-transform', 'filter', 'backdrop-filter', 'fill', 'stroke'];
const INHERITED_APPEARANCE = new Set(['color', 'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'text-indent', 'text-shadow', 'visibility', 'cursor', 'fill', 'stroke']);
let highlightedElement = null;
let highlightCleanup = null;

function pathId(node) {
  const path = [];
  for (let current = node; current.parent; current = current.parent) path.unshift(current.parent.index(current));
  return path.join('.');
}

function nodeAt(root, id) {
  let node = root;
  for (const index of String(id).split('.')) {
    if (!/^\d+$/.test(index)) return null;
    node = node?.nodes?.[Number(index)];
  }
  return node;
}

function contexts(node) {
  const result = [];
  for (let parent = node.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule') result.unshift({ name: parent.name, params: parent.params });
  }
  return result;
}

function declarationRecord(node) {
  return { id: pathId(node), property: node.prop, value: node.value, important: Boolean(node.important), line: node.source?.start?.line || 1 };
}

function sourceEntry(cssText) {
  const text = String(cssText ?? '');
  if (sourceCache.has(text)) return sourceCache.get(text);
  const root = postcss.parse(text, { from: undefined });
  const variables = new Map();
  const rules = [];
  const references = new Map();
  root.walkDecls((node) => {
    for (const match of node.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const occurrences = references.get(match[1]) || [];
      occurrences.push({ property: node.prop, selector: node.parent.selector || `@${node.parent.name || 'root'}`, line: node.source?.start?.line || 1 });
      references.set(match[1], occurrences);
    }
    if (!node.prop.startsWith('--')) return;
    const variable = variables.get(node.prop) || { name: node.prop, value: '', line: 1, uses: 0, definitions: [] };
    const definition = { ...declarationRecord(node), selector: node.parent.selector || `@${node.parent.name || 'root'}`, conditions: contexts(node), context: contexts(node).map((item) => `@${item.name} ${item.params}`).join(' › ') };
    variable.definitions.push(definition);
    variable.value = node.value;
    variable.line = definition.line;
    variables.set(node.prop, variable);
  });
  root.walkRules((node) => {
    const conditions = contexts(node);
    const declarations = (node.nodes || []).filter((item) => item.type === 'decl').map(declarationRecord);
    if (!declarations.length) return;
    rules.push({ id: pathId(node), selector: node.selector, line: node.source?.start?.line || 1, context: conditions.map((item) => `@${item.name} ${item.params}`).join(' › '), conditions, declarations, keyframe: conditions.some((item) => /keyframes$/i.test(item.name)), nested: node.parent?.type === 'rule' });
  });
  // References without a local definition still matter: layout may supply them.
  for (const [name, uses] of references) {
    const variable = variables.get(name) || { name, value: '', line: uses[0].line, definitions: [] };
    variable.uses = uses.length;
    variable.references = uses;
    variables.set(name, variable);
  }
  const index = { variables: [...variables.values()].sort((a, b) => a.name.localeCompare(b.name)), rules };
  const entry = { root, index };
  if (sourceCache.size >= 3) sourceCache.delete(sourceCache.keys().next().value);
  sourceCache.set(text, entry);
  return entry;
}

export function parseThemeSource(cssText) {
  return sourceEntry(cssText).index;
}

export function getThemeVariableInventory(cssText) {
  return parseThemeSource(cssText).variables;
}

// Keep the editor's theme document separate from the complete app stylesheet.
// A structural definition can be inspected, but an edit becomes a theme-level
// override rather than silently changing the application for every theme.
export function getThemeSourceIndex(cssText) {
  const appearance = parseThemeSource(cssText);
  const structural = parseThemeSource(structuralCss);
  const variables = new Map(appearance.variables.map((item) => [item.name, { ...item, origin: 'Theme' }]));
  for (const item of structural.variables) {
    const existing = variables.get(item.name);
    const definitions = item.definitions.map((definition) => ({
      ...definition,
      id: `structure:${definition.id}`,
      readOnly: true,
      source: 'AppCombined.css',
    }));
    variables.set(item.name, existing
      ? {
        ...existing,
        uses: existing.uses + item.uses,
        structuralUses: item.uses,
        definitions: [...definitions, ...existing.definitions],
        references: [...(item.references || []), ...(existing.references || [])],
      }
      : { ...item, origin: 'Structure', definitions });
  }
  return { ...appearance, variables: [...variables.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

export function materializeThemeCss(theme) {
  if (typeof theme?.cssText === 'string') return theme.cssText;
  const context = theme?.baseThemeId || theme?.id || 'default';
  let cssText = getBuiltInThemeCss(context);
  const variables = { ...(theme?.variables || {}) };
  if (variables['--theme-corner-style'] && !variables['--ui-corner-shape']) {
    variables['--ui-corner-shape'] = ({ soft: 'squircle', rounded: 'round', square: 'square' })[variables['--theme-corner-style']] || variables['--theme-corner-style'];
  }
  if (Object.keys(variables).length) {
    // Legacy globals were inline on <html>; preserve their precedence in a file.
    const declarations = Object.entries(variables).map(([name, value]) => `  ${name}: ${value} !important;`).join('\n');
    cssText += `\n/* Migrated global theme edits */\n:root {\n${declarations}\n}\n`;
  }
  if (theme?.overrides?.length) cssText += `\n/* Migrated object edits */\n${rulesForOverrides(theme.overrides)}\n`;
  return cssText;
}

function readValue(property, value, previousImportance = false) {
  const text = String(value).trim();
  if (!text) return { remove: true };
  const parsed = postcss.parse(`a { ${property}: ${text}; }`, { from: undefined });
  const rule = parsed.first;
  if (parsed.nodes.length !== 1 || rule?.type !== 'rule' || rule.nodes.length !== 1 || rule.first.type !== 'decl' || rule.first.prop !== property) throw new Error('Enter one CSS value for this property.');
  const declaration = rule.first;
  if (typeof CSS !== 'undefined' && !property.startsWith('--') && !CSS.supports(property, declaration.value)) {
    throw new Error(`This browser does not support ${property}: ${declaration.value}. The source editor can retain CSS for another browser.`);
  }
  return { value: declaration.value, important: Boolean(declaration.important || previousImportance) };
}

export function updateSourceDeclaration(cssText, declarationId, value) {
  const root = sourceEntry(cssText).root.clone();
  const node = nodeAt(root, declarationId);
  if (node?.type !== 'decl') throw new Error('This declaration moved after another edit. Select it again.');
  const next = readValue(node.prop, value, node.important);
  if (next.remove) node.remove();
  else { node.value = next.value; node.important = next.important; }
  return root.toString();
}

export function setSourceRule(cssText, selector, property, value, { important = false, conditions = [] } = {}) {
  const enteredName = String(property).trim();
  const name = enteredName.startsWith('--') ? enteredName : enteredName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  if (!/^(?:--[\w-]+|-?[a-z][a-z0-9-]*)$/.test(name)) throw new Error('Enter a CSS property name, such as border-radius or --accent.');
  const selectorText = String(selector).trim();
  if (!selectorText) throw new Error('Choose an element or selector before adding a declaration.');
  selectorParser().astSync(selectorText);
  const selectorProbe = postcss.parse(`${selectorText} { ${name}: initial; }`, { from: undefined });
  if (selectorProbe.nodes.length !== 1 || selectorProbe.first.type !== 'rule' || selectorProbe.first.nodes.length !== 1) throw new Error('Enter one selector, without a declaration block.');
  const root = sourceEntry(cssText).root.clone();
  const next = readValue(name, value, important);
  let container = root;
  for (const condition of conditions) {
    let wrapper = container.nodes?.findLast((node) => node.type === 'atrule' && node.name === condition.name && node.params === condition.params && node.nodes);
    if (!wrapper) {
      wrapper = postcss.atRule({ name: condition.name, params: condition.params, nodes: [], raws: { before: '\n', after: '\n' } });
      container.append(wrapper);
    }
    container = wrapper;
  }
  let rule = container.nodes?.findLast((node) => node.type === 'rule' && node.selector === selectorText && node.raws.briizosEditorRule);
  // Persist the marker in a comment; parsed imports and reloads retain it.
  if (!rule) rule = container.nodes?.findLast((node) => node.type === 'rule' && node.selector === selectorText && node.prev()?.type === 'comment' && node.prev().text === 'Theme Studio object edit');
  if (next.remove) {
    rule?.walkDecls(name, (node) => node.remove());
    return root.toString();
  }
  if (!rule) {
    container.append(postcss.comment({ text: 'Theme Studio object edit', raws: { before: '\n\n' } }));
    rule = postcss.rule({ selector: selectorText, raws: { before: '\n', after: '\n' } });
    container.append(rule);
  }
  const declaration = rule.nodes?.findLast((node) => node.type === 'decl' && node.prop === name);
  if (declaration) { declaration.value = next.value; declaration.important = next.important; }
  else rule.append(postcss.decl({ prop: name, value: next.value, important: next.important, raws: { before: '\n  ' } }));
  return root.toString();
}

function escapeIdentifier(value) {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(String(value)) : String(value).replace(/[^\w-]/g, (character) => `\\${character}`);
}

function quoteAttribute(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r]/g, ' ');
}

function selectable(element) {
  return Boolean(element?.nodeType === 1 && !element.closest?.('[data-theme-studio]') && !['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'TITLE'].includes(element.tagName));
}

function countMatches(doc, selector) {
  try { return doc.querySelectorAll(selector).length; } catch { return 0; }
}

function elementLabel(element) {
  const id = element.id ? `#${element.id}` : '';
  const classes = [...element.classList].filter((name) => !/^(?:active|selected|hover|open|is-)/.test(name)).slice(0, 3).map((name) => `.${name}`).join('');
  return `${element.localName}${id || classes}`;
}

function candidateSelectors(element) {
  const selectors = [];
  if (element.id) selectors.push(`#${escapeIdentifier(element.id)}`);
  for (const attribute of ['data-theme-instance', 'data-panel-id', 'data-note-id', 'data-task-id', 'data-id', 'data-testid', 'name', 'aria-label']) {
    const value = element.getAttribute(attribute);
    if (value) selectors.push(`${element.localName}[${attribute}="${quoteAttribute(value)}"]`);
  }
  const classes = [...element.classList].filter((name) => !/^(?:active|selected|hover|open|is-)/.test(name));
  if (classes.length) selectors.push(classes.map((name) => `.${escapeIdentifier(name)}`).join(''));
  classes.forEach((name) => selectors.push(`.${escapeIdentifier(name)}`));
  if (element.dataset.themeRole) selectors.push(`[data-theme-role="${quoteAttribute(element.dataset.themeRole)}"]`);
  selectors.push(element.localName);
  return [...new Set(selectors)];
}

function uniqueSelector(element) {
  const doc = element.ownerDocument;
  for (const candidate of candidateSelectors(element)) if (countMatches(doc, candidate) === 1) return candidate;
  const path = [];
  for (let current = element; current?.nodeType === 1; current = current.parentElement) {
    const anchor = candidateSelectors(current).find((candidate) => countMatches(doc, candidate) === 1);
    if (anchor && current !== element) return [anchor, ...path].join(' > ');
    let part = current.localName;
    const stableClasses = [...current.classList].filter((name) => !/^(?:active|selected|hover|open|is-)/.test(name));
    if (stableClasses.length) part += stableClasses.map((name) => `.${escapeIdentifier(name)}`).join('');
    if (current.parentElement) {
      const siblings = [...current.parentElement.children].filter((item) => item.localName === current.localName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    path.unshift(part);
    if (countMatches(doc, path.join(' > ')) === 1) return path.join(' > ');
  }
  return path.join(' > ');
}

export function getElementTarget(element) {
  if (!selectable(element)) return null;
  const selector = uniqueSelector(element);
  return { element, label: elementLabel(element), selector, selectors: candidateSelectors(element), role: element.dataset.themeRole || null, componentId: element.dataset.themeComponent || null, instanceId: element.dataset.themeInstance || null };
}

export function navigateThemeElement(element, direction) {
  if (!element) return null;
  if (direction === 'parent') return selectable(element.parentElement) ? element.parentElement : null;
  if (direction === 'child') return [...element.children].find(selectable) || null;
  const property = direction === 'previous' ? 'previousElementSibling' : direction === 'next' ? 'nextElementSibling' : null;
  if (!property) return null;
  for (let sibling = element[property]; sibling; sibling = sibling[property]) if (selectable(sibling)) return sibling;
  return null;
}

export function setSelectionHighlight(element) {
  if (highlightedElement === element) return;
  highlightCleanup?.();
  highlightCleanup = null;
  highlightedElement = selectable(element) ? element : null;
  if (!highlightedElement) return;
  const target = highlightedElement;
  const doc = target.ownerDocument;
  const view = doc.defaultView;
  const outline = doc.createElement('div');
  outline.className = 'theme-source-selection-outline';
  outline.dataset.themeStudio = 'true';
  outline.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(outline);
  let frame = null;
  const draw = () => {
    frame = null;
    const rect = target.getBoundingClientRect();
    outline.hidden = !target.isConnected || !rect.width || !rect.height;
    Object.assign(outline.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  };
  const schedule = () => { if (frame === null) frame = view.requestAnimationFrame(draw); };
  view.addEventListener('scroll', schedule, true);
  view.addEventListener('resize', schedule);
  const observer = new view.ResizeObserver(schedule);
  for (let current = target; current; current = current.parentElement) observer.observe(current);
  const mutationObserver = new view.MutationObserver((changes) => {
    if (changes.some((change) => change.target !== outline && !outline.contains(change.target))) schedule();
  });
  mutationObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
  draw();
  highlightCleanup = () => {
    view.removeEventListener('scroll', schedule, true);
    view.removeEventListener('resize', schedule);
    observer.disconnect();
    mutationObserver.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
    outline.remove();
  };
}

function removeSelectorCondition(node) {
  const before = node.prev();
  const after = node.next();
  if ((!before || before.type === 'combinator') && (!after || after.type === 'combinator')) node.replaceWith(selectorParser.universal({ value: '*' }));
  else node.remove();
}

function selectorVariants(selectorText) {
  if (selectorCache.has(selectorText)) return selectorCache.get(selectorText);
  const variants = [];
  try {
    const parsed = selectorParser().astSync(selectorText);
    parsed.each((selector) => {
      let hasState = false;
      const pseudoElements = [];
      const relaxed = selector.clone();
      const host = selector.clone();
      host.walkPseudos((pseudo) => {
        if (pseudo.value.startsWith('::') || [':before', ':after', ':first-letter', ':first-line'].includes(pseudo.value)) removeSelectorCondition(pseudo);
      });
      if (!host.nodes.length) host.append(selectorParser.universal({ value: '*' }));
      relaxed.walkPseudos((pseudo) => {
        let owner = pseudo;
        while (owner.parent) owner = owner.parent;
        if (owner !== relaxed) return;
        if (pseudo.value.startsWith('::') || [':before', ':after', ':first-letter', ':first-line'].includes(pseudo.value)) {
          pseudoElements.push(pseudo.value.replace(/^:(?!:)/, '::'));
          removeSelectorCondition(pseudo);
        } else if (STATE_PSEUDOS.has(pseudo.value)) {
          hasState = true;
          // A state inside a logical selector makes that whole condition dormant.
          let parent = pseudo.parent;
          let logical = null;
          while (parent && parent !== relaxed) { if (parent.type === 'pseudo') logical = parent; parent = parent.parent; }
          removeSelectorCondition(logical || pseudo);
        }
      });
      if (!relaxed.nodes.length) relaxed.append(selectorParser.universal({ value: '*' }));
      variants.push({ selector: selector.toString(), host: host.toString(), relaxed: relaxed.toString(), hasState, pseudo: pseudoElements.at(-1) || '' });
    });
  } catch { /* Unrecognized future selector syntax remains editable in Sources. */ }
  if (selectorCache.size > 12000) selectorCache.clear();
  selectorCache.set(selectorText, variants);
  return variants;
}

function match(element, selector) {
  try { return element.matches(selector); } catch { return false; }
}

function conditionsActive(conditions, view) {
  let unknown = false;
  for (const condition of conditions) {
    try {
      if (condition.name === 'media' && !view.matchMedia(condition.params).matches) return false;
      if (condition.name === 'supports' && !view.CSS.supports(condition.params)) return false;
      if (['container', 'scope', 'starting-style'].includes(condition.name)) unknown = true;
    } catch { unknown = true; }
  }
  return unknown ? null : true;
}

export function inspectThemeElement(element, cssText, { pseudo = '' } = {}) {
  const target = getElementTarget(element);
  if (!target) return null;
  const view = element.ownerDocument.defaultView;
  const ancestors = [];
  for (let parent = element.parentElement; parent && selectable(parent); parent = parent.parentElement) ancestors.unshift({ label: elementLabel(parent), element: parent });
  const matchedRules = [];
  const inheritedRules = [];
  for (const rule of parseThemeSource(cssText).rules) {
    if (rule.keyframe || rule.nested) continue;
    const variants = selectorVariants(rule.selector);
    const matching = variants.filter((variant) => (!pseudo || variant.pseudo === pseudo) && (match(element, variant.selector) || match(element, variant.relaxed)));
    if (!matching.length) {
      const declarations = rule.declarations.filter((declaration) => INHERITED_APPEARANCE.has(declaration.property));
      if (declarations.length && !pseudo) {
        const ancestor = [...ancestors].reverse().find((parent) => variants.some((variant) => !variant.pseudo && match(parent.element, variant.host)));
        if (ancestor) inheritedRules.push({ ...rule, declarations, inherited: true, inheritedFrom: ancestor.label, active: conditionsActive(rule.conditions, view) });
      }
      continue;
    }
    const condition = conditionsActive(rule.conditions, view);
    const direct = matching.some((variant) => match(element, variant.host));
    matchedRules.push({ ...rule, active: condition === false ? false : direct ? condition : false, state: matching.some((variant) => variant.hasState), pseudo: matching.find((variant) => variant.pseudo)?.pseudo || '', matchCount: Math.max(...matching.map((variant) => countMatches(element.ownerDocument, variant.relaxed))) });
  }
  const computed = view.getComputedStyle(element, pseudo || null);
  const names = new Set(COMMON_APPEARANCE);
  matchedRules.forEach((rule) => rule.declarations.forEach((declaration) => names.add(declaration.property)));
  const properties = [...names].map((property) => ({ property, value: computed.getPropertyValue(property).trim() })).filter((property) => property.value);
  const inline = [...element.style].map((property) => ({ property, value: element.style.getPropertyValue(property), important: element.style.getPropertyPriority(property) === 'important' }));
  const warnings = [];
  if (target.selector.includes(':nth-of-type(')) warnings.push('This element has no unique saved identifier. Its individual selector follows its position; use a class selector to keep edits attached when a list is reordered.');
  if (inline.length) warnings.push('This element also has styles supplied by the app. Source rows show theme rules; Rendered values show the final result. Use an important object edit when an inline appearance value must be overridden.');
  if (matchedRules.some((rule) => rule.active === null)) warnings.push('Container and scope conditions are shown in the source; Rendered values reflect whether they currently apply.');
  return { ...target, ancestors, properties, rules: [...matchedRules, ...inheritedRules], inline, warning: warnings.join(' '), inheritedFrom: ancestors.at(-1)?.label || null };
}
