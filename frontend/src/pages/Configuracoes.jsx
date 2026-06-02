import React, { useCallback, useEffect, useState } from 'react';
import { deleteUsuario, getMe, getUsuarios, updateUsuario } from '../services/api';

const integrations = [
  { name: 'Google Sheets', desc: 'Exportacao de dados para planilha', status: 'unknown' },
  { name: 'API FIPE', desc: 'Consulta de valores de veiculos', status: 'unknown' },
  { name: 'Telegram Bot', desc: 'Notificacoes via Telegram', status: 'unknown' },
];

const envVars = [
  { name: 'REACT_APP_API_URL', desc: 'API URL do backend' },
  { name: 'DB_URL', desc: 'URL do banco PostgreSQL' },
  { name: 'SECRET_KEY', desc: 'Chave secreta JWT' },
  { name: 'TELEGRAM_BOT_TOKEN', desc: 'Token do bot Telegram' },
  { name: 'GOOGLE_SHEETS_ID', desc: 'ID da planilha Google' },
  { name: 'FIPE_API_URL', desc: 'URL da API FIPE' },
];

const statusLabels = {
  pendente: 'Aguardando liberacao',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

function getApiError(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function Configuracoes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionId, setActionId] = useState(null);

  const isAdmin = currentUser?.perfil === 'admin';

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadUsuarios = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsuarios();
      setUsuarios(res.data || []);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Erro ao carregar usuarios.'));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getMe();
        setCurrentUser(user);
      } catch (e) {
        setError(getApiError(e, 'Nao foi possivel validar seu usuario.'));
      } finally {
        setLoadingCurrentUser(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsuarios();
    }
  }, [isAdmin, loadUsuarios]);

  const runUserAction = async (userId, action, successMessage) => {
    setActionId(userId);
    setError('');
    try {
      await action();
      showSuccess(successMessage);
      await loadUsuarios();
    } catch (e) {
      setError(getApiError(e, 'Nao foi possivel concluir a acao.'));
    } finally {
      setActionId(null);
    }
  };

  const handleLiberar = (user) => {
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { status: 'ativo' }),
      'Usuario liberado com sucesso.'
    );
  };

  const handlePerfilChange = (user, perfil) => {
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { perfil }),
      'Perfil atualizado com sucesso.'
    );
  };

  const handleInativar = (user) => {
    if (!window.confirm(`Inativar o usuario ${user.nome}?`)) return;
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { status: 'inativo' }),
      'Usuario inativado com sucesso.'
    );
  };

  const handleResetSenha = (user) => {
    const novaSenha = window.prompt(`Nova senha para ${user.nome} (minimo 6 caracteres):`);
    if (novaSenha === null) return;

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    runUserAction(
      user.id,
      () => updateUsuario(user.id, { password: novaSenha }),
      'Senha redefinida com sucesso.'
    );
  };

  const handleExcluir = (user) => {
    if (user.id === currentUser?.id) {
      setError('Administrador nao pode excluir a propria conta.');
      return;
    }

    if (!window.confirm(`Excluir definitivamente o usuario ${user.nome}?`)) return;
    runUserAction(
      user.id,
      () => deleteUsuario(user.id),
      'Usuario excluido com sucesso.'
    );
  };

  const renderUserManagement = () => {
    const visibleUsuarios = statusFilter
      ? usuarios.filter(user => user.status === statusFilter)
      : usuarios;

    const statusCounts = usuarios.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});

    if (loadingCurrentUser) {
      return <div className="loading">Validando permissoes...</div>;
    }

    if (!isAdmin) {
      return (
        <div className="empty-state" style={{ textAlign: 'left' }}>
          Gerenciamento de usuarios disponivel apenas para administradores.
        </div>
      );
    }

    return (
      <>
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar usuarios por status"
            >
              <option value="">Todos os status ({usuarios.length})</option>
              <option value="pendente">Aguardando liberacao ({statusCounts.pendente || 0})</option>
              <option value="ativo">Ativos ({statusCounts.ativo || 0})</option>
              <option value="inativo">Inativos ({statusCounts.inativo || 0})</option>
            </select>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Sua conta ativa/admin aparece em Ativos, nao em Aguardando liberacao.
            </span>
          </div>
          <button className="btn-small" type="button" onClick={() => loadUsuarios()}>
            Atualizar
          </button>
        </div>

        {loadingUsers ? (
          <div className="loading">Carregando usuarios...</div>
        ) : visibleUsuarios.length === 0 ? (
          <div className="empty-state">
            {statusFilter === 'pendente'
              ? 'Nenhum usuario aguardando liberacao no momento.'
              : 'Nenhum usuario encontrado para o filtro selecionado.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Data de cadastro</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="form-control"
                        value={user.perfil}
                        onChange={(e) => handlePerfilChange(user, e.target.value)}
                        disabled={actionId === user.id || user.id === currentUser?.id}
                        aria-label={`Alterar perfil de ${user.nome}`}
                        title={user.id === currentUser?.id ? 'Nao e permitido remover o proprio perfil admin' : 'Alterar perfil'}
                      >
                        <option value="admin">Administrador</option>
                        <option value="operador">Operador</option>
                        <option value="visualizador">Visualizador</option>
                      </select>
                    </td>
                    <td>
                      <span className={`user-status-badge user-status-${user.status}`}>
                        {statusLabels[user.status] || user.status}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="user-actions">
                        {user.status === 'pendente' && (
                          <button
                            className="btn-small"
                            type="button"
                            onClick={() => handleLiberar(user)}
                            disabled={actionId === user.id}
                          >
                            Liberar acesso
                          </button>
                        )}
                        {user.status !== 'inativo' && (
                          <button
                            className="btn-small"
                            type="button"
                            onClick={() => handleInativar(user)}
                            disabled={actionId === user.id || user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? 'Nao e permitido inativar a propria conta' : 'Inativar usuario'}
                          >
                            Inativar
                          </button>
                        )}
                        <button
                          className="btn-small"
                          type="button"
                          onClick={() => handleResetSenha(user)}
                          disabled={actionId === user.id}
                          title="Redefinir senha do usuario"
                        >
                          Redefinir senha
                        </button>
                        <button
                          className="btn-small btn-small-danger"
                          type="button"
                          onClick={() => handleExcluir(user)}
                          disabled={actionId === user.id || user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Nao e permitido excluir a propria conta' : 'Excluir usuario'}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <h1 className="page-title">Configuracoes do Sistema</h1>

      {error && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      <div className="card mb-20">
        <div className="section-header">
          <h3 className="section-title">Gerenciamento de Usuarios</h3>
        </div>
        {renderUserManagement()}
      </div>

      <div className="config-grid">
        <div>
          <div className="card mb-20" style={{ marginBottom: 20 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>Integracoes</h3>
            {integrations.map(item => (
              <div className="integration-item" key={item.name}>
                <div className={`integration-status ${item.status}`} />
                <div className="integration-info">
                  <div className="integration-name">{item.name}</div>
                  <div className="integration-desc">{item.desc}</div>
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {item.status === 'online' ? 'Online' : item.status === 'offline' ? 'Offline' : 'Desconhecido'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card mb-20" style={{ marginBottom: 20 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>Variaveis de Ambiente</h3>
            <table className="data-table">
              <thead>
                <tr><th>Variavel</th><th>Descricao</th></tr>
              </thead>
              <tbody>
                {envVars.map(v => (
                  <tr key={v.name}>
                    <td><code style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.name}</code></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{v.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Informacoes do Sistema</h3>
            <table className="data-table">
              <tbody>
                <tr><td><strong>Sistema</strong></td><td>Motomec 17GB - Gestao de Frota</td></tr>
                <tr><td><strong>Versao</strong></td><td>2.0.0</td></tr>
                <tr><td><strong>Backend</strong></td><td>Express + JWT</td></tr>
                <tr><td><strong>Frontend</strong></td><td>React 18</td></tr>
                <tr><td><strong>Desenvolvido para</strong></td><td>17GB CBMESP</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
