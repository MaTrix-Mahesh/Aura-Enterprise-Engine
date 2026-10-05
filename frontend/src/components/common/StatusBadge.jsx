import React from 'react';

/**
 * StatusBadge Component
 * Semantic enterprise badge reflecting operational stock states:
 * - IN STOCK (#F0FDF4 background, #15803D text)
 * - LOW STOCK (#FFFBEB background, #B45309 text)
 * - OUT OF STOCK (#FEF2F2 background, #B91C1C text)
 * Border-radius: 6px, padding: 4px 8px. Zero neon or glow.
 */
export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase().trim();

  let bg = '#F1F5F9';
  let text = '#475569';
  let border = '#E2E8F0';
  let dot = '#94A3B8';
  let label = status;

  if (normalized === 'IN STOCK' || normalized === 'IN_STOCK' || normalized === 'OPTIMAL') {
    bg = '#ECFDF5';
    text = '#059669';
    border = '#A7F3D0';
    dot = '#10B981';
    label = 'In Stock';
  } else if (normalized === 'LOW STOCK' || normalized === 'LOW_STOCK' || normalized === 'WARNING') {
    bg = '#FFF7ED';
    text = '#EA580C';
    border = '#FED7AA';
    dot = '#F97316';
    label = 'Low Stock';
  } else if (normalized === 'OUT OF STOCK' || normalized === 'OUT_OF_STOCK' || normalized === 'CRITICAL') {
    bg = '#FEF2F2';
    text = '#EF4444';
    border = '#FECACA';
    dot = '#EF4444';
    label = 'Out of Stock';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color: text,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dot,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
