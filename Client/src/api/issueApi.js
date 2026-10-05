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
