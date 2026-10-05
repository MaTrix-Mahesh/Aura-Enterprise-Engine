import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/formatters';
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Edit2,
  Eye,
} from 'lucide-react';

/**
 * InventoryTablePreview Component
 * Enterprise Data Grid with server-side pagination, smart page windowing,
 * loading overlays, empty states, and dropdown action menu.
 */
export default function InventoryTablePreview({
  items = [],
  loading = false,
  error = null,
  pagination = { page: 1, limit: 50, total: 0, totalPages: 1 },
  onPageChange,
  onRetry,
  onEditProduct,
}) {
  const { page = 1, limit = 50, total = 0, totalPages = 1 } = pagination;

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close action dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  // Determine stock status pill
  const getProductStatus = (product) => {
    if (product.stockQuantity === 0) return 'OUT OF STOCK';
    if (product.stockQuantity <= product.reorderLevel) return 'LOW STOCK';
    return 'IN STOCK';
  };

  // Generate clean smart page numbers (e.g. 1, 2, 3 ... 1000)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div>
      <div className="table-container" style={{ position: 'relative', minHeight: '340px' }}>
        {/* Loading Overlay */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              backdropFilter: 'blur(1.5px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              <RefreshCw size={16} className="spin-animate" color="var(--color-primary)" />
              <span>Retrieving catalog data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--color-danger)',
              minHeight: '280px',
            }}
          >
            <AlertCircle size={32} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{error}</span>
            {onRetry && (
              <button className="btn btn-secondary" onClick={onRetry}>
                <RefreshCw size={13} />
                Retry Request
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!error && !loading && items.length === 0 && (
          <div
            style={{
              padding: '64px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              minHeight: '280px',
            }}
          >
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No inventory records found
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Try adjusting your search criteria, category selection, or price filters.
            </p>
          </div>
        )}

        {/* Data Grid Table with Sticky Header and Polished Enterprise Rows */}
        {(!error || items.length > 0) && (
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <table
              className="enterprise-table"
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th
                    style={{
                      width: '140px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    SKU
                  </th>
                  <th
                    style={{
                      minWidth: '280px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    PRODUCT
                  </th>
                  <th
                    style={{
                      width: '180px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    CATEGORY
                  </th>
                  <th
                    className="text-right"
                    style={{
                      width: '110px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'right',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    SELL PRICE
                  </th>
                  <th
                    className="text-right"
                    style={{
                      width: '100px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'right',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    COST
                  </th>
                  <th
                    className="text-right"
                    style={{
                      width: '90px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'right',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    STOCK
                  </th>
                  <th
                    className="text-right"
                    style={{
                      width: '120px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'right',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    REORDER LEVEL
                  </th>
                  <th
                    className="text-center"
                    style={{
                      width: '140px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'center',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    STATUS
                  </th>
                  <th
                    style={{
                      width: '120px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    UPDATED
                  </th>
                  <th
                    className="text-center"
                    style={{
                      width: '70px',
                      padding: '16px 20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      textAlign: 'center',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p._id || p.sku}
                    style={{
                      transition: 'background-color 150ms ease',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* SKU Column */}
                    <td
                      className="font-mono tabular-nums"
                      style={{
                        padding: '18px 20px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#475569',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {p.sku}
                    </td>

                    {/* Product Name Column */}
                    <td
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#0F172A',
                          lineHeight: 1.4,
                          maxWidth: '360px',
                          wordBreak: 'break-word',
                        }}
                      >
                        {p.productName}
                      </div>
                    </td>

                    {/* Category Column */}
                    <td
                      style={{
                        padding: '18px 20px',
                        fontSize: '14px',
                        color: '#475569',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {p.category}
                    </td>

                    {/* Sell Price Column */}
                    <td
                      className="tabular-nums text-right"
                      style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0F172A',
                        textAlign: 'right',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {formatCurrency(p.price)}
                    </td>

                    {/* Cost Column */}
                    <td
                      className="tabular-nums text-right"
                      style={{
                        padding: '18px 20px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#64748B',
                        textAlign: 'right',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {formatCurrency(p.cost)}
                    </td>

                    {/* Stock Column */}
                    <td
                      className="tabular-nums text-right"
                      style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0F172A',
                        textAlign: 'right',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {formatNumber(p.stockQuantity)}
                    </td>

                    {/* Reorder Level Column */}
                    <td
                      className="tabular-nums text-right"
                      style={{
                        padding: '18px 20px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#64748B',
                        textAlign: 'right',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {formatNumber(p.reorderLevel)}
                    </td>

                    {/* Status Badge Column */}
                    <td
                      className="text-center"
                      style={{
                        padding: '18px 20px',
                        textAlign: 'center',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <StatusBadge status={getProductStatus(p)} />
                    </td>

                    {/* Updated Column */}
                    <td
                      style={{
                        padding: '18px 20px',
                        fontSize: '13px',
                        color: '#64748B',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {formatRelativeTime(p.lastUpdated)}
                    </td>

                    {/* Action Button Column */}
                    <td
                      className="text-center"
                      style={{
                        padding: '18px 20px',
                        textAlign: 'center',
                        position: 'relative',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label={`Actions for ${p.sku}`}
                        onClick={() => setActiveMenuId(activeMenuId === p._id ? null : p._id)}
                        title="Item Actions"
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#64748B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === p._id && (
                        <div
                          ref={menuRef}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '56px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
                            zIndex: 50,
                            minWidth: '140px',
                            padding: '6px',
                            textAlign: 'left',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              if (onEditProduct) onEditProduct(p);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              padding: '9px 12px',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#1E293B',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              transition: 'background-color 0.1s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDFA')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Edit2 size={14} color="#0D9488" />
                            <span>Edit Product</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              alert(`SKU: ${p.sku}\nProduct: ${p.productName}\nCategory: ${p.category}\nStock: ${p.stockQuantity} units\nReorder Level: ${p.reorderLevel}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              padding: '9px 12px',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: '#1E293B',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              transition: 'background-color 0.1s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Eye size={14} color="#64748B" />
                            <span>View Details</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Console */}
      <div
        className="pagination-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          fontSize: '13px',
          color: '#64748B',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Record Information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Showing</span>
          <span className="tabular-nums" style={{ color: '#0F172A', fontWeight: 700 }}>
            {startIdx.toLocaleString()}–{endIdx.toLocaleString()}
          </span>
          <span>of</span>
          <span className="tabular-nums" style={{ color: '#0F172A', fontWeight: 700 }}>
            {total.toLocaleString()}
          </span>
          <span>products</span>
        </div>

        {/* Clean Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="page-btn"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange && onPageChange(page - 1)}
            aria-label="Previous Page"
          >
            <ChevronLeft size={15} />
            <span style={{ marginLeft: '4px' }}>Prev</span>
          </button>

          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: '0 6px', color: 'var(--text-muted)', fontSize: '13px' }}
                >
                  ...
                </span>
              );
            }

            const isCurrent = pageNum === page;
            return (
              <button
                key={pageNum}
                className={`page-btn ${isCurrent ? 'active' : ''}`}
                onClick={() => onPageChange && onPageChange(pageNum)}
                disabled={loading}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange && onPageChange(page + 1)}
            aria-label="Next Page"
          >
            <span style={{ marginRight: '4px' }}>Next</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
