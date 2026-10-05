# Engineering Log & Architecture Decision Records (ADR) — Sprint 19
**Application:** Aura Enterprise Engine / RapidDispatch Live Ops  
**Document Version:** 2.0.0  
**Status:** Living Engineering Record  

---

## 1. Context & Architectural Assessment

During the Sprint 18 codebase audit, we verified the following core components:
- `backend/src/server.js`: Standard Express listener on `PORT` (default 5000), using Mongoose 9.x and Zod validation.
- `backend/src/app.js`: Express application instance with Helmet, CORS, and request logger.
- `frontend/src/`: React 18 SPA built with Vite, utilizing vanilla CSS custom properties in `index.css` and Lucide icons.
- Development instances were already active on ports 5000 and 5173.

---

## 2. Key Architecture Decision Records (ADR)

### ADR-01: Extending the Existing Codebase (No Greenfield)
- **Decision:** Reject any temptation to create a separate application or separate package.json.
- **Rationale:** Conforms strictly to Rule 01 and Rule 02. The existing database connection pool, API response envelopes, error handling middleware, and layout components are preserved intact.

### ADR-02: Socket.io Server Attachment to Existing HTTP Server
- **Decision:** Refactor `backend/src/server.js` from `app.listen(...)` to `http.createServer(app)` and bind Socket.io to that shared HTTP server instance.
- **Rationale:** Allows unified port usage (5000) for both HTTP REST endpoints (`/api/*`) and WebSocket connections (`/socket.io/*`), simplifying CORS, reverse proxies, and deployment topology.

### ADR-03: In-Memory `Map` vs Database Lock Collection
- **Decision:** Utilize an in-memory `Map` (`ticketLocks`) for concurrency lock management instead of writing locks to MongoDB.
- **Rationale:** 
  1. Acquisition and verification operate in sub-microsecond O(1) time without database I/O.
  2. Process crashes or server restarts automatically clear stale locks without leaving orphan database flags.
  3. Ghost disconnect cleanup occurs immediately without database write latency.

### ADR-04: React Strict Mode & Listener De-duplication
- **Decision:** Wrap all socket event listener bindings in clean teardown closures in `useEffect`:
  ```javascript
  useEffect(() => {
    const handleLocked = (data) => { ... };
    socket.on('ticket_locked', handleLocked);
    return () => {
      socket.off('ticket_locked', handleLocked);
    };
  }, []);
  ```
- **Rationale:** In React 18 development mode, Strict Mode mounts, unmounts, and re-mounts components. Clean `socket.off` unsubscribes ensure listeners are never executed twice.

### ADR-05: Agent Persona Switcher for Multi-Window Concurrency
- **Decision:** Integrate a lightweight Agent Persona Selector in the top bar (`Agent A: Sarah Connor`, `Agent B: John Reese`, `Agent C: Harold Finch`), stored in browser local storage and passed during the socket handshake.
- **Rationale:** Allows simultaneous testing of collision prevention across two side-by-side browser tabs without requiring complex multi-user authentication login forms.

### ADR-06: Unified Reactive Socket Status Subscription
- **Decision:** Expose a centralized `subscribeConnectionStatus` from `frontend/src/services/socket.js` consumed by `AppLayout`, `Topbar`, and `TicketBoard`.
- **Rationale:** Ensures that network disconnection or server restart instantly toggles the Topbar status badge (`Connected` vs `Connection Lost: Reconnecting...`) and displays the sticky `ConnectionBanner` synchronously across the entire application shell without duplicate sockets.

### ADR-07: Authoritative Single-Editor Lock Actions & UI Parity
- **Decision:** Render exact action states matching specifications: `🔓 Edit` when unlocked, `🔒 Locked by Agent A` with `Edit Disabled` when locked by others, and `🔒 You are editing` with `Save` and `Close` buttons when held by current agent.
- **Rationale:** Provides unambiguous operational clarity for incident responders. Non-owners cannot click edit, and lock owners have direct, visible controls to either commit changes (`Save`) or surrender the lock (`Close`).

### ADR-08: Authoritative In-Memory Concurrency with Zero Polling
- **Decision:** Enforce that newly created tickets and lock state updates are broadcast over Socket.io `dashboard_room`, strictly forbidding `setInterval` polling loops.
- **Rationale:** Guaranteed sub-50ms synchronization across concurrent agent consoles while reducing server load and eliminating database polling overhead.
