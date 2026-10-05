// Uses a custom L.divIcon instead of Leaflet's default marker image. This
// sidesteps the well-known bundler issue where Leaflet's default marker
// icon paths break under Vite/webpack, and lets each marker be colored by
// status directly via CSS, matching section 3.4's "colour-coded markers".

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import StatusBadge from './StatusBadge';
import './IssueMap.css';

const STATUS_HEX = {
  pending: '#8a8f87',
  open: '#2e6f95',
  in_progress: '#d6a419',
  resolved: '#2f7d5d',
  rejected: '#b23a2e',
};

function markerIcon(status) {
  const color = STATUS_HEX[status] || STATUS_HEX.pending;
  return L.divIcon({
    className: 'issue-marker',
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const NADIAD_CENTER = [22.6939, 72.8311]; // [lat, lng] — Leaflet's own convention, opposite of GeoJSON

export default function IssueMap({ issues, center }) {
  const mapCenter = center ? [center.lat, center.lng] : NADIAD_CENTER;

  return (
    <MapContainer center={mapCenter} zoom={13} className="issue-map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {issues
        .filter((issue) => issue.location?.coordinates?.length === 2)
        .map((issue) => {
          const [lng, lat] = issue.location.coordinates; // GeoJSON order: [lng, lat]
          return (
            <Marker key={issue._id} position={[lat, lng]} icon={markerIcon(issue.status)}>
              <Popup>
                <div className="issue-map-popup">
                  <StatusBadge status={issue.status} />
                  <p className="issue-map-popup-title">{issue.title}</p>
                  <Link to={`/issues/${issue._id}`}>View details</Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
