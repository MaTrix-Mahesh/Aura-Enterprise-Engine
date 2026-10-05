import { Router } from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getActiveLocks,
} from '../controllers/ticketController.js';
import { validate } from '../middleware/validate.js';
import {
  createTicketSchema,
  updateTicketSchema,
  ticketQuerySchema,
} from '../validators/ticketValidator.js';

const router = Router();

// 1. Get active in-memory locks
router.get('/locks', getActiveLocks);

// 2. List paginated, filtered tickets
router.get('/', validate(ticketQuerySchema, 'query'), getTickets);

// 3. Create a new support ticket
router.post('/', validate(createTicketSchema, 'body'), createTicket);

// 4. Retrieve single ticket by ID
router.get('/:id', getTicket);

// 5. Update ticket details
router.put('/:id', validate(updateTicketSchema, 'body'), updateTicket);

export default router;
