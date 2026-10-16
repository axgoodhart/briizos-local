import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import {
  addCard, allCardTemplates, allIslandTemplates, createIsland, dismissToast, getIsland, importPaths, openHunt, select,
  setUi, updateIsland, addFilesToIsland,
} from './store';
import { CARD_TYPES, GLYPH } from './catalog';
import { pickFiles } from './gestures';
import { uid } from './util';
import { ProjectQuestions } from './cards/ThoughtsCard';

export const RootContext = createContext({ current: null });

// Places a popover at a screen point, kept inside the Island panel.
function usePlacement(screen) {
  const rootRef = useContext(RootContext);
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    const root = rootRef.current?.getBoundingClientRect();
    const box = ref.current?.getBoundingClientRect();
    if (!root || !box) return;
    const left = Math.min(Math.max(8, screen.x - root.left + 8), root.width - box.width - 8);
    const top = Math.min(Math.max(8, screen.y - root.top + 8), root.height - box.height - 8);
    setPos({ left, top });
  }, [screen.x, screen.y, rootRef]);
  return [ref, pos];
}

function useEscape(onClose) {
  useLayoutEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

export function NewCardMenu({ menu }) {
  const [ref, pos] = usePlacement(menu.screen);
  const close = () => setUi({ menu: null });
  useEscape(close);
  const island = getIsland(menu.islandId);
  if (!island) return null;
  const templates = allCardTemplates();

  const make = (kind, template = null) => {
    addCard(island.id, { kind, rect: menu.rect, template });
    close();
  };
  const attach = async () => {
    close();
    const paths = await pickFiles();
    if (paths.length) importPaths(paths, { islandId: island.id });
  };
  const linkFolder = async () => {
    close();
    const dir = await window.api.islandOpenDirectoryDialog?.();
    if (!dir) return;
    const name = dir.split('/').filter(Boolean).pop() || dir;
    const record = { id: uid('file'), name, path: dir, typeGroup: 'folder', ext: '', size: 0, modifiedAt: new Date().toISOString() };
    const card = addCard(island.id, { kind: 'docs', title: name, rect: menu.rect, data: { fileIds: [], openFileId: record.id } });
    addFilesToIsland(island.id, [record], { cardId: card?.id, source: 'linked folder' });
    if (!island.rootPath) updateIsland(island.id, { rootPath: dir });
  };

  return (
    <div ref={ref} className="fo-pop fo-newcard" style={pos} onPointerDown={(e) => e.stopPropagation()}>
      <div className="fo-newcard__head">
        <span>new</span>
        <span className="fo-glyph fo-newcard__spark">{GLYPH.bolt}</span>
      </div>
      <div className="fo-newcard__grid">
        {CARD_TYPES.map((type) => (
          <button key={type.kind} type="button" className="fo-newcard__type" data-kind={type.kind} onClick={() => make(type.kind)} title={type.label}>
            <span className="fo-glyph">{type.glyph}</span>
            <span className="fo-newcard__label">{type.label}</span>
          </button>
        ))}
      </div>
      <div className="fo-newcard__more">
        {templates.map((template) => (
          <button key={template.id} type="button" className="fo-menu__item" onClick={() => make(template.kind, template)}>
            <span className="fo-glyph">{CARD_TYPES.find((t) => t.kind === template.kind)?.glyph}</span>{template.name}
          </button>
        ))}
        <button type="button" className="fo-menu__item" onClick={attach}><span className="fo-glyph">{GLYPH.attach}</span>Bring in files…</button>
        <button type="button" className="fo-menu__item" onClick={linkFolder}><span className="fo-glyph">{GLYPH.folder}</span>Link a folder…</button>
        <button type="button" className="fo-menu__item" onClick={() => { close(); openHunt(island.id); }}><span className="fo-glyph">{GLYPH.search}</span>Find files…</button>
      </div>
    </div>
  );
}

export function NamingPrompt({ naming }) {
  const [ref, pos] = usePlacement(naming.screen);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('tpl-blank');
  const close = () => setUi({ naming: null });
  useEscape(close);
  const templates = allIslandTemplates();

  const create = () => {
    if (!name.trim()) return;
    const island = createIsland({ name, rect: naming.rect, templateId });
    close();
    select({ islandId: island.id });
  };

  return (
    <div ref={ref} className="fo-pop fo-naming" style={pos} onPointerDown={(e) => e.stopPropagation()}>
      <input
        className="fo-naming__input"
        autoFocus
        value={name}
        placeholder="Island name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
      />
      <div className="fo-naming__templates">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="fo-chip-btn"
            aria-pressed={templateId === template.id}
            onClick={() => setTemplateId(template.id)}
          >{template.name}</button>
        ))}
      </div>
    </div>
  );
}

export function QuestionsPopover({ islandId }) {
  const island = getIsland(islandId);
  const close = () => setUi({ questions: null });
  useEscape(close);
  if (!island) return null;
  return (
    <div className="fo-pop fo-questions" style={{ '--accent': island.accent, '--accent-rgb': island.accentRgb }} onPointerDown={(e) => e.stopPropagation()}>
      <header className="fo-questions__head">
        <span className="fo-glyph">{GLYPH.text}</span>
        <span>{island.name}</span>
        <button type="button" className="fo-icon-btn" onClick={close} title="Close"><span className="fo-glyph">{GLYPH.close}</span></button>
      </header>
      <ProjectQuestions island={island} />
    </div>
  );
}

export function Toasts({ toasts }) {
  return (
    <div className="fo-toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="fo-toast">
          <span>{t.text}</span>
          {t.action && (
            <button type="button" className="fo-link" onClick={() => { t.action.run(); dismissToast(t.id); }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  );
}
