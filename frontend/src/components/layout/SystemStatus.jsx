import React from 'react';
import { Database, ShieldCheck, CheckCircle2, Server, Layers } from 'lucide-react';

/**
 * SystemStatus Component
 * Clean, subtle enterprise system information strip at the bottom of the page.
 * Keeps infrastructure telemetry understated, professional, and accessible.
 */
export default function SystemStatus({ healthStatus = 'operational', totalSKUs = 50001 }) {
  const isOperational = healthStatus === 'operational';

  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: 'var(--space-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* Database Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={14} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-muted)' }}>Database:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Connected</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
              display: 'inline-block',
            }}
          />
        </div>

        {/* Catalog Indexed SKUs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-muted)' }}>Catalog:</span>
          <span className="tabular-nums font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalSKUs.toLocaleString()} Products
          </span>
        </div>

        {/* MongoDB Indexes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>6 Compound Indexes Active</span>
        </div>

        {/* Backend API */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Server size={14} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-muted)' }}>API:</span>
          <span
            style={{
              fontWeight: 600,
              color: isOperational ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {isOperational ? 'Operational' : 'Degraded'}
          </span>
        </div>
      </div>

      {/* Copyright & Architecture Note */}
      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
        Aura Enterprise Engine &bull; High-Throughput Inventory Architecture
      </div>
    </footer>
  );
}
