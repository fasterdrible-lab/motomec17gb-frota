import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { getUsuarios, createUsuario, updateUsuario } from '../services/api';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import { formatDatetime } from '../utils/formatters';
import { PERFIS_USUARIO } from '../services/constants';
import api from '../services/api';

const EMPTY_USER = { nome: '', email: '', perfil: 'operador', senha: '', ativo: true };

export default function Configuracoes() {
  const { data, loading, error, refetch } = useApi(getUsuarios);
  const usuarios = Array.isArray(data) ? data : data?.items || [];

  const [tab, setTab]             = useState('usuarios');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_USER);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [syncStatus, setSyncStatus]       = useState('');
  const [telegramStatus, setTelegramStatus] = useState('');

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_USER);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ ...EMPTY_USER, ...u, senha: '' });
    setFormError('');
    setModalOpen(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.email) {
      setFormError('Nome e e-mail são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.senha) delete payload.senha;
        await updateUsuario(editing.id, payload);
      } else {
        if (!form.senha) { setFormError('Senha é obrigatória para novos usuários.'); setSaving(false); return; }
        await createUsuario(form);
      }
      await refetch();
      setModalOpen(false);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncSheets() {
    setSyncStatus('Sincronizando...');
    try {
      await api.post('/relatorios/sync-sheets');
      setSyncStatus('✅ Sincronização concluída!');
    } catch {
      setSyncStatus('❌ Erro ao sincronizar. Verifique as configurações.');
    }
  }

  async function handleTestTelegram() {
    setTelegramStatus('Enviando mensagem de teste...');
    try {
      await api.post('/alertas/test-telegram');
      setTelegramStatus('✅ Mensagem enviada com sucesso!');
    } catch {
      setTelegramStatus('❌ Erro ao enviar. Verifique o token e chat ID.');
    }
  }

  if (loading) return <Loading text="Carregando configurações..." />;
  if (error)   return <p className="text-muted">Erro: {error}</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerenciamento de usuários e sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', borderBottom: '2px solid var(--color-border)' }}>
        {[
          { key: 'usuarios', label: '👥 Usuários' },
          { key: 'sistema',  label: '⚙️ Sistema'  },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: 'var(--spacing-2) var(--spacing-4)',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              background: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'usuarios' && (
        <>
          <div className="page-header" style={{ marginBottom: 'var(--spacing-4)' }}>
            <h2>Usuários do Sistema</h2>
            <button className="btn btn-primary" onClick={openCreate} type="button">
              + Novo Usuário
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último Acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-info">
                          {PERFIS_USUARIO.find((p) => p.value === u.perfil)?.label || u.perfil}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.ativo ? 'badge-success' : 'badge-secondary'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-small text-muted">{formatDatetime(u.ultimo_acesso) || '—'}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} type="button">
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* System tab */}
      {tab === 'sistema' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="card">
            <div className="card-header"><h3>Google Sheets</h3></div>
            <p className="text-muted text-small" style={{ marginBottom: 'var(--spacing-4)' }}>
              Sincronize os dados da frota com a planilha do Google Sheets configurada.
            </p>
            <button className="btn btn-primary" onClick={handleSyncSheets} type="button">
              📊 Sincronizar com Google Sheets
            </button>
            {syncStatus && (
              <p style={{ marginTop: 'var(--spacing-3)', fontSize: '0.875rem' }}>{syncStatus}</p>
            )}
          </div>

          <div className="card">
            <div className="card-header"><h3>Notificações Telegram</h3></div>
            <p className="text-muted text-small" style={{ marginBottom: 'var(--spacing-4)' }}>
              Teste a integração com o bot do Telegram para notificações de alertas.
            </p>
            <button className="btn btn-secondary" onClick={handleTestTelegram} type="button">
              📨 Enviar Mensagem de Teste
            </button>
            {telegramStatus && (
              <p style={{ marginTop: 'var(--spacing-3)', fontSize: '0.875rem' }}>{telegramStatus}</p>
            )}
          </div>

          <div className="card">
            <div className="card-header"><h3>Informações do Sistema</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Sistema: </span><strong>Sistema de Gestão de Frota</strong></div>
              <div><span className="text-muted">Versão: </span><strong>1.0.0</strong></div>
              <div><span className="text-muted">Unidade: </span><strong>17º GB — Grupamento de Bombeiros</strong></div>
              <div><span className="text-muted">Viaturas: </span><strong>57 veículos</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar Usuário — ${editing.nome}` : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
              ⚠️ {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nome completo *</label>
              <input name="nome" className="form-control" value={form.nome} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">E-mail *</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Perfil</label>
              <select name="perfil" className="form-control" value={form.perfil} onChange={handleChange}>
                {PERFIS_USUARIO.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Senha {editing ? '(deixe em branco para manter)' : '*'}</label>
              <input name="senha" type="password" className="form-control" value={form.senha} onChange={handleChange} autoComplete="new-password" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <input type="checkbox" id="ativo" name="ativo" checked={form.ativo} onChange={handleChange} />
              <label htmlFor="ativo" className="form-label" style={{ margin: 0 }}>Usuário ativo</label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-5)' }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
