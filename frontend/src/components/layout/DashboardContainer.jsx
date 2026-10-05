import React from 'react';

/**
 * DashboardContainer Component
 * Centered responsive dashboard workspace with max-width: 1600px.
 */
export default function DashboardContainer({ children }) {
  return (
    <main
      style={{
        maxWidth: 'var(--max-content-width)',
        width: '100%',
        margin: '0 auto',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        flex: 1,
      }}
    >
      {children}
    </main>
  );
}
