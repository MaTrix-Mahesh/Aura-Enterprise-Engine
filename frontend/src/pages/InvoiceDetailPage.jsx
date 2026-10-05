import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PayInvoiceButton from '../components/invoices/PayInvoiceButton';
import {
  FileText,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.invoices.get(id);
      if (res?.success && res.data) {
        setInvoice(res.data);
      } else {
        throw new Error(res?.message || 'Invoice could not be loaded');
      }
    } catch (err) {
      console.error('[InvoiceDetail] Load error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDownloadPdf = () => {
    const downloadUrl = api.invoices.getPdfUrl(invoice?._id || id);
    window.open(downloadUrl, '_blank');
  };

  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/client/dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', borderTopColor: '#0D9488' }} />
        <span style={{ fontSize: '13px', color: '#64748B' }}>Loading invoice statement...</span>
      </div>
    );
  }

  // Handle 403 Forbidden IDOR violation
  if (error && error.status === 403) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', backgroundColor: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '16px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          403 — Unauthorized Invoice Access
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
          Zero-Trust IDOR protection blocked your request. You cannot view invoices belonging to other corporate clients.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-primary"
          style={{ height: '40px', padding: '0 18px', backgroundColor: '#0D9488', color: '#FFFFFF', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Return to My Dashboard
        </button>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
          Invoice Not Found
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
          {error?.message || `The requested invoice '${id}' could not be located.`}
        </p>
        <button
          type="button"
          onClick={handleBack}
          style={{ height: '40px', padding: '0 18px', backgroundColor: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer' }}
        >
          Back
        </button>
      </div>
    );
  }

  const isPaid = invoice.status === 'PAID' || invoice.paymentStatus === 'PAID';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={handleBack}
          className="btn"
          style={{
            height: '38px',
            padding: '0 14px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn"
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#0F766E',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Download size={15} />
            <span>Download PDF Statement</span>
          </button>

          {!isPaid && (
            <PayInvoiceButton invoice={invoice} onPaymentInitiated={fetchInvoice} />
          )}
        </div>
      </div>

      {/* Main Invoice Card (PDF Layout Simulation) */}
      <div
        className="card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '40px 48px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0D9488', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F766E', letterSpacing: '-0.02em' }}>
                Nexus Corporate Services
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              100 Enterprise Way, Suite 800 • San Francisco, CA 94105<br />
              billing@nexus.com • www.nexus-enterprise.io
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              INVOICE STATEMENT
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', margin: '4px 0' }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: isPaid ? '#ECFDF5' : '#FFFBEB', color: isPaid ? '#059669' : '#D97706', border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}` }}>
              {isPaid ? '✓ PAID IN FULL' : 'PAYMENT DUE'}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', margin: '28px 0', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Billed To:</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{invoice.clientInfo?.name}</div>
            <div style={{ fontSize: '13px', color: '#334155' }}>{invoice.clientInfo?.company}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{invoice.clientInfo?.email}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Issue Date:</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
              {new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginTop: '10px' }}>Due Date:</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
              {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment Details:</span>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
              Method: <strong>Stripe Secure Checkout</strong>
            </div>
            {isPaid && (
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                Paid on: {new Date(invoice.paidAt || Date.now()).toLocaleDateString('en-US')}
              </div>
            )}
            {invoice.stripePaymentIntentId && (
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '2px' }}>
                Ref: {invoice.stripePaymentIntentId}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '28px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '12px', textAlign: 'left' }}>
              <th style={{ padding: '10px 0' }}>DESCRIPTION</th>
              <th style={{ padding: '10px 16px', textAlign: 'center' }}>QTY</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>UNIT PRICE</th>
              <th style={{ padding: '10px 0', textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items && invoice.items.length > 0 ? invoice.items : [{ description: invoice.description, quantity: 1, unitPrice: invoice.amount, total: invoice.amount }]).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 0', color: '#0F172A', fontWeight: 500 }}>{item.description}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748B' }}>{item.quantity}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748B' }}>${Number(item.unitPrice).toFixed(2)}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
              <span>Subtotal:</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>${Number(invoice.amount).toFixed(2)} {invoice.currency}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
              <span>Sales Tax (0%):</span>
              <span style={{ color: '#0F172A' }}>$0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#F0FDFA', borderRadius: '8px', color: '#0F766E', fontWeight: 800, fontSize: '16px', marginTop: '6px' }}>
              <span>Total:</span>
              <span>${Number(invoice.amount).toFixed(2)} {invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Prominent Green PAID Stamp if settled */}
        {isPaid && (
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              backgroundColor: '#ECFDF5',
              border: '2px solid #059669',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={28} color="#059669" />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#065F46' }}>
                  PAYMENT VERIFIED & CONFIRMED (PAID)
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  Settled through Stripe Webhook verification. Official receipt generated.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '8px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>Download PDF Receipt</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
