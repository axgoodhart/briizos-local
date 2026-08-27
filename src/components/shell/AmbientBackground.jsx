import { useCallback, useEffect, useRef, useState } from 'react';
import { useChatSettings } from '../../context/ChatSettingsContext';
import { syncThemeTokensIntoFrame } from '../../lib/backgroundFrame';

/**
 * AmbientBackground — while the masonry grid is hidden (windowed mode), the
 * Conversation's dynamic background escapes the chat panel and paints the
 * whole app window, behind every float window and the dock.
 *
 * Resolution order matches InteractionPanel: the active theme's saved chat
 * background (with its blur) first, then the global chat background.
 */
export function AmbientBackground() {
  const { chatBackground, chatBgBlur, getThemeChatBackground } = useChatSettings();
  const [activeTheme, setActiveTheme] = useState(() => (
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'default'
      : 'default'
  ));
  const frameRef = useRef(null);

  const syncTokens = useCallback(() => {
    syncThemeTokensIntoFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setActiveTheme(document.documentElement.getAttribute('data-theme') || 'default');
      syncTokens();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [syncTokens]);

  const themeEntry = getThemeChatBackground?.(activeTheme);
  const background = themeEntry?.background || chatBackground;
  const blur = themeEntry?.background ? (themeEntry.blur ?? 0) : chatBgBlur;

  if (!background) return null;

  return (
    <div
      className="fshell-bg"
      aria-hidden="true"
      style={blur ? { filter: `blur(${blur}px)` } : undefined}
    >
      <iframe
        ref={frameRef}
        className="fshell-bg-frame"
        title="Ambient background"
        src={background}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        onLoad={syncTokens}
      />
    </div>
  );
}

export default AmbientBackground;
