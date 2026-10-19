import { useMemo, useState } from 'react';
import { importPaths, relocateFile, removeFileFromCard, setCover } from '../store';
import { GLYPH } from '../catalog';
import { pickFiles } from '../gestures';
import { isAudio, isVideo, toFileUrl } from '../util';

function Preview({ file, large = false }) {
  const src = toFileUrl(file.path);
  if (isVideo(file)) return <video className="fo-media__img" src={src} muted={!large} controls={large} playsInline preload="metadata" />;
  if (isAudio(file)) {
    return (
      <div className="fo-media__audio">
        <span className="fo-glyph">􀑪</span>
        <span>{file.name}</span>
        {large && <audio src={src} controls preload="metadata" />}
      </div>
    );
  }
  return <img className="fo-media__img" src={src} alt={file.name} loading="lazy" draggable={false} />;
}

export default function MediaCard({ island, card, fileStatus }) {
  const [openId, setOpenId] = useState(null);
  const files = useMemo(() => {
    const ids = new Set(card.data.fileIds || []);
    return island.files.filter((f) => ids.has(f.id));
  }, [island.files, card.data.fileIds]);
  const open = files.find((f) => f.id === openId) || null;
  const index = open ? files.indexOf(open) : -1;

  const add = async () => {
    const paths = await pickFiles({ accept: 'image/*,video/*,audio/*' });
    if (paths.length) importPaths(paths, { islandId: island.id, cardId: card.id });
  };

  if (open) {
    return (
      <div className="fo-media fo-media--open">
        <div className="fo-media__bar">
          <button type="button" className="fo-icon-btn" onClick={() => setOpenId(null)} title="Back"><span className="fo-glyph">{GLYPH.chevronLeft}</span></button>
          <span className="fo-media__name">{open.name}</span>
          <span className="fo-whisper">{index + 1}/{files.length}</span>
          <button type="button" className="fo-icon-btn" onClick={() => setOpenId(files[(index - 1 + files.length) % files.length].id)} title="Previous"><span className="fo-glyph">{GLYPH.chevronLeft}</span></button>
          <button type="button" className="fo-icon-btn" onClick={() => setOpenId(files[(index + 1) % files.length].id)} title="Next"><span className="fo-glyph">{GLYPH.chevron}</span></button>
          <button type="button" className="fo-icon-btn" onClick={() => window.api.islandOpenPath(open.path)} title="Open in its app"><span className="fo-glyph">{GLYPH.open}</span></button>
        </div>
        <div className="fo-media__stage"><Preview file={open} large /></div>
      </div>
    );
  }

  return (
    <div className="fo-media">
      <div className="fo-media__grid">
        {files.map((file) => {
          const missing = fileStatus?.[file.path] === 'missing';
          return (
            <figure
              key={file.id}
              className="fo-media__tile"
              data-missing={missing ? 'true' : undefined}
              title={file.name}
              onClick={() => !missing && setOpenId(file.id)}
              onDoubleClick={() => !missing && window.api.islandOpenPath(file.path)}
            >
              {missing ? (
                <div className="fo-missing">
                  <span className="fo-glyph">{GLYPH.warning}</span>
                  <button type="button" className="fo-link" onClick={(e) => { e.stopPropagation(); relocateFile(island.id, file.id); }}>Find it</button>
                </div>
              ) : <Preview file={file} />}
              {!missing && (
                <button
                  type="button"
                  className="fo-media__cover"
                  aria-pressed={island.cover?.path === file.path}
                  onClick={(e) => { e.stopPropagation(); setCover(island.id, island.cover?.path === file.path ? null : file); }}
                  title={island.cover?.path === file.path ? 'Island cover (click to remove)' : 'Use as the island cover'}
                ><span className="fo-glyph">􀏅</span></button>
              )}
              <button type="button" className="fo-media__remove" onClick={(e) => { e.stopPropagation(); removeFileFromCard(island.id, card.id, file.id); }} title="Take off this card">
                <span className="fo-glyph">{GLYPH.close}</span>
              </button>
            </figure>
          );
        })}
        <button type="button" className="fo-media__add" onClick={add} title="Add media"><span className="fo-glyph">{GLYPH.plus}</span></button>
      </div>
    </div>
  );
}
