export const BUILT_IN_THEMES = Object.freeze([
  { id: 'default', label: 'Dark Neon', description: 'The original dark neon briizOS interface.', mode: 'dark', immutable: true },
  { id: 'antarctic-teafog', label: 'Antarctic Teafog', description: 'Muted warmth with cool earth tones.', mode: 'dark', immutable: true },
  { id: 'postlinear-glassos', label: 'Postlinear Glassos', description: 'Splashing gold with rosy dry warmth.', mode: 'dark', immutable: true },
  { id: 'neon-orbi', label: 'Neon Orb', description: 'A flatter, soft-hue multicolor interface.', mode: 'dark', immutable: true },
  { id: 'winterbloom', label: 'Winterbloom', description: 'A wintry night palette with blossom-pink highlights.', mode: 'dark', immutable: true },
  { id: 'mint-icecube', label: 'Mint Icecube', description: 'Frosted mint glass with cool contrast.', mode: 'dark', immutable: true },
  { id: 'great-wave', label: 'Great Wave', description: 'A muted Kanagawa-inspired palette.', mode: 'dark', immutable: true },
  { id: 'sherbert-sakura', label: 'Sherbert Sakura', description: 'Pastel neon and cherry-blossom color.', mode: 'light', immutable: true },
  { id: 'burnt-chestnut', label: 'Burnt Chestnut', description: 'A medium-toned spring palette.', mode: 'light', immutable: true },
  { id: 'verdigris', label: 'Verdigris', description: 'Tarnished bronze, gold, and oxidized green.', mode: 'dark', immutable: true },
  { id: 'space-glass', label: 'Space Glass', description: 'Dark space with a twilight hue.', mode: 'dark', immutable: true },
  { id: 'navy-brockman', label: 'Navy Brockman', description: 'Deep maritime blues with professional contrast.', mode: 'dark', immutable: true },
  { id: 'peppermint-foil', label: 'Peppermint Foil', description: 'Crisp mint tones with reflective metallic details.', mode: 'light', immutable: true },
  { id: 'transparent', label: 'Transparent', description: 'A minimal translucent treatment that reveals the desktop.', mode: 'dark', immutable: true },
  { id: 'medieval-taurus', label: 'Medieval Taurus', description: 'Rustic gold, leather, and historic earth tones.', mode: 'dark', immutable: true },
  { id: 'mistic', label: 'Mistic', description: 'Smoky purples for a twilight aesthetic.', mode: 'dark', immutable: true },
]);

export const BUILT_IN_THEME_IDS = new Set(BUILT_IN_THEMES.map((theme) => theme.id));

export function getBuiltInTheme(themeId) {
  return BUILT_IN_THEMES.find((theme) => theme.id === themeId) || null;
}
