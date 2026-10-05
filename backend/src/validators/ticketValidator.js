import { z } from 'zod';

export const createTicketSchema = z.object({
  ticketId: z.string().trim().optional(),
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(5, 'Description must be at least 5 characters'),
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'], {
      invalid_type_error: 'Invalid status',
    })
    .optional()
    .default('OPEN'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
      invalid_type_error: 'Invalid priority',
    })
    .optional()
    .default('MEDIUM'),
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Customer name must be at least 2 characters'),
  customerEmail: z
    .string({ required_error: 'Customer email is required' })
    .trim()
    .email('Invalid email address'),
  customerCompany: z.string().trim().optional().default('Enterprise Client'),
  assignedAgent: z
    .object({
      agentId: z.string().nullable().optional(),
      agentName: z.string().optional(),
    })
    .optional()
    .default({ agentId: null, agentName: 'Unassigned' }),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTicketSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(5).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  customerName: z.string().trim().min(2).optional(),
  customerEmail: z.string().trim().email().optional(),
  customerCompany: z.string().trim().optional(),
  assignedAgent: z
    .object({
      agentId: z.string().nullable().optional(),
      agentName: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  status: z.enum(['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
