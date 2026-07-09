import { useState } from 'react';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';

/* ── Rich text for notes folios ──────────────────────────────────────
   TipTap core (no React bindings — this is Preact country) plus Aida's
   floating toolbar design: a draggable pill with B/I/U, link, code,
   font family + size, and an expandable second row of headings,
   alignment, lists, and quote. Documents serialize to JSON and live in
   folio.content.doc. */

/* Font size isn't an official extension — tiny custom one on textStyle. */
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/px$/, '') || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}px` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          size
            ? chain().setMark('textStyle', { fontSize: String(size) }).run()
            : chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

/* Block-level line height on paragraphs and headings. Falls back to the
   journal's CSS default (--jv-lh) when unset. */
const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (value) =>
        ({ commands }) =>
          ['paragraph', 'heading'].every((type) =>
            commands.updateAttributes(type, { lineHeight: value || null }),
          ),
    };
  },
});

export const FONT_FAMILIES = [
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Jost', value: 'Jost, system-ui, sans-serif' },
  { label: 'Afacad Flux', value: "'Afacad Flux', system-ui, sans-serif" },
  { label: 'System', value: 'system-ui, sans-serif' },
  { label: 'Mono', value: "'SF Mono', Menlo, monospace" },
];

export const LINE_HEIGHTS = ['1', '1.15', '1.35', '1.5', '1.65', '1.8', '2'];

/* ── Local font library (Chromium Local Font Access API) ─────────────
   window.queryLocalFonts() lists every font installed on the computer.
   Needs a user gesture the first time; Electron grants the permission.
   Loaded once per session and shared by the toolbar + typography panel. */

let systemFontsCache = null;
let systemFontsPromise = null;
const fontValue = (family) =>
  /[^a-zA-Z0-9-]/.test(family) ? `'${family.replace(/'/g, "\\'")}'` : family;

export function loadSystemFonts() {
  if (systemFontsPromise) return systemFontsPromise;
  systemFontsPromise = (async () => {
    if (typeof window.queryLocalFonts !== 'function') return (systemFontsCache = []);
    try {
      const fonts = await window.queryLocalFonts();
      const families = [...new Set(fonts.map((f) => f.family))]
        .sort((a, b) => a.localeCompare(b));
      systemFontsCache = families.map((f) => ({ label: f, value: fontValue(f) }));
    } catch (err) {
      console.warn('queryLocalFonts failed', err);
      systemFontsCache = [];
    }
    return systemFontsCache;
  })();
  return systemFontsPromise;
}

export const getSystemFonts = () => systemFontsCache;
export const canQueryLocalFonts = () => typeof window.queryLocalFonts === 'function';

export function createNotesEditor(element, doc, { onSave, onTick, onFocus, onUpdate }) {
  return new Editor({
    element,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Placeholder.configure({ placeholder: 'Write…' }),
    ],
    content: doc || '',
    onBlur: ({ editor }) => onSave(editor.getJSON()),
    onFocus, // lets the view bind the shared toolbar to this editor
    // Doc changed → live reflow. Rebalance's own transactions are marked
    // addToHistory:false; skipping them here prevents self-triggered loops.
    onUpdate: ({ editor, transaction }) => {
      if (transaction?.getMeta('addToHistory') === false) return;
      onUpdate?.(editor);
    },
    onTransaction: onTick, // refresh toolbar active states
  });
}

/* ── Icons (stroke = currentColor, match the app's inline SVG style) ── */

const I = {
  drag: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
    </svg>
  ),
  bold: <span className="rt-glyph" style={{ fontWeight: 700 }}>B</span>,
  italic: <span className="rt-glyph" style={{ fontStyle: 'italic', fontFamily: 'Georgia,serif' }}>I</span>,
  underline: <span className="rt-glyph" style={{ textDecoration: 'underline' }}>U</span>,
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M10 14a4 4 0 0 0 6 .4l2.5-2.5a4 4 0 1 0-5.7-5.7L11.5 7.5" />
      <path d="M14 10a4 4 0 0 0-6-.4L5.5 12.1a4 4 0 1 0 5.7 5.7l1.3-1.3" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m9 8-5 4 5 4M15 8l5 4-5 4" />
    </svg>
  ),
  quote: <span className="rt-glyph" style={{ fontFamily: 'Georgia,serif', fontWeight: 700 }}>”</span>,
  alignL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 6h16M4 11h10M4 16h16M4 21h10" transform="translate(0,-1.5)" />
    </svg>
  ),
  alignC: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 6h16M7 11h10M4 16h16M7 21h10" transform="translate(0,-1.5)" />
    </svg>
  ),
  alignR: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M4 6h16M10 11h10M4 16h16M10 21h10" transform="translate(0,-1.5)" />
    </svg>
  ),
  bullets: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
  numbers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M10 6h10M10 12h10M10 18h10" />
      <text x="2" y="8" font-size="7" fill="currentColor" stroke="none" font-family="system-ui">1</text>
      <text x="2" y="14.5" font-size="7" fill="currentColor" stroke="none" font-family="system-ui">2</text>
      <text x="2" y="21" font-size="7" fill="currentColor" stroke="none" font-family="system-ui">3</text>
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m6 10 6 6 6-6" />
    </svg>
  ),
};

/* ── Floating toolbar ────────────────────────────────────────────────── */

function Btn({ active, onClick, title, children, wide }) {
  return (
    <button
      type="button"
      className={'rt-btn' + (active ? ' is-active' : '') + (wide ? ' rt-btn--wide' : '')}
      title={title}
      onMouseDown={(e) => e.preventDefault()} /* keep editor selection/focus */
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }) {
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState(null); // null = CSS default spot
  const [link, setLinkPanel] = useState(null); // { range, text, url } when open
  const [, force] = useState(0); // re-render after async font-library load

  if (!editor || editor.isDestroyed) return null;

  const startDrag = (e) => {
    e.preventDefault();
    const el = e.currentTarget.closest('.rt-toolbar');
    const rect = el.getBoundingClientRect();
    const parent = el.offsetParent.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const move = (ev) =>
      setPos({
        x: Math.max(0, Math.min(ev.clientX - parent.left - ox, parent.width - rect.width)),
        y: Math.max(0, Math.min(ev.clientY - parent.top - oy, parent.height - 40)),
      });
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const c = () => editor.chain().focus();

  /* Link panel — inline Text/URL rows (window.prompt doesn't exist in
     Electron renderers, and this is nicer anyway). */
  const toggleLinkPanel = () => {
    if (link) {
      setLinkPanel(null);
      return;
    }
    // If the caret sits in an existing link, edit the whole link.
    if (editor.isActive('link')) editor.chain().extendMarkRange('link').run();
    const { from, to } = editor.state.selection;
    setLinkPanel({
      range: { from, to },
      text: editor.state.doc.textBetween(from, to, ' '),
      url: editor.getAttributes('link').href || '',
    });
  };

  const applyLink = () => {
    const url = link.url.trim();
    const { range } = link;
    if (!url) {
      // Empty URL = remove the link, keep the text.
      editor.chain().focus().setTextSelection(range).unsetLink().run();
      setLinkPanel(null);
      return;
    }
    const label = link.text.trim() || url;
    editor
      .chain()
      .focus()
      .insertContentAt(range, label)
      .setTextSelection({ from: range.from, to: range.from + label.length })
      .setLink({ href: url })
      .setTextSelection({ from: range.from + label.length, to: range.from + label.length })
      .run();
    setLinkPanel(null);
  };

  const linkKeys = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyLink();
    }
    if (e.key === 'Escape') setLinkPanel(null);
  };

  const family = editor.getAttributes('textStyle').fontFamily || FONT_FAMILIES[0].value;
  const size = editor.getAttributes('textStyle').fontSize || '';
  const lineHeight =
    editor.getAttributes('paragraph').lineHeight ||
    editor.getAttributes('heading').lineHeight || '';

  const systemFonts = getSystemFonts();
  const knownFamily =
    FONT_FAMILIES.some((f) => f.value === family) ||
    (systemFonts || []).some((f) => f.value === family);

  const onFamilyChange = (value) => {
    if (value === '__load-system') {
      // Re-render once the library arrives; the select keeps its value.
      loadSystemFonts().then(() => force((n) => n + 1));
      return;
    }
    c().setFontFamily(value).run();
  };

  return (
    <div
      className="rt-toolbar"
      style={pos ? { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto', transform: 'none' } : undefined}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="rt-row">
        <button type="button" className="rt-btn rt-btn--drag" title="Move toolbar" onPointerDown={startDrag}>
          {I.drag}
        </button>
        <span className="rt-sep" />
        <Btn active={editor.isActive('bold')} title="Bold (⌘B)" onClick={() => c().toggleBold().run()}>{I.bold}</Btn>
        <Btn active={editor.isActive('italic')} title="Italic (⌘I)" onClick={() => c().toggleItalic().run()}>{I.italic}</Btn>
        <Btn active={editor.isActive('underline')} title="Underline (⌘U)" onClick={() => c().toggleUnderline().run()}>{I.underline}</Btn>
        <Btn active={editor.isActive('link') || !!link} title="Link" onClick={toggleLinkPanel}>{I.link}</Btn>
        <Btn active={editor.isActive('code')} title="Inline code" onClick={() => c().toggleCode().run()}>{I.code}</Btn>
        <span className="rt-sep" />
        <select
          className="rt-family"
          title="Font"
          value={family}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onFamilyChange(e.currentTarget.value)}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
          {!knownFamily && <option value={family}>{family.replace(/['"]/g, '').split(',')[0]}</option>}
          {systemFonts === null && canQueryLocalFonts() && (
            <option value="__load-system">↻ load my computer's fonts…</option>
          )}
          {systemFonts?.length > 0 && (
            <optgroup label="my computer">
              {systemFonts.map((f) => (
                <option key={f.label} value={f.value}>{f.label}</option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          className="rt-size"
          type="number"
          min="9"
          max="72"
          placeholder="14"
          title="Font size"
          value={size}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => c().setFontSize(parseInt(e.currentTarget.value, 10) || null).run()}
        />
        <span className="rt-sep" />
        <Btn title={expanded ? 'Fewer tools' : 'More tools'} active={expanded} onClick={() => setExpanded(!expanded)}>
          <span className={'rt-chevron' + (expanded ? ' is-open' : '')}>{I.chevron}</span>
        </Btn>
      </div>

      {link && (
        <div className="rt-linkpanel" onMouseDown={(e) => e.stopPropagation()}>
          <label className="rt-linkrow">
            <span className="rt-linklabel">Text</span>
            <input
              className="rt-linkinput"
              type="text"
              value={link.text}
              placeholder="the text you had highlighted, or otherwise blank"
              ref={(el) => link.text === '' && el?.focus()}
              onInput={(e) => setLinkPanel({ ...link, text: e.currentTarget.value })}
              onKeyDown={linkKeys}
            />
          </label>
          <label className="rt-linkrow">
            <span className="rt-linklabel">URL</span>
            <input
              className="rt-linkinput"
              type="text"
              value={link.url}
              placeholder="https://"
              ref={(el) => link.text !== '' && el?.focus()}
              onInput={(e) => setLinkPanel({ ...link, url: e.currentTarget.value })}
              onKeyDown={linkKeys}
            />
          </label>
        </div>
      )}

      {expanded && (
        <div className="rt-row rt-row--secondary">
          {[1, 2, 3].map((lvl) => (
            <Btn
              key={lvl}
              active={editor.isActive('heading', { level: lvl })}
              title={`Heading ${lvl}`}
              onClick={() => c().toggleHeading({ level: lvl }).run()}
            >
              <span className="rt-glyph rt-glyph--h">H<sub>{lvl}</sub></span>
            </Btn>
          ))}
          <span className="rt-sep" />
          <Btn active={editor.isActive({ textAlign: 'left' })} title="Align left" onClick={() => c().setTextAlign('left').run()}>{I.alignL}</Btn>
          <Btn active={editor.isActive({ textAlign: 'center' })} title="Align center" onClick={() => c().setTextAlign('center').run()}>{I.alignC}</Btn>
          <Btn active={editor.isActive({ textAlign: 'right' })} title="Align right" onClick={() => c().setTextAlign('right').run()}>{I.alignR}</Btn>
          <span className="rt-sep" />
          <Btn active={editor.isActive('bulletList')} title="Bullet list" onClick={() => c().toggleBulletList().run()}>{I.bullets}</Btn>
          <Btn active={editor.isActive('orderedList')} title="Numbered list" onClick={() => c().toggleOrderedList().run()}>{I.numbers}</Btn>
          <Btn active={editor.isActive('blockquote')} title="Quote" onClick={() => c().toggleBlockquote().run()}>{I.quote}</Btn>
          <span className="rt-sep" />
          <select
            className="rt-family rt-lineheight"
            title="Line height"
            value={lineHeight}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => c().setLineHeight(e.currentTarget.value || null).run()}
          >
            <option value="">line ↕ auto</option>
            {LINE_HEIGHTS.map((v) => (
              <option key={v} value={v}>line ↕ {v}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
