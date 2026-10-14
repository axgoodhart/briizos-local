import { useEffect, useReducer, useRef, useState } from 'react';
import { onTerminal, runTerminal, stopTerminal } from '../store';
import { GLYPH } from '../catalog';
import { createAnsi, feedAnsi } from './ansi';

function shortPath(path = '') {
  return path.replace(/^\/Users\/[^/]+/, '~');
}

export default function TerminalCard({ island, card, terminal }) {
  const ansi = useRef(createAnsi());
  const seen = useRef(0);
  const outRef = useRef(null);
  const stick = useRef(true);
  const frame = useRef(0);
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const running = !!terminal?.running;
  const cwd = terminal?.cwd || card.data.cwd || island.rootPath || '~';

  useEffect(() => {
    let ready = false;
    const queue = [];
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(redraw);
    };
    const take = (data, total) => {
      const start = total - data.length;
      if (total <= seen.current) return;
      feedAnsi(ansi.current, start < seen.current ? data.slice(seen.current - start) : data);
      seen.current = total;
      schedule();
    };
    const off = onTerminal(card.id, (data, total) => (ready ? take(data, total) : queue.push([data, total])));
    (window.api.forestTerminalSnapshot?.({ cardId: card.id }) || Promise.resolve(null)).then((snap) => {
      ansi.current = feedAnsi(createAnsi(), snap?.buffer || '');
      seen.current = snap?.total || 0;
      ready = true;
      queue.splice(0).forEach(([data, total]) => take(data, total));
      redraw();
    });
    return () => { off(); cancelAnimationFrame(frame.current); };
  }, [card.id]);

  useEffect(() => {
    const el = outRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  });

  const submit = () => {
    const command = input.trim();
    if (!command) return;
    runTerminal(island.id, card.id, command);
    setInput('');
    setHistoryIndex(-1);
  };

  const history = card.data.history || [];
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const next = Math.min(history.length - 1, historyIndex + 1);
      setHistoryIndex(next);
      setInput(history[next]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(Math.max(-1, next));
      setInput(next < 0 ? '' : history[next]);
    }
    if (e.key === 'c' && e.ctrlKey && running) { e.preventDefault(); stopTerminal(island.id, card.id); }
  };

  const clear = () => {
    window.api.forestTerminalClear?.({ cardId: card.id });
    ansi.current = createAnsi();
    redraw();
  };

  return (
    <div className="fo-term" data-running={running ? 'true' : undefined}>
      <div className="fo-term__bar">
        <span className="fo-term__cwd" title={cwd}>{shortPath(cwd)}</span>
        {running ? (
          <button type="button" className="fo-icon-btn" onClick={() => stopTerminal(island.id, card.id)} title="Stop">
            <span className="fo-glyph">{GLYPH.stop}</span>
          </button>
        ) : card.data.command ? (
          <button type="button" className="fo-icon-btn" onClick={() => runTerminal(island.id, card.id, card.data.command)} title={`Run ${card.data.command}`}>
            <span className="fo-glyph">{GLYPH.play}</span>
          </button>
        ) : null}
        <button type="button" className="fo-icon-btn" onClick={clear} title="Clear">
          <span className="fo-glyph">{GLYPH.trash}</span>
        </button>
      </div>
      <div
        ref={outRef}
        className="fo-term__out"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        }}
      >
        {ansi.current.lines.map((line, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="fo-term__line">
            {line.length ? line.map((seg, j) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={j} className={seg.s ? seg.s.split(' ').map((c) => `fo-ansi-${c}`).join(' ') : undefined}>{seg.t}</span>
            )) : ' '}
          </div>
        ))}
      </div>
      <label className="fo-term__input">
        <span className="fo-term__prompt">{running ? '›' : '$'}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={card.data.command && !running ? card.data.command : ''}
        />
      </label>
    </div>
  );
}
