import React, { useState } from 'react';
import { api } from '../../services/api';
import { CreditCard, Loader2 } from 'lucide-react';

/**
 * PayInvoiceButton Component
 * Enforces strict double-submission protection:
 * 1. Disables immediately upon click.
 * 2. Renders loading spinner and "Processing Payment...".
 * 3. Authoritatively calls backend checkout session endpoint.
 * 4. Recovers gracefully if an error occurs.
 */
export default function PayInvoiceButton({ invoice, onPaymentInitiated, disabled = false }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isAlreadyPaid = invoice?.status === 'PAID' || invoice?.paymentStatus === 'PAID';

  const handlePay = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || isAlreadyPaid || disabled) return;

    // 1. Immediately disable and set loading state to prevent double clicks
    setLoading(true);
    setErrorMsg(null);

    try {
      if (onPaymentInitiated) onPaymentInitiated();

      // 2. Call backend authoritative checkout session creation
      const res = await api.payments.createCheckoutSession(invoice._id || invoice.invoiceNumber);

      if (res && res.success && res.data?.url) {
        // Redirect to Stripe Checkout or simulated completion URL
        window.location.href = res.data.url;
      } else {
        throw new Error(res?.message || 'Could not initiate checkout session.');
      }
    } catch (err) {
      console.error('[Payment Error]', err);
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.');
      // Recover gracefully: Re-enable button after error
      setLoading(false);
    }
  };

  if (isAlreadyPaid) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#059669',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        <span>✓ PAID</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || disabled}
        className="btn btn-primary"
        style={{
          height: '38px',
          padding: '0 16px',
          backgroundColor: loading ? '#0F766E' : '#0D9488',
          color: '#FFFFFF',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          opacity: loading || disabled ? 0.75 : 1,
          boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
          transition: 'all 0.15s ease',
        }}
        title={`Pay $${Number(invoice?.amount || 0).toFixed(2)} via Stripe`}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="spinner" style={{ animation: 'spin 0.7s linear infinite' }} />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard size={15} />
            <span>Pay Invoice (${Number(invoice?.amount || 0).toFixed(2)})</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 500 }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
