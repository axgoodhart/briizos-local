import { useEffect, useRef } from 'react';
import {
  activeDesk, attach, closeFullView, deskIslands, deskPositions, detach, getIsland, getState, load, removeCard, setUi, useIslandVersion,
  closePanel,
} from './store';
import { frameRects } from './camera';
import DeskView from './DeskView';
import StackView from './StackView';
import FullView from './FullView';
import CanvasView from './CanvasView';
import IslandSettings from './IslandSettings';
import IslandsJournal from './IslandsJournal';
import DeskPanel from './DeskPanel';
import HuntPanel from './HuntPanel';
import { DeskControls, TagStrip, ToolPalette, TopBar } from './Chrome';
import { NamingPrompt, NewCardMenu, QuestionsPopover, RootContext, Toasts } from './Overlays';

const typing = () => /input|textarea|select/i.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;

export default function IslandsApp() {
  const rootRef = useRef(null);
  useEffect(() => { attach(); return () => detach(); }, []);
  useIslandVersion();
  const S = getState();
  const { ui } = S;
  const desk = activeDesk();
  const islands = deskIslands(desk);
  const positions = ui.tagArrangement?.deskId === desk.id ? ui.tagArrangement.positions : deskPositions(desk, islands);
  const rects = islands.map((i) => ({ ...positions[i.id], ...(ui.tagArrangement?.sizes[i.id] || { w: i.w, h: i.h }) }));
  const focusIsland = getIsland(ui.focusIslandId || ui.selection?.islandId);
  const panelIsland = getIsland(ui.panelIslandId);
  const fullIsland = getIsland(ui.fullIslandId);
  const canvasIsland = !fullIsland ? getIsland(ui.canvasIslandId) : null;

  useEffect(() => {
    if (!ui.zoomTo || ui.stack || ui.fullIslandId || ui.canvasIslandId) return;
    const island = getIsland(ui.zoomTo);
    const pos = deskPositions(activeDesk(), [island].filter(Boolean))[ui.zoomTo];
    if (island && pos) requestAnimationFrame(() => frameRects([{ ...pos, w: island.w, h: island.h }], { maxScale: 1 }));
    setUi({ zoomTo: null, focusIslandId: ui.zoomTo });
  }, [ui.zoomTo, ui.stack, ui.fullIslandId, ui.canvasIslandId]);

  useEffect(() => {
    const onKey = (e) => {
      if (!rootRef.current?.matches(':hover') || typing()) return;
      const { ui: now } = getState();
      if (e.key === 'Escape') {
        if (now.menu || now.naming || now.questions) setUi({ menu: null, naming: null, questions: null });
        else if (now.panel) closePanel();
        else if (now.fullIslandId) closeFullView();
        else if (now.canvasIslandId) window.dispatchEvent(new CustomEvent('island-canvas-close'));
        else if (now.tagArrangement) setUi({ tagArrangement: null });
        else setUi({ selection: null, tool: 'pointer' });
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && now.selection?.cardId && !now.stack) {
        const kind = getIsland(now.selection.islandId)?.cards.find((c) => c.id === now.selection.cardId)?.kind;
        if (kind === 'planning') return;
        e.preventDefault();
        removeCard(now.selection.islandId, now.selection.cardId);
      }
      if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey) setUi({ tool: 'pointer' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!S.loaded) {
    return (
      <div ref={rootRef} className="fo-root fo-root--loading">
        {S.loadError && <button type="button" className="fo-btn" onClick={load}>Retry</button>}
      </div>
    );
  }

  let panel = null;
  if (ui.panel === 'settings' && panelIsland) panel = <IslandSettings island={panelIsland} />;
  else if (ui.panel === 'journal') panel = <IslandsJournal islandId={ui.panelIslandId && panelIsland ? panelIsland.id : null} onClose={closePanel} />;
  else if (ui.panel === 'desks') panel = <DeskPanel />;
  else if (ui.panel === 'hunt' && panelIsland) panel = <HuntPanel island={panelIsland} />;

  return (
    <RootContext.Provider value={rootRef}>
      <div ref={rootRef} className="fo-root" data-dim={desk.dim ? 'true' : undefined} data-stack={ui.stack ? 'true' : undefined} data-full={fullIsland ? 'true' : undefined} data-canvas={canvasIsland ? 'true' : undefined}>
        <TopBar desk={desk} focusIsland={focusIsland} canvasIsland={canvasIsland} />
        <div className="fo-body">
          {fullIsland ? (
            <FullView island={fullIsland} selectedCardId={ui.selection?.islandId === fullIsland.id ? ui.selection.cardId || null : null} fileStatus={S.fileStatus} terminals={S.terminals} tasks={S.tasks} />
          ) : canvasIsland ? (
            <CanvasView island={canvasIsland} selectedCardId={ui.selection?.islandId === canvasIsland.id ? ui.selection.cardId || null : null} tool={ui.tool} fileStatus={S.fileStatus} terminals={S.terminals} tasks={S.tasks} />
          ) : ui.stack ? <StackView islands={islands} /> : <DeskView desk={desk} islands={islands} />}
          {!ui.stack && !fullIsland && <ToolPalette tool={ui.tool} />}
          {!ui.stack && !fullIsland && !canvasIsland && <TagStrip desk={desk} />}
          {!fullIsland && !canvasIsland && <DeskControls desk={desk} rects={rects} stack={ui.stack} minimap={ui.minimap} />}
          {panel}
          {ui.menu && <NewCardMenu menu={ui.menu} />}
          {ui.naming && <NamingPrompt naming={ui.naming} />}
          {ui.questions && <QuestionsPopover islandId={ui.questions.islandId} />}
          <Toasts toasts={ui.toasts} />
        </div>
      </div>
    </RootContext.Provider>
  );
}
