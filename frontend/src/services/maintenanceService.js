import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const maintenanceService = {
  getMaintenanceLogs: (params = {}) => {
    const queryParams = {
      machine_id: params.machineId,
      user_id: params.userId,
      status: params.status
    };
    return axiosClient.get(API_ENDPOINTS.MAINTENANCE, { params: queryParams });
  },

  scheduleMaintenance: (data) => {
    const payload = {
      machine_id: data.machineId,
      user_id: data.userId,
      action_taken: data.actionTaken,
      schedule_date: data.scheduleDate
    };
    return axiosClient.post(API_ENDPOINTS.MAINTENANCE, payload);
  },

  updateMaintenanceLog: (id, data) => {
    // Matches schema keys for updates: partial logs status / action_taken
    return axiosClient.put(`${API_ENDPOINTS.MAINTENANCE}/${id}`, data);
  }
};
