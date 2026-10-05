import React, { useState, useEffect, useCallback } from 'react';
import InventoryTablePreview from './InventoryTablePreview';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../services/api';
import { Search, RotateCcw, Download } from 'lucide-react';

/**
 * InventoryPreview Component
 * Enterprise inventory workspace with server-side 500ms debounced search,
 * category filtering, stock level filtering, price bounds, and pagination.
 */
export default function InventoryPreview({ onEditProduct, refreshTrigger, onExport }) {
  // Filter & Search states
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Data & Lifecycle states
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 50001, totalPages: 1001 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  // Catalog categories
  const categories = [
    'Industrial Automation',
    'Enterprise Networking',
    'Medical Supplies',
    'Precision Tools',
    'Safety Equipment',
    'Commercial Lighting',
    'Automotive Fleet',
    'Data Storage',
    'Power Systems',
    'Security & Surveillance',
  ];

  // Fetch inventory slice from server
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const response = await api.inventory.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        category: category || undefined,
        stockStatus: stockStatus || undefined,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        sortBy: 'lastUpdated',
        sortOrder: 'desc',
      });

      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);

      if (response && response.success) {
        setItems(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response?.message || 'Failed to retrieve catalog records.');
      }
    } catch (err) {
      setError(err?.message || 'Network error connecting to inventory endpoint.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, category, stockStatus, minPrice, maxPrice]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, stockStatus, minPrice, maxPrice]);

  // Trigger fetch when parameters or external refreshTrigger update
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshTrigger]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setCategory('');
    setStockStatus('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput || category || stockStatus || minPrice !== '' || maxPrice !== ''
  );

  return (
    <section
      className="enterprise-card"
      aria-label="Inventory Catalog Workspace"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Workspace Header */}
      <div
        style={{
          padding: '22px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            Inventory
          </h2>
          <span
            className="tabular-nums"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#0D9488',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '3px 12px',
              borderRadius: '9999px',
              letterSpacing: '0.02em',
            }}
          >
            {pagination.total > 0 ? `${pagination.total.toLocaleString()} products` : 'Loading...'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            className="tabular-nums font-mono"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748B',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '6px 12px',
              borderRadius: '8px',
            }}
          >
            Query Latency: {latencyMs !== null ? `${latencyMs}ms` : '—'}
          </span>

          {onExport && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onExport}
              title="Export Current Filtered View to CSV"
              style={{
                height: '38px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <Download size={14} color="#64748B" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean 44px Toolbar */}
      <div
        className="toolbar-wrapper"
        style={{
          padding: '16px 28px',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Bar with 500ms debounce */}
        <div style={{ position: 'relative', width: '360px', maxWidth: '100%' }}>
          <Search
            size={16}
            color="#94A3B8"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-control"
            placeholder="Search products, SKU, category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '40px',
              paddingRight: '52px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              fontSize: '14px',
              color: '#0F172A',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
          />
          <span
            className="kbd-badge"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              padding: '2px 6px',
              borderRadius: '5px',
            }}
          >
            ⌘ K
          </span>
        </div>

        {/* Filters Controls Toolbar */}
        <div
          className="filter-controls"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
        >
          {/* Category Dropdown */}
          <select
            className="select-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              height: '44px',
              minWidth: '175px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              fontSize: '13px',
              color: '#334155',
              padding: '0 14px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Level Dropdown */}
          <select
            className="select-control"
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            style={{
              height: '44px',
              minWidth: '165px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              fontSize: '13px',
              color: '#334155',
              padding: '0 14px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
            }}
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; Reorder)</option>
            <option value="low_stock">Low Stock (≤ Reorder)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Price Range Filter Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              className="input-control tabular-nums"
              placeholder="Min $"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                height: '44px',
                width: '88px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                textAlign: 'right',
                padding: '0 12px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            />
            <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600 }}>–</span>
            <input
              type="number"
              className="input-control tabular-nums"
              placeholder="Max $"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                height: '44px',
                width: '88px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                textAlign: 'right',
                padding: '0 12px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              title="Reset all filters"
              style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Data Grid Table */}
      <InventoryTablePreview
        items={items}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onRetry={fetchInventory}
        onEditProduct={onEditProduct}
      />
    </section>
  );
}
