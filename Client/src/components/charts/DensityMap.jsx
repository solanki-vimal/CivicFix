// A density map built from many faint, overlapping circles: where reports
// cluster the colour builds up, with no extra library. The server caps the
// number of points, so this stays light.

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const NADIAD_CENTER = [22.6939, 72.8311];

function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [30, 30], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
}

export default function DensityMap({ points }) {
  return (
    <div>
      <MapContainer center={NADIAD_CENTER} zoom={13} className="density-map" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPoints points={points} />
        {points.map((point, index) => (
          <CircleMarker
            key={index}
            center={[point.lat, point.lng]}
            radius={14}
            pathOptions={{ stroke: false, fillColor: '#b23a2e', fillOpacity: 0.18 }}
            interactive={false}
          />
        ))}
      </MapContainer>
      <p className="chart-note">
        {points.length === 0
          ? 'No issue locations yet.'
          : `${points.length} ${points.length === 1 ? 'issue' : 'issues'} shown. Darker areas have more reports close together.`}
      </p>
    </div>
  );
}
