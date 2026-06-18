import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../WorkspaceContext.jsx';
import './canvasSurface.css';

function fileName(path) {
  return String(path || '').split(/[\\/]/).filter(Boolean).pop() || 'untitled';
}

function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function statusLabel(status) {
  if (status === 'missing') return 'missing';
  if (status === 'modified') return 'modified';
  if (status === 'ok') return 'ok';
  return 'unscanned';
}

export default function CanvasSurface() {
  const {
    selectedCanvasProjectId,
    setWorkspaceSelection,
  } = useWorkspace();
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [library, setLibrary] = useState([]);
  const [query, setQuery] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const selectedProject = useMemo(() => {
    if (!projects.length) return null;
    return projects.find((project) => project.id === selectedCanvasProjectId) || projects[0];
  }, [projects, selectedCanvasProjectId]);

  const refreshProjects = useCallback(async () => {
    const api = window.api;
    const list = await api.canvasProjectsList();
    setProjects(Array.isArray(list) ? list : []);
    if (!selectedCanvasProjectId && list?.[0]?.id) {
      setWorkspaceSelection({ selectedCanvasProjectId: list[0].id });
    }
    return list || [];
  }, [selectedCanvasProjectId, setWorkspaceSelection]);

  const refreshFiles = useCallback(async (projectId) => {
    if (!projectId) {
      setFiles([]);
      return [];
    }
    const list = await window.api.canvasProjectFilesList(projectId);
    setFiles(Array.isArray(list) ? list : []);
    return list || [];
  }, []);

  const refreshLibrary = useCallback(async () => {
    if (!window.api?.canvasList) return [];
    const list = await window.api.canvasList();
    setLibrary(Array.isArray(list) ? list : []);
    return list || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const nextProjects = await refreshProjects();
        if (cancelled) return;
        const projectId = selectedCanvasProjectId || nextProjects?.[0]?.id;
        await refreshFiles(projectId);
        await refreshLibrary();
      } catch (error) {
        if (!cancelled) setMessage(error?.message || 'Canvas workspace failed to load');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshProjects, refreshFiles, refreshLibrary, selectedCanvasProjectId]);

  useEffect(() => {
    refreshFiles(selectedProject?.id);
  }, [refreshFiles, selectedProject?.id]);

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => (
      file.name?.toLowerCase().includes(q) ||
      file.path?.toLowerCase().includes(q) ||
      file.kind?.toLowerCase().includes(q)
    ));
  }, [files, query]);

  const createProject = async () => {
    const name = newProjectName.trim() || 'Untitled project';
    setBusy(true);
    setMessage('');
    try {
      const project = await window.api.canvasProjectsCreate({ name });
      setNewProjectName('');
      await refreshProjects();
      setWorkspaceSelection({ selectedCanvasProjectId: project.id, workspaceSelection: { type: 'canvasProject', id: project.id } });
    } catch (error) {
      setMessage(error?.message || 'Project create failed');
    } finally {
      setBusy(false);
    }
  };

  const addPath = async () => {
    if (!selectedProject || !newPath.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      await window.api.canvasProjectFilesAdd(selectedProject.id, { path: newPath.trim() });
      setNewPath('');
      await refreshFiles(selectedProject.id);
    } catch (error) {
      setMessage(error?.message || 'Path import failed');
    } finally {
      setBusy(false);
    }
  };

  const scanFiles = async () => {
    if (!selectedProject) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await window.api.canvasProjectFilesScan(selectedProject.id);
      await refreshFiles(selectedProject.id);
      setMessage(`FileHawk scanned ${result?.count || 0} paths`);
    } catch (error) {
      setMessage(error?.message || 'FileHawk scan failed');
    } finally {
      setBusy(false);
    }
  };

  const snapshotProject = async () => {
    if (!selectedProject) return;
    setBusy(true);
    setMessage('');
    try {
      const rows = files.map((file) => `<li>${file.name} - ${file.path}</li>`).join('');
      const html = `<!doctype html><html><body><h1>${selectedProject.name}</h1><ul>${rows}</ul></body></html>`;
      const saved = await window.api.canvasSave(selectedProject.name, html);
      setMessage(saved?.filename ? `Saved canvas library snapshot: ${saved.filename}` : 'Snapshot saved');
      await refreshLibrary();
    } catch (error) {
      setMessage(error?.message || 'Snapshot save failed');
    } finally {
      setBusy(false);
    }
  };

  const consolidate = async () => {
    if (!selectedProject) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await window.api.canvasProjectConsolidate(selectedProject.id);
      setMessage(`Consolidated ${result?.linkedFiles || 0} project files`);
    } catch (error) {
      setMessage(error?.message || 'Consolidate failed');
    } finally {
      setBusy(false);
    }
  };

  const openPath = (path) => {
    if (path) window.api.workspaceOpenPath(path);
  };

  return (
    <div className="canvas-surface">
      <aside className="canvas-projects">
        <div className="canvas-projects__new">
          <input
            type="text"
            value={newProjectName}
            placeholder="new project"
            onInput={(event) => setNewProjectName(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && createProject()}
          />
          <button type="button" onClick={createProject} disabled={busy} title="Create project">+</button>
        </div>

        <div className="canvas-projects__list">
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              className={`canvas-project${project.id === selectedProject?.id ? ' is-selected' : ''}`}
              onClick={() => setWorkspaceSelection({
                selectedCanvasProjectId: project.id,
                workspaceSelection: { type: 'canvasProject', id: project.id },
              })}
            >
              <span className="canvas-project__name">{project.name}</span>
              <span className="canvas-project__meta">{project.fileCount || 0} files</span>
            </button>
          ))}
          {!projects.length && <p className="canvas-empty">No canvas projects yet.</p>}
        </div>
      </aside>

      <main className="canvas-stage">
        <div className="canvas-toolbar">
          <input
            type="search"
            value={query}
            placeholder="file hunter"
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          <button type="button" onClick={scanFiles} disabled={!selectedProject || busy}>FileHawk</button>
          <button type="button" onClick={snapshotProject} disabled={!selectedProject || busy}>Save library</button>
          <button type="button" onClick={consolidate} disabled={!selectedProject || busy}>Consolidate</button>
        </div>

        <section className="canvas-board">
          {selectedProject ? (
            <>
              <div className="canvas-board__head">
                <div>
                  <h2>{selectedProject.name}</h2>
                  <span>{visibleFiles.length} visible of {files.length} files</span>
                </div>
                <div className="canvas-import">
                  <input
                    type="text"
                    value={newPath}
                    placeholder="/path/to/import"
                    onInput={(event) => setNewPath(event.currentTarget.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addPath()}
                  />
                  <button type="button" onClick={addPath} disabled={busy || !newPath.trim()}>Import path</button>
                </div>
              </div>

              <div className="canvas-filegrid">
                {visibleFiles.map((file) => (
                  <article className={`canvas-file is-${file.status || 'unknown'}`} key={file.id}>
                    <button type="button" className="canvas-file__open" onClick={() => openPath(file.path)}>
                      {file.name || fileName(file.path)}
                    </button>
                    <span className="canvas-file__path">{file.path}</span>
                    <div className="canvas-file__meta">
                      <span>{file.kind || 'file'}</span>
                      <span>{formatBytes(file.size)}</span>
                      <span>{statusLabel(file.status)}</span>
                    </div>
                  </article>
                ))}
                {!visibleFiles.length && <p className="canvas-empty">No files match this view.</p>}
              </div>
            </>
          ) : (
            <div className="canvas-start">
              <h2>canvas</h2>
              <button type="button" onClick={createProject} disabled={busy}>Create project</button>
            </div>
          )}
        </section>
      </main>

      <aside className="canvas-library">
        <h3>library</h3>
        <div className="canvas-library__list">
          {library.map((canvas) => (
            <button type="button" key={canvas.filename} onClick={() => openPath(canvas.path)}>
              <span>{canvas.title || canvas.filename}</span>
              <small>{canvas.source || 'canvas'}</small>
            </button>
          ))}
          {!library.length && <p className="canvas-empty">No saved canvases.</p>}
        </div>
        {message && <p className="canvas-message">{message}</p>}
      </aside>
    </div>
  );
}
