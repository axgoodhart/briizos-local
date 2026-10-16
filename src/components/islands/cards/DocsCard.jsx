import { useEffect, useMemo, useRef, useState } from 'react';
import logger from '../../../lib/logger';
import { createOwnedDoc, importPaths, relocateFile, removeFileFromCard, updateCardData } from '../store';
import { GLYPH } from '../catalog';
import { pickFiles } from '../gestures';
import { fileBadge, relativeTime } from '../util';

// ==== DOCS ====
const AUTOSAVE_MS = 700;
const CODE_EXTS = new Set(['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'json', 'yaml', 'yml', 'py', 'rb', 'go', 'rs', 'swift', 'kt', 'java', 'c', 'cpp', 'h', 'sh', 'sql', 'xml', 'toml']);

function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function Markdown({ text }) {
  const blocks = [];
  let list = null;
  String(text).split('\n').forEach((line, i) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list, key: i }); }
      list.push(bullet[1]);
      return;
    }
    list = null;
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) blocks.push({ type: `h${heading[1].length}`, text: heading[2], key: i });
    else if (line.trim()) blocks.push({ type: 'p', text: line, key: i });
  });
  return (
    <div className="fo-md">
      {blocks.map((b) => {
        if (b.type === 'ul') return <ul key={b.key}>{b.items.map((item, j) => <li key={j}>{inline(item)}</li>)}</ul>;
        const Tag = b.type;
        return <Tag key={b.key}>{inline(b.text)}</Tag>;
      })}
    </div>
  );
}

function OpenFile({ island, card, file, onBack }) {
  const [preview, setPreview] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    setPreview(null);
    window.api.islandFilePreview?.(file.path).then((result) => {
      if (!alive) return;
      setPreview(result);
      setDraft(result?.text ?? '');
    });
    return () => { alive = false; clearTimeout(timer.current); };
  }, [file.path, file.modifiedAt]);

  const save = (text) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await window.api.islandOwnedWrite(file.path, text);
      } catch (error) {
        logger.error('island.files', `Could not save “${file.name}”. Your typing is still in the card; try again.`, { problem: error?.message });
      }
    }, AUTOSAVE_MS);
  };

  const ext = String(file.ext || '').toLowerCase();
  const owned = file.owned || preview?.owned;

  let body = null;
  if (!preview) body = null;
  else if (!preview.ok) {
    body = (
      <div className="fo-missing">
        <span className="fo-glyph">{GLYPH.warning}</span>
        <span>{preview.missing ? 'Not where it used to be.' : 'Could not be read.'}</span>
        {preview.missing && <button type="button" className="fo-link" onClick={() => relocateFile(island.id, file.id)}>Find it</button>}
      </div>
    );
  } else if (preview.kind === 'folder') {
    body = (
      <ul className="fo-docs__entries">
        {preview.entries.map((entry) => (
          <li key={entry.name}>
            <button type="button" className="fo-docs__entry" onDoubleClick={() => window.api.islandOpenPath(`${file.path}/${entry.name}`)}>
              <span className="fo-glyph">{entry.folder ? GLYPH.folder : GLYPH.file}</span>{entry.name}
            </button>
          </li>
        ))}
      </ul>
    );
  } else if (preview.kind === 'binary') {
    body = (
      <button type="button" className="fo-docs__binary" onClick={() => window.api.islandOpenPath(file.path)}>
        <span className="fo-docs__badge">{fileBadge(file)}</span>
        <span>Open in its app</span>
      </button>
    );
  } else if (owned && editing) {
    body = (
      <textarea
        className="fo-docs__editor"
        value={draft}
        autoFocus
        spellCheck
        onChange={(e) => { setDraft(e.target.value); save(e.target.value); }}
        onBlur={() => setEditing(false)}
      />
    );
  } else if (CODE_EXTS.has(ext)) {
    body = <pre className="fo-docs__code" onDoubleClick={() => owned && setEditing(true)}>{draft}{preview.truncated ? '\n…' : ''}</pre>;
  } else {
    body = <div className="fo-docs__text" onDoubleClick={() => owned && setEditing(true)}>{ext === 'md' || ext === 'txt' || !ext ? <Markdown text={draft} /> : <pre>{draft}</pre>}</div>;
  }

  return (
    <div className="fo-docs fo-docs--open">
      <div className="fo-docs__bar">
        {(card.data.fileIds || []).length > 1 && (
          <button type="button" className="fo-icon-btn" onClick={onBack} title="All files"><span className="fo-glyph">{GLYPH.chevronLeft}</span></button>
        )}
        <span className="fo-docs__name" title={file.path}>{file.name}</span>
        {owned && preview?.kind === 'text' && (
          <button type="button" className="fo-icon-btn" aria-pressed={editing} onClick={() => setEditing((e) => !e)} title="Edit"><span className="fo-glyph">{GLYPH.pencil}</span></button>
        )}
        <button type="button" className="fo-icon-btn" onClick={() => window.api.islandOpenPath(file.path)} title="Open in its app"><span className="fo-glyph">{GLYPH.open}</span></button>
        <button type="button" className="fo-icon-btn" onClick={() => window.api.islandShowItemInFolder(file.path)} title="Show in Finder"><span className="fo-glyph">{GLYPH.folder}</span></button>
      </div>
      <div className="fo-docs__content">{body}</div>
    </div>
  );
}

export default function DocsCard({ island, card, fileStatus }) {
  const creating = useRef(false);
  const files = useMemo(() => {
    const ids = card.data.fileIds || [];
    const byId = new Map(island.files.map((f) => [f.id, f]));
    return ids.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => (a.typeGroup === 'folder' ? -1 : 0) - (b.typeGroup === 'folder' ? -1 : 0) || a.name.localeCompare(b.name));
  }, [island.files, card.data.fileIds]);

  // Templates can ask for a starting document made inside briizOS.
  useEffect(() => {
    if (!card.data.newDoc || files.length || creating.current) return;
    creating.current = true;
    createOwnedDoc(island.id, card.id, card.data.newDoc, card.data.newDocBody || '');
  }, [card.data.newDoc, files.length, island.id, card.id]);

  const openFile = files.find((f) => f.id === card.data.openFileId) || (files.length === 1 ? files[0] : null);
  if (openFile) {
    return <OpenFile island={island} card={card} file={openFile} onBack={() => updateCardData(island.id, card.id, { openFileId: null })} />;
  }

  const attach = async () => {
    const paths = await pickFiles();
    if (paths.length) importPaths(paths, { islandId: island.id, cardId: card.id });
  };

  return (
    <div className="fo-docs">
      <ul className="fo-docs__list">
        {files.map((file) => {
          const missing = fileStatus?.[file.path] === 'missing';
          return (
            <li key={file.id} className="fo-docs__row" data-missing={missing ? 'true' : undefined}>
              <button
                type="button"
                className="fo-docs__file"
                onClick={() => updateCardData(island.id, card.id, { openFileId: file.id })}
                onDoubleClick={() => window.api.islandOpenPath(file.path)}
                title={file.path}
              >
                <span className="fo-docs__badge">{fileBadge(file)}</span>
                <span className="fo-docs__fname">{file.name}</span>
                <span className="fo-whisper">{missing ? 'missing' : relativeTime(file.modifiedAt)}</span>
              </button>
              {missing && <button type="button" className="fo-link" onClick={() => relocateFile(island.id, file.id)}>Find it</button>}
              <button type="button" className="fo-docs__remove" onClick={() => removeFileFromCard(island.id, card.id, file.id)} title="Take off this card">
                <span className="fo-glyph">{GLYPH.close}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="fo-docs__actions">
        <button type="button" className="fo-icon-btn" onClick={() => createOwnedDoc(island.id, card.id, 'Untitled.md', '')} title="New document">
          <span className="fo-glyph">{GLYPH.compose}</span>
        </button>
        <button type="button" className="fo-icon-btn" onClick={attach} title="Bring in files">
          <span className="fo-glyph">{GLYPH.attach}</span>
        </button>
      </div>
    </div>
  );
}
