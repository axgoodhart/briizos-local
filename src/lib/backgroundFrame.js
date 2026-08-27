import logger from './logger';

/**
 * Push the parent document's computed :root custom properties into a
 * background iframe's own document. Iframes don't inherit the parent's CSSOM,
 * so without this the var(--token, fallback) references inside
 * assets/backgrounds/*.html always fall back.
 *
 * Collects every custom-property name declared on :root /
 * :root[data-theme=...] across same-origin stylesheets, then writes the
 * *computed* (theme-resolved) value for each into a <style id="theme-tokens">
 * element in the frame.
 */
export function syncThemeTokensIntoFrame(iframe) {
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument;
    if (!doc || !doc.head) return;

    const propNames = new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin sheet, skip
      }
      if (!rules) continue;
      for (const rule of rules) {
        const selector = rule.selectorText;
        if (!selector || !selector.includes(':root')) continue;
        const style = rule.style;
        if (!style) continue;
        for (let i = 0; i < style.length; i++) {
          const name = style[i];
          if (name.startsWith('--')) propNames.add(name);
        }
      }
    }
    if (propNames.size === 0) return;

    const computed = getComputedStyle(document.documentElement);
    const cssText = Array.from(propNames)
      .map((name) => `  ${name}: ${computed.getPropertyValue(name).trim()};`)
      .join('\n');

    let styleEl = doc.getElementById('theme-tokens');
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = 'theme-tokens';
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root {\n${cssText}\n}`;
  } catch (error) {
    logger.error('ui', 'Failed to sync theme tokens into background iframe', error?.message);
  }
}

export default syncThemeTokensIntoFrame;
