import { invoiceService } from '../services/invoiceService.js';
import { stripeService } from '../services/stripeService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Creates Stripe Checkout Session for an authenticated client.
 * Server authoritatively looks up invoice and amounts from the database.
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId || typeof invoiceId !== 'string') {
      return errorResponse(res, {
        statusCode: 400,
        message: 'invoiceId is required to create a payment checkout session',
        errorCode: 'MISSING_INVOICE_ID',
      });
    }

    // 1. Authoritative lookup with IDOR check
    const invoice = await invoiceService.getInvoiceById(invoiceId, req.user);

    // 2. Create Stripe Checkout Session
    const sessionResult = await stripeService.createCheckoutSession(invoice, req.user);

    return successResponse(res, {
      statusCode: 200,
      message: 'Checkout session created successfully',
      data: sessionResult,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  createCheckoutSession,
};
