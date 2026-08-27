import { useState, useCallback, useEffect } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useBriizify } from '../../hooks/useBriizify';
import logger from '../../lib/logger';
import BriizifySetup from './BriizifySetup';
import Priorifact from './Priorifact';
import '../../AppCombined.css';

/**
 * BriizifySection — the Tasks Panel home of the prioritize feature
 * (moved out of the InteractionPanel chat modality).
 *
 * A floating "Prioritize with briizify" tab pins to the panel's
 * bottom-right corner (Phantom keeps the bottom-left). With no plan,
 * the tab opens the request setup; with a plan, it shows/hides the
 * docked Priorifact artifact.
 */
function BriizifySection({ focused = false, onFocusedChange }) {
  const briizify = useBriizify();
  const { items } = useOrganizer();
  const [setupOpen, setSetupOpen] = useState(false);
  const [artifactHidden, setArtifactHidden] = useState(false);

  const busy = briizify.status === 'thinking' || briizify.status === 'clarifying';
  const hasPlan = !!briizify.plan && briizify.status !== 'loading';
  const showSetup = setupOpen || busy;
  const artifactEngaged = hasPlan && !artifactHidden && !showSetup;

  useEffect(() => {
    if (focused && !artifactEngaged) onFocusedChange?.(false);
  }, [artifactEngaged, focused, onFocusedChange]);

  const handleTab = useCallback(() => {
    if (showSetup) {
      if (busy) briizify.cancelRequest();
      setSetupOpen(false);
      return;
    }
    if (hasPlan) {
      if (!artifactHidden) onFocusedChange?.(false);
      setArtifactHidden((hidden) => !hidden);
      return;
    }
    setSetupOpen(true);
  }, [showSetup, busy, hasPlan, briizify, artifactHidden, onFocusedChange]);

  const handleGenerate = useCallback(async (payload) => {
    const plan = await briizify.generate(payload);
    if (plan) {
      setSetupOpen(false);
      setArtifactHidden(false);
    }
  }, [briizify]);

  const handleAnswer = useCallback(async (answer) => {
    const plan = await briizify.answerClarification(answer);
    if (plan) {
      setSetupOpen(false);
      setArtifactHidden(false);
    }
  }, [briizify]);

  const handleCancel = useCallback(() => {
    if (busy) briizify.cancelRequest();
    setSetupOpen(false);
  }, [busy, briizify]);

  const handleEndPlan = useCallback(async () => {
    onFocusedChange?.(false);
    await briizify.endPlan();
    setArtifactHidden(false);
  }, [briizify, onFocusedChange]);

  const handleChangePlan = useCallback(() => {
    onFocusedChange?.(false);
    setSetupOpen(true);
  }, [onFocusedChange]);

  const handleFocus = useCallback(() => {
    if (!artifactEngaged) return;
    const nextFocused = !focused;
    onFocusedChange?.(nextFocused);
    logger.info(
      'tasks.briizify',
      nextFocused ? 'Priorifact focus mode opened' : 'Priorifact focus mode closed',
      { presentation: nextFocused ? 'focused' : 'ambient' },
    );
  }, [artifactEngaged, focused, onFocusedChange]);

  return (
    <div className={`briizify-section ${focused ? 'focused' : ''}`}>
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

      <div className={`briizify-tab-dock ${showSetup || artifactEngaged ? 'engaged' : ''} ${focused ? 'focused' : ''}`}>
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
