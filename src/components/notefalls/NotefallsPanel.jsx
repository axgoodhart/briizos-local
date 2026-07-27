import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './notefalls.css';
import { api, mediaUrl } from './api.js';
import { briizyApi, describeCaptureState, formatBytes } from './briizyApi.js';
import { useBriizyCapture } from '../../hooks/useBriizyCapture.js';
import logger from '../../lib/logger';
import {
  relativeTime,
  formatSessionDate,
  formatTimeRange,
  dayKey,
  WEEKDAY_LETTERS,
  MONTH_SHORT,
  DAY,
} from './dates.js';

/* ── Icons (inline SVG, stroke/fill = currentColor unless noted) ─────── */

const Icon = {
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4.5 17.5l5-5 3 3 3.5-3.5 4 4" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="#e0473e" stroke="none">
      <path d="M9 19a2.6 2.6 0 1 1-1.2-4.9c.55-.12 1-.2 1.4-.32V6.6a1 1 0 0 1 .78-.97l8-1.8A1 1 0 0 1 19.4 4.8V6l-8 1.8v6.5c0 1.7-1.1 2.9-2.4 2.9zM19.4 14.3a2.6 2.6 0 1 1-1.2-4.9c.55-.12 1-.2 1.2-.27V8.8" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 5.5c2-1 4.7-1.3 7-.3v13c-2.3-1-5-.7-7 .3z" />
      <path d="M21 5.5c-2-1-4.7-1.3-7-.3v13c2.3-1 5-.7 7 .3z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16v12H8l-4 4z" />
    </svg>
  ),
  screen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8.5 20h7M12 16.5V20" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  ),
};

/** Small leading icon per post — falls back to a generic note glyph. */
function SourceIcon({ post }) {
  switch (post.sourceIcon) {
    case 'music':
      return <span className="nf-icon nf-icon--music">{Icon.music}</span>;
    case 'photoshop':
      return <span className="nf-icon nf-icon--ps">Ps</span>;
    case 'journal':
      return <span className="nf-icon nf-icon--journal">{Icon.journal}</span>;
    default:
      if (post.captureMode === 'auto' && post.authorAgentId === 'briizy') {
        return <span className="nf-icon nf-icon--screen">{Icon.screen}</span>;
      }
      return <span className="nf-icon nf-icon--note">{Icon.note}</span>;
  }
}

/* ── Frame thumbnail ─────────────────────────────────────────────────
   Frames never arrive as paths (PLAN-BRIIZY.md §2) — main resizes and returns a
   data URL keyed by opaque frame id, and this component asks for one lazily. */

function useFrameImage(frameId, { maxWidth = 320, full = false } = {}) {
  const [dataUrl, setDataUrl] = useState(null);
  const [reason, setReason] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setReason(null);
    if (!frameId) return undefined;
    briizyApi.getFrameImage(frameId, { maxWidth, full }).then((result) => {
      if (cancelled) return;
      setDataUrl(result?.dataUrl || null);
      setReason(result?.dataUrl ? null : (result?.reason || 'unavailable'));
    });
    return () => { cancelled = true; };
  }, [frameId, maxWidth, full]);

  return { dataUrl, reason };
}

function FrameThumb({ frameId, alt = '', maxWidth = 160, className = '' }) {
  const { dataUrl, reason } = useFrameImage(frameId, { maxWidth });
  if (dataUrl) return <img className={className} src={dataUrl} alt={alt} draggable={false} />;
  return <span className={`nf-frame__placeholder ${className}`} title={reason || 'loading'} />;
}

/* ── Composer ──────────────────────────────────────────────────────── */

function Composer({ onPost, capture }) {
  const [body, setBody] = useState('');
  const [media, setMedia] = useState([]);
  const [busy, setBusy] = useState(false);
  const taRef = useRef(null);

  const canPost = (body.trim().length > 0 || media.length > 0) && !busy;
  const { status, available, busy: captureBusy, toggleCapture } = capture;
  const captureOn = status.enabled && !status.paused;

  const submit = async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      await onPost({ body: body.trim(), media, tags: [] });
      setBody('');
      setMedia([]);
      if (taRef.current) taRef.current.style.height = 'auto';
    } finally {
      setBusy(false);
    }
  };

  const attach = async () => {
    const picked = await api.attachMedia();
    if (picked?.length) setMedia((prev) => [...prev, ...picked]);
  };

  const autoGrow = (e) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  const captureTitle = available
    ? `Screen capture: ${describeCaptureState(status)}. Click to turn ${captureOn ? 'off' : 'on'}.`
    : 'Screen capture is not available in this build';

  return (
    <div className="nf-composer">
      <div className="nf-composer__top">
        <textarea
          ref={taRef}
          className="nf-composer__input"
          rows={1}
          placeholder="What's up?"
          value={body}
          onInput={(e) => { setBody(e.currentTarget.value); autoGrow(e); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className={'nf-autocapture' + (captureOn ? ' is-on' : '') + (available ? '' : ' is-disabled')}
          onClick={() => available && toggleCapture()}
          disabled={!available || captureBusy}
          title={captureTitle}
        >
          auto capture is {captureOn ? 'ON' : 'OFF'}
          {status.state === 'permissionRequired' && <span className="nf-autocapture__warn"> · needs permission</span>}
        </button>
      </div>

      {media.length > 0 && (
        <div className="nf-composer__media">
          {media.map((m) => (
            <div className="nf-composer__thumb" key={m.id}>
              <img src={mediaUrl(m.path)} alt={m.name || ''} draggable={false} />
              <button
                type="button"
                className="nf-composer__thumbx"
                aria-label="Remove image"
                onClick={() => setMedia((prev) => prev.filter((x) => x.id !== m.id))}
              >
                {Icon.x}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="nf-composer__bottom">
        <button type="button" className="nf-iconbtn" title="Attach image" onClick={attach}>
          {Icon.image}
        </button>
        <button type="button" className="nf-postbtn" disabled={!canPost} onClick={submit}>
          Post
        </button>
      </div>
    </div>
  );
}

/* ── Search ────────────────────────────────────────────────────────────
   One field over both manual post text and OCR history (§8). OCR hits are
   grouped by session and open at the matching frame rather than flooding the
   feed with one row per frame. */

function SearchBar({ value, onChange, ocrCount, postCount, searching }) {
  return (
    <div className="nf-search">
      <span className="nf-search__icon">{Icon.search}</span>
      <input
        className="nf-search__input"
        type="search"
        placeholder="Search posts and screen history…"
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
      />
      {value && (
        <span className="nf-search__count">
          {searching ? 'searching…' : `${postCount} post${postCount === 1 ? '' : 's'} · ${ocrCount} screen match${ocrCount === 1 ? '' : 'es'}`}
        </span>
      )}
      {value && (
        <button type="button" className="nf-search__clear" onClick={() => onChange('')} aria-label="Clear search">
          {Icon.x}
        </button>
      )}
    </div>
  );
}

function ScreenMatches({ groups, onOpen }) {
  if (!groups.length) return null;
  return (
    <div className="nf-matches">
      <span className="nf-matches__label">screen history</span>
      {groups.map((group) => (
        <div className="nf-matches__group" key={group.sessionId || 'unsessioned'}>
          <div className="nf-matches__head">
            <span className="nf-matches__apps">{group.apps.join(', ') || 'unknown app'}</span>
            <span className="nf-matches__time">
              {group.at ? formatSessionDate(group.at).toLowerCase() : ''} · {group.hits.length} match{group.hits.length === 1 ? '' : 'es'}
            </span>
          </div>
          {group.hits.slice(0, 4).map((hit) => (
            <button
              type="button"
              className="nf-matches__hit"
              key={hit.frameId}
              onClick={() => onOpen(group.sessionId, hit.frameId)}
            >
              <FrameThumb frameId={hit.frameId} className="nf-matches__thumb" maxWidth={120} />
              <span className="nf-matches__text">
                <span className="nf-matches__snippet">{renderSnippet(hit.snippet)}</span>
                <span className="nf-matches__meta">
                  {hit.appName || 'unknown'}{hit.windowTitle ? ` — ${hit.windowTitle}` : ''} · {relativeTime(hit.capturedAt)}
                </span>
              </span>
            </button>
          ))}
          {group.hits.length > 4 && (
            <span className="nf-matches__more">+{group.hits.length - 4} more in this session</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Render the ⟦…⟧ markers the FTS snippet uses as highlight spans. */
function renderSnippet(snippet) {
  if (!snippet) return null;
  return String(snippet).split(/(⟦[^⟧]*⟧)/).map((part, index) => (
    part.startsWith('⟦') && part.endsWith('⟧')
      ? <mark key={index} className="nf-matches__mark">{part.slice(1, -1)}</mark>
      : <span key={index}>{part}</span>
  ));
}

/* ── Capture settings sheet (the drawer tab at the top of the drawer) ── */

function CaptureSettings({ capture, onClose }) {
  const { status, config, defaults, busy, togglePause, toggleDisplaySession, updateConfig, clearHistory } = capture;
  const storage = status.storage;
  const displayActive = status.session?.kind === 'display';
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="nf-capture">
      <div className="nf-capture__head">
        <span className="nf-drawer__label">screen sharing &amp; auto-capture</span>
        <button type="button" className="nf-capture__close" onClick={onClose} aria-label="Close">{Icon.x}</button>
      </div>

      <div className="nf-capture__row">
        <span className={'nf-capture__dot is-' + (status.state || 'unknown')} />
        <span className="nf-capture__state">{describeCaptureState(status)}</span>
        {status.current?.appName && (
          <span className="nf-capture__current">{status.current.appName}</span>
        )}
      </div>

      {status.state === 'permissionRequired' && (
        <p className="nf-capture__hint">
          macOS has not granted Screen Recording to briizOS yet. Open System Settings → Privacy &amp;
          Security → Screen Recording, enable briizOS, then quit and reopen the app.
        </p>
      )}
      {status.state === 'unavailable' && (
        <p className="nf-capture__hint">
          The capture helper is not built. Run <code>npm run helper:build</code> and restart.
          {status.helper?.lastError ? ` (${status.helper.lastError})` : ''}
        </p>
      )}

      <div className="nf-capture__actions">
        <button type="button" className="nf-capture__btn" onClick={togglePause} disabled={busy || !status.enabled}>
          {status.paused ? 'Resume capture' : 'Pause capture'}
        </button>
        <button type="button" className="nf-capture__btn" onClick={toggleDisplaySession} disabled={busy || !status.enabled}>
          {displayActive ? 'Stop display session' : 'Start display session'}
        </button>
      </div>

      {storage && (
        <div className="nf-capture__storage">
          <div className="nf-capture__bar">
            <span className="nf-capture__fill" style={{ width: `${Math.min(100, storage.percentOfCap)}%` }} />
          </div>
          <span className="nf-capture__usage">
            {formatBytes(storage.bytes)} of {formatBytes(storage.retentionBytes)} · {storage.frames.toLocaleString()} frames
            · {storage.sessions} session{storage.sessions === 1 ? '' : 's'}
            {storage.pendingOcr ? ` · ${storage.pendingOcr} awaiting OCR` : ''}
          </span>
        </div>
      )}

      {config && (
        <div className="nf-capture__fields">
          <label className="nf-capture__field">
            <span>capture every</span>
            <select
              value={config.captureIntervalMs}
              onChange={(e) => updateConfig({ captureIntervalMs: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={1000}>1 second</option>
              <option value={3000}>3 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={15000}>15 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>keep for</span>
            <select
              value={config.retentionDays}
              onChange={(e) => updateConfig({ retentionDays: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>disk cap</span>
            <select
              value={config.retentionBytes}
              onChange={(e) => updateConfig({ retentionBytes: Number(e.currentTarget.value) })}
              disabled={busy}
            >
              <option value={2 * 1024 ** 3}>2 GB</option>
              <option value={5 * 1024 ** 3}>5 GB</option>
              <option value={10 * 1024 ** 3}>10 GB</option>
              <option value={25 * 1024 ** 3}>25 GB</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>text recognition</span>
            <select
              value={config.ocrMode}
              onChange={(e) => updateConfig({ ocrMode: e.currentTarget.value })}
              disabled={busy}
            >
              <option value="fast">fast</option>
              <option value="accurate">accurate</option>
            </select>
          </label>
          <label className="nf-capture__field">
            <span>on battery</span>
            <select
              value={config.batteryBehavior}
              onChange={(e) => updateConfig({ batteryBehavior: e.currentTarget.value })}
              disabled={busy}
            >
              <option value="deferOcr">defer text recognition</option>
              <option value="pauseCapture">pause capture</option>
              <option value="ignore">carry on</option>
            </select>
          </label>
        </div>
      )}

      {config && (
        <div className="nf-capture__exclusions">
          <span className="nf-drawer__label">never captured</span>
          <p className="nf-capture__hint">
            {config.excludedBundleIds.length} app{config.excludedBundleIds.length === 1 ? '' : 's'} and{' '}
            {config.excludedTitlePatterns.length} window-title pattern
            {config.excludedTitlePatterns.length === 1 ? '' : 's'} are excluded before anything is written to
            disk — password managers, the lock screen, and private-browsing windows by default.
          </p>
          {defaults && (
            <details className="nf-capture__details">
              <summary>show the list</summary>
              <ul>
                {config.excludedBundleIds.map((id) => <li key={id}><code>{id}</code></li>)}
                {config.excludedTitlePatterns.map((pattern) => <li key={pattern}><code>{pattern}</code></li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="nf-capture__danger">
        {confirmingClear ? (
          <>
            <span className="nf-capture__hint">Delete every captured frame and session? This cannot be undone.</span>
            <button
              type="button"
              className="nf-capture__btn is-danger"
              onClick={async () => {
                await clearHistory({ all: true });
                setConfirmingClear(false);
              }}
              disabled={busy}
            >
              Yes, delete everything
            </button>
            <button type="button" className="nf-capture__btn" onClick={() => setConfirmingClear(false)}>Cancel</button>
          </>
        ) : (
          <button type="button" className="nf-capture__btn is-danger" onClick={() => setConfirmingClear(true)}>
            Clear all screen history
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Session / post detail drawer ─────────────────────────────────── */

function SessionDrawer({ post, session, capture, focusFrameId, onClose, onSave }) {
  const [notes, setNotes] = useState(post.notes || '');
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [selectedFrameId, setSelectedFrameId] = useState(focusFrameId || null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => setNotes(post.notes || ''), [post.id, post.notes]);
  useEffect(() => setSelectedFrameId(focusFrameId || null), [focusFrameId]);

  // Timeline only loads for posts that are backed by a real capture session.
  useEffect(() => {
    let cancelled = false;
    setTimeline(null);
    if (!session?.id) return undefined;
    briizyApi.getSessionTimeline(session.id).then((result) => {
      if (!cancelled) setTimeline(result);
    });
    return () => { cancelled = true; };
  }, [session?.id]);

  useEffect(() => {
    let cancelled = false;
    setSelectedFrame(null);
    if (!selectedFrameId) return undefined;
    briizyApi.getFrame(selectedFrameId).then((frame) => {
      if (!cancelled) setSelectedFrame(frame);
    });
    return () => { cancelled = true; };
  }, [selectedFrameId]);

  const commitNotes = async () => {
    if (notes === (post.notes || '')) return;
    setSaving(true);
    try {
      await onSave(post.id, { notes });
    } finally {
      setSaving(false);
    }
  };

  const hasSession = post.sessionStart && post.sessionEnd;
  const dateLabel = formatSessionDate(post.sessionStart || post.createdAt);
  const timeLabel = hasSession ? formatTimeRange(post.sessionStart, post.sessionEnd) : '';
  const { dataUrl: selectedImage } = useFrameImage(selectedFrameId, { maxWidth: 900 });

  return (
    <div className="nf-drawer">
      <button
        type="button"
        className={'nf-drawer__tab' + (showSettings ? ' is-open' : '')}
        onClick={() => setShowSettings((v) => !v)}
        title="Configure screen sharing & auto-capture"
      >
        configure screen sharing &amp; auto-capture
      </button>

      <div className="nf-drawer__body">
        <button type="button" className="nf-drawer__collapse" onClick={onClose} title="Collapse">
          <span className="nf-drawer__chevron is-up">{Icon.chevron}</span>
        </button>

        <div className="nf-drawer__content">
          {showSettings && <CaptureSettings capture={capture} onClose={() => setShowSettings(false)} />}

          <h3 className="nf-drawer__title">{post.body.toLowerCase()}</h3>
          <div className="nf-drawer__meta">
            <span className="nf-drawer__date">{dateLabel}</span>
            {timeLabel && <span className="nf-drawer__time">{timeLabel}</span>}
            {session && (
              <span className="nf-drawer__frames">
                {session.frameCount.toLocaleString()} frames · {formatBytes(session.bytes)}
              </span>
            )}
          </div>

          {post.media?.length > 0 && (
            <div className="nf-drawer__section">
              <span className="nf-drawer__label">attachments</span>
              <div className="nf-drawer__shots">
                {post.media.map((m, i) => (
                  <img key={m.id || i} src={mediaUrl(m.path)} alt={m.name || ''} loading="lazy" />
                ))}
              </div>
            </div>
          )}

          {/* Session-backed posts get the app/window timeline and filmstrip;
              everything else keeps the original screenshots section. */}
          {session ? (
            <>
              <div className="nf-drawer__section">
                <span className="nf-drawer__label">timeline</span>
                {timeline?.segments?.length ? (
                  <div className="nf-timeline">
                    {timeline.segments.map((segment, index) => {
                      const active = segment.frameIds.includes(selectedFrameId);
                      return (
                        <button
                          type="button"
                          key={`${segment.startedAt}-${index}`}
                          className={'nf-timeline__seg' + (active ? ' is-active' : '')}
                          onClick={() => setSelectedFrameId(segment.coverFrameId)}
                          title={`${segment.appName || 'unknown'} — ${segment.windowTitle || ''}`}
                        >
                          <span className="nf-timeline__app">{segment.appName || 'unknown'}</span>
                          <span className="nf-timeline__title">{segment.windowTitle || '—'}</span>
                          <span className="nf-timeline__time">
                            {formatTimeRange(segment.startedAt, segment.endedAt) || relativeTime(segment.startedAt)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="nf-drawer__empty">
                    {timeline ? 'no frames left in this session' : 'loading timeline…'}
                  </p>
                )}
              </div>

              {timeline?.segments?.length > 0 && (
                <div className="nf-drawer__section">
                  <span className="nf-drawer__label">filmstrip</span>
                  <div className="nf-filmstrip">
                    {timeline.segments.flatMap((segment) => segment.frameIds.slice(0, 8)).slice(0, 40).map((frameId) => (
                      <button
                        type="button"
                        key={frameId}
                        className={'nf-filmstrip__cell' + (frameId === selectedFrameId ? ' is-active' : '')}
                        onClick={() => setSelectedFrameId(frameId)}
                      >
                        <FrameThumb frameId={frameId} maxWidth={140} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedFrameId && (
                <div className="nf-drawer__section">
                  <span className="nf-drawer__label">moment</span>
                  <div className="nf-moment">
                    {selectedImage
                      ? <img className="nf-moment__image" src={selectedImage} alt="" />
                      : <span className="nf-frame__placeholder nf-moment__image" />}
                    <div className="nf-moment__side">
                      <span className="nf-moment__app">
                        {selectedFrame?.appName || '—'}
                        {selectedFrame?.windowTitle ? ` — ${selectedFrame.windowTitle}` : ''}
                      </span>
                      <span className="nf-moment__time">
                        {selectedFrame ? formatTimeRange(selectedFrame.capturedAt, selectedFrame.capturedAt).split('–')[0] : ''}
                        {selectedFrame ? ` · ${relativeTime(selectedFrame.capturedAt)}` : ''}
                      </span>
                      <div className="nf-moment__text">
                        {selectedFrame?.ocrText
                          ? selectedFrame.ocrText
                          : <span className="nf-drawer__empty">no text recognized in this frame</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="nf-drawer__section">
              <span className="nf-drawer__label">screenshots</span>
              {post.screenshots?.length ? (
                <div className="nf-drawer__shots">
                  {post.screenshots.map((s, i) => (
                    <img key={s.id || i} src={mediaUrl(s.path)} alt="" loading="lazy" />
                  ))}
                </div>
              ) : (
                <p className="nf-drawer__empty">no screenshots from session</p>
              )}
            </div>
          )}

          <div className="nf-drawer__section">
            <span className="nf-drawer__label">notes</span>
            <textarea
              className="nf-drawer__notes"
              placeholder="no notes taken from session"
              value={notes}
              onInput={(e) => setNotes(e.currentTarget.value)}
              onBlur={commitNotes}
              rows={2}
            />
            {saving && <span className="nf-drawer__saving">saving…</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feed row ─────────────────────────────────────────────────────── */

function FeedRow({ post, session, expanded, onToggle, rowRef }) {
  return (
    <button
      type="button"
      ref={rowRef}
      data-day={dayKey(post.createdAt)}
      className={'nf-row' + (expanded ? ' is-expanded' : '')}
      onClick={onToggle}
    >
      <SourceIcon post={post} />
      <span className="nf-row__body">
        {post.body}
        {(post.tags || []).map((t) => (
          <span className="nf-row__tag" key={t}>{t}</span>
        ))}
        {session?.topApps?.length > 1 && (
          <span className="nf-row__apps">
            {session.topApps.slice(0, 3).map((entry) => entry.appName).join(' · ')}
          </span>
        )}
      </span>
      {session?.coverFrameId && (
        <span className="nf-row__media">
          <FrameThumb frameId={session.coverFrameId} maxWidth={120} />
        </span>
      )}
      {!session && post.media?.length > 0 && (
        <span className="nf-row__media">
          {post.media.slice(0, 4).map((m, i) => (
            <img key={m.id || i} src={mediaUrl(m.path)} alt="" draggable={false} />
          ))}
          {post.media.length > 4 && <span className="nf-row__mediamore">+{post.media.length - 4}</span>}
        </span>
      )}
      <span className="nf-row__meta">
        <span className="nf-row__time">
          {post.sessionStart && post.sessionEnd
            ? formatTimeRange(post.sessionStart, post.sessionEnd)
            : relativeTime(post.createdAt)}
        </span>
        {post.captureMode === 'auto' && <span className="nf-row__auto">auto-capture</span>}
      </span>
    </button>
  );
}

/* ── Date rail ───────────────────────────────────────────────────── */

function buildRailDays(posts) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  let earliest = todayTs - 44 * DAY;
  posts.forEach((p) => {
    if (p.createdAt < earliest) earliest = p.createdAt;
  });
  const earliestDate = new Date(earliest);
  earliestDate.setHours(0, 0, 0, 0);

  const days = [];
  for (let t = todayTs; t >= earliestDate.getTime(); t -= DAY) {
    days.push(new Date(t));
  }
  return days;
}

function DateRail({ posts, activeDay, todayKey, onJump }) {
  const days = useMemo(() => buildRailDays(posts), [posts]);

  const postsByDay = useMemo(() => {
    const map = new Map();
    for (const p of posts) {
      const k = dayKey(p.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(p);
    }
    return map;
  }, [posts]);

  let lastMonth = null;

  return (
    <div className="nf-rail">
      {days.map((d) => {
        const key = dayKey(d.getTime());
        const month = d.getMonth();
        const showMonth = month !== lastMonth;
        lastMonth = month;
        const isToday = key === todayKey;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const dayPosts = postsByDay.get(key);

        return (
          <div className="nf-rail__group" key={key}>
            {showMonth && (
              <div className="nf-rail__month">{MONTH_SHORT[month]} {d.getFullYear()}</div>
            )}
            <button
              type="button"
              className={
                'nf-rail__day' +
                (isToday ? ' is-today' : '') +
                (key === activeDay ? ' is-active' : '') +
                (isWeekend ? ' is-weekend' : '')
              }
              onClick={() => onJump(key)}
              title={d.toDateString()}
            >
              <span className="nf-rail__letter">{WEEKDAY_LETTERS[d.getDay()]}</span>
              <span className="nf-rail__num">{d.getDate()}</span>
              {dayPosts?.some((p) => p.sourceIcon === 'journal') && (
                <span className="nf-rail__marker nf-rail__marker--journal">{Icon.journal}</span>
              )}
              {dayPosts?.some((p) => p.captureMode === 'auto' && p.sourceIcon !== 'journal') && (
                <span className="nf-rail__marker nf-rail__marker--dot" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main panel ──────────────────────────────────────────────────── */

export function NotefallsPanel() {
  const [posts, setPosts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [focusFrameId, setFocusFrameId] = useState(null);
  const [activeDay, setActiveDay] = useState(dayKey(Date.now()));
  const [query, setQuery] = useState('');
  const [screenHits, setScreenHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const feedRef = useRef(null);
  const rowRefs = useRef(new Map());

  const capture = useBriizyCapture();
  const todayKey = dayKey(Date.now());

  const loadPosts = useCallback(() => {
    api.list().then(setPosts).catch((err) => {
      logger.error('notefalls', 'notefalls:list failed', err?.message);
    });
  }, []);

  const loadSessions = useCallback(() => {
    briizyApi.listSessions({ limit: 300 }).then((rows) => setSessions(rows || []));
  }, []);

  useEffect(() => {
    loadPosts();
    loadSessions();
  }, [loadPosts, loadSessions]);

  // A closed session posts its own card, so the feed has to refresh when the
  // pipeline says so rather than only on mount.
  useEffect(() => briizyApi.onEvent(({ type }) => {
    if (type === 'session-card' || type === 'session-close') {
      loadPosts();
      loadSessions();
    }
  }), [loadPosts, loadSessions]);

  /** postId → session, so a feed card knows which capture session backs it. */
  const sessionByPostId = useMemo(() => {
    const map = new Map();
    sessions.forEach((session) => {
      if (session.notefallPostId) map.set(session.notefallPostId, session);
    });
    return map;
  }, [sessions]);

  const sessionById = useMemo(() => {
    const map = new Map();
    sessions.forEach((session) => map.set(session.id, session));
    return map;
  }, [sessions]);

  // OCR search is debounced; post filtering is local and immediate.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setScreenHits([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const results = await briizyApi.search({ text, limit: 50 });
      setScreenHits(results || []);
      setSearching(false);
      logger.info('notefalls', 'Screen history searched', { text, matches: results?.length || 0 });
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  const visiblePosts = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return posts;
    return posts.filter((post) => (
      post.body?.toLowerCase().includes(text)
      || post.notes?.toLowerCase().includes(text)
      || (post.tags || []).some((tag) => tag.toLowerCase().includes(text))
      || post.sourceApp?.toLowerCase().includes(text)
    ));
  }, [posts, query]);

  /** Group OCR hits by session so one busy session cannot flood the results. */
  const screenGroups = useMemo(() => {
    const groups = new Map();
    for (const hit of screenHits) {
      const key = hit.sessionId || 'unsessioned';
      if (!groups.has(key)) {
        groups.set(key, { sessionId: hit.sessionId, apps: [], hits: [], at: hit.capturedAt });
      }
      const group = groups.get(key);
      group.hits.push(hit);
      if (hit.appName && !group.apps.includes(hit.appName)) group.apps.push(hit.appName);
      if (hit.capturedAt > group.at) group.at = hit.capturedAt;
    }
    return [...groups.values()].sort((a, b) => b.at - a.at);
  }, [screenHits]);

  const handlePost = async (input) => {
    const created = await api.create(input);
    setPosts((prev) => [created, ...prev]);
    logger.info('notefalls', 'Notefalls post created', { id: created.id });
  };

  const handleSaveDrawer = async (id, patch) => {
    const updated = await api.update(id, patch);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const toggleExpand = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
    setFocusFrameId(null);
  };

  /** Open a search hit: expand that session's card, focused on the matching frame. */
  const openScreenMatch = (sessionId, frameId) => {
    const session = sessionById.get(sessionId);
    if (session?.notefallPostId) {
      setExpandedId(session.notefallPostId);
      setFocusFrameId(frameId);
      logger.info('notefalls', 'Opened screen match', { sessionId, frameId });
    } else {
      logger.warn('notefalls', 'Screen match has no session card yet', { sessionId, frameId });
    }
  };

  // Track which day's posts are scrolled to the top of the feed, so the
  // date rail can highlight the matching day.
  const onFeedScroll = () => {
    const container = feedRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let best = null;
    let bestDist = Infinity;
    for (const [day, el] of rowRefs.current) {
      if (!el) continue;
      const dist = el.getBoundingClientRect().top - top;
      if (dist >= -4 && dist < bestDist) {
        bestDist = dist;
        best = day;
      }
    }
    if (best && best !== activeDay) setActiveDay(best);
  };

  const jumpToDay = (key) => {
    const container = feedRef.current;
    if (!container) return;
    // Find the nearest row on or before this day (feed is reverse-chron).
    let target = null;
    for (const [day, el] of rowRefs.current) {
      if (!el) continue;
      if (day <= key) {
        if (!target || day > target.day) target = { day, el };
      }
    }
    if (target) {
      target.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDay(target.day);
    } else {
      setActiveDay(key);
    }
  };

  const expandedPost = posts.find((p) => p.id === expandedId) || null;

  return (
    <div className="panel notefalls-panel">
      <div className="panel-header">
        <span className="panel-header-title">Notefalls</span>
        {capture.available && capture.status.enabled && !capture.status.paused && (
          <span className="nf-header__capture" title={describeCaptureState(capture.status)}>
            <span className="nf-capture__dot is-capturingWindow" /> capturing
          </span>
        )}
      </div>
      <div className="panel-content">
        <div className="nf-tab">
          <DateRail posts={posts} activeDay={activeDay} todayKey={todayKey} onJump={jumpToDay} />

          <div className="nf-main">
            <div className="nf-feed" ref={feedRef} onScroll={onFeedScroll}>
              <Composer onPost={handlePost} capture={capture} />

              <SearchBar
                value={query}
                onChange={setQuery}
                ocrCount={screenHits.length}
                postCount={visiblePosts.length}
                searching={searching}
              />

              {query.trim().length >= 2 && (
                <ScreenMatches groups={screenGroups} onOpen={openScreenMatch} />
              )}

              {(() => {
                // Only the topmost row for each day gets registered in rowRefs,
                // so jump-to-date / scroll-tracking land on the start of a day's group.
                rowRefs.current.clear();
                const seenDays = new Set();
                return visiblePosts.map((post) => {
                  const key = dayKey(post.createdAt);
                  const isFirst = !seenDays.has(key);
                  seenDays.add(key);
                  return (
                    <FeedRow
                      key={post.id}
                      post={post}
                      session={sessionByPostId.get(post.id) || null}
                      expanded={expandedId === post.id}
                      onToggle={() => toggleExpand(post.id)}
                      rowRef={isFirst ? (el) => { if (el) rowRefs.current.set(key, el); } : undefined}
                    />
                  );
                });
              })()}

              {!visiblePosts.length && (
                <p className="nf-empty">
                  {query.trim()
                    ? 'No posts match. Screen matches, if any, are listed above.'
                    : "Nothing here yet — say what's up above."}
                </p>
              )}
            </div>

            {expandedPost && (
              <SessionDrawer
                post={expandedPost}
                session={sessionByPostId.get(expandedPost.id) || null}
                capture={capture}
                focusFrameId={focusFrameId}
                onClose={() => setExpandedId(null)}
                onSave={handleSaveDrawer}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
