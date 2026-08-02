import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const machineService = {
  getMachines: (page = 1, perPage = 10) => {
    return axiosClient.get(API_ENDPOINTS.MACHINES, {
      params: { page, per_page: perPage }
    });
  },

  getMachine: (id) => {
    return axiosClient.get(`${API_ENDPOINTS.MACHINES}/${id}`);
  },

  createMachine: (data) => {
    return axiosClient.post(API_ENDPOINTS.MACHINES, data);
  },

  updateMachine: (id, data) => {
    return axiosClient.put(`${API_ENDPOINTS.MACHINES}/${id}`, data);
  },

  deleteMachine: (id) => {
    return axiosClient.delete(`${API_ENDPOINTS.MACHINES}/${id}`);
  }
};
