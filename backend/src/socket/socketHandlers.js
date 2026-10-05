import { ticketLockManager } from './ticketLockManager.js';

export const DASHBOARD_ROOM = 'dashboard_room';

/**
 * Registers all Socket.io event listeners for a connected client.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSocketHandlers(io, socket) {
  // Extract agent metadata from socket handshake auth if available
  const handshakeAuth = socket.handshake.auth || {};
  let defaultAgent = {
    agentId: handshakeAuth.agentId || socket.id,
    agentName: handshakeAuth.agentName || 'Support Agent',
  };

  console.log(`[Socket] Client connected: ${socket.id} (Agent: ${defaultAgent.agentName})`);

  /**
   * join_dashboard: Client registers presence in the live ops room.
   * Immediately receives current active locks to eliminate stale local state.
   */
  socket.on('join_dashboard', (agentData, ack) => {
    socket.join(DASHBOARD_ROOM);

    if (agentData && agentData.agentName) {
      defaultAgent = {
        agentId: agentData.agentId || defaultAgent.agentId,
        agentName: agentData.agentName,
      };
    }

    const currentLocks = ticketLockManager.getAllLocks();
    socket.emit('current_locks', { locks: currentLocks });

    if (typeof ack === 'function') {
      ack({ success: true, activeLocksCount: currentLocks.length });
    }
  });

  /**
   * lock_ticket: Client requests exclusive edit lock on a ticket.
   */
  socket.on('lock_ticket', (payload = {}, ack) => {
    const ticketId = typeof payload === 'string' ? payload : payload.ticketId;
    const agent = {
      agentId: payload.agent?.agentId || defaultAgent.agentId,
      agentName: payload.agent?.agentName || defaultAgent.agentName,
    };

    if (!ticketId) {
      const errorPayload = { ticketId, error: 'MISSING_TICKET_ID', message: 'ticketId is required' };
      socket.emit('lock_rejected', errorPayload);
      if (typeof ack === 'function') ack({ success: false, ...errorPayload });
      return;
    }

    const result = ticketLockManager.acquireLock(ticketId, socket.id, agent);

    if (!result.success) {
      const rejectionPayload = {
        ticketId: ticketId.trim().toUpperCase(),
        error: result.error,
        message:
          result.error === 'COLLISION'
            ? `Ticket is currently being edited by ${result.existingLock?.agentName || 'another agent'}`
            : 'Lock acquisition failed',
        existingLock: result.existingLock,
      };

      socket.emit('lock_rejected', rejectionPayload);
      if (typeof ack === 'function') ack({ success: false, ...rejectionPayload });
      return;
    }

    const lockPayload = {
      ticketId: result.lock.ticketId,
      socketId: result.lock.socketId,
      agentId: result.lock.agentId,
      agentName: result.lock.agentName,
      lockedAt: result.lock.lockedAt,
    };

    // Broadcast lock to all clients in dashboard room
    io.to(DASHBOARD_ROOM).emit('ticket_locked', lockPayload);

    if (typeof ack === 'function') {
      ack({ success: true, lock: lockPayload });
    }
  });

  /**
   * unlock_ticket: Client releases their lock.
   */
  socket.on('unlock_ticket', (payload = {}, ack) => {
    const ticketId = typeof payload === 'string' ? payload : payload.ticketId;

    if (!ticketId) {
      if (typeof ack === 'function') ack({ success: false, error: 'MISSING_TICKET_ID' });
      return;
    }

    const result = ticketLockManager.releaseLock(ticketId, socket.id);

    if (!result.success) {
      const errorPayload = {
        ticketId: ticketId.trim().toUpperCase(),
        error: result.error,
        message: result.message || 'Cannot release lock',
        owner: result.owner,
      };

      socket.emit('lock_rejected', errorPayload);
      if (typeof ack === 'function') ack({ success: false, ...errorPayload });
      return;
    }

    // Broadcast unlock to all clients in dashboard room
    io.to(DASHBOARD_ROOM).emit('ticket_unlocked', {
      ticketId: result.ticketId,
      unlockedBy: socket.id,
      timestamp: Date.now(),
    });

    if (typeof ack === 'function') {
      ack({ success: true, ticketId: result.ticketId });
    }
  });

  /**
   * disconnect: Ghost disconnect cleanup.
   * Auto-releases all locks held by this socket and broadcasts unlock events.
   */
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    const releasedTicketIds = ticketLockManager.releaseAllBySocket(socket.id);

    if (releasedTicketIds.length > 0) {
      console.log(`[Ghost Disconnect] Auto-released ${releasedTicketIds.length} locks for ${socket.id}:`, releasedTicketIds);
      releasedTicketIds.forEach((ticketId) => {
        io.to(DASHBOARD_ROOM).emit('ticket_unlocked', {
          ticketId,
          unlockedBy: socket.id,
          reason: 'disconnect',
          timestamp: Date.now(),
        });
      });
    }
  });
}
