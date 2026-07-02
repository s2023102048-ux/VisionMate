'use client';
import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AuthModal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user has a profile in Firestore
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (!userDoc.exists()) {
          setNeedsProfile(true);
          setName(u.displayName || '');
        } else {
          setNeedsProfile(false);
        }
      } else {
        setNeedsProfile(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
      alert('Failed to sign in. Check console for details.');
    }
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
        createdAt: new Date()
      });
      setNeedsProfile(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. See console.');
    }
    setSaving(false);
  };

  // If loading or already logged in with a profile, hide the modal entirely.
  if (loading || (user && !needsProfile)) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(7,11,20,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(124,77,255,0.3)',
        borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '400px',
        color: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease'
      }}>
        {!user ? (
          // Step 1: Login
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>Welcome to VisionMate</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '30px' }}>
              Sign in to contribute to the PWD accessibility map and alert emergency contacts.
            </p>
            <button 
              onClick={handleGoogleSignIn}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: '#fff', color: '#000', border: 'none',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="G" />
              Sign in with Google
            </button>
          </div>
        ) : (
          // Step 2: Complete Profile
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: '0 0 5px', fontSize: '1.3rem' }}>Complete Profile</h2>
              <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>Almost there! We just need a few details.</p>
            </div>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                style={inputStyle} placeholder="Juan Dela Cruz"
              />
            </div>

            <div>
              <label style={labelStyle}>Family Emergency Contact No.</label>
              <input 
                type="tel" required value={contact} onChange={e => setContact(e.target.value)}
                style={inputStyle} placeholder="0912 345 6789"
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#888' }}>
                Used only if you press the SOS Emergency Button.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
              <input 
                type="checkbox" id="privacy" required checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: '4px', transform: 'scale(1.2)' }}
              />
              <label htmlFor="privacy" style={{ fontSize: '0.8rem', color: '#ccc', lineHeight: 1.4 }}>
                I agree to the <span style={{ color: '#7c4dff', textDecoration: 'underline' }}>Privacy Policy</span> and consent to VisionMate using my data to provide routing and emergency features.
              </label>
            </div>

            <button 
              disabled={!agreed || !name || !contact || saving}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px',
                background: (!agreed || !name || !contact || saving) ? '#333' : '#7c4dff',
                color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Finish Sign Up'}
            </button>

            <button type="button" onClick={() => signOut(auth)} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: '0.8rem', textDecoration: 'underline', marginTop: '5px', cursor: 'pointer' }}>
              Cancel & Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '6px', fontWeight: 'bold' };
const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.95rem'
};
