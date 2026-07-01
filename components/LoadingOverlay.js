'use client';

export default function LoadingOverlay({ visible, text }) {
  if (!visible) return null;
  return (
    <div className="loading-overlay" id="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner"></div>
        <p className="loading-text" id="loading-text">{text || 'Loading...'}</p>
      </div>
    </div>
  );
}
