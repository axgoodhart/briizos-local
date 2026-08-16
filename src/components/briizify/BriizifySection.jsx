import { useState, useCallback } from 'react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useBriizify } from '../../hooks/useBriizify';
import BriizifySetup from './BriizifySetup';
import Priorifact from './Priorifact';
import './Briizify.css';

/**
 * BriizifySection — the Tasks Panel home of the prioritize feature
 * (moved out of the InteractionPanel chat modality).
 *
 * A floating "Prioritize with briizify" tab pins to the panel's
 * bottom-right corner (Phantom keeps the bottom-left). With no plan,
 * the tab opens the request setup; with a plan, it shows/hides the
 * docked Priorifact artifact.
 */
function BriizifySection() {
  const briizify = useBriizify();
  const { items } = useOrganizer();
  const [setupOpen, setSetupOpen] = useState(false);
  const [artifactHidden, setArtifactHidden] = useState(false);

  const busy = briizify.status === 'thinking' || briizify.status === 'clarifying';
  const hasPlan = !!briizify.plan && briizify.status !== 'loading';
  const showSetup = setupOpen || busy;

  const handleTab = useCallback(() => {
    if (showSetup) {
      if (busy) briizify.cancelRequest();
      setSetupOpen(false);
      return;
    }
    if (hasPlan) {
      setArtifactHidden((hidden) => !hidden);
      return;
    }
    setSetupOpen(true);
  }, [showSetup, busy, hasPlan, briizify]);

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
    await briizify.endPlan();
    setArtifactHidden(false);
  }, [briizify]);

  return (
    <div className="briizify-section">
      {hasPlan && !artifactHidden && !showSetup && (
        <Priorifact
          plan={briizify.plan}
          onAddBreak={briizify.addBreak}
          onRemoveActivity={briizify.removeActivity}
          onChangePlan={() => setSetupOpen(true)}
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

      <button
        type="button"
        className={`briizify-tab ${showSetup || (hasPlan && !artifactHidden) ? 'engaged' : ''}`}
        onClick={handleTab}
        title={hasPlan ? 'Show or hide the priorifact' : 'Prioritize with briizify'}
      >
        <span className="briizify-tab-strong">Prioritize</span>
        <span className="briizify-tab-soft">with briizify</span>
      </button>
    </div>
  );
}

export default BriizifySection;
