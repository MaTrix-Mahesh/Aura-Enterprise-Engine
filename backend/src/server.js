import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketServer } from './socket/socketServer.js';
import ticketService from './services/ticketService.js';

let server;
let io;

/**
 * Bootstraps the Aura Enterprise Engine & RapidDispatch Live Ops server.
 * Enforces strict startup order: Config -> Database -> Seeds -> Socket.io & HTTP Listen.
 *
 * @returns {Promise<import('http').Server>}
 */
export async function startServer() {
  try {
    // 1. Establish database connection pool
    console.log('[Bootstrap] Initializing MongoDB connection...');
    await connectDB();

    // 2. Ensure initial tickets exist for live ops concurrency testing
    await ticketService.seedInitialTicketsIfEmpty();

    // 3. Create unified Node HTTP server with Express app
    server = http.createServer(app);

    // 4. Attach Socket.io real-time engine to HTTP server
    io = initSocketServer(server);

    // 5. Start HTTP and WebSocket listener
    return new Promise((resolve) => {
      server.listen(env.PORT, () => {
        console.log(`[Bootstrap] Aura Enterprise Engine / RapidDispatch Live Ops listening on port ${env.PORT} (${env.NODE_ENV})`);
        console.log(`[Bootstrap] Health endpoint active at http://localhost:${env.PORT}/api/health`);
        console.log(`[Bootstrap] Live Ops tickets active at http://localhost:${env.PORT}/api/tickets`);
        console.log(`[Bootstrap] WebSocket server mounted at ws://localhost:${env.PORT}`);
        resolve(server);
      });
    });

  } catch (error) {
    console.error(`[Bootstrap Fatal Error] Server startup aborted: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the HTTP server, Socket.io, and database connection pool.
 */
export async function closeServer() {
  if (io) {
    io.close();
    console.log('[Shutdown] Socket.io server closed');
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('[Shutdown] HTTP server closed cleanly');
  }
  await disconnectDB();
}

// Process error resilience listeners
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

// Graceful shutdown listeners
process.on('SIGINT', async () => {
  console.log('\n[Shutdown] Received SIGINT. Closing HTTP server and database pool...');
  await closeServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Shutdown] Received SIGTERM. Closing HTTP server and database pool...');
  await closeServer();
  process.exit(0);
});

// Auto-start when executed directly
startServer();

export { app, server };
export default startServer;
