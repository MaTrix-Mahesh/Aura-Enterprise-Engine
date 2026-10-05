import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * CategoryValuationChart Component
 * Visualizes total asset valuation breakdown across primary product categories.
 * Implements a high-clarity horizontal ranked bar chart with exact values and percentages.
 */
export default function CategoryValuationChart({ analytics }) {
  const totalValuation = analytics?.totalInventoryValue || 1;
  const rawList = analytics?.categoryValuation?.length > 0
    ? analytics.categoryValuation
    : [
        { category: 'Security & Surveillance', valuation: 2994386066.38 },
        { category: 'Automotive Fleet', valuation: 2936958240.45 },
        { category: 'Power Systems', valuation: 2916923775.81 },
        { category: 'Commercial Lighting', valuation: 2906443836.50 },
        { category: 'Data Storage', valuation: 2892042275.68 },
      ];

  // Take top 5 categories and compute percentage share
  const top5 = rawList.slice(0, 5);
  const maxVal = Math.max(...top5.map((c) => c.valuation || 0), 1);

  // Soft enterprise palette (Teal, Green, Orange, Slate, Purple)
  const barColors = ['#0D9488', '#10B981', '#F97316', '#64748B', '#8B5CF6'];

  // Format valuation cleanly for display ($2.99B)
  const formatVal = (val) => {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return formatCurrency(val);
  };

  const totalFormatted = totalValuation >= 1000000000
    ? `$${(totalValuation / 1000000000).toFixed(2)}B`
    : `$${(totalValuation / 1000000).toFixed(2)}M`;

  return (
    <div
      className="enterprise-card"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        padding: '26px 28px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '19px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.015em',
            margin: 0,
          }}
        >
          Category Valuation
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            marginTop: '4px',
            margin: '4px 0 0',
          }}
        >
          Capital allocation across top sectors ({totalFormatted} total valuation basis)
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          justifyContent: 'center',
          height: '230px',
        }}
      >
        {top5.map((item, idx) => {
          const val = item.valuation || 0;
          const pct = ((val / totalValuation) * 100).toFixed(1);
          const barWidthPct = Math.max(12, Math.round((val / maxVal) * 100));
          const color = barColors[idx % barColors.length];

          return (
            <div key={item.category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: '#1E293B',
                      fontWeight: 600,
                      maxWidth: '240px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <div className="tabular-nums" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>
                    {formatVal(val)}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '13px', width: '44px', textAlign: 'right', fontWeight: 500 }}>
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${barWidthPct}%`,
                    backgroundColor: color,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
