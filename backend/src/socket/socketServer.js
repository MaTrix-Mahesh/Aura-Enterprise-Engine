import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
import { registerSocketHandlers, DASHBOARD_ROOM } from './socketHandlers.js';

let ioInstance = null;

/**
 * Attaches Socket.io to the existing Node.js HTTP server.
 * Configures CORS, ping heartbeat parameters, and connection handlers.
 *
 * @param {import('http').Server} httpServer
 * @returns {SocketIOServer}
 */
export function initSocketServer(httpServer) {
  if (ioInstance) {
    return ioInstance;
  }

  // Parse CORS origins: allow frontend origin or array of origins
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((s) => s.trim());

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        // In local development, also allow localhost with any dev port
        if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS origin not allowed: ${origin}`), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  ioInstance.on('connection', (socket) => {
    registerSocketHandlers(ioInstance, socket);
  });

  console.log('[Socket.io] Real-time engine initialized and mounted on HTTP server');
  return ioInstance;
}

/**
 * Returns the active Socket.io server instance.
 * @returns {SocketIOServer|null}
 */
export function getIO() {
  return ioInstance;
}

/**
 * Broadcasts a newly created ticket to all connected dashboard agents.
 *
 * @param {object} ticket
 */
export function broadcastTicketCreated(ticket) {
  if (!ioInstance) return;
  ioInstance.to(DASHBOARD_ROOM).emit('ticket_created', {
    ticket,
    timestamp: Date.now(),
  });
}

export default {
  initSocketServer,
  getIO,
  broadcastTicketCreated,
};
