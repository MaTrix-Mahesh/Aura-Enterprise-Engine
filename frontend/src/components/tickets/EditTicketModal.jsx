import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Lock, Save, AlertTriangle, Check } from 'lucide-react';

/**
 * EditTicketModal Component
 * Dedicated editing interface for the active lock owner.
 * Preserves lock throughout the session and safely releases it upon Save or Close.
 * If Save fails, lock is retained to prevent collision or data loss.
 */
export default function EditTicketModal({
  isOpen,
  ticket,
  activeAgent,
  onClose,
  onSuccess,
}) {
  if (!isOpen || !ticket) return null;

  const [formData, setFormData] = useState({
    title: ticket.title || '',
    description: ticket.description || '',
    status: ticket.status || 'OPEN',
    priority: ticket.priority || 'MEDIUM',
    customerName: ticket.customerName || '',
    customerEmail: ticket.customerEmail || '',
    customerCompany: ticket.customerCompany || '',
    tags: Array.isArray(ticket.tags) ? ticket.tags.join(', ') : '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setFormData({
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || 'OPEN',
      priority: ticket.priority || 'MEDIUM',
      customerName: ticket.customerName || '',
      customerEmail: ticket.customerEmail || '',
      customerCompany: ticket.customerCompany || '',
      tags: Array.isArray(ticket.tags) ? ticket.tags.join(', ') : '',
    });
    setErrorMessage(null);
  }, [ticket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerCompany: formData.customerCompany.trim(),
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const response = await api.tickets.update(ticket.ticketId, payload);
      if (response && response.success) {
        onSuccess(response.data);
      } else {
        setErrorMessage(response?.message || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('[EditTicketModal] Save error:', err);
      // Retain lock and warn user
      setErrorMessage(err.message || 'Network error saving ticket. Lock remains held.');
    } finally {
      setSaving(false);
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
              <Lock size={16} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Edit Ticket {ticket.ticketId}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Exclusive editing lock held by {activeAgent.agentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close editing modal and release lock"
            title="Close and release lock"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lock Notice Banner */}
        <div
          style={{
            backgroundColor: '#F0FDFA',
            borderBottom: '1px solid #99F6E4',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#0F766E',
            fontWeight: 500,
          }}
        >
          <Lock size={14} />
          <span>
            You hold the active concurrency lock. Other support agents cannot edit this ticket until you save or close.
          </span>
        </div>

        {/* Error notification if save fails */}
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
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Title */}
            <div>
              <label className="form-label" htmlFor="edit-title">
                Ticket Title
              </label>
              <input
                id="edit-title"
                name="title"
                type="text"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Status & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="WAITING">WAITING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="edit-priority">
                  Priority
                </label>
                <select
                  id="edit-priority"
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

            {/* Description */}
            <div>
              <label className="form-label" htmlFor="edit-description">
                Issue Description & Diagnostics
              </label>
              <textarea
                id="edit-description"
                name="description"
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Customer Details Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="edit-customerName">
                  Customer Contact
                </label>
                <input
                  id="edit-customerName"
                  name="customerName"
                  type="text"
                  className="form-input"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-customerEmail">
                  Email Address
                </label>
                <input
                  id="edit-customerEmail"
                  name="customerEmail"
                  type="email"
                  className="form-input"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Company & Tags Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" htmlFor="edit-customerCompany">
                  Company / Organization
                </label>
                <input
                  id="edit-customerCompany"
                  name="customerCompany"
                  type="text"
                  className="form-input"
                  value={formData.customerCompany}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-tags">
                  Tags (comma separated)
                </label>
                <input
                  id="edit-tags"
                  name="tags"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ERP, Hardware, Urgent"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
