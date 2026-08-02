import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../config/api.config';

export const dashboardService = {
  getDashboardSummary: () => {
    return axiosClient.get(API_ENDPOINTS.DASHBOARD_SUMMARY);
  }
};
