// Complete editable CSS files, loaded as text without automatically activating every theme.
const sources = import.meta.glob('./AppCombined-THEMEVALUES-*.css', { query: '?raw', import: 'default', eager: true });

export const BUILT_IN_THEME_FILES = Object.freeze({
  "antarctic-teafog": "AppCombined-THEMEVALUES-antarctic-teafog.css",
  "autumn-candle": "AppCombined-THEMEVALUES-autumn-candle.css",
  "burnt-chestnut": "AppCombined-THEMEVALUES-burnt-chestnut.css",
  "caspian-sea": "AppCombined-THEMEVALUES-caspian-sea.css",
  "default": "AppCombined-THEMEVALUES-default.css",
  "glacial-dusk": "AppCombined-THEMEVALUES-glacial-dusk.css",
  "great-wave": "AppCombined-THEMEVALUES-great-wave.css",
  "medieval-taurus": "AppCombined-THEMEVALUES-medieval-taurus.css",
  "mint-icecube": "AppCombined-THEMEVALUES-mint-icecube.css",
  "mistic": "AppCombined-THEMEVALUES-mistic.css",
  "neon-orbi": "AppCombined-THEMEVALUES-neon-orbi.css",
  "pearlescence": "AppCombined-THEMEVALUES-pearlescence.css",
  "peppermint-foil": "AppCombined-THEMEVALUES-peppermint-foil.css",
  "postlinear-glassos": "AppCombined-THEMEVALUES-postlinear-glassos.css",
  "rose-petal": "AppCombined-THEMEVALUES-rose-petal.css",
  "sherbert-sakura": "AppCombined-THEMEVALUES-sherbert-sakura.css",
  "space-glass": "AppCombined-THEMEVALUES-space-glass.css",
  "sunbrocksen": "AppCombined-THEMEVALUES-sunbrocksen.css",
  "verdigris": "AppCombined-THEMEVALUES-verdigris.css",
  "vineyard-gloom": "AppCombined-THEMEVALUES-vineyard-gloom.css",
  "winterbloom": "AppCombined-THEMEVALUES-winterbloom.css",
  "space-ss": "AppCombined-THEMEVALUES-space-ss.css",
  "transparent": "AppCombined-THEMEVALUES-transparent.css"
});

export function getBuiltInThemeFile(id = 'default') {
  return Object.hasOwn(BUILT_IN_THEME_FILES, id) ? BUILT_IN_THEME_FILES[id] : BUILT_IN_THEME_FILES.default;
}

export function getBuiltInThemeCss(id = 'default') {
  return sources[`./${getBuiltInThemeFile(id)}`] || sources['./AppCombined-THEMEVALUES-default.css'] || '';
}
