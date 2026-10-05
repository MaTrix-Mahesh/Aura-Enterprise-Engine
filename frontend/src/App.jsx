import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import InventoryWorkspace from './components/inventory/InventoryWorkspace';
import TicketBoard from './components/tickets/TicketBoard';
import { getStoredAgent } from './services/socket';

/**
 * Standard Layout Wrapper that provides consistent AppLayout, Topbar,
 * and real-time Socket/Telemetry across the entire enterprise platform.
 */
function LayoutWrapper({ children, activeNav }) {
  const [activeAgent, setActiveAgent] = useState(getStoredAgent());

  return (
    <AppLayout
      activeNav={activeNav}
      activeAgent={activeAgent}
      onAgentChange={setActiveAgent}
    >
      {children}
    </AppLayout>
  );
}

/**
 * Dedicated LiveOps Page wrapper synchronizing activeAgent between
 * the Topbar agent selector and the TicketBoard lock engine.
 */
function LiveOpsPage() {
  const [activeAgent, setActiveAgent] = useState(getStoredAgent());

  return (
    <AppLayout
      activeNav="Live Ops Tickets"
      activeAgent={activeAgent}
      onAgentChange={setActiveAgent}
    >
      <TicketBoard
        activeAgent={activeAgent}
        onAgentChange={setActiveAgent}
      />
    </AppLayout>
  );
}

/**
 * Smart Root Redirector:
 * Routes users intelligently based on their authenticated role.
 */
function HomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backgroundColor: '#F8FAFC',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#0D9488' }} />
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          Initializing VaultPay Financial Core...
        </span>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user?.role === 'CLIENT') {
      return <Navigate to="/client/dashboard" replace />;
    }
  }

  return <Navigate to="/login" replace />;
}

/**
 * Master Enterprise Application Composition Root
 * Powers:
 * 1. VaultPay Financial Core (Sprint 20)
 * 2. RapidDispatch Live Ops (Sprint 19)
 * 3. Inventory & Analytics (Sprint 18)
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Gateway */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Financial Console (Strict RBAC: ADMIN only) */}
          <Route
            path="/admin/dashboard"
            element={
              <LayoutWrapper activeNav="VaultPay Revenue">
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </LayoutWrapper>
            }
          />

          {/* Client Corporate Billing Portal (Strict RBAC: CLIENT only) */}
          <Route
            path="/client/dashboard"
            element={
              <LayoutWrapper activeNav="Client Billing">
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientDashboard />
                </ProtectedRoute>
              </LayoutWrapper>
            }
          />

          {/* Invoice Statement Detail (Zero-Trust IDOR Protected) */}
          <Route
            path="/invoices/:id"
            element={
              <LayoutWrapper activeNav="Invoices">
                <ProtectedRoute>
                  <InvoiceDetailPage />
                </ProtectedRoute>
              </LayoutWrapper>
            }
          />

          {/* RapidDispatch Live Ops Workspace (Preserved Sprint 19) */}
          <Route path="/live-ops" element={<LiveOpsPage />} />

          {/* Inventory Catalog & Stock Analytics (Preserved Sprint 18) */}
          <Route
            path="/inventory"
            element={
              <LayoutWrapper activeNav="Inventory">
                <InventoryWorkspace />
              </LayoutWrapper>
            }
          />

          {/* Zero-Trust 403 Forbidden Experience */}
          <Route
            path="/403"
            element={
              <LayoutWrapper activeNav="Security">
                <UnauthorizedPage />
              </LayoutWrapper>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <LayoutWrapper activeNav="Security">
                <UnauthorizedPage />
              </LayoutWrapper>
            }
          />

          {/* Root & Fallback Redirects */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
