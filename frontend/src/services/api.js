import axios from 'axios';
import { publicConfig } from '../config/publicConfig';

const API_URL = publicConfig.apiUrl;

const api = axios.create({
  baseURL: API_URL,
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

// Autenticação
export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function cadastrar(payload) {
  const res = await api.post('/api/usuarios/', payload);
  return res.data;
}

export async function solicitarRecuperacaoSenha(email) {
  const res = await api.post('/api/auth/recuperar-senha', { email });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

// Dashboard
export async function getDashboardMacro() {
  const res = await api.get('/api/dashboard/macro');
  return res.data;
}

export async function getDashboardAbastecimentos() {
  const res = await api.get('/api/dashboard/abastecimentos');
  return res.data;
}

export async function getDashboardTarefas() {
  const res = await api.get('/api/dashboard/tarefas');
  return res.data;
}

export async function getStatusOperacional() {
  const res = await api.get('/api/frota/status-operacional');
  return res.data;
}

export async function getTarefas() {
  const res = await api.get('/api/tarefas/resumo');
  return res.data;
}

export async function getAlertas() {
  const res = await api.get('/api/alertas/resumo');
  return res.data;
}

// Frota
export async function getFrotaCompleta() {
  const res = await api.get('/api/frota/');
  return res.data.map(v => ({
    prefixo: v.prefixo,
    placa: v.placa,
    kmAtual: v.km_atual,
    modelo: v.modelo,
    marca: v.marca,
    ano: v.ano ? String(v.ano) : '',
    status: v.status,
    sgb: v.unidade || '',
  }));
}

// Manutenção
export async function getManutencoes() {
  const res = await api.get('/api/manutencao/');
  return res.data.map(m => ({
    prefixo: m.prefixo || String(m.viatura_id),
    tipo: m.tipo,
    status: m.status,
    detalhe: m.observacoes || '',
  }));
}

// Alertas
export async function getAlertasDetalhados() {
  const res = await api.get('/api/alertas/');
  return res.data.map(a => ({
    id: a.id,
    prefixo: a.prefixo || (a.viatura_id ? String(a.viatura_id) : ''),
    tipo: a.tipo,
    nivel: a.nivel,
    descricao: a.mensagem,
    lido: a.lido,
  }));
}

// Tarefas
export async function getTarefasCompletas() {
  const res = await api.get('/api/tarefas/');
  return res.data.map(t => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao || '',
    responsavel: t.responsavel || '',
    status: t.status,
    prioridade: t.prioridade,
    dataInicio: t.data_inicio ? t.data_inicio.substring(0, 10) : '',
    dataFim: t.data_fim ? t.data_fim.substring(0, 10) : '',
  }));
}

// Relatório
export async function getDadosRelatorio() {
  const res = await api.get('/api/relatorios/dados');
  return res.data;
}

// Usuários
export const getUsuarios = (status) => api.get('/api/usuarios/', { params: status ? { status } : {} });

// --- Funções de baixo nível existentes ---

// Frota
export const getFrota = () => api.get('/api/frota/');
export const getViatura = (id) => api.get(`/api/frota/${id}`);
export const createViatura = (data) => api.post('/api/frota/', data);
export const updateViatura = (id, data) => api.put(`/api/frota/${id}`, data);
export const deleteViatura = (id) => api.delete(`/api/frota/${id}`);

// Manutenção
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

// Alertas (baixo nível)
export const getAlertasCriticos = () => api.get('/api/alertas/criticos');
export const getAlertasNaoLidos = () => api.get('/api/alertas/nao-lidos');
export const marcarAlertaLido = (id) => api.put(`/api/alertas/${id}/marcar-lido`);

// Relatórios (baixo nível)
export const getFrotaStatus = () => api.get('/api/relatorios/frota-status');
export const getRelatorioDiario = () => api.get('/api/relatorios/diario');
export const getRelatorioMensalCompleto = (ano, mes) => api.get(`/api/relatorios/mensal?ano=${ano}&mes=${mes}`);
export const getRelatorioAnual = (ano) => api.get(`/api/relatorios/anual?ano=${ano}`);

// Usuários (baixo nível)
export const updateUsuario = (id, data) => api.put(`/api/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/api/usuarios/${id}`);

export default api;
