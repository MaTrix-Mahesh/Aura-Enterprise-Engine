# Design Specifications — RapidDispatch Live Ops (Sprint 19)
**Application:** Aura Enterprise Engine / RapidDispatch Live Ops  
**Document Version:** 2.0.0 (Sprint 19 UI Extension)  
**Status:** Approved for Implementation  

---

## 1. Existing UI Foundation & Design System (Sprint 18)

Sprint 18 established a clean, high-density, professional enterprise design system inspired by leading cloud and ops consoles (Linear, Stripe, Datadog).

### Design Tokens (Preserved from `index.css`)
- **Primary Colors:** Teal/Cyan `#0D9488` (teal-600), `#14B8A6` (teal-500), subtle background `#F0FDFA`.
- **Neutral Palette:** Background canvas `#F9FAFB` (gray-50), Card surfaces `#FFFFFF`, Borders `#E5E7EB` (gray-200), Secondary border `#D1D5DB`.
- **Text Palette:** Heading/Primary `#111827` (gray-900), Body `#374151` (gray-700), Secondary `#6B7280` (gray-500), Muted `#9CA3AF`.
- **Status Accents:**
  - Success/Connected: `#10B981` (emerald-500), background `#ECFDF5`, border `#A7F3D0`
  - Warning/Pending: `#F59E0B` (amber-500), background `#FFFBEB`, border `#FDE68A`
  - Danger/Disconnected/Locked: `#EF4444` (red-500), background `#FEF2F2`, border `#FECACA`
  - Info/Active Lock: `#3B82F6` (blue-500), background `#EFF6FF`, border `#BFDBFE`
- **Typography:** `Inter`, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif. Tabular figures (`font-variant-numeric: tabular-nums`) for numeric data.

---

## 2. Sprint 19 UI Requirements & Specifications

Sprint 19 extends this existing visual language without introducing conflicting UI frameworks or breaking aesthetic consistency.

### 2.1 Connection Status UI

#### Active State (Connected)
```text
● Connected
```
- **Visuals:** 6px pulsating emerald dot (`#10B981`) paired with text `Connected` in 12px semibold.
- **Location:** Prominently integrated into the Topbar and Sidebar footer.

#### Inactive State (Disconnected)
```text
Connection Lost: Reconnecting...
```
- **Visuals:** Sticky top banner spanning the main content viewport:
  - Background: `#FEF2F2` (red-50)
  - Border: `1px solid #FECACA` (red-200)
  - Text: `#DC2626` (red-600) with a spinning `RefreshCw` or `WifiOff` icon.
  - Non-intrusive warning that edits are blocked while offline.

#### Restored State (Reconnected)
```text
Connection Restored
```
- **Visuals:** Temporary 3-second badge transition to emerald `#10B981` with checkmark icon before resuming the quiet `● Connected` indicator.

---

### 2.2 Ticket Concurrency & Lock States

Each ticket card / table row visually reflects its exact distributed lock state in real time:

#### State 1: Unlocked (Ready for Edit)
- **Badge/Action:**
  ```text
  [ 🔓 Edit ]
  ```
  - Button: Secondary button style (`btn-secondary` or subtle outline `btn-edit`).
  - Cursor: Pointer.
  - Hover: Subtle primary border and fill transition.
  - Action: Emits `lock_ticket` and opens the edit modal/drawer once confirmed by the server.

#### State 2: Locked by Another Agent (Collision Prevention)
- **Badge/Action:**
  ```text
  🔒 Locked by Agent A
  Edit Disabled
  ```
  - Badge: Amber/Red chip (`#FEF2F2`, text `#DC2626`, border `#FECACA`).
  - Button: Disabled (`opacity: 0.5`, `cursor: not-allowed`).
  - Tooltip: `"Agent A is actively editing this ticket. Editing is locked to prevent collisions."`

#### State 3: Locked by Current Agent (Active Session)
- **Badge/Action:**
  ```text
  🔒 You are editing
  [ Save ]   [ Close ]
  ```
  - Badge: Cyan/Teal active chip (`#F0FDFA`, text `#0F766E`, border `#99F6E4`).
  - Actions:
    - **Save:** Submits payload to REST endpoint `PUT /api/tickets/:id`, then releases the lock upon success.
    - **Close:** Cancels editing, emits `unlock_ticket`, and closes the modal/drawer.

---

### 2.3 Real-Time Ticket Creation Feed

When a new ticket is submitted by an agent or external trigger:
- Emitted via `ticket_created`.
- Instantly prepended to the live ticket list without full page refresh.
- New ticket card renders with a subtle entry highlight animation:
  `keyframes ticketHighlight { 0% { background-color: #ECFDF5; } 100% { background-color: #FFFFFF; } }` (duration 2s ease-out).

---

### 2.4 Agent Persona Switcher (Multi-Window Concurrency Testing)

To enable seamless dual-window concurrency testing and verification without requiring complex credential re-logins:
- Topbar includes an **Agent Persona Selector**:
  - `Agent A: Sarah Connor (Tier 2 Lead)`
  - `Agent B: John Reese (Incident Response)`
  - `Agent C: Harold Finch (SysOps Architect)`
- Selecting a persona updates the active client agent identity in localStorage and transparently passes the agent identity during the socket connection handshake.
- Window 1 can be set to Agent A; Window 2 can be set to Agent B, immediately validating the lock collision behavior.
