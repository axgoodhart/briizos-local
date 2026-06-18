import WorkspaceTab from './WorkspaceTab.jsx';
import { useWorkspace } from './WorkspaceContext.jsx';

export default function WorkspaceHeader() {
  const { activeSurface, surfaces, setActiveSurface } = useWorkspace();

  return (
    <header className="workspace-header">
      <nav className="workspace-tabbar" role="tablist" aria-label="Workspace">
        {surfaces.map((surface) => (
          <WorkspaceTab
            key={surface.id}
            label={surface.label}
            glyph={surface.glyph}
            active={activeSurface === surface.id}
            onSelect={() => setActiveSurface(surface.id)}
          />
        ))}
      </nav>
      <div className="workspace-header__mark" aria-hidden="true" />
    </header>
  );
}
