// Small helpers shared by the Island store and components.
import { ACCENTS, GRID, MEDIA_TYPES } from './catalog';

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const snap = (value) => Math.round(value / GRID) * GRID;
export const dedupe = (values = []) => [...new Set(values.filter(Boolean))];
export const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

export function cleanTag(value) {
  return normalizeText(value).replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '').slice(0, 32);
}

// One stem per idea: "color", "colors", "colorful", "coloring" all stem to "color".
const STEM_KEEP = new Set(['news', 'series', 'species', 'analysis', 'business', 'canvas', 'chess', 'glass', 'bass', 'css', 'ios', 'macos', 'sass', 'less', 'process', 'access']);
function stemWord(word) {
  let w = word;
  if (w.length <= 3 || STEM_KEEP.has(w)) return w;
  if (w.endsWith('ies') && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (w.endsWith('es') && /[sxz]es$|[cs]hes$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) w = w.slice(0, -1);
  for (const suffix of ['fulness', 'ousness', 'iveness', 'ation', 'fully', 'ness', 'ment', 'able', 'ible', 'ical', 'ious', 'ful', 'ing', 'ous', 'ive', 'ist', 'ism', 'ity', 'ise', 'ize', 'ers', 'er', 'ed', 'ly', 'al', 'ic', 'y']) {
    if (w.length - suffix.length >= 4 && w.endsWith(suffix)) { w = w.slice(0, -suffix.length); break; }
  }
  if (w.endsWith('i')) w = `${w.slice(0, -1)}y`;
  return w.replace(/([a-z])\1$/, '$1');
}
export function tagStem(tag) {
  return cleanTag(tag).split(/[-._]+/).filter(Boolean).map(stemWord).sort().join('-');
}

// Picks the form already in use for the same idea, else the cleaned tag itself.
// `vocabulary` is a Map of tag → count (or any iterable of tags).
export function canonicalTag(raw, vocabulary) {
  const tag = cleanTag(String(raw).replace(/^#/, ''));
  if (!tag) return '';
  const stem = tagStem(tag);
  let best = null;
  let bestCount = -1;
  const entries = vocabulary instanceof Map ? vocabulary.entries() : [...(vocabulary || [])].map((t) => [t, 1]);
  for (const [known, count] of entries) {
    if (known === tag) return tag;
    if (tagStem(known) !== stem) continue;
    if (count > bestCount || (count === bestCount && known.length < best.length)) { best = known; bestCount = count; }
  }
  return best || tag;
}

export function hashString(value) {
  let hash = 2166136261;
  const input = String(value ?? '');
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function accentForSeed(seed) {
  return ACCENTS[hashString(seed) % ACCENTS.length];
}

export function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return '22,199,132';
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(',');
}

export function formatBytes(bytes = 0) {
  let size = Number(bytes) || 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function relativeTime(input) {
  const time = new Date(input).getTime();
  if (!Number.isFinite(time)) return 'never';
  const diff = Date.now() - time;
  const minute = 60000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.round(diff / minute)} min ago`;
  if (diff < day) return `${Math.round(diff / hour)} h ago`;
  if (diff < 2 * day) return 'yesterday';
  if (diff < 14 * day) return `${Math.round(diff / day)} days ago`;
  if (diff < 60 * day) return `${Math.round(diff / (7 * day))} weeks ago`;
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))} months ago`;
  return `${Math.round(diff / (365 * day))} years ago`;
}

export function clockTime(input) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function isoDay(input = new Date()) {
  const date = new Date(input);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toFileUrl(filePath = '') {
  let value = String(filePath).replace(/\\/g, '/');
  if (!value.startsWith('/')) value = `/${value}`;
  return encodeURI(`file://${value}`).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

const VIDEO_EXTS = new Set(['mp4', 'mov', 'm4v', 'webm']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'aiff', 'aac', 'ogg', 'm4a', 'flac']);
export const isVideo = (file) => VIDEO_EXTS.has(String(file?.ext || '').toLowerCase());
export const isAudio = (file) => AUDIO_EXTS.has(String(file?.ext || '').toLowerCase());
export const isMediaFile = (file) => MEDIA_TYPES.has(file?.typeGroup) || isVideo(file) || isAudio(file);

export function fileBadge(file) {
  const ext = String(file?.ext || '').toUpperCase();
  if (ext && ext.length <= 4) return ext;
  return file?.typeGroup === 'folder' ? 'DIR' : 'FILE';
}

export function money(amount, currency = '$') {
  const value = Number(amount) || 0;
  const sign = value < 0 ? '−' : '';
  return `${sign}${currency}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function rectsOverlap(a, b, gap = 0) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

export function whenShort(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return clockTime(date);
  return date.toLocaleDateString([], date.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}
