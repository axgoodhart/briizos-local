import ForestApp from './ForestApp';

// Islands panel (internally still "forest"): desks > islands > cards (docs/forest-desks/DECISIONS.md).
// State lives in ./store, so moving the panel between layouts keeps everything.
export default function Forest() {
  return (
    <div className="panel forest-panel">
      <div className="panel-header">
        <span className="panel-header-title">Islands</span>
      </div>
      <div className="panel-content">
        <ForestApp />
      </div>
    </div>
  );
}
