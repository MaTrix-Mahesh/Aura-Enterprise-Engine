# Architecture Specification — RapidDispatch Live Ops (Sprint 19)
**Application:** Aura Enterprise Engine / RapidDispatch Live Ops  
**Document Version:** 2.0.0 (Sprint 19 Extension)  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Architectural Evolution

Sprint 19 builds directly upon the existing **Aura Enterprise Engine (Sprint 18)** codebase. Sprint 18 delivered a high-performance, stateless inventory management and aggregation analytics system powered by Node.js, Express, MongoDB/Mongoose, and a React/Vite enterprise dashboard.

Sprint 19 introduces **RapidDispatch Live Ops**: an enterprise real-time collaborative support-ticket system where multiple agents concurrently monitor active operational tickets, while enforcing strict single-editor concurrency locks.

### Architectural Philosophy
1. **Zero Greenfield / Zero Duplication:** The existing Express HTTP server, MongoDB connection pool, Zod validation pipelines, and React SPA structure are preserved and extended.
2. **Authoritative Backend:** The Node.js backend is the sole source of truth for all concurrency and lock state. Frontend clients never unilaterally acquire or declare locks.
3. **Hybrid State Architecture:**
   - **Persistent Business State:** Stored durably in MongoDB (Tickets, Audit logs, Products).
   - **Ephemeral Live Concurrency State:** Maintained in high-speed, thread-safe Node.js memory (`Map<ticketId, LockDescriptor>`).
4. **Resilient Event Stream:** Socket.io is attached directly to the existing HTTP server instance, multiplexed over WebSocket with automatic fallback and ghost-disconnect cleanup.

---

## 2. System Architecture Diagram

```text
                             Browser Clients
                   ┌──────────────────────────────────┐
                   │  Agent A (Tab 1)  │  Agent B (Tab 2) │
                   └─────────┬─────────┴─────────┬────────┘
                             │                   │
                 HTTPS REST  │                   │ WSS (Socket.io)
                             ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Aura Node.js + Express HTTP Server                   │
│                                                                        │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │ Express REST API       │         │ Socket.io Server Instance   │   │
│   │ - GET /api/tickets     │         │ - join_dashboard            │   │
│   │ - POST /api/tickets    │───────► │ - lock_ticket               │   │
│   │ - PUT /api/tickets/:id │ (emit)  │ - unlock_ticket             │   │
│   │ - GET /api/health      │         │ - disconnect (cleanup)      │   │
│   └───────────┬────────────┘         └──────────────┬──────────────┘   │
│               │                                     │                  │
│               ▼                                     ▼                  │
│   ┌────────────────────────┐         ┌─────────────────────────────┐   │
│   │ Mongoose ODM Layer     │         │ In-Memory Lock Manager      │   │
│   │ - Ticket Model         │         │ - ticketLocks: Map()        │   │
│   │ - Product Model        │         │ - O(1) Atomic Check & Set   │   │
│   └───────────┬────────────┘         └──────────────┬──────────────┘   │
└───────────────┼─────────────────────────────────────┼──────────────────┘
                │                                     │
                ▼                                     ▼
        ┌───────────────┐                     ┌───────────────┐
        │    MongoDB    │                     │ Real-Time     │
        │  (Persistent) │                     │ Broadcast Bus │
        └───────────────┘                     └───────────────┘
```

---

## 3. Sprint 18 Baseline vs. Sprint 19 Extensions

| Architectural Dimension | Sprint 18 Baseline | Sprint 19 Extension |
| :--- | :--- | :--- |
| **Primary Domain** | Enterprise Inventory & Catalog Analytics | RapidDispatch Live Ops Collaborative Ticketing |
| **Communication Protocol** | Stateless HTTP/REST | HTTP/REST + Socket.io (WebSocket / WSS) |
| **State Storage** | MongoDB (Persistent BSON) | MongoDB (Persistent) + In-Memory `Map` (Ephemeral Locks) |
| **Concurrency Model** | Optimistic / Single User Edit | Distributed Authoritative Backend Locking |
| **Data Synchronization** | Client-initiated Request/Response | Real-time Server Push (`ticket_locked`, `ticket_created`) |
| **Disconnect Resilience** | Stateless Request Timeout | Ghost Disconnect: Auto-release locks on socket drop |
| **Connection State UI** | Understated Periodic Poller (30s) | Live Reactive Indicator (`● Connected` / Reconnecting Banner) |

---

## 4. Socket.io Integration Architecture

### 4.1 Server-Side Binding
In `backend/src/server.js`, Socket.io is bound directly to the active Node HTTP server instance:
```javascript
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { initSocketServer } from './socket/socketServer.js';

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 25000,
});

initSocketServer(io);
```

### 4.2 Socket Namespaces and Rooms
- Standard namespace: `/`
- Shared room: `dashboard_room`
- Every agent joins `dashboard_room` upon invoking `join_dashboard`.
- Targeted broadcasts:
  - Global state changes (e.g. `ticket_locked`, `ticket_unlocked`, `ticket_created`) emit to `dashboard_room`.
  - Targeted rejection errors emit exclusively to the requesting `socket.id`.

---

## 5. Event Flow Architecture

```text
Agent A                              Backend Server                         Agent B
   │                                       │                                   │
   │─── join_dashboard ───────────────────►│                                   │
   │◄── current_locks (Sync active state) ─│                                   │
   │                                       │◄── join_dashboard ────────────────│
   │                                       │─── current_locks ────────────────►│
   │                                       │                                   │
   │─── lock_ticket(ticketId: 105) ───────►│                                   │
   │                                       │ Map.has(105)? false               │
   │                                       │ Map.set(105, { Agent A })         │
   │◄── ticket_locked(105, Agent A) ───────┼─── ticket_locked(105, Agent A) ──►│
   │   (State: You are editing)            │   (State: Locked by Agent A)      │
   │                                       │                                   │
   │                                       │◄── lock_ticket(ticketId: 105) ────│
   │                                       │ Map.has(105)? true (Owner != B)   │
   │                                       │─── lock_rejected(105, reason) ───►│
   │                                       │   (Edit remains disabled)         │
   │                                       │                                   │
   │─── PUT /api/tickets/105 (Save) ──────►│                                   │
   │    + unlock_ticket(ticketId: 105) ───►│                                   │
   │                                       │ Map.delete(105)                   │
   │◄── ticket_unlocked(105) ──────────────┼─── ticket_unlocked(105) ─────────►│
   │   (State: Unlocked)                   │   (State: Unlocked / Edit Ready)  │
```

---

## 6. Authoritative Lock Manager (`ticketLockManager.js`)

The Lock Manager encapsulates all mutation and query logic for active locks:

```javascript
class TicketLockManager {
  constructor() {
    this.locks = new Map(); // ticketId -> { socketId, agentId, agentName, lockedAt }
  }

  acquireLock(ticketId, socketId, agent) {
    if (this.locks.has(ticketId)) {
      const existing = this.locks.get(ticketId);
      if (existing.socketId === socketId) {
        return { success: true, lock: existing, idempotent: true };
      }
      return { success: false, existingLock: existing, error: 'COLLISION' };
    }

    const lock = {
      ticketId,
      socketId,
      agentId: agent.agentId || socketId,
      agentName: agent.agentName || 'Anonymous Agent',
      lockedAt: Date.now(),
    };
    this.locks.set(ticketId, lock);
    return { success: true, lock };
  }

  releaseLock(ticketId, socketId) {
    const existing = this.locks.get(ticketId);
    if (!existing) return { success: true, released: false };
    if (existing.socketId !== socketId) {
      return { success: false, error: 'UNAUTHORIZED_UNLOCK' };
    }
    this.locks.delete(ticketId);
    return { success: true, released: true, ticketId };
  }

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

  getAllLocks() {
    return Array.from(this.locks.values());
  }

  getLock(ticketId) {
    return this.locks.get(ticketId) || null;
  }
}
```

---

## 7. Ghost Disconnect Lifecycle

When a browser crashes, tab is closed, or network disconnects:
1. TCP connection terminates.
2. Socket.io triggers `socket.on('disconnect')`.
3. `releaseAllBySocket(socket.id)` runs synchronously.
4. All locks owned by that socket are deleted from memory.
5. `ticket_unlocked` is broadcast to all remaining clients in `dashboard_room`.
6. Other agents immediately see the edit button become active.

---

## 8. Frontend Architecture & React Strict Mode Safety

1. **Singleton Socket Service:** A dedicated, single-instance socket manager (`frontend/src/services/socket.js`) provides managed connection lifecycle.
2. **Listener Deduplication:** Event subscriptions in React components wrap registration in `useEffect` and return explicit unbind functions (`socket.off(...)`).
3. **Agent Identity:** Clean agent context providing simulated or real agent profiles (e.g. Agent A: Sarah Connor, Agent B: John Reese) for multi-window verification.

---

## 9. Production Deployment Architecture

- **Frontend:** Vercel (SPA fallback to `index.html`, WSS connection to backend).
- **Backend:** Render (Web Service running Node.js + Socket.io, persistent WSS connections enabled).
- **Database:** MongoDB Atlas / Local MongoDB replica-ready cluster.
