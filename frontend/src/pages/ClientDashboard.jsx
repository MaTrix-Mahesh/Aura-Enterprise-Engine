import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PayInvoiceButton from '../components/invoices/PayInvoiceButton';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  Search,
  Building,
} from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoicesRes, statsRes] = await Promise.all([
        api.client.getInvoices({ search, status: statusFilter }),
        api.client.getStats(),
      ]);

      if (invoicesRes?.success && invoicesRes.data) {
        setInvoices(invoicesRes.data);
      }
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('[ClientDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleDownloadPdf = (invoiceId) => {
    const downloadUrl = api.invoices.getPdfUrl(invoiceId);
    window.open(downloadUrl, '_blank');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
              }}
            >
              CLIENT PORTAL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
              <Building size={14} />
              <span>{user?.company || 'Enterprise Client'}</span>
            </div>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Welcome back, {user?.name || 'Client'}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            Review, verify, and settle your corporate billing statements securely.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClientData}
          className="btn"
          style={{
            height: '40px',
            padding: '0 16px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {/* Outstanding Due */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #D97706',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Outstanding Due</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            ${Number(stats?.totalDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
            {stats?.outstandingInvoices || 0} invoice(s) pending payment
          </span>
        </div>

        {/* Total Settled */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #059669',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Total Settled</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '10px' }}>
            ${Number(stats?.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
            {stats?.paidInvoices || 0} verified paid invoice(s)
          </span>
        </div>

        {/* Total Invoices */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #0D9488',
          }}
        >
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
            Total corporate billing statements
          </span>
        </div>
      </div>

      {/* Invoices List Table Section */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* Controls Toolbar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search invoices, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px 0 36px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                color: '#334155',
                outline: 'none',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">Outstanding (ISSUED)</option>
              <option value="PAID">Settled (PAID)</option>
              <option value="PENDING">Processing (PENDING)</option>
            </select>
          </div>

          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Showing {invoices.length} statement(s)
          </span>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
                <th style={{ padding: '12px 20px' }}>INVOICE</th>
                <th style={{ padding: '12px 16px' }}>DESCRIPTION</th>
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
                    {loading ? 'Loading statements...' : 'No invoices found for this criteria.'}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr
                      key={inv._id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.description}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                        ${Number(inv.amount).toFixed(2)} {inv.currency}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            backgroundColor: isPaid ? '#ECFDF5' : '#FFFBEB',
                            color: isPaid ? '#059669' : '#D97706',
                            border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}`,
                          }}
                        >
                          {isPaid ? '✓ PAID' : 'ISSUED'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {!isPaid ? (
                            <PayInvoiceButton invoice={inv} onPaymentInitiated={fetchClientData} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(inv._id)}
                              className="btn"
                              style={{
                                height: '34px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#0F766E',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                              title="Download Official PDF Receipt"
                            >
                              <Download size={13} />
                              <span>Receipt PDF</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/invoices/${inv._id}`)}
                            className="btn"
                            style={{
                              height: '34px',
                              padding: '0 10px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#F8FAFC',
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                            title="View Statement Details"
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
    </div>
  );
}
