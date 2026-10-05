import mongoose from 'mongoose';

const { Schema } = mongoose;

export const InvoiceStatus = Object.freeze({
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE',
});

export const PaymentStatus = Object.freeze({
  UNPAID: 'UNPAID',
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
});

const invoiceItemSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, 'item description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'item quantity is required'],
      min: [1, 'quantity must be at least 1'],
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: [true, 'item unitPrice is required'],
      min: [0, 'unitPrice cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'item total is required'],
      min: [0, 'total cannot be negative'],
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'invoiceNumber is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'clientId is required'],
      index: true,
    },
    clientInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      company: { type: String, default: 'Enterprise Client' },
      address: { type: String, default: 'Corporate Headquarters, Suite 400' },
    },
    description: {
      type: String,
      trim: true,
      default: 'Nexus Corporate Services Invoice',
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [0.01, 'amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: {
        values: Object.values(InvoiceStatus),
        message: '{VALUE} is not a supported invoice status',
      },
      default: InvoiceStatus.ISSUED,
      uppercase: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PaymentStatus),
        message: '{VALUE} is not a supported payment status',
      },
      default: PaymentStatus.UNPAID,
      uppercase: true,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    stripeEventId: {
      type: String,
      default: null,
      index: true,
    },
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptPdfPath: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Compound and lookup indexes
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export default Invoice;
