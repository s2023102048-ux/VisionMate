'use client';
import { useState, useEffect } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function setPref(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 0,
        background: on ? 'var(--accent)' : 'var(--border-strong)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        display: 'block',
      }} />
    </button>
  );
}

// ── Section Divider ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.7rem', fontWeight: 700,
      color: 'var(--text-dim)', textTransform: 'uppercase',
      letterSpacing: '0.08em', padding: '4px 4px 6px',
    }}>
      {children}
    </div>
  );
}

// ── Menu Row ─────────────────────────────────────────────────────────────────
function MenuRow({ icon, label, right, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = 'var(--surface)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.9rem', color: danger ? 'var(--red)' : 'var(--text)', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsPanel({ open, onClose }) {
  const [profile, setProfile]   = useState(null);
  const [notifs,  setNotifs]    = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [section, setSection]   = useState('main'); // 'main' | 'privacy' | 'about'
  const [notifsGranted, setNotifsGranted] = useState(false);
  const [copied, setCopied]     = useState(false);

  // ── Load prefs on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setSection('main');

    const savedDark   = getPref('vm_dark_mode', false);
    const savedNotifs = getPref('vm_notifications', false);
    setDarkMode(savedDark);
    setNotifs(savedNotifs);
    // Re-apply dark mode on panel open (persists across refreshes)
    document.documentElement.setAttribute('data-theme', savedDark ? 'dark' : 'light');
    setNotifsGranted(Notification?.permission === 'granted');

    // Load profile from Firebase
    let unsubscribe;
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
      const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = getAuth(app);
      const db   = getFirestore(app);

      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u) {
          try {
            const snap = await getDoc(doc(db, 'users', u.uid));
            setProfile(snap.exists()
              ? { ...snap.data(), email: u.email, photoURL: u.photoURL || snap.data().photoURL }
              : { name: u.displayName || 'VisionMate User', email: u.email, photoURL: u.photoURL });
          } catch {
            setProfile({ name: u.displayName || 'VisionMate User', email: u.email, photoURL: u.photoURL });
          }
        } else {
          setProfile(null);
        }
      });
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, [open]);

  // ── Dark Mode ────────────────────────────────────────────────────────────
  const handleDarkMode = (val) => {
    setDarkMode(val);
    setPref('vm_dark_mode', val);
    document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light');
  };

  // ── Notifications ────────────────────────────────────────────────────────
  const handleNotifs = async (val) => {
    if (val) {
      if (!('Notification' in window)) {
        alert('This browser does not support push notifications.');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotifsGranted(true);
        setNotifs(true);
        setPref('vm_notifications', true);
        new Notification('VisionMate', { body: '✅ Notifications enabled. Stay informed about nearby hazards!', icon: '/logo.png' });
      } else {
        alert('Notification permission denied. Please enable it in your browser settings.');
      }
    } else {
      setNotifs(false);
      setPref('vm_notifications', false);
    }
  };


  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth, signOut } = await import('firebase/auth');
      const app = getApps()[0];
      if (app) await signOut(getAuth(app));
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ── Clear onboarding ──────────────────────────────────────────────────────
  const handleResetOnboarding = () => {
    localStorage.removeItem('vm_onboarding_done');
    onClose();
    window.location.reload();
  };

  // ── Download data (simulated) ─────────────────────────────────────────────
  const handleDownloadData = () => {
    const data = {
      profile: { name: profile?.name, email: profile?.email },
      preferences: { darkMode, notifications: notifs },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'visionmate-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Copy UID ─────────────────────────────────────────────────────────────
  const handleCopyUID = async () => {
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth } = await import('firebase/auth');
      const app = getApps()[0];
      if (app) {
        const uid = getAuth(app).currentUser?.uid;
        if (uid) { await navigator.clipboard.writeText(uid); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      }
    } catch {}
  };

  if (!open) return null;

  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'VM';
  return (
    <div
      id="settings-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'overlayIn 0.2s ease',
      }}
    >
      <div
        id="settings-panel"
        style={{
          width: '100%', maxWidth: '520px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '16px 16px 0 0',
          padding: '0 0 40px',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '88vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MAIN VIEW ── */}
        {section === 'main' && (
          <>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 20px 0',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Settings</span>
              <button onClick={onClose} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', width: 30, height: 30, borderRadius: '50%',
                cursor: 'pointer', fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 18 }}>
              {/* Profile */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px',
              }}>
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="Profile" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: 'var(--accent)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', color: '#fff', fontWeight: 700,
                    }}>{initials}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.name || 'Loading...'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.email || 'Community Contributor'}
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SectionLabel>Preferences</SectionLabel>
                <MenuRow
                  id="toggle-notifications"
                  icon="🔔"
                  label="Push Notifications"
                  right={<Toggle id="notif-toggle" on={notifs} onChange={handleNotifs} />}
                />
                <MenuRow
                  icon="🌙"
                  label="Dark Mode"
                  right={<Toggle id="dark-mode-toggle" on={darkMode} onChange={handleDarkMode} />}
                />
              </div>

              {/* Account */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SectionLabel>Account</SectionLabel>
                <MenuRow
                  icon="🛡️"
                  label="Privacy & Data"
                  right={<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>❯</span>}
                  onClick={() => setSection('privacy')}
                />
                <MenuRow
                  icon="ℹ️"
                  label="About VisionMate"
                  right={<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>❯</span>}
                  onClick={() => setSection('about')}
                />
                <MenuRow
                  icon="🔄"
                  label="Restart Guide"
                  right={<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>❯</span>}
                  onClick={handleResetOnboarding}
                />
              </div>

              {/* Sign Out */}
              <button onClick={handleSignOut} style={{
                width: '100%', padding: '13px',
                background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.2)',
                borderRadius: '10px', color: '#c62828', fontSize: '0.9rem', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.2s', marginTop: -4,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(198,40,40,0.05)'}
              >
                Log Out
              </button>
            </div>
          </>
        )}

        {/* ── PRIVACY VIEW ── */}
        {section === 'privacy' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 0' }}>
              <button onClick={() => setSection('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)', padding: '4px 6px 4px 0' }}>←</button>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Privacy & Data</span>
            </div>
            <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SectionLabel>What we collect</SectionLabel>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                VisionMate collects your <b>name</b>, <b>email</b>, <b>submitted report photos</b>, and <b>GPS coordinates of pins</b> to power the community accessibility map. We do not sell any data.
              </div>

              <SectionLabel style={{ marginTop: 8 }}>Your data</SectionLabel>
              <MenuRow
                icon="📥"
                label="Download My Data"
                right={<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>❯</span>}
                onClick={handleDownloadData}
              />
              <MenuRow
                icon="🔑"
                label={copied ? '✅ Copied!' : 'Copy My User ID'}
                right={<span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>❯</span>}
                onClick={handleCopyUID}
              />
              <MenuRow
                icon="🗑️"
                label="Delete My Reports"
                danger
                right={<span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>❯</span>}
                onClick={() => alert('To delete specific reports, tap any of your pins on the map and press "Delete Report".')}
              />
            </div>
          </>
        )}

        {/* ── ABOUT VIEW ── */}
        {section === 'about' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 0' }}>
              <button onClick={() => setSection('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)', padding: '4px 6px 4px 0' }}>←</button>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>About VisionMate</span>
            </div>
            <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <img src="/logo.png" alt="VisionMate" style={{ width: 60, height: 60, borderRadius: 12 }} onError={e => { e.target.style.display = 'none'; }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>VisionMate</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)' }}>PWD Accessibility Community Map</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Build', value: 'SparkFest 2026' },
                  { label: 'Platform', value: 'Next.js + Cloudflare' },
                  { label: 'Maps', value: 'OpenStreetMap · Leaflet' },
                  { label: 'AI Inspection', value: 'Google Gemini' },
                  { label: 'Database', value: 'Google Firebase' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                  }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text)', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                Built to help PWD members and their caregivers navigate and report barriers in their community.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
