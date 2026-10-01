// Thin wrappers around the auth endpoints built in Phase 2. Every call
// returns response.data directly (the { success, data, message } shape
// the backend already sends) rather than the raw axios response.

import axiosClient from './axiosClient';

export const signup = async ({ name, email, password }) => {
  const { data } = await axiosClient.post('/auth/signup', { name, email, password });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data;
};

export const logout = async () => {
  const { data } = await axiosClient.post('/auth/logout');
  return data;
};

export const getMe = async () => {
  const { data } = await axiosClient.get('/auth/me');
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await axiosClient.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await axiosClient.post(`/auth/reset-password/${token}`, { password });
  return data;
};

// Google OAuth is a real browser redirect, not an XHR call — the backend
// (GET /api/auth/google) sends the user through Google's consent screen
// and redirects back with the cookie already set. There's nothing to
// await here; this just navigates the whole page away.
export const redirectToGoogleLogin = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  window.location.href = `${apiBase}/auth/google`;
};
