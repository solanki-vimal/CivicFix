// Matches Server/controllers/analyticsController.js. A dept admin is always
// pinned to their own department by the server, so they pass nothing; a super
// admin may pass a department id to narrow the view, or nothing for the whole city.

import axiosClient from './axiosClient';

export const getSummary = async (departmentId) => {
  const { data } = await axiosClient.get('/analytics/summary', { params: { department: departmentId } });
  return data; // { success, data: { scope, totals, byCategory, byStatus, weeklyTrend, ... } }
};

export const getLocations = async (departmentId) => {
  const { data } = await axiosClient.get('/analytics/locations', { params: { department: departmentId } });
  return data; // { success, data: [{ lng, lat, status }] }
};
