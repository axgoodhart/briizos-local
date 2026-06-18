import WorkspaceHeader from './WorkspaceHeader.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import CanvasSurface from './canvas/CanvasSurface.jsx';
import JournalsSurface from './journals/JournalsSurface.jsx';
import NotefallsSurface from './notefalls/NotefallsSurface.jsx';
import './WorkspacePanel.css';

function WorkspacePanels() {
  const { activeSurface } = useWorkspace();

  return (
    <div className="workspace-panels">
      <section className="workspace-panel" hidden={activeSurface !== 'canvas'}>
        <CanvasSurface />
      </section>
      <section className="workspace-panel" hidden={activeSurface !== 'journals'}>
        <JournalsSurface />
      </section>
      <section className="workspace-panel" hidden={activeSurface !== 'notefalls'}>
        <NotefallsSurface />
      </section>
    </div>
  );
}

export default function WorkspacePanel({ workspace, onWorkspaceChange }) {
  return (
    <div className="workspace-shell">
      <WorkspaceProvider workspace={workspace} onWorkspaceChange={onWorkspaceChange}>
        <WorkspaceHeader />
        <WorkspacePanels />
      </WorkspaceProvider>
    </div>
  );
}
