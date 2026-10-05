import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECEIPTS_DIR = path.resolve(__dirname, '../../receipts');

// Ensure local receipts directory exists
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export const pdfService = {
  /**
   * Generates a professional PDF receipt buffer for a paid invoice.
   * Features Nexus Corporate Services branding, invoice details, item breakdown,
   * and a prominent green PAID stamp.
   *
   * @param {object} invoice
   * @returns {Promise<Buffer>}
   */
  async generateReceiptBuffer(invoice) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const isPaid = invoice.status === 'PAID' || invoice.paymentStatus === 'PAID';
        const primaryColor = '#0F766E'; // Deep Teal
        const textDark = '#0F172A';
        const textMuted = '#64748B';

        // 1. Header / Company Information
        doc
          .fillColor(primaryColor)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('Nexus Corporate Services', 50, 45);

        doc
          .fillColor(textMuted)
          .fontSize(9)
          .font('Helvetica')
          .text('Enterprise Operations & Financial Core', 50, 72)
          .text('100 Enterprise Way, Suite 800 • San Francisco, CA 94105', 50, 85)
          .text('billing@nexus.com • www.nexus-enterprise.io', 50, 98);

        // 2. Receipt / Invoice Metadata (Right Aligned)
        doc
          .fillColor(textDark)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(isPaid ? 'PAYMENT RECEIPT' : 'INVOICE', 350, 45, { align: 'right' });

        doc
          .fillColor(textMuted)
          .fontSize(9)
          .font('Helvetica')
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 68, { align: 'right' })
          .text(`Issue Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-US')}`, 350, 81, { align: 'right' })
          .text(`Payment Date: ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-US') : 'Pending'}`, 350, 94, { align: 'right' });

        if (invoice.stripePaymentIntentId || invoice.stripeSessionId) {
          const refId = (invoice.stripePaymentIntentId || invoice.stripeSessionId).slice(-16);
          doc.text(`Reference ID: ${refId}`, 350, 107, { align: 'right' });
        }

        // Horizontal Divider
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(1)
          .moveTo(50, 130)
          .lineTo(550, 130)
          .stroke();

        // 3. Bill To / Client Information
        doc
          .fillColor(primaryColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('BILLED TO:', 50, 145);

        doc
          .fillColor(textDark)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(invoice.clientInfo?.name || 'Valued Client', 50, 160);

        doc
          .fillColor(textMuted)
          .fontSize(9)
          .font('Helvetica')
          .text(invoice.clientInfo?.company || 'Corporate Client', 50, 175)
          .text(invoice.clientInfo?.email || '', 50, 188)
          .text(invoice.clientInfo?.address || 'Corporate Headquarters', 50, 201);

        // 4. Large PAID Stamp Badge (if marked PAID)
        if (isPaid) {
          const stampX = 380;
          const stampY = 150;
          const stampWidth = 160;
          const stampHeight = 55;

          doc
            .save()
            .roundedRect(stampX, stampY, stampWidth, stampHeight, 6)
            .fillAndStroke('#ECFDF5', '#059669')
            .fillColor('#047857')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('PAID', stampX, stampY + 10, { width: stampWidth, align: 'center' })
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#065F46')
            .text(`VERIFIED • ${invoice.paidAt ? new Date(invoice.paidAt).toISOString().split('T')[0] : 'CONFIRMED'}`, stampX, stampY + 34, { width: stampWidth, align: 'center' })
            .restore();
        }

        // 5. Line Items Table Header
        const tableTop = 235;
        doc
          .rect(50, tableTop, 500, 24)
          .fill('#F8FAFC');

        doc
          .fillColor('#334155')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('DESCRIPTION', 60, tableTop + 7)
          .text('QTY', 330, tableTop + 7, { width: 40, align: 'center' })
          .text('UNIT PRICE', 380, tableTop + 7, { width: 80, align: 'right' })
          .text('AMOUNT', 470, tableTop + 7, { width: 70, align: 'right' });

        // 6. Line Items Rendering
        let curY = tableTop + 30;
        const items = invoice.items && invoice.items.length > 0
          ? invoice.items
          : [{ description: invoice.description || 'Enterprise Operational Services', quantity: 1, unitPrice: invoice.amount, total: invoice.amount }];

        items.forEach((item, index) => {
          doc
            .fillColor(textDark)
            .fontSize(9)
            .font('Helvetica')
            .text(item.description, 60, curY, { width: 260 })
            .text(String(item.quantity || 1), 330, curY, { width: 40, align: 'center' })
            .text(`$${Number(item.unitPrice || 0).toFixed(2)}`, 380, curY, { width: 80, align: 'right' })
            .text(`$${Number(item.total || 0).toFixed(2)}`, 470, curY, { width: 70, align: 'right' });

          curY += 22;

          doc
            .strokeColor('#F1F5F9')
            .lineWidth(0.5)
            .moveTo(50, curY - 4)
            .lineTo(550, curY - 4)
            .stroke();
        });

        // 7. Totals Summary
        curY += 15;
        doc
          .strokeColor('#CBD5E1')
          .lineWidth(1)
          .moveTo(350, curY)
          .lineTo(550, curY)
          .stroke();

        curY += 10;
        doc
          .fillColor(textMuted)
          .fontSize(9)
          .font('Helvetica')
          .text('Subtotal:', 350, curY)
          .fillColor(textDark)
          .text(`$${Number(invoice.amount).toFixed(2)} ${invoice.currency || 'USD'}`, 450, curY, { align: 'right', width: 90 });

        curY += 18;
        doc
          .fillColor(textMuted)
          .text('Tax (0%):', 350, curY)
          .fillColor(textDark)
          .text('$0.00', 450, curY, { align: 'right', width: 90 });

        curY += 20;
        doc
          .rect(340, curY - 4, 210, 26)
          .fill('#F0FDFA');

        doc
          .fillColor(primaryColor)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('TOTAL PAID:', 350, curY + 4)
          .text(`$${Number(invoice.amount).toFixed(2)} ${invoice.currency || 'USD'}`, 450, curY + 4, { align: 'right', width: 90 });

        // 8. Footer Legal Note
        doc
          .fillColor('#94A3B8')
          .fontSize(8)
          .font('Helvetica')
          .text('Thank you for partnering with Nexus Corporate Services.', 50, 720, { align: 'center' })
          .text('This receipt was electronically generated upon cryptographic payment confirmation.', 50, 732, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Saves receipt PDF to disk and returns local path.
   *
   * @param {object} invoice
   * @param {Buffer} buffer
   */
  async saveReceiptToDisk(invoice, buffer) {
    const filename = `receipt_${invoice.invoiceNumber}_${Date.now()}.pdf`;
    const fullPath = path.join(RECEIPTS_DIR, filename);
    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  },
};

export default pdfService;
