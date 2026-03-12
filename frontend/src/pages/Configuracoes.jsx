import React, { useState, useEffect } from 'react';
import { getUsuarios, createUsuario } from '../services/api';

const emptyUserForm = {
  nome: '',
  email: '',
  password: '',
  cargo: '',
  role: 'operador',
};

const integrations = [
  { name: 'Google Sheets', desc: 'Exportação de dados para planilha', status: 'unknown' },
  { name: 'API FIPE', desc: 'Consulta de valores de veículos', status: 'unknown' },
  { name: 'Telegram Bot', desc: 'Notificações via Telegram', status: 'unknown' },
];

const envVars = [
  { name: 'REACT_APP_API_URL', desc: 'API URL do backend' },
  { name: 'DB_URL', desc: 'URL do banco PostgreSQL' },
  { name: 'SECRET_KEY', desc: 'Chave secreta JWT' },
  { name: 'TELEGRAM_BOT_TOKEN', desc: 'Token do bot Telegram' },
  { name: 'GOOGLE_SHEETS_ID', desc: 'ID da planilha Google' },
  { name: 'FIPE_API_URL', desc: 'URL da API FIPE' },
];

function Configuracoes() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsuarios = async () => {
    try {
      const res = await getUsuarios();
      setUsuarios(res.data || []);
      setError('');
    } catch (e) {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createUsuario(userForm);
      setUserForm(emptyUserForm);
      setShowUserForm(false);
      setSuccessMsg('Usuário criado com sucesso!');
      await loadUsuarios();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setError('Erro ao criar usuário. Verifique os dados.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Configurações do Sistema</h1>

      {error && <div className="error-msg">{error}</div>}
      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
          {successMsg}
        </div>
      )}

      <div className="config-grid">
        {/* Left Column */}
        <div>
          <div className="card mb-20" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <h3 className="section-title">👤 Usuários do Sistema</h3>
              <button
                className="btn-small"
                onClick={() => setShowUserForm(s => !s)}
              >
                {showUserForm ? 'Cancelar' : '+ Adicionar Usuário'}
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleUserSubmit} style={{ marginBottom: 16 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" name="nome" value={userForm.nome} onChange={handleUserChange} required placeholder="Nome completo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-control" name="email" type="email" value={userForm.email} onChange={handleUserChange} required placeholder="email@pmrj.gov.br" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Senha *</label>
                    <input className="form-control" name="password" type="password" value={userForm.password} onChange={handleUserChange} required placeholder="Senha" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input className="form-control" name="cargo" value={userForm.cargo} onChange={handleUserChange} placeholder="Sargento" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" name="role" value={userForm.role} onChange={handleUserChange}>
                    <option value="admin">Administrador</option>
                    <option value="operador">Operador</option>
                    <option value="visualizador">Visualizador</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Salvando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading">Carregando...</div>
            ) : usuarios.length === 0 ? (
              <div className="empty-state">Nenhum usuário cadastrado.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Cargo</th>
                    <th>Role</th>
                    <th>Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>{u.cargo || '—'}</td>
                      <td>{u.role}</td>
                      <td>{u.ativo ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card mb-20" style={{ marginBottom: 20 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>🔌 Integrações</h3>
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

          <div className="card mb-20" style={{ marginBottom: 20 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>🌐 Variáveis de Ambiente</h3>
            <table className="data-table">
              <thead>
                <tr><th>Variável</th><th>Descrição</th></tr>
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
            <h3 className="section-title" style={{ marginBottom: 16 }}>ℹ️ Informações do Sistema</h3>
            <table className="data-table">
              <tbody>
                <tr><td><strong>Sistema</strong></td><td>Mototec 17º GB — Gestão de Frota</td></tr>
                <tr><td><strong>Versão</strong></td><td>2.0.0</td></tr>
                <tr><td><strong>Backend</strong></td><td>FastAPI + PostgreSQL</td></tr>
                <tr><td><strong>Frontend</strong></td><td>React 18</td></tr>
                <tr><td><strong>Desenvolvido para</strong></td><td>17º GB PMRJ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;
