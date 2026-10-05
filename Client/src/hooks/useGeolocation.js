// Wraps the browser's Geolocation API for the 'near me' filter
// (section 3.4: "'Near me' geospatial search using browser geolocation +
// MongoDB 2dsphere $near query").

import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lng: position.coords.longitude, lat: position.coords.latitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve your location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setError('');
  }, []);

  return { coords, error, loading, requestLocation, clearLocation };
}
