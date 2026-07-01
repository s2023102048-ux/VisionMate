'use client';

export default function Header({ countAccessible, countHazard }) {
  return (
    <header className="app-header" id="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#0a0e1a"/>
          </svg>
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
