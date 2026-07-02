'use client';

export default function NavPanel({ destination, routeData, routeMode, onModeChange, onClose, hazards }) {
  if (!destination) return null;

  const formatDist = (m) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

  const formatTime = (distMeters) => {
    // Average walking speed: ~1.4 m/s (5 km/h)
    // Average wheelchair speed: ~1.0 m/s (3.6 km/h)
    const speed = routeMode === 'wheelchair' ? 1.0 : 1.4;
    const mins = Math.round((distMeters / speed) / 60);
    
    return mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins} min`;
  };

  const hazardCount = hazards ? hazards.length : 0;
  const riskLevel   = hazardCount === 0 ? 'safe' : hazardCount <= 2 ? 'caution' : 'danger';

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=walking`;
    window.open(url, '_blank');
  };

  return (
    <div className="nav-panel" id="nav-panel">
      {/* Header */}
      <div className="nav-panel-header">
        <div className="nav-dest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--red)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <span className="nav-dest-name">{destination.name.split(',').slice(0, 2).join(',')}</span>
        </div>
        <button className="nav-close" id="nav-close" onClick={onClose} title="Close navigation">✕</button>
      </div>

      {/* Mode Selector */}
      <div className="nav-mode-selector">
        <button
          id="mode-walk"
          className={`nav-mode-btn${routeMode === 'walk' ? ' active' : ''}`}
          onClick={() => onModeChange('walk')}
        >
          🚶 Walk
        </button>
        <button
          id="mode-wheelchair"
          className={`nav-mode-btn${routeMode === 'wheelchair' ? ' active' : ''}`}
          onClick={() => onModeChange('wheelchair')}
        >
          ♿ Wheelchair
        </button>
      </div>

      {/* Route Info */}
      {routeData ? (
        <>
          <div className="nav-info-row">
            <div className="nav-info-item">
              <span className="nav-info-label">Distance</span>
              <span className="nav-info-value">{formatDist(routeData.distance)}</span>
            </div>
            <div className="nav-info-item">
              <span className="nav-info-label">Est. Time</span>
              <span className="nav-info-value">{formatTime(routeData.distance)}</span>
            </div>
            <div className={`nav-info-item risk-${riskLevel}`}>
              <span className="nav-info-label">Safety</span>
              <span className="nav-info-value">
                {riskLevel === 'safe'    ? '✅ Clear'    :
                 riskLevel === 'caution' ? '⚠️ Caution' :
                                          '🚫 High Risk'}
              </span>
            </div>
          </div>

          {/* Wheelchair Hazard Warnings */}
          {routeMode === 'wheelchair' && hazardCount > 0 && (
            <div className="nav-hazard-warning" id="nav-hazard-warning">
              <p className="nav-hazard-title">
                ⚠️ {hazardCount} hazard{hazardCount > 1 ? 's' : ''} along this route
              </p>
              <div className="nav-hazard-list">
                {hazards.slice(0, 3).map((h, i) => (
                  <div key={i} className="nav-hazard-item">
                    🚧 {(h.description || 'Accessibility hazard').slice(0, 70)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Turn-by-turn steps */}
          {routeData.steps && routeData.steps.length > 0 && (
            <div className="nav-steps" id="nav-steps">
              <p className="nav-steps-title">Directions</p>
              {routeData.steps.map((step, i) => (
                <div key={i} className="nav-step">
                  <span className="nav-step-num">{i + 1}</span>
                  <span className="nav-step-text">
                    {step.maneuver?.instruction || step.name || 'Continue straight'}
                  </span>
                  <span className="nav-step-dist">{formatDist(step.distance)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="nav-loading">⏳ Calculating route…</div>
      )}

      {/* Start Navigation */}
      <button className="nav-start-btn" id="nav-start-btn" onClick={handleNavigate}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
        Start in Google Maps
      </button>
    </div>
  );
}
