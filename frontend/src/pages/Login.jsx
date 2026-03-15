import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [touched, setTouched] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, senha: true });
    if (!email || !senha) return;
    const ok = await login(email, senha);
    if (ok) navigate('/dashboard', { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🚒</span>
          <h1 className="login-title">Sistema de Frota</h1>
          <p className="login-subtitle">17º Grupamento de Bombeiros</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">E-mail</label>
            <input
              id="email"
              type="email"
              className={`form-control ${touched.email && !email ? 'input-error' : ''}`}
              placeholder="usuario@bombeiros.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoComplete="email"
              required
            />
            {touched.email && !email && (
              <span className="field-error">Campo obrigatório</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="senha" className="form-label">Senha</label>
            <input
              id="senha"
              type="password"
              className={`form-control ${touched.senha && !senha ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, senha: true }))}
              autoComplete="current-password"
              required
            />
            {touched.senha && !senha && (
              <span className="field-error">Campo obrigatório</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--color-secondary) 0%, #2d2d5e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-4);
        }

        .login-card {
          background: #fff;
          border-radius: var(--radius-xl);
          padding: var(--spacing-8);
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-xl);
        }

        .login-logo {
          text-align: center;
          margin-bottom: var(--spacing-8);
        }

        .login-logo-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: var(--spacing-3);
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: var(--spacing-1);
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .login-error {
          background: #fee2e2;
          color: #991b1b;
          padding: var(--spacing-3);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }

        .login-btn {
          width: 100%;
          justify-content: center;
          padding: var(--spacing-3);
          font-size: 1rem;
          margin-top: var(--spacing-2);
        }

        .input-error {
          border-color: var(--color-danger) !important;
        }

        .field-error {
          font-size: 0.8rem;
          color: var(--color-danger);
        }
      `}</style>
    </div>
  );
}
