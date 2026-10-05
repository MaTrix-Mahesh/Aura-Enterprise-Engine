import React from 'react';

/**
 * SectionHeader Component
 * Clean enterprise page header for major application workspaces.
 * Page Title: 28px, font-weight: 700. Subtitle: 14px, muted secondary text.
 */
export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <div
      className="page-header-container"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}
    >
      <div>
        <h1
          className="page-title"
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="page-subtitle"
            style={{
              fontSize: '15px',
              color: '#64748B',
              marginTop: '6px',
              lineHeight: 1.5,
              margin: '6px 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div
          className="page-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
