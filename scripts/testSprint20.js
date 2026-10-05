import { stripeService } from '../backend/src/services/stripeService.js';
import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import { User, UserRole } from '../backend/src/models/User.js';
import { Invoice, InvoiceStatus, PaymentStatus } from '../backend/src/models/Invoice.js';
import { seedVaultPayDemoData } from './seedVaultPay.js';
import { env } from '../backend/src/config/env.js';

const BASE_URL = `http://localhost:${env.PORT || 5000}`;
const stripe = stripeService.getStripeClient();

async function assert(condition, message) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

export async function runSprint20SecurityAudit() {
  console.log('========================================================================');
  console.log('       SPRINT 20 — VAULTPAY FINANCIAL CORE SECURITY & ATTACK SUITE      ');
  console.log('========================================================================\n');

  // 1. Ensure DB & Seeds are initialized
  await connectDB();
  await seedVaultPayDemoData();

  // Reset Invoice A to UNPAID for clean test idempotency
  await Invoice.updateOne(
    { invoiceNumber: 'INV-2026-001' },
    {
      $set: {
        status: InvoiceStatus.ISSUED,
        paymentStatus: PaymentStatus.UNPAID,
        paidAt: null,
        stripeSessionId: null,
        stripePaymentIntentId: null,
        receiptSent: false,
      },
    }
  );

  // Find seeded invoices
  const invoiceA = await Invoice.findOne({ invoiceNumber: 'INV-2026-001' }).lean();
  const invoiceB = await Invoice.findOne({ invoiceNumber: 'INV-2026-002' }).lean();

  assert(invoiceA, 'Invoice A (INV-2026-001) must exist');
  assert(invoiceB, 'Invoice B (INV-2026-002) must exist');

  console.log(`[Setup] Target Invoice A: ${invoiceA.invoiceNumber} (Client A: ${invoiceA.clientId})`);
  console.log(`[Setup] Target Invoice B: ${invoiceB.invoiceNumber} (Client B: ${invoiceB.clientId})\n`);

  // ========================================================================
  // TEST SUITE 1 — AUTHENTICATION & JWT VERIFICATION
  // ========================================================================
  console.log('--- TEST SUITE 1: AUTHENTICATION & JWT VERIFICATION ---');

  // 1.1 Valid Admin Login
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vaultpay.io', password: 'AdminPass123!' }),
  }).then((r) => r.json());

  assert(adminLoginRes.success === true, 'Admin login should succeed');
  assert(adminLoginRes.data.user.role === 'ADMIN', 'Admin user role must be ADMIN');
  assert(adminLoginRes.data.token, 'Admin login must return JWT');
  const adminToken = adminLoginRes.data.token;
  console.log('✓ 1.1 Admin login succeeded and returned valid JWT.');

  // 1.2 Valid Client A Login
  const clientALoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'clienta@enterprise.com', password: 'ClientPass123!' }),
  }).then((r) => r.json());

  assert(clientALoginRes.success === true, 'Client A login should succeed');
  assert(clientALoginRes.data.user.role === 'CLIENT', 'Client A user role must be CLIENT');
  const clientAToken = clientALoginRes.data.token;
  console.log('✓ 1.2 Client A login succeeded and returned valid JWT.');

  // 1.3 Valid Client B Login
  const clientBLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'clientb@enterprise.com', password: 'ClientPass123!' }),
  }).then((r) => r.json());

  assert(clientBLoginRes.success === true, 'Client B login should succeed');
  const clientBToken = clientBLoginRes.data.token;
  console.log('✓ 1.3 Client B login succeeded and returned valid JWT.');

  // 1.4 Invalid Password Rejection (401)
  const invalidPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vaultpay.io', password: 'WrongPassword999' }),
  });
  const invalidPassJson = await invalidPassRes.json();
  assert(invalidPassRes.status === 401, 'Invalid password must return 401 Unauthorized');
  assert(invalidPassJson.errorCode === 'INVALID_CREDENTIALS', 'Error code must be INVALID_CREDENTIALS');
  console.log('✓ 1.4 Invalid credentials properly rejected with HTTP 401.');

  // 1.5 Missing Token on Protected Route (401)
  const missingTokenRes = await fetch(`${BASE_URL}/api/invoices`);
  assert(missingTokenRes.status === 401, 'Missing token must return 401 Unauthorized');
  console.log('✓ 1.5 Missing token on protected endpoint returned HTTP 401.');

  // 1.6 Malformed / Bogus Token on Protected Route (401)
  const bogusTokenRes = await fetch(`${BASE_URL}/api/invoices`, {
    headers: { Authorization: 'Bearer totally_bogus_token_value' },
  });
  assert(bogusTokenRes.status === 401, 'Bogus token must return 401 Unauthorized');
  console.log('✓ 1.6 Bogus/invalid token returned HTTP 401.\n');

  // ========================================================================
  // TEST SUITE 2 — SECURITY ATTACKS & RBAC ENFORCEMENT
  // ========================================================================
  console.log('--- TEST SUITE 2: MANDATORY SECURITY ATTACK TESTING ---');

  // Attack 1: Client attempts to access Admin Client Management API
  console.log('Executing Attack 1: Client attempts GET /api/admin/clients...');
  const attack1Res = await fetch(`${BASE_URL}/api/admin/clients`, {
    headers: { Authorization: `Bearer ${clientAToken}` },
  });
  const attack1Json = await attack1Res.json();
  assert(attack1Res.status === 403, `Attack 1 expected HTTP 403, got ${attack1Res.status}`);
  assert(attack1Json.errorCode === 'FORBIDDEN_INSUFFICIENT_PERMISSIONS', 'Expected FORBIDDEN_INSUFFICIENT_PERMISSIONS');
  console.log('✓ [SECURITY ATTACK 1 PASSED]: Client rejected with HTTP 403 Forbidden on Admin API.');

  // Attack 2: Client attempts to create an invoice (Admin-only API)
  console.log('Executing Attack 2: Client attempts POST /api/invoices...');
  const attack2Res = await fetch(`${BASE_URL}/api/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientAToken}`,
    },
    body: JSON.stringify({
      clientId: invoiceA.clientId.toString(),
      description: 'Unauthorized Invoice Creation Attempt',
      items: [{ description: 'Malicious Service', quantity: 1, unitPrice: 9999 }],
    }),
  });
  assert(attack2Res.status === 403, `Attack 2 expected HTTP 403, got ${attack2Res.status}`);
  console.log('✓ [SECURITY ATTACK 2 PASSED]: Client rejected with HTTP 403 Forbidden on invoice creation.');

  // Attack 3: Critical IDOR Test — Client A attempts to access Client B's invoice
  console.log(`Executing Attack 3 (IDOR): Client A attempts GET /api/invoices/${invoiceB._id}...`);
  const attack3Res = await fetch(`${BASE_URL}/api/invoices/${invoiceB._id}`, {
    headers: { Authorization: `Bearer ${clientAToken}` },
  });
  const attack3Json = await attack3Res.json();
  assert(attack3Res.status === 403, `Attack 3 (IDOR) expected HTTP 403, got ${attack3Res.status}`);
  assert(attack3Json.errorCode === 'FORBIDDEN_INVOICE_ACCESS', 'Expected FORBIDDEN_INVOICE_ACCESS error code');
  console.log('✓ [SECURITY ATTACK 3 PASSED]: IDOR attempt blocked! Client A received HTTP 403 Forbidden.');

  // Attack 3b: Legitimate Ownership Verification — Client A CAN access Invoice A
  const legitAccessRes = await fetch(`${BASE_URL}/api/invoices/${invoiceA._id}`, {
    headers: { Authorization: `Bearer ${clientAToken}` },
  });
  assert(legitAccessRes.status === 200, 'Client A should successfully access their own invoice');
  console.log('✓ Ownership verified: Client A successfully accesses own invoice (HTTP 200).');

  // Attack 4: Client A attempts to pay Client B's invoice
  console.log(`Executing Attack 4: Client A attempts payment for Client B invoice ${invoiceB._id}...`);
  const attack4Res = await fetch(`${BASE_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientAToken}`,
    },
    body: JSON.stringify({ invoiceId: invoiceB._id.toString() }),
  });
  assert(attack4Res.status === 403, `Attack 4 expected HTTP 403, got ${attack4Res.status}`);
  console.log('✓ [SECURITY ATTACK 4 PASSED]: Client A cannot initiate checkout for Client B invoice (HTTP 403).');

  // Attack 5: Tampered/Bogus Webhook Signature
  console.log('Executing Attack 5: Submitting Stripe webhook with invalid signature...');
  const attack5Res = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 't=1700000000,v1=fake_cryptographic_signature_hash',
    },
    body: JSON.stringify({ type: 'checkout.session.completed' }),
  });
  assert(attack5Res.status === 400, `Attack 5 expected HTTP 400, got ${attack5Res.status}`);
  console.log('✓ [SECURITY ATTACK 5 PASSED]: Tampered webhook signature rejected with HTTP 400.\n');

  // ========================================================================
  // TEST SUITE 3 — CHECKOUT, WEBHOOK VERIFICATION & PAYMENT IDEMPOTENCY
  // ========================================================================
  console.log('--- TEST SUITE 3: STRIPE CHECKOUT & AUTHORITATIVE WEBHOOK LIFECYCLE ---');

  // 3.1 Create Stripe Checkout Session for Invoice A
  const sessionRes = await fetch(`${BASE_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientAToken}`,
    },
    body: JSON.stringify({ invoiceId: invoiceA._id.toString() }),
  }).then((r) => r.json());

  assert(sessionRes.success === true, 'Checkout session creation should succeed');
  assert(sessionRes.data.sessionId, 'Must return session ID');
  const sessionId = sessionRes.data.sessionId;
  console.log(`✓ 3.1 Stripe Checkout session created successfully: ${sessionId}`);

  // 3.2 Authoritative Webhook Event Signature & Dispatch
  const webhookPayload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        client_reference_id: invoiceA._id.toString(),
        payment_intent: `pi_test_${Date.now()}`,
        metadata: {
          invoiceId: invoiceA._id.toString(),
          invoiceNumber: invoiceA.invoiceNumber,
        },
      },
    },
  });

  const validSignature = stripe.webhooks.generateTestHeaderString({
    payload: webhookPayload,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });

  const webhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': validSignature,
    },
    body: webhookPayload,
  });

  const webhookJson = await webhookRes.json();
  assert(webhookRes.status === 200, `Valid webhook expected HTTP 200, got ${webhookRes.status}`);
  assert(webhookJson.received === true, 'Webhook must confirm receipt');
  console.log('✓ 3.2 Valid Stripe webhook processed with cryptographic signature.');

  // 3.3 Verify Database State: Invoice is now PAID
  const updatedInvoiceA = await Invoice.findById(invoiceA._id).lean();
  assert(updatedInvoiceA.status === InvoiceStatus.PAID, 'Invoice status must be PAID');
  assert(updatedInvoiceA.paymentStatus === PaymentStatus.PAID, 'Payment status must be PAID');
  assert(updatedInvoiceA.paidAt !== null, 'paidAt timestamp must be recorded');
  console.log(`✓ 3.3 Database verified: Invoice ${invoiceA.invoiceNumber} transitioned to PAID.`);

  // 3.4 Webhook Idempotency Check: Post duplicate webhook
  const duplicateWebhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': validSignature,
    },
    body: webhookPayload,
  }).then((r) => r.json());

  assert(duplicateWebhookRes.alreadyProcessed === true, 'Duplicate webhook must be recognized as alreadyProcessed');
  console.log('✓ 3.4 Webhook idempotency verified: Duplicate event handled safely without duplicate actions.\n');

  // ========================================================================
  // TEST SUITE 4 — PDF RECEIPT GENERATION & AUTHORIZED DOWNLOAD
  // ========================================================================
  console.log('--- TEST SUITE 4: PDF RECEIPT GENERATION & DOWNLOAD ---');

  // 4.1 Client A downloads PDF for Invoice A
  const pdfRes = await fetch(`${BASE_URL}/api/invoices/${invoiceA._id}/pdf`, {
    headers: { Authorization: `Bearer ${clientAToken}` },
  });

  assert(pdfRes.status === 200, 'PDF download should succeed for invoice owner');
  assert(pdfRes.headers.get('content-type') === 'application/pdf', 'Content-Type must be application/pdf');

  const pdfArrayBuffer = await pdfRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  assert(pdfBuffer.length > 500, 'Generated PDF must be non-empty');
  assert(pdfBuffer.slice(0, 4).toString() === '%PDF', 'PDF buffer must start with %PDF magic header');
  console.log(`✓ 4.1 PDF downloaded successfully (${pdfBuffer.length} bytes, %PDF valid header).`);

  // 4.2 Client B attempts to download Client A's PDF (IDOR check on PDF route)
  const pdfIdorRes = await fetch(`${BASE_URL}/api/invoices/${invoiceA._id}/pdf`, {
    headers: { Authorization: `Bearer ${clientBToken}` },
  });
  assert(pdfIdorRes.status === 403, 'Client B downloading Client A PDF must return 403 Forbidden');
  console.log('✓ 4.2 PDF IDOR protection verified: Client B blocked from downloading Client A PDF (HTTP 403).\n');

  // ========================================================================
  // TEST SUITE 5 — FINANCIAL KPIS & CLIENT LIST ISOLATION
  // ========================================================================
  console.log('--- TEST SUITE 5: FINANCIAL KPIS & TENANT ISOLATION ---');

  // 5.1 Admin Stats
  const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(adminStatsRes.success === true, 'Admin stats should succeed');
  assert(typeof adminStatsRes.data.totalRevenue === 'number', 'totalRevenue must be a number');
  assert(adminStatsRes.data.paidInvoices >= 1, 'At least 1 paid invoice recorded');
  console.log('✓ 5.1 Admin financial stats verified:', adminStatsRes.data);

  // 5.2 Client A Invoices List (Tenant Isolation)
  const clientAInvoicesRes = await fetch(`${BASE_URL}/api/client/invoices`, {
    headers: { Authorization: `Bearer ${clientAToken}` },
  }).then((r) => r.json());

  assert(clientAInvoicesRes.success === true, 'Client invoice listing should succeed');
  const allBelongToA = clientAInvoicesRes.data.every((inv) => inv.clientId.toString() === invoiceA.clientId.toString());
  assert(allBelongToA, 'All returned invoices must belong exclusively to Client A');
  console.log(`✓ 5.2 Tenant isolation verified: Client A received exactly ${clientAInvoicesRes.data.length} invoices, all owned by Client A.`);

  console.log('\n========================================================================');
  console.log('  ALL SPRINT 20 TESTS & MANDATORY ATTACK VECTORS PASSED SUCCESSFULLY!   ');
  console.log('========================================================================\n');

  await disconnectDB();
}

// Direct execution support
if (process.argv[1]?.endsWith('testSprint20.js')) {
  runSprint20SecurityAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ SPRINT 20 TEST FAILURE:', err);
      process.exit(1);
    });
}

export default runSprint20SecurityAudit;
