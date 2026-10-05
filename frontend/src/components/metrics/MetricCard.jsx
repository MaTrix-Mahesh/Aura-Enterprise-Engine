import React from 'react';

/**
 * MetricCard Component
 * Modern Enterprise KPI Metric Card.
 * Clean white surface, 10px radius, subtle border (#E5E7EB),
 * 28-32px high-legibility value, semantic icon container, and realistic contextual subtext.
 */
export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  accentColor = '#0D9488',
  accentBg = '#ECFDF5',
  accentBorder = '#A7F3D0',
}) {
  return (
    <div
      className="kpi-card"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px 26px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        transition: 'all 0.15s ease',
        minHeight: '148px',
      }}
    >
      {/* Top Header: Uppercase Label + Icon Container */}
      <div
        className="kpi-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <span
          className="kpi-label"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            className="kpi-icon-container"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: accentBg,
              color: accentColor,
              border: `1px solid ${accentBorder || '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
      </div>

      {/* Main KPI Number */}
      <div
        className="kpi-value tabular-nums"
        style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#0F172A',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>

      {/* Contextual Information */}
      {subtext && (
        <div
          className="kpi-subtext"
          style={{
            fontSize: '13px',
            color: '#64748B',
            marginTop: '8px',
            lineHeight: 1.4,
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
