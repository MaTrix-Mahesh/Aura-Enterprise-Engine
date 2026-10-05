import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Users,
  Plus,
  FileText,
  Search,
  RefreshCw,
  Download,
  Eye,
  Building,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'clients'

  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // New Invoice form state
  const [newInvoiceData, setNewInvoiceData] = useState({
    clientId: '',
    description: 'Nexus Enterprise SLA & Services',
    currency: 'USD',
    dueDate: '',
    items: [{ description: 'Cloud Infrastructure & Managed Cluster', quantity: 1, unitPrice: 2500 }],
  });

  // New Client form state
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, invoicesRes, clientsRes] = await Promise.all([
        api.admin.getStats(),
        api.invoices.list({ search, status: statusFilter }),
        api.admin.getClients(),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (invoicesRes?.success) setInvoices(invoicesRes.data);
      if (clientsRes?.success) {
        setClients(clientsRes.data);
        if (clientsRes.data.length > 0 && !newInvoiceData.clientId) {
          setNewInvoiceData((prev) => ({ ...prev, clientId: clientsRes.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPdf = (invoiceId) => {
    const downloadUrl = api.invoices.getPdfUrl(invoiceId);
    window.open(downloadUrl, '_blank');
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const res = await api.invoices.create(newInvoiceData);
      if (res?.success) {
        setIsInvoiceModalOpen(false);
        fetchData();
      } else {
        throw new Error(res?.message || 'Invoice creation failed');
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCreateClientSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const res = await api.admin.createClient(newClientData);
      if (res?.success) {
        setIsClientModalOpen(false);
        setNewClientData({ name: '', email: '', password: '', company: '' });
        fetchData();
      } else {
        throw new Error(res?.message || 'Client creation failed');
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              ADMINISTRATION CONSOLE
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>VaultPay Financial Core</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Executive Revenue & Billing Management
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            Authoritative financial dashboard, client management, and invoice governance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="btn"
            style={{
              height: '42px',
              padding: '0 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Users size={15} color="#0D9488" />
            <span>Add Client</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="btn btn-primary"
            style={{
              height: '42px',
              padding: '0 18px',
              backgroundColor: '#0D9488',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Invoice</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="btn"
            style={{
              height: '42px',
              padding: '0 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              color: '#64748B',
              cursor: 'pointer',
            }}
            title="Refresh Financial Data"
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {/* Total Revenue */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Total Settled Revenue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            ${Number(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
            {stats?.paidInvoices || 0} invoice(s) paid
          </span>
        </div>

        {/* Outstanding Amount */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #D97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Outstanding Invoices</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            ${Number(stats?.outstandingAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
            {stats?.pendingInvoices || 0} invoice(s) pending
          </span>
        </div>

        {/* Total Clients */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Corporate Clients</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            {stats?.totalClients || 0}
          </div>
          <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500 }}>
            Registered enterprise accounts
          </span>
        </div>

        {/* Total Invoices */}
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #0D9488' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>All Invoices</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0D9488' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            {stats?.totalInvoices || 0}
          </div>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Global invoice catalog
          </span>
        </div>
      </div>

      {/* Tabs Switcher: Invoices vs Clients */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'invoices' ? 700 : 500,
            color: activeTab === 'invoices' ? '#0F766E' : '#64748B',
            borderBottom: activeTab === 'invoices' ? '2px solid #0D9488' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          All Invoices ({invoices.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'clients' ? 700 : 500,
            color: activeTab === 'clients' ? '#0F766E' : '#64748B',
            borderBottom: activeTab === 'clients' ? '2px solid #0D9488' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          Clients Directory ({clients.length})
        </button>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search invoice number, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 12px 0 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '13px', color: '#334155', outline: 'none' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Outstanding (ISSUED)</option>
                <option value="PAID">Settled (PAID)</option>
                <option value="PENDING">Processing (PENDING)</option>
              </select>
            </div>

            <span style={{ fontSize: '13px', color: '#64748B' }}>Showing {invoices.length} invoices</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                  <th style={{ padding: '12px 20px' }}>INVOICE</th>
                  <th style={{ padding: '12px 16px' }}>CLIENT / COMPANY</th>
                  <th style={{ padding: '12px 16px' }}>ISSUE DATE</th>
                  <th style={{ padding: '12px 16px' }}>DUE DATE</th>
                  <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                      {loading ? 'Loading invoices...' : 'No invoices matching query.'}
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const isPaid = inv.status === 'PAID';
                    return (
                      <tr key={inv._id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{inv.clientInfo?.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{inv.clientInfo?.company}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 16px', color: '#64748B' }}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>${Number(inv.amount).toFixed(2)} {inv.currency}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', backgroundColor: isPaid ? '#ECFDF5' : '#FFFBEB', color: isPaid ? '#059669' : '#D97706', border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}` }}>
                            {isPaid ? '✓ PAID' : inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(inv._id)}
                              className="btn"
                              style={{ height: '32px', padding: '0 10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F766E', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              title="Download Official PDF"
                            >
                              <Download size={13} />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/invoices/${inv._id}`)}
                              className="btn"
                              style={{ height: '32px', padding: '0 10px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#334155', cursor: 'pointer' }}
                              title="View Invoice Details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Clients Directory */}
      {activeTab === 'clients' && (
        <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0F172A' }}>Registered Corporate Clients</h3>
            <span style={{ fontSize: '13px', color: '#64748B' }}>{clients.length} active client accounts</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                  <th style={{ padding: '12px 20px' }}>NAME</th>
                  <th style={{ padding: '12px 16px' }}>COMPANY</th>
                  <th style={{ padding: '12px 16px' }}>EMAIL</th>
                  <th style={{ padding: '12px 16px' }}>ACCOUNT ID</th>
                  <th style={{ padding: '12px 16px' }}>REGISTERED</th>
                  <th style={{ padding: '12px 20px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>{c.name}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{c.company}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{c.email}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#64748B' }}>{c._id}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Invoice */}
      {isInvoiceModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsInvoiceModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Create Corporate Invoice</h2>
              <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Target Client Account</label>
                <select
                  required
                  value={newInvoiceData.clientId}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, clientId: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.company} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Invoice Description</label>
                <input
                  type="text"
                  required
                  value={newInvoiceData.description}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, description: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Line Item Service</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.items[0].description}
                    onChange={(e) => {
                      const updated = [...newInvoiceData.items];
                      updated[0].description = e.target.value;
                      setNewInvoiceData({ ...newInvoiceData, items: updated });
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Unit Price ($ USD)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={newInvoiceData.items[0].unitPrice}
                    onChange={(e) => {
                      const updated = [...newInvoiceData.items];
                      updated[0].unitPrice = parseFloat(e.target.value) || 0;
                      setNewInvoiceData({ ...newInvoiceData, items: updated });
                    }}
                    style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} style={{ padding: '0 16px', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={modalSubmitting} style={{ padding: '0 20px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: '#0D9488', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>
                  {modalSubmitting ? 'Creating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Client */}
      {isClientModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsClientModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Register New Client Account</h2>
              <button type="button" onClick={() => setIsClientModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Davis"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Company Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Logistics Corp"
                  value={newClientData.company}
                  onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="client@acme.com"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Initial Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newClientData.password}
                  onChange={(e) => setNewClientData({ ...newClientData, password: e.target.value })}
                  style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsClientModalOpen(false)} style={{ padding: '0 16px', height: '40px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={modalSubmitting} style={{ padding: '0 20px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: '#0D9488', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>
                  {modalSubmitting ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
