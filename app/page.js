'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

import Header          from '../components/Header';
import ReportModal     from '../components/ReportModal';
import LoadingOverlay  from '../components/LoadingOverlay';
import Toast           from '../components/Toast';
import SearchBar       from '../components/SearchBar';
import NavPanel        from '../components/NavPanel';
import EmergencyButton from '../components/EmergencyButton';
import OnboardingModal from '../components/OnboardingModal';
import AiStatusBar     from '../components/AiStatusBar';

import { saveReport, listenToReports, uploadPhoto } from '../lib/firebase';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Distance (degrees) from point to route segment
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Check if a lat/lng is within ~maxMeters of any route segment
function isNearRoute(lat, lng, routeCoords, maxMeters) {
  const maxDeg = maxMeters / 111000;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [ax, ay] = routeCoords[i];     // [lng, lat]
    const [bx, by] = routeCoords[i + 1];
    if (distToSeg(lng, lat, ax, ay, bx, by) < maxDeg) return true;
  }
  return false;
}

export default function HomePage() {
  // ── Report state ─────────────────────────────────────────
  const [reports,        setReports]        = useState([]);
  const [selectedLat,    setSelectedLat]    = useState(null);
  const [selectedLng,    setSelectedLng]    = useState(null);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [photoPreview,   setPhotoPreview]   = useState('');
  const [category,      setCategory]      = useState('');
  const [otherText,     setOtherText]     = useState('');
  const [isSelectingMode, setIsSelectingMode] = useState(false);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [hintVisible,    setHintVisible]    = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingText,    setLoadingText]    = useState('');
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiResult, setAiResult] = useState(null);

  // ── Navigation state ──────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [destination,  setDestination]  = useState(null);
  const [routeMode,    setRouteMode]    = useState('walk');
  const [routeData,    setRouteData]    = useState(null);
  const [routeCoords,  setRouteCoords]  = useState(null);
  const [routeHazards, setRouteHazards] = useState([]);
  const [navVisible,   setNavVisible]   = useState(false);

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  const countAccessible = reports.filter(r => r.status === 'ACCESSIBLE').length;
  const countHazard     = reports.filter(r => r.status === 'HAZARD').length;

  // ── Firebase listener ─────────────────────────────────────
  useEffect(() => {
    let unsub;
    try {
      unsub = listenToReports((data) => setReports(data));
    } catch (err) {
      console.warn('Firebase not configured:', err);
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const showToast = useCallback((message, duration = 3500) => {
    setToast({ visible: true, message });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      duration
    );
  }, []);

  // ── Route calculation ──────────────────────────────────────
  const calculateRoute = useCallback(async (dest, loc) => {
    const origin = loc || userLocation;
    if (!origin || !dest) return;

    try {
      const url =
        `https://router.project-osrm.org/route/v1/foot/` +
        `${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
        `?overview=full&geometries=geojson&steps=true`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes.length) {
        showToast('❌ Could not calculate route.');
        return;
      }

      const route = data.routes[0];
      const steps = route.legs?.[0]?.steps || [];
      const coords = route.geometry.coordinates; // [[lng, lat], ...]

      setRouteCoords(coords);
      setRouteData({
        distance: route.distance,
        duration: route.duration,
        steps,
      });

      // Find hazard reports near the route (within 80m)
      const nearby = reports.filter(r =>
        r.status === 'HAZARD' && isNearRoute(r.lat, r.lng, coords, 80)
      );
      setRouteHazards(nearby);
    } catch (err) {
      showToast('⚠️ Route unavailable. Check your connection.');
      console.error('Route error:', err);
    }
  }, [userLocation, reports, showToast]);

  // Re-calculate route when mode changes
  useEffect(() => {
    if (destination && userLocation) calculateRoute(destination, userLocation);
  }, [routeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation handlers ───────────────────────────────────
  const handleSelectLocation = useCallback((loc) => {
    setDestination(loc);
    setNavVisible(true);
    setRouteData(null);
    setRouteCoords(null);
    calculateRoute(loc, userLocation);
  }, [userLocation, calculateRoute]);

  const handleClearSearch = useCallback(() => {
    setDestination(null);
    setNavVisible(false);
    setRouteData(null);
    setRouteCoords(null);
    setRouteHazards([]);
  }, []);

  const handleCloseNav = useCallback(() => {
    handleClearSearch();
  }, [handleClearSearch]);

  // ── Map click ─────────────────────────────────────────────
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

  const resetModal = useCallback(() => {
    setSelectedFile(null);
    setPhotoPreview('');
    setCategory('');
    setOtherText('');
    setAiStatus('idle');
    setAiResult(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    resetModal();
    setSelectedLat(null);
    setSelectedLng(null);
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
  }, [resetModal]);

  const handleReselect = useCallback(() => {
    setModalVisible(false);
    setIsSelectingMode(true);
    setHintVisible(true);
    setSelectedLat(null);
    setSelectedLng(null);
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
  }, []);

  const handlePhotoChange = useCallback((file) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setAiStatus('idle');
    setAiResult(null);
  }, []);

  const resetAndCleanup = useCallback(() => {
    if (typeof Map.removeTempPin === 'function') Map.removeTempPin();
    setSelectedLat(null);
    setSelectedLng(null);
    setModalVisible(false);
    resetModal();
  }, [resetModal]);

  const handleSubmit = useCallback(async () => {
    if (!selectedLat || !selectedFile) return;
    setModalVisible(false);

    try {
      setLoadingText('Preparing image for AI inspection...');
      setLoadingVisible(true);
      const { base64, mimeType } = await fileToBase64(selectedFile);

      setLoadingText('Gemini AI is inspecting the photo...');
      setAiStatus('loading');
      // Build context hint from category
      const categoryHint = category === 'Others' ? otherText : category;
      let geminiResult;
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mimeType, base64, categoryHint })
        });

        if (!res.ok) throw new Error(`Server API error: ${res.status}`);
        
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        let parsed = JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());

        const rating = parseFloat(parsed.rating) || 1.0;
        let severity = 'Dangerous';
        let status = 'HAZARD';
        if (rating >= 4.5) { severity = 'Safe'; status = 'ACCESSIBLE'; }
        else if (rating >= 3.5) { severity = 'Minor'; status = 'ACCESSIBLE'; }
        else if (rating >= 2.5) severity = 'Moderate';

        geminiResult = {
          status,
          severity,
          rating,
          comment: parsed.comment || '',
          positive_features: parsed.positive_features || [],
          warnings: parsed.warnings || [],
          description: parsed.comment || `AI Accessibility Rating: ${rating}/5.0`
        };
      } catch (geminiErr) {
        console.error('Gemini error:', geminiErr);
        geminiResult = { status: 'HAZARD', severity: 'Moderate', rating: 2.5, positive_features: [], warnings: ['AI inspection temporarily unavailable — report saved with manual review pending.'], description: 'AI inspection unavailable', fallback: true };
      }
      setAiStatus('done');
      setAiResult(geminiResult);

      setLoadingText('Uploading photo...');
      let photoUrl = '';
      try {
        photoUrl = await uploadPhoto(selectedFile, (pct) => setLoadingText(`Uploading photo... ${pct}%`));
      } catch (uploadErr) {
        console.error('Upload error:', uploadErr);
        showToast('⚠️ Photo upload failed — report saved without photo.');
      }

      setLoadingText('Saving report...');
      try {
        await saveReport({
          lat:         selectedLat,
          lng:         selectedLng,
          photoUrl,
          status:      geminiResult.status,
          severity:    geminiResult.severity || 'Dangerous',
          rating:      geminiResult.rating   || null,
          description: geminiResult.description,
          category:    category === 'Others' ? (otherText || 'Others') : (category || ''),
        });
      } catch (firestoreErr) {
        console.error('Firestore error:', firestoreErr);
        showToast('⚠️ Database unreachable. Check Firebase config.');
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
  }, [selectedLat, selectedLng, selectedFile, category, otherText, showToast, resetAndCleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFabClick = () => {
    setModalVisible(true);
    if (!selectedLat) setHintVisible(true);
  };

  return (
    <>
      {/* First-time onboarding */}
      <OnboardingModal />

      <Header countAccessible={countAccessible} countHazard={countHazard} />

      <SearchBar onSelectLocation={handleSelectLocation} onClear={handleClearSearch} />

      <Map
        reports={reports}
        onMapClick={handleMapClick}
        destination={destination}
        routeCoords={routeCoords}
        onLocationFound={setUserLocation}
      />

      {/* AI Status Bar */}
      <AiStatusBar />

      {/* SOS Emergency Button */}
      <EmergencyButton userLocation={userLocation} />

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

      {/* Navigation Panel */}
      {navVisible && (
        <NavPanel
          destination={destination}
          routeData={routeData}
          routeMode={routeMode}
          hazards={routeHazards}
          onModeChange={(mode) => { setRouteMode(mode); }}
          onClose={handleCloseNav}
        />
      )}

      <ReportModal
        visible={modalVisible}
        selectedLat={selectedLat}
        selectedLng={selectedLng}
        selectedFile={selectedFile}
        photoPreviewSrc={photoPreview}
        category={category}
        otherText={otherText}
        aiStatus={aiStatus}
        aiResult={aiResult}
        onClose={handleCloseModal}
        onReselect={handleReselect}
        onPhotoChange={handlePhotoChange}
        onCategoryChange={setCategory}
        onOtherTextChange={setOtherText}
        onSubmit={handleSubmit}
      />

      <LoadingOverlay visible={loadingVisible} text={loadingText} />
      <Toast visible={toast.visible} message={toast.message} />
    </>
  );
}
