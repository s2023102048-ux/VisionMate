'use client';

import { useRef, useEffect } from 'react';

const CATEGORIES = [
  'Broken Sidewalk',
  'No Ramp',
  'Stairs Only',
  'Flood',
  'Construction',
  'Blocked Sidewalk',
  'Broken Elevator',
  'No Accessible CR',
  'Narrow Entrance',
  'Others',
];

export default function ReportModal({
  visible,
  selectedLat,
  selectedLng,
  selectedFile,
  photoPreviewSrc,
  category,
  otherText,
  aiStatus,
  aiResult,
  onClose,
  onReselect,
  onPhotoChange,
  onCategoryChange,
  onOtherTextChange,
  onSubmit,
}) {
  const photoInputRef = useRef(null);
  const canSubmit = selectedLat && selectedFile;

  useEffect(() => {
    if (visible) document.body.style.overflow = 'hidden';
    else         document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };
  const handleFileChange   = (e) => { const f = e.target.files[0]; if (f) onPhotoChange(f); };

  return (
    <div className="modal-overlay" id="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" id="report-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id="modal-title">📍 Report Accessibility Condition</h2>
            <p className="modal-subtitle">Upload a photo — AI will inspect it instantly</p>
          </div>
          <button className="modal-close" id="btn-close-modal" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        {/* Step 1: Location */}
        <div className="modal-section">
          <label className="section-label">
            <span className="step-badge">1</span> Location
          </label>
          <div className="location-display" id="location-display">
            <div className="location-icon">🗺️</div>
            <div className="location-text">
              <span className="coords-text" id="coords-text">
                {selectedLat ? `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}` : 'No location selected'}
              </span>
              <span className="coords-hint">Close modal → click on map → reopen</span>
            </div>
            <button className="btn-reselect" id="btn-reselect" onClick={onReselect}>Change</button>
          </div>
        </div>

        {/* Step 2: Photo */}
        <div className="modal-section">
          <label className="section-label" htmlFor="photo-input">
            <span className="step-badge">2</span> Photo
          </label>
          <div
            className={`upload-zone${photoPreviewSrc ? ' has-photo' : ''}`}
            id="upload-zone"
            onClick={() => photoInputRef.current?.click()}
          >
            <input type="file" id="photo-input" ref={photoInputRef} accept="image/*" capture="environment" hidden onChange={handleFileChange} />
            {!photoPreviewSrc ? (
              <div className="upload-placeholder" id="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p className="upload-text">Tap to take a photo or upload</p>
                <p className="upload-hint">Show the ramp, sidewalk, or obstacle clearly</p>
              </div>
            ) : (
              <>
                <img id="photo-preview" className="photo-preview" src={photoPreviewSrc} alt="Photo preview" />
                <button className="btn-change-photo" id="btn-change-photo" onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}>
                  Change Photo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 3: Category */}
        <div className="modal-section">
          <label className="section-label">
            <span className="step-badge">3</span> Category
            <span className="optional-tag">Helps AI</span>
          </label>
          <div className="category-chips" id="category-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-chip${category === cat ? ' selected' : ''}`}
                onClick={() => onCategoryChange(category === cat ? '' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {category === 'Others' && (
            <textarea
              id="other-text-input"
              className="note-input"
              placeholder="Describe the issue..."
              rows={2}
              maxLength={200}
              value={otherText}
              onChange={(e) => onOtherTextChange(e.target.value)}
              style={{ marginTop: 10 }}
            />
          )}
        </div>

        {/* AI Status */}
        {aiStatus !== 'idle' && (
          <div className="ai-status" id="ai-status">
            {aiStatus === 'loading' && (
              <div className="ai-spinner" id="ai-spinner">
                <div className="spinner-ring"></div>
                <div className="ai-status-text">
                  <span className="ai-label">Gemini AI is inspecting your photo...</span>
                  <span className="ai-sublabel">Analyzing accessibility conditions</span>
                </div>
              </div>
            )}
            {aiStatus === 'done' && aiResult && (
              <div className="ai-result" id="ai-result">
                {/* Severity badge + Rating */}
                <div className="ai-result-header">
                  <div className={`result-badge severity-${(aiResult.severity || '').toLowerCase()}`} id="result-badge">
                    {aiResult.severity === 'Safe'      && `🟢 ${aiResult.category || 'Safe'}`}
                    {aiResult.severity === 'Minor'     && `🟡 ${aiResult.category || 'Minor'}`}
                    {aiResult.severity === 'Moderate'  && `🟠 ${aiResult.category || 'Moderate'}`}
                    {aiResult.severity === 'Dangerous' && `🔴 ${aiResult.category || 'Dangerous'}`}
                    {!aiResult.severity && (aiResult.status === 'ACCESSIBLE' ? '✅ Accessible' : '⚠️ Hazard')}
                  </div>
                  {aiResult.rating != null && (
                    <div className="ai-rating" id="ai-rating">
                      <span className="ai-rating-score">{Number(aiResult.rating).toFixed(1)}</span>
                      <span className="ai-rating-max">/5.0</span>
                      <div className="ai-rating-stars">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`star ${i <= Math.round(aiResult.rating) ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Comment */}
                {aiResult.comment && (
                  <div id="ai-comment" style={{
                    background: 'rgba(124,77,255,0.08)',
                    border: '1px solid rgba(124,77,255,0.2)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginTop: '10px',
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c4dff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                      🤖 AI Observation
                    </p>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {aiResult.comment}
                    </p>
                  </div>
                )}

                {/* Positive Features */}
                {aiResult.positive_features?.length > 0 && (
                  <div className="ai-features" id="ai-features">
                    <p className="ai-features-label">✅ Accessible Features</p>
                    <div className="ai-tags">
                      {aiResult.positive_features.map((f, i) => <span key={i} className="ai-tag green">{f}</span>)}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {aiResult.warnings?.length > 0 && (
                  <div className="ai-warnings" id="ai-warnings">
                    <p className="ai-features-label">⚠️ Warnings</p>
                    <div className="ai-tags">
                      {aiResult.warnings.map((w, i) => <span key={i} className="ai-tag red">{w}</span>)}
                    </div>
                  </div>
                )}

                {!aiResult.positive_features?.length && !aiResult.warnings?.length && (
                  <p className="result-desc" id="result-desc">{aiResult.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button className="btn-submit" id="btn-submit" disabled={!canSubmit} onClick={onSubmit}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          Submit Report
        </button>
      </div>
    </div>
  );
}
