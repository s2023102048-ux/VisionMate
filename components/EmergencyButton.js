'use client';
import { useState, useEffect } from 'react';

export default function EmergencyButton({ userLocation }) {
  const [open,   setOpen]   = useState(false);
  const [shared, setShared] = useState(false);
  const [contacts, setContacts] = useState({ family: null, care: null });

  // Load contacts from Firebase on mount
  useEffect(() => {
    (async () => {
      try {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
        const FIREBASE_CONFIG = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
        const auth = getAuth(app);
        const db   = getFirestore(app);

        onAuthStateChanged(auth, async (u) => {
          if (u) {
            const snap = await getDoc(doc(db, 'users', u.uid));
            if (snap.exists()) {
              const data = snap.data();
              setContacts({
                family: data.emergencyContact  || null,
                care:   data.careNetworkContact || null,
              });
            }
          }
        });
      } catch (err) {
        console.warn('Could not load emergency contacts:', err);
      }
    })();
  }, []);

  // ── Call helper: prompt if no number saved ───────────────────────────────
  const callNumber = (type) => {
    const saved = type === 'family' ? contacts.family : contacts.care;
    if (saved) {
      window.location.href = `tel:${saved}`;
    } else {
      const label = type === 'family' ? "family member's" : "care network member's";
      const input = prompt(`Enter your ${label} phone number to call:`);
      if (input) {
        // Save to state so it's remembered for this session
        setContacts(prev => ({ ...prev, [type]: input }));
        window.location.href = `tel:${input}`;
      }
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

              {/* Call Family */}
              <button className="sos-option" id="sos-call-family" onClick={() => callNumber('family')}>
                <span className="sos-option-icon">📞</span>
                <div>
                  <span className="sos-option-label">Call Family</span>
                  <span className="sos-option-sub">
                    {contacts.family ? `📱 ${contacts.family}` : 'Opens your phone dialer'}
                  </span>
                </div>
              </button>

              {/* Call Care Network */}
              <button className="sos-option" id="sos-call-caregiver" onClick={() => callNumber('care')}>
                <span className="sos-option-icon">🏥</span>
                <div>
                  <span className="sos-option-label">Call Care Network</span>
                  <span className="sos-option-sub">
                    {contacts.care ? `📱 ${contacts.care}` : 'Caregiver or support member'}
                  </span>
                </div>
              </button>

              {/* Share Location */}
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

            {/* Contact note */}
            {(!contacts.family && !contacts.care) && (
              <p style={{
                margin: '12px 0 0', fontSize: '0.72rem',
                color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5,
              }}>
                💡 Tip: Set up emergency contacts during sign-up to enable one-tap calling.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
