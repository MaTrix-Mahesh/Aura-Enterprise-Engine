import React from 'react';
import { Layers, Activity, Database } from 'lucide-react';

/**
 * Top Application Header
 * Height: 56px, high-contrast, Obsidian/Slate palette.
 * Conforms to DESIGN.md Section 3.
 */
export default function Header({ healthStatus = 'checking' }) {
  let statusConfig = {
    label: 'System Operational',
    color: 'var(--color-success)',
    bg: 'var(--color-success-bg)',
    border: 'rgba(34, 197, 94, 0.25)',
    shadow: '0 0 4px rgba(34, 197, 94, 0.35)',
  };

  if (healthStatus === 'checking') {
    statusConfig = {
      label: 'Checking System...',
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      border: 'rgba(245, 158, 11, 0.25)',
      shadow: 'none',
    };
  } else if (healthStatus === 'unavailable') {
    statusConfig = {
      label: 'API Unavailable',
      color: 'var(--color-danger)',
      bg: 'var(--color-danger-bg)',
      border: 'rgba(239, 68, 68, 0.25)',
      shadow: '0 0 4px rgba(239, 68, 68, 0.35)',
    };
  }

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-default)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
      }}
    >
      {/* Brand & Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-text)',
              boxShadow: 'none',
            }}
          >
            <Layers size={17} strokeWidth={2.2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontSize: 'var(--text-md)',
                color: 'var(--text-primary)',
              }}
            >
              AURA
            </span>
            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Enterprise Engine
            </span>
          </div>
        </div>

        <div
          style={{
            height: '16px',
            width: '1px',
            backgroundColor: 'var(--border-default)',
          }}
        />

        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          Inventory Management
        </span>
      </div>

      {/* System Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* SKUs Indexed Pill */}
        <div
          className="tabular-nums"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Database size={13} color="var(--color-primary)" />
          <span>50,000 SKUs Indexed</span>
        </div>

        {/* Live Operational Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: statusConfig.color,
            backgroundColor: statusConfig.bg,
            border: `1px solid ${statusConfig.border}`,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusConfig.color,
              boxShadow: statusConfig.shadow,
            }}
          />
          <span>{statusConfig.label}</span>
        </div>

        {/* Last Sync */}
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            display: 'none',
          }}
          className="desktop-sync-label"
        >
          Sync: Just now
        </span>
      </div>
    </header>
  );
}
