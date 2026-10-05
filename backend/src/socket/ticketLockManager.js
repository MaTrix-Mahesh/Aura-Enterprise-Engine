/**
 * TicketLockManager
 * In-memory distributed lock manager for RapidDispatch Live Ops.
 * Enforces atomic O(1) lock acquisitions, strictly prevents editing collisions,
 * validates lock ownership upon release, and supports ghost disconnect cleanup.
 */
export class TicketLockManager {
  constructor() {
    /**
     * Map of ticketId -> LockDescriptor
     * @type {Map<string, { ticketId: string, socketId: string, agentId: string, agentName: string, lockedAt: number }>}
     */
    this.locks = new Map();
  }

  /**
   * Attempts to acquire an exclusive lock on a ticket.
   *
   * @param {string} ticketId - Normalized ticket identifier (e.g. TIC-105)
   * @param {string} socketId - Socket connection identifier
   * @param {{ agentId: string, agentName: string }} agent - Agent identity
   * @returns {{ success: boolean, lock?: object, existingLock?: object, error?: string, idempotent?: boolean }}
   */
  acquireLock(ticketId, socketId, agent = {}) {
    if (!ticketId || typeof ticketId !== 'string') {
      return { success: false, error: 'INVALID_TICKET_ID' };
    }

    const normalizedId = ticketId.trim().toUpperCase();

    // Atomic inspect & write
    if (this.locks.has(normalizedId)) {
      const existing = this.locks.get(normalizedId);

      // Idempotency: If the same socket already owns the lock, return success
      if (existing.socketId === socketId) {
        return { success: true, lock: existing, idempotent: true };
      }

      // If another agent owns the lock, reject
      return {
        success: false,
        error: 'COLLISION',
        existingLock: {
          ticketId: existing.ticketId,
          agentId: existing.agentId,
          agentName: existing.agentName,
          lockedAt: existing.lockedAt,
        },
      };
    }

    const lockDescriptor = {
      ticketId: normalizedId,
      socketId,
      agentId: agent.agentId || socketId,
      agentName: agent.agentName || 'Support Agent',
      lockedAt: Date.now(),
    };

    this.locks.set(normalizedId, lockDescriptor);
    return { success: true, lock: lockDescriptor };
  }

  /**
   * Releases an existing lock if the caller is the legitimate lock owner.
   *
   * @param {string} ticketId - Normalized ticket identifier
   * @param {string} socketId - Socket identifier attempting release
   * @returns {{ success: boolean, released: boolean, ticketId?: string, error?: string }}
   */
  releaseLock(ticketId, socketId) {
    if (!ticketId || typeof ticketId !== 'string') {
      return { success: false, error: 'INVALID_TICKET_ID' };
    }

    const normalizedId = ticketId.trim().toUpperCase();

    if (!this.locks.has(normalizedId)) {
      // Already unlocked or never locked
      return { success: true, released: false, ticketId: normalizedId };
    }

    const existing = this.locks.get(normalizedId);

    // Strict ownership validation: Only the owning socket can unlock
    if (existing.socketId !== socketId) {
      return {
        success: false,
        error: 'UNAUTHORIZED_UNLOCK',
        message: 'Only the lock owner can release this ticket lock',
        owner: {
          agentId: existing.agentId,
          agentName: existing.agentName,
        },
      };
    }

    this.locks.delete(normalizedId);
    return { success: true, released: true, ticketId: normalizedId };
  }

  /**
   * Ghost Disconnect Handler: Releases all locks held by a disconnecting socket.
   *
   * @param {string} socketId - Socket connection identifier that dropped
   * @returns {Array<string>} List of released ticket IDs
   */
  releaseAllBySocket(socketId) {
    const releasedTicketIds = [];

    for (const [ticketId, lock] of this.locks.entries()) {
      if (lock.socketId === socketId) {
        this.locks.delete(ticketId);
        releasedTicketIds.push(ticketId);
      }
    }

    return releasedTicketIds;
  }

  /**
   * Retrieves active lock descriptor for a ticket.
   * @param {string} ticketId
   * @returns {object|null}
   */
  getLock(ticketId) {
    if (!ticketId) return null;
    return this.locks.get(ticketId.trim().toUpperCase()) || null;
  }

  /**
   * Checks if ticket is currently locked.
   * @param {string} ticketId
   * @returns {boolean}
   */
  isLocked(ticketId) {
    if (!ticketId) return false;
    return this.locks.has(ticketId.trim().toUpperCase());
  }

  /**
   * Returns all active locks as an array of safe public descriptors.
   * @returns {Array<object>}
   */
  getAllLocks() {
    return Array.from(this.locks.values()).map((lock) => ({
      ticketId: lock.ticketId,
      socketId: lock.socketId,
      agentId: lock.agentId,
      agentName: lock.agentName,
      lockedAt: lock.lockedAt,
    }));
  }

  /**
   * Clears all locks (e.g. for testing teardown).
   */
  clearAll() {
    this.locks.clear();
  }
}

// Global Singleton Instance
export const ticketLockManager = new TicketLockManager();
export default ticketLockManager;
