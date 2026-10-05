import { connectDB, disconnectDB } from '../backend/src/config/db.js';
import { User, UserRole } from '../backend/src/models/User.js';
import { Invoice, InvoiceStatus, PaymentStatus } from '../backend/src/models/Invoice.js';

export async function seedVaultPayDemoData() {
  console.log('[Seed VaultPay] Verifying VaultPay demo accounts and invoices...');

  // 1. Seed or find Admin
  let admin = await User.findOne({ email: 'admin@vaultpay.io' });
  if (!admin) {
    admin = new User({
      name: 'Alexander Vance (Chief Financial Officer)',
      email: 'admin@vaultpay.io',
      passwordHash: 'AdminPass123!', // Hashed via pre-save hook
      role: UserRole.ADMIN,
      company: 'Nexus Corporate Services',
      isActive: true,
    });
    await admin.save();
    console.log('[Seed VaultPay] ✓ Admin account created: admin@vaultpay.io / AdminPass123!');
  }

  // 2. Seed or find Client A
  let clientA = await User.findOne({ email: 'clienta@enterprise.com' });
  if (!clientA) {
    clientA = new User({
      name: 'Sarah Jenkins',
      email: 'clienta@enterprise.com',
      passwordHash: 'ClientPass123!',
      role: UserRole.CLIENT,
      company: 'Apex Global Logistics',
      isActive: true,
    });
    await clientA.save();
    console.log('[Seed VaultPay] ✓ Client A account created: clienta@enterprise.com / ClientPass123!');
  }

  // 3. Seed or find Client B
  let clientB = await User.findOne({ email: 'clientb@enterprise.com' });
  if (!clientB) {
    clientB = new User({
      name: 'Marcus Aurelius',
      email: 'clientb@enterprise.com',
      passwordHash: 'ClientPass123!',
      role: UserRole.CLIENT,
      company: 'Nordic Retail Group',
      isActive: true,
    });
    await clientB.save();
    console.log('[Seed VaultPay] ✓ Client B account created: clientb@enterprise.com / ClientPass123!');
  }

  // 4. Seed Invoices if none exist
  const invoiceCount = await Invoice.countDocuments();
  if (invoiceCount === 0) {
    console.log('[Seed VaultPay] Populating baseline invoices for IDOR & Payment demonstrations...');

    const now = new Date();
    const dueDate30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const pastDate7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const invoices = [
      // Client A — Outstanding Invoice
      {
        invoiceNumber: 'INV-2026-001',
        clientId: clientA._id,
        clientInfo: {
          name: clientA.name,
          email: clientA.email,
          company: clientA.company,
          address: '742 Evergreen Logistics Blvd, Sector 4',
        },
        description: 'Enterprise Cloud Infrastructure SLA & 24/7 Dedicated Monitoring',
        items: [
          {
            description: 'Kubernetes Multi-Region Cluster Hosting (Q1 2026)',
            quantity: 3,
            unitPrice: 1250.0,
            total: 3750.0,
          },
          {
            description: 'Dedicated Incident Response Ops SLA (24/7 Coverage)',
            quantity: 1,
            unitPrice: 1100.0,
            total: 1100.0,
          },
        ],
        amount: 4850.0,
        currency: 'USD',
        dueDate: dueDate30,
        status: InvoiceStatus.ISSUED,
        paymentStatus: PaymentStatus.UNPAID,
      },
      // Client B — Outstanding Invoice (Used to test Client A IDOR access rejection)
      {
        invoiceNumber: 'INV-2026-002',
        clientId: clientB._id,
        clientInfo: {
          name: clientB.name,
          email: clientB.email,
          company: clientB.company,
          address: 'Storgatan 14, 114 55 Stockholm, Sweden',
        },
        description: 'ERP Data Pipeline Synchronization & High-Throughput Analytics',
        items: [
          {
            description: 'SAP Real-Time Warehouse Connector Pipeline',
            quantity: 1,
            unitPrice: 5600.0,
            total: 5600.0,
          },
          {
            description: 'Database Query Optimization & Index Audit (50k SKUs)',
            quantity: 2,
            unitPrice: 1400.0,
            total: 2800.0,
          },
        ],
        amount: 8400.0,
        currency: 'USD',
        dueDate: dueDate30,
        status: InvoiceStatus.ISSUED,
        paymentStatus: PaymentStatus.UNPAID,
      },
      // Client A — Historical Paid Invoice with Receipt
      {
        invoiceNumber: 'INV-2026-003',
        clientId: clientA._id,
        clientInfo: {
          name: clientA.name,
          email: clientA.email,
          company: clientA.company,
          address: '742 Evergreen Logistics Blvd, Sector 4',
        },
        description: 'Security Review & Compliance Hardening Assessment',
        items: [
          {
            description: 'OWASP Zero-Trust Penetration Test & Audit',
            quantity: 1,
            unitPrice: 1500.0,
            total: 1500.0,
          },
        ],
        amount: 1500.0,
        currency: 'USD',
        dueDate: pastDate7,
        status: InvoiceStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: pastDate7,
        stripePaymentIntentId: 'pi_test_3N8x7kLq91M2zP4',
      },
    ];

    await Invoice.insertMany(invoices);
    console.log('[Seed VaultPay] ✓ 3 baseline invoices seeded: INV-2026-001 (Client A), INV-2026-002 (Client B), INV-2026-003 (Client A, PAID).');
  }

  return { admin, clientA, clientB };
}

// Direct execution support
if (process.argv[1]?.endsWith('seedVaultPay.js')) {
  (async () => {
    try {
      await connectDB();
      await seedVaultPayDemoData();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Fatal Error]', err);
      process.exit(1);
    }
  })();
}

export default seedVaultPayDemoData;
