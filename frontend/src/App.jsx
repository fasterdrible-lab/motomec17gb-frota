import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { isAuthenticated } from './services/auth';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Frota        from './pages/Frota';
import Manutencao   from './pages/Manutencao';
import Abastecimento from './pages/Abastecimento';
import Gastos       from './pages/Gastos';
import Alertas      from './pages/Alertas';
import Relatorios   from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout><Dashboard /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/frota"
          element={
            <PrivateRoute>
              <AppLayout><Frota /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/manutencao"
          element={
            <PrivateRoute>
              <AppLayout><Manutencao /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/abastecimento"
          element={
            <PrivateRoute>
              <AppLayout><Abastecimento /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/gastos"
          element={
            <PrivateRoute>
              <AppLayout><Gastos /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <PrivateRoute>
              <AppLayout><Alertas /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <AppLayout><Relatorios /></AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <PrivateRoute>
              <AppLayout><Configuracoes /></AppLayout>
            </PrivateRoute>
          }
        />

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            isAuthenticated()
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
