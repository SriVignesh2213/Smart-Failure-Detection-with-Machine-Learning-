import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const sensorService = {
  logSensorData: (data) => {
    return axiosClient.post(API_ENDPOINTS.SENSOR_DATA, data);
  },

  getSensorHistory: (params = {}) => {
    // Map snake_case query params for Flask backend compatibility
    const queryParams = {
      machine_id: params.machineId,
      page: params.page || 1,
      per_page: params.perPage || 20,
      start_date: params.startDate,
      end_date: params.endDate
    };

    return axiosClient.get(API_ENDPOINTS.SENSOR_DATA, { params: queryParams });
  }
};
