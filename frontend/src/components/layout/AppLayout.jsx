import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SystemStatus from './SystemStatus';
import { api } from '../../services/api';
import { subscribeConnectionStatus } from '../../services/socket';

/**
 * AppLayout Component
 * Master Enterprise Application Shell.
 * Layout: Left Sidebar (240px) + Top Header (64px) + Centered Main Content (1440px max).
 * Conforms to modern, clean light enterprise SaaS standards.
 */
export default function AppLayout({
  children,
  totalSKUs = 50001,
  activeNav = 'Live Ops Tickets',
  onSelectNav,
  activeAgent,
  onAgentChange,
  connectionStatus = 'connected',
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('operational');
  const [liveSocketStatus, setLiveSocketStatus] = useState(connectionStatus);

  useEffect(() => {
    return subscribeConnectionStatus((status) => {
      setLiveSocketStatus(status);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const response = await api.getHealth();
        if (isMounted) {
          if (response && (response.status === 'UP' || response.success === true)) {
            setHealthStatus('operational');
          } else {
            setHealthStatus('unavailable');
          }
        }
      } catch {
        if (isMounted) {
          setHealthStatus('unavailable');
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-container">
      {/* 1. Left Enterprise Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeNav}
        onSelectNav={onSelectNav}
        totalSKUs={totalSKUs}
        healthStatus={healthStatus}
      />

      {/* 2. Main Application Flow */}
      <div className="app-main">
        {/* Top Header */}
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          healthStatus={healthStatus}
          activeNav={activeNav}
          activeAgent={activeAgent}
          onAgentChange={onAgentChange}
          connectionStatus={liveSocketStatus}
        />

        {/* Scrollable Workspace Container */}
        <main className="main-content-scroll" id="main-content">
          {children}

          {/* Clean Understated System Status Strip (for Inventory views) */}
          {activeNav !== 'Live Ops Tickets' && (
            <SystemStatus healthStatus={healthStatus} totalSKUs={totalSKUs} />
          )}
        </main>
      </div>
    </div>
  );
}
