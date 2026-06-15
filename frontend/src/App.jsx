import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Frota from './pages/Frota';
import Manutencao from './pages/Manutencao';
import Alertas from './pages/Alertas';
import Gastos from './pages/Gastos';
import Tarefas from './pages/Tarefas';
import Abastecimentos from './pages/Abastecimentos';
import Relatorios from './pages/Relatorios';
import RelatorioLogistica from './pages/RelatorioLogistica';
import Configuracoes from './pages/Configuracoes';
import Logistica from './pages/Logistica';
import MatOperacionais from './pages/MatOperacionais';
import PasDeaReparos from './pages/PasDeaReparos';
import Patrimonio from './pages/Patrimonio';
import './styles/App.css';

function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    const onStorage = () => setAutenticado(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function handleLogin() {
    setAutenticado(true);
    setSidebarVisible(false);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setAutenticado(false);
    setSidebarVisible(false);
  }

  if (!autenticado) {
    return (
      <BrowserRouter basename="/motomec17gb-frota">
        <Login onLogin={handleLogin} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename="/motomec17gb-frota">
      <div className={`app-layout ${sidebarVisible ? 'app-layout-sidebar-open' : 'app-layout-sidebar-hidden'}`}>
        {sidebarVisible && <Sidebar onClose={() => setSidebarVisible(false)} />}
        <div className="main-content">
          <Header
            onLogout={handleLogout}
            sidebarVisible={sidebarVisible}
            onToggleSidebar={() => setSidebarVisible(value => !value)}
          />
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/frota" element={<Frota />} />
              <Route path="/manutencao" element={<Manutencao />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/gastos" element={<Gastos />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/abastecimentos" element={<Abastecimentos />} />
              <Route path="/relatorios" element={<Navigate to="/relatorios/motomec" replace />} />
              <Route path="/relatorios/motomec" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/logistica" element={<Logistica />} />
              <Route path="/logistica/mat-operacionais" element={<MatOperacionais />} />
              <Route path="/logistica/pas-dea-reparos" element={<PasDeaReparos />} />
              <Route path="/logistica/relatorio" element={<RelatorioLogistica />} />
              <Route path="/logistica/patrimonio" element={<Navigate to="/logistica/patrimonio/prefeitura" replace />} />
              <Route path="/logistica/patrimonio/:modo" element={<Patrimonio />} />
            </Routes>
          </div>
          <footer style={{
            borderTop: '1px solid #e5e7eb',
            background: '#f9fafb',
            padding: '10px 28px',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9ca3af',
            flexShrink: 0,
          }}>
            Copyright &copy; 2026 <strong style={{ color: '#6b7280' }}>NEX-ALS TECNOLOGIA</strong>. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
