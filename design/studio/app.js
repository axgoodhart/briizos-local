/* ==========================================================================
   briizOS Theme Studio — app logic
   Applies the 22 core tokens to the live UI, drives the control panel,
   generates new themes, and exports a clean CSS block.
   ========================================================================== */
(function () {
  const { TOKEN_GROUPS, ALL_KEYS, FONTS, PRESETS, generateTheme, themeToCSS } = window.BRIIZ;
  const stage = document.getElementById('stage');
  const root = document.documentElement;
  const LS_KEY = 'briizos.studio.state';

  let current = {};        // active token map
  let currentName = 'Phantom';
  let currentSlug = 'phantom';
  let currentMode = 'dark';

  /* ---- apply a full theme -------------------------------------------- */
  function applyTheme(theme, slug) {
    current = {};
    for (const k of ALL_KEYS) {
      if (theme[k] != null) { root.style.setProperty(k, theme[k]); current[k] = theme[k]; }
    }
    currentName = theme.name || 'Custom';
    currentMode = theme.mode || 'dark';
    currentSlug = slug || (currentName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    stage.setAttribute('data-theme', currentSlug);
    stage.setAttribute('data-mode', currentMode);
    root.style.setProperty('color-scheme', currentMode);
    syncControls();
    save();
  }

  /* ---- set one token (live) ------------------------------------------ */
  function setToken(key, value) {
    root.style.setProperty(key, value);
    current[key] = value;
    // keep glow following accent by default only if user hasn't touched glow separately — skip; explicit control exists
    save();
  }

  /* ---- persistence --------------------------------------------------- */
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        tokens: current, name: currentName, slug: currentSlug, mode: currentMode,
      }));
    } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s.tokens) return false;
      applyTheme(Object.assign({ name: s.name, mode: s.mode }, s.tokens), s.slug);
      return true;
    } catch (e) { return false; }
  }

  /* ====================================================================
     BUILD THE STUDIO CONTROLS
     ================================================================== */
  const body = document.getElementById('studioBody');

  // preset picker
  const presetWrap = document.createElement('div');
  presetWrap.className = 'preset-grid';
  Object.entries(PRESETS).forEach(([slug, p]) => {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.dataset.slug = slug;
    chip.innerHTML = `<span class="dots">
        <i style="background:${p['--accent']}"></i>
        <i style="background:${p['--accent-2']}"></i>
        <i style="background:${p['--accent-3']}"></i>
      </span><span>${p.name}</span>`;
    chip.addEventListener('click', () => { applyTheme(p, slug); flashActive(slug); });
    presetWrap.appendChild(chip);
  });
  body.appendChild(presetWrap);

  // actions
  const actions = document.createElement('div');
  actions.className = 'studio-actions';
  actions.innerHTML = `
    <button class="sbtn" id="genBtn">&#10022; Generate</button>
    <button class="sbtn" id="resetBtn">&#8635; Reset</button>
    <button class="sbtn primary wide" id="exportBtn">&#8681; Export theme CSS</button>`;
  body.appendChild(actions);

  // token controls
  const controlEls = {}; // key -> element(s) for syncing
  TOKEN_GROUPS.forEach(group => {
    const g = document.createElement('div');
    g.className = 'tgroup';
    g.innerHTML = `<h3>${group.label}</h3>`;
    group.tokens.forEach(t => {
      const row = document.createElement('div');
      row.className = 'ctrl';
      if (t.type === 'color') {
        row.innerHTML = `<label>${t.name}</label>
          <span class="swatch"><input type="color" data-key="${t.key}"></span>`;
        const input = row.querySelector('input');
        input.addEventListener('input', e => setToken(t.key, e.target.value));
        controlEls[t.key] = { input };
      } else if (t.type === 'range') {
        row.innerHTML = `<label>${t.name}</label>
          <input type="range" min="${t.min}" max="${t.max}" data-key="${t.key}">
          <span class="val"></span>`;
        const input = row.querySelector('input');
        const val = row.querySelector('.val');
        input.addEventListener('input', e => { setToken(t.key, e.target.value + (t.unit || '')); val.textContent = e.target.value + (t.unit || ''); });
        controlEls[t.key] = { input, val, unit: t.unit || '' };
      } else if (t.type === 'font') {
        const opts = FONTS.map(f => `<option value="${f}">${f}</option>`).join('');
        row.innerHTML = `<label>${t.name}</label><select data-key="${t.key}">${opts}</select>`;
        const sel = row.querySelector('select');
        sel.addEventListener('change', e => setToken(t.key, e.target.value));
        controlEls[t.key] = { input: sel };
      }
      g.appendChild(row);
    });
    body.appendChild(g);
  });

  /* ---- sync controls to current tokens ------------------------------- */
  function toHexColor(v) {
    if (!v) return '#000000';
    v = v.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(c => c + c).join('');
    // rgb()/named -> render via canvas
    try {
      const ctx = (toHexColor._c = toHexColor._c || document.createElement('canvas').getContext('2d'));
      ctx.fillStyle = v; return ctx.fillStyle.length === 7 ? ctx.fillStyle : '#000000';
    } catch (e) { return '#000000'; }
  }
  function syncControls() {
    for (const key in controlEls) {
      const c = controlEls[key];
      const raw = current[key];
      if (!c || raw == null) continue;
      if (c.input.type === 'color') c.input.value = toHexColor(raw);
      else if (c.input.type === 'range') {
        const num = parseFloat(raw) || 0; c.input.value = num;
        if (c.val) c.val.textContent = num + c.unit;
      } else { c.input.value = raw; }
    }
  }
  function flashActive(slug) {
    document.querySelectorAll('.preset-chip').forEach(ch =>
      ch.classList.toggle('active', ch.dataset.slug === slug));
  }

  /* ---- action wiring -------------------------------------------------- */
  document.getElementById('genBtn').addEventListener('click', () => {
    const t = generateTheme();
    applyTheme(t, t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    flashActive('__none');
    toast('New theme generated &mdash; tweak &amp; export');
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    applyTheme(PRESETS.phantom, 'phantom'); flashActive('phantom');
  });

  /* ---- export --------------------------------------------------------- */
  const scrim = document.getElementById('exportScrim');
  function highlightCss(css) {
    return css
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/(\/\*[^*]*\*\/)/g, '<span class="csscmt">$1</span>')
      .replace(/(--[a-z0-9-]+)(:)/g, '<span class="cssvar">$1</span>$2')
      .replace(/(:\s*)([^;\n]+)(;)/g, '$1<span class="cssval">$2</span>$3');
  }
  function openExport() {
    const theme = Object.assign({ name: currentName, mode: currentMode }, current);
    const css = themeToCSS(theme, currentSlug);
    document.getElementById('exportCode').innerHTML = highlightCss(css);
    document.getElementById('exportTitle').textContent = currentName;
    document.getElementById('exportSub').innerHTML = `${currentMode} &middot; 22 tokens &middot; paste into App.css`;
    scrim.classList.add('open');
    openExport._css = css;
  }
  document.getElementById('exportBtn').addEventListener('click', openExport);
  document.getElementById('exportClose').addEventListener('click', () => scrim.classList.remove('open'));
  scrim.addEventListener('click', e => { if (e.target === scrim) scrim.classList.remove('open'); });
  document.getElementById('copyCss').addEventListener('click', () => {
    navigator.clipboard?.writeText(openExport._css).then(() => toast('Copied to clipboard'));
  });
  document.getElementById('downloadCss').addEventListener('click', () => {
    const blob = new Blob([openExport._css], { type: 'text/css' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = currentSlug + '.theme.css';
    a.click();
    toast('Downloaded ' + a.download);
  });

  /* ---- toast ---------------------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---- studio open/close + FAB --------------------------------------- */
  document.getElementById('studioClose').addEventListener('click', () => stage.classList.add('studio-closed'));
  document.getElementById('studioFab').addEventListener('click', () => stage.classList.remove('studio-closed'));

  /* ---- misc dashboard interactions ----------------------------------- */
  document.querySelectorAll('[data-task] [data-toggle]').forEach(row =>
    row.addEventListener('click', () => row.closest('[data-task]').classList.toggle('open')));
  const notesWin = document.getElementById('notesWin');
  document.getElementById('notesClose').addEventListener('click', () => notesWin.style.display = 'none');
  document.querySelectorAll('.mod').forEach(m => m.addEventListener('click', () => {
    document.querySelectorAll('.mod').forEach(x => x.classList.remove('active'));
    m.classList.add('active');
  }));

  /* ---- init ----------------------------------------------------------- */
  if (!load()) { applyTheme(PRESETS.phantom, 'phantom'); }
  flashActive(currentSlug);
})();
