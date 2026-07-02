'use client';
import { useState } from 'react';

export default function EmergencyButton({ userLocation }) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const callFamily = () => {
    const num = localStorage.getItem('vm_family_number');
    if (num) window.location.href = `tel:${num}`;
    else {
      const input = prompt('Enter your family\'s phone number to call:');
      if (input) { localStorage.setItem('vm_family_number', input); window.location.href = `tel:${input}`; }
    }
  };

  const callCaregiver = () => {
    const num = localStorage.getItem('vm_caregiver_number');
    if (num) window.location.href = `tel:${num}`;
    else {
      const input = prompt('Enter your caregiver\'s phone number to call:');
      if (input) { localStorage.setItem('vm_caregiver_number', input); window.location.href = `tel:${input}`; }
    }
  };

  const shareLocation = async () => {
    const lat = userLocation?.lat;
    const lng = userLocation?.lng;
    const text = lat
      ? `🆘 I need assistance! My location: https://www.google.com/maps?q=${lat},${lng}`
      : '🆘 I need assistance! (Location unavailable)';

    try {
      if (navigator.share) {
        await navigator.share({ title: 'VisionMate SOS', text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {}
  };

  return (
    <>
      {/* SOS FAB */}
      <button className="sos-btn" id="sos-btn" onClick={() => setOpen(true)} title="Emergency - Need Assistance">
        <span className="sos-label">SOS</span>
      </button>

      {/* SOS Panel */}
      {open && (
        <div className="sos-overlay" id="sos-overlay" onClick={() => setOpen(false)}>
          <div className="sos-panel" id="sos-panel" onClick={e => e.stopPropagation()}>
            <div className="sos-header">
              <span className="sos-title">🆘 Need Assistance?</span>
              <button className="sos-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <p className="sos-subtitle">Choose an option below</p>

            <div className="sos-options">
              <button className="sos-option" id="sos-call-family" onClick={callFamily}>
                <span className="sos-option-icon">📞</span>
                <div>
                  <span className="sos-option-label">Call Family</span>
                  <span className="sos-option-sub">Opens your phone dialer</span>
                </div>
              </button>

              <button className="sos-option" id="sos-call-caregiver" onClick={callCaregiver}>
                <span className="sos-option-icon">🏥</span>
                <div>
                  <span className="sos-option-label">Call Caregiver</span>
                  <span className="sos-option-sub">Opens your phone dialer</span>
                </div>
              </button>

              <button className="sos-option" id="sos-share-location" onClick={shareLocation}>
                <span className="sos-option-icon">📍</span>
                <div>
                  <span className="sos-option-label">
                    {shared ? '✅ Location Copied!' : 'Share Live Location'}
                  </span>
                  <span className="sos-option-sub">Send your GPS coordinates</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
