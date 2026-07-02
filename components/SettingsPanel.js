'use client';
import { useState } from 'react';
import { deleteReport, deleteAllReports } from '../lib/firebase';

export default function SettingsPanel({ open, onClose, reports }) {
  const [deleting, setDeleting]       = useState(null); // report id being deleted
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmAll, setConfirmAll]   = useState(false);

  if (!open) return null;

  async function handleDelete(id) {
    setDeleting(id);
    try { await deleteReport(id); } catch (e) { console.error(e); }
    setDeleting(null);
  }

  async function handleClearAll() {
    if (!confirmAll) { setConfirmAll(true); return; }
    setClearingAll(true);
    setConfirmAll(false);
    try { await deleteAllReports(); } catch (e) { console.error(e); }
    setClearingAll(false);
  }

  const fmt = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      id="settings-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setConfirmAll(false); } }}
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
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>⚙️ Settings</span>
          <button onClick={() => { onClose(); setConfirmAll(false); }} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#888', width: 30, height: 30, borderRadius: '50%',
            cursor: 'pointer', fontSize: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Danger zone */}
        <div style={{
          background: 'rgba(255,82,82,0.06)', border: '1px solid rgba(255,82,82,0.2)',
          borderRadius: '14px', padding: '14px 16px', display: 'flex',
          flexDirection: 'column', gap: '10px',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff5252', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            🗑️ Danger Zone
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, margin: '0 0 2px' }}>Delete All Reports</p>
              <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>Permanently removes all {reports.length} reports from the map.</p>
            </div>
            <button
              id="btn-delete-all"
              disabled={clearingAll}
              onClick={handleClearAll}
              style={{
                background: confirmAll ? '#ff1744' : 'rgba(255,82,82,0.15)',
                border: '1px solid rgba(255,82,82,0.4)',
                borderRadius: '10px', color: confirmAll ? '#fff' : '#ff5252',
                padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem',
                fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {clearingAll ? 'Deleting…' : confirmAll ? 'Confirm Delete All' : 'Delete All'}
            </button>
          </div>
          {confirmAll && (
            <p style={{ fontSize: '0.72rem', color: '#ff5252', margin: 0 }}>
              ⚠️ Click "Confirm Delete All" again to permanently delete all reports. This cannot be undone.
            </p>
          )}
        </div>

        {/* Reports list */}
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Reports ({reports.length})
          </p>
          {reports.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: '#555', textAlign: 'center', padding: '20px 0' }}>No reports yet.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reports.map((r) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '10px 14px',
              }}>
                {/* Status dot */}
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: r.status === 'ACCESSIBLE' ? '#00e676' : '#ff5252',
                  boxShadow: r.status === 'ACCESSIBLE' ? '0 0 6px #00e676' : '0 0 6px #ff5252',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.category || r.status} — {r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: '#666', margin: 0 }}>
                    {r.severity && `${r.severity} · `}{fmt(r.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  style={{
                    background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.3)',
                    borderRadius: '8px', color: '#ff5252', padding: '5px 10px',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {deleting === r.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
