import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  BarChart3,
  FolderTree,
  FileText,
  Settings,
  Layers,
  Database,
  Radio,
  Server,
  Wifi,
  X,
} from 'lucide-react';

/**
 * Sidebar Component
 * Enterprise navigation sidebar with clean light theme,
 * active mint/teal accents, and live telemetry summary.
 */
export default function Sidebar({
  isOpen = false,
  onClose,
  activeItem = 'Live Ops Tickets',
  onSelectNav,
  totalSKUs = 50001,
  healthStatus = 'operational',
}) {
  const navItems = [
    { label: 'Live Ops Tickets', icon: Radio, badge: 'LIVE' },
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Inventory', icon: Boxes },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Categories', icon: FolderTree },
    { label: 'Reports', icon: FileText },
    { label: 'System', icon: Settings },
  ];

  const isConnected = healthStatus === 'operational';

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

        {/* Navigation Items */}
        <nav className="sidebar-nav" aria-label="Main Navigation" style={{ padding: '8px 14px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              // Ensure 'Inventory' is the active item when in Inventory Overview, never highlight 'Overview'
              const isActive =
                item.label === 'Inventory'
                  ? activeItem === 'Inventory' || activeItem === 'Overview'
                  : item.label === 'Overview'
                  ? false
                  : activeItem === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? '#F0FDFA' : 'transparent',
                    color: isActive ? '#0F766E' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    const targetNav = item.label === 'Overview' ? 'Inventory' : item.label;
                    if (onSelectNav) onSelectNav(targetNav);
                    if (onClose) onClose();
                  }}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.3 : 1.8}
                    color={isActive ? '#0D9488' : '#64748B'}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom System Status Section */}
        <div className="sidebar-footer" style={{ padding: '16px 14px 20px', marginTop: 'auto' }}>
          <div
            className="sidebar-status-box"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Row 1: System Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1E293B',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#10B981' : '#EF4444',
                    display: 'inline-block',
                  }}
                />
                <span>System Status</span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isConnected ? '#059669' : '#DC2626',
                }}
              >
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Row 2: MongoDB */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={13} color="#0D9488" />
                <span>MongoDB</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                {totalSKUs.toLocaleString()} SKUs
              </span>
            </div>

            {/* Row 3: API Server */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={13} color="#3B82F6" />
                <span>API Server</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>
                Healthy
              </span>
            </div>

            {/* Row 4: WebSocket */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wifi size={13} color="#10B981" />
                <span>WebSocket</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>
                Connected
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
