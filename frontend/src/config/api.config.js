export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Users
  USERS: '/users',
  PROFILE: '/users/profile',

  // Machines
  MACHINES: '/machines',

  // Sensor Data
  SENSOR_DATA: '/sensor-data',

  // Predictions
  PREDICT: '/predict',
  PREDICTIONS: '/predictions',

  // Blackbox
  BLACKBOX: '/blackbox',

  // Maintenance
  MAINTENANCE: '/maintenance',

  // Dashboard
  DASHBOARD_SUMMARY: '/dashboard/summary',

  // Reports
  REPORT_MAINTENANCE: '/reports/maintenance',
  REPORT_FAILURES: '/reports/failures'
};
