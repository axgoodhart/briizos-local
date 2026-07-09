/* ============================================================================
   briizOS — Consolidated Theme Core
   ----------------------------------------------------------------------------
   Every theme in the original app carried ~326 CSS variables. Clustering them
   by value shows only ~25-35 distinct colors per theme, most of them the same
   base color repeated at different alphas. This file collapses that to a single
   source of truth: 22 tokens per theme. Alpha ramps + gradients + glows are
   DERIVED from these in styles.css via color-mix(), so nothing hardcodes a
   color twice.
   ========================================================================== */

// ---- Token schema: drives the Studio control panel -------------------------
const TOKEN_GROUPS = [
  {
    label: 'Type & Shape',
    tokens: [
      { key: '--font-display', name: 'Display font', type: 'font' },
      { key: '--font-ui',      name: 'UI font',      type: 'font' },
      { key: '--radius',       name: 'Panel radius', type: 'range', min: 0, max: 26, unit: 'px' },
      { key: '--radius-btn',   name: 'Button radius', type: 'range', min: 0, max: 26, unit: 'px' },
      {key: '--corner',       name: 'Panel corners', type: 'list', opts: ['none', 'squared', 'rounded', 'squircle', 'bevel', 'scoop', 'cutout'] },
      { key: '--glow-size',    name: 'Neon glow',    type: 'range', min: 0, max: 26, unit: 'px' },
    ],
  },
  {
    label: 'Backgrounds',
    tokens: [
      { key: '--bg',        name: 'App base',      type: 'color' },
      { key: '--surface',   name: 'Panel',         type: 'color' },
      { key: '--surface-2', name: 'Elevated',      type: 'color' },
      { key: '--header-bg', name: 'Header / bar',   type: 'color' },
    ],
  },
  {
    label: 'Line & Text',
    tokens: [
      { key: '--border',     name: 'Hairline',    type: 'color' },
      { key: '--text',       name: 'Text',        type: 'color' },
      { key: '--text-dim',   name: 'Text dim',    type: 'color' },
      { key: '--text-faint', name: 'Text faint',  type: 'color' },
      { key: '--ink',        name: 'Max contrast', type: 'color' },
    ],
  },
  {
    label: 'Accents',
    tokens: [
      { key: '--accent',      name: 'Primary',    type: 'color' },
      { key: '--accent-2',    name: 'Secondary',  type: 'color' },
      { key: '--accent-3',    name: 'Tertiary',   type: 'color' },
      { key: '--accent-soft', name: 'Soft fill',  type: 'color' },
      { key: '--glow',        name: 'Glow hue',   type: 'color' },
    ],
  },
  {
    label: 'Semantic',
    tokens: [
      { key: '--success', name: 'Success', type: 'color' },
      { key: '--warning', name: 'Warning', type: 'color' },
      { key: '--danger',  name: 'Danger',  type: 'color' },
    ],
  },
];

const ALL_KEYS = TOKEN_GROUPS.flatMap(g => g.tokens.map(t => t.key));

const FONTS = [
  'Chillax', 'Adso', 'Jost', 'Afacad Flux', 'Zen Dots',
  'Orbitron', 'Warbler Variable', 'DM Mono', 'Major Mono Display',
];

// ---- Presets: each is ONLY these 22 tokens ---------------------------------
const PRESETS = {
  phantom: {
    name: 'Phantom', mode: 'dark',
    '--font-display': 'Warbler Variable', '--font-ui': 'Chillax',
    '--radius': '6px', '--radius-btn': '20px', '--glow-size': '9px',
    '--bg': '#05070a', '--surface': '#0a0d12', '--surface-2': '#111820', '--header-bg': '#04070b',
    '--border': '#1b2a2f', '--text': '#d7f7e8', '--text-dim': '#7d8b84', '--text-faint': '#465650', '--ink': '#eafff7',
    '--accent': '#00e5c7', '--accent-2': '#ff2e88', '--accent-3': '#b6ff3c', '--accent-soft': '#1f6f63', '--glow': '#00e5c7',
    '--success': '#46e08a', '--warning': '#ffd54f', '--danger': '#ff5b6b',
  },
  winterbloom: {
    name: 'Winterbloom', mode: 'dark',
    '--font-display': 'Adso', '--font-ui': 'Chillax',
    '--radius': '12px', '--radius-btn': '12px', '--glow-size': '16px',
    '--bg': '#020205', '--surface': '#0c0a1a', '--surface-2': '#14102a', '--header-bg': '#0a0a14',
    '--border': '#2a1f45', '--text': '#f0f0ff', '--text-dim': '#948b9b', '--text-faint': '#5a5260', '--ink': '#ffffff',
    '--accent': '#00f7ff', '--accent-2': '#ff00e5', '--accent-3': '#00ff9d', '--accent-soft': '#7b2cbf', '--glow': '#7b2cbf',
    '--success': '#00ffa3', '--warning': '#ffbe0b', '--danger': '#ff0054',
  },
  antarctic: {
    name: 'Antarctic Teafog', mode: 'light',
    '--font-display': 'Afacad Flux', '--font-ui': 'Jost',
    '--radius': '3px', '--radius-btn': '6px', '--glow-size': '0px',
    '--bg': '#dfe7ea', '--surface': '#eef3f4', '--surface-2': '#ffffff', '--header-bg': '#e6edee',
    '--border': '#c2d2d5', '--text': '#14343a', '--text-dim': '#4a6a70', '--text-faint': '#8aa2a6', '--ink': '#0b2226',
    '--accent': '#0f8a8a', '--accent-2': '#e0736a', '--accent-3': '#3a9f9a', '--accent-soft': '#a9d6d2', '--glow': '#0f8a8a',
    '--success': '#2f9e6a', '--warning': '#d9a441', '--danger': '#d64550',
  },
  navy: {
    name: 'Navy Brockman', mode: 'dark',
    '--font-display': 'Warbler Variable', '--font-ui': 'Chillax',
    '--radius': '8px', '--radius-btn': '10px', '--glow-size': '6px',
    '--bg': '#071225', '--surface': '#0b1a33', '--surface-2': '#102544', '--header-bg': '#081428',
    '--border': '#1e3556', '--text': '#dbe6f5', '--text-dim': '#8aa0c0', '--text-faint': '#566a88', '--ink': '#ffffff',
    '--accent': '#f4b942', '--accent-2': '#5aa0ff', '--accent-3': '#f47a5a', '--accent-soft': '#24406e', '--glow': '#f4b942',
    '--success': '#4fd08a', '--warning': '#f4b942', '--danger': '#ff6b6b',
  },
  chestnut: {
    name: 'Burnt Chestnut', mode: 'dark',
    '--font-display': 'Warbler Variable', '--font-ui': 'Jost',
    '--radius': '10px', '--radius-btn': '14px', '--glow-size': '4px',
    '--bg': '#1a0f0c', '--surface': '#2a1815', '--surface-2': '#38221d', '--header-bg': '#1f110d',
    '--border': '#4a2f28', '--text': '#f0ead6', '--text-dim': '#b89b86', '--text-faint': '#7a6255', '--ink': '#fff6e8',
    '--accent': '#e08a5a', '--accent-2': '#d4a94a', '--accent-3': '#a3b86a', '--accent-soft': '#582c2b', '--glow': '#e08a5a',
    '--success': '#9bbf6a', '--warning': '#e0b24a', '--danger': '#d9584a',
  },
  greatwave: {
    name: 'Great Wave', mode: 'dark',
    '--font-display': 'Afacad Flux', '--font-ui': 'Chillax',
    '--radius': '7px', '--radius-btn': '12px', '--glow-size': '5px',
    '--bg': '#0b1a2a', '--surface': '#10263b', '--surface-2': '#163149', '--header-bg': '#0c1f30',
    '--border': '#22475a', '--text': '#dfeef0', '--text-dim': '#8fb0b6', '--text-faint': '#566f75', '--ink': '#f2fbfc',
    '--accent': '#4aa3a0', '--accent-2': '#e8c86a', '--accent-3': '#5a86c9', '--accent-soft': '#24505a', '--glow': '#4aa3a0',
    '--success': '#5abf9a', '--warning': '#e8c86a', '--danger': '#d97a6a',
  },
  neonorbi: {
    name: 'Neon Orbi', mode: 'dark',
    '--font-display': 'Orbitron', '--font-ui': 'Adso',
    '--radius': '20px', '--radius-btn': '22px', '--glow-size': '22px',
    '--bg': '#05050a', '--surface': '#0b0a12', '--surface-2': '#12101c', '--header-bg': '#08060f',
    '--border': '#33153a', '--text': '#ffe6f7', '--text-dim': '#b070a0', '--text-faint': '#6a4a66', '--ink': '#ffffff',
    '--accent': '#ff2eea', '--accent-2': '#00e5ff', '--accent-3': '#ff9e00', '--accent-soft': '#7a1060', '--glow': '#ff2eea',
    '--success': '#00ffa3', '--warning': '#ffcf00', '--danger': '#ff2e5b',
  },
  peppermint: {
    name: 'Peppermint Foil', mode: 'light',
    '--font-display': 'Zen Dots', '--font-ui': 'Jost',
    '--radius': '10px', '--radius-btn': '16px', '--glow-size': '0px',
    '--bg': '#eef2f0', '--surface': '#ffffff', '--surface-2': '#f4f8f6', '--header-bg': '#e8efeb',
    '--border': '#cdddd4', '--text': '#143024', '--text-dim': '#4a6a58', '--text-faint': '#8aa89a', '--ink': '#0a1c14',
    '--accent': '#d92b3d', '--accent-2': '#1f9e57', '--accent-3': '#2a6fdb', '--accent-soft': '#f2c9cd', '--glow': '#d92b3d',
    '--success': '#1f9e57', '--warning': '#e0a838', '--danger': '#d92b3d',
  },
};

/* ---------------------------------------------------------------------------
   Color helpers for the generator
   ------------------------------------------------------------------------- */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ---------------------------------------------------------------------------
   Generator: builds a NEW, harmonious, well-differentiated theme from scratch.
   Picks a base hue + harmony scheme + light/dark mood, then derives all 22
   tokens with sensible contrast. This is how you "generate new looks."
   ------------------------------------------------------------------------- */
function generateTheme(seedName) {
  const baseHue = Math.floor(rand(0, 360));
  const scheme = pick([
    { name: 'triad',       offs: [0, 120, 240] },
    { name: 'complement',  offs: [0, 180, 60] },
    { name: 'analogous',   offs: [0, 40, -40] },
    { name: 'split',       offs: [0, 150, 210] },
  ]);
  const dark = Math.random() > 0.28;
  const sat = rand(55, 92);
  const glow = pick(['0px', '0px', '5px', '9px', '14px', '20px']);
  const isNeon = parseInt(glow) >= 12;

  const accL = dark ? rand(55, 66) : rand(42, 52);
  const accent   = hslToHex(baseHue + scheme.offs[0], sat, accL);
  const accent2  = hslToHex(baseHue + scheme.offs[1], sat, accL);
  const accent3  = hslToHex(baseHue + scheme.offs[2], sat * 0.9, accL);
  const accentSoft = hslToHex(baseHue + scheme.offs[0], sat * 0.7, dark ? 34 : 78);

  const bgL      = dark ? rand(4, 8)  : rand(90, 94);
  const bg       = hslToHex(baseHue, dark ? 30 : 22, bgL);
  const surface  = hslToHex(baseHue, dark ? 28 : 18, bgL + (dark ? 4 : 3));
  const surface2 = hslToHex(baseHue, dark ? 26 : 14, bgL + (dark ? 8 : 6));
  const headerBg = hslToHex(baseHue, dark ? 32 : 20, bgL + (dark ? 1 : 1.5));
  const border   = hslToHex(baseHue, dark ? 30 : 22, dark ? 22 : 78);

  const text     = hslToHex(baseHue, dark ? 18 : 30, dark ? 90 : 16);
  const textDim  = hslToHex(baseHue, dark ? 14 : 22, dark ? 62 : 38);
  const textFaint= hslToHex(baseHue, dark ? 12 : 18, dark ? 40 : 60);
  const ink      = dark ? '#ffffff' : hslToHex(baseHue, 30, 9);

  return {
    name: seedName || 'Generated ' + baseHue + '°',
    mode: dark ? 'dark' : 'light',
    '--font-display': pick(['Chillax', 'Adso', 'Afacad Flux', 'Zen Dots', 'Orbitron', 'Warbler Variable']),
    '--font-ui': pick(['Chillax', 'Jost', 'Adso']),
    '--radius': Math.round(rand(2, 20)) + 'px',
    '--radius-btn': Math.round(rand(4, 24)) + 'px',
    '--glow-size': glow,
    '--bg': bg, '--surface': surface, '--surface-2': surface2, '--header-bg': headerBg,
    '--border': border, '--text': text, '--text-dim': textDim, '--text-faint': textFaint, '--ink': ink,
    '--accent': accent, '--accent-2': accent2, '--accent-3': accent3, '--accent-soft': accentSoft,
    '--glow': isNeon ? accent : accent2,
    '--success': hslToHex(145, 65, dark ? 58 : 42),
    '--warning': hslToHex(45, 90, dark ? 60 : 48),
    '--danger':  hslToHex(puppy(baseHue), 80, dark ? 62 : 50),
  };
}
// keep danger reddish but nudge slightly per-theme so it isn't identical everywhere
function puppy(h){ return 350 + ((h % 20) - 10) * 0.6; }

/* ---------------------------------------------------------------------------
   Export: emit a clean :root[data-theme] block — the whole theme in 22 lines.
   ------------------------------------------------------------------------- */
function themeToCSS(theme, slug) {
  const id = (slug || (theme.name || 'custom')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let out = `:root[data-theme='${id}'] {\n`;
  out += `  /* ${theme.name} — ${theme.mode} — 22 tokens, everything else derives */\n`;
  for (const g of TOKEN_GROUPS) {
    out += `\n  /* ${g.label} */\n`;
    for (const t of g.tokens) {
      const v = theme[t.key];
      if (v != null) out += `  ${t.key}: ${v};\n`;
    }
  }
  out += `}\n`;
  return out;
}

window.BRIIZ = { TOKEN_GROUPS, ALL_KEYS, FONTS, PRESETS, generateTheme, themeToCSS };
