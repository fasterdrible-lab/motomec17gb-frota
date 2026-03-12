import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Frota from './pages/Frota';
import Manutencao from './pages/Manutencao';
import Alertas from './pages/Alertas';
import Gastos from './pages/Gastos';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import './styles/App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/frota" element={<Frota />} />
              <Route path="/manutencao" element={<Manutencao />} />
              <Route path="/alertas" element={<Alertas />} />
              <Route path="/gastos" element={<Gastos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
