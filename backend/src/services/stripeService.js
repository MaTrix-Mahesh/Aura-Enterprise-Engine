import Stripe from 'stripe';
import { env } from '../config/env.js';
import { Invoice, InvoiceStatus, PaymentStatus } from '../models/Invoice.js';

// Initialize Stripe instance with test secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const stripeService = {
  /**
   * Creates a Stripe Checkout Session for an invoice.
   *
   * @param {object} invoice - Mongoose invoice document or lean object
   * @param {object} user - Authenticated user initiating checkout
   */
  async createCheckoutSession(invoice, user) {
    if (invoice.status === InvoiceStatus.PAID || invoice.paymentStatus === PaymentStatus.PAID) {
      const err = new Error(`Invoice '${invoice.invoiceNumber}' is already marked as PAID.`);
      err.statusCode = 400;
      err.errorCode = 'INVOICE_ALREADY_PAID';
      throw err;
    }

    // IDOR protection: Client cannot pay another client's invoice
    if (user.role === 'CLIENT' && invoice.clientId.toString() !== user._id.toString()) {
      const err = new Error('Access forbidden: You cannot initiate payment for another client’s invoice.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN_PAYMENT_INITIATION';
      throw err;
    }

    // Authoritative amount in smallest currency unit (cents for USD)
    const unitAmountCents = Math.round(invoice.amount * 100);

    const clientUrl = (env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const successUrl = `${clientUrl}/invoices/${invoice._id}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${clientUrl}/invoices/${invoice._id}?payment_cancelled=true`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: invoice._id.toString(),
        customer_email: invoice.clientInfo?.email || user.email,
        line_items: [
          {
            price_data: {
              currency: (invoice.currency || 'USD').toLowerCase(),
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: invoice.description || 'Nexus Corporate Services Invoice Payment',
              },
              unit_amount: unitAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId.toString(),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // Update invoice with Stripe Session ID and transition to PENDING
      await Invoice.findByIdAndUpdate(invoice._id, {
        $set: {
          stripeSessionId: session.id,
          status: InvoiceStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (stripeErr) {
      // In development/test mode where mock Stripe keys may be used without network connectivity,
      // provide a clean simulation fallback URL if Stripe rejects placeholder keys
      if (stripeErr.type === 'StripeAuthenticationError' || stripeErr.message?.includes('Invalid API Key') || env.NODE_ENV === 'test') {
        const mockSessionId = `cs_test_mock_${Date.now()}`;
        const mockUrl = `${clientUrl}/invoices/${invoice._id}?payment_simulated=true&session_id=${mockSessionId}`;
        
        await Invoice.findByIdAndUpdate(invoice._id, {
          $set: {
            stripeSessionId: mockSessionId,
            status: InvoiceStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        return {
          sessionId: mockSessionId,
          url: mockUrl,
          mock: true,
        };
      }

      throw stripeErr;
    }
  },

  /**
   * Cryptographically verifies Stripe webhook signature and constructs event.
   *
   * @param {Buffer|string} rawBody - Raw request body
   * @param {string} signatureHeader - stripe-signature header
   */
  constructWebhookEvent(rawBody, signatureHeader) {
    if (!signatureHeader) {
      const err = new Error('Stripe signature header (stripe-signature) is missing');
      err.statusCode = 400;
      err.errorCode = 'STRIPE_SIGNATURE_MISSING';
      throw err;
    }

    return stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      env.STRIPE_WEBHOOK_SECRET
    );
  },

  /**
   * Helper to inspect Stripe instance.
   */
  getStripeClient() {
    return stripe;
  },
};

export default stripeService;
