import { lockDragSelection } from '../../lib/dragSelection';
import { useEffect, useRef, useState } from 'react';
import { Editor, Extension, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import logger from '../../lib/logger';

/* ── Rich text for notes folios ──────────────────────────────────────
   TipTap core (no React bindings — this is Preact country) plus Aida's
   toolbar: B/I/U, link, code, font family + size, headings, alignment,
   lists, quote, and line height. Docked by default as a single-row
   strip above the book that scrolls horizontally when cramped;
   double-clicking its handle tears it off into a draggable floating
   pill (and docks it back). Documents serialize to JSON and live in
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

/* A local image belongs to the document as a top-level block. That matters for
   journal pages: the overflow engine moves whole blocks between paper faces,
   so an attachment travels with the paragraph boundary instead of being split
   through a line of prose. */
const JournalImage = Node.create({
  name: 'journalImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('alt') || '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[data-journal-image]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', { ...HTMLAttributes, 'data-journal-image': '' }];
  },
});

function attachmentTriggerAtSelection(editor) {
  const { from, empty, $from } = editor.state.selection;
  if (!empty || !$from.parent.isTextblock) return null;
  const beforeCaret = $from.parent.textBetween(0, $from.parentOffset, '', '');
  if (!beforeCaret.endsWith('//+')) return null;
  return { from: from - 3, to: from };
}

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

export function createNotesEditor(element, doc, {
  onSave, onTick, onFocus, onUpdate, onAttachmentRequest, editable = true,
}) {
  return new Editor({
    element,
    editable,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      JournalImage,
      Placeholder.configure({ placeholder: 'Write…' }),
    ],
    content: doc || '',
    onBlur: ({ editor }) => onSave(editor.getJSON()),
    onFocus, // lets the view bind the shared toolbar to this editor
    // Doc changed → live reflow. Rebalance's own transactions are marked
    // addToHistory:false; skipping them here prevents self-triggered loops.
    onUpdate: ({ editor, transaction }) => {
      if (transaction?.getMeta('addToHistory') === false) return;
      const attachmentTrigger = attachmentTriggerAtSelection(editor);
      if (attachmentTrigger) {
        editor.commands.deleteRange(attachmentTrigger);
        onAttachmentRequest?.({ position: attachmentTrigger.from });
      }
      onUpdate?.(editor);
    },
    onTransaction: onTick, // refresh toolbar active states
  });
}

/* ── SF Symbols from the supplied symbol catalog ── */

const I = {
  drag: <span className="jr-sf-symbol" aria-hidden="true">􀌇</span>,
  bold: <span className="rt-glyph" data-theme-inline="richtext-rt-glyph-1">B</span>,
  italic: <span className="rt-glyph" data-theme-inline="richtext-rt-glyph-2">I</span>,
  underline: <span className="rt-glyph" data-theme-inline="richtext-rt-glyph-3">U</span>,
  link: <span className="jr-sf-symbol" aria-hidden="true">􀉣</span>,
  code: <span className="jr-sf-symbol" aria-hidden="true">􀙚</span>,
  quote: <span className="rt-glyph" data-theme-inline="richtext-rt-glyph-4">”</span>,
  alignL: <span className="jr-sf-symbol" aria-hidden="true">􀌀</span>,
  alignC: <span className="jr-sf-symbol" aria-hidden="true">􀌁</span>,
  alignR: <span className="jr-sf-symbol" aria-hidden="true">􀌂</span>,
  bullets: <span className="jr-sf-symbol" aria-hidden="true">􀋲</span>,
  numbers: <span className="jr-sf-symbol" aria-hidden="true">􀋴</span>,
  chevron: <span className="jr-sf-symbol" aria-hidden="true">􀆈</span>,
};

/* ── Editor toolbar (docked strip / floating pill / float tray) ──────── */

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

export function EditorToolbar({
  editor,
  toolbarId,
  rootRef,
  bookRef,
  placement = 'floating',
  onTogglePlacement = null,
  onDismiss = null,
}) {
  const isTray = placement === 'tray';
  const isDocked = placement === 'docked';
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState(null); // non-null once the user drags
  const [autoPos, setAutoPos] = useState(null); // default tracks the book's center
  const [link, setLinkPanel] = useState(null); // { range, text, url } when open
  const [, force] = useState(0); // re-render after async font-library load
  const toolbarRef = useRef(null);
  const stopDragRef = useRef(null);
  useEffect(() => () => stopDragRef.current?.(), []);

  useEffect(() => {
    if (isTray || isDocked || pos) return;
    const rootEl = rootRef?.current;
    const bookEl = bookRef?.current;
    const tbEl = toolbarRef.current;
    if (!rootEl || !bookEl || !tbEl) return;
    const compute = () => {
      const rootRect = rootEl.getBoundingClientRect();
      const bookRect = bookEl.getBoundingClientRect();
      const tbRect = tbEl.getBoundingClientRect();
      setAutoPos({
        x: (bookRect.left - rootRect.left) + (bookRect.width - tbRect.width) / 2,
        y: 12,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(rootEl);
    ro.observe(bookEl);
    ro.observe(tbEl);
    return () => ro.disconnect();
  }, [isTray, isDocked, pos, rootRef, bookRef]);

  if (!editor || editor.isDestroyed) return null;

  const startDrag = (e) => {
    e.preventDefault();
    const el = toolbarRef.current;
    const rootEl = rootRef?.current;
    if (!el || !rootEl) return;
    stopDragRef.current?.();
    const release = lockDragSelection();
    const rect = el.getBoundingClientRect();
    const parent = rootEl.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    let last = null;
    const move = (ev) => {
      last = {
        x: Math.max(0, Math.min(ev.clientX - parent.left - ox, parent.width - rect.width)),
        y: Math.max(0, Math.min(ev.clientY - parent.top - oy, parent.height - rect.height)),
      };
      setPos(last);
    };
    const up = () => {
      release();
      stopDragRef.current = null;
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (last) {
        logger.info('journal', 'Toolbar dragged', {
          x: Math.round(last.x),
          y: Math.round(last.y),
          folioId: toolbarId,
        });
      }
    };
    stopDragRef.current = up;
    window.addEventListener('blur', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const effectivePos = isTray || isDocked ? null : (pos || autoPos);

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

  const secondaryTools = (
    <>
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
    </>
  );

  /* Docked shows every tool in the one row (no chevron reveal); the pill
     and the float tray keep the chevron + second row so they stay compact. */
  const toolsRow = (
    <div className="rt-row">
      {isTray ? (
        <button
          type="button"
          className="rt-btn rt-btn--drag rt-btn--tray-dismiss"
          title="Hide formatting tools"
          aria-label="Hide formatting tools"
          onClick={onDismiss}
        >
          {I.drag}
        </button>
      ) : isDocked ? (
        <button
          type="button"
          className="rt-btn rt-btn--drag rt-btn--dock-handle"
          title="Double-click to float this toolbar"
          aria-label="Formatting toolbar handle; double-click to float"
          onDoubleClick={() => {
            onTogglePlacement?.();
            logger.info('journal', 'Toolbar floated from top strip', { folioId: toolbarId });
          }}
        >
          {I.drag}
        </button>
      ) : (
        <button
          type="button"
          className="rt-btn rt-btn--drag"
          title="Move toolbar (double-click to dock)"
          aria-label="Move formatting toolbar"
          onPointerDown={startDrag}
          onDoubleClick={() => {
            onTogglePlacement?.();
            logger.info('journal', 'Toolbar docked to top strip', { folioId: toolbarId });
          }}
        >
          {I.drag}
        </button>
      )}
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
      {isDocked ? (
        secondaryTools
      ) : (
        <Btn title={expanded ? 'Fewer tools' : 'More tools'} active={expanded} onClick={() => setExpanded(!expanded)}>
          <span className={'rt-chevron' + (expanded ? ' is-open' : '')}>{I.chevron}</span>
        </Btn>
      )}
    </div>
  );

  return (
    <div
      ref={toolbarRef}
      className={'rt-toolbar' + (isTray ? ' rt-toolbar--tray' : '') + (isDocked ? ' rt-toolbar--docked' : '')}
      style={effectivePos ? { left: `${effectivePos.x}px`, top: `${effectivePos.y}px`, right: 'auto', transform: 'none' } : undefined}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isDocked ? (
        <div
          className="rt-dockscroll"
          role="region"
          tabIndex={0}
          aria-label="Formatting tools; scroll horizontally for more"
        >
          {toolsRow}
        </div>
      ) : (
        toolsRow
      )}

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

      {!isDocked && expanded && (
        <div className="rt-row rt-row--secondary">
          {secondaryTools}
        </div>
      )}
    </div>
  );
}
