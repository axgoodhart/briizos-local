const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const toRadians = (degrees) => (degrees * Math.PI) / 180;
const normalizeHue = (hue) => ((hue % 360) + 360) % 360;

function hexChannel(value) {
  return Math.round(clamp(value) * 255).toString(16).padStart(2, '0');
}

export function hexToSrgb(hex) {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3 ? normalized.split('').map((part) => part + part).join('') : normalized;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) throw new Error('Expected a six-digit hexadecimal color.');
  return {
    r: Number.parseInt(expanded.slice(0, 2), 16) / 255,
    g: Number.parseInt(expanded.slice(2, 4), 16) / 255,
    b: Number.parseInt(expanded.slice(4, 6), 16) / 255,
  };
}

export function srgbToHex({ r, g, b }) {
  return `#${hexChannel(r)}${hexChannel(g)}${hexChannel(b)}`;
}

const srgbToLinear = (channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const linearToSrgb = (channel) => channel <= 0.0031308 ? 12.92 * channel : 1.055 * (channel ** (1 / 2.4)) - 0.055;

export function srgbToOklab({ r, g, b, alpha = 1 }) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    alpha,
  };
}

export function oklabToSrgb({ L, a, b, alpha = 1 }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha,
  };
}

export function oklabToOklch({ L, a, b, alpha = 1 }) {
  return { L, C: Math.sqrt(a * a + b * b), h: normalizeHue(Math.atan2(b, a) * 180 / Math.PI), alpha };
}

export function oklchToOklab({ L, C, h, alpha = 1 }) {
  return { L, a: C * Math.cos(toRadians(h)), b: C * Math.sin(toRadians(h)), alpha };
}

export function hexToOklch(hex) {
  return oklabToOklch(srgbToOklab(hexToSrgb(hex)));
}

function inGamut({ r, g, b }) {
  return r >= -0.00001 && r <= 1.00001 && g >= -0.00001 && g <= 1.00001 && b >= -0.00001 && b <= 1.00001;
}

export function gamutSafeOklch(color) {
  const normalized = { L: clamp(color.L), C: Math.max(0, color.C), h: normalizeHue(color.h), alpha: color.alpha ?? 1 };
  let rgb = oklabToSrgb(oklchToOklab(normalized));
  if (inGamut(rgb)) return { ...rgb, r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) };
  let low = 0;
  let high = normalized.C;
  for (let index = 0; index < 24; index += 1) {
    const candidate = { ...normalized, C: (low + high) / 2 };
    rgb = oklabToSrgb(oklchToOklab(candidate));
    if (inGamut(rgb)) low = candidate.C;
    else high = candidate.C;
  }
  rgb = oklabToSrgb(oklchToOklab({ ...normalized, C: low }));
  return { ...rgb, r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) };
}

export function oklchToHex(color) {
  return srgbToHex(gamutSafeOklch(color));
}

export function perceptualDistance(first, second) {
  const a = typeof first === 'string' ? srgbToOklab(hexToSrgb(first)) : oklchToOklab(first);
  const b = typeof second === 'string' ? srgbToOklab(hexToSrgb(second)) : oklchToOklab(second);
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

export function nearestColor(target, colors) {
  return colors.reduce((nearest, color) => {
    const distance = perceptualDistance(target, color);
    return !nearest || distance < nearest.distance ? { color, distance } : nearest;
  }, null)?.color || null;
}

export function alignOklchToAnchor(colors, anchor) {
  const anchorLch = typeof anchor === 'string' ? hexToOklch(anchor) : anchor;
  const nearest = nearestColor(anchorLch, colors);
  const nearestLch = typeof nearest === 'string' ? hexToOklch(nearest) : nearest;
  const hueDrift = anchorLch.h - nearestLch.h;
  const chromaScale = nearestLch.C ? anchorLch.C / nearestLch.C : 1;
  return colors.map((color) => {
    const source = typeof color === 'string' ? hexToOklch(color) : color;
    return { ...source, C: source.C * chromaScale, h: normalizeHue(source.h + hueDrift) };
  });
}

export function alignToAnchor(colors, anchorHex) {
  return alignOklchToAnchor(colors, anchorHex).map(oklchToHex);
}

export function driftOklch(color, { temperature = 0, lightness = 0, chroma = 0 } = {}) {
  const source = typeof color === 'string' ? hexToOklch(color) : color;
  const warmTarget = source.h < 180 ? 55 : 235;
  const hueDistance = ((warmTarget - source.h + 540) % 360) - 180;
  return {
    ...source,
    L: clamp(source.L + lightness),
    C: Math.max(0, source.C + chroma),
    h: normalizeHue(source.h + hueDistance * clamp(temperature, -100, 100) / 500),
  };
}

export function createSeededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToSrgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function ensureContrast(foreground, background, minimum = 4.5) {
  if (contrastRatio(foreground, background) >= minimum) return foreground;
  const bg = hexToOklch(background);
  const fg = hexToOklch(foreground);
  const direction = bg.L > 0.5 ? -1 : 1;
  for (let index = 0; index <= 100; index += 1) {
    const candidate = oklchToHex({ ...fg, L: clamp(fg.L + direction * index / 100) });
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return bg.L > 0.5 ? '#111111' : '#f7f7f5';
}

const HARMONY_OFFSETS = {
  analogous: [0, 32, -32],
  complementary: [0, 180, 24],
  'split-complementary': [0, 150, 210],
  triadic: [0, 120, 240],
};

export const DEFAULT_GENERATOR_SETTINGS = Object.freeze({
  mode: 'dark', primaryAnchor: '#d4a373', secondaryAnchor: '', harmony: 'analogous',
  temperature: 0, saturation: 58, contrast: 68, glowStrength: 22,
  material: 'inherit', seed: 1842,
});

export function generateTheme(settings = {}) {
  const input = { ...DEFAULT_GENERATOR_SETTINGS, ...settings };
  const random = createSeededRandom(input.seed);
  const primary = hexToOklch(input.primaryAnchor);
  const offsets = HARMONY_OFFSETS[input.harmony] || HARMONY_OFFSETS.analogous;
  const temperatureDrift = clamp(Number(input.temperature), -100, 100) * -0.18;
  const randomDrift = (random() - 0.5) * 18;
  const hues = offsets.map((offset) => normalizeHue(primary.h + offset + temperatureDrift + randomDrift));
  if (input.secondaryAnchor) hues[1] = hexToOklch(input.secondaryAnchor).h;
  const chroma = 0.04 + clamp(Number(input.saturation), 0, 100) / 100 * 0.19;
  const accentLightness = input.mode === 'light' ? 0.52 : 0.76;
  const accents = hues.map((h, index) => oklchToHex({ L: clamp(accentLightness + index * 0.035), C: chroma * (1 - index * 0.12), h }));
  const baseLadder = input.mode === 'light' ? [0.91, 0.95, 0.98, 0.94, 0.88] : [0.10, 0.13, 0.16, 0.20, 0.24];
  const contrastScale = 0.72 + clamp(Number(input.contrast), 0, 100) / 100 * 0.56;
  const ladderCenter = input.mode === 'light' ? 0.94 : 0.16;
  const ladder = baseLadder.map((lightness) => clamp(ladderCenter + (lightness - ladderCenter) * contrastScale));
  const tintChroma = 0.012 + chroma * 0.05;
  const surfaces = ladder.map((L, index) => oklchToHex({ L, C: tintChroma * (1 - index * 0.08), h: primary.h }));
  const textSeed = input.mode === 'light' ? '#22211f' : '#f5f3ef';
  const textStrong = ensureContrast(textSeed, surfaces[0], 4.5);
  const textLch = hexToOklch(textStrong);
  const text = [0, 0.08, 0.17, 0.27, 0.38].map((drift, index) => {
    const candidate = oklchToHex({ ...textLch, L: clamp(textLch.L + (input.mode === 'light' ? drift : -drift)), C: Math.min(textLch.C, 0.025) });
    return index < 3 ? ensureContrast(candidate, surfaces[0], 4.5) : candidate;
  });
  const statusL = input.mode === 'light' ? 0.48 : 0.72;
  const statusC = input.mode === 'light' ? 0.14 : 0.16;
  const material = {};
  if (input.material === 'flat') material.panel = surfaces[2];
  if (input.material === 'layered') material.panel = `linear-gradient(160deg, ${surfaces[3]} 0%, ${surfaces[2]} 54%, ${surfaces[1]} 100%)`;
  if (input.material === 'glass') material.panel = `linear-gradient(145deg, color-mix(in srgb, ${surfaces[4]} 78%, transparent), color-mix(in srgb, ${surfaces[1]} 88%, transparent))`;
  return {
    settings: input,
    globals: {
      canvas: surfaces[0], recessed: surfaces[1], ...material, elevated: surfaces[3], overlay: surfaces[4],
      textStrong: text[0], textPrimary: text[1], textSoft: text[2], textMuted: text[3], textFaint: text[4],
      primary: accents[0], secondary: accents[1], tertiary: accents[2], accentSoft: oklchToHex({ L: accentLightness, C: chroma * 0.35, h: hues[0] }),
      success: oklchToHex({ L: statusL, C: statusC, h: 145 }),
      warning: oklchToHex({ L: statusL + 0.05, C: statusC, h: 86 }),
      danger: oklchToHex({ L: statusL, C: statusC, h: 28 }),
      border: oklchToHex({ L: input.mode === 'light' ? 0.76 : 0.32, C: 0.035, h: hues[0] }),
      borderStrong: ensureContrast(accents[0], surfaces[0], 3), glowColor: accents[0], glowStrength: input.glowStrength,
      panelRadius: input.material === 'flat' ? 4 : input.material === 'glass' ? 18 : 10,
      controlRadius: input.material === 'flat' ? 3 : 8,
    },
    warnings: contrastRatio(text[1], surfaces[0]) < 4.5 ? ['Primary text needed contrast correction.'] : [],
  };
}

export function surpriseGeneratorSettings(settings = {}) {
  const seed = Math.floor(Math.random() * 2147483646) + 1;
  const random = createSeededRandom(seed);
  const harmonies = Object.keys(HARMONY_OFFSETS);
  const materials = ['inherit', 'flat', 'layered', 'glass'];
  const hue = random() * 360;
  return {
    ...DEFAULT_GENERATOR_SETTINGS,
    ...settings,
    seed,
    primaryAnchor: oklchToHex({ L: settings.mode === 'light' ? 0.58 : 0.72, C: 0.12 + random() * 0.12, h: hue }),
    secondaryAnchor: random() > 0.58 ? oklchToHex({ L: 0.7, C: 0.13, h: hue + 90 + random() * 120 }) : '',
    harmony: harmonies[Math.floor(random() * harmonies.length)],
    temperature: Math.round(random() * 160 - 80),
    saturation: Math.round(38 + random() * 58),
    contrast: Math.round(52 + random() * 44),
    glowStrength: Math.round(random() * 42),
    material: materials[Math.floor(random() * materials.length)],
  };
}
