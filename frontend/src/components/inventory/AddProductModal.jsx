import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';

/**
 * AddProductModal Component
 * Clean enterprise dialog for adding new catalog records directly to MongoDB.
 * Form inputs: 40px height, #D1D5DB border, #0F766E teal focus ring.
 */
export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    category: 'Industrial Automation',
    price: '',
    cost: '',
    stockQuantity: '',
    reorderLevel: '50',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numPrice = Number(formData.price);
    const numCost = Number(formData.cost);
    const numStock = Number(formData.stockQuantity);
    const numReorder = Number(formData.reorderLevel);

    if (numPrice < numCost) {
      setError('Unit Price must be greater than or equal to Cost basis.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        productName: formData.productName.trim(),
        sku: formData.sku.trim().toUpperCase(),
        category: formData.category,
        price: numPrice,
        cost: numCost,
        stockQuantity: numStock,
        reorderLevel: numReorder,
      };

      const res = await api.inventory.create(payload);

      if (res && res.success) {
        onSuccess(res.data);
        onClose();
        // Reset form
        setFormData({
          productName: '',
          sku: '',
          category: 'Industrial Automation',
          price: '',
          cost: '',
          stockQuantity: '',
          reorderLevel: '50',
        });
      } else {
        const errorDetails = res?.details ? res.details.map((d) => d.message).join(', ') : res?.message;
        setError(errorDetails || 'Failed to create product record.');
      }
    } catch (err) {
      setError(err?.message || 'Network error during product creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Add Product
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
              Create a new managed SKU record in MongoDB catalog
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent' }}
            title="Close Modal"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--color-danger-bg)',
              borderBottom: '1px solid var(--color-danger-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-danger)',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                required
                className="input-control"
                placeholder="e.g. Precision Rotary Encoder Pro-900"
                value={formData.productName}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                SKU Identifier *
              </label>
              <input
                type="text"
                name="sku"
                required
                className="input-control font-mono"
                placeholder="e.g. AURA-IND-9999"
                value={formData.sku}
                onChange={handleChange}
                style={{ width: '100%', textTransform: 'uppercase' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Category *
              </label>
              <select
                name="category"
                required
                className="select-control"
                value={formData.category}
                onChange={handleChange}
                style={{ width: '100%' }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Unit Price ($) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                className="input-control tabular-nums"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Unit Cost ($) *
              </label>
              <input
                type="number"
                name="cost"
                required
                min="0"
                step="0.01"
                className="input-control tabular-nums"
                placeholder="0.00"
                value={formData.cost}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQuantity"
                required
                min="0"
                step="1"
                className="input-control tabular-nums"
                placeholder="0"
                value={formData.stockQuantity}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Reorder Level *
              </label>
              <input
                type="number"
                name="reorderLevel"
                required
                min="0"
                step="1"
                className="input-control tabular-nums"
                placeholder="50"
                value={formData.reorderLevel}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="spin-animate" />
                  Creating Product...
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
