import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Search, ShieldCheck, UserCheck, LogOut, Lock } from 'lucide-react';
import AgentPersonaSelector from '../common/AgentPersonaSelector';

/**
 * Topbar Component
 * Clean enterprise top bar (height: 68px, white background, #E2E8F0 border).
 * Integrated with VaultPay authentication, user identity badge, and breadcrumbs.
 */
export default function Topbar({
  onOpenSidebar,
  activeNav,
  activeAgent,
  onAgentChange,
  connectionStatus = 'connected',
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const isSocketConnected = connectionStatus === 'connected';

  // Determine dynamic breadcrumb
  const path = location.pathname;
  let section = 'Catalog';
  let pageTitle = 'Inventory Overview';

  if (path.includes('/admin')) {
    section = 'VaultPay';
    pageTitle = 'Executive Revenue Management';
  } else if (path.includes('/client')) {
    section = 'VaultPay';
    pageTitle = 'Corporate Billing Portal';
  } else if (path.includes('/invoices')) {
    section = 'VaultPay';
    pageTitle = 'Invoice Statement';
  } else if (path.includes('/live-ops') || activeNav === 'Live Ops Tickets') {
    section = 'RapidDispatch';
    pageTitle = 'Live Ops Tickets';
  } else if (path.includes('/403') || path.includes('/unauthorized')) {
    section = 'Security';
    pageTitle = '403 Forbidden';
  }

  return (
    <header
      className="enterprise-topbar"
      style={{
        height: '68px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="btn-icon mobile-menu-btn"
          aria-label="Open sidebar menu"
          id="mobile-menu-trigger"
        >
          <Menu size={18} />
        </button>

        {/* Dynamic Page Context Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="topbar-crumb-prefix"
            style={{ fontSize: '13px', fontWeight: 600, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            {section}
          </span>
          <span style={{ color: '#CBD5E1', fontSize: '13px' }}>/</span>
          <span
            className="topbar-page-label"
            style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}
          >
            {pageTitle}
          </span>
        </div>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Real-time Socket Concurrency Indicator */}
        <div
          className="topbar-status-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: isSocketConnected ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isSocketConnected ? '#A7F3D0' : '#FECACA'}`,
            fontSize: '12px',
            fontWeight: 600,
            color: isSocketConnected ? '#059669' : '#DC2626',
          }}
          title={isSocketConnected ? 'Real-time WebSocket bus operational' : 'WebSocket connection lost'}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isSocketConnected ? '#10B981' : '#EF4444',
              display: 'inline-block',
            }}
          />
          <span className="status-label-text">
            {isSocketConnected ? 'Live Synchronized' : 'Reconnecting...'}
          </span>
        </div>

        {/* Authenticated User Identity or Login Button */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isAdmin ? '#059669' : '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.name?.charAt(0) || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{user.name}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: isAdmin ? '#059669' : '#2563EB' }}>
                  {user.role} • {user.company}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn"
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '8px',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Lock size={14} />
            <span>VaultPay Login</span>
          </button>
        )}

        {/* Live Ops Agent Persona Switcher (visible for ticket concurrency testing) */}
        {(path.includes('/live-ops') || activeNav === 'Live Ops Tickets') && activeAgent && (
          <>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#E2E8F0' }} />
            <AgentPersonaSelector
              activeAgent={activeAgent}
              onAgentChange={onAgentChange}
            />
          </>
        )}
      </div>
    </header>
  );
}
