import React, { useState } from 'react';
import { cadastrar, login, solicitarRecuperacaoSenha } from '../services/api';

const logo17gb = `${import.meta.env.BASE_URL}assets/logo17gb.png`;
const logocb = `${import.meta.env.BASE_URL}assets/logocb.png`;

const emptyForm = { nome: '', email: '', password: '', confirmar: '', cargo: '', unidade: '' };

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('login'); // login | cadastro | recuperar
  const [form, setForm] = useState(emptyForm);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErro('');
    setSucesso('');
  }

  function changeModo(nextModo) {
    setModo(nextModo);
    setErro('');
    setSucesso('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErro('Informe um email valido.');
        return;
      }

      if (modo === 'recuperar') {
        await solicitarRecuperacaoSenha(email);
        setSucesso('Solicitacao recebida. Procure um administrador para redefinir sua senha.');
        setModo('login');
        setForm({ ...emptyForm, email });
        return;
      }

      if (!form.password) {
        setErro('Informe a senha.');
        return;
      }

      if (modo === 'login') {
        const data = await login(email, form.password);
        if (!data?.access_token) {
          setErro('Resposta invalida do servidor. Tente novamente.');
          return;
        }
        localStorage.setItem('token', data.access_token);
        onLogin();
        return;
      }

      if (!form.nome.trim()) {
        setErro('Informe o nome completo.');
        return;
      }
      if (form.password !== form.confirmar) {
        setErro('As senhas nao coincidem.');
        return;
      }
      if (form.password.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      await cadastrar({
        nome: form.nome.trim(),
        email,
        password: form.password,
        cargo: form.cargo || null,
        unidade: form.unidade || null,
      });
      setSucesso('Cadastro enviado. Aguarde a liberacao de um administrador para acessar o sistema.');
      setModo('login');
      setForm({ ...emptyForm, email });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setErro(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        setErro(detail[0].msg);
      } else if (!err?.response) {
        setErro('Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente.');
      } else if (modo === 'login') {
        setErro('Email ou senha incorretos.');
      } else if (modo === 'recuperar') {
        setErro('Nao foi possivel solicitar a recuperacao. Verifique o email e tente novamente.');
      } else {
        setErro('Erro ao cadastrar. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: '0.95rem', outline: 'none',
    background: '#f9fafb', transition: 'border 0.2s',
  };

  const passwordInputStyle = {
    ...inputStyle,
    paddingRight: 86,
  };

  const toggleButtonStyle = {
    position: 'absolute',
    top: 6,
    right: 6,
    height: 30,
    padding: '0 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    color: '#374151',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
  };

  const renderPasswordField = ({ name, label, value, show, setShow, placeholder, autoComplete }) => (
    <div>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={handle}
          required
          placeholder={placeholder}
          style={passwordInputStyle}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow(current => !current)}
          style={toggleButtonStyle}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #1565C0 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <img src={logo17gb} alt="17GB" width={64} height={64}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          onError={e => { e.target.style.display = 'none'; }} />
        <div style={{ color: 'white' }}>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1 }}>MOTOMEC 17GB</div>
          <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>Gestao de Frota - CBMESP</div>
        </div>
        <img src={logocb} alt="CBMESP" width={56} height={56}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          onError={e => { e.target.style.display = 'none'; }} />
      </div>

      <div style={{
        background: 'white', borderRadius: 16, padding: '36px 32px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', marginBottom: 24, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {['login', 'cadastro', 'recuperar'].map(m => (
            <button key={m} onClick={() => changeModo(m)} type="button"
              style={{
                flex: 1, padding: '10px 6px', border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.86rem', transition: 'all 0.2s',
                background: modo === m ? '#1565C0' : '#f9fafb',
                color: modo === m ? 'white' : '#6b7280',
              }}>
              {m === 'login' ? 'Entrar' : m === 'cadastro' ? 'Cadastrar' : 'Recuperar'}
            </button>
          ))}
        </div>

        {modo === 'cadastro' && (
          <div style={{
            background: '#eff6ff', color: '#1d4ed8', padding: '10px 14px',
            borderRadius: 8, marginBottom: 16, fontSize: '0.88rem', border: '1px solid #bfdbfe',
          }}>
            Apos o cadastro, o acesso fica aguardando liberacao de um administrador.
          </div>
        )}

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
                placeholder="Sd PM Joao Silva" style={inputStyle} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
              Email *
            </label>
            <input name="email" type="email" value={form.email} onChange={handle} required
              placeholder="email@cbmesp.sp.gov.br" style={inputStyle} autoComplete="email" />
          </div>

          {modo !== 'recuperar' && renderPasswordField({
            name: 'password',
            label: 'Senha *',
            value: form.password,
            show: showPassword,
            setShow: setShowPassword,
            placeholder: modo === 'cadastro' ? 'Minimo 6 caracteres' : 'Sua senha',
            autoComplete: modo === 'login' ? 'current-password' : 'new-password',
          })}

          {modo === 'cadastro' && (
            <>
              {renderPasswordField({
                name: 'confirmar',
                label: 'Confirmar senha *',
                value: form.confirmar,
                show: showConfirmPassword,
                setShow: setShowConfirmPassword,
                placeholder: 'Repita a senha',
                autoComplete: 'new-password',
              })}
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
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Criar conta' : 'Solicitar recuperacao'}
          </button>
        </form>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 24 }}>
        CBMESP - 17GB
      </div>
    </div>
  );
}
