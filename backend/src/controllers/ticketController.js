import ticketService from '../services/ticketService.js';
import ticketLockManager from '../socket/ticketLockManager.js';
import { broadcastTicketCreated } from '../socket/socketServer.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function getTickets(req, res, next) {
  try {
    const result = await ticketService.listTickets(req.query);
    return successResponse(res, {
      data: result.tickets,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTicket(req, res, next) {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Ticket '${req.params.id}' not found`,
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    return successResponse(res, { data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req, res, next) {
  try {
    const ticket = await ticketService.createTicket(req.body);

    // Broadcast ticket_created event to all connected dashboard agents in real time
    broadcastTicketCreated(ticket);

    return successResponse(res, {
      statusCode: 201,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, {
        statusCode: 409,
        message: `Ticket with ID '${req.body.ticketId}' already exists`,
        errorCode: 'DUPLICATE_TICKET_ID',
      });
    }
    next(error);
  }
}

export async function updateTicket(req, res, next) {
  try {
    const ticket = await ticketService.updateTicket(req.params.id, req.body);
    if (!ticket) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Ticket '${req.params.id}' not found`,
        errorCode: 'TICKET_NOT_FOUND',
      });
    }
    return successResponse(res, {
      statusCode: 200,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveLocks(req, res, next) {
  try {
    const locks = ticketLockManager.getAllLocks();
    return successResponse(res, { data: locks });
  } catch (error) {
    next(error);
  }
}

export default {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getActiveLocks,
};
