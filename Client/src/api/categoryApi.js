import axiosClient from './axiosClient';

export const getCategories = async (departmentId) => {
  const { data } = await axiosClient.get('/categories', {
    params: departmentId ? { department: departmentId } : {},
  });
  return data; // { success, data: [...categories] }
};
