'use client';
import { useState, useEffect } from 'react';

export default function AuthModal() {
  const [user, setUser]                   = useState(undefined);
  const [needsProfile, setNeedsProfile]   = useState(false);
  const [name,    setName]                = useState('');
  const [contact, setContact]             = useState('');
  const [careContact, setCareContact]     = useState('');  // Support Network contact
  const [agreed,  setAgreed]              = useState(false);
  const [saving,  setSaving]              = useState(false);

  useEffect(() => {
    let unsubscribe;
    (async () => {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');

      const FIREBASE_CONFIG = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const db   = getFirestore(app);
      const auth = getAuth(app);

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        setUser(u || null);
        if (u) {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (!snap.exists()) {
            setNeedsProfile(true);
            setName(u.displayName || '');
          } else {
            setNeedsProfile(false);
          }
        } else {
          setNeedsProfile(false);
        }
      });
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const FIREBASE_CONFIG = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      await signInWithPopup(getAuth(app), new GoogleAuthProvider());
    } catch (err) {
      console.error('Sign-in error:', err);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, signOut } = await import('firebase/auth');
    const FIREBASE_CONFIG = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    await signOut(getAuth(app));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name || !contact || !agreed || !user) return;
    setSaving(true);
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, doc, setDoc } = await import('firebase/firestore');
      const FIREBASE_CONFIG = {
        apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const db  = getFirestore(app);
      await setDoc(doc(db, 'users', user.uid), {
        name,
        emergencyContact:  contact,
        careNetworkContact: careContact || '',   // Support Network / caregiver contact
        email:    user.email,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
      });
      setNeedsProfile(false);
    } catch (err) {
      console.error('Save profile error:', err);
      alert('Failed to save profile. See console.');
    }
    setSaving(false);
  };

  if (user === undefined) return null;
  if (user && !needsProfile) return null;

  const canSubmit = agreed && !!name && !!contact && !saving;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '32px 28px', width: '100%', maxWidth: '420px',
        color: 'var(--text)', boxShadow: 'var(--shadow)',
        animation: 'slideUp 0.3s ease', margin: 'auto',
      }}>
        {!user ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>♿</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700 }}>Welcome to VisionMate</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '28px', lineHeight: 1.5 }}>
              Sign in to contribute accessibility reports and enable emergency contact features.
            </p>
            <button onClick={handleGoogleSignIn} style={{
              width: '100%', padding: '14px 20px', borderRadius: '12px',
              background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="Google" />
              Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              {user.photoURL && <img src={user.photoURL} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', marginBottom: 10 }} />}
              <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700 }}>Complete Your Profile</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0 }}>Signed in as {user.email}</p>
            </div>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" style={inputStyle} />
            </div>

            {/* Section label */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <p style={{ margin: '0 0 2px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-dim)' }}>
                🆘 Emergency Contacts
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                These contacts are called directly from the SOS button. At least one is required.
              </p>
            </div>

            {/* Family Contact */}
            <div>
              <label style={labelStyle}>
                Family / Primary Contact <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input
                type="tel" required
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="0912 345 6789"
                style={inputStyle}
              />
              <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Your closest family member to be contacted in emergencies.
              </p>
            </div>

            {/* Care Network Contact */}
            <div>
              <label style={labelStyle}>
                Care Network Contact
                <span style={{ marginLeft: 6, fontSize: '0.68rem', fontWeight: 400, color: 'var(--text-dim)' }}>
                  (optional)
                </span>
              </label>
              <input
                type="tel"
                value={careContact}
                onChange={e => setCareContact(e.target.value)}
                placeholder="Caregiver, nurse, or support member"
                style={inputStyle}
              />
              <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                A caregiver, community volunteer, or support member who can assist you.
              </p>
            </div>

            {/* Privacy consent */}
            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', marginTop: '4px', alignItems: 'flex-start' }}>
              <input type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 3, transform: 'scale(1.2)', accentColor: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</span> and consent to VisionMate collecting my data for accessibility and safety purposes.
              </span>
            </label>

            <button type="submit" disabled={!canSubmit} style={{
              width: '100%', padding: '13px', borderRadius: '12px', marginTop: '4px',
              background: canSubmit ? 'var(--accent)' : 'var(--border)',
              color: canSubmit ? '#fff' : 'var(--text-dim)',
              border: 'none', fontSize: '0.95rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
              transition: 'background 0.2s',
            }}>
              {saving ? 'Saving…' : '🎉 Finish Sign Up'}
            </button>

            <button type="button" onClick={handleSignOut} style={{
              background: 'none', border: 'none', color: 'var(--red)',
              fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', padding: 0,
            }}>
              Cancel & Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 };
const inputStyle = {
  width: '100%', padding: '11px 13px', borderRadius: '9px',
  border: '1px solid var(--border-strong)',
  background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};
