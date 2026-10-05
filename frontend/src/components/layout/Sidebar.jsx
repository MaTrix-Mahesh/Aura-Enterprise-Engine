import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  BarChart3,
  Layers,
  Database,
  Radio,
  Server,
  Wifi,
  X,
  DollarSign,
  CreditCard,
  Lock,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';

/**
 * Sidebar Component
 * Enterprise navigation sidebar with clean light theme,
 * active mint/teal accents, and live telemetry summary.
 * Integrated with VaultPay Financial Core and RBAC.
 */
export default function Sidebar({
  isOpen = false,
  onClose,
  activeItem,
  onSelectNav,
  totalSKUs = 50001,
  healthStatus = 'operational',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isClient, logout } = useAuth();

  const isConnected = healthStatus === 'operational';
  const currentPath = location.pathname;

  const handleNavClick = (path, fallbackLabel) => {
    if (path) {
      navigate(path);
    } else if (onSelectNav) {
      onSelectNav(fallbackLabel);
    }
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`enterprise-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ padding: '24px 20px 20px' }}>
          <div
            className="sidebar-logo-icon"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
            }}
          >
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0, marginLeft: '10px' }}>
            <div
              className="sidebar-brand-title"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#0F172A',
                lineHeight: 1.1,
              }}
            >
              AURA
            </div>
            <div
              className="sidebar-brand-sub"
              style={{
                fontSize: '12px',
                color: '#64748B',
                fontWeight: 500,
                marginTop: '2px',
              }}
            >
              Enterprise Engine
            </div>
          </div>
          {/* Mobile Close Button */}
          {isOpen && (
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: '28px', height: '28px', border: 'none' }}
              aria-label="Close navigation sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav" aria-label="Main Navigation" style={{ padding: '8px 14px', flex: 1, overflowY: 'auto' }}>
          {/* Section 1: VaultPay Financial Core (Sprint 20) */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#0D9488',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 12px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>VaultPay Financial</span>
            <span style={{ fontSize: '9px', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '1px 5px', borderRadius: '4px' }}>CORE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {isAdmin && (
              <button
                type="button"
                className={`sidebar-nav-item ${currentPath.includes('/admin') ? 'active' : ''}`}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: currentPath.includes('/admin') ? 600 : 500,
                  backgroundColor: currentPath.includes('/admin') ? '#F0FDFA' : 'transparent',
                  color: currentPath.includes('/admin') ? '#0F766E' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => handleNavClick('/admin/dashboard')}
              >
                <DollarSign size={18} color={currentPath.includes('/admin') ? '#0D9488' : '#64748B'} />
                <span style={{ flex: 1 }}>Revenue Console</span>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
                  ADMIN
                </span>
              </button>
            )}

            {isClient && (
              <button
                type="button"
                className={`sidebar-nav-item ${currentPath.includes('/client') ? 'active' : ''}`}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: currentPath.includes('/client') ? 600 : 500,
                  backgroundColor: currentPath.includes('/client') ? '#F0FDFA' : 'transparent',
                  color: currentPath.includes('/client') ? '#0F766E' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => handleNavClick('/client/dashboard')}
              >
                <CreditCard size={18} color={currentPath.includes('/client') ? '#0D9488' : '#64748B'} />
                <span style={{ flex: 1 }}>Billing Portal</span>
                <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '4px' }}>
                  CLIENT
                </span>
              </button>
            )}

            {!isAuthenticated && (
              <button
                type="button"
                className={`sidebar-nav-item ${currentPath === '/login' ? 'active' : ''}`}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: currentPath === '/login' ? 600 : 500,
                  backgroundColor: currentPath === '/login' ? '#F0FDFA' : 'transparent',
                  color: currentPath === '/login' ? '#0F766E' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => handleNavClick('/login')}
              >
                <Lock size={18} color="#64748B" />
                <span style={{ flex: 1 }}>Sign In to VaultPay</span>
              </button>
            )}
          </div>

          {/* Section 2: Operations (Sprint 18 & 19) */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 12px 6px',
            }}
          >
            Operations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className={`sidebar-nav-item ${currentPath === '/live-ops' || activeItem === 'Live Ops Tickets' ? 'active' : ''}`}
              style={{
                height: '42px',
                padding: '0 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: currentPath === '/live-ops' || activeItem === 'Live Ops Tickets' ? 600 : 500,
                backgroundColor: currentPath === '/live-ops' || activeItem === 'Live Ops Tickets' ? '#F0FDFA' : 'transparent',
                color: currentPath === '/live-ops' || activeItem === 'Live Ops Tickets' ? '#0F766E' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
              onClick={() => handleNavClick('/live-ops', 'Live Ops Tickets')}
            >
              <Radio size={18} color={currentPath === '/live-ops' || activeItem === 'Live Ops Tickets' ? '#0D9488' : '#64748B'} />
              <span style={{ flex: 1 }}>Live Ops Tickets</span>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '4px' }}>
                LIVE
              </span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${currentPath === '/inventory' || activeItem === 'Inventory' ? 'active' : ''}`}
              style={{
                height: '42px',
                padding: '0 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: currentPath === '/inventory' || activeItem === 'Inventory' ? 600 : 500,
                backgroundColor: currentPath === '/inventory' || activeItem === 'Inventory' ? '#F0FDFA' : 'transparent',
                color: currentPath === '/inventory' || activeItem === 'Inventory' ? '#0F766E' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
              onClick={() => handleNavClick('/inventory', 'Inventory')}
            >
              <Boxes size={18} color={currentPath === '/inventory' || activeItem === 'Inventory' ? '#0D9488' : '#64748B'} />
              <span style={{ flex: 1 }}>Inventory Catalog</span>
            </button>
          </div>
        </nav>

        {/* Authenticated User Strip */}
        {isAuthenticated && user && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: isAdmin ? '#059669' : '#2563EB' }}>{user.role}</span>
                  <span>•</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.company}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Sign Out of VaultPay"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom System Status Section */}
        <div className="sidebar-footer" style={{ padding: '12px 14px 16px', marginTop: 'auto' }}>
          <div
            className="sidebar-status-box"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#1E293B' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? '#10B981' : '#EF4444', display: 'inline-block' }} />
                <span>Engine Telemetry</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: isConnected ? '#059669' : '#DC2626' }}>
                {isConnected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
              <span>MongoDB</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{totalSKUs.toLocaleString()} SKUs</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
