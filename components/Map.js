'use client';

import { useEffect, useRef } from 'react';

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

export default function Map({ reports, onMapClick, destination, routeCoords, onLocationFound }) {
  const mapRef        = useRef(null);
  const mapDivRef     = useRef(null);
  const pinMarkersRef = useRef({});
  const tempPinRef    = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  // Initialize map once on mount
  useEffect(() => {
    if (mapRef.current) return;

    import('leaflet').then((L) => {
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
        }).addTo(map);
        onMapClick(lat, lng);
      });

      mapRef.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            map.setView([lat, lng], 16);
            if (onLocationFound) onLocationFound({ lat, lng });
          },
          () => {}
        );
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
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
