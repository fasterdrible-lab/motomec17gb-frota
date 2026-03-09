import axios from 'axios';
import { getToken, removeToken } from './auth';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ── Frota ──────────────────────────────────── */
export const getFrota = (params) =>
  api.get('/frota', { params }).then((r) => r.data);

export const createViatura = (data) =>
  api.post('/frota', data).then((r) => r.data);

export const updateViatura = (id, data) =>
  api.put(`/frota/${id}`, data).then((r) => r.data);

export const deleteViatura = (id) =>
  api.delete(`/frota/${id}`).then((r) => r.data);

/* ── Manutenção ─────────────────────────────── */
export const getManutencoes = (params) =>
  api.get('/manutencao', { params }).then((r) => r.data);

export const createManutencao = (data) =>
  api.post('/manutencao', data).then((r) => r.data);

export const updateManutencao = (id, data) =>
  api.put(`/manutencao/${id}`, data).then((r) => r.data);

/* ── Abastecimento ──────────────────────────── */
export const getAbastecimentos = (params) =>
  api.get('/abastecimento', { params }).then((r) => r.data);

export const createAbastecimento = (data) =>
  api.post('/abastecimento', data).then((r) => r.data);

/* ── Gastos ─────────────────────────────────── */
export const getGastos = (params) =>
  api.get('/gastos', { params }).then((r) => r.data);

export const createGasto = (data) =>
  api.post('/gastos', data).then((r) => r.data);

/* ── Alertas ────────────────────────────────── */
export const getAlertas = (params) =>
  api.get('/alertas', { params }).then((r) => r.data);

export const markAlertaLido = (id) =>
  api.put(`/alertas/${id}`, { lido: true }).then((r) => r.data);

export const resolveAlerta = (id) =>
  api.put(`/alertas/${id}`, { status: 'resolvido' }).then((r) => r.data);

/* ── Relatórios ─────────────────────────────── */
export const getRelatorioMensal = (mes, ano) =>
  api.get('/relatorios/mensal', { params: { mes, ano } }).then((r) => r.data);

export const getRelatorioAnual = (ano) =>
  api.get('/relatorios/anual', { params: { ano } }).then((r) => r.data);

export const getFrotaStatus = () =>
  api.get('/relatorios/frota-status').then((r) => r.data);

/* ── Usuários ───────────────────────────────── */
export const login = (email, senha) =>
  api.post('/usuarios/login', { email, senha }).then((r) => r.data);

export const getUsuarios = () =>
  api.get('/usuarios').then((r) => r.data);

export const createUsuario = (data) =>
  api.post('/usuarios', data).then((r) => r.data);

export const updateUsuario = (id, data) =>
  api.put(`/usuarios/${id}`, data).then((r) => r.data);

export default api;
