import React, { useState } from 'react';
import { login, cadastrar } from '../services/api';

const publicUrl = process.env.PUBLIC_URL || '';
const logo17gb = `${publicUrl}/assets/logo17gb.png`;
const logocb = `${publicUrl}/assets/logocb.png`;

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [form, setForm] = useState({ nome: '', email: '', password: '', confirmar: '', cargo: '', unidade: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErro('');
    setSucesso('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      if (modo === 'login') {
        const data = await login(form.email, form.password);
        localStorage.setItem('token', data.access_token);
        onLogin();
      } else {
        if (form.password !== form.confirmar) {
          setErro('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          setErro('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await cadastrar({
          nome: form.nome,
          email: form.email,
          password: form.password,
          cargo: form.cargo || null,
          unidade: form.unidade || null,
        });
        setSucesso('Cadastro realizado! Faça login para continuar.');
        setModo('login');
        setForm(f => ({ ...f, password: '', confirmar: '' }));
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') setErro(detail);
      else if (modo === 'login') setErro('Email ou senha incorretos.');
      else setErro('Erro ao cadastrar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: '0.95rem', outline: 'none',
    background: '#f9fafb', transition: 'border 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #1565C0 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <img src={logo17gb} alt="17GB" width={64} height={64}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          onError={e => { e.target.style.display = 'none'; }} />
        <div style={{ color: 'white' }}>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1 }}>MOTOMEC 17º GB</div>
          <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>Gestão de Frota — CBMESP</div>
        </div>
        <img src={logocb} alt="CBMESP" width={56} height={56}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          onError={e => { e.target.style.display = 'none'; }} />
      </div>

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '36px 32px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 28, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {['login', 'cadastro'].map(m => (
            <button key={m} onClick={() => { setModo(m); setErro(''); setSucesso(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.9rem', transition: 'all 0.2s',
                background: modo === m ? '#1565C0' : '#f9fafb',
                color: modo === m ? 'white' : '#6b7280',
              }}>
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        {sucesso && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px',
            borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
            {sucesso}
          </div>
        )}
        {erro && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
            borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', border: '1px solid #fecaca' }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modo === 'cadastro' && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                Nome completo *
              </label>
              <input name="nome" value={form.nome} onChange={handle} required
                placeholder="Sd PM João Silva" style={inputStyle} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Email *
            </label>
            <input name="email" type="email" value={form.email} onChange={handle} required
              placeholder="email@cbmesp.sp.gov.br" style={inputStyle} autoComplete="email" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Senha *
            </label>
            <input name="password" type="password" value={form.password} onChange={handle} required
              placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Sua senha'}
              style={inputStyle} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {modo === 'cadastro' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                  Confirmar senha *
                </label>
                <input name="confirmar" type="password" value={form.confirmar} onChange={handle} required
                  placeholder="Repita a senha" style={inputStyle} autoComplete="new-password" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                    Cargo
                  </label>
                  <input name="cargo" value={form.cargo} onChange={handle}
                    placeholder="Ex: Sd BM" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                    Unidade
                  </label>
                  <input name="unidade" value={form.unidade} onChange={handle}
                    placeholder="Ex: 17GB" style={inputStyle} />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            style={{
              marginTop: 6, padding: '12px', background: loading ? '#93c5fd' : '#1565C0',
              color: 'white', border: 'none', borderRadius: 10, fontWeight: 700,
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s', letterSpacing: 0.5,
            }}>
            {loading ? 'Aguarde...' : (modo === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 24 }}>
        CBMESP · 17º Grupamento de Bombeiros
      </div>
    </div>
  );
}
