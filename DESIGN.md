---
name: briizOS — Dark Neon
colors:
  surface: '#000000'
  surface-dim: '#050708'
  surface-bright: '#0a1628'
  surface-container-lowest: '#000000'
  surface-container-low: '#020202'
  surface-container: '#050505'
  surface-container-high: '#0a0a0a'
  surface-container-highest: '#111111'
  on-surface: '#e2e8f0'
  on-surface-variant: '#aaaaaa'
  inverse-surface: '#f5f5f5'
  inverse-on-surface: '#0a1628'
  outline: 'rgba(0,0,0,0.15)'
  outline-variant: 'rgba(0,200,200,0.25)'
  surface-tint: '#00e5e5'
  primary: '#00e5e5'
  on-primary: '#000000'
  primary-container: 'rgba(0,229,229,0.15)'
  on-primary-container: '#00e5e5'
  inverse-primary: '#004040'
  secondary: '#00ff88'
  on-secondary: '#000000'
  secondary-container: 'rgba(0,255,136,0.14)'
  on-secondary-container: '#00ff88'
  tertiary: '#ff4da6'
  on-tertiary: '#000000'
  tertiary-container: 'rgba(255,77,166,0.18)'
  on-tertiary-container: '#ff4da6'
  error: '#ff5252'
  on-error: '#000000'
  error-container: 'rgba(248,113,113,0.12)'
  on-error-container: '#f87171'
  background: '#000000'
  on-background: '#e2e8f0'
  surface-variant: '#071015'
  accent-cyan: '#00e5e5'
  accent-cyan-soft: '#35d0d0'
  accent-neon-green: '#00ff88'
  accent-magenta: '#ff4da6'
  accent-briizlogo: '#bfeabf'
  warning: '#ffd54f'
  success: '#4caf50'
  text-main: '#00ff00'
  text-faint: '#cccccc'
  text-soft: '#aaaaaa'
  text-subtle: '#888888'
  text-muted: '#666666'
  text-dim: '#555555'
typography:
  display-lg:
    fontFamily: Chillax
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 1.1
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Chillax
    fontSize: 22px
    fontWeight: '650'
    lineHeight: 1.2
    letterSpacing: 0.02em
  body-base:
    fontFamily: Chillax
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 1.5
    letterSpacing: '0'
  body-bold:
    fontFamily: Chillax
    fontSize: 13px
    fontWeight: '650'
    lineHeight: 1.5
    letterSpacing: '0'
  panel-header-caps:
    fontFamily: Chillax
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 1.2
    letterSpacing: 1px
    textTransform: uppercase
  pill-caps:
    fontFamily: Courier
    fontSize: 12px
    fontWeight: '650'
    lineHeight: 1
    letterSpacing: 0.04em
  mono-code:
    fontFamily: 'SF Mono, Monaco, Consolas, monospace'
    fontSize: 12.5px
    fontWeight: '400'
    lineHeight: 1.45
    letterSpacing: '0'
---

# Design System: briizOS — Dark Neon

**Project:** briizOS (Electron + React desktop workspace)
**Default theme:** `default` (labeled *Dark Neon*)
**Theme pool:** 22 built-in themes toggled via `document.documentElement.dataset.theme`

## 1. Visual Theme & Atmosphere

briizOS lives in a **jet-black CRT twilight** — a dense, high-contrast desktop
workspace where cyan, lime, and hot-magenta sit as neon glyphs on near-black
glass. The surface language is unapologetically synthetic: inner shadows that
suggest a vignetted phosphor tube, gradient control bars that bleed teal into
black into magenta, and faint tinted glows (`inset 0 0 10px rgba(0,40,70)`)
that make every panel feel enclosed inside a terminal. Backgrounds default to
pure `#000` and `#0a1628`; nothing is ever "white." Content panels are flat
dark cards separated by **1px hairlines** at ~15% opacity, so the eye reads
structure by hierarchy of glow, not by elevation.

The mood is **tool-dense but moody** — information-rich panels, pill-shaped
status badges, dotted connector trails, and uppercase 13px panel headers
suggest a mission-control console, while 22 switchable themes (Antarctic
Teafog, Verdigris, Rose Petal, Great Wave, Mistic, Winterbloom…) hint that
the shell is meant to be re-skinned the way a user re-skins a code editor.
Whitespace is tight (`--cc-padding-tiny: 0`, `--cc-padding-small: 1.5px`,
`--cc-gap-small: 1.5px`) and corners are nearly razor-sharp
(`--cc-radius-slight: 3.5px`) — this is a *dashboard* aesthetic, not a
consumer-app one. Where softness appears, it comes from glow (`box-shadow`,
`text-shadow`) rather than padding or rounding.

## 2. Color Palette & Roles

### Primary Foundation (Surfaces)

| Name | Hex | Role |
|:---|:---|:---|
| **Phosphor Black** | `#000000` | Body background, app shell, panel fills |
| **Deep Space Navy** | `#0a1628` | Fallback body bg; container surfaces |
| **Terminal Charcoal** | `#050708` / `#050505` | Header gradient base, panel header bg |
| **Inkwell Teal** | `#071015` | Elevated header bg |
| **Scanline Black** | `#0a0a0a` | Log section bg; dense data wells |

### Accent & Interactive

| Name | Hex | Role |
|:---|:---|:---|
| **Primary Cyan** | `#00e5e5` | Primary accent — CTAs, active tabs, focus rings, slider thumbs, markdown code color |
| **Muted Teal-Cyan** | `#35d0d0` | Softer cyan — chain dots, inspector headers, hoverable links |
| **Neon Lime** | `#00ff88` | Secondary accent — success glow, phantom-section borders, active status |
| **Hot Magenta** | `#ff4da6` | Tertiary accent — login logo, deep-pink header bleed, decorative gradients |
| **Lime Text** | `limegreen` / `#00ff00` | `--palette-text-main` in default — terminal-style primary text |
| **briizLogo Mint** | `#bfeabf` | Brand mark accent (soft mint) |

### Typography & Text Hierarchy

| Name | Hex | Role |
|:---|:---|:---|
| **Primary Text (lime)** | `limegreen` | `--palette-text-main` — body copy on default theme |
| **Chat Text** | `#e2e8f0` | Light slate — chat/console bodies |
| **Faint Text** | `#cccccc` | Secondary body |
| **Soft Text** | `#aaaaaa` | Meta, timestamps, tags |
| **Subtle Text** | `#888888` | Settings labels, pill text |
| **Muted Text** | `#666666` | Hints, inactive buttons |
| **Dim Text** | `#555555` | Placeholders, disabled |

### Functional States

| Name | Hex | Role |
|:---|:---|:---|
| **Success Green** | `#4caf50` / `#4cd67f` | Success dots, status |
| **Warning Amber** | `#ffd54f` / `#e7b74a` | Waiting/paused state, now-bars, warnings |
| **Danger Red** | `red` / `#e2556a` / `#f87171` | Errors, destructive-action borders |
| **Error Flash BG** | `rgba(248,113,113,0.12)` | Error container tint |

### Signature Gradients

- **Title bar sweep**: `linear-gradient(120deg, teal, black, magenta, rgba(90,6,6), purple, black, teal)` — the briizOS controlbar/title gradient, re-used with filters.
- **Chat header bleed**: `linear-gradient(teal, black 50%, lime 150%)` — top-to-bottom teal→black→lime wash on `#chat-header`.
- **App header fade**: `linear-gradient(to bottom, black 80%, deeppink)` — black with a magenta bleed at the base.
- **Modal glass**: `linear-gradient(135deg, #80d2972d 0%, #0115343a 100%)` — minty-aqua glass over deep teal.
- **Login logo**: `linear-gradient(135deg, #00ffcc, #ff4da6, #00e5e5)` — the tri-color brand gradient.

> Near-duplicates intentionally kept: cyan reads as `#00e5e5`, `#22dce8`,
> `#35d0d0`, `#42dbe8`, `#00c8c8` across contexts. Treat them as a
> **cyan family** rather than individual tokens — pick the softer end for
> text/dots and the saturated end for primary CTAs.

## 3. Typography Rules

### Font Families

- **Primary — Chillax** (`--ui-font-main: Chillax`): a geometric sans that is
  slightly condensed and quietly futuristic — anchors the briizOS brand feel.
  Falls back to `Jost`, `SF Pro Display`, `Segoe UI`, `Roboto`, `system-ui`.
  Note: no `@font-face` ships in-repo; Chillax must be user-installed or
  loaded externally.
- **Secondary — SF Pro Display** (`font-family: SF Pro Display !important`
  on 6 selectors): used for header icon buttons and shrink-toggle glyphs
  where SF Symbols are needed.
- **Serif accent — Georgia / Times New Roman**: present on 10 selectors —
  used sparingly for display or editorial accents (likely journal/notes
  components).
- **Monospace — SF Mono / Monaco / Consolas**: via `--ui-mono-font`; applies
  to code blocks, JSON inspectors, axis labels, and the AI-visibility inline
  value cells. `Courier` is used for the small AI-pill badge for an
  intentionally retro-terminal note.

### Hierarchy & Weights

| Role | Size | Weight | Line / Spacing |
|:---|:---|:---|:---|
| Display (`--cc-font-size-huge`) | **40px** | 700 | Hero / splash |
| Panel title / H2 | **22px** (`--cc-font-size-large`) | 700 | 1.2 |
| Section head | **1.1rem** | 700 | 1.2, slight letter-spacing |
| Body / UI default | **13px** (`--cc-font-size-small`) | 400 | 1.5 |
| Chat / inspector body | **0.74–0.82rem** | 650–700 | 1.35–1.5 |
| Panel header | **13px** | 400 | **UPPERCASE**, `letter-spacing: 1px` |
| Pill / badge | **12px** | 650 | 1, `letter-spacing: .04em` |
| Status label | **0.68–0.72rem** | 700 | **UPPERCASE**, `letter-spacing: .05em` |
| Tiny label (`--cc-font-size-tiny`) | **9.5px** | 700 | For meta tags |

### Spacing Principles

- **Weight is mid-heavy**: `650` is used almost as often as `700` for small
  bold text — this is a Chillax-friendly weight that reads crisp at 11–13px.
- **Uppercase + 1px letter-spacing** is the signature treatment for panel
  headers, status labels, and section kickers. Every panel feels "named"
  the way a terminal window is named.
- **Line-height is tight** (1.1–1.5) throughout — this is a *density* system,
  not a reading-comfort system.
- **Text-shadow** on panel headers (`-2px 2px rgba(0,0,0,.2)`) adds a subtle
  hard-tech edge; title icons get a cyan glow (`0 0 8px <cyan>`).

## 4. Component Stylings

### Buttons

Buttons are small, square-cornered, and lean on border + glow for emphasis
rather than fills.

- **Primary / mode**: 1px cyan or lime border, dark translucent fill
  (`rgba(0,60,60,0.6)` or `rgba(20,170,0,0.5)`), uppercase label in cyan or
  warm cream (`#ffd18a`). Hover brightens the border and shifts the text to
  white.
- **Ghost**: `border: 1px solid rgba(255,255,255,0.15)`, transparent fill,
  text `--palette-text-subtle` (#888). Hover fills to `rgba(255,255,255,0.05)`.
- **Danger**: brown-red border + fill (`rgba(110,10,10,0.7)` / border
  `rgba(170,30,30,0.6)`), label blushes to `#ffb1b1` on hover.
- **Star (favorite)**: amber border `rgba(255,214,102,0.42)` on brown fill
  `rgba(80,62,10,0.7)` — toggles brighter when active.
- **Radii**: 4px (`.actiondeck-btn`), 7px (picker buttons), 8px
  (inspector pills), 999px (badge pills). The **default pill radius is `3.5px`**
  (`--cc-radius-slight`), used 91× — this is the house corner.
- **Transitions**: `0.15–0.3s ease` on all states; borders animate first,
  then shadow.

### Panels & Cards

Panels are the fundamental content container:

- **Fill**: pure black `--layout-bg-panel: black` (per default theme).
- **Border**: `1px solid rgba(0,0,0,0.15)` — nearly invisible on dark bg;
  hover state glows **magenta** (`rgba(200,0,107,0.4)`) and active glows
  deeper (`rgba(200,0,153,0.6)`).
- **Corner radius**: `--layout-panel-radius: 6px` — slightly softer than
  the pill but still crisp.
- **Inner shadow**: `inset 0 0 80px var(--panel-inner-shadow, transparent)` —
  reserved for themed emphasis.
- **Header strip**: 36px tall (`--layout-header-height`), uppercase 13px
  with 1px letter-spacing, bottom hairline border. Headers are **sticky,
  flat, non-rounded** (`border-radius: 0 !important`).

### Overlays / Modals

- **AI-visibility modal**: full-viewport (`100vw × 100vh`), `0` radius,
  gradient `linear-gradient(135deg, rgba(6,28,40,.97), rgba(2,14,30,.98))`,
  cyan hairline dividers at ~10–15% opacity.
- **Picker / dropdown (`.add-from-picker`)**: `13px` corner, cyan border
  `rgba(101,222,216,0.3)`, deep teal fill `rgba(5,18,26,0.98)`, large drop
  shadow `0 28px 80px rgba(0,0,0,0.62)`, backdrop blurs the app behind at
  `10px`.
- **Login overlay**: aubergine-to-plum gradient
  `linear-gradient(135deg, rgba(106,58,90,.95), rgba(26,10,74,.95))` — the
  *only* purple surface in the system, used for pre-auth state.

### Navigation (App Header)

- **Grid**: `minmax(0,1fr) auto minmax(0,1fr)` — centered title with
  balanced left/right slots.
- **Height**: 70px (`--cc-app-header-height`), shrinks to a sliver when
  idle (`.shrunk` state fades title + dock after 1.5s, pops back on hover).
- **Background**: themed gradient (default: black→deep-pink bleed, 80% stop).
- **Title**: themed gradient fill applied via `background-clip: text`, with
  cyan icon glow and 0.1px white stroke.
- **Shrink toggle**: 30×40 cyan-outlined pill tucked bottom-right, nearly
  invisible (opacity .1) until focus.

### Inputs & Forms

- **Base**: deep translucent fill `rgba(20,40,60,0.6)`, 1px cyan border
  `rgba(0,200,200,0.2)`, text in `--palette-text-main` (lime).
- **Focus**: border saturates to `rgba(0,200,200,0.5)` + outer glow
  `0 0 10px rgba(0,200,200,0.1)`. No native outline.
- **Range sliders**: `accent-color: #ffd96b` (amber), thumb glows cyan at
  `0 0 6px rgba(0,229,229,0.5)`.
- **Placeholder**: `--palette-text-dim` (#555) — deliberately low-contrast.

### Pills / Status Badges

- **Shape**: `border-radius: 999px`, 20×20 for icon-only, auto-width for text.
- **Dot**: 7×7 round, color-coded (`success #4cd67f`, `warning #e7b74a`,
  `danger #e2556a`, `idle #8aa`). Dot animates `aiviz-pulse 1.2s ease-in-out`
  when active.
- **Font**: 12px Courier on `.aiviz-pill` (retro-terminal flavor), 650 weight
  elsewhere.

### Domain-Specific Components

- **Action Deck column** (`.actiondeck-*`): black floating card with
  **lime-tinted header gradient** (`linear-gradient(to top, transparent, rgba(103,255,166,0.5))`),
  10px corner radius, lime title. Settings face flips in behind the front
  face. Signature of the briizOS "deck of actions" metaphor.
- **AI-visibility chain nodes** (`.aiviz-node`): 8px corners, 1.5px borders
  color-coded per lifecycle stage — user (amber), app (`#a48af7` lavender),
  transmit (cyan), endpoint (lime), response (`#f08bd4` rose). Nodes glow
  cyan when selected (`box-shadow: 0 0 0 3px rgba(0,200,200,0.35)`).
- **Phantom section** (`.phantom-*`): nearly colorless gray-on-black
  (`#111` tabs, `#222` hints, `#333` dots, `#444` tab text, `#777` status
  text) with **lime-green at 3–40% opacity** for primary/record states.
  Reads as a quiet "shadow" tool-tray.
- **Log section**: `--log-section-bg: #0a0a0a`, header `deepskyblue`,
  border `rgba(25,255,55,.23)` — a scanner/console motif.
- **JSON inspector** (`.aiviz-j-*`): cyan keys, pale-green strings
  (`#b9e08c`), orange numbers (`#f0a86b`), lavender keywords (`#c792ea`) —
  classic Monokai-adjacent syntax theme.

## 5. Layout Principles

### Grid & Structure

- **Shell**: `html, body, #root { height: 100%; overflow: hidden }` — the
  app always fills the window; no body scroll.
- **Panels** use CSS Grid for the app header (3-col balanced) and absolute
  positioning for the tile grid (`.tile-layout-grid` with
  `.panel-carrier { position: absolute; inset: 0 }`). Panels have a
  **"husk" + "carrier" split** so they can animate between docked and
  windowed states without unmounting.
- **Max content width**: none at the shell level — briizOS fills the full
  desktop. Chat and inspector panels cap internal text at `~560px` for
  readability.

### Whitespace Strategy

- **Base unit scale (`--cc-*`)**: `0 / 1.5 / 5 / 9.5 / 18` for gap,
  `0 / 1.5 / 5 / 11 / 30` for padding, `0 / 3.5 / 10 / 24 / 999` for radius.
  This is a **tight, non-standard scale** — multiples of ~5px rather than
  the usual 4/8 grid.
- **Edge padding**: panel headers use `0 var(--cc-padding-large)` (0 11px);
  modals pad `14–20px` horizontally and `8–12px` vertically.
- **Layout gap**: `--layout-gap: 1px` — panels sit flush against hairline
  dividers rather than floating in spacing.

### Alignment & Visual Balance

- **Left-aligned** by default — chat bodies, inspector lists, log rows.
- **Center-aligned** for the app title and pill-badge rows.
- **Right-anchored** for header actions and panel-header-actions
  (`justify-content: flex-end`).
- **Flex-based** throughout; `display: flex` and `gap` carry most of the
  spacing weight.

### Responsive Behavior & Touch

- **Primary breakpoint**: `@media (max-width: 900px)` — AI-visibility
  inspector collapses from side-rail to top-stacked, borders swap from
  `border-left` to `border-top`.
- **Touch targets**: close buttons enforce `min-width: 32px; min-height: 32px`.
  Pills and small chips are smaller (20×20) and desktop-first.
- **Mobile is not a first-class target** — this is a desktop Electron app.

### Motion

- **Transitions**: `--layout-transition-fast: 0.15s ease`,
  `--layout-transition-normal: 0.2s ease`. Header shrink uses
  `0.15s cubic-bezier(.3,.8,.7,1.1)` on entry, `0.2s cubic-bezier(.5,.9,.5,1)`
  with a 2s delay on retraction — the shell "lingers" before shrinking.
- **Pulse**: `aiviz-pulse 1.2s ease-in-out infinite` on active status dots.
- **Scale/opacity**: a `.manifesting` state on action-deck columns boosts
  brightness to `30` and saturation to `2.8` for a "fade-in from void" effect —
  a signature briizOS entrance animation.

## 6. Theming System

- Themes toggle via `document.documentElement.dataset.theme = "<id>"`.
- 22 built-in themes ship — the shell is built to be re-skinned (Antarctic
  Teafog, Autumn Candle, Burnt Chestnut, Caspian Sea, Cloudfrost, Default/Dark
  Neon, Glacial Dusk, Great Wave, Medieval Taurus, Mint Icecube, Mistic, Neon
  Orb, Pearlescence, Peppermint Foil, Postlinear Glassos, Rose Petal, Sherbert
  Sakura, Space Glass, Sunbrocksen, Verdigris, Vineyard Gloom, Winterbloom).
- Every surface, text, border, and gradient reads from a `var(--token, fallback)`.
  New themes override tokens, not selectors.

### Token namespaces

- **`--cc-*`** — size / space / radius scale (fonts, gaps, padding, radii).
- **`--palette-*`** — raw colors (accents, text ladder, states).
- **`--ui-*`** — themed semantic roles (body bg, header, chat, modal, settings…).
- **`--layout-*`** — shell structure (panel bg, borders, header height, gaps,
  transitions).

### Working-with notes

- The **default theme** is the most contrast-stable baseline. Preview new UI
  against lighter themes (Burnt Chestnut, Peppermint Foil, Neon Orb) to catch
  tokens that haven't been generalized.
- Never hardcode a hex for a surface — the theme pool will miss it.
- The **lime + cyan** pair carries success/primary. **Magenta** is reserved
  for brand moments (login, title gradient), not everyday CTAs.
