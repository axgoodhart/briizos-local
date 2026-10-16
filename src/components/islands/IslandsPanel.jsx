import IslandsApp from './IslandsApp';

// Islands panel: desks > islands > cards (docs/island-desks/DECISIONS.md).
// State lives in ./store, so moving the panel between layouts keeps everything.
export default function IslandsPanel() {
  return (
    <div className="panel island-panel">
      <div className="panel-header">
        <span className="panel-header-title">Islands</span>
      </div>
      <div className="panel-content">
        <IslandsApp />
      </div>
    </div>
  );
}
