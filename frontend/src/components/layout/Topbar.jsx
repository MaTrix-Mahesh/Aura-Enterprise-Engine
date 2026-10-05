import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import AgentPersonaSelector from '../common/AgentPersonaSelector';

/**
 * Topbar Component
 * Clean enterprise top bar (height: 68px, white background, #E2E8F0 border).
 * Contains mobile drawer toggle, dynamic breadcrumb, operational status,
 * real-time socket health, notifications, and Agent Persona Selector for dual-window concurrency.
 */
export default function Topbar({
  onOpenSidebar,
  healthStatus = 'operational',
  activeNav = 'Live Ops Tickets',
  activeAgent,
  onAgentChange,
  connectionStatus = 'connected',
}) {
  const isSocketConnected = connectionStatus === 'connected';

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

        {/* Page Context Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="topbar-crumb-prefix"
            style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}
          >
            {activeNav === 'Live Ops Tickets' ? 'RapidDispatch' : 'Catalog'}
          </span>
          <span style={{ color: '#CBD5E1', fontSize: '13px' }}>/</span>
          <span
            className="topbar-page-label"
            style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}
          >
            {activeNav === 'Live Ops Tickets' ? 'Live Ops Tickets' : 'Inventory Overview'}
          </span>
        </div>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Search Shortcut */}
        <div
          className="topbar-quick-search"
          title="Quick Search (Ctrl + K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '13px',
            color: '#64748B',
            cursor: 'pointer',
            width: '260px',
            transition: 'border 0.15s ease',
          }}
        >
          <Search size={14} color="#94A3B8" />
          <span style={{ flex: 1 }}>
            {activeNav === 'Live Ops Tickets' ? 'Search tickets, keywords...' : 'Search products, catalog...'}
          </span>
          <span
            className="kbd-badge"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '1px 5px',
              borderRadius: '4px',
              color: '#64748B',
            }}
          >
            Ctrl K
          </span>
        </div>

        {/* Real-time Socket Concurrency Indicator */}
        <div
          className="topbar-status-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: isSocketConnected ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isSocketConnected ? '#A7F3D0' : '#FECACA'}`,
            fontSize: '13px',
            fontWeight: 600,
            color: isSocketConnected ? '#059669' : '#DC2626',
          }}
          title={isSocketConnected ? 'Socket.io real-time bus connected' : 'Socket.io connection lost, reconnecting...'}
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
            {isSocketConnected ? 'Connected' : 'Connection Lost: Reconnecting...'}
          </span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="btn-icon"
          aria-label="Notifications"
          title="Notifications"
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={17} color="#475569" />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              border: '1.5px solid #FFFFFF',
            }}
          />
        </button>

        <div style={{ width: '1px', height: '28px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

        {/* Dynamic Agent Persona Selector for Dual-Window Concurrency Testing */}
        {activeAgent && (
          <AgentPersonaSelector
            activeAgent={activeAgent}
            onAgentChange={onAgentChange}
          />
        )}
      </div>
    </header>
  );
}
