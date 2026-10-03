import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useBriizify } from '../../hooks/useBriizify';
import logger from '../../lib/logger';
import BriizifySetup from './BriizifySetup';
import Priorifact from './Priorifact';
import '../../AppCombined.css';

const PRESENTATION_KEY = 'briizos-briizify-presentation';

function readPresentation() {
  try {
    const saved = window.localStorage.getItem(PRESENTATION_KEY);
    if (saved === null) return { visible: false, focused: false };
    const value = JSON.parse(saved);
    if (value && typeof value.visible === 'boolean' && typeof value.focused === 'boolean') {
      return { visible: value.visible, focused: value.focused };
    }
    logger.warn('tasks.briizify', 'The saved Briizify visibility choice was invalid; Briizify will start hidden.', {
      saved,
    });
  } catch (error) {
    logger.warn('tasks.briizify', 'Could not read Briizify visibility; Briizify will start hidden.', {
      error: error?.message,
    });
  }
  return { visible: false, focused: false };
}

/**
 * BriizifySection — the Tasks Panel home of the prioritize feature
 * (moved out of the InteractionPanel chat modality).
 *
 * A floating "Prioritize with briizify" tab pins to the panel's
 * bottom-right corner (Phantom keeps the bottom-left). With no plan,
 * the tab opens the request setup; with a plan, it shows/hides the
 * docked Priorifact artifact.
 */
function BriizifySection({ onFocusedChange }) {
  const briizify = useBriizify();
  const { items } = useOrganizer();
  const [setupOpen, setSetupOpen] = useState(false);
  const [presentation, setPresentationState] = useState(readPresentation);
  const presentationRef = useRef(presentation);
  const requestVersionRef = useRef(0);

  const setPresentation = useCallback((changes) => {
    const previous = presentationRef.current;
    const next = { ...previous, ...changes };
    if (previous.visible === next.visible && previous.focused === next.focused) return;
    presentationRef.current = next;
    setPresentationState(next);
    try {
      window.localStorage.setItem(PRESENTATION_KEY, JSON.stringify(next));
      logger.info('tasks.briizify', 'Briizify visibility and focus choice saved for reopening and restarting', {
        presentation: next,
      });
    } catch (error) {
      logger.warn('tasks.briizify', 'Briizify visibility changed for this session, but the choice could not be saved.', {
        presentation: next,
        error: error?.message,
      });
    }
  }, []);

  useEffect(() => {
    logger.info('tasks.briizify', 'Briizify opened with its remembered visibility and focus choice', {
      presentation: presentationRef.current,
    });
    return () => { requestVersionRef.current += 1; };
  }, []);

  const busy = briizify.status === 'thinking' || briizify.status === 'clarifying';
  const hasPlan = !!briizify.plan && briizify.status !== 'loading';
  const artifactHidden = !presentation.visible;
  const showSetup = setupOpen || busy
    || (briizify.status !== 'loading' && !hasPlan && !artifactHidden);
  const artifactEngaged = hasPlan && !artifactHidden && !showSetup;
  const engaged = showSetup || artifactEngaged;
  const focused = presentation.focused && artifactEngaged;

  useLayoutEffect(() => {
    onFocusedChange?.(focused);
  }, [focused, onFocusedChange]);

  const handleTab = useCallback(() => {
    if (showSetup) {
      requestVersionRef.current += 1;
      if (busy) briizify.cancelRequest();
      setSetupOpen(false);
      setPresentation({ visible: false });
      return;
    }
    if (hasPlan) {
      setPresentation({ visible: artifactHidden });
      return;
    }
    setSetupOpen(true);
    setPresentation({ visible: true });
  }, [showSetup, busy, hasPlan, briizify, artifactHidden, setPresentation]);

  const handleGenerate = useCallback(async (payload) => {
    const version = ++requestVersionRef.current;
    const plan = await briizify.generate(payload);
    if (plan && version === requestVersionRef.current) {
      setSetupOpen(false);
      setPresentation({ visible: true });
    }
  }, [briizify, setPresentation]);

  const handleAnswer = useCallback(async (answer) => {
    const version = ++requestVersionRef.current;
    const plan = await briizify.answerClarification(answer);
    if (plan && version === requestVersionRef.current) {
      setSetupOpen(false);
      setPresentation({ visible: true });
    }
  }, [briizify, setPresentation]);

  const handleCancel = useCallback(() => {
    requestVersionRef.current += 1;
    if (busy) briizify.cancelRequest();
    setSetupOpen(false);
    if (!hasPlan) setPresentation({ visible: false });
  }, [busy, briizify, hasPlan, setPresentation]);

  const handleEndPlan = useCallback(async () => {
    requestVersionRef.current += 1;
    setPresentation({ visible: false });
    await briizify.endPlan();
  }, [briizify, setPresentation]);

  const handleChangePlan = useCallback(() => {
    setPresentation({ visible: true });
    setSetupOpen(true);
  }, [setPresentation]);

  const handleFocus = useCallback(() => {
    if (!artifactEngaged) return;
    const nextFocused = !focused;
    setPresentation({ focused: nextFocused });
    logger.info(
      'tasks.briizify',
      nextFocused ? 'Priorifact focus mode opened' : 'Priorifact focus mode closed',
      { presentation: nextFocused ? 'focused' : 'ambient' },
    );
  }, [artifactEngaged, focused, setPresentation]);

  return (
    <div className={`briizify-section${engaged ? ' engaged' : ''}${focused ? ' focused' : ''}`}>
      {hasPlan && !artifactHidden && !showSetup && (
        <Priorifact
          plan={briizify.plan}
          onAddBreak={briizify.addBreak}
          onRemoveActivity={briizify.removeActivity}
          onAddToCalendar={briizify.addToCalendar}
          onSaveFlow={briizify.saveFlow}
          onExtendActivity={briizify.extendActivity}
          onUpdateActivity={briizify.updateActivity}
          onSwapActivities={briizify.swapActivities}
          onAddActivity={briizify.addActivity}
          onTogglePause={briizify.togglePause}
          calendarStatus={briizify.calendarStatus}
          saveFlowStatus={briizify.saveFlowStatus}
          extendingActivityId={briizify.extendingActivityId}
          scheduleStatus={briizify.scheduleStatus}
          actionError={briizify.actionError}
          maxTargetExtensions={briizify.maxTargetExtensions}
          focused={focused}
          onChangePlan={handleChangePlan}
          onEndPlan={handleEndPlan}
        />
      )}

      {showSetup && (
        <BriizifySetup
          organizerItems={items}
          status={briizify.status}
          question={briizify.question}
          error={briizify.error}
          onGenerate={handleGenerate}
          onAnswer={handleAnswer}
          onCancel={handleCancel}
        />
      )}

      <div className={`briizify-tab-dock${engaged ? ' engaged' : ''}${focused ? ' focused' : ''}`}>
        <button
          type="button"
          className="briizify-tab"
          onClick={handleTab}
          aria-expanded={showSetup || artifactEngaged}
          title={hasPlan ? 'Show or hide the priorifact' : 'Prioritize with briizify'}
        >
          <span className="briizify-tab-strong">briizify</span>
          <span className="briizify-tab-soft">prioritize</span>
        </button>
        {artifactEngaged && (
          <button
            type="button"
            className="briizify-focus-btn"
            onClick={handleFocus}
            aria-pressed={focused}
            title={focused ? 'Return to the Tasks list' : 'Focus this priorifact'}
          >
            {focused ? 'focused' : 'focus'}
          </button>
        )}
      </div>
    </div>
  );
}

export default BriizifySection;
