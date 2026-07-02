'use client';
import { useState, useEffect } from 'react';

const STATUS = {
  idle:    { color: '#7c4dff', bg: 'rgba(124,77,255,0.12)', border: 'rgba(124,77,255,0.3)', dot: '#7c4dff', label: 'Checking AI…' },
  pass:    { color: '#00e676', bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.3)',   dot: '#00e676', label: 'AI Ready' },
  fail:    { color: '#ff5252', bg: 'rgba(255,82,82,0.1)',   border: 'rgba(255,82,82,0.3)',   dot: '#ff5252', label: 'AI Unavailable' },
  loading: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', dot: '#fbbf24', label: 'Checking AI…' },
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
          background: 'rgba(10,14,26,0.97)',
          border: `1px solid ${s.border}`,
          borderRadius: '14px',
          padding: '14px 16px',
          minWidth: '260px',
          maxWidth: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              🤖 AI Diagnostics
            </span>
            <button onClick={runCheck} style={{
              background: 'rgba(124,77,255,0.2)', border: '1px solid rgba(124,77,255,0.4)',
              borderRadius: '8px', color: '#7c4dff', fontSize: '0.72rem',
              padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            }}>
              Re-test
            </button>
          </div>

          {steps.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', padding: '8px 0' }}>
              {status === 'loading' ? '⏳ Running checks…' : 'No data'}
            </div>
          )}

          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '8px 10px',
              background: s.status === 'pass' ? 'rgba(0,230,118,0.07)' : 'rgba(255,82,82,0.07)',
              border: `1px solid ${s.status === 'pass' ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '0.85rem', flexShrink: 0, marginTop: '1px' }}>
                {s.status === 'pass' ? '✅' : '❌'}
              </span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{s.step}</div>
                <div style={{ fontSize: '0.72rem', color: '#aaa', lineHeight: 1.4 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status pill */}
      <button
        id="ai-status-pill"
        onClick={() => setExpanded(e => !e)}
        title="Click to see AI diagnostics"
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: '20px',
          padding: '6px 12px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 2px 12px rgba(0,0,0,0.4)`,
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
            ? `0 0 6px ${s.dot}`
            : 'none',
          animation: status === 'loading' ? 'aiPulse 1s ease-in-out infinite' : 'none',
        }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, whiteSpace: 'nowrap' }}>
          {s.label}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#666', marginLeft: '2px' }}>
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
