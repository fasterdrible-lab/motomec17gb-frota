import axios from 'axios';
import { getToken, logout } from './auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Erro desconhecido';
    return Promise.reject(new Error(message));
  }
);

/* ─── Vehicles ─────────────────────────────────────────────── */
export const getVehicles = (params) =>
  api.get('/api/vehicles', { params }).then((r) => r.data);

export const getVehicle = (id) =>
  api.get(`/api/vehicles/${id}`).then((r) => r.data);

export const createVehicle = (data) =>
  api.post('/api/vehicles', data).then((r) => r.data);

export const updateVehicle = (id, data) =>
  api.put(`/api/vehicles/${id}`, data).then((r) => r.data);

export const deleteVehicle = (id) =>
  api.delete(`/api/vehicles/${id}`).then((r) => r.data);

/* ─── Drivers ───────────────────────────────────────────────── */
export const getDrivers = (params) =>
  api.get('/api/drivers', { params }).then((r) => r.data);

export const getDriver = (id) =>
  api.get(`/api/drivers/${id}`).then((r) => r.data);

export const createDriver = (data) =>
  api.post('/api/drivers', data).then((r) => r.data);

export const updateDriver = (id, data) =>
  api.put(`/api/drivers/${id}`, data).then((r) => r.data);

export const deleteDriver = (id) =>
  api.delete(`/api/drivers/${id}`).then((r) => r.data);

/* ─── Maintenance ───────────────────────────────────────────── */
export const getMaintenance = (params) =>
  api.get('/api/maintenance', { params }).then((r) => r.data);

export const getMaintenanceById = (id) =>
  api.get(`/api/maintenance/${id}`).then((r) => r.data);

export const createMaintenance = (data) =>
  api.post('/api/maintenance', data).then((r) => r.data);

export const updateMaintenance = (id, data) =>
  api.put(`/api/maintenance/${id}`, data).then((r) => r.data);

export const deleteMaintenance = (id) =>
  api.delete(`/api/maintenance/${id}`).then((r) => r.data);

/* ─── Alerts ────────────────────────────────────────────────── */
export const getAlerts = () =>
  api.get('/api/maintenance/alerts').then((r) => r.data);

/* ─── Integrations ──────────────────────────────────────────── */
export const exportToSheets = () =>
  api.post('/api/export/sheets').then((r) => r.data);

export const getFipePrice = (params) =>
  api.get('/api/fipe/price', { params }).then((r) => r.data);

export default api;
