import { invoiceService } from '../services/invoiceService.js';
import { pdfService } from '../services/pdfService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function listInvoices(req, res, next) {
  try {
    const result = await invoiceService.listInvoices(req.user, req.query);
    return successResponse(res, {
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    return successResponse(res, { data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req, res, next) {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientInvoices(req, res, next) {
  try {
    // Guaranteed Client-scoped query
    const result = await invoiceService.listInvoices(req.user, req.query);
    return successResponse(res, {
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getClientInvoice(req, res, next) {
  try {
    // IDOR verified
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    return successResponse(res, { data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function getAdminStats(req, res, next) {
  try {
    const stats = await invoiceService.getAdminStats();
    return successResponse(res, { data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getClientStats(req, res, next) {
  try {
    const stats = await invoiceService.getClientStats(req.user._id);
    return successResponse(res, { data: stats });
  } catch (error) {
    next(error);
  }
}

export async function downloadInvoicePdf(req, res, next) {
  try {
    // First, verify access and IDOR permissions
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);

    // Generate fresh PDF buffer
    const pdfBuffer = await pdfService.generateReceiptBuffer(invoice);

    const safeInvoiceNumber = (invoice.invoiceNumber || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isPaid = invoice.status === 'PAID' || invoice.paymentStatus === 'PAID';
    const filename = `${isPaid ? 'Receipt' : 'Invoice'}_${safeInvoiceNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export default {
  listInvoices,
  getInvoice,
  createInvoice,
  getClientInvoices,
  getClientInvoice,
  getAdminStats,
  getClientStats,
  downloadInvoicePdf,
};
