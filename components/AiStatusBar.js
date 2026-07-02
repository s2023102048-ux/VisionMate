'use client';
import { useState, useEffect } from 'react';

const STATUS = {
  idle:    { color: '#1a56db', bg: 'rgba(26,86,219,0.1)', border: 'rgba(26,86,219,0.2)', dot: '#1a56db', label: 'Checking AI…' },
  pass:    { color: '#2e7d32', bg: 'rgba(46,125,50,0.1)',   border: 'rgba(46,125,50,0.2)',   dot: '#2e7d32', label: 'System Ready' },
  fail:    { color: '#c62828', bg: 'rgba(198,40,40,0.1)',   border: 'rgba(198,40,40,0.2)',   dot: '#c62828', label: 'System Unavailable' },
  loading: { color: '#b45309', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b', label: 'Checking…' },
};

export default function AiStatusBar() {
  const [status, setStatus]     = useState('loading');
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps]       = useState([]);
  const [checked, setChecked]   = useState(false);

  useEffect(() => {
    runCheck();
  }, []);

  async function runCheck() {
    setStatus('loading');
    setSteps([]);
    setChecked(false);
    try {
      const res  = await fetch('/api/gemini/test');
      const data = await res.json();
      setSteps(data.steps || []);
      setStatus(data.ok ? 'pass' : 'fail');
    } catch (err) {
      setSteps([{ step: 'Connection', status: 'fail', detail: `Could not reach /api/gemini/test: ${err.message}` }]);
      setStatus('fail');
    }
    setChecked(true);
  }

  const s = STATUS[status] || STATUS.idle;

  return (
    <div id="ai-status-bar" style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      {/* Expanded debug panel */}
      {expanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '10px',
          zIndex: 950,
          background: '#ffffff',
          border: `1px solid var(--border)`,
          borderRadius: '12px',
          padding: '14px 16px',
          minWidth: '260px',
          maxWidth: '320px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Diagnostics
            </span>
            <button onClick={runCheck} style={{
              background: 'rgba(26,86,219,0.1)', border: '1px solid rgba(26,86,219,0.2)',
              borderRadius: '6px', color: '#1a56db', fontSize: '0.72rem',
              padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>
              Re-test
            </button>
          </div>

          {steps.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#777', textAlign: 'center', padding: '8px 0' }}>
              {status === 'loading' ? '⏳ Running checks…' : 'No data'}
            </div>
          )}

          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '8px 10px',
              background: s.status === 'pass' ? 'rgba(46,125,50,0.05)' : 'rgba(198,40,40,0.05)',
              border: `1px solid ${s.status === 'pass' ? 'rgba(46,125,50,0.15)' : 'rgba(198,40,40,0.15)'}`,
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '0.85rem', flexShrink: 0, marginTop: '1px' }}>
                {s.status === 'pass' ? '✅' : '❌'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#333', marginBottom: '2px' }}>{s.step}</div>
                <div style={{ fontSize: '0.72rem', color: '#666', lineHeight: 1.4, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status pill */}
      <button
        id="ai-status-pill"
        onClick={() => setExpanded(e => !e)}
        title="Click to see diagnostics"
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: '20px',
          padding: '6px 12px',
          cursor: 'pointer',
          boxShadow: `0 2px 8px rgba(0,0,0,0.05)`,
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {/* Animated dot */}
        <span style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: s.dot,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: status === 'loading'
            ? `0 0 0 3px ${s.dot}33`
            : status === 'pass'
            ? `none`
            : 'none',
          animation: status === 'loading' ? 'aiPulse 1s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, whiteSpace: 'nowrap' }}>
          {s.label}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#777', marginLeft: '2px' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      <style>{`
        @keyframes aiPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
