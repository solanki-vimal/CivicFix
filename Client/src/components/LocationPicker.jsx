// Click the map to drop a pin, drag it to adjust, or use the browser's
// geolocation to jump to the user's current position. `value` is { lng, lat } | undefined — GeoJSON order, same as
// the backend. Leaflet itself uses [lat, lng], so that swap happens here.

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../hooks/useGeolocation';
import './LocationPicker.css';

const NADIAD_CENTER = [22.6939, 72.8311];

// Custom divIcon instead of Leaflet's default marker image, which breaks
// under bundlers (same reason IssueMap does this).
const pinIcon = L.divIcon({
  className: 'pin-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickToPin({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lng: event.latlng.lng, lat: event.latlng.lat });
    },
  });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16));
  }, [target, map]);
  return null;
}

export default function LocationPicker({ value, onChange, error }) {
  const { coords, error: geoError, loading, requestLocation } = useGeolocation();
  const [flyTarget, setFlyTarget] = useState(null);

  // Keep the latest onChange without making it an effect dependency, so a
  // parent re-render can't re-trigger the geolocation effect below.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (coords) {
      onChangeRef.current(coords);
      setFlyTarget(coords); // only geolocation moves the map; a plain click shouldn't re-center it
    }
  }, [coords]);

  return (
    <div className="location-picker" role="group" aria-label="Issue location">
      <MapContainer
        center={value ? [value.lat, value.lng] : NADIAD_CENTER}
        zoom={14}
        className="location-picker-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPin onPick={onChange} />
        <FlyTo target={flyTarget} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const { lat, lng } = event.target.getLatLng();
                onChange({ lng, lat });
              },
            }}
          />
        )}
      </MapContainer>

      <div className="location-picker-actions">
        <button type="button" className="btn-secondary" onClick={requestLocation} disabled={loading}>
          {loading ? 'Locating…' : 'Use my location'}
        </button>
        <span className="location-picker-readout">
          {value
            ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Click the map to drop a pin. You can drag it to adjust.'}
        </span>
      </div>
      {geoError && <div className="field-error">{geoError}</div>}
      {error && <div className="field-error">{error.message}</div>}
    </div>
  );
}
