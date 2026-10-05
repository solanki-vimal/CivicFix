import axiosClient from './axiosClient';

export const getDepartments = async () => {
  const { data } = await axiosClient.get('/departments');
  return data; // { success, data: [...departments] }
};
