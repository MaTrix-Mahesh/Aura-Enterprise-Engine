import { z } from 'zod';
import { InvoiceStatus, PaymentStatus } from '../models/Invoice.js';

const invoiceItemInputSchema = z.object({
  description: z.string({ required_error: 'Item description is required' }).min(1).trim(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createInvoiceSchema = z.object({
  clientId: z
    .string({ required_error: 'clientId is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'clientId must be a valid 24-character hexadecimal MongoDB ObjectId'),
  description: z.string().optional().default('Nexus Corporate Services Invoice'),
  currency: z.string().optional().default('USD').transform((val) => val.toUpperCase().trim()),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))),
  items: z.array(invoiceItemInputSchema).min(1, 'Invoice must contain at least one line item'),
  amount: z.number().positive('Invoice total amount must be positive').optional(),
});

export const invoiceQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? val.toUpperCase() : undefined))
    .refine((val) => !val || val === 'ALL' || Object.values(InvoiceStatus).includes(val), {
      message: 'Invalid status filter value',
    }),
  paymentStatus: z
    .string()
    .optional()
    .transform((val) => (val ? val.toUpperCase() : undefined))
    .refine((val) => !val || val === 'ALL' || Object.values(PaymentStatus).includes(val), {
      message: 'Invalid paymentStatus filter value',
    }),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export default {
  createInvoiceSchema,
  invoiceQuerySchema,
};
