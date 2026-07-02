'use client';

export default function LocationActionCard({ lat, lng, onReport, onNavigate, onClose }) {
  if (!lat || !lng) return null;

  return (
    <>
      {/* Floating action card — slides up from bottom */}
      <div style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '18px 18px 14px',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-strong)',
          margin: '0 auto 14px',
        }} />

        {/* Coordinates */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', flexShrink: 0,
          }}>📍</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 1 }}>Selected Location</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'monospace' }}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
              padding: '4px',
            }}
          >✕</button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: 14 }} />

        {/* Action label */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          What do you want to do here?
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Navigate row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => { onNavigate('walk'); onClose(); }}
              style={navBtnStyle('#1a56db')}
            >
              <span style={{ fontSize: '1.3rem' }}>🚶</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Walk Here</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pedestrian route</div>
              </div>
            </button>

            <button
              onClick={() => { onNavigate('wheelchair'); onClose(); }}
              style={navBtnStyle('#2e7d32')}
            >
              <span style={{ fontSize: '1.3rem' }}>♿</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Wheelchair</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accessible route</div>
              </div>
            </button>
          </div>

          {/* Report button */}
          <button
            onClick={() => { onReport(); onClose(); }}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>Report Accessibility Issue</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Upload photo · AI analysis · Community map</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

function navBtnStyle(color) {
  return {
    padding: '11px 14px', borderRadius: '12px',
    background: `${color}15`,
    border: `1px solid ${color}33`,
    color: 'var(--text)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'background 0.15s, transform 0.1s',
    textAlign: 'left',
  };
}
