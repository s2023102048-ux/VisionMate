'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

import Header         from '../components/Header';
import ReportModal    from '../components/ReportModal';
import LoadingOverlay from '../components/LoadingOverlay';
import Toast          from '../components/Toast';

import { saveReport, listenToReports, uploadPhoto } from '../lib/firebase';

// Load map with no SSR (Leaflet is browser-only)
const Map = dynamic(() => import('../components/Map'), { ssr: false });

// ── Utility: convert File → base64 ──────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64  = dataUrl.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function HomePage() {
  // ── State ──────────────────────────────────────────────────
  const [reports,        setReports]        = useState([]);
  const [selectedLat,    setSelectedLat]    = useState(null);
  const [selectedLng,    setSelectedLng]    = useState(null);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [photoPreview,   setPhotoPreview]   = useState('');
  const [note,           setNote]           = useState('');
  const [isSelectingMode, setIsSelectingMode] = useState(false);

  const [modalVisible,   setModalVisible]   = useState(false);
  const [hintVisible,    setHintVisible]    = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingText,    setLoadingText]    = useState('');

  const [aiStatus, setAiStatus] = useState('idle'); // 'idle'|'loading'|'done'
  const [aiResult, setAiResult] = useState(null);

  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  // Stats
  const countAccessible = reports.filter(r => r.status === 'ACCESSIBLE').length;
  const countHazard     = reports.filter(r => r.status === 'HAZARD').length;

  // ── Firebase real-time listener ────────────────────────────
  useEffect(() => {
    let unsub;
    try {
      unsub = listenToReports((data) => setReports(data));
    } catch (err) {
      console.warn('Firebase not configured. Running in demo mode.', err);
      showToast('⚠️ Firebase not configured — running in demo mode');
    }
    return () => { if (unsub) unsub(); };
  }, []);

  // ── Toast helper ───────────────────────────────────────────
  const showToast = useCallback((message, duration = 3500) => {
    setToast({ visible: true, message });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      duration
    );
  }, []);

  // ── Map click handler ──────────────────────────────────────
  const handleMapClick = useCallback((lat, lng) => {
    setSelectedLat(lat);
    setSelectedLng(lng);

    if (isSelectingMode) {
      setIsSelectingMode(false);
      setHintVisible(false);
      setModalVisible(true);
    } else if (!modalVisible) {
      setModalVisible(true);
    }
  }, [isSelectingMode, modalVisible]);

  // ── Reset modal state ──────────────────────────────────────
  const resetModal = useCallback(() => {
    setSelectedFile(null);
    setPhotoPreview('');
    setNote('');
    setAiStatus('idle');
    setAiResult(null);
  }, []);

  // ── Close modal ────────────────────────────────────────────
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    resetModal();
    setSelectedLat(null);
    setSelectedLng(null);
    // Remove temp pin
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
  }, [resetModal]);

  // ── Reselect location ──────────────────────────────────────
  const handleReselect = useCallback(() => {
    setModalVisible(false);
    setIsSelectingMode(true);
    setHintVisible(true);
    setSelectedLat(null);
    setSelectedLng(null);
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
  }, []);

  // ── Photo change ───────────────────────────────────────────
  const handlePhotoChange = useCallback((file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setAiStatus('idle');
    setAiResult(null);
  }, []);

  // ── Submit report ──────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!selectedLat || !selectedFile) return;

    setModalVisible(false);

    try {
      // Step 1: Prepare image for Gemini
      setLoadingText('Preparing image for AI inspection...');
      setLoadingVisible(true);
      const { base64, mimeType } = await fileToBase64(selectedFile);

      // Step 2: Call our secure /api/inspect route (server-side)
      setLoadingText('Gemini AI is inspecting the photo...');
      setAiStatus('loading');
      let geminiResult;
      try {
        const res = await fetch('/api/inspect', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ base64, mimeType }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        geminiResult = await res.json();
      } catch (geminiErr) {
        console.error('Gemini error:', geminiErr);
        geminiResult = {
          status:      'HAZARD',
          description: 'AI inspection unavailable — report saved manually.',
        };
      }
      setAiStatus('done');
      setAiResult(geminiResult);

      // Step 3: Upload photo to Firebase Storage
      setLoadingText('Uploading photo to cloud...');
      let photoUrl = '';
      try {
        photoUrl = await uploadPhoto(selectedFile, (pct) => {
          setLoadingText(`Uploading photo... ${pct}%`);
        });
      } catch (uploadErr) {
        console.error('Upload error:', uploadErr);
        showToast('⚠️ Photo upload failed — report saved without photo.');
      }

      // Step 4: Save to Firestore
      setLoadingText('Saving report...');
      try {
        await saveReport({
          lat:         selectedLat,
          lng:         selectedLng,
          photoUrl:    photoUrl,
          status:      geminiResult.status,
          description: geminiResult.description,
          note:        note.trim(),
        });
      } catch (firestoreErr) {
        console.error('Firestore error:', firestoreErr);
        showToast('⚠️ Saved locally (database unreachable). Check Firebase config.');
        setLoadingVisible(false);
        resetAndCleanup();
        return;
      }

      setLoadingVisible(false);
      const emoji = geminiResult.status === 'ACCESSIBLE' ? '♿✅' : '🚧⚠️';
      showToast(`${emoji} Report pinned — ${geminiResult.status}`);
      resetAndCleanup();

    } catch (err) {
      console.error('Submit error:', err);
      setLoadingVisible(false);
      showToast('❌ Something went wrong. Please try again.');
    }
  }, [selectedLat, selectedLng, selectedFile, note, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAndCleanup = useCallback(() => {
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
    setSelectedLat(null);
    setSelectedLng(null);
    setModalVisible(false);
    resetModal();
  }, [resetModal]);

  // ── Open modal from FAB ─────────────────────────────────────
  const handleFabClick = () => {
    setModalVisible(true);
    if (!selectedLat) setHintVisible(true);
  };

  return (
    <>
      <Header countAccessible={countAccessible} countHazard={countHazard} />

      <Map reports={reports} onMapClick={handleMapClick} />

      {/* FAB Report Button */}
      <button className="fab" id="btn-report" title="Report an accessibility issue" onClick={handleFabClick}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>Report</span>
      </button>

      {/* Location Hint */}
      {hintVisible && (
        <div className="location-hint" id="location-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          Click anywhere on the map to set report location
          <button className="hint-close" id="hint-close" onClick={() => setHintVisible(false)}>✕</button>
        </div>
      )}

      <ReportModal
        visible={modalVisible}
        selectedLat={selectedLat}
        selectedLng={selectedLng}
        selectedFile={selectedFile}
        photoPreviewSrc={photoPreview}
        note={note}
        aiStatus={aiStatus}
        aiResult={aiResult}
        onClose={handleCloseModal}
        onReselect={handleReselect}
        onPhotoChange={handlePhotoChange}
        onNoteChange={setNote}
        onSubmit={handleSubmit}
      />

      <LoadingOverlay visible={loadingVisible} text={loadingText} />

      <Toast visible={toast.visible} message={toast.message} />
    </>
  );
}
