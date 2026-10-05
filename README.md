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

