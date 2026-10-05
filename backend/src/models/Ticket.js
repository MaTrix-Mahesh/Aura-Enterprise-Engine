import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Ticket Mongoose Schema for RapidDispatch Live Ops (Sprint 19).
 * Represents persistent support ticket data within MongoDB.
 * Note: Real-time concurrency locks are kept strictly in-memory (Map)
 * on the Node server and are NOT persisted here.
 */
const ticketSchema = new Schema(
  {
    ticketId: {
      type: String,
      required: [true, 'ticketId is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [3, 'title must be at least 3 characters'],
      maxlength: [200, 'title must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'],
        message: '{VALUE} is not a supported ticket status',
      },
      default: 'OPEN',
      uppercase: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a supported priority level',
      },
      default: 'MEDIUM',
      uppercase: true,
    },
    customerName: {
      type: String,
      required: [true, 'customerName is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'customerEmail is required'],
      trim: true,
      lowercase: true,
    },
    customerCompany: {
      type: String,
      trim: true,
      default: 'Enterprise Client',
    },
    assignedAgent: {
      agentId: { type: String, default: null },
      agentName: { type: String, default: 'Unassigned' },
    },
    tags: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Indexes for fast lookup, sorting, and filtering
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text', customerName: 'text' });

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export default Ticket;
