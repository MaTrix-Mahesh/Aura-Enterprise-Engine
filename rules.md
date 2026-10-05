# Engineering Rules & Architectural Invariants — Sprint 19
**Application:** Aura Enterprise Engine / RapidDispatch Live Ops  
**Document Version:** 2.0.0  
**Status:** Mandatory Governance  

---

## 1. Prime Invariants

```text
RULE 01
Do not create a new project.

RULE 02
Sprint 19 must extend Sprint 18.

RULE 03
Do not rewrite working Sprint 18 features unnecessarily.

RULE 04
Do not use polling for real-time updates.

RULE 05
Do not use setInterval for ticket synchronization.

RULE 06
Backend is the source of truth for ticket locks.

RULE 07
Frontend cannot independently decide lock ownership.

RULE 08
Only the lock owner can unlock the ticket.

RULE 09
Disconnect must release all locks owned by that socket.

RULE 10
Do not create duplicate Socket.io connections.

RULE 11
Do not create duplicate event listeners.

RULE 12
Never expose secrets or commit unencrypted credentials.

RULE 13
Production CORS must be strictly restricted to verified origins.

RULE 14
Do not break existing Sprint 18 functionality (Inventory, Catalog, Analytics).

RULE 15
Run tests and verification after every major implementation phase.
```

---

## 2. Additional Invariants for Concurrency & State

### RULE 16: Atomic Check-and-Set
Lock acquisition logic must inspect and write to the lock `Map` synchronously within the same event tick. No asynchronous pauses (`await`) between reading lock availability and setting the lock.

### RULE 17: Ghost Disconnect Completeness
The disconnect event handler must iterate through all locks and release every lock associated with the disconnecting `socket.id`. It must immediately broadcast `ticket_unlocked` for every released ticket.

### RULE 18: No Optimistic Lock Assumptions
The frontend must NOT render an editable form until receiving an explicit acknowledgment or `ticket_locked` confirmation from the server. If `lock_rejected` is received, the edit action is immediately cancelled and an error message is displayed.

### RULE 19: Safe Lock Retention on Save Failure
If an agent submits changes to `PUT /api/tickets/:id` and the database write fails (e.g. network failure or validation error), the lock MUST NOT be automatically released. The agent must retain the lock to allow retry or explicit cancellation.
