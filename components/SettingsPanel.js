'use client';
import { useState, useEffect } from 'react';

export default function SettingsPanel({ open, onClose }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubscribe;
    if (!open) return; // Only fetch if panel is open to save reads

    (async () => {
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

      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = getAuth(app);
      const db = getFirestore(app);

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          try {
            const snap = await getDoc(doc(db, 'users', u.uid));
            if (snap.exists()) {
              setProfile({ ...snap.data(), email: u.email, photoURL: u.photoURL || snap.data().photoURL });
            } else {
              setProfile({ name: u.displayName || 'VisionMate User', email: u.email, photoURL: u.photoURL });
            }
          } catch (e) {
            console.error(e);
            setProfile({ name: u.displayName || 'VisionMate User', email: u.email, photoURL: u.photoURL });
          }
        } else {
          setProfile(null);
        }
      });
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, [open]);

  const handleSignOut = async () => {
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, signOut } = await import('firebase/auth');
      const app = getApps()[0];
      if (app) await signOut(getAuth(app));
      onClose();
      // Optional: force reload to reset state if needed
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (!open) return null;

  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'VM';

  return (
    <div
      id="settings-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(7,11,20,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'overlayIn 0.2s ease',
      }}
    >
      <div
        id="settings-panel"
        style={{
          width: '100%', maxWidth: '520px',
          background: 'rgba(10,14,26,0.99)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>⚙️ Settings</span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#888', width: 32, height: 32, borderRadius: '50%',
            cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #7c4dff, #00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>
              {initials}
            </div>
          )}
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
              {profile?.name || 'Loading...'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
              {profile?.email || 'Community Contributor'}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div style={menuItemStyle}>
            <div style={menuLeftStyle}>
              <span style={menuIconStyle}>🔔</span>
              <span style={menuTextStyle}>Push Notifications</span>
            </div>
            <div className="toggle-switch active"></div>
          </div>

          <div style={menuItemStyle}>
            <div style={menuLeftStyle}>
              <span style={menuIconStyle}>🌙</span>
              <span style={menuTextStyle}>Dark Mode</span>
            </div>
            <div className="toggle-switch active"></div>
          </div>

          <div style={menuItemStyle}>
            <div style={menuLeftStyle}>
              <span style={menuIconStyle}>🌐</span>
              <span style={menuTextStyle}>Language</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#888' }}>English (US) ❯</span>
          </div>

          <div style={menuItemStyle}>
            <div style={menuLeftStyle}>
              <span style={menuIconStyle}>🛡️</span>
              <span style={menuTextStyle}>Privacy & Data</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#888' }}>❯</span>
          </div>

          <div style={menuItemStyle}>
            <div style={menuLeftStyle}>
              <span style={menuIconStyle}>ℹ️</span>
              <span style={menuTextStyle}>About VisionMate</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#888' }}>v1.0.0 ❯</span>
          </div>

        </div>

        {/* Log Out */}
        <button onClick={handleSignOut} style={{
          marginTop: '10px', width: '100%', padding: '14px',
          background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
          borderRadius: '12px', color: '#ff5252', fontSize: '0.9rem', fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.2s'
        }}>
          Log Out
        </button>

      </div>
    </div>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
  borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s'
};

const menuLeftStyle = {
  display: 'flex', alignItems: 'center', gap: '12px'
};

const menuIconStyle = {
  fontSize: '1.2rem'
};

const menuTextStyle = {
  fontSize: '0.95rem', color: '#e0e0e0', fontWeight: 500
};
