'use client';

import { useEffect, useRef } from 'react';

function getSeverityClass(report) {
  if (report.severity === 'Safe')      return 'safe';
  if (report.severity === 'Minor')     return 'minor';
  if (report.severity === 'Moderate')  return 'moderate';
  if (report.severity === 'Dangerous') return 'dangerous';
  // Fallback for old reports without severity
  return report.status === 'ACCESSIBLE' ? 'safe' : 'dangerous';
}

function createPinIconHtml(report) {
  const cls   = typeof report === 'string' ? report : getSeverityClass(report);
  const emoji = cls === 'safe' ? '♿' : cls === 'minor' ? '⚠' : cls === 'moderate' ? '⚠' : cls === 'dangerous' ? '🚫' : '📍';
  return `
    <div class="custom-pin">
      <div class="pin-head ${cls}">
        <span class="pin-icon">${emoji}</span>
      </div>
    </div>`;
}

function buildPopupHTML(report) {
  const cls   = getSeverityClass(report);
  const severityLabel = report.severity || (report.status === 'ACCESSIBLE' ? 'Safe' : 'Dangerous');
  const severityEmoji = cls === 'safe' ? '🟢' : cls === 'minor' ? '🟡' : cls === 'moderate' ? '🟠' : '🔴';
  const ratingText    = report.rating ? ` — ${Number(report.rating).toFixed(1)}/5.0` : '';

  const photo = report.photoUrl
    ? `<img src="${report.photoUrl}" alt="Report photo" class="popup-photo" loading="lazy" />`
    : `<div style="height:80px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:2rem;">📷</div>`;

  const ts = report.timestamp?.toDate
    ? report.timestamp.toDate().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';

  const noteHtml = report.note
    ? `<p class="popup-note">"${report.note}"</p>`
    : '';

  const deleteBtn = `
    <button class="btn-delete-report" data-id="${report.id}" style="width: 100%; margin-top: 10px; background: rgba(255,82,82,0.15); border: 1px solid rgba(255,82,82,0.3); color: #ff5252; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: background 0.2s;">
      🗑️ Delete Report
    </button>
  `;

  const navBtns = `
    <div style="display: flex; gap: 8px; margin-top: 10px;">
      <button class="btn-nav-walk" data-lat="${report.lat}" data-lng="${report.lng}" style="flex: 1; background: rgba(124,77,255,0.15); border: 1px solid rgba(124,77,255,0.3); color: #7c4dff; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: bold; transition: all 0.2s;">
        🚶 Walk
      </button>
      <button class="btn-nav-wheelchair" data-lat="${report.lat}" data-lng="${report.lng}" style="flex: 1; background: rgba(0,230,118,0.15); border: 1px solid rgba(0,230,118,0.3); color: #00e676; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: bold; transition: all 0.2s;">
        ♿ Wheelchair
      </button>
    </div>
  `;

  return `
    <div class="popup-content">
      ${photo}
      <div class="popup-body">
        <div class="popup-status severity-${cls}">${severityEmoji} ${report.category && report.category !== 'Others' ? report.category : severityLabel}${ratingText}</div>
        <p class="popup-desc">${report.description}</p>
        ${noteHtml}
        <span class="popup-time">🕐 ${ts}</span>
        ${navBtns}
        ${deleteBtn}
      </div>
    </div>`;
}

export default function Map({ reports, onMapClick, destination, routeCoords, onLocationFound, onDeleteReport, onNavigateTo }) {
  const mapRef        = useRef(null);
  const mapDivRef     = useRef(null);
  const pinMarkersRef = useRef({});
  const tempPinRef    = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  // Initialize map once on mount
  useEffect(() => {
    let isMounted = true;
    let localMap = null;

    import('leaflet').then((L) => {
      if (!isMounted) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapDivRef.current && mapDivRef.current._leaflet_id) {
        mapDivRef.current._leaflet_id = null;
      }
      if (!mapDivRef.current) return;

      const map = L.map(mapDivRef.current, {
        center:      [13.9780, 121.0807],
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
          draggable: true,
        }).addTo(map);

        // Visual feedback while dragging
        tempPinRef.current.on('dragstart', () => {
          const el = tempPinRef.current?.getElement();
          if (el) el.style.transition = 'none';
          const pin = tempPinRef.current?.getElement()?.querySelector('.pin-head');
          if (pin) { pin.style.transform = 'scale(1.25) rotate(-45deg)'; pin.style.boxShadow = '0 8px 24px rgba(124,77,255,0.7)'; }
        });

        tempPinRef.current.on('drag', () => {
          map.scrollWheelZoom.disable();
        });

        tempPinRef.current.on('dragend', (ev) => {
          const { lat: newLat, lng: newLng } = ev.target.getLatLng();
          const pin = tempPinRef.current?.getElement()?.querySelector('.pin-head');
          if (pin) { pin.style.transform = ''; pin.style.boxShadow = ''; }
          map.scrollWheelZoom.enable();
          onMapClick(newLat, newLng);
        });

        onMapClick(lat, lng);
      });

      mapRef.current = map;
      localMap = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            map.setView([lat, lng], 16);
            if (onLocationFound) onLocationFound({ lat, lng });

            // Add pulsing blue user location dot
            L.marker([lat, lng], {
              icon: L.divIcon({
                className: '',
                html: `<div class="user-location-dot"><div class="user-location-pulse"></div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
              zIndexOffset: 800,
            }).addTo(map).bindPopup('📍 You are here', { className: 'visionmate-popup' });
          },
          (err) => console.warn('Geolocation error:', err),
          { enableHighAccuracy: true }
        );
      }
    });

    return () => {
      isMounted = false;
      if (localMap) {
        localMap.remove();
      } else if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync reports → markers
  useEffect(() => {
    if (!mapRef.current || !reports) return;
    import('leaflet').then((L) => {
      const map        = mapRef.current;
      const pinMarkers = pinMarkersRef.current;
      const seenIds    = new Set();

      reports.forEach((report) => {
        seenIds.add(report.id);
        if (pinMarkers[report.id]) map.removeLayer(pinMarkers[report.id]);

        const marker = L.marker([report.lat, report.lng], {
          icon: L.divIcon({
            className: '',
            html: createPinIconHtml(report),
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -44],
          }),
        }).addTo(map);

        marker.bindPopup(buildPopupHTML(report), {
          maxWidth: 280,
          className: 'visionmate-popup',
        });

        marker.on('popupopen', (e) => {
          const popupNode = e.popup._contentNode;
          if (!popupNode) return;

          // Delete button
          const btnDel = popupNode.querySelector('.btn-delete-report');
          if (btnDel) {
            btnDel.onclick = () => {
              if (window.confirm('Are you sure you want to delete this report?')) {
                if (onDeleteReport) onDeleteReport(report.id);
                map.closePopup();
              }
            };
          }

          // Navigation buttons
          const btnWalk = popupNode.querySelector('.btn-nav-walk');
          const btnWheel = popupNode.querySelector('.btn-nav-wheelchair');
          
          if (btnWalk) {
            btnWalk.onclick = () => {
              if (onNavigateTo) onNavigateTo(report, 'walk');
              map.closePopup();
            };
          }
          if (btnWheel) {
            btnWheel.onclick = () => {
              if (onNavigateTo) onNavigateTo(report, 'wheelchair');
              map.closePopup();
            };
          }
        });

        pinMarkers[report.id] = marker;
      });

      Object.keys(pinMarkers).forEach((id) => {
        if (!seenIds.has(id)) {
          map.removeLayer(pinMarkers[id]);
          delete pinMarkers[id];
        }
      });
    });
  }, [reports]);

  // Destination marker
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      if (destination) {
        destMarkerRef.current = L.marker([destination.lat, destination.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="dest-pin"><div class="dest-pin-head">🏁</div></div>`,
            iconSize: [36, 44],
            iconAnchor: [18, 44],
          }),
          zIndexOffset: 900,
        })
          .addTo(map)
          .bindPopup(`<b>📍 ${destination.name.split(',')[0]}</b>`, { className: 'visionmate-popup' });

        map.panTo([destination.lat, destination.lng]);
      }
    });
  }, [destination]);

  // Route polyline
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      const map = mapRef.current;
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      if (routeCoords && routeCoords.length > 1) {
        // OSRM returns [lng, lat]; Leaflet needs [lat, lng]
        const latlngs = routeCoords.map(([lng, lat]) => [lat, lng]);
        routeLayerRef.current = L.polyline(latlngs, {
          color:   '#7c4dff',
          weight:  5,
          opacity: 0.85,
          lineCap: 'round',
        }).addTo(map);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
      }
    });
  }, [routeCoords]);

  Map.removeTempPin = () => {
    if (tempPinRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempPinRef.current);
      tempPinRef.current = null;
    }
  };

  return <div id="map" ref={mapDivRef}></div>;
}
