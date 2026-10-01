// withCredentials: true is the critical setting here — the backend's JWT
// lives in an httpOnly cookie (see Server/utils/generateToken.js), so the
// browser needs to be told to actually send that cookie on every request.
// Without this, every protected route would 401 even with a valid session.

import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosClient;
