import { stripeService } from '../services/stripeService.js';
import { pdfService } from '../services/pdfService.js';
import { emailService } from '../services/emailService.js';
import { Invoice, InvoiceStatus, PaymentStatus } from '../models/Invoice.js';

/**
 * Handles incoming public Stripe Webhook events.
 * Performs cryptographic signature verification before accepting any state mutations.
 */
export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error(`[Stripe Webhook Error] Signature verification failed: ${err.message}`);
    return res.status(400).json({
      success: false,
      error: 'STRIPE_WEBHOOK_SIGNATURE_VERIFICATION_FAILED',
      message: err.message,
    });
  }

  console.log(`[Stripe Webhook] Received verified event: ${event.type} (ID: ${event.id})`);

  try {
    // Handle payment completion events
    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const sessionOrIntent = event.data.object;
      const invoiceId = sessionOrIntent.metadata?.invoiceId || sessionOrIntent.client_reference_id;
      const stripeSessionId = sessionOrIntent.id;

      let invoice = null;

      if (invoiceId) {
        invoice = await Invoice.findById(invoiceId);
      } else if (stripeSessionId) {
        invoice = await Invoice.findOne({ stripeSessionId });
      }

      if (!invoice) {
        console.warn(`[Stripe Webhook] No matching invoice found for event ${event.id} (Session/Intent: ${stripeSessionId})`);
        return res.status(200).json({ received: true, warning: 'NO_MATCHING_INVOICE' });
      }

      // 1. Idempotency Check: Avoid duplicate processing and duplicate emails
      if (invoice.status === InvoiceStatus.PAID && invoice.stripeEventId === event.id) {
        console.log(`[Stripe Webhook] Event ${event.id} already processed for ${invoice.invoiceNumber}. Skipping.`);
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      // 2. Authoritative state transition to PAID
      const paidAtDate = new Date();
      invoice.status = InvoiceStatus.PAID;
      invoice.paymentStatus = PaymentStatus.PAID;
      invoice.paidAt = paidAtDate;
      invoice.stripeEventId = event.id;
      if (sessionOrIntent.payment_intent) {
        invoice.stripePaymentIntentId = String(sessionOrIntent.payment_intent);
      } else if (event.type === 'payment_intent.succeeded') {
        invoice.stripePaymentIntentId = sessionOrIntent.id;
      }

      // 3. Generate Official PDF Receipt
      let pdfBuffer = null;
      try {
        pdfBuffer = await pdfService.generateReceiptBuffer(invoice.toObject());
        const savedPath = await pdfService.saveReceiptToDisk(invoice, pdfBuffer);
        invoice.receiptPdfPath = savedPath;
        console.log(`[Stripe Webhook] PDF receipt generated and stored for ${invoice.invoiceNumber}`);
      } catch (pdfErr) {
        console.error(`[Stripe Webhook] Failed to generate PDF receipt for ${invoice.invoiceNumber}:`, pdfErr.message);
      }

      // Save updated invoice state
      await invoice.save();
      console.log(`[Stripe Webhook] ✓ Invoice ${invoice.invoiceNumber} successfully transitioned to PAID (Event: ${event.id})`);

      // 4. Send Receipt Email via Nodemailer (Resilient: failure will not revert payment)
      if (pdfBuffer) {
        try {
          const emailResult = await emailService.sendReceiptEmail(invoice.toObject(), pdfBuffer);
          if (emailResult.sent) {
            invoice.receiptSent = true;
            await invoice.save();
            console.log(`[Stripe Webhook] ✓ Receipt email dispatched to ${invoice.clientInfo?.email}`);
          }
        } catch (emailErr) {
          console.error(`[Stripe Webhook] Could not dispatch email for ${invoice.invoiceNumber}:`, emailErr.message);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook Internal Error] ${error.message}`);
    return res.status(500).json({ success: false, error: 'WEBHOOK_PROCESSING_FAILED' });
  }
}

export default {
  handleStripeWebhook,
};
