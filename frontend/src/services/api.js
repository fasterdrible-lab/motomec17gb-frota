import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) localStorage.removeItem('token');
    return Promise.reject(err);
  }
);

// Frota
export const getFrota = () => api.get('/api/frota/');
export const getViatura = (id) => api.get(`/api/frota/${id}`);
export const createViatura = (data) => api.post('/api/frota/', data);
export const updateViatura = (id, data) => api.put(`/api/frota/${id}`, data);
export const deleteViatura = (id) => api.delete(`/api/frota/${id}`);

// Manutenção
export const getManutencoes = () => api.get('/api/manutencao/');
export const getManutencoesPendentes = () => api.get('/api/manutencao/pendentes');
export const getManutencoesVencidas = () => api.get('/api/manutencao/vencidas');
export const createManutencao = (data) => api.post('/api/manutencao/', data);
export const updateManutencao = (id, data) => api.put(`/api/manutencao/${id}`, data);

// Abastecimento
export const getAbastecimentos = () => api.get('/api/abastecimento/');
export const createAbastecimento = (data) => api.post('/api/abastecimento/', data);
export const getUltimosAbastecimentos = (viaturaId) => api.get(`/api/abastecimento/${viaturaId}/ultimos`);

// Gastos
export const getGastos = () => api.get('/api/gastos/');
export const getGastosPorViatura = () => api.get('/api/gastos/por-viatura');
export const getRelatorioMensal = (ano, mes) => api.get(`/api/gastos/relatorio-mensal?ano=${ano}&mes=${mes}`);
export const getViaturaMaisCara = () => api.get('/api/gastos/viatura-mais-cara');

// Alertas
export const getAlertas = () => api.get('/api/alertas/');
export const getAlertasCriticos = () => api.get('/api/alertas/criticos');
export const getAlertasNaoLidos = () => api.get('/api/alertas/nao-lidos');
export const marcarAlertaLido = (id) => api.put(`/api/alertas/${id}/marcar-lido`);

// Relatórios
export const getFrotaStatus = () => api.get('/api/relatorios/frota-status');
export const getRelatorioDiario = () => api.get('/api/relatorios/diario');
export const getRelatorioMensalCompleto = (ano, mes) => api.get(`/api/relatorios/mensal?ano=${ano}&mes=${mes}`);
export const getRelatorioAnual = (ano) => api.get(`/api/relatorios/anual?ano=${ano}`);

// Usuários
export const getUsuarios = () => api.get('/api/usuarios/');
export const createUsuario = (data) => api.post('/api/usuarios/', data);
export const updateUsuario = (id, data) => api.put(`/api/usuarios/${id}`, data);

export default api;
