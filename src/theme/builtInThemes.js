export const BUILT_IN_THEMES = Object.freeze([
  { id: 'antarctic-teafog', label: 'Antarctic Teafog', description: 'Mottled warmth with deep earth tones.', mode: 'dark', immutable: true },
  { id: 'autumn-candle', label: 'Autumn Candle', description: 'Toasty and crackled pastel theme.', mode: 'dark', immutable: true },
  { id: 'burnt-chestnut', label: 'Burnt Chestnut', description: 'A medium-toned spring palette.', mode: 'light', immutable: true },
  { id: 'caspian-sea', label: 'Caspian Sea', description: 'A minimal translucent treatment that reveals the desktop.', mode: 'dark', immutable: true },
  { id: 'default', label: 'Dark Neon', description: 'Default briizOS interface.', mode: 'dark', immutable: true },
  { id: 'glacial-dusk', label: 'Glacial Dusk', description: 'A muted winter palette.', mode: 'dark', immutable: true },
  { id: 'great-wave', label: 'Great Wave', description: 'A muted Kanagawa-inspired palette.', mode: 'dark', immutable: true },
  { id: 'medieval-taurus', label: 'Medieval Taurus', description: 'Rustic gold, leather, and historic earth tones.', mode: 'dark', immutable: true },
  { id: 'mint-icecube', label: 'Mint Icecube', description: 'Frosted mint glass with cool contrast.', mode: 'dark', immutable: true },
  { id: 'mistic', label: 'Mistic', description: 'Smoky purples for a twilight aesthetic.', mode: 'dark', immutable: true },
  { id: 'navy-brockman', label: 'Navy Brockman', description: 'Deep maritime blues with warm contrast.', mode: 'dark', immutable: true },
  { id: 'neon-orbi', label: 'Neon Orb', description: 'A bolder, vibrant multicolor interface.', mode: 'light', immutable: true },
  { id: 'pearlescence', label: 'Pearlescence', description: 'A cool, icy palette.', mode: 'dark', immutable: true },
  { id: 'peppermint-foil', label: 'Peppermint Foil', description: 'Crisp mint tones with reflective metallic details.', mode: 'light', immutable: true },
  { id: 'postlinear-glassos', label: 'Postlinear Glassos', description: 'Splashing gold with rosy dry warmth.', mode: 'dark', immutable: true },
  { id: 'sherbert-sakura', label: 'Sherbert Sakura', description: 'Pastel neon and cherry-blossom color.', mode: 'light', immutable: true },
  { id: 'space-glass', label: 'Space Glass', description: 'Dark space with a twilight hue.', mode: 'dark', immutable: true },
  { id: 'verdigris', label: 'Verdigris', description: 'Tarnished bronze, gold, and oxidized green.', mode: 'dark', immutable: true },
  { id: 'vineyard-gloom', label: 'Vineyard Gloom', description: 'Plush and nightly theme with warm fruit tones.', mode: 'dark', immutable: true },
  { id: 'winterbloom', label: 'Winterbloom', description: 'A wintry night palette with blossom-pink highlights.', mode: 'dark', immutable: true },

]);

export const BUILT_IN_THEME_IDS = new Set(BUILT_IN_THEMES.map((theme) => theme.id));

export function getBuiltInTheme(themeId) {
  return BUILT_IN_THEMES.find((theme) => theme.id === themeId) || null;
}
