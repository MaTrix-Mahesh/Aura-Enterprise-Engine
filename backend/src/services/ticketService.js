import { Ticket } from '../models/Ticket.js';

/**
 * Builds query filter for tickets from request query parameters.
 */
export function buildTicketFilter(params = {}) {
  const filter = {};

  if (params.search && typeof params.search === 'string') {
    const trimmed = params.search.trim();
    if (trimmed) {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { ticketId: { $regex: escaped, $options: 'i' } },
        { title: { $regex: escaped, $options: 'i' } },
        { customerName: { $regex: escaped, $options: 'i' } },
        { customerEmail: { $regex: escaped, $options: 'i' } },
      ];
    }
  }

  if (params.status && params.status !== 'ALL') {
    filter.status = params.status.toUpperCase();
  }

  if (params.priority && params.priority !== 'ALL') {
    filter.priority = params.priority.toUpperCase();
  }

  return filter;
}

/**
 * Generates the next sequential ticketId (e.g. TIC-101, TIC-102, ...).
 */
async function generateNextTicketId() {
  const latestTicket = await Ticket.findOne({ ticketId: /^TIC-\d+$/ })
    .sort({ createdAt: -1 })
    .select('ticketId')
    .lean();

  if (!latestTicket || !latestTicket.ticketId) {
    return 'TIC-101';
  }

  const match = latestTicket.ticketId.match(/^TIC-(\d+)$/);
  if (match) {
    const nextNumber = parseInt(match[1], 10) + 1;
    return `TIC-${nextNumber}`;
  }

  const count = await Ticket.countDocuments();
  return `TIC-${101 + count}`;
}

export const ticketService = {
  /**
   * Retrieves paginated tickets with filtering and sorting.
   */
  async listTickets(params = {}) {
    const filter = buildTicketFilter(params);
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 50, 10)));
    const skip = (page - 1) * limit;

    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Ticket.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      tickets,
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
   * Retrieves single ticket by ticketId or MongoDB _id.
   */
  async getTicketById(id) {
    let ticket = await Ticket.findOne({ ticketId: id.toUpperCase() }).lean();
    if (!ticket && id.match(/^[0-9a-fA-F]{24}$/)) {
      ticket = await Ticket.findById(id).lean();
    }
    return ticket;
  },

  /**
   * Creates a new ticket.
   */
  async createTicket(data) {
    let ticketId = data.ticketId;
    if (!ticketId) {
      ticketId = await generateNextTicketId();
    } else {
      ticketId = ticketId.toUpperCase().trim();
    }

    const newTicket = new Ticket({
      ...data,
      ticketId,
      status: (data.status || 'OPEN').toUpperCase(),
      priority: (data.priority || 'MEDIUM').toUpperCase(),
    });

    const saved = await newTicket.save();
    return saved.toObject();
  },

  /**
   * Updates an existing ticket.
   */
  async updateTicket(id, updateData) {
    const sanitizedUpdate = { ...updateData };
    if (sanitizedUpdate.status) sanitizedUpdate.status = sanitizedUpdate.status.toUpperCase();
    if (sanitizedUpdate.priority) sanitizedUpdate.priority = sanitizedUpdate.priority.toUpperCase();
    sanitizedUpdate.updatedAt = new Date();

    let updated = await Ticket.findOneAndUpdate(
      { ticketId: id.toUpperCase() },
      { $set: sanitizedUpdate },
      { new: true, runValidators: true }
    ).lean();

    if (!updated && id.match(/^[0-9a-fA-F]{24}$/)) {
      updated = await Ticket.findByIdAndUpdate(
        id,
        { $set: sanitizedUpdate },
        { new: true, runValidators: true }
      ).lean();
    }

    return updated;
  },

  /**
   * Seeds realistic initial tickets if the collection is empty.
   */
  async seedInitialTicketsIfEmpty() {
    const count = await Ticket.countDocuments();
    if (count > 0) return;

    console.log('[Seed] Populating initial RapidDispatch Live Ops tickets...');
    const seedData = [
      {
        ticketId: 'TIC-101',
        title: 'ERP Integration Webhook Timeout During Batch Sync',
        description: 'Scheduled SAP inventory sync failed with HTTP 504 Gateway Timeout on catalog warehouse node 04.',
        status: 'OPEN',
        priority: 'URGENT',
        customerName: 'Marcus Vance',
        customerEmail: 'm.vance@apexlogistics.com',
        customerCompany: 'Apex Global Logistics',
        assignedAgent: { agentId: 'agent-101', agentName: 'Sarah Connor' },
        tags: ['Integration', 'SAP', 'Urgent'],
      },
      {
        ticketId: 'TIC-102',
        title: 'Discrepancy in SKU Barcode Scanner Precision',
        description: 'Handheld Honeywell scanners reporting 13-digit EAN offset on aisle 12 automotive parts.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        customerName: 'Elena Rostova',
        customerEmail: 'e.rostova@nordicretail.eu',
        customerCompany: 'Nordic Retail Group',
        assignedAgent: { agentId: 'agent-102', agentName: 'John Reese' },
        tags: ['Hardware', 'Warehouse', 'Barcodes'],
      },
      {
        ticketId: 'TIC-103',
        title: 'CSV Bulk Export Truncation on Large Catalogs (>40k rows)',
        description: 'Customer experienced unexpected stream termination when exporting 50k item inventory over low-bandwidth branch connection.',
        status: 'OPEN',
        priority: 'MEDIUM',
        customerName: 'David Chen',
        customerEmail: 'dchen@pacificsupply.com',
        customerCompany: 'Pacific Wholesale Supply',
        assignedAgent: { agentId: null, agentName: 'Unassigned' },
        tags: ['Export', 'Data Pipeline'],
      },
      {
        ticketId: 'TIC-104',
        title: 'Multi-Tenant Permission Leakage in Role Provisioning',
        description: 'Audit log flag: Junior auditor role temporarily permitted price override preview before session invalidation.',
        status: 'WAITING',
        priority: 'HIGH',
        customerName: 'Aisha Al-Mansoor',
        customerEmail: 'aisha@falconenterprises.ae',
        customerCompany: 'Falcon Enterprises',
        assignedAgent: { agentId: 'agent-103', agentName: 'Harold Finch' },
        tags: ['Security', 'RBAC'],
      },
      {
        ticketId: 'TIC-105',
        title: 'Real-Time Stock Depletion Alert Delayed for Flash Sale SKU',
        description: 'High-velocity promotional SKU AURA-FL-992 depleted 320 units without triggering low-stock webhook notification.',
        status: 'OPEN',
        priority: 'URGENT',
        customerName: 'Gregory House',
        customerEmail: 'ghouse@princetonmed.org',
        customerCompany: 'Princeton Supply Corp',
        assignedAgent: { agentId: null, agentName: 'Unassigned' },
        tags: ['Alerts', 'Real-Time', 'Inventory'],
      },
      {
        ticketId: 'TIC-106',
        title: 'Request for Custom Reporting Aggregation Schema',
        description: 'Client requests monthly aggregate valuation report grouped by fiscal quarter and regional distributor tier.',
        status: 'RESOLVED',
        priority: 'LOW',
        customerName: 'Sophia Loren',
        customerEmail: 'sophia@bellavita.it',
        customerCompany: 'Bella Vita Distribution',
        assignedAgent: { agentId: 'agent-101', agentName: 'Sarah Connor' },
        tags: ['Reporting', 'Analytics'],
      },
    ];

    await Ticket.insertMany(seedData);
    console.log('[Seed] RapidDispatch Live Ops initial tickets seeded successfully.');
  },
};

export default ticketService;
