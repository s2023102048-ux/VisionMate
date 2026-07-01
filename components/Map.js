'use client';

import { useEffect, useRef } from 'react';

// Helper: create custom Leaflet pin icon HTML
function createPinIconHtml(status) {
  const colorClass = status === 'ACCESSIBLE' ? 'green' : status === 'HAZARD' ? 'red' : 'pending';
  const emoji      = status === 'ACCESSIBLE' ? '♿' : status === 'HAZARD' ? '⚠' : '📍';
  return `
    <div class="custom-pin">
      <div class="pin-head ${colorClass}">
        <span class="pin-icon">${emoji}</span>
      </div>
    </div>`;
}

// Helper: build popup HTML for a report
function buildPopupHTML(report) {
  const statusClass = report.status === 'ACCESSIBLE' ? 'accessible' : 'hazard';
  const statusLabel = report.status === 'ACCESSIBLE' ? '✅ Accessible' : '⚠️ Hazard';

  const photo = report.photoUrl
    ? `<img src="${report.photoUrl}" alt="Report photo" class="popup-photo" loading="lazy" />`
    : `<div style="height:80px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:2rem;">📷</div>`;

  const ts = report.timestamp?.toDate
    ? report.timestamp.toDate().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';

  const noteHtml = report.note
    ? `<p class="popup-note">"${report.note}"</p>`
    : '';

  return `
    <div class="popup-content">
      ${photo}
      <div class="popup-body">
        <div class="popup-status ${statusClass}">${statusLabel}</div>
        <p class="popup-desc">${report.description}</p>
        ${noteHtml}
        <span class="popup-time">🕐 ${ts}</span>
      </div>
    </div>`;
}

export default function Map({ reports, onMapClick }) {
  const mapRef        = useRef(null);   // Leaflet map instance
  const mapDivRef     = useRef(null);   // DOM div element
  const pinMarkersRef = useRef({});     // docId → Leaflet marker
  const tempPinRef    = useRef(null);   // Temp pin before submit

  // Initialize map once on mount
  useEffect(() => {
    if (mapRef.current) return; // Already initialized

    // Dynamically import Leaflet (browser-only)
    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // If container already has a map (React Strict Mode double-invoke), clean it up first
      if (mapDivRef.current && mapDivRef.current._leaflet_id) {
        mapDivRef.current._leaflet_id = null;
      }

      if (!mapDivRef.current) return;

      const map = L.map(mapDivRef.current, {
        center:      [13.9780, 121.0807], // Tanauan, Batangas
        zoom:        15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        // Show temporary pin
        if (tempPinRef.current) map.removeLayer(tempPinRef.current);
        tempPinRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: createPinIconHtml('pending'),
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -44],
          }),
          zIndexOffset: 1000,
        }).addTo(map);

        onMapClick(lat, lng);
      });

      mapRef.current = map;

      // Try geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
          () => {}
        );
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync Firestore reports → Leaflet markers
  useEffect(() => {
    if (!mapRef.current || !reports) return;

    import('leaflet').then((L) => {
      const map        = mapRef.current;
      const pinMarkers = pinMarkersRef.current;
      const seenIds    = new Set();

      reports.forEach((report) => {
        seenIds.add(report.id);

        // Remove existing marker to re-add with fresh popup
        if (pinMarkers[report.id]) {
          map.removeLayer(pinMarkers[report.id]);
        }

        const marker = L.marker([report.lat, report.lng], {
          icon: L.divIcon({
            className: '',
            html: createPinIconHtml(report.status),
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -44],
          }),
        }).addTo(map);

        marker.bindPopup(buildPopupHTML(report), {
          maxWidth: 280,
          className: 'visionmate-popup',
        });

        pinMarkers[report.id] = marker;
      });

      // Remove deleted pins
      Object.keys(pinMarkers).forEach((id) => {
        if (!seenIds.has(id)) {
          map.removeLayer(pinMarkers[id]);
          delete pinMarkers[id];
        }
      });
    });
  }, [reports]);

  // Expose method to remove temp pin (called after submit)
  Map.removeTempPin = () => {
    if (tempPinRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempPinRef.current);
      tempPinRef.current = null;
    }
  };

  return <div id="map" ref={mapDivRef}></div>;
}
