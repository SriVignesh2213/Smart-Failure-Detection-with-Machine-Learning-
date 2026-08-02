import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const predictionService = {
  triggerPrediction: (machineId, sensorData = null) => {
    const payload = { machine_id: machineId };
    if (sensorData) {
      payload.sensor_data = sensorData;
    }
    return axiosClient.post(API_ENDPOINTS.PREDICT, payload);
  },

  getPredictions: (params = {}) => {
    const queryParams = {
      machine_id: params.machineId,
      status: params.status,
      page: params.page || 1,
      per_page: params.perPage || 10
    };
    return axiosClient.get(API_ENDPOINTS.PREDICTIONS, { params: queryParams });
  },

  updatePredictionStatus: (id, status) => {
    return axiosClient.put(`${API_ENDPOINTS.PREDICTIONS}/${id}`, { status });
  }
};
