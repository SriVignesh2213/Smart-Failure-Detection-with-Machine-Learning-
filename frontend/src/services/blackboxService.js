import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const blackboxService = {
  getBlackboxSnapshots: (params = {}) => {
    const queryParams = {
      machine_id: params.machineId,
      status: params.status,
      page: params.page || 1,
      per_page: params.perPage || 10
    };
    return axiosClient.get(API_ENDPOINTS.BLACKBOX, { params: queryParams });
  },

  getBlackboxSnapshot: (id) => {
    return axiosClient.get(`${API_ENDPOINTS.BLACKBOX}/${id}`);
  },

  replayFailureEvent: (id) => {
    return axiosClient.get(`${API_ENDPOINTS.BLACKBOX}/${id}/replay`);
  },

  triggerBlackboxGeneration: (data) => {
    const payload = {
      machine_id: data.machineId,
      trigger_event: data.triggerEvent || 'Manual Snapshot Trigger',
      severity: data.severity || 'CRITICAL',
      prediction_id: data.predictionId
    };
    return axiosClient.post(`${API_ENDPOINTS.BLACKBOX}/generate`, payload);
  },

  resolveBlackbox: (id, resolutionNotes) => {
    return axiosClient.put(`${API_ENDPOINTS.BLACKBOX}/${id}/resolve`, {
      resolution_notes: resolutionNotes
    });
  }
};
