# In-Memory Concurrency Architecture & State Specification — Sprint 19
**Application:** Aura Enterprise Engine / RapidDispatch Live Ops  
**Document Version:** 2.0.0  
**Status:** Approved for Implementation  

---

## 1. Concurrency Model Overview

RapidDispatch Live Ops uses a hybrid state design to guarantee sub-millisecond lock resolution and zero database lock-table contention:

1. **Persistent State Store (MongoDB):**
   - Stores ticket entities (ID, title, description, status, priority, customer, tags, timestamps).
   - Read/write operations use Mongoose ODM with indexed lookups.
   - Durability guaranteed across restarts.

2. **Ephemeral Concurrency Store (Node.js Heap `Map`):**
   - Stores real-time distributed editing locks.
   - Memory complexity: O(N) where N is the number of currently locked tickets (rarely exceeds active agent count).
   - Time complexity: O(1) for lock acquisition, ownership verification, and release.
   - Cleans up instantly on socket disconnect.

---

## 2. In-Memory Data Structure

The primary data structure is an in-memory `Map` encapsulated inside `TicketLockManager`:

```javascript
/**
 * In-memory map indexing active ticket locks by ticketId string.
 * @type {Map<string, LockDescriptor>}
 */
const ticketLocks = new Map();
```

### Schema of `LockDescriptor`:
```typescript
interface LockDescriptor {
  ticketId: string;       // Unique identifier of the locked ticket
  socketId: string;       // Socket.io connection ID of the lock holder
  agentId: string;        // Unique identifier of the authenticated agent
  agentName: string;      // Human-readable agent display name (e.g. 'Sarah Connor')
  lockedAt: number;       // Unix epoch timestamp (ms) when lock was granted
}
```

### Example Entry:
```javascript
ticketLocks.set("TIC-105", {
  ticketId: "TIC-105",
  socketId: "wX8qL9s1K2mZ4p7A",
  agentId: "agent-101",
  agentName: "Sarah Connor",
  lockedAt: 1728124800000
});
```

---

## 3. Lifecycle Operations & Invariants

### 3.1 Lock Acquisition (`acquireLock`)
```text
lock_ticket(ticketId, agent)
         │
         ▼
Does ticketLocks.has(ticketId)?
      ├── YES ──► Does lock.socketId === socket.id?
      │                ├── YES ──► Idempotent Success (agent already owns lock)
      │                └── NO  ──► REJECT with { error: "COLLISION", existingLock }
      │
      └── NO  ──► Create new LockDescriptor
                   ticketLocks.set(ticketId, descriptor)
                   Broadcast 'ticket_locked' to dashboard_room
                   Return { success: true, lock: descriptor }
```

### 3.2 Lock Release (`releaseLock`)
```text
unlock_ticket(ticketId)
         │
         ▼
Does ticketLocks.has(ticketId)?
      ├── NO  ──► No-op / Success (already free)
      │
      └── YES ──► Does lock.socketId === socket.id?
                       ├── YES ──► ticketLocks.delete(ticketId)
                       │           Broadcast 'ticket_unlocked' to dashboard_room
                       │           Return { success: true, released: true }
                       │
                       └── NO  ──► REJECT with { error: "UNAUTHORIZED_UNLOCK" }
```

### 3.3 Ghost Disconnect Cleanup (`releaseAllBySocket`)
```text
socket.on("disconnect")
         │
         ▼
Scan ticketLocks for all entries where lock.socketId === socket.id
         │
         ▼
Delete matching entries from ticketLocks
         │
         ▼
For each deleted ticketId:
  Broadcast 'ticket_unlocked' with { ticketId, reason: "disconnect" }
```

---

## 4. Server Restart & Crash Semantics

- **Server Restart / Crash:**
  - When the Node.js process terminates or restarts, the heap memory is naturally wiped clean.
  - All existing locks evaporate automatically.
  - When clients reconnect via Socket.io auto-reconnect, they query active locks or re-request locks.
  - No stale orphan locks can persist in the database, eliminating "deadlock-after-crash" bugs commonly caused by database flag locking.
