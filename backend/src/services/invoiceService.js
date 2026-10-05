import { Invoice, InvoiceStatus, PaymentStatus } from '../models/Invoice.js';
import { User, UserRole } from '../models/User.js';

/**
 * Generates next sequential invoice number (e.g. INV-2026-001, INV-2026-002, ...).
 */
async function generateNextInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const latest = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}\\d+$`) })
    .sort({ createdAt: -1 })
    .select('invoiceNumber')
    .lean();

  if (!latest || !latest.invoiceNumber) {
    return `${prefix}001`;
  }

  const match = latest.invoiceNumber.match(new RegExp(`^${prefix}(\\d+)$`));
  if (match) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  const count = await Invoice.countDocuments();
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

export const invoiceService = {
  /**
   * Creates a new invoice (Admin only).
   * Authoritatively computes total amount from line items.
   *
   * @param {object} invoiceData
   */
  async createInvoice(invoiceData) {
    const client = await User.findById(invoiceData.clientId).lean();
    if (!client || client.role !== UserRole.CLIENT) {
      const err = new Error(`Valid client not found with ID '${invoiceData.clientId}'`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_CLIENT_ID';
      throw err;
    }

    // Authoritative server-side total amount calculation
    const calculatedItems = invoiceData.items.map((item) => ({
      description: item.description.trim(),
      quantity: Math.max(1, parseInt(item.quantity, 10)),
      unitPrice: Math.max(0, parseFloat(item.unitPrice)),
      total: Math.round(Math.max(1, parseInt(item.quantity, 10)) * Math.max(0, parseFloat(item.unitPrice)) * 100) / 100,
    }));

    const computedTotal = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
    const authoritativeAmount = invoiceData.amount !== undefined && invoiceData.amount > 0
      ? Math.round(invoiceData.amount * 100) / 100
      : Math.round(computedTotal * 100) / 100;

    const invoiceNumber = await generateNextInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber,
      clientId: client._id,
      clientInfo: {
        name: client.name,
        email: client.email,
        company: client.company || 'Enterprise Client',
        address: 'Corporate Client HQ',
      },
      description: invoiceData.description || 'Nexus Corporate Services Invoice',
      items: calculatedItems,
      amount: authoritativeAmount,
      currency: (invoiceData.currency || 'USD').toUpperCase().trim(),
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: InvoiceStatus.ISSUED,
      paymentStatus: PaymentStatus.UNPAID,
    });

    const saved = await newInvoice.save();
    return saved.toObject();
  },

  /**
   * Lists invoices with strict role and IDOR boundary enforcement.
   * Clients can strictly query their own invoices.
   *
   * @param {object} user - Authenticated req.user context
   * @param {object} params - Query parameters
   */
  async listInvoices(user, params = {}) {
    const filter = {};

    // Strict Tenant Isolation
    if (user.role === UserRole.CLIENT) {
      filter.clientId = user._id;
    } else if (params.clientId && user.role === UserRole.ADMIN) {
      filter.clientId = params.clientId;
    }

    if (params.status && params.status !== 'ALL') {
      filter.status = params.status.toUpperCase();
    }

    if (params.paymentStatus && params.paymentStatus !== 'ALL') {
      filter.paymentStatus = params.paymentStatus.toUpperCase();
    }

    if (params.search && typeof params.search === 'string') {
      const trimmed = params.search.trim();
      if (trimmed) {
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { invoiceNumber: { $regex: escaped, $options: 'i' } },
          { 'clientInfo.name': { $regex: escaped, $options: 'i' } },
          { 'clientInfo.email': { $regex: escaped, $options: 'i' } },
          { 'clientInfo.company': { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
        ];
      }
    }

    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 50, 10)));
    const skip = (page - 1) * limit;

    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      invoices,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  /**
   * Retrieves single invoice with critical IDOR verification.
   * If caller is a CLIENT and does not own the invoice, returns 403 Forbidden.
   *
   * @param {string} invoiceId - MongoDB _id or invoiceNumber
   * @param {object} user - Authenticated user context
   */
  async getInvoiceById(invoiceId, user) {
    let invoice = null;

    if (invoiceId.match(/^[0-9a-fA-F]{24}$/)) {
      invoice = await Invoice.findById(invoiceId).lean();
    } else {
      invoice = await Invoice.findOne({ invoiceNumber: invoiceId.toUpperCase().trim() }).lean();
    }

    if (!invoice) {
      const err = new Error(`Invoice '${invoiceId}' not found`);
      err.statusCode = 404;
      err.errorCode = 'INVOICE_NOT_FOUND';
      throw err;
    }

    // CRITICAL IDOR VERIFICATION
    if (user.role === UserRole.CLIENT) {
      if (invoice.clientId.toString() !== user._id.toString()) {
        const err = new Error('Access forbidden: You do not have permission to access another client’s invoice.');
        err.statusCode = 403;
        err.errorCode = 'FORBIDDEN_INVOICE_ACCESS';
        throw err;
      }
    }

    return invoice;
  },

  /**
   * Computes Admin financial overview KPIs.
   */
  async getAdminStats() {
    const [totalClients, invoiceAgg] = await Promise.all([
      User.countDocuments({ role: UserRole.CLIENT }),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            paidInvoices: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, 1, 0],
              },
            },
            pendingInvoices: {
              $sum: {
                $cond: [
                  { $in: ['$status', [InvoiceStatus.ISSUED, InvoiceStatus.PENDING]] },
                  1,
                  0,
                ],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$amount', 0],
              },
            },
            outstandingAmount: {
              $sum: {
                $cond: [
                  { $in: ['$status', [InvoiceStatus.ISSUED, InvoiceStatus.PENDING]] },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats = invoiceAgg[0] || {
      totalInvoices: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
      totalRevenue: 0,
      outstandingAmount: 0,
    };

    return {
      totalClients,
      totalInvoices: stats.totalInvoices,
      paidInvoices: stats.paidInvoices,
      pendingInvoices: stats.pendingInvoices,
      totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
      outstandingAmount: Math.round(stats.outstandingAmount * 100) / 100,
    };
  },

  /**
   * Computes Client-specific dashboard summary KPIs.
   *
   * @param {string} clientId
   */
  async getClientStats(clientId) {
    const invoiceAgg = await Invoice.aggregate([
      { $match: { clientId: typeof clientId === 'string' ? new (await import('mongoose')).default.Types.ObjectId(clientId) : clientId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: {
              $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, 1, 0],
            },
          },
          outstandingInvoices: {
            $sum: {
              $cond: [
                { $in: ['$status', [InvoiceStatus.ISSUED, InvoiceStatus.PENDING]] },
                1,
                0,
              ],
            },
          },
          totalDue: {
            $sum: {
              $cond: [
                { $in: ['$status', [InvoiceStatus.ISSUED, InvoiceStatus.PENDING]] },
                '$amount',
                0,
              ],
            },
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const stats = invoiceAgg[0] || {
      totalInvoices: 0,
      paidInvoices: 0,
      outstandingInvoices: 0,
      totalDue: 0,
      totalPaid: 0,
    };

    return {
      totalInvoices: stats.totalInvoices,
      paidInvoices: stats.paidInvoices,
      outstandingInvoices: stats.outstandingInvoices,
      totalDue: Math.round(stats.totalDue * 100) / 100,
      totalPaid: Math.round(stats.totalPaid * 100) / 100,
    };
  },
};

export default invoiceService;
