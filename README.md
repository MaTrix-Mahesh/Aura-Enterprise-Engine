# Aura Enterprise Engine

Enterprise-Grade Inventory Management & Real-Time Analytics Engine engineered for high-throughput SKU catalogs (50,000+ SKUs).

## Overview

Aura Enterprise Engine is engineered from the ground up to solve the critical performance degradation that occurs when legacy inventory software attempts to manage tens of thousands of product records. By eliminating client-side DOM bloat, unbounded in-memory array scans, and un-indexed database queries, Aura delivers predictable sub-200ms latency, fluid data exploration, and real-time inventory risk intelligence.

## Core Features

- **50,000 SKU Inventory:** High-throughput data engine indexed for instant retrieval across 50,000+ products.
- **Server-Side Search:** High-performance regex query search with 500ms client debounce.
- **Server-Side Pagination:** Deterministic 50-item page slicing preventing browser DOM thrashing.
- **Multi-Factor Filtering:** Server-side filtering by category, stock tier, and min/max price bounds.
- **MongoDB Aggregation Analytics:** Real-time computation of valuation, stock health, and category distribution via a native `$facet` pipeline.
- **Streaming CSV Export:** Backpressure-managed cursor stream delivering filtered exports directly to browser download.
- **CRUD Mutations:** Validated product creation and updates with strict business constraints (`price >= cost`).
- **Production Docker Deployment:** Multi-container production orchestration for MongoDB, Express, and Nginx.
- **Sprint 19 RapidDispatch Live Ops:** Real-time ticketing engine with distributed WebSocket locking, collision rejection, and ghost disconnect resilience.
- **Sprint 20 VaultPay Financial Core:** Zero-trust financial billing portal with JWT auth, strict RBAC, IDOR prevention, authoritative Stripe Checkout, raw-body cryptographic webhook signature verification, PDF receipt generation, and Nodemailer delivery.

---

## VaultPay Financial Core (Sprint 20 Subsystem)

VaultPay is an isolated, enterprise-grade financial subsystem operating within the Aura Enterprise Engine.

### 1. Key Architectural Invariants
- **Zero-Trust Backend:** The database is authoritative. Amounts, currencies, client associations, and statuses are NEVER trusted from client-side payloads.
- **Strict Role-Based Access Control (RBAC):** `ADMIN` and `CLIENT` roles. Admin endpoints reject Client accounts with `HTTP 403 Forbidden`.
- **Inherent IDOR Prevention:** Endpoints enforce user-to-resource ownership. If `Client A` requests an invoice owned by `Client B`, the server returns `HTTP 403 Forbidden` (`FORBIDDEN_INVOICE_ACCESS`).
- **Cryptographic Webhook Signature Verification:** Stripe webhook endpoint (`POST /api/webhooks/stripe`) captures the raw request stream before JSON parsing and validates signatures using `stripe.webhooks.constructEvent()`.
- **Authoritative State Transitions:** Invoices transition to `PAID` exclusively via verified Stripe webhook events.
- **Payment Idempotency:** Duplicate webhook events are handled safely without duplicate state mutations, duplicate receipts, or redundant emails.
- **Dynamic PDF Receipts:** Generated in-memory using `PDFKit` with Nexus Corporate Services branding, metadata, line items, and a bold green `PAID` stamp.
- **Nodemailer Delivery:** Asynchronously dispatches formatted payment confirmations with the PDF receipt attached.

---

## Demo Accounts & Test Credentials

The backend automatically seeds or verifies the following demo accounts on startup:

| Role | Email | Password | Assigned Invoices | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@vaultpay.io` | `AdminPass123!` | All Invoices | Full revenue & client management |
| **CLIENT A** | `clienta@enterprise.com` | `ClientPass123!` | `INV-2026-001`, `INV-2026-003` | Corporate client persona A |
| **CLIENT B** | `clientb@enterprise.com` | `ClientPass123!` | `INV-2026-002` | Corporate client persona B (IDOR testing) |

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```ini
# Server Network Configuration
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aura_enterprise
CORS_ORIGIN=http://localhost:5173

# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Sprint 20 — VaultPay Financial Core
JWT_SECRET=vaultpay_super_secret_jwt_key_sprint20_min32chars!
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_placeholder_vaultpay_sprint20
STRIPE_WEBHOOK_SECRET=whsec_placeholder_vaultpay_sprint20
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_vaultpay_sprint20
CLIENT_URL=http://localhost:5173

# Email Delivery (Nodemailer SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=vaultpay@nexus.com
SMTP_PASS=mock_smtp_password
EMAIL_FROM=Nexus Corporate Services <billing@nexus.com>
```

---

## Local Development & Execution

### 1. Prerequisites
- Node.js (v20+)
- MongoDB (running on `localhost:27017`)
- Stripe CLI (optional, for live test webhooks)

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
# Backend listening at http://localhost:5000
# Seed data auto-verifies on startup
```

### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
# Frontend accessible at http://localhost:5173
```

### 4. Stripe Webhook Testing with Stripe CLI
For local live webhook forwarding:
```bash
# 1. Login to your Stripe account
stripe login

# 2. Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# 3. Copy the webhook signing secret from the output (whsec_...) and set STRIPE_WEBHOOK_SECRET in .env
```

**Stripe Test Card Details:**
- Card Number: `4242 4242 4242 4242`
- Expiration: Any valid future date (e.g., `12/28`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `90210`)

---

## Testing & Quality Gates

Run the comprehensive test suites:

```bash
# 1. Sprint 20 Security & Attack Test Suite
node scripts/testSprint20.js

# 2. Sprint 18 Inventory & Analytics Regression Suite
node scripts/testEndpoints.js

# 3. Sprint 19 Live Ops Socket Concurrency Test
node backend/test-socket.js

# 4. Sprint 19 Dual-Agent Concurrency & Collision Test
node backend/test-dual-concurrency.js

# 5. Frontend Production Build Check
npm --prefix frontend run build
```

---

## Security Attack Vectors Validated

1. **Attack 1 (Admin API Protection):** Client token accessing `GET /api/admin/clients` $\to$ `HTTP 403 Forbidden`.
2. **Attack 2 (Unauthorized Invoice Creation):** Client token submitting `POST /api/invoices` $\to$ `HTTP 403 Forbidden`.
3. **Attack 3 (IDOR Invoice Query):** Client A token requesting Client B's invoice `GET /api/invoices/:clientBInvoiceId` $\to$ `HTTP 403 Forbidden`.
4. **Attack 4 (IDOR Payment Initiation):** Client A token initiating payment for Client B's invoice $\to$ `HTTP 403 Forbidden`.
5. **Attack 5 (Webhook Signature Tampering):** Submitting Stripe webhook with invalid signature $\to$ `HTTP 400 Bad Request`.
6. **Double-Submission Protection:** UI disables "Pay Invoice" button immediately on click and displays loading state; backend rejects payment attempts on already-paid invoices.
7. **Legitimate Access:** Client A querying own invoice returns `HTTP 200 OK` and can download valid PDF receipt.


## Quick Start & Local Execution

### 1. Local Development Mode

#### Prerequisites
- Node.js (v20+)
- MongoDB (running on `localhost:27017`)

#### Backend Setup
```bash
cd backend
npm install
npm run dev
# Backend listening at http://localhost:5000
# API Health: http://localhost:5000/api/health
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend accessible at http://localhost:5173
```

#### Database Seeding & Verification
```bash
# Seed 50,000 realistic SKUs in 10 batches of 5,000
node scripts/seed.js

# Verify database indexes and query plans (IXSCAN)
node scripts/verifyQualityGate.js

# Run automated end-to-end API test suite
node scripts/testEndpoints.js
```

### 2. Local Docker Deployment

Start the complete stack (MongoDB, Express API, and Nginx Frontend) with Docker Compose:

```bash
# Build containers
docker compose build

# Start services in detached mode
docker compose up -d

# Verify running services
docker compose ps
```

#### Service URLs
- **Production Frontend:** `http://localhost:80`
- **Backend API Health Check:** `http://localhost:5000/api/health`
- **Inventory API:** `http://localhost:5000/api/inventory?page=1&limit=50`
- **Analytics API:** `http://localhost:5000/api/analytics`

## Verification & Acceptance
- **Automated API Test Suite:** `node scripts/testEndpoints.js` (100% PASSED across 9 verification gates).
- **Production Build:** `npm --prefix frontend run build` (0 warnings, 0 errors).
- **Security Audit:** Zero secrets committed; `.env` is ignored by Git; `.env.example` provides safe templates.

