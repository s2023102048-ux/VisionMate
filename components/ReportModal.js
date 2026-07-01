'use client';

import { useRef, useEffect } from 'react';

export default function ReportModal({
  visible,
  selectedLat,
  selectedLng,
  selectedFile,
  photoPreviewSrc,
  note,
  aiStatus,       // 'idle' | 'loading' | 'done'
  aiResult,       // { status, description } | null
  onClose,
  onReselect,
  onPhotoChange,
  onNoteChange,
  onSubmit,
}) {
  const photoInputRef = useRef(null);
  const canSubmit = selectedLat && selectedFile;

  // Lock body scroll when modal open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onPhotoChange(file);
  };

  return (
    <div
      className="modal-overlay"
      id="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="modal"
        id="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
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
                {selectedLat
                  ? `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`
                  : 'No location selected'}
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
            <input
              type="file"
              id="photo-input"
              ref={photoInputRef}
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleFileChange}
            />
            {!photoPreviewSrc ? (
              <div className="upload-placeholder" id="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p className="upload-text">Tap to take a photo or upload</p>
                <p className="upload-hint">Show the ramp, sidewalk, or obstacle clearly</p>
              </div>
            ) : (
              <>
                <img
                  id="photo-preview"
                  className="photo-preview"
                  src={photoPreviewSrc}
                  alt="Photo preview"
                />
                <button
                  className="btn-change-photo"
                  id="btn-change-photo"
                  onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                >
                  Change Photo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 3: Note */}
        <div className="modal-section">
          <label className="section-label" htmlFor="note-input">
            <span className="step-badge">3</span> Note{' '}
            <span className="optional-tag">Optional</span>
          </label>
          <textarea
            id="note-input"
            className="note-input"
            placeholder="E.g. 'Broken ramp near the entrance'..."
            rows={2}
            maxLength={200}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
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
                <div className={`result-badge ${aiResult.status === 'ACCESSIBLE' ? 'accessible' : 'hazard'}`} id="result-badge">
                  {aiResult.status === 'ACCESSIBLE' ? '✅ Accessible' : '⚠️ Hazard'}
                </div>
                <p className="result-desc" id="result-desc">{aiResult.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-submit"
          id="btn-submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          Submit Report
        </button>
      </div>
    </div>
  );
}
