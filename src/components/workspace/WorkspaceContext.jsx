import { createContext, useCallback, useContext, useMemo } from 'react';

const WorkspaceContext = createContext(null);

export const WORKSPACE_SURFACES = [
  { id: 'canvas', label: 'canvas', glyph: '#' },
  { id: 'journals', label: 'journals', glyph: 'J' },
  { id: 'notefalls', label: 'notefalls', glyph: 'N' },
];

const DEFAULT_WORKSPACE_STATE = {
  activeSurface: 'canvas',
  selectedCanvasProjectId: null,
  selectedJournalId: null,
  selectedFolioId: null,
  selectedNotefallId: null,
  workspaceSelection: null,
};

function normalizeWorkspaceState(workspace) {
  const activeSurface = WORKSPACE_SURFACES.some((surface) => surface.id === workspace?.activeSurface)
    ? workspace.activeSurface
    : DEFAULT_WORKSPACE_STATE.activeSurface;

  return {
    ...DEFAULT_WORKSPACE_STATE,
    ...(workspace || {}),
    activeSurface,
  };
}

export function WorkspaceProvider({ workspace, onWorkspaceChange, children }) {
  const state = normalizeWorkspaceState(workspace);

  const updateWorkspace = useCallback((partial) => {
    onWorkspaceChange?.(partial);
  }, [onWorkspaceChange]);

  const setActiveSurface = useCallback((activeSurface) => {
    if (!WORKSPACE_SURFACES.some((surface) => surface.id === activeSurface)) return;
    updateWorkspace({ activeSurface });
  }, [updateWorkspace]);

  const setWorkspaceSelection = useCallback((partial) => {
    updateWorkspace(partial);
  }, [updateWorkspace]);

  const value = useMemo(() => ({
    ...state,
    surfaces: WORKSPACE_SURFACES,
    setActiveSurface,
    setWorkspaceSelection,
    updateWorkspace,
  }), [state, setActiveSurface, setWorkspaceSelection, updateWorkspace]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}
