import React, { useState, useEffect, useCallback } from 'react';
import SectionHeader from '../common/SectionHeader';
import MetricGrid from '../metrics/MetricGrid';
import StockRiskChart from '../analytics/StockRiskChart';
import CategoryValuationChart from '../analytics/CategoryValuationChart';
import InventoryPreview from './InventoryPreview';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import { api } from '../../services/api';
import { Download, Plus } from 'lucide-react';

/**
 * InventoryWorkspace Component
 * Encapsulates the Sprint 18 Inventory & Analytics management engine.
 */
export default function InventoryWorkspace() {
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states for Inventory
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch live aggregated analytics from MongoDB
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.analytics.get();
      if (res && res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshTrigger]);

  // Handle CSV export download
  const handleExport = () => {
    const exportUrl = api.inventory.getExportUrl();
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `inventory_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleProductUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setEditingProduct(null);
  };

  const inventoryHeaderActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        type="button"
        className="btn"
        style={{
          height: '44px',
          padding: '0 18px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#334155',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s ease',
        }}
        title="Export CSV Data"
        onClick={handleExport}
      >
        <Download size={16} color="#64748B" />
        <span>Export</span>
      </button>
      <button
        type="button"
        className="btn"
        style={{
          height: '44px',
          padding: '0 20px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: '#0D9488',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
          transition: 'all 0.15s ease',
        }}
        title="Add New Product"
        onClick={() => setIsAddModalOpen(true)}
      >
        <Plus size={17} strokeWidth={2.5} />
        <span>Add Product</span>
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <SectionHeader
        title="Inventory Overview"
        subtitle="Inventory performance and operational stock health across your catalog."
        actions={inventoryHeaderActions}
      />

      <MetricGrid analytics={analytics} loading={analyticsLoading} />

      <section aria-label="Visual Analytics Section">
        <div className="grid-analytics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <StockRiskChart analytics={analytics} />
          <CategoryValuationChart analytics={analytics} />
        </div>
      </section>

      <InventoryPreview
        refreshTrigger={refreshTrigger}
        onEditProduct={(product) => setEditingProduct(product)}
        onExport={handleExport}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProductCreated}
      />

      <EditProductModal
        isOpen={Boolean(editingProduct)}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={handleProductUpdated}
      />
    </div>
  );
}
