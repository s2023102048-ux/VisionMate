'use client';
import { useState, useEffect } from 'react';
import { app, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ⚠️ firebase/auth CANNOT be statically imported — Turbopack/Edge Runtime crashes.
// We dynamically import it ONLY inside useEffect (client side only).

export default function AuthModal() {
  const [user, setUser]           = useState(undefined); // undefined = not yet determined
  const [needsProfile, setNeedsProfile] = useState(false);
  const [name,    setName]        = useState('');
  const [contact, setContact]     = useState('');
  const [agreed,  setAgreed]      = useState(false);
  const [saving,  setSaving]      = useState(false);

  // Dynamically load firebase/auth after mount (client only)
  useEffect(() => {
    let unsubscribe;

    (async () => {
      const { getAuth, GoogleAuthProvider, onAuthStateChanged } = await import('firebase/auth');
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
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth(app);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error('Sign-in error:', err);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    const { getAuth, signOut } = await import('firebase/auth');
    await signOut(getAuth(app));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name || !contact || !agreed) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        emergencyContact: contact,
        email: user.email,
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

  // undefined = still loading auth state, don't flash anything
  if (user === undefined) return null;

  // Logged in and profile complete — nothing to show
  if (user && !needsProfile) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(7,11,20,0.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(124,77,255,0.25)',
        borderRadius: '20px', padding: '32px 28px', width: '100%', maxWidth: '400px',
        color: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.3s ease',
      }}>
        {!user ? (
          /* ── Step 1: Sign in ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>♿</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700 }}>Welcome to VisionMate</h2>
            <p style={{ color: '#999', fontSize: '0.88rem', marginBottom: '28px', lineHeight: 1.5 }}>
              Sign in to contribute accessibility reports and enable emergency contact features.
            </p>
            <button onClick={handleGoogleSignIn} style={{
              width: '100%', padding: '14px 20px', borderRadius: '12px',
              background: '#fff', color: '#1a1a1a', border: 'none',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'transform 0.15s',
            }}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                width="20" height="20" alt="Google"
              />
              Continue with Google
            </button>
          </div>
        ) : (
          /* ── Step 2: Complete profile ── */
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              {user.photoURL && (
                <img src={user.photoURL} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', marginBottom: 10 }} />
              )}
              <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700 }}>Complete Your Profile</h2>
              <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>Signed in as {user.email}</p>
            </div>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Juan Dela Cruz" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Family Emergency Contact No.</label>
              <input
                type="tel" required value={contact} onChange={e => setContact(e.target.value)}
                placeholder="0912 345 6789" style={inputStyle}
              />
              <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: '#777' }}>
                This number will be alerted when you press the SOS button.
              </p>
            </div>

            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', marginTop: '4px', alignItems: 'flex-start' }}>
              <input
                type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 3, transform: 'scale(1.2)', accentColor: '#7c4dff', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.5 }}>
                I have read and agree to the{' '}
                <span style={{ color: '#7c4dff', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
                I consent to VisionMate collecting my name and emergency contact for accessibility and safety purposes.
              </span>
            </label>

            <button
              type="submit"
              disabled={!agreed || !name || !contact || saving}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px', marginTop: '4px',
                background: (!agreed || !name || !contact || saving) ? '#2a2a3a' : 'linear-gradient(135deg, #7c4dff, #651fff)',
                color: (!agreed || !name || !contact || saving) ? '#555' : '#fff',
                border: 'none', fontSize: '0.95rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saving ? 'Saving…' : '🎉 Finish Sign Up'}
            </button>

            <button type="button" onClick={handleSignOut} style={{
              background: 'none', border: 'none', color: '#ff5252',
              fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer', padding: 0,
            }}>
              Cancel &amp; Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '6px', fontWeight: 600,
};
const inputStyle = {
  width: '100%', padding: '11px 13px', borderRadius: '9px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};
