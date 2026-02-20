/**
 * Memory system utilities for chat log minification and chunking.
 */

/**
 * Minify chat text — strip markdown formatting, preserve code blocks/inline code.
 */
export function minifyChatText(text) {
  const codeBlocks = [];
  let result = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  const inlineCode = [];
  result = result.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_CODE_${inlineCode.length - 1}__`;
  });

  result = result
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n')
    .replace(/[ \t]+$/gm, '');

  codeBlocks.forEach((block, i) => {
    result = result.replace(`__CODE_BLOCK_${i}__`, block);
  });
  inlineCode.forEach((code, i) => {
    result = result.replace(`__INLINE_CODE_${i}__`, code);
  });

  return result.trim();
}

/**
 * Get the chunk filename for the current time.
 * 6-hour UTC blocks: 00, 06, 12, 18
 */
export function getChunkFilename(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = Math.floor(date.getUTCHours() / 6) * 6;
  return `${y}-${m}-${d}_${String(h).padStart(2, '0')}.txt`;
}

/**
 * Format a compact timestamp prefix.
 * Format: [MMDDTHHMM|R] where R is U(ser) or A(ssistant)
 */
export function formatLogPrefix(role, date = new Date()) {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const r = role === 'user' ? 'U' : 'A';
  return `[${m}${d}T${h}${min}|${r}]`;
}
