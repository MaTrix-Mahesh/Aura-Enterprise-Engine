import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

/**
 * EditProductModal Component
 * Enterprise dialog for modifying existing product details in MongoDB.
 */
export default function EditProductModal({ isOpen, product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    cost: '',
    stockQuantity: '',
    reorderLevel: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        price: product.price !== undefined ? product.price : '',
        cost: product.cost !== undefined ? product.cost : '',
        stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : '',
        reorderLevel: product.reorderLevel !== undefined ? product.reorderLevel : '',
      });
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

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
        price: numPrice,
        cost: numCost,
        stockQuantity: numStock,
        reorderLevel: numReorder,
      };

      const res = await api.inventory.update(product._id, payload);

      if (res && res.success) {
        onSuccess(res.data);
        onClose();
      } else {
        const errorDetails = res?.details ? res.details.map((d) => d.message).join(', ') : res?.message;
        setError(errorDetails || 'Failed to update product record.');
      }
    } catch (err) {
      setError(err?.message || 'Network error updating product.');
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
              Edit Product SKU
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
              Updating <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.sku}</span> &bull; {product.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent' }}
            title="Close"
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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
                Product Name
              </label>
              <input
                type="text"
                name="productName"
                required
                className="input-control"
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
                Unit Price ($)
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                className="input-control tabular-nums"
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
                Unit Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                required
                min="0"
                step="0.01"
                className="input-control tabular-nums"
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
                Stock Quantity
              </label>
              <input
                type="number"
                name="stockQuantity"
                required
                min="0"
                step="1"
                className="input-control tabular-nums"
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
                Reorder Threshold
              </label>
              <input
                type="number"
                name="reorderLevel"
                required
                min="0"
                step="1"
                className="input-control tabular-nums"
                value={formData.reorderLevel}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
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
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
