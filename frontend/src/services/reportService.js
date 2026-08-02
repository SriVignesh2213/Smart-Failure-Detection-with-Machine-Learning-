import axiosClient from '../api/axiosClient';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

export const reportService = {
  getMaintenanceReportData: () => {
    return axiosClient.get(API_ENDPOINTS.REPORT_MAINTENANCE, {
      params: { format: 'json' }
    });
  },

  getFailuresReportData: () => {
    return axiosClient.get(API_ENDPOINTS.REPORT_FAILURES, {
      params: { format: 'json' }
    });
  },

  downloadMaintenanceReportCSV: async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REPORT_MAINTENANCE}?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `maintenance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error('Error downloading CSV:', err);
      return { success: false, message: err.message };
    }
  },

  downloadFailuresReportCSV: async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REPORT_FAILURES}?format=csv`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `failures_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error('Error downloading CSV:', err);
      return { success: false, message: err.message };
    }
  }
};
