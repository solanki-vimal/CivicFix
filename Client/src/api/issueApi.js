// Matches Server/controllers/issueController.js and commentController.js.

import axiosClient from './axiosClient';

// filters: { category, status, department, lng, lat, radius, page, limit }
// Any key with an undefined/empty value is dropped before the request goes
// out, so callers can pass a full filter object without manually pruning it.
export const getIssues = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const { data } = await axiosClient.get('/issues', { params });
  return data; // { success, data: [...issues], pagination }
};

export const getIssueById = async (id) => {
  const { data } = await axiosClient.get(`/issues/${id}`);
  return data; // { success, data: { ...issue, statusHistory } }
};

export const toggleUpvote = async (id) => {
  const { data } = await axiosClient.patch(`/issues/${id}/upvote`);
  return data; // { success, data: { upvoteCount } }
};

export const getComments = async (issueId, { page, limit } = {}) => {
  const { data } = await axiosClient.get(`/issues/${issueId}/comments`, { params: { page, limit } });
  return data; // { success, data: [...comments], pagination }
};

export const addComment = async (issueId, text) => {
  const { data } = await axiosClient.post(`/issues/${issueId}/comments`, { text });
  return data; // { success, data: comment }
};

// Builds the multipart/form-data body POST /api/issues expects: flat text
// fields (lng/lat are separate, not a nested object) plus up to 3 files all
// under the field name "images" (Server/middleware/upload.js).
//
// The explicit Content-Type matters: axiosClient defaults to
// application/json, and axios 1.x converts a FormData body into JSON when it
// sees a JSON content type — silently dropping the files. Naming
// multipart/form-data here stops that, and the browser still fills in the
// boundary itself.
export const createIssue = async ({ title, description, category, location, address, images = [] }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('lng', String(location.lng));
  formData.append('lat', String(location.lat));
  if (address) formData.append('address', address);
  images.forEach((file) => formData.append('images', file));

  const { data } = await axiosClient.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { success, data: issue }
};
