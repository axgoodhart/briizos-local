# Theme authoring

`src/AppCombined.css` is the one runtime stylesheet for the built-in briizOS themes.

- Shared layout, interaction behavior, and ordinary visual rules appear once.
- The default appearance lives in the normal cascade.
- Each built-in theme has a named `:root[data-theme='…']` section containing only the values or rules where it deliberately differs.
- Selecting a built-in theme sets that `data-theme` attribute. It does not inject a second complete stylesheet.

This means a shared change—such as when a panel gains a focus shadow—belongs in the shared rule and is made once. A theme-specific difference belongs in that theme's named section.

## Theme Studio and Chromap

Theme Studio's object picker and arrow-key DOM navigation remain available. Chromap and Theme Studio should work from the resolved master stylesheet, including literal colors, gradients, shadows, and state rules.

The long-term token model is intentionally not decided here. Do not create a token for every declaration or duplicate the whole stylesheet merely to make a value editable. The requirement is that a theme-wide edit can change all values that are meant to move together.

## Recovery material

The former complete per-theme CSS files remain under `src/themes/` for recovery and saved-theme compatibility. They are not the runtime source for built-in themes. The full split-era stylesheet and its documentation are preserved in `docs/theme-archive/`.

Saved custom themes may still layer their own CSS over the master stylesheet so existing personal work remains available. Any later migration must preserve those saved documents before changing their format.
