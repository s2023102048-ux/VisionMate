'use client';

export default function Header({ countAccessible, countHazard }) {
  return (
    <header className="app-header" id="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <img src="/logo.png" alt="VisionMate Logo" width="28" height="28" style={{ borderRadius: '6px' }} />
        </div>
        <div>
          <span className="header-title">VisionMate</span>
          <span className="header-tagline">PWD Accessibility Map</span>
        </div>
      </div>

      <div className="header-legend">
        <div className="legend-item">
          <span className="legend-dot green"></span>
          <span>Accessible</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot red"></span>
          <span>Hazard</span>
        </div>
      </div>

      <div className="header-stats">
        <div className="stat-chip green-chip">
          <span className="stat-num" id="count-accessible">{countAccessible}</span>
          <span className="stat-label">Accessible</span>
        </div>
        <div className="stat-chip red-chip">
          <span className="stat-num" id="count-hazard">{countHazard}</span>
          <span className="stat-label">Hazards</span>
        </div>
      </div>
    </header>
  );
}
