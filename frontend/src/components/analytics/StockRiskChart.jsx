import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

/**
 * StockRiskChart Component
 * Visualizes stock risk distribution across the catalog.
 * Clean, restrained Enterprise BI chart with light theme styling.
 */
export default function StockRiskChart({ analytics }) {
  const critical = analytics?.outOfStockCount ?? 2500;
  const low = analytics?.lowStockCount ?? 5000;
  const optimal = analytics?.healthyStockCount ?? 42501;
  const total = analytics?.totalSKUs ?? (critical + low + optimal);

  const data = [
    {
      tier: 'Optimal',
      count: optimal,
      color: '#0D9488', // Soft Teal
      subtext: 'Adequate safety stock level',
      pct: `${((optimal / total) * 100).toFixed(1)}%`,
    },
    {
      tier: 'Low Stock',
      count: low,
      color: '#F97316', // Soft Orange
      subtext: 'At or below reorder threshold',
      pct: `${((low / total) * 100).toFixed(1)}%`,
    },
    {
      tier: 'Critical',
      count: critical,
      color: '#EF4444', // Soft Red
      subtext: 'Zero available physical inventory',
      pct: `${((critical / total) * 100).toFixed(1)}%`,
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
            {item.tier} Stock
          </div>
          <div
            className="tabular-nums"
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: item.color,
              marginTop: '2px',
            }}
          >
            {item.count.toLocaleString()} SKUs ({item.pct})
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
            {item.subtext}
          </div>
        </div>
      );
    }
    return null;
  };

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
          Stock Health Distribution
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            marginTop: '4px',
            margin: '4px 0 0',
          }}
        >
          Categorization by replenishment urgency across {total.toLocaleString()} SKUs
        </p>
      </div>

      <div style={{ width: '100%', height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 32, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#F1F5F9"
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              stroke="#CBD5E1"
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="tier"
              stroke="#CBD5E1"
              tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell key={`tier-cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
