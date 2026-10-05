import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';

/**
 * CreateTicketModal Component
 * Allows creation of support tickets.
 * Submits to POST /api/tickets, triggering real-time server-side broadcast
 * across all connected agent dashboards without page refresh.
 */
export default function CreateTicketModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerName: '',
    customerEmail: '',
    customerCompany: '',
    tags: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerCompany: formData.customerCompany.trim() || 'Enterprise Client',
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const response = await api.tickets.create(payload);
      if (response && response.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setErrorMessage(response?.message || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('[CreateTicketModal] Submit error:', err);
      setErrorMessage(err.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Create Incident Ticket
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Will broadcast immediately to all active agent dispatch boards
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close ticket creation modal"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              borderBottom: '1px solid #FECACA',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#B91C1C',
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label" htmlFor="create-title">
                Incident Summary / Title *
              </label>
              <input
                id="create-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. Automated Warehouse Robot Controller Packet Loss"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="create-status">
                  Initial Status
                </label>
                <select
                  id="create-status"
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="WAITING">WAITING</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="create-priority">
                  Urgency / Priority
                </label>
                <select
                  id="create-priority"
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="create-description">
                Incident Description & Context *
              </label>
              <textarea
                id="create-description"
                name="description"
                className="form-input"
                rows={3}
                placeholder="Provide detailed incident diagnostics, affected systems, and impact..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="create-customerName">
                  Reporter / Contact Name *
                </label>
                <input
                  id="create-customerName"
                  name="customerName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rachel Adams"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="create-customerEmail">
                  Contact Email *
                </label>
                <input
                  id="create-customerEmail"
                  name="customerEmail"
                  type="email"
                  className="form-input"
                  placeholder="e.g. radams@enterprise.com"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="create-customerCompany">
                  Company / Facility
                </label>
                <input
                  id="create-customerCompany"
                  name="customerCompany"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pacific Logistics"
                  value={formData.customerCompany}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="create-tags">
                  Tags (comma separated)
                </label>
                <input
                  id="create-tags"
                  name="tags"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Warehouse, Robot, HighImpact"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <span>Broadcasting...</span>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Create & Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
